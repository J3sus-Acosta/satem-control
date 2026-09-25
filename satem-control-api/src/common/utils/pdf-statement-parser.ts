import { PDFParse } from 'pdf-parse';

export interface SantanderMovement {
  transactionDate: Date;
  description: string;
  amountClp: number;
  saldoClp?: number;
  referenceNumber: string;
  sucursal?: string;
  isCargo: boolean;
  isAbono: boolean;
}

export interface SantanderParsedCartola {
  bankName: string;
  accountNumber: string;
  companyName: string;
  companyRut: string;
  periodStart?: Date;
  periodEnd?: Date;
  movements: SantanderMovement[];
}

export interface SumUpParsedReport {
  merchantId?: string;
  companyRut?: string;
  periodDate?: Date;
  grossAmount: number;     // Pagos con tarjeta / Monto total
  feeAmount: number;       // Comisiones de procesamiento
  netAmount: number;       // Cantidad pagada / Depósito
  referenceNumber?: string; // e.g. MSE PID1772959
  destinationAccount?: string; // e.g. 77** **32
  currency: string;
}

function normalizePdfText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[\uE000-\uF8FF]/g, '-') // Replace private use unicode (like \uE088 for hyphen)
    .replace(/[–—−]/g, '-')
    .replace(/[\t\r]/g, ' ')
    .replace(/[ \u00A0]+/g, ' ');
}

function parseClpNumber(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/[$|\s\.]/g, '').replace(/,/g, '.');
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : Math.round(val);
}

