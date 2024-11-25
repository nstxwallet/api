import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { SendGridService } from "./SendGridService";
import { SendGridController } from "./SendGridController";
import sgMail from "@sendgrid/mail";

export class SendGridModule {
  public static async init({ fastify, prisma }: { fastify: FastifyInstance; prisma: PrismaClient }) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const service = new SendGridService(sgMail);
    const controller = new SendGridController(fastify, service, prisma);

    controller.init();
  }
}
