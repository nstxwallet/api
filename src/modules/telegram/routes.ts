import type { FastifyInstance, FastifyRequest } from "fastify";
import { nanoid } from "nanoid";
import type { Redis } from "ioredis";
import type { Env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";

const VERIFICATION_TTL_SEC = 5 * 60;

function tgKeyToken(token: string) {
  return `tg:token:${token}`;
}
function tgKeyCode(code: string) {
  return `tg:code:${code}`;
}
function tgKeyUserChat(userId: string) {
  return `tg:user:${userId}:chat`;
}
function tgKeyUserActiveToken(userId: string) {
  return `tg:user:${userId}:activeToken`;
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

async function handleStartMessage(env: Env, redis: Redis, chatId: number, text: string) {
  if (!text.startsWith("/start")) return;

  const token = text.split(" ")[1]?.trim();
  if (!token) {
    await telegramSendMessage(env.TELEGRAM_BOT_TOKEN, chatId, "Открой QR из приложения и нажми Start ещё раз.");
    return;
  }

  const userId = await redis.get(tgKeyToken(token));
  if (!userId) {
    await telegramSendMessage(env.TELEGRAM_BOT_TOKEN, chatId, "Токен устарел. Вернись в браузер и обнови QR.");
    return;
  }

  const code = randomCode6();
  await redis.set(tgKeyCode(code), userId, "EX", VERIFICATION_TTL_SEC);
  await redis.set(tgKeyUserChat(userId), String(chatId), "EX", 24 * 60 * 60);

  await telegramSendMessage(
    env.TELEGRAM_BOT_TOKEN,
    chatId,
    `Код подтверждения: ${code}\n\nВведи его в браузер в течение 5 минут.`,
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

export function startTelegramPolling(app: FastifyInstance, env: Env, redis: Redis) {
  let running = true;
  let offset = 0;
  let inFlight = false;

  const tick = async () => {
    if (!running || inFlight) return;
    inFlight = true;
    try {
      // Polling can't work while webhook is active.
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
            await handleStartMessage(env, redis, chatId, text);
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

export async function registerTelegramRoutes(app: FastifyInstance, env: Env, redis: Redis) {
  // Generates t.me deep link with start payload == verificationToken.
  app.post("/telegram/request-verification", { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = (req.user as { sub: string }).sub;

    const prevToken = await redis.get(tgKeyUserActiveToken(userId));
    const token = nanoid(24);
    await redis.set(tgKeyToken(token), userId, "EX", VERIFICATION_TTL_SEC);
    await redis.set(tgKeyUserActiveToken(userId), token, "EX", VERIFICATION_TTL_SEC);
    if (prevToken && prevToken !== token) {
      await redis.del(tgKeyToken(prevToken));
    }

    const username = env.TELEGRAM_BOT_USERNAME.replace(/^@/, "");
    const qrLink = `https://t.me/${username}?start=${encodeURIComponent(token)}`;
    return reply.send({ verificationToken: token, qrLink });
  });

  // Telegram webhook: receives /start <token>, sends 6-digit code to user.
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

      await handleStartMessage(env, redis, chatId, text);
      return reply.send({ ok: true });
    },
  );

  // Confirms code, marks user.telegramVerified=true
  app.post<{ Body: { code: string } }>(
    "/telegram/confirm-code",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = (req.user as { sub: string }).sub;
      const code = String(req.body.code ?? "").trim();
      if (!/^\d{6}$/.test(code)) return reply.code(400).send({ message: "Invalid code" });

      const codeUserId = await redis.get(tgKeyCode(code));
      if (!codeUserId) return reply.code(400).send({ message: "Code expired or not found" });
      if (codeUserId !== userId) return reply.code(403).send({ message: "Code does not match this user" });

      const chatId = await redis.get(tgKeyUserChat(userId));

      await prisma.user.update({
        where: { id: userId },
        data: { telegramVerified: true, telegramChatId: chatId ?? undefined },
      });

      await redis.del(tgKeyCode(code));
      return reply.send({ ok: true });
    },
  );
}

