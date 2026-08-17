import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export async function productRoutes(app: FastifyInstance) {
  app.get('/products', async () => {
    return prisma.product.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, slug: true, title: true, description: true, pricePaise: true, coverUrl: true },
    });
  });

  app.get('/products/:slug', async (request, reply) => {
    const parsed = slug.safeParse((request.params as { slug: string }).slug);
    if (!parsed.success) return reply.code(400).send({ message: 'Invalid product.' });
    const product = await prisma.product.findFirst({
      where: { slug: parsed.data, published: true },
      select: { id: true, slug: true, title: true, description: true, pricePaise: true, coverUrl: true },
    });
    if (!product) return reply.code(404).send({ message: 'Product not found.' });
    return product;
  });

  app.get('/me/purchases', { preHandler: app.authenticate }, async (request) => {
    return prisma.entitlement.findMany({
      where: { userId: request.user.sub },
      orderBy: { grantedAt: 'desc' },
      include: { product: { select: { id: true, slug: true, title: true, description: true, coverUrl: true } } },
    });
  });
}
