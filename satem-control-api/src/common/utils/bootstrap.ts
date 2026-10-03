import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { UserRole } from '@prisma/client';
import { SATEM_SIGNATURE_BASE64 } from '../../assets/signatures.js';
import { LOGO_FULL_BASE64, LOGO_SHORT_BASE64 } from '../../assets/logos.js';

/**
 * Garantiza la coherencia del esquema de base de datos en producción (auto-healing DDL).
 * Agrega columnas y constraints faltantes de forma no destructiva e idempotente.
 */
export async function ensureDatabaseSchema(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);

    // system_exceptions.assignedUserId
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`system_exceptions\` ADD COLUMN \`assignedUserId\` VARCHAR(191) NULL;
      `);
      console.log('[BOOTSTRAP] 🛡️ Columna system_exceptions.assignedUserId verificada/agregada.');
    } catch {}

    // payments.usdEquivalent y exchangeRate
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`payments\` ADD COLUMN \`usdEquivalent\` DECIMAL(14, 2) NULL;
      `);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`payments\` ADD COLUMN \`exchangeRate\` DECIMAL(12, 4) NULL;
      `);
    } catch {}

    // foreign keys
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`system_exceptions\` ADD CONSTRAINT \`system_exceptions_assignedUserId_fkey\` FOREIGN KEY (\`assignedUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
      `);
    } catch {}

    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
  } catch (error) {
    console.warn('[BOOTSTRAP] ⚠️ Advertencia en verificación de esquema de BD:', error);
  }
}

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

/**
 * Garantiza que la firma corporativa oficial de SATEM y los formatos de plantillas
 * incluyan siempre la firma oficial en el área de SATEM tanto para plantillas existentes
 * como para las que se generen en adelante.
 */
export async function ensureCompanySignature(): Promise<void> {
  try {
    // 1. Asegurar firma en configuración de empresa
    await prisma.companyConfig.upsert({
      where: { id: 'DEFAULT' },
      update: {
        signatureUrl: SATEM_SIGNATURE_BASE64,
        logoFullUrl: LOGO_FULL_BASE64,
        logoShortUrl: LOGO_SHORT_BASE64,
      },
      create: {
        id: 'DEFAULT',
        legalName: 'SATEM Soluciones Inteligentes SpA',
        taxId: '77.654.321-K',
        address: 'Av. Providencia 1234, Of. 601, Santiago',
        city: 'Santiago',
        country: 'Chile',
        email: 'contacto@satemsoluciones.com',
        website: 'https://satemsoluciones.com',
        signatureUrl: SATEM_SIGNATURE_BASE64,
        logoFullUrl: LOGO_FULL_BASE64,
        logoShortUrl: LOGO_SHORT_BASE64,
        legalRepresentative: 'Representante Legal SATEM',
        legalRepresentativeTitle: 'Gerente General',
      },
    });

    // 2. Actualizar plantillas existentes en BD que no tengan la firma estampada en el área de SATEM
    const versions = await prisma.documentTemplateVersion.findMany();
    for (const v of versions) {
      if (!v.htmlTemplate.includes(SATEM_SIGNATURE_BASE64)) {
        let updatedHtml = v.htmlTemplate;

        // Inyectar CSS de firma si no está
        if (!updatedHtml.includes('.sig-img')) {
          updatedHtml = updatedHtml.replace(
            /\.sig-space\s*\{[^}]*\}/g,
            '.sig-space { height: 44px; display: flex; align-items: flex-end; justify-content: center; }\n  .sig-img { max-height: 48px; max-width: 160px; object-fit: contain; margin-bottom: -6px; display: block; margin-left: auto; margin-right: auto; }'
          );
        }

        // Estampar firma en cajas de firma de SATEM
        updatedHtml = updatedHtml.replace(
          /(<strong>POR \/ FOR: \{\{empresa\.nombre\}\}<\/strong>[\s\S]*?<div class="sig-space">)(<\/div>)/gi,
          `$1<img src="${SATEM_SIGNATURE_BASE64}" class="sig-img" alt="Firma SATEM" />$2`
        );
        updatedHtml = updatedHtml.replace(
          /(<strong>POR: \{\{empresa\.nombre\}\}<\/strong>[\s\S]*?<div class="sig-space">)(<\/div>)/gi,
          `$1<img src="${SATEM_SIGNATURE_BASE64}" class="sig-img" alt="Firma SATEM" />$2`
        );
        updatedHtml = updatedHtml.replace(
          /(<strong>EMITIDO POR: \{\{empresa\.nombre\}\}<\/strong>[\s\S]*?<div class="sig-space">)(<\/div>)/gi,
          `$1<img src="${SATEM_SIGNATURE_BASE64}" class="sig-img" alt="Firma SATEM" />$2`
        );
        updatedHtml = updatedHtml.replace(
          /(<strong>AUTORIZADO POR: \{\{empresa\.nombre\}\}<\/strong>[\s\S]*?<div class="sig-space">)(<\/div>)/gi,
          `$1<img src="${SATEM_SIGNATURE_BASE64}" class="sig-img" alt="Firma SATEM" />$2`
        );
        updatedHtml = updatedHtml.replace(
          /(<strong>PRESENTADO POR: \{\{empresa\.nombre\}\}<\/strong>[\s\S]*?<div class="sig-space">)(<\/div>)/gi,
          `$1<img src="${SATEM_SIGNATURE_BASE64}" class="sig-img" alt="Firma SATEM" />$2`
        );

        if (updatedHtml !== v.htmlTemplate) {
          await prisma.documentTemplateVersion.update({
            where: { id: v.id },
            data: { htmlTemplate: updatedHtml },
          });
        }
      }
    }

    // 3. Regenerar automáticamente en disco todos los documentos existentes no firmados
    try {
      const { regenerateAllUnsignedDocumentPdfs } = await import('../../modules/document-instances/document-instances.controller.js');
      const regenResult = await regenerateAllUnsignedDocumentPdfs('[BOOTSTRAP]');
      if (regenResult.total > 0) {
        console.log(`[BOOTSTRAP] 📑 Documentos existentes procesados: ${regenResult.regenerated} regenerados con firma oficial, ${regenResult.skipped} omitidos, ${regenResult.errors} errores.`);
      }
    } catch (regenErr) {
      console.error('[BOOTSTRAP] ⚠️ Aviso al regenerar PDFs de instancias:', regenErr);
    }

    console.log('[BOOTSTRAP] ✅ Firma oficial de SATEM verificada y aplicada en todas las plantillas y documentos.');
  } catch (error) {
    console.error('[BOOTSTRAP] ⚠️ Advertencia al sincronizar firma corporativa de SATEM:', error);
  }
}