function parseDateDDMMYYYY(str: string): Date | null {
  if (!str) return null;
  const match = str.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Parsea el PDF estándar de Cartola Histórica de Banco Santander Chile
 */
export async function parseSantanderPdfCartola(buffer: Buffer): Promise<SantanderParsedCartola> {
  const parser = new PDFParse({ data: buffer });
  const pdfText = await parser.getText();
  const normalized = normalizePdfText(pdfText.text || '');
  const rawLines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);

  let accountNumber = 'Santander Cta Cte 0-000-7790953-2';
  let companyName = 'SATEM SOLUCIONES INTELIGENTES SPA';
  let companyRut = '77.144.552-7';
  let periodStart: Date | undefined;
  let periodEnd: Date | undefined;

  // 1. Extraer metadatos de cabecera
  for (const line of rawLines) {
    if (line.includes('Cuenta:') || line.includes('Cuenta :')) {
      const accMatch = line.match(/Cuenta\s*:\s*([0-9\-]+)/i);
      if (accMatch) {
        accountNumber = `Santander Cta Cte ${accMatch[1]}`;
      }
    }
    if (line.includes('RUT empresa:') || line.includes('RUT empresa :')) {
      const rutMatch = line.match(/RUT\s*empresa\s*:\s*([0-9\.\-kK]+)/i);
      if (rutMatch) {
        companyRut = rutMatch[1];
      }
    }
    if (line.includes('Empresa:') || line.includes('Empresa :')) {
      const empMatch = line.match(/Empresa\s*:\s*([^RUT\n]+)/i);
      if (empMatch) {
        companyName = empMatch[1].trim();
      }
    }
    if (line.includes('Fecha desde:') && line.includes('Fecha hasta:')) {
      const f1Match = line.match(/Fecha\s*desde\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
      const f2Match = line.match(/Fecha\s*hasta\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
      if (f1Match) periodStart = parseDateDDMMYYYY(f1Match[1]) || undefined;
      if (f2Match) periodEnd = parseDateDDMMYYYY(f2Match[1]) || undefined;
    }
  }

  // 2. Unificar líneas de "Detalle movimientos"
  // En el PDF de Santander, los movimientos empiezan con DD/MM/YYYY y pueden continuarse en la línea siguiente
  const movements: SantanderMovement[] = [];
  let inMovementsSection = false;
  const movementBlocks: string[] = [];
  let currentBlock = '';

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    if (line.includes('Detalle movimientos')) {
      inMovementsSection = true;
      continue;
    }
    if (inMovementsSection && (line.includes('Resumen comisiones') || line.includes('Saldos diarios') || line.includes('Nota: Información'))) {
      if (currentBlock) {
        movementBlocks.push(currentBlock);
        currentBlock = '';
      }
      inMovementsSection = false;
      break;
    }
    if (!inMovementsSection) continue;
    if (line.startsWith('FECHA') && line.includes('CARGO')) continue;

    // Si la línea empieza con una fecha DD/MM/YYYY es el inicio de una nueva transacción
    if (/^\d{2}\/\d{2}\/\d{4}/.test(line)) {
      if (currentBlock) {
        movementBlocks.push(currentBlock);
      }
      currentBlock = line;
    } else if (currentBlock) {
      // Es la continuación (por ej: segunda parte del nombre/sucursal)
      currentBlock += ' ' + line;
    }
  }
  if (currentBlock) {
    movementBlocks.push(currentBlock);
  }

  // 3. Procesar cada bloque de movimiento
  for (const block of movementBlocks) {
    const dateMatch = block.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+)$/);
    if (!dateMatch) continue;

    const dateStr = dateMatch[1];
    const transDate = parseDateDDMMYYYY(dateStr);
    if (!transDate) continue;

    const rest = dateMatch[2].trim();
    // Buscar todos los montos con $
    const dollarMatches = Array.from(rest.matchAll(/\$\s*([\d\.]+)/g));
    if (dollarMatches.length === 0) continue;

    const firstAmountVal = parseClpNumber(dollarMatches[0][1]);
    const saldoVal = dollarMatches.length > 1 ? parseClpNumber(dollarMatches[1][1]) : undefined;

    // Identificar N° DOC y Sucursal al final
    // En Santander suele ser: "... <saldo> <N° DOC (ej 001000046 o 000000 o 0)> <SUCURSAL (ej Agustinas o CERRO EL PLOMO)>"
    const endMatch = rest.match(/(\d{1,12})\s+([A-Za-z0-9\.\s]+)$/);
    let referenceNumber = '';
    let sucursal = '';
    if (endMatch) {
      referenceNumber = endMatch[1];
      sucursal = endMatch[2].trim();
    }

    // Determinar si es Cargo o Abono
    // En Santander:
    // Cargos habituales: 'Compra', 'PAGO EN LINEA', 'Transf a' (saliente), 'Anulación Rev.'
    // Abonos habituales: 'Transf. SUMUP', 'Reverso', 'Transf. Jesus Alberto A' (entrante)
    const lower = rest.toLowerCase();
    let isCargo = false;
    let isAbono = true;

    if (
      lower.includes('compra ') ||
      lower.includes('pago en linea') ||
      lower.includes('anulación') ||
      lower.includes('anulacion') ||
      lower.includes('transf a ') ||
      lower.includes('cargo')
    ) {
      if (!lower.includes('sumup') && !lower.includes('reverso')) {
        isCargo = true;
        isAbono = false;
      }
    }

    if (lower.includes('sumup') || lower.includes('abono') || lower.includes('reverso')) {
      isAbono = true;
      isCargo = false;
    }

    // Limpiar descripción
    let cleanDesc = rest
      .replace(/\$\s*[\d\.]+/g, '')
      .replace(new RegExp(`${referenceNumber}\\s*${sucursal}$`), '')
      .replace(/\s+/g, ' ')
      .trim();

    const signedAmount = isCargo ? -firstAmountVal : firstAmountVal;

    movements.push({
      transactionDate: transDate,
      description: cleanDesc || 'Movimiento Santander',
      amountClp: signedAmount,
      saldoClp: saldoVal,
      referenceNumber,
      sucursal,
      isCargo,
      isAbono,
    });
  }

  return {
    bankName: 'Banco Santander Chile',
    accountNumber,
    companyName,
    companyRut,
    periodStart,
    periodEnd,
    movements,
  };
}

/**
 * Parsea el PDF estándar de "Informe de Depósitos" de SumUp Chile
 */
