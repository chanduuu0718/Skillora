import 'dotenv/config';
import { z } from 'zod';

const optionalSecret = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  RAZORPAY_KEY_ID: optionalSecret,
  RAZORPAY_KEY_SECRET: optionalSecret,
  RAZORPAY_WEBHOOK_SECRET: optionalSecret,
  WEB_ORIGIN: z.string().url(),
  PORT: z.coerce.number().int().positive().default(4000),
});

export const config = schema.parse(process.env);

export const razorpayConfigured = Boolean(
  config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET,
);

export const razorpayWebhookConfigured = Boolean(config.RAZORPAY_WEBHOOK_SECRET);
