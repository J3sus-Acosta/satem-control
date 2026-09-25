import puppeteer from 'puppeteer';
import crypto from 'crypto';

export interface ImageToPdfOptions {
  imageBuffer: Buffer;
  mimeType: string;
  originalFileName: string;
  docTitle: string;
  docSubtitle?: string;
  metadata: Array<{ label: string; value: string }>;
}

export async function convertImageToPdf(options: ImageToPdfOptions): Promise<{ pdfBuffer: Buffer; imageSha256: string }> {
  const { imageBuffer, mimeType, originalFileName, docTitle, docSubtitle, metadata } = options;

  const imageSha256 = crypto.createHash('sha256').update(imageBuffer).digest('hex');
  const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

  const rowsHtml = metadata
    .map(
      (m) => `
      <div class="meta-item">
        <span class="meta-label">${m.label}:</span>
        <span class="meta-value">${m.value}</span>
      </div>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.4;
      font-size: 12px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #00a896;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .doc-badge {
      background: #0f172a;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: right;
    }
    .doc-badge .sub {
      font-size: 9px;
      color: #94a3b8;
      font-weight: normal;
      display: block;
      margin-top: 2px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 14px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 16px;
    }
    .meta-item {
      display: flex;
      font-size: 11px;
    }
    .meta-label {
      font-weight: 700;
      color: #475569;
      width: 140px;
      flex-shrink: 0;
    }
    .meta-value {
      color: #0f172a;
      word-break: break-all;
    }
    .image-container {
      text-align: center;
      margin-top: 8px;
      padding: 10px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
    }
    .image-container img {
      max-width: 100%;
      max-height: 680px;
      object-fit: contain;
      border-radius: 4px;
      display: inline-block;
    }
    .footer {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #64748b;
    }
    .sha-code {
      font-family: monospace;
      font-size: 9px;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">SATEM CONTROL</div>
      <div class="brand-subtitle">SATEM Soluciones Inteligentes SpA • RUT 77.654.321-K</div>
    </div>
    <div class="doc-badge">
      ${docTitle}
      ${docSubtitle ? `<span class="sub">${docSubtitle}</span>` : ''}
    </div>
  </div>

  <div class="meta-box">
    ${rowsHtml}
    <div class="meta-item" style="grid-column: span 2;">
      <span class="meta-label">SHA-256 Imagen:</span>
      <span class="meta-value sha-code">${imageSha256}</span>
    </div>
  </div>

  <div class="image-container">
    <img src="${base64Image}" alt="${originalFileName}" />
  </div>

  <div class="footer">
    <div>Documento de Auditoría SATEM • Generado automáticamente</div>
    <div>Archivo Original: <strong>${originalFileName}</strong></div>
  </div>
</body>
</html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfUint8 = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '12mm',
      right: '12mm',
    },
    preferCSSPageSize: true,
  });
  await browser.close();

  return {
    pdfBuffer: Buffer.from(pdfUint8),
    imageSha256,
  };
}
