import { prisma } from '../../config/prisma.js';

interface ExchangeRateResult {
  currencyFrom: string;
  currencyTo: string;
  rate: number;
  rateDate: string;
  source: string;
  isLive: boolean;
}

// Caché en memoria para evitar saturar la API externa
let cachedRate: { data: ExchangeRateResult; timestamp: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos

export async function getUsdToClpExchangeRate(): Promise<ExchangeRateResult> {
  const now = Date.now();

  // 1. Revisar caché en memoria
  if (cachedRate && (now - cachedRate.timestamp) < CACHE_TTL_MS) {
    return cachedRate.data;
  }

  // 2. Intentar consultar API de mindicador.cl (Dólar Observado oficial)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://mindicador.cl/api/dolar', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', 'User-Agent': 'SATEM-Control/1.0' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data: any = await response.json();
      const rawVal = data?.serie?.[0]?.valor || data?.valor;
      const rawDate = data?.serie?.[0]?.fecha || data?.fecha || new Date().toISOString();

      if (rawVal && typeof rawVal === 'number' && rawVal > 0) {
        const result: ExchangeRateResult = {
          currencyFrom: 'USD',
          currencyTo: 'CLP',
          rate: rawVal,
          rateDate: new Date(rawDate).toISOString(),
          source: 'mindicador.cl (Banco Central de Chile)',
          isLive: true,
        };

        // Guardar en caché
        cachedRate = { data: result, timestamp: now };

        // Guardar/actualizar en base de datos de forma asíncrona
        prisma.exchangeRate.upsert({
          where: {
            currencyFrom_currencyTo_rateDate_source: {
              currencyFrom: 'USD',
              currencyTo: 'CLP',
              rateDate: new Date(rawDate),
              source: 'mindicador.cl',
            },
          },
          update: { rate: rawVal },
          create: {
            currencyFrom: 'USD',
            currencyTo: 'CLP',
            rate: rawVal,
            rateDate: new Date(rawDate),
            source: 'mindicador.cl',
          },
        }).catch((err) => console.warn('No se pudo persistir tipo de cambio en BD:', err.message));

        return result;
      }
    }
  } catch (err: any) {
    console.warn('Fallo consulta a API externa de tipo de cambio, recurriendo a base de datos / fallback:', err.message);
  }

  // 3. Fallback: Buscar último tipo de cambio guardado en base de datos
  try {
    const lastInDb = await prisma.exchangeRate.findFirst({
      where: { currencyFrom: 'USD', currencyTo: 'CLP' },
      orderBy: { rateDate: 'desc' },
    });

    if (lastInDb) {
      const result: ExchangeRateResult = {
        currencyFrom: 'USD',
        currencyTo: 'CLP',
        rate: Number(lastInDb.rate),
        rateDate: lastInDb.rateDate.toISOString(),
        source: `${lastInDb.source} (Guardado en BD)`,
        isLive: false,
      };
      cachedRate = { data: result, timestamp: now };
      return result;
    }
  } catch (dbErr: any) {
    console.warn('Error al consultar ExchangeRate en BD:', dbErr.message);
  }

  // 4. Fallback estático de seguridad si BD y API fallan
  const fallbackResult: ExchangeRateResult = {
    currencyFrom: 'USD',
    currencyTo: 'CLP',
    rate: 955.0,
    rateDate: new Date().toISOString(),
    source: 'Valor de Referencia Contingencia',
    isLive: false,
  };
  return fallbackResult;
}
