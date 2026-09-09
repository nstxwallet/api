import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Rejects the request with 401 when the access token is missing or invalid.
 * Registered as `app.authenticate` in index.ts and used via `preHandler`.
 */
export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ message: "Unauthorized" });
  }
};
