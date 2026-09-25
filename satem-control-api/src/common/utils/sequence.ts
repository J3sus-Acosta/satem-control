import { Prisma } from '@prisma/client';

export type SequencePrefix = 'EXP' | 'COT' | 'OT' | 'AT' | 'SOW' | 'RC' | 'FAC' | 'PAY' | 'SUM' | 'BR' | 'SRV' | 'PROP' | 'DOC';

/**
 * Genera un correlativo transaccional bloqueando pesimistamente la fila en MySQL (FOR UPDATE)
 * Formato: PREFIX-YYYY-NNNNNN (ej. EXP-2026-000001)
 */
export async function generateSequence(
  tx: Prisma.TransactionClient,
  prefix: SequencePrefix,
  year: number = new Date().getFullYear()
): Promise<string> {
  // Aseguramos existencia del registro de secuencia de forma atómica
  await tx.$executeRaw`
    INSERT INTO sequences (prefix, year, currentValue)
    VALUES (${prefix}, ${year}, 0)
    ON DUPLICATE KEY UPDATE prefix = prefix;
  `;

  // Lock FOR UPDATE
  await tx.$executeRaw`
    SELECT * FROM sequences 
    WHERE prefix = ${prefix} AND year = ${year} 
    FOR UPDATE;
  `;

  const updatedSeq = await tx.sequence.update({
    where: {
      prefix_year: { prefix, year },
    },
    data: {
      currentValue: { increment: 1 },
    },
  });

  const padded = String(updatedSeq.currentValue).padStart(6, '0');
  return `${prefix}-${year}-${padded}`;
}
