import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Landmark, Upload, CheckCircle2, AlertTriangle, FileCheck } from 'lucide-react';

export const BankPage: React.FC = () => {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const fetchReceipts = () => {
    setLoading(true);
    api.get('/bank/receipts')
      .then((res) => setReceipts(res.data.data))
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

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Conciliación Bancaria Santander</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Importación de cartola bancaria de abonos recibidos, detección de duplicados y match con pagos SumUp.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Subida de Archivo CSV Cartola */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
            <Upload size={22} /> Importar Cartola Santander (CSV)
          </h3>

          <form onSubmit={handlePreviewUpload}>
            <div className="form-group">
              <label className="form-label">Seleccionar Archivo CSV de Cartola</label>
              <input
                type="file"
                accept=".csv,.xlsx"
                className="form-input"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={importing}>
              {importing ? 'Procesando y validando...' : 'Previsualizar Cartola'}
            </button>
          </form>
        </div>

        {/* Previsualización Anti-Duplicados */}
        {previewData && (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
              <FileCheck size={22} /> Previsualización ({previewData.totalRows} filas)
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Duplicados detectados: <strong>{previewData.duplicateRowsCount}</strong>
            </p>

            <button onClick={handleConfirmImport} className="btn btn-primary" style={{ width: '100%' }}>
              Confirmar E Insertar Abonos
            </button>
          </div>
        )}
      </div>

      {/* Tabla Cartola Santander en DB */}
      <div className="table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Landmark size={20} color="var(--accent-primary)" /> Abonos Santander Registrados
          </h3>
        </div>

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
            {receipts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                  No se han importado abonos bancarios aún.
                </td>
              </tr>
            ) : (
              receipts.map((br) => (
                <tr key={br.id}>
                  <td style={{ fontWeight: 'bold' }}>{br.code}</td>
                  <td>{new Date(br.transactionDate).toLocaleDateString()}</td>
                  <td>{br.description}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                    ${Number(br.amountClp).toLocaleString()} CLP
                  </td>
                  <td>
                    {br.status === 'RECONCILED' && <span className="badge badge-success">✓ CONCILIADO</span>}
                    {br.status === 'UNRECONCILED' && <span className="badge badge-warning">⚠ SIN CONCILIAR</span>}
                    {br.status === 'DISCREPANCY' && <span className="badge badge-danger">✗ DESCALCE MONTO</span>}
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
