import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  APP_URL: z.string().default("http://localhost:3000"),
  OPENAI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  ALERT_FROM_EMAIL: z.string().default("Lotline <alerts@example.com>"),
  BESTBUY_API_KEY: z.string().optional(),
  EBAY_OAUTH_TOKEN: z.string().optional(),
});

export function getEnv() {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    APP_URL: process.env.APP_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || undefined,
    RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
    ALERT_FROM_EMAIL: process.env.ALERT_FROM_EMAIL,
    BESTBUY_API_KEY: process.env.BESTBUY_API_KEY || undefined,
    EBAY_OAUTH_TOKEN: process.env.EBAY_OAUTH_TOKEN || undefined,
  });

  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }

  return parsed.data;
}
