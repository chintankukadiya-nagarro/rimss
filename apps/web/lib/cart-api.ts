import type {
  CartLineItemDto,
  CartPatchBody,
  CartPutBody,
  CartResponse,
} from "@rimss/shared-types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type PutCartArg = CartPutBody & {
  newProductSnapshots?: Record<
    string,
    Pick<CartLineItemDto, "slug" | "name" | "unitPriceCents" | "imageUrl">
  >;
};

export type PatchCartArg = CartPatchBody & {
  optimisticLine?: CartLineItemDto;
};

function recomputeTotals(draft: CartResponse): void {
  draft.itemCount = draft.lines.reduce((s, l) => s + l.quantity, 0);
  draft.lineCount = draft.lines.length;
  draft.subtotalCents = draft.lines.reduce((s, l) => s + l.lineTotalCents, 0);
}

export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    credentials: "include",
    prepareHeaders(h) {
      h.set("Accept", "application/json");
      return h;
    },
  }),
  tagTypes: ["Cart"],
  endpoints: (build) => ({
    getCart: build.query<CartResponse, void>({
      query: () => "/cart",
      providesTags: ["Cart"],
    }),

    putCart: build.mutation<CartResponse, PutCartArg>({
      query: ({ newProductSnapshots: _s, ...body }) => ({
        url: "/cart",
        method: "PUT",
        body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        const prev = cartApi.endpoints.getCart.select(undefined)(getState())?.data;
        const patchResult = dispatch(
          cartApi.util.updateQueryData("getCart", undefined, (draft) => {
            const linesIn = arg.lines;
            draft.version = arg.version + 1;
            draft.lines = linesIn.map((line) => {
              const existing = prev?.lines.find((l) => l.productId === line.productId);
              if (existing) {
                const lineTotalCents = existing.unitPriceCents * line.quantity;
                return {
                  ...existing,
                  quantity: line.quantity,
                  lineTotalCents,
                };
              }
              const snap = arg.newProductSnapshots?.[line.productId];
              if (snap) {
                const lineTotalCents = snap.unitPriceCents * line.quantity;
                return {
                  lineId: `pending-${line.productId}`,
                  productId: line.productId,
                  slug: snap.slug,
                  name: snap.name,
                  quantity: line.quantity,
                  unitPriceCents: snap.unitPriceCents,
                  lineTotalCents,
                  imageUrl: snap.imageUrl ?? null,
                };
              }
              return {
                lineId: `pending-${line.productId}`,
                productId: line.productId,
                slug: "?",
                name: "…",
                quantity: line.quantity,
                unitPriceCents: 0,
                lineTotalCents: 0,
                imageUrl: null,
              };
            });
            recomputeTotals(draft);
          }),
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(cartApi.util.updateQueryData("getCart", undefined, () => data));
        } catch {
          patchResult.undo();
        }
      },
    }),

    patchCart: build.mutation<CartResponse, PatchCartArg>({
      query: ({ optimisticLine: _o, ...body }) => ({
        url: "/cart",
        method: "PATCH",
        body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          cartApi.util.updateQueryData("getCart", undefined, (draft) => {
            const { optimisticLine, ...body } = arg;
            if (body.op === "add") {
              const addQ = body.quantity ?? 1;
              const idx = draft.lines.findIndex((l) => l.productId === body.productId);
              if (idx >= 0) {
                const nextQ = draft.lines[idx].quantity + addQ;
                draft.lines[idx].quantity = nextQ;
                draft.lines[idx].lineTotalCents =
                  draft.lines[idx].unitPriceCents * draft.lines[idx].quantity;
              } else if (optimisticLine) {
                const q = addQ;
                draft.lines.push({
                  ...optimisticLine,
                  quantity: q,
                  lineTotalCents: optimisticLine.unitPriceCents * q,
                });
              }
            } else if (body.op === "set" && typeof body.quantity === "number") {
              const idx = draft.lines.findIndex((l) => l.productId === body.productId);
              if (idx >= 0) {
                draft.lines[idx].quantity = body.quantity;
                draft.lines[idx].lineTotalCents =
                  draft.lines[idx].unitPriceCents * body.quantity;
              }
            } else if (body.op === "remove") {
              draft.lines = draft.lines.filter((l) => l.productId !== body.productId);
            }
            draft.version = body.version + 1;
            recomputeTotals(draft);
          }),
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(cartApi.util.updateQueryData("getCart", undefined, () => data));
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const { useGetCartQuery, usePutCartMutation, usePatchCartMutation } = cartApi;
