"use client";

import Link from "next/link";

import {
  useGetCartQuery,
  usePutCartMutation,
} from "@/lib/cart-api";
import { centsToUsd } from "@/lib/catalog-api";

export default function CartPage(): JSX.Element {
  const { data, isLoading, isError, error, refetch } = useGetCartQuery();
  const [putCart, { isLoading: putting }] = usePutCartMutation();

  const busy = putting;

  const setQty = async (productId: string, quantity: number): Promise<void> => {
    if (!data || quantity < 1) return;
    const lines = data.lines
      .filter((l) => l.productId !== productId)
      .map((l) => ({ productId: l.productId, quantity: l.quantity }));
    lines.push({ productId, quantity });
    try {
      await putCart({ version: data.version, lines }).unwrap();
    } catch (e: unknown) {
      await refetch();
    }
  };

  const removeLine = async (productId: string): Promise<void> => {
    if (!data) return;
    const lines = data.lines
      .filter((l) => l.productId !== productId)
      .map((l) => ({ productId: l.productId, quantity: l.quantity }));
    try {
      await putCart({ version: data.version, lines }).unwrap();
    } catch {
      await refetch();
    }
  };

  if (isLoading && !data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-stone-600">Loading cart…</p>
      </main>
    );
  }

  if (isError && !data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-red-800">
          {error && typeof error === "object" && "status" in error
            ? `Cart unavailable (${String((error as { status?: unknown }).status)})`
            : "Cart unavailable"}
        </p>
        <button
          type="button"
          className="mt-2 text-sm underline"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </main>
    );
  }

  const cart = data!;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <nav className="text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-800">
          Home
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <span className="text-stone-800">Cart</span>
      </nav>

      <h1 className="text-2xl font-semibold text-stone-900">Your cart</h1>
      <p className="text-sm text-stone-600">Items and totals are kept in sync with the server.</p>

      {cart.lines.length === 0 ? (
        <p className="text-sm text-stone-600">
          Your cart is empty.{" "}
          <Link href="/products" className="font-medium text-stone-800 underline">
            Browse the catalogue
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {cart.lines.map((line) => (
            <li
              key={line.lineId}
              className="flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${encodeURIComponent(line.slug)}`}
                  className="font-medium text-stone-900 hover:underline"
                >
                  {line.name}
                </Link>
                <p className="text-xs text-stone-500">
                  {centsToUsd(line.unitPriceCents)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`qty-${line.lineId}`}>
                  Quantity
                </label>
                <input
                  id={`qty-${line.lineId}`}
                  type="number"
                  min={1}
                  max={99}
                  className="w-16 rounded border border-stone-300 px-2 py-1 text-sm"
                  defaultValue={line.quantity}
                  disabled={busy}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isInteger(v) && v >= 1) {
                      void setQty(line.productId, v);
                    }
                  }}
                />
                <button
                  type="button"
                  className="text-sm text-red-700 hover:underline"
                  disabled={busy}
                  onClick={() => void removeLine(line.productId)}
                >
                  Remove
                </button>
              </div>
              <div className="w-full text-right text-sm font-medium text-stone-800 sm:w-auto">
                {centsToUsd(line.lineTotalCents)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {cart.lines.length > 0 ? (
        <div className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-stone-900">
              Subtotal {centsToUsd(cart.subtotalCents)}
            </p>
            <p className="text-xs text-stone-500">{cart.itemCount} items</p>
          </div>
          <Link
            href="/checkout"
            className="inline-flex justify-center rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            Checkout
          </Link>
        </div>
      ) : null}
    </main>
  );
}
