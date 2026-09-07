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

export type CreateIntentInput = {
  amountCents: number;
  jobId: string;
  customerId: string;
  connectAccountId?: string | null;
  applicationFeeCents?: number;
};

export interface PaymentService {
  createPaymentIntent(input: CreateIntentInput): Promise<PaymentIntent>;
  capture(intentId: string): Promise<PaymentIntent>;
  refund(intentId: string, amountCents?: number): Promise<PaymentIntent>;
  createConnectedAccount(mechanicUserId: string): Promise<ConnectedAccount>;
}

class MockPaymentService implements PaymentService {
  async createPaymentIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    return {
      id: `mock_pi_${input.jobId.replace(/-/g, "").slice(0, 12)}`,
      status: "requires_capture",
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
    return { id: `acct_mock_${mechanicUserId.replace(/-/g, "").slice(0, 12)}`, chargesEnabled: true };
  }
}

class StripePaymentService implements PaymentService {
  private async client() {
    const Stripe = (await import("stripe")).default;
    return new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  async createPaymentIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    const stripe = await this.client();
    const intent = await stripe.paymentIntents.create({
      amount: input.amountCents,
      currency: "usd",
      capture_method: "manual",
      metadata: { jobId: input.jobId, customerId: input.customerId },
      application_fee_amount: input.applicationFeeCents,
      ...(input.connectAccountId ? { transfer_data: { destination: input.connectAccountId } } : {}),
    });
    return {
      id: intent.id,
      status: intent.status === "succeeded" ? "succeeded" : "requires_capture",
      amountCents: intent.amount,
      currency: intent.currency,
    };
  }

  async capture(intentId: string): Promise<PaymentIntent> {
    const stripe = await this.client();
    const intent = await stripe.paymentIntents.capture(intentId);
    return {
      id: intent.id,
      status: intent.status === "succeeded" ? "succeeded" : "requires_capture",
      amountCents: intent.amount,
      currency: intent.currency,
    };
  }

  async refund(intentId: string, amountCents?: number): Promise<PaymentIntent> {
    const stripe = await this.client();
    await stripe.refunds.create({ payment_intent: intentId, amount: amountCents });
    return { id: intentId, status: "canceled", amountCents: amountCents ?? 0, currency: "usd" };
  }

  async createConnectedAccount(mechanicUserId: string): Promise<ConnectedAccount> {
    const stripe = await this.client();
    const account = await stripe.accounts.create({
      type: "express",
      metadata: { mechanicUserId },
    });
    return { id: account.id, chargesEnabled: Boolean(account.charges_enabled) };
  }
}

export function getPaymentService(): PaymentService {
  if (process.env.STRIPE_SECRET_KEY) {
    return new StripePaymentService();
  }
  return new MockPaymentService();
}
