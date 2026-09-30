import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { UserRole } from '@prisma/client';

/**
 * Garantiza que exista al menos un usuario Administrador activo al arrancar el servidor.
 * Esto evita fallos de login tras migraciones, resets de BD o despliegues limpios.
 */
export async function ensureDefaultAdmin(): Promise<void> {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@satemsoluciones.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123';

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          fullName: 'Administrador SATEM',
          role: UserRole.ADMIN,
          passwordHash,
          isActive: true,
        },
      });
      console.log(`[BOOTSTRAP] ✅ Usuario Administrador creado automáticamente: ${adminEmail}`);
    } else if (!existingAdmin.isActive || existingAdmin.deletedAt) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { isActive: true, deletedAt: null },
      });
      console.log(`[BOOTSTRAP] 🔄 Usuario Administrador reactivado: ${adminEmail}`);
    }
  } catch (error) {
    console.error('[BOOTSTRAP] ⚠️ Advertencia al verificar usuario administrador inicial:', error);
  }
}
