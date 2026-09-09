import IORedis from "ioredis";
import type { Env } from "./env.js";

export function createRedis(env: Env) {
  const RedisCtor: any = (IORedis as any).default ?? (IORedis as any);
  if (env.REDIS_URL) return new RedisCtor(env.REDIS_URL);

  return new RedisCtor({
    host: env.REDIS_HOST ?? "127.0.0.1",
    port: env.REDIS_PORT ?? 6379,
    password: env.REDIS_PASSWORD,
  });
}

