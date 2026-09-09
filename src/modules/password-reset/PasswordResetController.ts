import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

import type { PasswordResetService } from "./PasswordResetService.js";

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000;
const REQUEST_COOLDOWN_MS = 60 * 1000;
const PASSWORD_SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;

/** Same answer whether or not the address exists, so the endpoint cannot enumerate accounts. */
const GENERIC_REQUEST_REPLY = {
  message: "If your email is registered, a password reset link has been sent.",
};

/**
 * Tokens are stored as a SHA-256 digest rather than a bcrypt hash: bcrypt salts every call, so the
 * digest of an incoming token would never match the stored row and confirmation could never succeed.
 */
const digestToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export class PasswordResetController {
  constructor(
    private readonly fastify: FastifyInstance,
    private readonly service: PasswordResetService,
    private readonly prisma: PrismaClient,
  ) {}

  init(): void {
    this.fastify.post<{ Body: { email: string } }>(
      "/reset-password/request",
      async (request, reply) => {
        const { email } = request.body;
        if (!email) {
          return reply.status(400).send({ message: "Email is required." });
        }

        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
          return reply.send(GENERIC_REQUEST_REPLY);
        }

        const lastRequest = await this.prisma.resetPasswordToken.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        });
        if (lastRequest && lastRequest.createdAt > new Date(Date.now() - REQUEST_COOLDOWN_MS)) {
          return reply.status(429).send({
            message: "You can only request a password reset once per minute.",
          });
        }

        const token = randomBytes(TOKEN_BYTES).toString("hex");
        await this.prisma.resetPasswordToken.deleteMany({ where: { userId: user.id } });
        await this.prisma.resetPasswordToken.create({
          data: {
            userId: user.id,
            token: digestToken(token),
            expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
          },
        });

        await this.service.sendResetPasswordEmail(email, token);
        return reply.send(GENERIC_REQUEST_REPLY);
      },
    );

    this.fastify.post<{ Body: { token: string; newPassword: string } }>(
      "/reset-password/confirm",
      async (request, reply) => {
        const { token, newPassword } = request.body;
        if (!token || !newPassword) {
          return reply.status(400).send({ message: "Token and new password are required." });
        }
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
          return reply.status(400).send({
            message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
          });
        }

        const tokenRecord = await this.prisma.resetPasswordToken.findUnique({
          where: { token: digestToken(token) },
        });
        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
          return reply.status(400).send({ message: "Invalid or expired token." });
        }

        await this.prisma.$transaction([
          this.prisma.user.update({
            where: { id: tokenRecord.userId },
            data: { passwordHash: await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS) },
          }),
          this.prisma.resetPasswordToken.delete({ where: { id: tokenRecord.id } }),
        ]);

        return reply.send({ message: "Password reset successfully." });
      },
    );
  }
}
