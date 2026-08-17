import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

const storageRoot = path.resolve(process.env.STORAGE_DIR ?? './storage');

async function requireAdmin(app: FastifyInstance, request: any, reply: any) {
  await app.authenticate(request, reply);
  if (reply.sent) return;
  if (request.user.role !== 'ADMIN') return reply.code(403).send({ message: 'Admin access required.' });
}

export async function fileRoutes(app: FastifyInstance) {
  app.post('/admin/products/:id/file', { preHandler: (request, reply) => requireAdmin(app, request, reply) }, async (request, reply) => {
    const productId = (request.params as { id: string }).id;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return reply.code(404).send({ message: 'Product not found.' });
    const file = await request.file();
    if (!file) return reply.code(400).send({ message: 'PDF file is required.' });
    if (file.mimetype !== 'application/pdf') return reply.code(400).send({ message: 'Only PDF files are accepted.' });
    await mkdir(storageRoot, { recursive: true });
    const fileKey = `${productId}-${crypto.randomUUID()}.pdf`;
    await pipeline(file.file, createWriteStream(path.join(storageRoot, fileKey)));
    await prisma.product.update({ where: { id: productId }, data: { fileKey } });
    return reply.send({ fileKey, message: 'PDF stored securely.' });
  });

  app.get('/products/:id/download', { preHandler: app.authenticate }, async (request, reply) => {
    const productId = (request.params as { id: string }).id;
    const entitlement = await prisma.entitlement.findUnique({ where: { userId_productId: { userId: request.user.sub, productId } }, include: { product: true } });
    if (!entitlement?.product.fileKey) return reply.code(404).send({ message: 'Your purchased file is not available yet.' });
    const filePath = path.resolve(storageRoot, entitlement.product.fileKey);
    if (!filePath.startsWith(`${storageRoot}${path.sep}`)) return reply.code(400).send({ message: 'Invalid file.' });
    const safeName = entitlement.product.title.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'skillora-resource';
    return reply.type('application/pdf').header('Content-Disposition', `attachment; filename="${safeName}.pdf"`).send(createReadStream(filePath));
  });
}