export async function parseSumupPdfReport(buffer: Buffer): Promise<SumUpParsedReport> {
  const parser = new PDFParse({ data: buffer });
  const pdfText = await parser.getText();
  const normalized = normalizePdfText(pdfText.text || '');
  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);

  let merchantId = '';
  let companyRut = '';
  let periodDate: Date | undefined;
  let grossAmount = 0;
  let feeAmount = 0;
  let netAmount = 0;
  let referenceNumber = '';
  let destinationAccount = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('ID del comercio:') || line.includes('ID del comercio :')) {
      const match = line.match(/ID\s*del\s*comercio\s*:\s*([A-Za-z0-9]+)/i);
      if (match) merchantId = match[1];
    }
    if (line.includes('RUT Empresa:') || line.includes('RUT Empresa :')) {
      const match = line.match(/RUT\s*Empresa\s*:\s*([0-9\.\-kK]+)/i);
      if (match && match[1] !== '-') companyRut = match[1];
    }
    if (line.includes('Periodo:') || line.includes('Periodo :')) {
      const match = line.match(/Periodo\s*:\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
      if (match) periodDate = parseDateDDMMYYYY(match[1]) || undefined;
    }

    // Pagos con tarjeta procesados / Monto total
    if (line.includes('Pagos con tarjeta') || line.includes('Monto total') || line.includes('Total de todos los pagos brutos')) {
      for (let j = i; j < Math.min(i + 4, lines.length); j++) {
        const m = lines[j].match(/\$\s*([\d\.]+)/);
        if (m && grossAmount === 0) {
          grossAmount = parseClpNumber(m[1]);
          break;
        }
      }
    }

    // Comisiones de procesamiento de SumUp
    if (line.includes('Comisiones de procesamiento') || line.includes('Comisiones')) {
      for (let j = i; j < Math.min(i + 4, lines.length); j++) {
        const m = lines[j].match(/\$\s*([\d\.]+)/);
        if (m && feeAmount === 0 && parseClpNumber(m[1]) !== grossAmount) {
          feeAmount = parseClpNumber(m[1]);
          break;
        }
      }
    }

    // Cantidad pagada / Depósito neto
    if (line.includes('Cantidad pagada') || line.includes('Depósito') || line.includes('El monto depositado en tu')) {
      for (let j = i; j < Math.min(i + 4, lines.length); j++) {
        const m = lines[j].match(/\$\s*([\d\.]+)/);
        if (m && netAmount === 0 && parseClpNumber(m[1]) !== grossAmount && parseClpNumber(m[1]) !== feeAmount) {
          netAmount = parseClpNumber(m[1]);
          break;
        }
      }
    }

    // Referencia SumUp genérica o PID
    if (!referenceNumber) {
      const pidMatch = line.match(/(MSE\s*PID\d{6,12})/i) || line.match(/(PID\d{6,12})/i);
      if (pidMatch) referenceNumber = pidMatch[1].replace(/\s+/g, ' ');
    }

    // Cuenta destino (ej 77** **32)
    if (!destinationAccount) {
      const destMatch = line.match(/([0-9\*]{2,}\s+[0-9\*]{2,})/);
      if (destMatch && (line.includes('$') || line.includes('PID') || line.includes('MSE'))) {
        destinationAccount = destMatch[1];
      }
    }
  }

  // Fallback si gross, fee o net falta
  if (feeAmount === 0 && grossAmount > 0 && netAmount > 0 && grossAmount > netAmount) {
    feeAmount = grossAmount - netAmount;
  }
  if (netAmount === 0 && grossAmount > 0 && feeAmount > 0) {
    netAmount = grossAmount - feeAmount;
  }
  if (grossAmount === 0 && netAmount > 0 && feeAmount > 0) {
    grossAmount = netAmount + feeAmount;
  }

  return {
    merchantId,
    companyRut,
    periodDate,
    grossAmount,
    feeAmount,
    netAmount,
    referenceNumber,
    destinationAccount,
    currency: 'CLP',
  };
}
