import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert, AlertTriangle, Info, CheckCircle2,
  Filter, ExternalLink, RefreshCw, X, ChevronDown, ChevronUp, User, Calendar,
} from 'lucide-react';

type Severity = 'ALL' | 'CRITICAL' | 'WARNING' | 'INFO';
type StatusFilter = 'ALL' | 'OPEN' | 'RESOLVED';

export const ControlCenterPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<Severity>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('OPEN');
  const [showExpiringContracts, setShowExpiringContracts] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  const fetchControlCenter = () => {
    setLoading(true);
    Promise.all([
      api.get('/exceptions/control-center/summary'),
      api.get('/exceptions'),
      api.get('/users').catch(() => ({ data: { data: [] } })), // no romper si falla
    ])
      .then(([sumRes, excRes, usersRes]) => {
        setSummary(sumRes.data.data);
        setExceptions(excRes.data.data);
        setUsers(usersRes.data.data || []);
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
      await api.put(`/exceptions/${id}/resolve`, { status: 'RESOLVED', resolutionNote: note });
      fetchControlCenter();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al resolver la excepción');
    }
  };

  // MEJ-04: Asignar excepción a usuario
  const handleAssign = async (excId: string, assignedUserId: string) => {
    try {
      await api.put(`/exceptions/${excId}/assign`, { assignedUserId });
      fetchControlCenter();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message;
      if (err.response?.status === 404) return; // silencioso si no implementado
      alert(msg || 'Error al asignar excepción');
    }
  };

  // Filtrado local
  const filtered = exceptions.filter((exc) => {
    const matchSev = severityFilter === 'ALL' || exc.severity === severityFilter;
    const matchSt  = statusFilter === 'ALL' || exc.status === statusFilter;
    return matchSev && matchSt;
  });

  const severityIcon = (sev: string) => {
    if (sev === 'CRITICAL') return <AlertTriangle size={14} color="var(--danger)" />;
    if (sev === 'WARNING')  return <AlertTriangle size={14} color="var(--warning)" />;
    return <Info size={14} color="var(--info)" />;
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Cargando Centro de Control...</div>;

  const expiringContracts: any[] = summary?.expiringContracts || [];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={28} color="var(--danger)" /> Centro de Control & Excepciones Globales
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Monitoreo unificado de pendientes documentales, descalces financieros, vencimientos e inconformidades.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <div
          className="kpi-card kpi-card-link"
          style={{ borderLeft: '4px solid var(--danger)' }}
          onClick={() => { setSeverityFilter('CRITICAL'); setStatusFilter('OPEN'); }}
        >
          <div className="kpi-title" style={{ color: 'var(--danger)' }}>Críticas</div>
          <div className="kpi-value">{summary?.criticalCount || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Haz clic para filtrar</div>
        </div>

        <div
          className="kpi-card kpi-card-link"
          style={{ borderLeft: '4px solid var(--warning)' }}
          onClick={() => { setSeverityFilter('WARNING'); setStatusFilter('OPEN'); }}
        >
          <div className="kpi-title" style={{ color: 'var(--warning)' }}>Advertencias</div>
          <div className="kpi-value">{summary?.warningCount || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Haz clic para filtrar</div>
        </div>

        <div
          className="kpi-card kpi-card-link"
          style={{ borderLeft: '4px solid var(--warning)' }}
          onClick={() => navigate('/bank')}
        >
          <div className="kpi-title">Abonos Sin Conciliar</div>
          <div className="kpi-value">{summary?.unreconciledPaymentsCount || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px' }}>→ Ir a Conciliación</div>
        </div>

        {/* MEJ-06: KPI Contratos por vencer expandible */}
        <div
          className="kpi-card kpi-card-link"
          style={{ borderLeft: '4px solid var(--info)' }}
          onClick={() => setShowExpiringContracts(v => !v)}
        >
          <div className="kpi-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Contratos Por Vencer</span>
            {showExpiringContracts ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
          <div className="kpi-value" style={{ color: 'var(--info)' }}>{summary?.expiringContractsCount || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Clic para ver detalle</div>
        </div>
      </div>

      {/* MEJ-06: Panel expandible de contratos por vencer */}
      {showExpiringContracts && (
        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--info)',
          borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '20px',
          animation: 'fadeInScale 0.2s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--info)' }}>
              <Calendar size={18} /> Contratos próximos a vencer
            </h3>
            <button onClick={() => navigate('/customers')} className="btn btn-secondary" style={{ fontSize: '12px', padding: '5px 10px' }}>
              Ver todos <ExternalLink size={11} />
            </button>
          </div>
          {expiringContracts.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '10px 0' }}>
              No hay datos de contratos próximos a vencer. El endpoint de la API debe incluir
              <code style={{ margin: '0 4px' }}>expiringContracts[]</code> en el resumen del Centro de Control.
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Título</th>
                  <th>Cliente</th>
                  <th>Vence</th>
                  <th>Horas Restantes</th>
                </tr>
              </thead>
              <tbody>
                {expiringContracts.map((ct: any) => (
                  <tr key={ct.id}>
                    <td style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{ct.code}</td>
                    <td>{ct.title}</td>
                    <td>{ct.customer?.legalName}</td>
                    <td style={{ color: 'var(--warning)', fontWeight: 700 }}>
                      {ct.endDate ? new Date(ct.endDate).toLocaleDateString('es-CL') : '—'}
                    </td>
                    <td>
                      <span className="badge badge-warning">
                        {ct.contractedHours - ct.consumedHours} hrs restantes
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Filtros */}
      <div style={{
        display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap',
        backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
          <Filter size={15} /> Filtros:
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as Severity[]).map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`btn ${severityFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '5px 12px', fontSize: '12px' }}
            >
              {s === 'ALL' ? 'Todas' : s === 'CRITICAL' ? '🔴 Crítica' : s === 'WARNING' ? '🟡 Advertencia' : '🔵 Info'}
            </button>
          ))}
        </div>
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }} />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['ALL', 'OPEN', 'RESOLVED'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '5px 12px', fontSize: '12px' }}
            >
              {s === 'ALL' ? 'Todos' : s === 'OPEN' ? '⚠ Abiertas' : '✓ Resueltas'}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(severityFilter !== 'ALL' || statusFilter !== 'OPEN') && (
            <button
              onClick={() => { setSeverityFilter('ALL'); setStatusFilter('OPEN'); }}
              className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '12px', gap: '4px' }}
            >
              <X size={12} /> Limpiar
            </button>
          )}
          <button onClick={fetchControlCenter} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '12px', gap: '4px' }}>
            <RefreshCw size={13} /> Actualizar
          </button>
        </div>
      </div>

      {/* Tabla de Excepciones */}
      <div className="table-container">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '15px' }}>
            Excepciones Registradas
            <span style={{ marginLeft: '10px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>
              ({filtered.length} resultado{filtered.length !== 1 ? 's' : ''}{severityFilter !== 'ALL' || statusFilter !== 'ALL' ? ', filtrado' : ''})
            </span>
          </h3>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Severidad</th>
              <th>Título</th>
              <th>Descripción</th>
              <th>Expediente</th>
              <th>Estado</th>
              {/* MEJ-04: columna Asignado */}
              {users.length > 0 && <th>Asignado a</th>}
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={users.length > 0 ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                  <CheckCircle2 size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                  {exceptions.length === 0
                    ? 'No hay excepciones registradas en el sistema.'
                    : 'Ninguna excepción coincide con los filtros seleccionados.'}
                </td>
              </tr>
            ) : (
              filtered.map((exc) => (
                <tr key={exc.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {severityIcon(exc.severity)}
                      {exc.severity === 'CRITICAL' && <span className="badge badge-danger">CRÍTICA</span>}
                      {exc.severity === 'WARNING'  && <span className="badge badge-warning">ADVERTENCIA</span>}
                      {exc.severity === 'INFO'     && <span className="badge badge-info">INFO</span>}
                    </div>
                  </td>
                  <td style={{ fontWeight: 'bold', maxWidth: '180px', fontSize: '13px' }}>{exc.title}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px' }}>{exc.description}</td>
                  <td>
                    {exc.expedient ? (
                      <button
                        onClick={() => navigate('/expedients')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                        title="Ir al expediente"
                      >
                        {exc.expedient.code} <ExternalLink size={11} />
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Global</span>
                    )}
                  </td>
                  <td>
                    {exc.status === 'OPEN'         && <span className="badge badge-danger">ABIERTA</span>}
                    {exc.status === 'RESOLVED'     && <span className="badge badge-success">RESUELTA</span>}
                    {exc.status === 'ACKNOWLEDGED' && <span className="badge badge-warning">RECONOCIDA</span>}
                    {exc.status === 'DISMISSED'    && <span className="badge badge-secondary">DESCARTADA</span>}
                  </td>

                  {/* MEJ-04: Selector de responsable */}
                  {users.length > 0 && (
                    <td>
                      {exc.status === 'OPEN' && !isViewer ? (
                        <select
                          className="form-select"
                          style={{ padding: '4px 8px', fontSize: '12px', minWidth: '120px' }}
                          value={exc.assignedUserId || ''}
                          onChange={(e) => handleAssign(exc.id, e.target.value)}
                        >
                          <option value="">Sin asignar</option>
                          {users.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.fullName}</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <User size={12} />
                          {exc.assignedUser?.fullName || <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>}
                        </div>
                      )}
                    </td>
                  )}

                  <td>
                    {exc.status === 'OPEN' && !isViewer ? (
                      <button onClick={() => handleResolve(exc.id)} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        Resolver
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '140px', display: 'block' }}>
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
