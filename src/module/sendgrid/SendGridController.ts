import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { SendGridService } from "./SendGridService";
import bcrypt from "bcrypt";

export class SendGridController {
  constructor(
      private readonly fastify: FastifyInstance,
      private readonly service: SendGridService,
      private readonly prisma: PrismaClient
  ) {}

  init() {
    this.fastify.post("/reset-password/request", async (request, reply) => {
      const { email } = request.body as { email: string };

      try {
        const user = await this.prisma.user.findUnique({ where: { email } });

        if (user) {
          const recentRequest = await this.prisma.resetPasswordToken.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
          });

          if (recentRequest && recentRequest.createdAt > new Date(Date.now() - 60 * 1000)) {
            return reply.status(429).send({
              message: "You can only request a password reset once per minute.",
            });
          }

          await this.prisma.resetPasswordToken.deleteMany({ where: { userId: user.id } });

          const resetToken = Math.random().toString(36).substring(2, 15);
          const hashedToken = bcrypt.hashSync(resetToken, 10);

          await this.prisma.resetPasswordToken.create({
            data: {
              userId: user.id,
              token: hashedToken,
              expiresAt: new Date(Date.now() + 3600000),
            },
          });

          await this.service.sendResetPasswordEmail(email, resetToken);
        }

        reply.send({
          message: "If your email is registered, a password reset link has been sent.",
        });
      } catch (error) {
        reply.status(500).send({ message: "Internal server error." });
      }
    });

    this.fastify.post("/reset-password/confirm", async (request, reply) => {
      const { token, newPassword } = request.body as { token: string; newPassword: string };

      try {
        const tokenRecord = await this.prisma.resetPasswordToken.findFirst({
          where: { token: bcrypt.hashSync(token, 10) },
        });

        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
          return reply.status(400).send({ message: "Invalid or expired token." });
        }

        await this.prisma.user.update({
          where: { id: tokenRecord.userId },
          data: { password: bcrypt.hashSync(newPassword, 10) },
        });

        await this.prisma.resetPasswordToken.delete({ where: { id: tokenRecord.id } });

        reply.send({ message: "Password reset successfully." });
      } catch (error) {
        reply.status(500).send({ message: "Internal server error." });
      }
    });
  }
}
