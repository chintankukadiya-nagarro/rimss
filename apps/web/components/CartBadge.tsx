"use client";

import { useGetCartQuery } from "@/lib/cart-api";

export function CartBadge(): JSX.Element | null {
  const { data } = useGetCartQuery();
  const n = data?.itemCount ?? 0;
  if (n <= 0) return null;
  return (
    <span className="ml-1 rounded bg-stone-200 px-1.5 py-0.5 text-xs font-medium text-stone-800">
      {n}
    </span>
  );
}
