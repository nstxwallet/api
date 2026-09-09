import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";

import { getEnv } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { createRedis } from "./config/redis.js";
import { BalanceModule } from "./modules/balances/index.js";
import { BinanceModule } from "./modules/binance/index.js";
import { PasswordResetModule } from "./modules/password-reset/index.js";
import { TransactionModule } from "./modules/transactions/index.js";
import { registerAuthRoutes } from "./modules/auth/routes.js";
import { registerTelegramRoutes, startTelegramPolling } from "./modules/telegram/routes.js";
import { authenticate } from "./plugins/authenticate.js";

const RATE_LIMIT_MAX = 200;
const RATE_LIMIT_WINDOW = "1 minute";
/** How often ticker prices are refreshed from Binance. */
const PRICE_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

const env = getEnv();
const app = Fastify({ logger: true });

await app.register(cors, { origin: env.CORS_ORIGIN ?? true, credentials: true });
await app.register(rateLimit, { max: RATE_LIMIT_MAX, timeWindow: RATE_LIMIT_WINDOW });
await app.register(jwt, {
  secret: env.JWT_SECRET,
  sign: { expiresIn: env.JWT_EXPIRES_IN },
});

app.decorate("authenticate", authenticate);

const redis = createRedis(env);

app.get("/health", async () => ({ ok: true }));

await registerAuthRoutes(app);
await registerTelegramRoutes(app, env, redis);
await BalanceModule.init({ fastify: app, prisma });
await TransactionModule.init({ fastify: app, prisma });
const binance = await BinanceModule.init({ fastify: app, prisma });

if (env.SENDGRID_API_KEY) {
  await PasswordResetModule.init({ fastify: app, prisma });
} else {
  app.log.warn("SENDGRID_API_KEY is unset: password reset routes are disabled");
}

if (env.TELEGRAM_USE_POLLING) {
  app.log.info("Telegram polling enabled");
  startTelegramPolling(app, env, redis);
}

/* Refresh prices in the background; a failure must not take the server down. */
const refreshPrices = (): void => {
  binance.service
    .updateTickerPrices()
    .then((count) => app.log.info({ count }, "Ticker prices refreshed"))
    .catch((error) => app.log.error({ error }, "Failed to refresh ticker prices"));
};
refreshPrices();
setInterval(refreshPrices, PRICE_REFRESH_INTERVAL_MS);

const shutdown = async (): Promise<void> => {
  await app.close();
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

app.listen({ port: env.PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
