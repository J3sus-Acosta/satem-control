import { z } from 'zod';

export const createClientUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  customerId: z.string().uuid(),
  initialPassword: z.string().min(6).optional(),
  sendInviteEmail: z.boolean().default(true),
  allowedEntityIds: z.array(z.string().uuid()).optional(),
});

export const updateClientUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
  allowedEntityIds: z.array(z.string().uuid()).optional(),
});

export const setEntityAccessSchema = z.object({
  entityIds: z.array(z.string().uuid()),
});
