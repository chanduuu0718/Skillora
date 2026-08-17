import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const productInput = z.object({
  title: z.string().trim().min(3).max(140),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(20).max(5000),
  pricePaise: z.number().int().min(100).max(10_000_000),
  coverUrl: z.string().url().optional(),
  fileKey: z.string().max(500).optional(),
  published: z.boolean().default(false),
});

async function requireAdmin(app: FastifyInstance, request: any, reply: any) {
  await app.authenticate(request, reply);
  if (reply.sent) return;
  if (request.user.role !== 'ADMIN') return reply.code(403).send({ message: 'Admin access required.' });
}

export async function adminRoutes(app: FastifyInstance) {
  app.get('/admin/overview', { preHandler: (request, reply) => requireAdmin(app, request, reply) }, async () => {
    const [products, customers, paidOrders, revenue] = await Promise.all([
      prisma.product.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count({ where: { status: 'PAID' } }),
      prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { amountPaise: true } }),
    ]);
    return { products, customers, paidOrders, revenuePaise: revenue._sum.amountPaise ?? 0 };
  });

  app.post('/admin/products', { preHandler: (request, reply) => requireAdmin(app, request, reply) }, async (request, reply) => {
    const parsed = productInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: 'Invalid product details.', issues: parsed.error.issues });
    const product = await prisma.product.create({ data: parsed.data });
    return reply.code(201).send(product);
  });

  app.patch('/admin/products/:id', { preHandler: (request, reply) => requireAdmin(app, request, reply) }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const parsed = productInput.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: 'Invalid product details.', issues: parsed.error.issues });
    const product = await prisma.product.update({ where: { id }, data: parsed.data });
    return reply.send(product);
  });

  app.delete('/admin/products/:id', { preHandler: (request, reply) => requireAdmin(app, request, reply) }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    await prisma.product.delete({ where: { id } });
    return reply.code(204).send();
  });
}
