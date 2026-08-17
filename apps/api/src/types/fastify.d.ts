import '@fastify/jwt';
import 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: { sub: string; role: 'CUSTOMER' | 'ADMIN'; email: string };
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: string | Buffer;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
