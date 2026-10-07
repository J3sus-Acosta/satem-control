import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calculator, FileSpreadsheet, RefreshCw,
  FileText, ChevronDown, ChevronUp, Plus, Download, Upload, Trash2
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
  const [invCurrency, setInvCurrency] = useState<'CLP' | 'USD'>('CLP');
  const [invDocType, setInvDocType] = useState<number>(33);
  const [invTaxTreatment, setInvTaxTreatment] = useState<string>('VAT_APPLIED');
  const [invAmountNet, setInvAmountNet] = useState('');
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

  const handleExpedientChange = (expId: string) => {
    setInvExpedientId(expId);
    const exp = expedients.find((e) => e.id === expId);
    if (exp) {
      const isChile = exp.customer?.countryCode === 'CL' || exp.customer?.country?.code === 'CL' || exp.contract?.currency === 'CLP';
      if (isChile) {
        setInvCurrency('CLP');
        setInvDocType(33);
        setInvTaxTreatment('VAT_APPLIED');
      } else {
        setInvCurrency('USD');
        setInvDocType(110);
        setInvTaxTreatment('EXPORT_SERVICE');
      }
      if (exp.contract?.totalAmount) {
        setInvAmountNet(String(exp.contract.totalAmount));
      }
    }
  };

  const handleDocTypeChange = (docType: number) => {
    setInvDocType(docType);
    if (docType === 33) {
      setInvTaxTreatment('VAT_APPLIED');
    } else if (docType === 34) {
      setInvTaxTreatment('VAT_EXEMPT');
    } else if (docType === 110) {
      setInvTaxTreatment('EXPORT_SERVICE');
      setInvCurrency('USD');
    }
  };

  const netVal = parseFloat(invAmountNet) || 0;
  const vatVal = (invTaxTreatment === 'VAT_APPLIED' || invDocType === 33) ? Math.round(netVal * 0.19) : 0;
  const totalVal = netVal + vatVal;

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
        formData.append('siiDocType', String(invDocType));
        formData.append('issueDate', invIssuedAt);
        formData.append('currency', invCurrency);
        formData.append('netAmount', String(netVal));
        formData.append('vatAmount', String(vatVal));
        formData.append('totalAmount', String(totalVal));
        formData.append('taxTreatment', invTaxTreatment);
        formData.append('invoiceFile', invFile);

        await api.post('/invoices/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/invoices', {
          siiFolio: parseInt(invFolio, 10),
          siiDocType: invDocType,
          expedientId: invExpedientId,
          netAmount: netVal,
          vatAmount: vatVal,
          totalAmount: totalVal,
          issueDate: new Date(invIssuedAt).toISOString(),
          taxTreatment: invTaxTreatment,
          currency: invCurrency,
        });
      }

      alert(`Factura SII N° ${invFolio} (${invCurrency}) registrada exitosamente.`);
      setShowInvoiceModal(false);
      setInvFolio(''); setInvExpedientId(''); setInvAmountNet(''); setInvFile(null);
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

  const handleDeleteInvoice = async (invoiceId: string, folioInfo: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la Factura SII "${folioInfo}"? Esta acción removerá el registro y actualizará la integridad del expediente.`)) {
      return;
    }
    try {
      await api.delete(`/invoices/${invoiceId}`);
      alert('Factura eliminada exitosamente.');
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al eliminar la factura');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Facturación SII & Cobros SumUp</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Registro de folios SII Tipo 110 (exportación sin IVA), carga de documentos PDF oficiales y simulación de cobro SumUp.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
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
                  <th>Tipo DTE</th>
                  <th>Expediente</th>
                  <th>Cliente</th>
                  <th>Monto Total</th>
                  <th>Fecha Emisión</th>
                  <th>Estado</th>
                  <th>Documento PDF</th>
                  {!isViewer && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {pagedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={isViewer ? 8 : 9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
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
                    const isClpInv = inv.currency === 'CLP';
                    const invAmt = parseFloat(inv.totalAmount || inv.netAmount || 0);

                    return (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                          <div>{folioDisplay}</div>
                          {inv.code && inv.siiFolio && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{inv.code}</div>
                          )}
                        </td>
                        <td>
                          {inv.siiDocType === 33 && <span className="badge badge-success" style={{ fontSize: '10px' }}>DTE 33 (Afecta 19%)</span>}
                          {inv.siiDocType === 34 && <span className="badge badge-warning" style={{ fontSize: '10px' }}>DTE 34 (Exenta)</span>}
                          {(inv.siiDocType === 110 || !inv.siiDocType) && <span className="badge badge-info" style={{ fontSize: '10px' }}>DTE 110 (Exportación)</span>}
                        </td>
                        <td style={{ fontSize: '13px' }}>{inv.expedient?.code || inv.expedientCode || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td>{inv.expedient?.customer?.legalName || inv.customer?.legalName || inv.customerName || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                          {isClpInv ? `$${invAmt.toLocaleString('es-CL')} CLP` : `$${invAmt.toLocaleString()} USD`}
                          {Number(inv.vatAmount || 0) > 0 && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                              (IVA: ${Number(inv.vatAmount).toLocaleString(isClpInv ? 'es-CL' : undefined)})
                            </div>
                          )}
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
                        {!isViewer && (
                          <td>
                            <button
                              onClick={() => handleDeleteInvoice(inv.id, `Folio ${inv.siiFolio || inv.code}`)}
                              className="btn btn-danger"
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer'
                              }}
                              title="Eliminar factura duplicada o errónea"
                            >
                              <Trash2 size={13} /> Eliminar
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Paginación MEJ-09 */}
            {totalPages > 1 && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
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
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Calculadora Dinámica de Cobros SumUp (Exportación USD)</span>
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
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>Registrar Folio SII</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Registra el folio emitido externamente en el portal SII (DTE 33 Afecta, DTE 34 Exenta o DTE 110 Exportación) y adjunta el PDF para auditoría.
            </p>
            <form onSubmit={handleCreateInvoice}>
              <div className="form-group">
                <label className="form-label">Expediente Asociado *</label>
                <select className="form-select" value={invExpedientId} onChange={(e) => handleExpedientChange(e.target.value)} required>
                  <option value="">Seleccione un expediente...</option>
                  {expedients.map((exp) => (
                    <option key={exp.id} value={exp.id}>{exp.code} — {exp.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Número de Folio SII *</label>
                  <input type="number" className="form-input" placeholder="Ej: 12345" value={invFolio} onChange={(e) => setInvFolio(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Documento SII *</label>
                  <select className="form-select" value={invDocType} onChange={(e) => handleDocTypeChange(parseInt(e.target.value, 10))}>
                    <option value={33}>DTE 33 — Factura Electrónica (19% IVA)</option>
                    <option value={34}>DTE 34 — Factura Exenta Nacional</option>
                    <option value={110}>DTE 110 — Factura de Exportación</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Moneda *</label>
                  <select className="form-select" value={invCurrency} onChange={(e) => setInvCurrency(e.target.value as any)}>
                    <option value="CLP">CLP (Pesos Chilenos)</option>
                    <option value="USD">USD (Dólares)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Emisión *</label>
                  <input type="date" className="form-input" value={invIssuedAt} onChange={(e) => setInvIssuedAt(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Monto Neto ({invCurrency}) *</label>
                <input
                  type="number"
                  step={invCurrency === 'CLP' ? '1' : '0.01'}
                  className="form-input"
                  placeholder={invCurrency === 'CLP' ? 'Ej: 1500000' : 'Ej: 2500.00'}
                  value={invAmountNet}
                  onChange={(e) => setInvAmountNet(e.target.value)}
                  required
                />
              </div>

              {/* Desglose Tributario Interactivo */}
              {invDocType === 33 ? (
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Monto Neto:</span>
                    <strong>${netVal.toLocaleString(invCurrency === 'CLP' ? 'es-CL' : undefined)} {invCurrency}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--warning)' }}>
                    <span>IVA (19%):</span>
                    <strong>+ ${vatVal.toLocaleString(invCurrency === 'CLP' ? 'es-CL' : undefined)} {invCurrency}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', color: 'var(--success)' }}>
                    <span>Total Factura:</span>
                    <strong style={{ fontSize: '14px' }}>${totalVal.toLocaleString(invCurrency === 'CLP' ? 'es-CL' : undefined)} {invCurrency}</strong>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(0,168,150,0.08)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '16px', color: 'var(--accent-primary)' }}>
                  🔒 {invDocType === 34 ? 'Factura Exenta Nacional (Sin IVA)' : 'Factura de Exportación (Sin IVA)'}:{' '}
                  <strong>Total: ${totalVal.toLocaleString(invCurrency === 'CLP' ? 'es-CL' : undefined)} {invCurrency}</strong>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Archivo PDF Oficial Factura SII <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(recomendado)</span></label>
                <input type="file" accept="application/pdf" className="form-input" onChange={(e) => setInvFile(e.target.files?.[0] || null)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '16px' }}>
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
