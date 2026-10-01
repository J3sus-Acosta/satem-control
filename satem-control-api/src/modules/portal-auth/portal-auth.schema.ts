import { z } from 'zod';

export const portalLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  fullName: z.string().optional(),
  phone: z.string().optional(),
});

export const portalUpdateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});
