import Stripe from "stripe";

import type { CreatePaymentInput, CreatePaymentResult, IPaymentAdaptor } from "./types";

export class StripePaymentAdaptor implements IPaymentAdaptor {
  constructor(
    private readonly stripe: Stripe,
    private readonly metadataPrefix = "rimss",
  ) {}

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: input.amountCents,
      currency: input.currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        [`${this.metadataPrefix}_order_id`]: input.orderId,
        orderId: input.orderId,
      },
    });
    const clientSecret = intent.client_secret;
    if (!clientSecret) {
      throw new Error("stripe_missing_client_secret");
    }
    return {
      clientSecret,
      externalId: intent.id,
    };
  }
}
