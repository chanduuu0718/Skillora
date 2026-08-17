import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  WEB_ORIGIN: z.string().url(),
  PORT: z.coerce.number().int().positive().default(4000),
});

export const config = schema.parse(process.env);
