import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { UserRole } from '@prisma/client';
import { SATEM_SIGNATURE_BASE64 } from '../../assets/signatures.js';
import { LOGO_FULL_BASE64, LOGO_SHORT_BASE64 } from '../../assets/logos.js';

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
