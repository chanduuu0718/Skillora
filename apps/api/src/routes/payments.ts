import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { config } from '../lib/config.js';

const razorpay = new Razorpay({ key_id: config.RAZORPAY_KEY_ID, key_secret: config.RAZORPAY_KEY_SECRET });
const checkoutSchema = z.object({ productId: z.string().min(1) });

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function paymentRoutes(app: FastifyInstance) {
  app.post('/payments/create-order', { preHandler: app.authenticate }, async (request, reply) => {
    const parsed = checkoutSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: 'Invalid product.' });

    const product = await prisma.product.findFirst({ where: { id: parsed.data.productId, published: true } });
    if (!product) return reply.code(404).send({ message: 'Product not found.' });

    const existing = await prisma.entitlement.findUnique({
      where: { userId_productId: { userId: request.user.sub, productId: product.id } },
    });
    if (existing) return reply.code(409).send({ message: 'You already own this product.' });

    const order = await prisma.order.create({
      data: {
        userId: request.user.sub,
        amountPaise: product.pricePaise,
        items: { create: { productId: product.id, pricePaise: product.pricePaise } },
      },
    });

    const razorOrder = await razorpay.orders.create({
      amount: product.pricePaise,
      currency: 'INR',
      receipt: order.id,
      notes: { skilloraOrderId: order.id, userId: request.user.sub, productId: product.id },
    });

    await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: razorOrder.id } });

    return reply.send({
      orderId: order.id,
      razorpayOrderId: razorOrder.id,
      keyId: config.RAZORPAY_KEY_ID,
      amountPaise: product.pricePaise,
      currency: 'INR',
      product: { id: product.id, title: product.title },
    });
  });

  app.post('/payments/verify', { preHandler: app.authenticate }, async (request, reply) => {
    const body = z.object({
      razorpayOrderId: z.string(),
      razorpayPaymentId: z.string(),
      razorpaySignature: z.string(),
    }).safeParse(request.body);
    if (!body.success) return reply.code(400).send({ message: 'Invalid payment verification payload.' });

    const order = await prisma.order.findFirst({ where: { id: body.data.razorpayOrderId, userId: request.user.sub } });
    const stored = await prisma.order.findFirst({ where: { razorpayOrderId: body.data.razorpayOrderId, userId: request.user.sub } });
    const target = stored ?? order;
    if (!target || !target.razorpayOrderId) return reply.code(404).send({ message: 'Order not found.' });

    const expected = crypto.createHmac('sha256', config.RAZORPAY_KEY_SECRET)
      .update(`${target.razorpayOrderId}|${body.data.razorpayPaymentId}`)
      .digest('hex');
    if (!safeCompare(expected, body.data.razorpaySignature)) {
      return reply.code(400).send({ message: 'Payment signature verification failed.' });
    }

    await prisma.$transaction(async (tx) => {
      const paid = await tx.order.update({
        where: { id: target.id },
        data: { status: 'PAID', razorpayPaymentId: body.data.razorpayPaymentId, paidAt: new Date() },
        include: { items: true },
      });
      for (const item of paid.items) {
        await tx.entitlement.upsert({
          where: { userId_productId: { userId: paid.userId, productId: item.productId } },
          create: { userId: paid.userId, productId: item.productId, orderId: paid.id },
          update: {},
        });
      }
    });

    return reply.send({ ok: true });
  });

  app.post('/payments/webhook', async (request, reply) => {
    const signature = request.headers['x-razorpay-signature'];
    if (typeof signature !== 'string' || !request.rawBody) return reply.code(400).send({ message: 'Missing webhook signature.' });

    const expected = crypto.createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET).update(request.rawBody).digest('hex');
    if (!safeCompare(expected, signature)) return reply.code(401).send({ message: 'Invalid webhook signature.' });

    const event = request.body as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      if (payment?.id && payment.order_id) {
        const order = await prisma.order.findUnique({ where: { razorpayOrderId: payment.order_id }, include: { items: true } });
        if (order && order.status !== 'PAID') {
          await prisma.$transaction(async (tx) => {
            await tx.order.update({ where: { id: order.id }, data: { status: 'PAID', razorpayPaymentId: payment.id, paidAt: new Date() } });
            for (const item of order.items) {
              await tx.entitlement.upsert({
                where: { userId_productId: { userId: order.userId, productId: item.productId } },
                create: { userId: order.userId, productId: item.productId, orderId: order.id },
                update: {},
              });
            }
          });
        }
      }
    }

    return reply.send({ received: true });
  });
}
