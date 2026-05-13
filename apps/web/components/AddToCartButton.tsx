"use client";

import type { ProductJson } from "@/lib/catalog-api";
import { useGetCartQuery, usePatchCartMutation } from "@/lib/cart-api";
import { centsToUsd } from "@/lib/catalog-api";

interface Props {
  product: ProductJson;
}

export function AddToCartButton({ product }: Props): JSX.Element {
  const { data: cart } = useGetCartQuery();
  const [patchCart, { isLoading, isError, error }] = usePatchCartMutation();

  const handleClick = (): void => {
    const version = cart?.version ?? 0;
    void patchCart({
      version,
      op: "add",
      productId: product.id,
      quantity: 1,
      optimisticLine: {
        lineId: `opt-${product.id}`,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        quantity: 1,
        unitPriceCents: product.priceCents,
        lineTotalCents: product.priceCents,
        imageUrl: product.imageUrl,
      },
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
      >
        {isLoading ? "Adding…" : "Add to cart"}
      </button>
      <p className="text-xs text-stone-500">
        Unit price {centsToUsd(product.priceCents)} · server-authoritative cart
      </p>
      {isError ? (
        <p className="text-xs text-red-700">
          {typeof error === "object" && error !== null && "data" in error
            ? JSON.stringify((error as { data?: unknown }).data)
            : "Could not update cart"}
        </p>
      ) : null}
    </div>
  );
}
