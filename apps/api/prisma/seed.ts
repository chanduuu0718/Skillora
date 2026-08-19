import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@skillora.local' },
    update: { role: 'ADMIN', passwordHash },
    create: { name: 'Skillora Admin', email: 'admin@skillora.local', passwordHash, role: 'ADMIN' },
  });

  await prisma.product.upsert({
    where: { slug: 'java-interview-starter-pack' },
    update: {},
    create: {
      slug: 'java-interview-starter-pack',
      title: 'Java Interview Starter Pack',
      description: 'A starter digital resource for Java interview preparation. Replace this demo product with your real paid resource before launch.',
      pricePaise: 19900,
      published: true,
    },
  });
}

main().finally(() => prisma.$disconnect());
