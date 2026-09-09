import type { FastifyInstance, FastifyRequest } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post(
    "/sign-up",
    async (
      req: FastifyRequest<{
        Body: { email: string; password: string; firstName: string; lastName: string };
      }>,
      reply,
    ) => {
      const { email, password, firstName, lastName } = req.body;
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) return reply.code(409).send({ message: "User already exists" });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, passwordHash, firstName, lastName },
        select: { id: true, email: true, firstName: true, lastName: true, telegramVerified: true },
      });
      return reply.send(user);
    },
  );

  app.post(
    "/login",
    async (
      req: FastifyRequest<{ Body: { email: string; password: string } }>,
      reply,
    ) => {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return reply.code(401).send({ message: "Invalid credentials" });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return reply.code(401).send({ message: "Invalid credentials" });

      const accessToken = app.jwt.sign({ sub: user.id });
      return reply.send({ accessToken });
    },
  );

  app.get("/logout", async (_req, reply) => {
    // Front uses token in sessionStorage; nothing to invalidate server-side for now.
    return reply.send({ ok: true });
  });

  app.get("/users/me", { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = (req.user as { sub: string }).sub;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        telegramVerified: true,
      },
    });
    if (!user) return reply.code(404).send({ message: "User not found" });
    return reply.send(user);
  });
}

