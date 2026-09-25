import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  FolderKanban,
  FileCheck2,
  DollarSign,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Building2,
  Landmark,
  FileSpreadsheet,
  FileSignature,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setMetrics(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Cargando métricas del sistema...</div>;
  }

  const kpis = [
    {
      title: 'Expedientes Abiertos',
      value: metrics?.operations?.openExpedients || 0,
      color: 'var(--info)',
      sub: 'Trabajos en curso y pendientes',
      route: '/expedients',
      icon: <FolderKanban size={22} />,
    },
    {
      title: 'Contratos Activos',
      value: metrics?.operations?.activeContracts || 0,
      color: 'var(--accent-primary)',
      sub: 'SOWs y paquetes vigentes',
      route: '/customers',
      icon: <FileSignature size={22} />,
    },
    {
      title: 'Facturación Neta (USD)',
      value: `$${(metrics?.financial?.totalNetInvoicedUSD || 0).toLocaleString()}`,
      color: 'var(--success)',
      sub: 'Facturas SII de exportación registradas',
      route: '/billing',
      icon: <FileSpreadsheet size={22} />,
    },
    {
      title: 'Excepciones Abiertas',
      value: metrics?.control?.openExceptions || 0,
      color: 'var(--danger)',
      sub: 'Requieren atención del operador',
      route: '/control-center',
      icon: <ShieldAlert size={22} />,
    },
  ];

  const cycle = [
    { step: '①', label: 'Clientes & Contratos', desc: 'Alta de cliente + generación de SOW con PDF', route: '/customers', icon: <Building2 size={18} />, color: 'var(--success)' },
    { step: '②', label: 'Expedientes', desc: 'Ejecución del trabajo, OTs, documentos e integridad', route: '/expedients', icon: <FolderKanban size={18} />, color: 'var(--info)' },
    { step: '③', label: 'Cierre de Expediente', desc: 'Cierre 100% o con excepción + snapshot inmutable', route: '/expedients', icon: <CheckCircle2 size={18} />, color: 'var(--accent-primary)' },
    { step: '④', label: 'Facturación SII', desc: 'Registro de folio SII Tipo 110 + cálculo SumUp', route: '/billing', icon: <FileSpreadsheet size={18} />, color: 'var(--warning)' },
    { step: '⑤', label: 'Conciliación Bancaria', desc: 'Match del abono Santander con la factura emitida', route: '/bank', icon: <Landmark size={18} />, color: 'var(--success)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Dashboard Operacional & Financiero</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Resumen en tiempo real de operaciones, exportaciones sin IVA, facturación y trazabilidad SATEM.
          <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '12px' }}>Haz clic en un KPI para ir al módulo.</span>
        </p>
      </div>

      {/* KPI Cards Grid — clickeables */}
      <div className="grid-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="kpi-card kpi-card-link"
            onClick={() => navigate(kpi.route)}
            title={`Ir a ${kpi.title}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div className="kpi-title">{kpi.title}</div>
              <div style={{ color: kpi.color, opacity: 0.7 }}>{kpi.icon}</div>
            </div>
            <div className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{kpi.sub}</span>
              <ArrowRight size={13} color="var(--text-muted)" />
            </div>
          </div>
        ))}
      </div>

      {/* Ciclo Operativo */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Ciclo Operativo SATEM
        </h3>
        <div className="operating-cycle-grid">
          {cycle.map((item) => (
            <div
              key={item.step}
              className="cycle-step-card"
              onClick={() => navigate(item.route)}
              title={`Ir a ${item.label}`}
            >
              <div style={{ fontSize: '20px', fontWeight: 800, color: item.color, marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>{item.step}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: item.color, marginBottom: '4px' }}>
                {item.icon} <span>{item.label}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Secciones de Estado Operacional */}
      <div className="grid-2">
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck2 size={20} color="var(--info)" /> Resumen Tributario Exportación
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '8px' }}>
              <span>Tratamiento Tributario Dominante:</span>
              <span className="badge badge-info">EXPORT_SERVICE (Sin IVA)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '8px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '8px' }}>
              <span>Expedientes Auditados y Cerrados:</span>
              <span className="badge badge-success">{metrics?.operations?.completeExpedients || 0} 100% Completo</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '8px' }}>
              <span>Snapshots de Cierre Congelados:</span>
              <span style={{ fontWeight: 'bold' }}>Inmutables en DB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
