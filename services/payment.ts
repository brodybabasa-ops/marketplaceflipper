export type PaymentIntent = {
  id: string;
  status: "requires_payment_method" | "requires_capture" | "succeeded" | "canceled";
  amountCents: number;
  currency: string;
};

export type ConnectedAccount = {
  id: string;
  chargesEnabled: boolean;
};

export interface PaymentService {
  createPaymentIntent(input: { amountCents: number; jobId: string; customerId: string }): Promise<PaymentIntent>;
  capture(intentId: string): Promise<PaymentIntent>;
  refund(intentId: string, amountCents?: number): Promise<PaymentIntent>;
  createConnectedAccount(mechanicUserId: string): Promise<ConnectedAccount>;
}

class MockPaymentService implements PaymentService {
  async createPaymentIntent(input: { amountCents: number; jobId: string }): Promise<PaymentIntent> {
    return {
      id: `mock_pi_${input.jobId.slice(0, 8)}`,
      status: "requires_payment_method",
      amountCents: input.amountCents,
      currency: "usd",
    };
  }

  async capture(intentId: string): Promise<PaymentIntent> {
    return { id: intentId, status: "succeeded", amountCents: 0, currency: "usd" };
  }

  async refund(intentId: string): Promise<PaymentIntent> {
    return { id: intentId, status: "canceled", amountCents: 0, currency: "usd" };
  }

  async createConnectedAccount(mechanicUserId: string): Promise<ConnectedAccount> {
    return { id: `acct_mock_${mechanicUserId.slice(0, 8)}`, chargesEnabled: false };
  }
}

class StripePaymentService implements PaymentService {
  async createPaymentIntent(): Promise<PaymentIntent> {
    throw new Error("Stripe Connect is not configured. Use the mock PaymentService until keys are provided.");
  }
  async capture(): Promise<PaymentIntent> {
    throw new Error("Stripe Connect is not configured.");
  }
  async refund(): Promise<PaymentIntent> {
    throw new Error("Stripe Connect is not configured.");
  }
  async createConnectedAccount(): Promise<ConnectedAccount> {
    throw new Error("Stripe Connect is not configured.");
  }
}

export function getPaymentService(): PaymentService {
  if (process.env.STRIPE_SECRET_KEY) {
    return new StripePaymentService();
  }
  return new MockPaymentService();
}
