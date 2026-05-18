import { z } from 'zod';
import { config as dotEnvConfig } from 'dotenv';

// Load .env file into process.env before validation
dotEnvConfig();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGO_DB_URI: z.string().url(),
  LOCAL_MONGO_URI: z.string().url().optional(),
  GH_TOKEN: z.string().min(1),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
};

export const env = parseEnv();
