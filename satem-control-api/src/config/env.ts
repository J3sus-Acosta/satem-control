import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000').transform((v) => parseInt(v, 10)),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().default('satem_jwt_secret_default_key'),
  JWT_REFRESH_SECRET: z.string().default('satem_refresh_secret_default_key'),
  COOKIE_SECRET: z.string().default('satem_cookie_secret_default_key'),
  STORAGE_PATH: z.string().default(path.join(process.cwd(), 'storage')),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  PORTAL_BASE_URL: z.string().default('http://localhost:5173/portal'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.string().default('587').transform((v) => parseInt(v, 10)),
  SMTP_SECURE: z.string().default('false').transform((v) => v === 'true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM_NAME: z.string().default('SATEM Soluciones'),
  SMTP_FROM_EMAIL: z.string().default('notificaciones@satemsoluciones.com'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Variables de entorno inválidas:', _env.error.format());
  throw new Error('Variables de entorno no válidas');
}

export const env = _env.data;
