import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Landmark, Upload, CheckCircle2, AlertTriangle,
  FileCheck, Zap, RefreshCw, Info,
} from 'lucide-react';

export const BankPage: React.FC = () => {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  // Paginación client-side
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(receipts.length / PAGE_SIZE);
  const pagedReceipts = receipts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchReceipts = () => {
    setLoading(true);
    api.get('/bank/receipts')
      .then((res) => {
        setReceipts(res.data.data);
        setPage(1);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handlePreviewUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setImporting(true);
    try {
      const res = await api.post('/bank/import-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewData(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al procesar archivo CSV');
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;
    try {
      await api.post('/bank/import-confirm', {
        accountNumber: 'Santander CLP 123456789',
        rows: previewData.rows,
      });
      alert('Importación de abonos Santander confirmada exitosamente');
      setPreviewData(null);
      setFile(null);
      fetchReceipts();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al confirmar importación');
    }
  };

  /** MEJ-01: Auto-Match abono ↔ factura SII */
  const handleAutoMatch = async () => {
    setMatching(true);
    setMatchResult(null);
    try {
      const res = await api.post('/bank/auto-match', {});
      setMatchResult(res.data.data);
      fetchReceipts();
    } catch (err: any) {
      // Si el endpoint aún no existe mostramos mensaje informativo
      const msg = err.response?.data?.error?.message;
      if (err.response?.status === 404) {
        setMatchResult({ notImplemented: true });
      } else {
        alert(msg || 'Error al ejecutar auto-match');
      }
    } finally {
      setMatching(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'RECONCILED')   return <span className="badge badge-success">✓ CONCILIADO</span>;
    if (status === 'UNRECONCILED') return <span className="badge badge-warning">⚠ SIN CONCILIAR</span>;
    if (status === 'DISCREPANCY')  return <span className="badge badge-danger">✗ DESCALCE</span>;
    return <span className="badge badge-secondary">{status}</span>;
  };

  // KPIs rápidos
  const reconciledCount   = receipts.filter(r => r.status === 'RECONCILED').length;
  const unreconciledCount = receipts.filter(r => r.status === 'UNRECONCILED').length;
  const discrepancyCount  = receipts.filter(r => r.status === 'DISCREPANCY').length;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Conciliación Bancaria Santander</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Importación de cartola bancaria, detección de duplicados y conciliación automática con facturas SII.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-title">Total Abonos</div>
          <div className="kpi-value" style={{ color: 'var(--accent-primary)' }}>{receipts.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Registros importados</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Conciliados</div>
          <div className="kpi-value" style={{ color: 'var(--success)' }}>{reconciledCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Match factura ↔ abono</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Sin Conciliar</div>
          <div className="kpi-value" style={{ color: 'var(--warning)' }}>{unreconciledCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Pendientes de match</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Descalces</div>
          <div className="kpi-value" style={{ color: 'var(--danger)' }}>{discrepancyCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Monto no coincide</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Subida CSV */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
          <h3 style={{ fontSize: '17px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
            <Upload size={20} /> Importar Cartola Santander (CSV)
          </h3>
          <form onSubmit={handlePreviewUpload}>
            <div className="form-group">
              <label className="form-label">Seleccionar Archivo CSV de Cartola</label>
              <input
                type="file" accept=".csv,.xlsx" className="form-input"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={importing}>
              {importing ? 'Procesando y validando...' : 'Previsualizar Cartola'}
            </button>
          </form>
        </div>

        {/* Auto-Match MEJ-01 */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
          <h3 style={{ fontSize: '17px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
            <Zap size={20} /> Auto-Match Abono ↔ Factura SII
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
            Ejecuta el algoritmo de conciliación automática: compara montos y rangos de fecha (±3 días) entre abonos importados y facturas SII emitidas. Marca como <strong>RECONCILED</strong> los que coinciden exactamente.
          </p>

          <button
            onClick={handleAutoMatch}
            className="btn btn-primary"
            style={{ width: '100%', backgroundColor: 'var(--success)', marginBottom: '12px' }}
            disabled={matching || receipts.length === 0}
          >
            {matching ? (
              <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Ejecutando match...</>
            ) : (
              <><Zap size={16} /> Ejecutar Auto-Match</>
            )}
          </button>

          {matchResult && !matchResult.notImplemented && (
            <div style={{ padding: '14px', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
              <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: '6px' }}>✓ Auto-Match Completado</div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Conciliados: <strong style={{ color: 'var(--success)' }}>{matchResult.matched ?? 0}</strong> |
                Sin match: <strong style={{ color: 'var(--warning)' }}> {matchResult.unmatched ?? 0}</strong> |
                Descalces: <strong style={{ color: 'var(--danger)' }}> {matchResult.discrepancies ?? 0}</strong>
              </div>
            </div>
          )}
          {matchResult?.notImplemented && (
            <div style={{ padding: '14px', backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid var(--info)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--info)' }}>
              <Info size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Endpoint <code>/bank/auto-match</code> pendiente de implementar en la API. Cuando esté disponible, este botón ejecutará la conciliación automáticamente.
            </div>
          )}
        </div>
      </div>

      {/* Preview anti-duplicados */}
      {previewData && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '17px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
            <FileCheck size={20} /> Previsualización ({previewData.totalRows} filas)
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Duplicados detectados: <strong style={{ color: 'var(--warning)' }}>{previewData.duplicateRowsCount}</strong>
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleConfirmImport} className="btn btn-primary">
              Confirmar e Insertar Abonos
            </button>
            <button onClick={() => { setPreviewData(null); setFile(null); }} className="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla Abonos con paginación */}
      <div className="table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Landmark size={18} color="var(--accent-primary)" /> Abonos Santander Registrados
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
              ({receipts.length} total)
            </span>
          </h3>
          <button onClick={fetchReceipts} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '12px', gap: '4px' }}>
            <RefreshCw size={13} /> Actualizar
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando abonos...</div>
        ) : (
          <>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Monto (CLP)</th>
                  <th>Estado Conciliación</th>
                </tr>
              </thead>
              <tbody>
                {pagedReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                      No se han importado abonos bancarios aún.
                    </td>
                  </tr>
                ) : (
                  pagedReceipts.map((br) => (
                    <tr key={br.id}>
                      <td style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{br.code}</td>
                      <td>{new Date(br.transactionDate).toLocaleDateString('es-CL')}</td>
                      <td style={{ fontSize: '13px', maxWidth: '240px' }}>{br.description}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                        ${Number(br.amountClp).toLocaleString('es-CL')} CLP
                      </td>
                      <td>{statusBadge(br.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Página {page} de {totalPages} ({receipts.length} registros)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '13px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
                  <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '13px' }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
