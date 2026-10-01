import { z } from 'zod';

export const signDocumentSchema = z.object({
  signatureBase64: z.string().min(20),
  signerName: z.string().optional(),
});

export const requestSignatureSchema = z.object({
  documentInstanceId: z.string().uuid(),
  notifyClientEmail: z.boolean().default(true),
});
