import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.string().default("development"),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default("7d"),

  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_PASSWORD: z.string().optional(),

  TELEGRAM_BOT_TOKEN: z.string().min(10),
  TELEGRAM_BOT_USERNAME: z.string().min(3),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  TELEGRAM_USE_POLLING: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  TELEGRAM_POLL_INTERVAL_MS: z.coerce.number().optional().default(1500),

  SENDGRID_API_KEY: z.string().optional(),

  CORS_ORIGIN: z.string().optional()
});

export type Env = z.infer<typeof EnvSchema>;

export function getEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}

