import Stripe from "stripe";

import { PAYMENT_PROVIDER, STRIPE_SECRET_KEY } from "../config";
import { MockPaymentAdaptor } from "./mockAdaptor";
import { StripePaymentAdaptor } from "./stripeAdaptor";
import type { IPaymentAdaptor } from "./types";

let cached: IPaymentAdaptor | null = null;

export function getPaymentAdaptor(): IPaymentAdaptor {
  if (cached) return cached;
  if (PAYMENT_PROVIDER === "stripe") {
    if (!STRIPE_SECRET_KEY) {
      throw new Error("PAYMENT_PROVIDER=stripe requires STRIPE_SECRET_KEY");
    }
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    cached = new StripePaymentAdaptor(stripe);
  } else {
    cached = new MockPaymentAdaptor();
  }
  return cached;
}
