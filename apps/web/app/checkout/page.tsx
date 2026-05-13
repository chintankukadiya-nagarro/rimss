"use client";

import type { CheckoutSessionResponse, OrderSummaryDto } from "@rimss/shared-types";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { centsToUsd } from "@/lib/catalog-api";
import { useGetCartQuery } from "@/lib/cart-api";

function StripePayForm({ orderId }: { orderId: string }): JSX.Element {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setMsg(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/${encodeURIComponent(orderId)}`,
      },
    });
    setBusy(false);
    if (error) {
      setMsg(error.message ?? "Payment failed");
      return;
    }
    router.push(`/order/${encodeURIComponent(orderId)}`);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <PaymentElement />
      {msg ? <p className="text-sm text-red-700">{msg}</p> : null}
      <button
        type="submit"
        disabled={!stripe || busy}
        className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
      >
        {busy ? "Processing…" : "Pay with card"}
      </button>
    </form>
  );
}

export default function CheckoutPage(): JSX.Element {
  const { data: cart, isLoading } = useGetCartQuery();
  const router = useRouter();
  const [session, setSession] = useState<CheckoutSessionResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const stripePromise = useMemo(() => {
    if (session?.paymentProvider === "stripe" && session.publishableKey) {
      return loadStripe(session.publishableKey);
    }
    return null;
  }, [session]);

  async function startCheckout(): Promise<void> {
    if (!cart || cart.lines.length === 0) return;
    setStarting(true);
    setErr(null);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ version: cart.version }),
      });
      if (res.status === 409) {
        setErr("Your cart changed. Refresh and try again.");
        setStarting(false);
        return;
      }
      if (!res.ok) {
        const t = await res.text();
        setErr(t || `Checkout failed (${res.status})`);
        setStarting(false);
        return;
      }
      const data = (await res.json()) as CheckoutSessionResponse;
      setSession(data);
    } catch {
      setErr("Network error starting checkout.");
    }
    setStarting(false);
  }

  async function completeMockPay(): Promise<void> {
    if (!session) return;
    setStarting(true);
    setErr(null);
    try {
      const res = await fetch("/api/checkout/mock/complete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: session.orderId,
          clientSecret: session.clientSecret,
        }),
      });
      if (!res.ok) {
        setErr(await res.text());
        setStarting(false);
        return;
      }
      const order = (await res.json()) as OrderSummaryDto;
      router.push(`/order/${encodeURIComponent(order.id)}`);
    } catch {
      setErr("Could not complete mock payment.");
    }
    setStarting(false);
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <p className="text-sm text-stone-600">Loading cart…</p>
      </main>
    );
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <main className="mx-auto max-w-lg space-y-4 px-4 py-10">
        <h1 className="text-xl font-semibold">Checkout</h1>
        <p className="text-sm text-stone-600">Your cart is empty.</p>
        <Link href="/cart" className="text-sm font-medium text-stone-900 underline">
          Back to cart
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <nav className="text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-800">
          Home
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <Link href="/cart" className="hover:text-stone-800">
          Cart
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <span className="text-stone-800">Checkout</span>
      </nav>

      <h1 className="text-2xl font-semibold text-stone-900">Checkout</h1>

      {!session ? (
        <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-4">
          <ul className="divide-y divide-stone-100 text-sm">
            {cart.lines.map((line) => (
              <li key={line.lineId} className="flex justify-between py-2">
                <span>
                  {line.name} × {line.quantity}
                </span>
                <span>{centsToUsd(line.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <p className="text-right font-semibold text-stone-900">
            Total {centsToUsd(cart.subtotalCents)}
          </p>
          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={starting}
            className="w-full rounded-md bg-stone-900 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {starting ? "Starting…" : "Continue to payment"}
          </button>
        </section>
      ) : null}

      {session?.paymentProvider === "mock" ? (
        <section className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-600">
            Mock payment (no Stripe). Order <code className="text-xs">{session.orderId}</code>
          </p>
          <button
            type="button"
            onClick={() => void completeMockPay()}
            disabled={starting}
            className="w-full rounded-md bg-emerald-800 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
          >
            {starting ? "Completing…" : "Complete payment (mock)"}
          </button>
        </section>
      ) : null}

      {session?.paymentProvider === "stripe" && session.publishableKey && stripePromise ? (
        <section className="rounded-lg border border-stone-200 bg-white p-4">
          <Elements stripe={stripePromise} options={{ clientSecret: session.clientSecret }}>
            <StripePayForm orderId={session.orderId} />
          </Elements>
        </section>
      ) : null}

      {session?.paymentProvider === "stripe" && !session.publishableKey ? (
        <p className="text-sm text-red-800">
          Stripe publishable key missing — set STRIPE_PUBLISHABLE_KEY on the API (and rebuild) or
          use PAYMENT_PROVIDER=mock.
        </p>
      ) : null}

      {err ? <p className="text-sm text-red-700">{err}</p> : null}
    </main>
  );
}
