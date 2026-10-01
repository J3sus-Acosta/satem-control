import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface StampSignatureOptions {
  pdfBuffer: Buffer;
  signaturePngBuffer: Buffer;
  signerName: string;
  signerRole: 'CLIENT' | 'SATEM';
  signerEmail?: string;
  ipAddress?: string;
  signedAt?: Date;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export async function stampSignatureOnPdf(options: StampSignatureOptions): Promise<{ pdfBuffer: Buffer; sha256: string }> {
  const {
    pdfBuffer,
    signaturePngBuffer,
    signerName,
    signerRole,
    signerEmail,
    ipAddress,
    signedAt = new Date(),
  } = options;

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { width: pageWidth, height: pageHeight } = lastPage.getSize();

  const pngImage = await pdfDoc.embedPng(signaturePngBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Dimensiones y posiciones
  const sigWidth = options.width || 180;
  const sigHeight = options.height || 60;

  // Si es CLIENT, estampar a la derecha; si es SATEM, a la izquierda
  let targetX = options.x;
  let targetY = options.y;

  if (targetX === undefined) {
    targetX = signerRole === 'CLIENT' ? pageWidth - sigWidth - 50 : 50;
  }
  if (targetY === undefined) {
    targetY = 80;
  }

  // Dibujar la imagen de la firma manuscrita
  lastPage.drawImage(pngImage, {
    x: targetX,
    y: targetY,
    width: sigWidth,
    height: sigHeight,
  });

  // Dibujar metadata debajo de la firma
  const metaY = targetY - 12;
  const dateStr = signedAt.toLocaleString('es-CL', { timeZone: 'America/Santiago' });
  const roleLabel = signerRole === 'CLIENT' ? 'Firma Cliente / Aceptación' : 'Firma SATEM SpA';

  lastPage.drawText(signerName, {
    x: targetX,
    y: metaY,
    size: 8,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });

  lastPage.drawText(`${roleLabel} • ${dateStr}`, {
    x: targetX,
    y: metaY - 9,
    size: 6.5,
    font: font,
    color: rgb(0.3, 0.4, 0.5),
  });

  if (ipAddress) {
    lastPage.drawText(`IP: ${ipAddress}`, {
      x: targetX,
      y: metaY - 17,
      size: 5.5,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const modifiedPdfBytes = await pdfDoc.save();
  const finalBuffer = Buffer.from(modifiedPdfBytes);
  const sha256 = crypto.createHash('sha256').update(finalBuffer).digest('hex');

  return {
    pdfBuffer: finalBuffer,
    sha256,
  };
}
