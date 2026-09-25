import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Calculator, RefreshCw, Copy, Check, Info, DollarSign,
  Sparkles, Edit2
} from 'lucide-react';

interface SumUpCalculatorProps {
  initialAmountUsd?: number | string;
  expedientCode?: string;
  customerName?: string;
  sumupLink?: string;
  compact?: boolean;
}

export const SumUpCalculator: React.FC<SumUpCalculatorProps> = ({
  initialAmountUsd = '',
  expedientCode,
  customerName,
  sumupLink = '',
  compact = false,
}) => {
  const [amountUsd, setAmountUsd] = useState<string>(String(initialAmountUsd || ''));
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [rateSource, setRateSource] = useState<string>('Consultando...');
  const [rateDate, setRateDate] = useState<string>('');
  const [isLiveRate, setIsLiveRate] = useState<boolean>(true);
  const [isCustomRate, setIsCustomRate] = useState<boolean>(false);
  const [customRateInput, setCustomRateInput] = useState<string>('');
  const [feePercent] = useState<number>(3.8085); // Tarjetas Internacionales (3.2% + 19% IVA)
  const [loadingRate, setLoadingRate] = useState<boolean>(false);
  const [copiedMonto, setCopiedMonto] = useState<boolean>(false);
  const [copiedMensaje, setCopiedMensaje] = useState<boolean>(false);

  const fetchExchangeRate = async () => {
    setLoadingRate(true);
    try {
      const res = await api.get('/exchange-rates/usd');
      if (res.data?.data) {
        const d = res.data.data;
        setExchangeRate(Number(d.rate));
        setRateSource(d.source);
        setRateDate(d.rateDate);
        setIsLiveRate(Boolean(d.isLive));
        setCustomRateInput(String(d.rate));
      }
    } catch (err) {
      console.warn('Error al obtener tipo de cambio:', err);
      // Fallback local seguro
      if (!exchangeRate) {
        setExchangeRate(955.0);
        setRateSource('Valor de contingencia');
        setIsLiveRate(false);
        setCustomRateInput('955');
      }
    } finally {
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  useEffect(() => {
    if (initialAmountUsd) {
      setAmountUsd(String(initialAmountUsd));
    }
  }, [initialAmountUsd]);

  const activeRate = isCustomRate ? (parseFloat(customRateInput) || 0) : exchangeRate;
  const numAmount = parseFloat(amountUsd) || 0;
  const montoLinkClp = Math.round(numAmount * activeRate);
  const comisionClp = Math.round(montoLinkClp * (feePercent / 100));
  const montoNetoEstimado = montoLinkClp - comisionClp;

  const handleCopyMonto = () => {
    if (montoLinkClp <= 0) return;
    navigator.clipboard.writeText(String(montoLinkClp));
    setCopiedMonto(true);
    setTimeout(() => setCopiedMonto(false), 2000);
  };

  const handleCopyMensaje = () => {
    if (numAmount <= 0 || montoLinkClp <= 0) return;

    const linkText = sumupLink ? `\n• Link directo de pago: ${sumupLink}` : '';
    const expText = expedientCode ? ` [Expediente: ${expedientCode}]` : '';
    const clientGreeting = customerName ? `Estimado(s) ${customerName},` : 'Estimado cliente,';

    const text = `${clientGreeting}\n\nAdjuntamos el detalle oficial para el pago de su servicio${expText}:\n` +
      `• Monto acordado: $${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD\n` +
      `• Tipo de cambio aplicado: $${activeRate.toLocaleString('es-CL', { minimumFractionDigits: 2 })} CLP/USD (Dólar Observado)\n` +
      `• Total a pagar en Link SumUp: $${montoLinkClp.toLocaleString('es-CL')} CLP${linkText}\n\n` +
      `ℹ️ Nota importante: La pasarela procesa el cobro en Pesos Chilenos (CLP) al tipo de cambio oficial del día. Su banco emisor internacional podría aplicar un cargo independiente por conversión de divisas de hasta un 3%.\n\n` +
      `Agradecemos enviar el comprobante tras concretar el pago.`;

    navigator.clipboard.writeText(text);
    setCopiedMensaje(true);
    setTimeout(() => setCopiedMensaje(false), 2500);
  };

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: compact ? '16px' : '24px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ backgroundColor: 'rgba(0,168,150,0.15)', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
            <Calculator size={18} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>Calculadora Dinámica SumUp Links</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Conversión USD → CLP con Dólar Observado en tiempo real</div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchExchangeRate}
          disabled={loadingRate}
          className="btn btn-secondary"
          style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
          title="Actualizar Dólar Observado"
        >
          <RefreshCw size={12} className={loadingRate ? 'animate-spin' : ''} />
          {loadingRate ? 'Consultando...' : 'Actualizar Dólar'}
        </button>
      </div>

      <div className={compact ? "" : "grid-split"} style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : undefined, gap: '24px' }}>
        {/* Columna Izquierda: Parámetros */}
        <div>
          {/* Campo USD */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DollarSign size={13} color="var(--accent-primary)" /> Monto Acordado con Cliente (USD)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="0.01"
                placeholder="Ej: 100.00"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                className="form-input"
                style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', paddingLeft: '28px' }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>$</span>
            </div>
          </div>

          {/* Tipo de Cambio Dólar */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ fontSize: '12px', margin: 0 }}>
                Tipo de Cambio Dólar (CLP/USD)
              </label>
              <button
                type="button"
                onClick={() => setIsCustomRate(!isCustomRate)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Edit2 size={11} /> {isCustomRate ? 'Usar Dólar Oficial' : 'Editar Manual'}
              </button>
            </div>

            {isCustomRate ? (
              <input
                type="number"
                step="0.01"
                value={customRateInput}
                onChange={(e) => setCustomRateInput(e.target.value)}
                className="form-input"
                style={{ borderColor: 'var(--warning)' }}
                placeholder="Ingrese tasa manual"
              />
            ) : (
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  ${exchangeRate.toLocaleString('es-CL', { minimumFractionDigits: 2 })} CLP
                </span>
                <span className={`badge ${isLiveRate ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '10.5px' }}>
                  {isLiveRate ? '🟢 Dólar Observado' : 'Base Local'}
                </span>
              </div>
            )}

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Fuente: {rateSource} {rateDate && `• ${new Date(rateDate).toLocaleDateString('es-CL')}`}
            </div>
          </div>

          {/* Tarifa de comisión */}
          <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Comisión SumUp Internacional:</span>
              <strong style={{ color: 'var(--text-primary)' }}>3.20% + IVA (3.8085% final)</strong>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Desglose y Acciones */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div
            style={{
              padding: '18px',
              backgroundColor: 'rgba(0, 168, 150, 0.04)',
              border: '1px solid var(--accent-primary)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {/* Monto a Registrar en SumUp */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Monto Exacto a Colocar en Link SumUp:
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>
                  ${montoLinkClp.toLocaleString('es-CL')}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>CLP</span>
              </div>
            </div>

            {/* Desglose de Liquidación */}
            <div className="grid-form-2" style={{ gap: '10px', paddingTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Abono Líquido en Banco (96.19%):</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>
                  ${montoNetoEstimado.toLocaleString('es-CL')} CLP
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Comisión SumUp Descontada:</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--danger)', marginTop: '2px' }}>
                  -${comisionClp.toLocaleString('es-CL')} CLP
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer comercial */}
          <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Info size={15} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '11px', color: '#fef08a', lineHeight: '1.4' }}>
              El cobro final en el link se procesará en CLP al tipo de cambio de hoy. Su banco internacional podría aplicar un cargo por conversión de hasta un 3% adicional de forma independiente.
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCopyMonto}
              disabled={montoLinkClp <= 0}
              className="btn btn-secondary"
              style={{ flex: '1 1 140px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {copiedMonto ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
              {copiedMonto ? '¡Monto Copiado!' : 'Copiar Monto CLP'}
            </button>

            <button
              type="button"
              onClick={handleCopyMensaje}
              disabled={montoLinkClp <= 0 || numAmount <= 0}
              className="btn btn-primary"
              style={{ flex: '1 1 180px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {copiedMensaje ? <Check size={14} /> : <Sparkles size={14} />}
              {copiedMensaje ? '¡Mensaje Copiado!' : 'Copiar Detalle Cliente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
