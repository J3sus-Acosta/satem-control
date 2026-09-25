import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin@123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@satemsoluciones.com' },
    update: {
      passwordHash: hash,
      role: UserRole.ADMIN,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: 'admin@satemsoluciones.com',
      fullName: 'Administrador SATEM',
      role: UserRole.ADMIN,
      passwordHash: hash,
      isActive: true,
    },
  });

  console.log(`✅ Usuario administrador actualizado correctamente: ${user.email} (ID: ${user.id})`);
}

main()
  .catch((err) => {
    console.error('Error al actualizar administrador:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
