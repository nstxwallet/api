import type { FastifyInstance, FastifyRequest } from "fastify";
import { nanoid } from "nanoid";
import type { Env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";

const VERIFICATION_TTL_SEC = 5 * 60; 
const CHAT_BINDING_TTL_SEC = 24 * 60 * 60;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

function expiryFromNow(seconds: number) {
  return new Date(Date.now() + seconds * 1000);
}

function randomCode6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function telegramSendMessage(botToken: string, chatId: number | string, text: string) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: ${res.status} ${body}`);
  }
}

async function handleStartMessage(env: Env, chatId: number, text: string) {
  if (!text.startsWith("/start")) return;

  const token = text.split(" ")[1]?.trim();
  if (!token) {
    await telegramSendMessage(env.TELEGRAM_BOT_TOKEN, chatId, "Open the QR code in the app and press Start again.");
    return;
  }

  const record = await prisma.telegramVerificationToken.findUnique({ where: { token } });
  if (!record || record.expiresAt <= new Date()) {
    await telegramSendMessage(env.TELEGRAM_BOT_TOKEN, chatId, "The token has expired. Go back to the browser and refresh the QR code.");
    return;
  }

  const code = randomCode6();
  /* One pending code per user: the newest /start supersedes any earlier one. */
  await prisma.$transaction([
    prisma.telegramVerificationCode.deleteMany({ where: { userId: record.userId } }),
    prisma.telegramVerificationCode.create({
      data: {
        code,
        userId: record.userId,
        chatId: String(chatId),
        expiresAt: expiryFromNow(VERIFICATION_TTL_SEC),
      },
    }),
    prisma.telegramVerificationToken.delete({ where: { id: record.id } }),
  ]);

  await telegramSendMessage(
    env.TELEGRAM_BOT_TOKEN,
    chatId,
    `Confirmation code: ${code}\n\nEnter it in the browser within 5 minutes.`,
  );
}

async function telegramGetUpdates(botToken: string, offset: number) {
  const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offset, timeout: 30, allowed_updates: ["message"] }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram getUpdates failed: ${res.status} ${body}`);
  }
  return (await res.json()) as { ok: boolean; result: Array<any> };
}

async function telegramDeleteWebhook(botToken: string) {
  const url = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram deleteWebhook failed: ${res.status} ${body}`);
  }
}

/** Postgres expires nothing on its own, so sweep stale rows on an interval. */
export function startTelegramCleanup(app: FastifyInstance) {
  const sweep = async () => {
    const now = new Date();
    try {
      const [tokens, codes] = await prisma.$transaction([
        prisma.telegramVerificationToken.deleteMany({ where: { expiresAt: { lte: now } } }),
        prisma.telegramVerificationCode.deleteMany({ where: { expiresAt: { lte: now } } }),
      ]);
      if (tokens.count || codes.count) {
        app.log.info({ tokens: tokens.count, codes: codes.count }, "Expired Telegram records removed");
      }
    } catch (err) {
      app.log.error({ err }, "telegram cleanup error");
    }
  };

  const interval = setInterval(sweep, CLEANUP_INTERVAL_MS);
  void sweep();

  app.addHook("onClose", async () => {
    clearInterval(interval);
  });
}

export function startTelegramPolling(app: FastifyInstance, env: Env) {
  let running = true;
  let offset = 0;
  let inFlight = false;

  const tick = async () => {
    if (!running || inFlight) return;
    inFlight = true;
    try { 
      if (offset === 0) {
        await telegramDeleteWebhook(env.TELEGRAM_BOT_TOKEN);
      }
      const data = await telegramGetUpdates(env.TELEGRAM_BOT_TOKEN, offset);
      if (data.ok && Array.isArray(data.result) && data.result.length) {
        for (const upd of data.result) {
          offset = Math.max(offset, (upd.update_id ?? 0) + 1);
          const msg = upd?.message;
          const text: string | undefined = msg?.text;
          const chatId: number | undefined = msg?.chat?.id;
          if (text && chatId) {
            await handleStartMessage(env, chatId, text);
          }
        }
      }
    } catch (err) {
      app.log.error({ err }, "telegram polling error");
    } finally {
      inFlight = false;
    }
  };

  const interval = setInterval(tick, env.TELEGRAM_POLL_INTERVAL_MS);
  // run immediately
  void tick();

  app.addHook("onClose", async () => {
    running = false;
    clearInterval(interval);
  });
}

export async function registerTelegramRoutes(app: FastifyInstance, env: Env) {
  app.post("/telegram/request-verification", { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = (req.user as { sub: string }).sub;

    const token = nanoid(24);
    await prisma.$transaction([
      prisma.telegramVerificationToken.deleteMany({ where: { userId } }),
      prisma.telegramVerificationToken.create({
        data: { token, userId, expiresAt: expiryFromNow(VERIFICATION_TTL_SEC) },
      }),
    ]);

    const username = env.TELEGRAM_BOT_USERNAME.replace(/^@/, "");
    const qrLink = `https://t.me/${username}?start=${encodeURIComponent(token)}`;
    return reply.send({ verificationToken: token, qrLink });
  });

  app.post(
    "/telegram/webhook",
    async (
      req: FastifyRequest<{
        Headers: { "x-telegram-bot-api-secret-token"?: string };
        Body: any;
      }>,
      reply,
    ) => {
      const secret = req.headers["x-telegram-bot-api-secret-token"];
      if (env.TELEGRAM_WEBHOOK_SECRET && secret !== env.TELEGRAM_WEBHOOK_SECRET) {
        return reply.code(401).send({ ok: false });
      }

      const update: any = req.body;
      const msg = update?.message ?? update?.edited_message ?? update?.channel_post;
      const text: string | undefined = msg?.text;
      const chatId: number | undefined = msg?.chat?.id;
      if (!text || !chatId) return reply.send({ ok: true });

      await handleStartMessage(env, chatId, text);
      return reply.send({ ok: true });
    },
  );

  app.post<{ Body: { code: string } }>(
    "/telegram/confirm-code",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = (req.user as { sub: string }).sub;
      const code = String(req.body.code ?? "").trim();
      if (!/^\d{6}$/.test(code)) return reply.code(400).send({ message: "Invalid code" });

      const record = await prisma.telegramVerificationCode.findUnique({ where: { code } });
      if (!record || record.expiresAt <= new Date()) {
        return reply.code(400).send({ message: "Code expired or not found" });
      }
      if (record.userId !== userId) {
        return reply.code(403).send({ message: "Code does not match this user" });
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { telegramVerified: true, telegramChatId: record.chatId },
        }),
        prisma.telegramVerificationCode.delete({ where: { id: record.id } }),
      ]);

      return reply.send({ ok: true });
    },
  );
}
