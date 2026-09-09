import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FolderKanban, FileCheck2, DollarSign, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setMetrics(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Cargando métricas del sistema...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Dashboard Operacional & Financiero</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Resumen en tiempo real de operaciones, exportaciones sin IVA, facturación y trazabilidad SATEM.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4">
        <div className="kpi-card">
          <div className="kpi-title">Expedientes Abiertos</div>
          <div className="kpi-value" style={{ color: 'var(--info)' }}>
            {metrics?.operations?.openExpedients || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Trabajos en curso y pendientes
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Contratos Activos</div>
          <div className="kpi-value" style={{ color: 'var(--accent-primary)' }}>
            {metrics?.operations?.activeContracts || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            SOWs y paquetes vigentes
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Facturación Neta (USD)</div>
          <div className="kpi-value" style={{ color: 'var(--success)' }}>
            ${metrics?.financial?.totalNetInvoicedUSD?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Facturas SII de exportación registradas
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Excepciones Abiertas</div>
          <div className="kpi-value" style={{ color: 'var(--danger)' }}>
            {metrics?.control?.openExceptions || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Requieren atención del operador
          </div>
        </div>
      </div>

      {/* Secciones de Estado Operacional */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck2 size={20} color="var(--info)" /> Resumen Tributario Exportación
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)' }}>
              <span>Tratamiento Tributario Dominante:</span>
              <span className="badge badge-info">EXPORT_SERVICE (Sin IVA)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)' }}>
              <span>Facturas Folio SII Registradas:</span>
              <span style={{ fontWeight: 'bold' }}>{metrics?.operations?.completeExpedients || 0} documentos</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={20} color="var(--success)" /> Integridad de Expedientes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)' }}>
              <span>Expedientes Auditados y Cerrados:</span>
              <span className="badge badge-success">{metrics?.operations?.completeExpedients || 0} 100% Completo</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)' }}>
              <span>Snapshots de Cierre Congelados:</span>
              <span style={{ fontWeight: 'bold' }}>Inmutables en DB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
