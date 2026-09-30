/**
 * Script para restablecer o crear el usuario Administrador en Producción
 * Ejecución: node scripts/reset-admin.js [email] [password]
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'admin@satemsoluciones.com';
  const password = process.argv[3] || 'admin@123';

  console.log(`Configurando usuario admin: ${email}...`);
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      fullName: 'Administrador SATEM',
      role: 'ADMIN',
      passwordHash: passwordHash,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: email.toLowerCase(),
      fullName: 'Administrador SATEM',
      role: 'ADMIN',
      passwordHash: passwordHash,
      isActive: true,
    },
  });

  console.log('✅ Usuario Administrador configurado exitosamente:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Rol: ${user.role}`);
  console.log(`   Estado: Activo`);
  console.log(`   Contraseña: ${password}`);
}

main()
  .catch((e) => {
    console.error('❌ Error al configurar admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
