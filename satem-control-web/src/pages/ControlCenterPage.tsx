import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, Filter } from 'lucide-react';

export const ControlCenterPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchControlCenter = () => {
    setLoading(true);
    Promise.all([
      api.get('/exceptions/control-center/summary'),
      api.get('/exceptions'),
    ])
      .then(([sumRes, excRes]) => {
        setSummary(sumRes.data.data);
        setExceptions(excRes.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchControlCenter();
  }, []);

  const handleResolve = async (id: string) => {
    const note = prompt('Ingrese una nota de resolución para esta excepción:');
    if (!note) return;
    try {
      await api.put(`/exceptions/${id}/resolve`, {
        status: 'RESOLVED',
        resolutionNote: note,
      });
      fetchControlCenter();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al resolver la excepción');
    }
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Cargando Centro de Control...</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={28} color="var(--danger)" /> Centro de Control & Excepciones Globales
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Monitoreo unificado de pendientes documentales, descalces financieros, vencimientos de contratos e inconformidades.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid-4">
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="kpi-title" style={{ color: 'var(--danger)' }}>Críticas</div>
          <div className="kpi-value">{summary?.criticalCount || 0}</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="kpi-title" style={{ color: 'var(--warning)' }}>Advertencias</div>
          <div className="kpi-value">{summary?.warningCount || 0}</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="kpi-title">Abonos Sin Conciliar</div>
          <div className="kpi-value">{summary?.unreconciledPaymentsCount || 0}</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="kpi-title">Contratos Por Vencer</div>
          <div className="kpi-value">{summary?.expiringContractsCount || 0}</div>
        </div>
      </div>

      {/* Tabla de Excepciones */}
      <div className="table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px' }}>Listado de Excepciones Registradas</h3>
          <button onClick={fetchControlCenter} className="btn btn-secondary">
            Actualizar
          </button>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Severidad</th>
              <th>Título</th>
              <th>Descripción</th>
              <th>Expediente</th>
              <th>Estado</th>
              <th>Resolución</th>
            </tr>
          </thead>
          <tbody>
            {exceptions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                  No hay excepciones abiertas registradas en el sistema.
                </td>
              </tr>
            ) : (
              exceptions.map((exc) => (
                <tr key={exc.id}>
                  <td>
                    {exc.severity === 'CRITICAL' && <span className="badge badge-danger">CRÍTICA</span>}
                    {exc.severity === 'WARNING' && <span className="badge badge-warning">ADVERTENCIA</span>}
                    {exc.severity === 'INFO' && <span className="badge badge-info">INFO</span>}
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{exc.title}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{exc.description}</td>
                  <td>{exc.expedient ? exc.expedient.code : 'Global'}</td>
                  <td>
                    {exc.status === 'OPEN' && <span className="badge badge-danger">ABIERTA</span>}
                    {exc.status === 'RESOLVED' && <span className="badge badge-success">RESUELTA</span>}
                  </td>
                  <td>
                    {exc.status === 'OPEN' ? (
                      <button onClick={() => handleResolve(exc.id)} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        Resolver
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {exc.resolutionNote}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