/**
 * Garantiza que existan todas las plantillas oficiales predeterminadas de SATEM
 * (Contrato SOW, Orden de Trabajo, Recepción Conforme, Propuesta Comercial, Cotización, etc.)
 */
export async function ensureDefaultTemplates(): Promise<void> {
  try {
    const { OFFICIAL_DEFAULT_TEMPLATES } = await import('./bootstrap-templates.js');
    const admin = await prisma.user.findFirst({ where: { role: UserRole.ADMIN, isActive: true } });
    const adminId = admin?.id || 'SYSTEM_BOOTSTRAP';

    for (const tpl of OFFICIAL_DEFAULT_TEMPLATES) {
      const existing = await prisma.documentTemplate.findUnique({
        where: { code: tpl.code },
        include: { versions: true },
      });

      if (!existing) {
        const created = await prisma.documentTemplate.create({
          data: {
            code: tpl.code,
            name: tpl.name,
            description: `Plantilla institucional SATEM para ${tpl.name}`,
            category: tpl.category,
            language: tpl.language,
            isActive: true,
            currentVersion: 1,
          },
        });

        await prisma.documentTemplateVersion.create({
          data: {
            templateId: created.id,
            versionNumber: 1,
            title: `${tpl.name} v1.0`,
            htmlTemplate: tpl.html,
            cssStyles: null,
            changeReason: 'Versión inicial oficial SATEM',
            isPublished: true,
            publishedAt: new Date(),
            publishedById: adminId,
          },
        });

        console.log(`[BOOTSTRAP] 📄 Plantilla oficial creada: ${tpl.name} (${tpl.code})`);
      } else if (existing.versions.length === 0) {
        await prisma.documentTemplateVersion.create({
          data: {
            templateId: existing.id,
            versionNumber: 1,
            title: `${tpl.name} v1.0`,
            htmlTemplate: tpl.html,
            cssStyles: null,
            changeReason: 'Versión inicial oficial SATEM',
            isPublished: true,
            publishedAt: new Date(),
            publishedById: adminId,
          },
        });
        console.log(`[BOOTSTRAP] 📄 Versión inicial agregada para plantilla: ${tpl.name} (${tpl.code})`);
      }
    }
  } catch (error) {
    console.error('[BOOTSTRAP] ⚠️ Advertencia al verificar plantillas oficiales:', error);
  }
}

/**
 * Garantiza que todos los clientes registrados en SATEM cuenten con un usuario de portal activo
 * visible en la administración de Usuarios Cliente.
 */
export async function ensureDefaultClientUsers(): Promise<void> {
  try {
    const customers = await prisma.customer.findMany({
      where: { deletedAt: null },
      include: { contacts: true },
    });

    const defaultPasswordHash = await bcrypt.hash('Cliente@123', 10);

    for (const customer of customers) {
      const email = (customer.email || customer.contacts?.[0]?.email || '').toLowerCase().trim();
      if (!email) continue;

      const existingUser = await prisma.clientUser.findFirst({
        where: {
          OR: [
            { email },
            { customerId: customer.id },
          ],
          deletedAt: null,
        },
      });

      if (!existingUser) {
        const fullName = customer.contacts?.[0]?.name || customer.legalName;
        await prisma.clientUser.create({
          data: {
            email,
            passwordHash: defaultPasswordHash,
            fullName,
            phone: customer.phone || customer.contacts?.[0]?.phone || null,
            customerId: customer.id,
            isActive: true,
          },
        });
        console.log(`[BOOTSTRAP] 👤 Usuario cliente del portal creado: ${fullName} <${email}> para cliente ${customer.legalName}`);
      } else if (!existingUser.isActive) {
        await prisma.clientUser.update({
          where: { id: existingUser.id },
          data: { isActive: true },
        });
      }
    }
  } catch (error) {
    console.error('[BOOTSTRAP] ⚠️ Advertencia al verificar usuarios cliente iniciales:', error);
  }
}

