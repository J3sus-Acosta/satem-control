import React, { useState } from 'react';
import { api } from '../services/api';
import { Calculator, FileSpreadsheet, DollarSign, ArrowRight } from 'lucide-react';

export const BillingPage: React.FC = () => {
  // Calculadora SumUp State
  const [requestedAmount, setRequestedAmount] = useState('1000');
  const [exchangeRate, setExchangeRate] = useState('940.50');
  const [feePercent, setFeePercent] = useState('3.5');
  const [calcResult, setCalcResult] = useState<any>(null);

  const handleCalculateSumup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/sumup/calculate', {
        requestedAmount: parseFloat(requestedAmount),
        exchangeRate: parseFloat(exchangeRate),
        estimatedFeePercent: parseFloat(feePercent),
      });
      setCalcResult(res.data.data);
    } catch (err: any) {
      alert('Error al calcular valor SumUp');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Facturación Externa SII & Calculadora SumUp</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Registro de folios SII para exportación y herramienta de simulación de cobro bruto con comisión SumUp.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Calculadora SumUp */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
            <Calculator size={22} /> Calculadora de Cobro SumUp (Exportación)
          </h3>

          <form onSubmit={handleCalculateSumup}>
            <div className="form-group">
              <label className="form-label">Monto Solicitado en Moneda Origen (USD)</label>
              <input type="number" className="form-input" value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Cambio Observado (CLP / USD)</label>
              <input type="number" step="0.01" className="form-input" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Comisión Estimada SumUp (%)</label>
              <input type="number" step="0.1" className="form-input" value={feePercent} onChange={(e) => setFeePercent(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              Calcular Monto Sugerido a Cobrar
            </button>
          </form>

          {calcResult && (
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-primary)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Equivalente Objetivo Neto en CLP:</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                ${calcResult.targetClpEquivalent?.toLocaleString()} CLP
              </div>

              <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>Monto Sugerido A Cobrar en SumUp:</div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>
                ${calcResult.suggestedClpToCharge?.toLocaleString()} CLP
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Incluye comisión estimada de ${calcResult.feeAmountClpEstimated?.toLocaleString()} CLP ({calcResult.estimatedFeePercent}%)
              </div>
            </div>
          )}
        </div>

        {/* Facturas Registradas Info */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={22} color="var(--info)" /> Resumen Tributario SII (Folios Exportación)
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            SATEM Control no emite directamente el DTE (se realiza externamente en el portal SII). Aquí se asocia el folio legal (Tipo 110) con la Orden de Trabajo y Atención.
          </p>

          <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--info)', marginBottom: '4px' }}>
              Tratamiento EXPORT_SERVICE Activo
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Servicios prestados a empresas extranjeras sin IVA en Chile según normativa tributaria vigente.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
