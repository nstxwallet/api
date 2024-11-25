import { WrongCredentialsError } from "./error";

import { FastifyInstance } from "fastify";
import { UsersService } from "./UsersService";
import { onRequestAuth } from "../../hooks/onRequestAuth";

export class UsersController {
	constructor(
		private readonly fastify: FastifyInstance,
		private readonly service: UsersService,
	) {}
	init(): void {
		this.fastify.post<{ Body: { email: string; password: string } }>(
			"/login",
			async (req, reply) => {
				try {
					const { email, password } = req.body;
					const user = await this.service.validateCredentials({
						email,
						password,
					});
					if (user) {
						const accessToken = this.fastify.jwt.sign({ id: user.id });
						reply.setCookie("token", accessToken, {
							path: "/",
							httpOnly: true,
							secure: true,
							sameSite: "none",
						});
						return reply.send({ accessToken });
					}
				} catch (error) {
					if (error instanceof WrongCredentialsError) {
						return reply.status(401).send({ error: "Invalid credentials" });
					}
					console.error("Error logging in:", error);
					return reply.status(500).send({ error: "Internal server error" });
				}
			},
		);

		this.fastify.post<{
			Body: {
				email: string;
				password: string;
				firstName: string | null;
				lastName: string | null;
			};
		}>("/sign-up", async (req, reply) => {
			const user = await this.service.create({
				email: req.body.email,
				password: req.body.password,
				firstName: req.body.firstName,
				lastName: req.body.lastName,
			});
			return reply.send(user);
		});

		this.fastify.get("/logout", async (_req, reply) => {
			reply.clearCookie("token");
			return reply.send({ success: true });
		});

		this.fastify.get<{
			Params: { id: string };
		}>("/users/me", { onRequest: onRequestAuth }, async (req, reply) => {
			const user = await this.service.getById(req.user.id);
			if (!user) {
				return reply
					.status(400)
					.send({ success: false, message: "User not found" });
			}
			return reply.send(user);
		});
	}
}
