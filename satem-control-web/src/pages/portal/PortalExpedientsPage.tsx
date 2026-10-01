import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalApi } from '../../services/portalApi';
import {
  FolderKanban,
  Search,
  FileDown,
  ChevronRight,
  ClipboardList,
  Wrench,
  FileText,
  Building2,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface ExpedientItem {
  id: string;
  code: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  closedAt?: string;
  customerEntity?: { id: string; name: string };
  contract?: { id: string; code: string; title: string; type: string };
  stats: {
    workOrdersCount: number;
    attentionsCount: number;
    documentsCount: number;
  };
}

export const PortalExpedientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [expedients, setExpedients] = useState<ExpedientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchExpedients = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await portalApi.get('/expedients', { params });
      setExpedients(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los expedientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpedients();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExpedients();
  };

  const handleDownloadBundle = async (e: React.MouseEvent, exp: ExpedientItem) => {
    e.stopPropagation();
    setDownloadingId(exp.id);
    try {
      const response = await portalApi.get(`/expedients/${exp.id}/bundle`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exp.code}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error al descargar el paquete ZIP del expediente.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CLOSED':
      case 'COMPLETED':
        return <span className="badge badge-success">Cerrado / Completado</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-info">En Progreso</span>;
      case 'OPEN':
        return <span className="badge badge-warning">Abierto</span>;
      case 'DRAFT':
        return <span className="badge" style={{ backgroundColor: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' }}>Borrador</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderKanban size={22} color="var(--accent-primary)" /> Mis Expedientes y Servicios
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Consulte la trazabilidad completa, reportes técnicos de atención y descargue los documentos oficiales en ZIP.
          </p>
        </div>

        <button onClick={fetchExpedients} className="btn btn-secondary" style={{ fontSize: '13px' }}>
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, título o descripción..."
              style={{ width: '100%', paddingLeft: '38px' }}
            />
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>

          <div style={{ width: '200px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Todos los Estados</option>
              <option value="OPEN">Abierto</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="COMPLETED">Completado</option>
              <option value="CLOSED">Cerrado</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Buscar
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            backgroundColor: 'var(--danger-bg)',
            color: '#f87171',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Cargando expedientes...
        </div>
      ) : expedients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <FolderKanban size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text-primary)' }}>
            No se encontraron expedientes
          </h3>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            {search || statusFilter ? 'Pruebe ajustando los filtros de búsqueda.' : 'Aún no hay expedientes registrados para su empresa.'}
          </p>
        </div>
      ) : (
        /* Expedients List */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {expedients.map((exp) => (
            <div
              key={exp.id}
              className="card"
              onClick={() => navigate(`/portal/expedients/${exp.id}`)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                border: '1px solid var(--border-color)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-heading)' }}>
                    {exp.code}
                  </span>
                  {getStatusBadge(exp.status)}
                </div>

                <h3 style={{ fontSize: '16px', margin: '0 0 8px 0', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {exp.title}
                </h3>

                {exp.description && (
                  <p
                    style={{
                      margin: '0 0 16px 0',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {exp.description}
                  </p>
                )}

                {exp.customerEntity && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <Building2 size={14} color="var(--accent-primary)" />
                    <span>Entidad: {exp.customerEntity.name}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  <Calendar size={14} />
                  <span>Fecha: {new Date(exp.createdAt).toLocaleDateString('es-CL')}</span>
                </div>
              </div>

              {/* Stats & Actions Footer */}
              <div
                style={{
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Órdenes de Trabajo">
                    <ClipboardList size={14} color="var(--accent-primary)" /> {exp.stats.workOrdersCount} OTs
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Atenciones Técnicas">
                    <Wrench size={14} color="var(--warning)" /> {exp.stats.attentionsCount} Atenciones
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Documentos">
                    <FileText size={14} color="var(--info)" /> {exp.stats.documentsCount} Docs
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={(e) => handleDownloadBundle(e, exp)}
                    disabled={downloadingId === exp.id}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    title="Descargar paquete ZIP del expediente"
                  >
                    <FileDown size={14} /> {downloadingId === exp.id ? 'ZIP...' : 'ZIP'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Ver <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
