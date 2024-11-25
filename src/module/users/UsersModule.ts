import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { UsersController } from "./UsersController";
import { UsersService } from "./UsersService";

interface Init {
	fastify: FastifyInstance;
	prisma: PrismaClient;
}
export class UsersModule {
	public constructor(public readonly service: UsersService) {}

	public static async init(props: Init) {
		const service = new UsersService(props.prisma);
		const controller = new UsersController(props.fastify, service);
		controller.init();
		return new UsersModule(service);
	}
}
