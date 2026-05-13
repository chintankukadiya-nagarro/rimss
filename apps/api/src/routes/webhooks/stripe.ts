import type { Request, Response } from "express";
import Stripe from "stripe";

import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "../../config";
import { markOrderPaidFromWebhook } from "../../orders/orderPaid";

let stripeSdk: Stripe | null = null;
function stripe(): Stripe {
  if (!stripeSdk) {
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY missing");
    }
    stripeSdk = new Stripe(STRIPE_SECRET_KEY);
  }
  return stripeSdk;
}

export async function stripeWebhookHandler(
  req: Request,
  res: Response,
): Promise<void> {
  if (!STRIPE_WEBHOOK_SECRET) {
    res.status(503).send("Stripe webhook secret not configured");
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (typeof sig !== "string") {
    res.status(400).send("Missing stripe-signature");
    return;
  }

  const buf = req.body;
  if (!Buffer.isBuffer(buf)) {
    res.status(400).send("Expected raw body");
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET);
  } catch {
    res.status(400).send("Invalid signature");
    return;
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const orderId = pi.metadata?.orderId;
    if (typeof orderId === "string" && orderId.length > 0) {
      await markOrderPaidFromWebhook(orderId, event.id);
    }
  }

  res.json({ received: true });
}
