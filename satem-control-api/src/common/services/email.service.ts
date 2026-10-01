import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../../config/env.js';

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }

  private async sendMail(options: { to: string; subject: string; html: string }) {
    if (!this.transporter) {
      console.log(`📧 [EMAIL SIMULADO] Para: ${options.to} | Asunto: ${options.subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`📧 [EMAIL ENVIADO] Para: ${options.to} | Asunto: ${options.subject}`);
    } catch (error) {
      console.error('❌ Error enviando email:', error);
    }
  }

  async sendInvitation(to: string, inviteUrl: string, customerName: string, userName: string) {
    const subject = `Invitación al Portal de Clientes SATEM — ${customerName}`;
    const html = `
      <div style="font-family: 'Inter', -apple-system, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
            <h2 style="color: #00a896; margin: 0; font-size: 22px;">SATEM Control</h2>
          </div>
          <h3 style="color: #f8fafc; margin-top: 0;">¡Hola, ${userName}!</h3>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            Se ha creado tu cuenta de acceso al Portal de Clientes de <strong>SATEM Soluciones Inteligentes SpA</strong> para la empresa <strong>${customerName}</strong>.
          </p>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            Desde este portal podrás consultar el estado de tus expedientes, órdenes de trabajo, atenciones técnicas, firmar documentos y descargar expedientes en formato ZIP.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteUrl}" style="background-color: #00a896; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
              Activar Mi Cuenta y Definir Contraseña
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br />
            <a href="${inviteUrl}" style="color: #00a896; word-break: break-all;">${inviteUrl}</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
            SATEM Soluciones Inteligentes SpA — Sistema de Trazabilidad y Control Operativo
          </p>
        </div>
      </div>
    `;
    await this.sendMail({ to, subject, html });
  }

  async sendDocumentReady(to: string, documentName: string, expedientCode: string, portalUrl: string) {
    const subject = `Nuevo documento disponible: ${documentName} (${expedientCode})`;
    const html = `
      <div style="font-family: 'Inter', -apple-system, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px;">
          <h2 style="color: #00a896; margin: 0 0 20px 0;">SATEM Control</h2>
          <h3 style="color: #f8fafc; margin-top: 0;">Documento Generado</h3>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            Se ha emitido un nuevo documento oficial asociado al expediente <strong>${expedientCode}</strong>:
          </p>
          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #f8fafc; font-weight: 600;">📄 ${documentName}</p>
          </div>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${portalUrl}" style="background-color: #00a896; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Ver en el Portal
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">SATEM Soluciones Inteligentes SpA</p>
        </div>
      </div>
    `;
    await this.sendMail({ to, subject, html });
  }

  async sendSignatureRequest(to: string, documentName: string, expedientCode: string, signUrl: string) {
    const subject = `Solicitud de Firma Requerida: ${documentName} (${expedientCode})`;
    const html = `
      <div style="font-family: 'Inter', -apple-system, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px;">
          <h2 style="color: #00a896; margin: 0 0 20px 0;">SATEM Control</h2>
          <h3 style="color: #f8fafc; margin-top: 0;">Firma de Documento Requerida ✍️</h3>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            Tiene un documento pendiente de firma electrónica en el expediente <strong>${expedientCode}</strong>:
          </p>
          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #f8fafc; font-weight: 600;">📝 ${documentName}</p>
          </div>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${signUrl}" style="background-color: #00a896; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Firmar Documento Online
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">SATEM Soluciones Inteligentes SpA</p>
        </div>
      </div>
    `;
    await this.sendMail({ to, subject, html });
  }

  async sendExpedientStatusChange(to: string, expedientCode: string, title: string, status: string, portalUrl: string) {
    const subject = `Actualización de Expediente ${expedientCode}: ${status}`;
    const html = `
      <div style="font-family: 'Inter', -apple-system, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px;">
          <h2 style="color: #00a896; margin: 0 0 20px 0;">SATEM Control</h2>
          <h3 style="color: #f8fafc; margin-top: 0;">Estado de Expediente Actualizado</h3>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            El expediente <strong>${expedientCode}</strong> (<em>${title}</em>) ha cambiado de estado a: <strong style="color: #00a896;">${status}</strong>.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${portalUrl}" style="background-color: #00a896; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Ver Detalles del Expediente
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">SATEM Soluciones Inteligentes SpA</p>
        </div>
      </div>
    `;
    await this.sendMail({ to, subject, html });
  }
}

export const emailService = new EmailService();
