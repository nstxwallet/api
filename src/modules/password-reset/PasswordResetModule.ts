import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { PasswordResetService } from "./PasswordResetService.js";
import { PasswordResetController } from "./PasswordResetController.js";
import sgMail from "@sendgrid/mail";

export class PasswordResetModule {
  public static async init({ fastify, prisma }: { fastify: FastifyInstance; prisma: PrismaClient }) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const service = new PasswordResetService(sgMail);
    const controller = new PasswordResetController(fastify, service, prisma);

    controller.init();
  }
}
