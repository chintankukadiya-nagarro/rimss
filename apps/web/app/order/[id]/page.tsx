"use client";

import type { OrderSummaryDto } from "@rimss/shared-types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { centsToUsd } from "@/lib/catalog-api";

export default function OrderPage(): JSX.Element {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [order, setOrder] = useState<OrderSummaryDto | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load(): Promise<void> {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (cancelled) return;
      if (!res.ok) {
        setErr(res.status === 403 ? "You can only view orders from this browser session." : await res.text());
        setLoading(false);
        return;
      }
      const data = (await res.json()) as OrderSummaryDto;
      setOrder(data);
      setLoading(false);
    }

    void load();

    const t = setInterval(() => {
      void load();
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [id]);

  if (!id) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <p className="text-sm text-stone-600">Invalid order.</p>
      </main>
    );
  }

  if (loading && !order) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <p className="text-sm text-stone-600">Loading order…</p>
      </main>
    );
  }

  if (err && !order) {
    return (
      <main className="mx-auto max-w-lg space-y-3 px-4 py-10">
        <p className="text-sm text-red-800">{err}</p>
        <Link href="/products" className="text-sm underline">
          Continue shopping
        </Link>
      </main>
    );
  }

  const o = order!;

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <nav className="text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-800">
          Home
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <span className="text-stone-800">Order</span>
      </nav>

      <h1 className="text-2xl font-semibold text-stone-900">Order</h1>
      <p className="font-mono text-sm text-stone-600">{o.id}</p>

      {o.status === "pending_payment" ? (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Payment processing — this page refreshes automatically for Stripe. If you used the mock
          flow, click Complete payment on checkout.
        </p>
      ) : null}

      <p className="text-sm">
        Status:{" "}
        <strong className="capitalize text-stone-900">
          {o.status.replace(/_/g, " ")}
        </strong>
        {o.paidAt ? (
          <>
            {" "}
            · Paid {new Date(o.paidAt).toLocaleString()}
          </>
        ) : null}
      </p>

      <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        {o.lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-4 p-3 text-sm">
            <span>
              {line.name} × {line.quantity}
            </span>
            <span>{centsToUsd(line.lineTotalCents)}</span>
          </li>
        ))}
      </ul>

      <p className="text-right text-lg font-semibold text-stone-900">
        Total {centsToUsd(o.subtotalCents)} {o.currency.toUpperCase()}
      </p>

      <Link href="/products" className="inline-block text-sm font-medium text-stone-800 underline">
        Continue shopping
      </Link>
    </main>
  );
}
