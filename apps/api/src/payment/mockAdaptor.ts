import type { CreatePaymentInput, CreatePaymentResult, IPaymentAdaptor } from "./types";

const PREFIX = "mock_cs_";

/** Deterministic fake PaymentIntent id for demos */
export function mockPaymentIntentId(orderId: string): string {
  return `mock_pi_${orderId.replace(/-/g, "").slice(0, 24)}`;
}

export class MockPaymentAdaptor implements IPaymentAdaptor {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const externalId = mockPaymentIntentId(input.orderId);
    return {
      clientSecret: `${PREFIX}${input.orderId}`,
      externalId,
    };
  }
}

export function isMockClientSecret(secret: string, orderId: string): boolean {
  return secret === `${PREFIX}${orderId}`;
}
