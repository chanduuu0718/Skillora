import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const productInput = z.object({ title: z.string().trim().min(3).max(140), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().trim().min(20).max(5000), pricePaise: z.number().int().min(100).max(10_000_000), coverUrl: z.string().url().optional().nullable(), fileKey: z.string().max(500).optional().nullable(), published: z.boolean().default(false) });

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

  app.get('/admin/orders', { preHandler: (request, reply) => requireAdmin(app, request, reply) }, async () => prisma.order.findMany({
    where: { status: 'PAID' }, orderBy: { createdAt: 'desc' }, take: 50,
    select: { id: true, amountPaise: true, currency: true, status: true, createdAt: true, paidAt: true, user: { select: { id: true, name: true, email: true } }, items: { select: { product: { select: { id: true, title: true, slug: true } }, pricePaise: true } } },
  }));

  app.get('/admin/customers', { preHandler: (request, reply) => requireAdmin(app, request, reply) }, async () => {
    const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, name: true, email: true, createdAt: true, _count: { select: { orders: true, entitlements: true } } } });
    return customers.map(({ _count, ...customer }) => ({ ...customer, orders: _count.orders, resourcesOwned: _count.entitlements }));
  });

  app.get('/admin/products', { preHandler: (request, reply) => requireAdmin(app, request, reply) }, async () => {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { orderItems: true, entitlements: true } } } });
    return products.map(({ _count, ...product }) => ({ ...product, salesCount: Math.max(_count.orderItems, _count.entitlements) }));
  });

  app.post('/admin/products', { preHandler: (request, reply) => requireAdmin(app, request, reply) }, async (request, reply) => {
    const parsed = productInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: 'Invalid product details.', issues: parsed.error.issues });
    return reply.code(201).send(await prisma.product.create({ data: parsed.data }));
  });

  app.patch('/admin/products/:id', { preHandler: (request, reply) => requireAdmin(app, request, reply) }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const parsed = productInput.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: 'Invalid product details.', issues: parsed.error.issues });
    return reply.send(await prisma.product.update({ where: { id }, data: parsed.data }));
  });

  app.delete('/admin/products/:id', { preHandler: (request, reply) => requireAdmin(app, request, reply) }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const [orders, entitlements] = await Promise.all([prisma.orderItem.count({ where: { productId: id } }), prisma.entitlement.count({ where: { productId: id } })]);
    if (orders || entitlements) return reply.code(409).send({ message: 'This resource has purchase history and is protected. Unpublish it instead of deleting it.' });
    await prisma.product.delete({ where: { id } });
    return reply.code(204).send();
  });
}
