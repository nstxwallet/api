import "fastify";
import "@fastify/jwt";

declare module "fastify" {
  interface FastifyInstance {
    /** Rejects the request with 401 unless it carries a valid access token. */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    /** `sub` holds the user id; auth/routes.ts signs the token this way. */
    payload: { sub: string };
    user: { sub: string };
  }
}
