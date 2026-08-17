import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import rawBody from '@fastify/raw-body';
import multipart from '@fastify/multipart';
import { config } from './lib/config.js';
import { authRoutes } from './routes/auth.js';
import { productRoutes } from './routes/products.js';
import { paymentRoutes } from './routes/payments.js';
import { adminRoutes } from './routes/admin.js';

const app = Fastify({ logger: true });

await app.register(helmet);
await app.register(cookie);
await app.register(cors, { origin: config.WEB_ORIGIN, credentials: true });
await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
await app.register(jwt, { secret: config.JWT_SECRET });
await app.register(rawBody, { field: 'rawBody', global: false, encoding: 'utf8', runFirst: true });
await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } });

app.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify({ onlyCookie: true, cookie: 'skillora_session' });
  } catch {
    return reply.code(401).send({ message: 'Authentication required.' });
  }
});

app.get('/health', async () => ({ status: 'ok', service: 'skillora-api', timestamp: new Date().toISOString() }));

await app.register(authRoutes, { prefix: '/api' });
await app.register(productRoutes, { prefix: '/api' });
await app.register(paymentRoutes, { prefix: '/api' });
await app.register(adminRoutes, { prefix: '/api' });

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
