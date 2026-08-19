import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const credentials = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

const loginCredentials = credentials.pick({ email: true, password: true });

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const parsed = credentials.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: 'Invalid registration details.' });

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return reply.code(409).send({ message: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
      select: { id: true, name: true, email: true, role: true },
    });

    const token = await app.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    reply.setCookie('skillora_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return reply.code(201).send({ user });
  });

  app.post('/auth/login', async (request, reply) => {
    const parsed = loginCredentials.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: 'Invalid email or password.' });

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return reply.code(401).send({ message: 'Invalid email or password.' });
    }

    const token = await app.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    reply.setCookie('skillora_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return reply.send({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  app.post('/auth/logout', async (_request, reply) => {
    reply.clearCookie('skillora_session', { path: '/' });
    return reply.send({ ok: true });
  });

  app.get('/auth/me', { preHandler: app.authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.sub },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) return reply.code(401).send({ message: 'Session expired.' });
    return reply.send({ user });
  });
}
