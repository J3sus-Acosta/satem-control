import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Landmark, Upload, CheckCircle2, AlertTriangle,
  FileCheck, Zap, RefreshCw, Info, FileSpreadsheet,
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
      alert(err.response?.data?.error?.message || err.response?.data?.message || 'Error al procesar archivo de cartola');
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;
    try {
      await api.post('/bank/import-confirm', {
        accountNumber: previewData.accountNumber || 'Santander CLP 123456789',
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

  /** Auto-Match abono ↔ pago / factura */
  const handleAutoMatch = async () => {
    setMatching(true);
    setMatchResult(null);
    try {
      const res = await api.post('/bank/auto-match', {});
      setMatchResult(res.data.data);
      fetchReceipts();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message;
      alert(msg || 'Error al ejecutar auto-match');
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
            Importación oficial de cartola bancaria Santander (.pdf, .xlsx, .xls, .csv), detección anti-duplicados y conciliación automática con informes de depósitos SumUp y expedientes.
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
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Match pago ↔ abono</div>
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
          {/* Subida PDF / Excel / CSV */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            <h3 style={{ fontSize: '17px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
              <FileSpreadsheet size={20} /> Importar Cartola Santander (PDF / Excel / CSV)
            </h3>
            <form onSubmit={handlePreviewUpload}>
              <div className="form-group">
                <label className="form-label">Seleccionar Archivo de Cartola Santander (.pdf, .xlsx, .xls o .csv)</label>
                <input
                  type="file" accept=".pdf,.xlsx,.xls,.csv" className="form-input"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  required
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Compatible directamente con el PDF estándar de <strong>Cartolas históricas de Cta.Cte y Líneas de Crédito</strong> de Office Banking Santander y archivos Excel/CSV.
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={importing}>
                {importing ? 'Procesando y validando cartola...' : 'Previsualizar Cartola'}
              </button>
            </form>
          </div>

        {/* Auto-Match */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
          <h3 style={{ fontSize: '17px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
            <Zap size={20} /> Auto-Match Abono Santander ↔ Pagos
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
            Ejecuta el algoritmo de conciliación automática: compara referencias bancarias y montos en CLP entre los abonos de la cartola y los comprobantes de pago registrados.
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

          {matchResult && (
            <div style={{ padding: '14px', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
              <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: '4px' }}>✓ Proceso de Conciliación Finalizado</div>
              <div style={{ color: 'var(--text-secondary)' }}>
                {matchResult.message || `Movimientos conciliados: ${matchResult.reconciledCount}`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview anti-duplicados */}
      {previewData && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                <FileCheck size={20} /> Previsualización de Cartola ({previewData.totalRows} movimientos válidos)
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Cuenta detectada: <strong>{previewData.accountNumber}</strong> | Duplicados existentes: <strong style={{ color: previewData.duplicateRowsCount > 0 ? 'var(--warning)' : 'var(--success)' }}>{previewData.duplicateRowsCount}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setPreviewData(null); setFile(null); }} className="btn btn-secondary">
                Cancelar
              </button>
              <button onClick={handleConfirmImport} className="btn btn-primary">
                Confirmar e Importar {previewData.totalRows} Abonos
              </button>
            </div>
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <table className="custom-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción / Concepto</th>
                  <th>N° Documento / Ref</th>
                  <th>Monto (CLP)</th>
                  <th>Estado Preview</th>
                </tr>
              </thead>
              <tbody>
                {previewData.rows.map((row: any, idx: number) => (
                  <tr key={idx} style={{ backgroundColor: row.isPossibleDuplicate ? 'rgba(234,179,8,0.05)' : 'transparent' }}>
                    <td style={{ fontSize: '13px' }}>{new Date(row.transactionDate).toLocaleDateString('es-CL')}</td>
                    <td style={{ fontSize: '13px' }}>{row.description}</td>
                    <td style={{ fontSize: '13px', fontFamily: 'monospace' }}>{row.referenceNumber || '—'}</td>
                    <td style={{ fontWeight: 'bold', color: row.amountClp >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      ${Math.abs(row.amountClp).toLocaleString('es-CL')} CLP
                    </td>
                    <td>
                      {row.isPossibleDuplicate ? (
                        <span className="badge badge-warning">Posible Duplicado</span>
                      ) : (
                        <span className="badge badge-success">Nuevo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla Abonos con paginación */}
      <div className="table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Landmark size={18} color="var(--accent-primary)" /> Registro de Abonos Banco Santander Chile
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>({receipts.length} registros)</span>
          </h3>
          <button onClick={fetchReceipts} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
            <RefreshCw size={13} style={{ marginRight: '4px' }} /> Actualizar
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando registros bancarios...</div>
        ) : (
          <>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha Movimiento</th>
                  <th>Descripción / Concepto</th>
                  <th>N° Documento / Ref</th>
                  <th>Monto (CLP)</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagedReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                      <Landmark size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                      No hay abonos bancarios registrados.
                      <div style={{ marginTop: '8px', fontSize: '12px' }}>
                        Usa el formulario superior para importar tu cartola de Banco Santander en Excel (.xlsx) o CSV.
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedReceipts.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{r.code}</td>
                      <td style={{ fontSize: '13px' }}>{new Date(r.transactionDate).toLocaleDateString('es-CL')}</td>
                      <td style={{ fontSize: '13px' }}>{r.description}</td>
                      <td style={{ fontSize: '13px', fontFamily: 'monospace' }}>{r.referenceNumber || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td style={{ fontWeight: 'bold', color: Number(r.amountClp) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        ${Math.abs(Number(r.amountClp)).toLocaleString('es-CL')} CLP
                      </td>
                      <td>{statusBadge(r.status)}</td>
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
