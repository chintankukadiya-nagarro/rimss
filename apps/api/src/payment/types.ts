export interface CreatePaymentInput {
  orderId: string;
  amountCents: number;
  currency: string;
}

export interface CreatePaymentResult {
  clientSecret: string;
  externalId: string;
}

export interface IPaymentAdaptor {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
}
