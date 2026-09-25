import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calculator, FileSpreadsheet, RefreshCw,
  FileText, ChevronDown, ChevronUp, Plus, Download, Upload
} from 'lucide-react';
import { SumUpCalculator } from '../components/SumUpCalculator';

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  const [invoices, setInvoices] = useState<any[]>([]);
  const [expedients, setExpedients] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // Paginación client-side MEJ-09
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(invoices.length / PAGE_SIZE);
  const pagedInvoices = invoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Calculadora SumUp
  const [showCalc, setShowCalc] = useState(false);

  // Modal Registrar Folio SII
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invFolio, setInvFolio] = useState('');
  const [invExpedientId, setInvExpedientId] = useState('');
  const [invAmountUsd, setInvAmountUsd] = useState('');
  const [invIssuedAt, setInvIssuedAt] = useState(new Date().toISOString().split('T')[0]);
  const [invFile, setInvFile] = useState<File | null>(null);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  const fetchInvoices = () => {
    setLoadingInvoices(true);
    api.get('/invoices')
      .then((res) => { setInvoices(res.data.data || []); setPage(1); })
      .catch(() => setInvoices([]))
      .finally(() => setLoadingInvoices(false));
  };

  useEffect(() => {
    fetchInvoices();
    api.get('/expedients').then((res) => setExpedients(res.data.data || [])).catch(() => {});
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invExpedientId) {
      alert('Por favor selecciona un expediente.');
      return;
    }

    setSubmittingInvoice(true);
    try {
      if (invFile) {
        const formData = new FormData();
        formData.append('expedientId', invExpedientId);
        formData.append('siiFolio', invFolio);
        formData.append('issueDate', invIssuedAt);
        formData.append('currency', 'USD');
        formData.append('netAmount', invAmountUsd);
        formData.append('totalAmount', invAmountUsd);
        formData.append('taxTreatment', 'EXPORT_SERVICE');
        formData.append('invoiceFile', invFile);

        await api.post('/invoices/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/invoices', {
          siiFolio: parseInt(invFolio, 10),
          expedientId: invExpedientId,
          netAmount: parseFloat(invAmountUsd),
          totalAmount: parseFloat(invAmountUsd),
          issueDate: new Date(invIssuedAt).toISOString(),
          taxTreatment: 'EXPORT_SERVICE',
          currency: 'USD',
        });
      }

      alert('Factura SII registrada e integrada exitosamente.');
      setShowInvoiceModal(false);
      setInvFolio(''); setInvExpedientId(''); setInvAmountUsd(''); setInvFile(null);
      fetchInvoices();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message;
      alert(msg || 'Error al registrar folio SII');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleViewInvoiceDoc = async (docId: string, filename?: string) => {
    try {
      const response = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileUrl = window.URL.createObjectURL(file);
      const w = window.open(fileUrl, '_blank');
      if (!w) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = filename || 'factura_sii.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err: any) {
      alert('Error al visualizar o descargar el PDF de la factura');
    }
  };

  // Exportar a CSV
  const handleExportCsv = () => {
    if (invoices.length === 0) { alert('No hay facturas para exportar.'); return; }
    const headers = ['Folio/Código', 'Expediente', 'Cliente', 'Monto Neto USD', 'Fecha Emisión', 'Estado'];
    const rows = invoices.map(inv => [
      inv.code || inv.folio || inv.id?.slice(0, 8),
      inv.expedient?.code || inv.expedientCode || '',
      inv.expedient?.customer?.legalName || inv.customer?.legalName || inv.customerName || '',
      inv.totalAmount || inv.netAmount || inv.totalAmountUsd || inv.netAmountUsd || 0,
      inv.issueDate || inv.issuedAt || inv.createdAt ? new Date(inv.issueDate || inv.issuedAt || inv.createdAt).toLocaleDateString('es-CL') : '',
      inv.status,
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facturas_sii_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ISSUED':    return <span className="badge badge-success">EMITIDA</span>;
      case 'DRAFT':     return <span className="badge badge-info">BORRADOR</span>;
      case 'CANCELLED': return <span className="badge badge-danger">ANULADA</span>;
      case 'VOIDED':    return <span className="badge badge-danger">NULA</span>;
      default:          return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const totalNetUSD = invoices
    .filter(inv => inv.status === 'ISSUED')
    .reduce((sum, inv) => sum + (parseFloat(inv.totalAmount || inv.netAmount || inv.totalAmountUsd || inv.netAmountUsd) || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Facturación SII & Cobros SumUp</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Registro de folios SII Tipo 110 (exportación sin IVA), carga de documentos PDF oficiales y simulación de cobro SumUp.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCsv} className="btn btn-secondary" style={{ fontSize: '13px' }}>
            <Download size={15} /> Exportar CSV
          </button>
          {!isViewer && (
            <button onClick={() => setShowInvoiceModal(true)} className="btn btn-primary" style={{ fontSize: '13px' }}>
              <Plus size={15} /> Registrar Folio SII
            </button>
          )}
          <button onClick={fetchInvoices} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-title">Total Emitidas</div>
          <div className="kpi-value" style={{ color: 'var(--accent-primary)' }}>
            {invoices.filter(i => i.status === 'ISSUED').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Folios SII Tipo 110</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Facturación Neta (USD)</div>
          <div className="kpi-value" style={{ color: 'var(--success)' }}>
            ${totalNetUSD.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Export Service sin IVA</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Tratamiento Tributario</div>
          <div style={{ marginTop: '8px' }}><span className="badge badge-info">EXPORT_SERVICE</span></div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Sin IVA — Normativa vigente</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">En Borrador</div>
          <div className="kpi-value" style={{ color: 'var(--warning)' }}>
            {invoices.filter(i => i.status === 'DRAFT').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Pendientes de emisión</div>
        </div>
      </div>

      {/* Tabla de Facturas SII con paginación */}
      <div className="table-container" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} color="var(--accent-primary)" /> Facturas SII Registradas (Tipo 110 — Exportación)
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>({invoices.length} total)</span>
          </h3>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Las facturas se emiten en el portal SII y se incorporan al expediente como soporte de auditoría.
          </div>
        </div>

        {loadingInvoices ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando facturas...</div>
        ) : (
          <>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Folio SII / Código</th>
                  <th>Expediente</th>
                  <th>Cliente</th>
                  <th>Monto Neto (USD)</th>
                  <th>Fecha Emisión</th>
                  <th>Estado</th>
                  <th>Documento PDF</th>
                </tr>
              </thead>
              <tbody>
                {pagedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                      <FileText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                      No hay facturas registradas.
                      {!isViewer && (
                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                          Usa el botón <strong>"Registrar Folio SII"</strong> para añadir una.
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  pagedInvoices.map((inv) => {
                    const docId = inv.pdfDocumentId || inv.pdfDocument?.id;
                    const folioDisplay = inv.siiFolio ? `Folio ${inv.siiFolio}` : (inv.code || inv.folio || inv.id?.slice(0, 8));

                    return (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                          <div>{folioDisplay}</div>
                          {inv.code && inv.siiFolio && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{inv.code}</div>
                          )}
                        </td>
                        <td style={{ fontSize: '13px' }}>{inv.expedient?.code || inv.expedientCode || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td>{inv.expedient?.customer?.legalName || inv.customer?.legalName || inv.customerName || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                          ${parseFloat(inv.totalAmount || inv.netAmount || inv.totalAmountUsd || inv.netAmountUsd || 0).toLocaleString()} USD
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          {inv.issueDate || inv.issuedAt || inv.createdAt ? new Date(inv.issueDate || inv.issuedAt || inv.createdAt).toLocaleDateString('es-CL') : '—'}
                        </td>
                        <td>{statusBadge(inv.status)}</td>
                        <td>
                          {docId ? (
                            <button
                              onClick={() => handleViewInvoiceDoc(docId, `FACTURA_SII_${inv.siiFolio || inv.code}.pdf`)}
                              className="btn btn-secondary"
                              style={{ fontSize: '11px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <FileText size={13} /> Ver PDF
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin PDF</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Paginación MEJ-09 */}
            {totalPages > 1 && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Página {page} de {totalPages} ({invoices.length} registros)
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

      {/* Calculadora Dinámica SumUp colapsable */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <button
          onClick={() => setShowCalc(!showCalc)}
          style={{
            width: '100%', padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)',
            borderBottom: showCalc ? '1px solid var(--border-color)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calculator size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Calculadora Dinámica de Cobros SumUp</span>
            <span className="badge badge-success" style={{ fontSize: '11px' }}>Dólar en Tiempo Real</span>
          </div>
          {showCalc ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </button>

        {showCalc && (
          <div style={{ padding: '20px' }}>
            <SumUpCalculator initialAmountUsd={100} />
          </div>
        )}
      </div>

      {/* Modal Registrar Folio SII */}
      {showInvoiceModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '480px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>Registrar Folio SII</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              La factura se emite externamente en el portal SII (Tipo 110). Aquí se registra el folio y se adjunta el PDF para trazabilidad y auditoría.
            </p>
            <form onSubmit={handleCreateInvoice}>
              <div className="form-group">
                <label className="form-label">Número de Folio SII *</label>
                <input type="number" className="form-input" placeholder="Ej: 12345" value={invFolio} onChange={(e) => setInvFolio(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Expediente Asociado *</label>
                <select className="form-select" value={invExpedientId} onChange={(e) => setInvExpedientId(e.target.value)} required>
                  <option value="">Seleccione un expediente...</option>
                  {expedients.map((exp) => (
                    <option key={exp.id} value={exp.id}>{exp.code} — {exp.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monto Neto (USD) *</label>
                <input type="number" step="0.01" className="form-input" placeholder="Ej: 2500.00" value={invAmountUsd} onChange={(e) => setInvAmountUsd(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de Emisión *</label>
                <input type="date" className="form-input" value={invIssuedAt} onChange={(e) => setInvIssuedAt(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Archivo PDF Oficial Factura SII <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(recomendado)</span></label>
                <input type="file" accept="application/pdf" className="form-input" onChange={(e) => setInvFile(e.target.files?.[0] || null)} />
              </div>
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(0,168,150,0.08)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)', fontSize: '12px', marginBottom: '20px', color: 'var(--accent-primary)' }}>
                🔒 Tratamiento tributario: <strong>EXPORT_SERVICE (Sin IVA)</strong> — normativa de exportación de servicios.
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={submittingInvoice}>
                  {submittingInvoice ? 'Guardando...' : 'Registrar Folio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
