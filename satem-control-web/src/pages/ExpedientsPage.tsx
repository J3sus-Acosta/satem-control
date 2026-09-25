import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FolderKanban, Plus, CheckCircle, AlertTriangle, Download,
  FileText, Lock, ShieldAlert, Clock, History, FilePlus, Upload,
  DollarSign, Receipt, CreditCard, ExternalLink, ChevronDown, ChevronUp, RotateCcw,
  Trash2, Calculator, X
} from 'lucide-react';
import { SumUpCalculator } from '../components/SumUpCalculator';

export const ExpedientsPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';
  const navigate = useNavigate();

  const [expedients, setExpedients] = useState<any[]>([]);
  const [selectedExpedient, setSelectedExpedient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'integrity' | 'exceptions' | 'documents' | 'history'>('integrity');
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSumUpModal, setShowSumUpModal] = useState(false);
  const [sidebarLimit, setSidebarLimit] = useState<number>(6);

  // Form Factura SII
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invFolio, setInvFolio] = useState('');
  const [invDocType, setInvDocType] = useState('110');
  const [invAmount, setInvAmount] = useState('');
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [invFile, setInvFile] = useState<File | null>(null);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

  // Form Comprobante de Pago / Informe SumUp
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payAllocatedAmount, setPayAllocatedAmount] = useState<number | null>(null);
  const [payCurrency, setPayCurrency] = useState('CLP');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState('SumUp Link');
  const [payRef, setPayRef] = useState('');
  const [payUsdEquivalent, setPayUsdEquivalent] = useState('');
  const [payExchangeRate, setPayExchangeRate] = useState('');
  const [payFile, setPayFile] = useState<File | null>(null);
  const [sumUpInfo, setSumUpInfo] = useState<any>(null);
  const [parsingSumUp, setParsingSumUp] = useState(false);
  const [uploadingPayment, setUploadingPayment] = useState(false);

  // Datos auxiliares
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  // Form Nuevo Expediente
  const [newTitle, setNewTitle] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedContract, setSelectedContract] = useState('');
  const [taxTreatment, setTaxTreatment] = useState('EXPORT_SERVICE');

  // MEJ-02: Modal excepción manual
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [excTitle, setExcTitle] = useState('');
  const [excDescription, setExcDescription] = useState('');
  const [excSeverity, setExcSeverity] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('WARNING');

  // MEJ-07: Historial
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ————————————————————————
  // Fetch expedients
  // ————————————————————————
  const fetchExpedients = () => {
    setLoading(true);
    api.get('/expedients')
      .then((res) => {
        setExpedients(res.data.data);
        if (res.data.data.length > 0 && !selectedExpedient) {
          fetchExpedientDetail(res.data.data[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchExpedientDetail = (id: string) => {
    api.get(`/expedients/${id}`)
      .then((res) => setSelectedExpedient(res.data.data))
      .catch((err) => console.error(err));
  };

  const fetchContractsByCustomer = (customerId: string) => {
    if (!customerId) { setContracts([]); return; }
    api.get('/contracts')
      .then((res) => {
        const filtered = (res.data.data as any[]).filter(c => c.customerId === customerId);
        setContracts(filtered);
      })
      .catch(() => setContracts([]));
  };

  const fetchHistory = (expedientId: string) => {
    setLoadingHistory(true);
    api.get(`/audit-logs?entity=Expedient&entityId=${expedientId}`)
      .then((res) => setAuditLogs(res.data.data || []))
      .catch(() => setAuditLogs([]))
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    fetchExpedients();
    api.get('/customers').then((res) => setCustomers(res.data.data));
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && selectedExpedient) {
      fetchHistory(selectedExpedient.id);
    }
  }, [activeTab, selectedExpedient?.id]);

  // ————————————————————————
  // Handlers
  // ————————————————————————
  const handleUploadSignedPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingDocId || !selectedFile) return;
    const formData = new FormData();
    formData.append('signedPdf', selectedFile);
    try {
      await api.post(`/document-instances/${uploadingDocId}/upload-signed`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Documento firmado subido con éxito');
      setUploadingDocId(null);
      setSelectedFile(null);
      if (selectedExpedient) fetchExpedientDetail(selectedExpedient.id);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al subir el documento firmado');
    }
  };

  const handleUploadInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpedient || !invFile) {
      alert('Por favor selecciona el archivo PDF de la Factura SII.');
      return;
    }
    setUploadingInvoice(true);
    const formData = new FormData();
    formData.append('expedientId', selectedExpedient.id);
    formData.append('siiFolio', invFolio);
    formData.append('siiDocType', invDocType);
    formData.append('issueDate', invDate);
    formData.append('currency', 'USD');
    formData.append('netAmount', invAmount);
    formData.append('totalAmount', invAmount);
    formData.append('taxTreatment', selectedExpedient.taxTreatment || 'EXPORT_SERVICE');
    formData.append('invoiceFile', invFile);

    try {
      await api.post('/invoices/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Factura SII cargada e incorporada exitosamente al expediente.');
      setShowInvoiceModal(false);
      setInvFolio('');
      setInvAmount('');
      setInvFile(null);
      fetchExpedientDetail(selectedExpedient.id);
      fetchExpedients();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.response?.data?.message || 'Error al subir la Factura SII');
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handlePayFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPayFile(file);
    setSumUpInfo(null);
    setPayAllocatedAmount(null);

    if (!file) return;

    // Si es PDF o imagen, analizar si corresponde al Informe de Depósitos SumUp
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setParsingSumUp(true);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await api.post('/payments/parse-sumup', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.data?.isSumUpReport) {
          const info = res.data.data;
          setSumUpInfo(info);
          if (info.grossAmount > 0) setPayAmount(String(info.grossAmount));
          if (info.netAmount > 0) setPayAllocatedAmount(info.netAmount);
          if (info.currency) setPayCurrency(info.currency);
          if (info.referenceNumber) setPayRef(info.referenceNumber);
          if (info.periodDate) setPayDate(info.periodDate);
          setPayMethod('SumUp Link');
        }
      } catch (err) {
        // Fallback silencioso si no es SumUp
      } finally {
        setParsingSumUp(false);
      }
    }
  };

  const handleUploadPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpedient || !payFile) {
      alert('Por favor selecciona el comprobante o informe de pago.');
      return;
    }
    setUploadingPayment(true);
    const formData = new FormData();
    formData.append('expedientId', selectedExpedient.id);
    formData.append('amount', payAmount);
    if (payAllocatedAmount) {
      formData.append('allocatedAmount', String(payAllocatedAmount));
    }
    formData.append('currency', payCurrency);
    formData.append('paymentDate', payDate);
    formData.append('paymentMethod', payMethod);
    if (payRef) formData.append('transactionRef', payRef);
    if (payUsdEquivalent) formData.append('usdEquivalent', payUsdEquivalent);
    if (payExchangeRate) formData.append('exchangeRate', payExchangeRate);
    formData.append('proofFile', payFile);

    try {
      await api.post('/payments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Comprobante/Informe de pago cargado e incorporado exitosamente al expediente.');
      setShowPaymentModal(false);
      setPayAmount('');
      setPayAllocatedAmount(null);
      setPayRef('');
      setPayUsdEquivalent('');
      setPayExchangeRate('');
      setPayFile(null);
      setSumUpInfo(null);
      fetchExpedientDetail(selectedExpedient.id);
      fetchExpedients();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.response?.data?.message || 'Error al subir comprobante de pago');
    } finally {
      setUploadingPayment(false);
    }
  };

  const handleCreateExpedient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expedients', {
        customerId: selectedCustomer,
        contractId: selectedContract || undefined,
        title: newTitle,
        taxTreatment,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setSelectedCustomer('');
      setSelectedContract('');
      fetchExpedients();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al crear expediente');
    }
  };

  const handleCloseExpedient = async (hasException: boolean) => {
    if (!selectedExpedient) return;
    const reason = prompt('Ingrese la justificación de cierre de la operación:');
    if (!reason) return;
    try {
      await api.post(`/expedients/${selectedExpedient.id}/close`, {
        status: hasException ? 'CLOSED_WITH_EXCEPTION' : 'CLOSED',
        reason,
      });
      fetchExpedientDetail(selectedExpedient.id);
      fetchExpedients();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al cerrar expediente');
    }
  };

  const handleReopenExpedient = async () => {
    if (!selectedExpedient) return;
    const reason = prompt('Ingrese el motivo de reapertura del expediente (para registro de auditoría):', 'Reapertura para completar antecedentes operativos/financieros');
    if (!reason) return;
    try {
      await api.post(`/expedients/${selectedExpedient.id}/reopen`, { reason });
      alert('Expediente reabierto exitosamente. Ahora puedes continuar cargando y modificando documentos.');
      fetchExpedientDetail(selectedExpedient.id);
      fetchExpedients();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al reabrir expediente');
    }
  };

  const handleDownloadBundle = async (id: string, code?: string) => {
    try {
      const response = await api.get(`/expedients/${id}/bundle`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/zip' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Expediente_${code || selectedExpedient?.code || id}_Audit_Bundle.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert('Error al descargar el paquete ZIP de auditoría del expediente');
    }
  };

  const handleViewPdf = async (docId: string, docNumber?: string) => {
    try {
      const response = await api.get(`/document-instances/${docId}/pdf`, { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileUrl = window.URL.createObjectURL(file);
      const w = window.open(fileUrl, '_blank');
      if (!w) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = `${docNumber || 'DOCUMENTO'}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err: any) {
      let msg = 'Error al descargar o abrir el PDF del documento';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          msg = parsed.error?.message || parsed.message || msg;
        } catch {
          // fallback
        }
      }
      alert(msg);
    }
  };

  const handleViewSignedPdf = async (docId: string, docNumber?: string) => {
    try {
      const response = await api.get(`/document-instances/${docId}/signed-pdf`, { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileUrl = window.URL.createObjectURL(file);
      const w = window.open(fileUrl, '_blank');
      if (!w) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = `${docNumber || 'DOCUMENTO'}-FIRMADO.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err: any) {
      let msg = 'Error al descargar o abrir el PDF firmado';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          msg = parsed.error?.message || parsed.message || msg;
        } catch {
          // fallback
        }
      } else if (err.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      }
      alert(msg);
    }
  };

  const handleViewAttachedDoc = async (docId: string, filename?: string) => {
    try {
      const response = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const contentType = typeof response.headers['content-type'] === 'string' ? response.headers['content-type'] : 'application/pdf';
      const file = new Blob([response.data], { type: contentType });
      const fileUrl = window.URL.createObjectURL(file);
      const w = window.open(fileUrl, '_blank');
      if (!w) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = filename || 'documento.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(fileUrl);
      }
    } catch (err: any) {
      alert('Error al descargar o visualizar el documento adjunto');
    }
  };

  const handleDeleteAttachedDoc = async (docId: string, filename?: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el documento "${filename || 'seleccionado'}"? Esta acción lo removerá de este expediente permanentemente.`)) {
      return;
    }
    try {
      await api.delete(`/documents/${docId}`);
      if (selectedExpedient) {
        await fetchExpedientDetail(selectedExpedient.id);
        await fetchExpedients();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al eliminar el documento adjunto');
    }
  };

  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpedient) return;
    try {
      await api.post('/exceptions', {
        expedientId: selectedExpedient.id,
        title: excTitle,
        description: excDescription,
        severity: excSeverity,
      });
      setShowExceptionModal(false);
      setExcTitle('');
      setExcDescription('');
      setExcSeverity('WARNING');
      fetchExpedientDetail(selectedExpedient.id);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message;
      if (err.response?.status === 404) {
        alert('El endpoint POST /exceptions aún no está implementado en la API.');
      } else {
        alert(msg || 'Error al registrar la excepción');
      }
    }
  };

  const severityBadge = (sev: string) => {
    if (sev === 'CRITICAL') return <span className="badge badge-danger">CRÍTICA</span>;
    if (sev === 'WARNING')  return <span className="badge badge-warning">ADVERTENCIA</span>;
    return <span className="badge badge-info">INFO</span>;
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Cargando expedientes...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Gestión de Expedientes (EXP-YYYY-NNNNNN)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Unidad central de control operativo, facturación, integridad y snapshots de cierre SATEM.
          </p>
        </div>
        {!isViewer && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={18} /> Nuevo Expediente
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Lista lateral */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 180px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
              Expedientes ({expedients.length})
            </h3>
            {sidebarLimit < expedients.length && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {Math.min(sidebarLimit, expedients.length)} de {expedients.length}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
            {expedients.slice(0, sidebarLimit).map((exp) => (
              <div
                key={exp.id}
                onClick={() => { fetchExpedientDetail(exp.id); }}
                style={{
                  padding: '12px', borderRadius: 'var(--radius-sm)',
                  backgroundColor: selectedExpedient?.id === exp.id ? '#334155' : '#0f172a',
                  border: '1px solid',
                  borderColor: selectedExpedient?.id === exp.id ? 'var(--accent-primary)' : 'var(--border-color)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--accent-primary)' }}>{exp.code}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{exp.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{exp.customer?.legalName}</div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="badge badge-info">{exp.status}</span>
                  <span className="badge badge-success">{exp.taxTreatment}</span>
                </div>
              </div>
            ))}
          </div>

          {expedients.length > 6 && (
            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
              {sidebarLimit < expedients.length ? (
                <button
                  type="button"
                  onClick={() => setSidebarLimit((prev) => Math.min(prev + 6, expedients.length))}
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ChevronDown size={15} /> Cargar más expedientes ({expedients.length - sidebarLimit} restantes)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSidebarLimit(6)}
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ChevronUp size={15} /> Contraer lista
                </button>
              )}
            </div>
          )}
        </div>

        {/* Detalle 360° */}
        {selectedExpedient ? (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            {/* Header expediente */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: '22px' }}>{selectedExpedient.code}</h2>
                  <span className="badge badge-info">{selectedExpedient.status}</span>
                  <span className="badge badge-success">{selectedExpedient.taxTreatment}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>{selectedExpedient.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Cliente: <strong>{selectedExpedient.customer?.legalName}</strong> ({selectedExpedient.customer?.country?.name}) | Tax ID: {selectedExpedient.customer?.taxId}
                </div>
              </div>

              {!isViewer && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleDownloadBundle(selectedExpedient.id, selectedExpedient.code)} className="btn btn-secondary">
                    <Download size={16} /> ZIP Bundle
                  </button>
                  {(selectedExpedient.status === 'CLOSED' || selectedExpedient.status === 'CLOSED_WITH_EXCEPTION') && (
                    <button
                      onClick={handleReopenExpedient}
                      className="btn btn-secondary"
                      style={{ backgroundColor: '#1e293b', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <RotateCcw size={16} /> Reabrir Expediente
                    </button>
                  )}
                  {selectedExpedient.status !== 'CLOSED' && selectedExpedient.status !== 'CLOSED_WITH_EXCEPTION' && (
                    <>
                      <button onClick={() => handleCloseExpedient(false)} className="btn btn-primary">
                        <Lock size={16} /> Cierre 100%
                      </button>
                      <button onClick={() => handleCloseExpedient(true)} className="btn btn-secondary" style={{ backgroundColor: 'var(--warning)', color: '#000' }}>
                        <AlertTriangle size={16} /> Cierre c/Excepción
                      </button>
                    </>
                  )}
                </div>
              )}
              {isViewer && (
                <button onClick={() => handleDownloadBundle(selectedExpedient.id, selectedExpedient.code)} className="btn btn-secondary">
                  <Download size={16} /> ZIP Bundle
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="tabs-nav">
              {[
                { key: 'integrity',  label: `Integridad (${selectedExpedient.integrityItems?.filter((i: any) => i.status === 'COMPLETED').length || 0}/${selectedExpedient.integrityItems?.length || 0})` },
                { key: 'exceptions', label: `Excepciones (${selectedExpedient.exceptions?.length || 0})` },
                { key: 'documents',  label: `Documentos (${(selectedExpedient.documentInstances?.length || 0) + (selectedExpedient.documentLinks?.length || 0)})` },
                { key: 'summary',    label: 'Resumen Operativo' },
                { key: 'history',    label: 'Historial' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`tab-btn ${activeTab === key ? 'active' : ''}`}
                  onClick={() => setActiveTab(key as any)}
                >
                  {key === 'history' && <History size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
                  {label}
                </button>
              ))}
            </div>

            {/* TAB: Resumen Operativo */}
            {activeTab === 'summary' && (
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Cadena Operativa & Documental</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'Contrato / SOW', value: selectedExpedient.contract ? selectedExpedient.contract.code : 'Sin contrato específico' },
                    {
                      label: 'Órdenes de Trabajo (OT)',
                      value: `${(selectedExpedient.workOrders?.length || 0) + (selectedExpedient.documentInstances?.filter((d: any) => d.category === 'WORK_ORDER' || d.template?.category === 'WORK_ORDER').length || 0)} registrada(s)`
                    },
                    {
                      label: 'Atenciones Técnicas SATEM',
                      value: `${selectedExpedient.documentInstances?.filter((d: any) => d.category === 'ATTENTION_REPORT' || d.template?.category === 'ATTENTION_REPORT').length || 0} ejecutada(s)`
                    },
                    { label: 'Facturas SII Registradas', value: `${selectedExpedient.invoices?.length || 0} emitidas` },
                    {
                      label: 'Comprobantes de Pago',
                      value: `${(selectedExpedient.payments?.length || 0) + (selectedExpedient.documentLinks?.filter((l: any) => l.document?.category === 'PAYMENT_RECEIPT').length || 0)} registrado(s)`
                    },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: '14px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>{value}</div>
                    </div>
                  ))}
                </div>
                {selectedExpedient.snapshots?.length > 0 && (
                  <div style={{ padding: '16px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)' }}>
                    <h4 style={{ color: 'var(--success)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={18} /> Snapshot de Cierre Congelado
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      SHA-256: <code>{selectedExpedient.snapshots[0].checksumSha256}</code>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Integridad */}
            {activeTab === 'integrity' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px' }}>Checklist de Integridad Operativa y Auditoría</h3>
                  {!isViewer && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setShowSumUpModal(true)}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                        title="Calcular cobro SumUp en CLP con Dólar Observado en vivo"
                      >
                        <Calculator size={14} /> Calculadora SumUp
                      </button>
                      <button
                        onClick={() => setShowInvoiceModal(true)}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        <Receipt size={14} /> + Cargar Factura SII
                      </button>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        <CreditCard size={14} /> + Cargar Comprobante Pago
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedExpedient.integrityItems?.map((item: any) => {
                    const isCompleted = item.status === 'COMPLETED';
                    const docId = item.documentId || item.document?.id;

                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '14px 16px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)',
                          borderLeft: '4px solid',
                          borderColor: isCompleted ? 'var(--success)' : 'var(--warning)',
                        }}
                      >
                        <div style={{ flex: 1, marginRight: '16px' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.name}
                            {item.isRequired && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(Obligatorio)</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Categoría: {item.category}</div>
                          {item.observation && (
                            <div style={{ fontSize: '11.5px', color: 'var(--success)', marginTop: '4px', fontWeight: 600 }}>
                              ✓ {item.observation}
                            </div>
                          )}
                          {item.code === 'RECONCILIATION_COMPLETED' && (
                            <div style={{ marginTop: '10px', maxWidth: '460px' }}>
                              {(() => {
                                const match = item.observation?.match(/Progreso:\s*(\d+)%/) || item.observation?.match(/Pagado y Conciliado:\s*(\d+)%/);
                                const reconPct = match ? parseInt(match[1], 10) : (isCompleted ? 100 : 0);
                                return (
                                  <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '5px' }}>
                                      <span style={{ color: 'var(--text-secondary)' }}>Progreso de Cobro del Contrato (USD)</span>
                                      <span style={{ fontWeight: 'bold', color: reconPct >= 100 ? 'var(--success)' : (reconPct > 0 ? 'var(--warning)' : 'var(--text-muted)') }}>
                                        {reconPct}% {reconPct >= 100 ? '(Totalmente Pagado)' : (reconPct > 0 ? '(Abono Parcial Recibido)' : '(Pendiente de Abono)')}
                                      </span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                      <div
                                        style={{
                                          width: `${Math.max(0, Math.min(100, reconPct))}%`,
                                          height: '100%',
                                          background: reconPct >= 100
                                            ? 'linear-gradient(90deg, #10b981, #059669)'
                                            : 'linear-gradient(90deg, #f59e0b, #d97706)',
                                          borderRadius: '4px',
                                          transition: 'width 0.4s ease'
                                        }}
                                      />
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                          {item.completedAt && (
                            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Completado el: {new Date(item.completedAt).toLocaleString('es-CL')}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* Botones de acción contextual para cada regla */}
                          {item.code === 'INVOICE_REGISTERED' && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {docId && (
                                <button
                                  onClick={() => handleViewAttachedDoc(docId, `FACTURA_SII_${selectedExpedient.code}.pdf`)}
                                  className="btn btn-secondary"
                                  style={{ fontSize: '11px', padding: '4px 10px' }}
                                >
                                  <FileText size={13} /> Ver Factura
                                </button>
                              )}
                              {!isViewer && (
                                <button
                                  onClick={() => setShowInvoiceModal(true)}
                                  className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                                  style={{ fontSize: '11px', padding: '4px 10px' }}
                                >
                                  <Upload size={13} /> {isCompleted ? 'Reemplazar Factura' : '+ Cargar Factura SII'}
                                </button>
                              )}
                            </div>
                          )}

                          {item.code === 'PAYMENT_PROOF_PRESENT' && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {docId && (
                                <button
                                  onClick={() => handleViewAttachedDoc(docId, `COMPROBANTE_PAGO_${selectedExpedient.code}.pdf`)}
                                  className="btn btn-secondary"
                                  style={{ fontSize: '11px', padding: '4px 10px' }}
                                >
                                  <FileText size={13} /> Ver Comprobante
                                </button>
                              )}
                              {!isViewer && (
                                <button
                                  onClick={() => setShowPaymentModal(true)}
                                  className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                                  style={{ fontSize: '11px', padding: '4px 10px' }}
                                >
                                  <Upload size={13} /> {isCompleted ? 'Reemplazar' : '+ Cargar Comprobante'}
                                </button>
                              )}
                            </div>
                          )}

                          {item.code === 'RECONCILIATION_COMPLETED' && (
                            <button
                              onClick={() => navigate('/bank')}
                              className="btn btn-secondary"
                              style={{ fontSize: '11px', padding: '4px 10px' }}
                            >
                              <ExternalLink size={13} /> Ir a Conciliación Bancaria
                            </button>
                          )}

                          {item.code === 'WORK_ORDER_PRESENT' && !isCompleted && !isViewer && (
                            <button
                              onClick={() => navigate(`/documents/generator?customerId=${selectedExpedient.customerId}&expedientId=${selectedExpedient.id}`)}
                              className="btn btn-primary"
                              style={{ fontSize: '11px', padding: '4px 10px' }}
                            >
                              <FilePlus size={13} /> + Generar OT
                            </button>
                          )}

                          {isCompleted ? (
                            <span className="badge badge-success">✓ COMPLETO</span>
                          ) : (
                            <span className="badge badge-warning">⚠ PENDIENTE</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: Excepciones — MEJ-02 */}
            {activeTab === 'exceptions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px' }}>
                    Excepciones del Expediente ({selectedExpedient.exceptions?.length || 0})
                  </h3>
                  {!isViewer && (
                    <button onClick={() => setShowExceptionModal(true)} className="btn btn-secondary" style={{ fontSize: '13px', padding: '6px 12px' }}>
                      <ShieldAlert size={15} /> Registrar Excepción
                    </button>
                  )}
                </div>

                {selectedExpedient.exceptions?.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <ShieldAlert size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.2 }} />
                    Sin excepciones registradas para este expediente.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedExpedient.exceptions?.map((exc: any) => (
                      <div
                        key={exc.id}
                        style={{
                          padding: '14px 16px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)',
                          borderLeft: '4px solid',
                          borderColor: exc.severity === 'CRITICAL' ? 'var(--danger)' : exc.severity === 'WARNING' ? 'var(--warning)' : 'var(--info)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            {severityBadge(exc.severity)}
                            <span style={{ fontWeight: 700, fontSize: '14px' }}>{exc.title}</span>
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{exc.description}</div>
                          {exc.resolutionNote && (
                            <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px' }}>
                              ✓ Resolución: {exc.resolutionNote}
                            </div>
                          )}
                        </div>
                        <div>
                          {exc.status === 'OPEN' && <span className="badge badge-danger">ABIERTA</span>}
                          {exc.status === 'RESOLVED' && <span className="badge badge-success">RESUELTA</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Documentos */}
            {activeTab === 'documents' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px' }}>Documentos Oficiales, Firmas y Adjuntos Tributarios</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      🔒 Todos los documentos emitidos, recepcionados con firma del cliente, facturas SII y comprobantes se preservan inmutables para soporte de auditoría.
                    </p>
                  </div>
                  {!isViewer && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => navigate(`/documents/generator?customerId=${selectedExpedient.customerId}&expedientId=${selectedExpedient.id}${selectedExpedient.contractId ? `&contractId=${selectedExpedient.contractId}` : ''}`)}
                        className="btn btn-primary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        <FilePlus size={14} /> + Generar Documento / OT
                      </button>
                      <button
                        onClick={() => setShowInvoiceModal(true)}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        <Receipt size={14} /> + Cargar Factura SII
                      </button>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        <CreditCard size={14} /> + Cargar Comprobante
                      </button>
                    </div>
                  )}
                </div>

                {/* 1. Documentos Generados / Plantillas */}
                <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.4px' }}>
                  Instancias Documentales Oficiales SATEM ({selectedExpedient.documentInstances?.length || 0})
                </h4>

                {selectedExpedient.documentInstances?.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
                    <FileText size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                    No hay actas o contratos generados para este expediente todavía.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {selectedExpedient.documentInstances?.map((doc: any) => (
                      <div
                        key={doc.id}
                        style={{
                          padding: '14px 16px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)',
                          border: doc.status === 'SIGNED' ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border-color)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          boxShadow: doc.status === 'SIGNED' ? '0 0 15px rgba(16,185,129,0.08)' : 'none',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--accent-primary)' }}>{doc.documentNumber || doc.code}</span>
                            <span className={`badge ${doc.status === 'SIGNED' ? 'badge-success' : 'badge-info'}`}>
                              {doc.status === 'SIGNED' ? '✓ FIRMADO POR CLIENTE' : 'EMITIDO (PENDIENTE DE FIRMA)'}
                            </span>
                            <span className="badge badge-secondary">{doc.category}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Plantilla: <strong>{doc.template?.name || 'Documento Oficial SATEM'}</strong>
                          </div>
                          {doc.signedAt && (
                            <div style={{ fontSize: '11.5px', color: 'var(--success)', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={13} /> Firma recepcionada: {new Date(doc.signedAt).toLocaleString('es-CL')}
                              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>
                                (SHA-256: <code>{doc.signedPdfHash?.substring(0, 16)}...</code>)
                              </span>
                            </div>
                          )}
                          {doc.generatedPdfHash && !doc.signedAt && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              SHA-256 Emitido: <code>{doc.generatedPdfHash.substring(0, 16)}...</code>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {doc.status === 'SIGNED' && doc.signedPdfPath && (
                            <button
                              onClick={() => handleViewSignedPdf(doc.id, doc.documentNumber)}
                              className="btn btn-success"
                              style={{ fontSize: '12px', backgroundColor: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <CheckCircle size={14} /> Ver PDF Firmado
                            </button>
                          )}
                          <button
                            onClick={() => handleViewPdf(doc.id, doc.documentNumber)}
                            className="btn btn-secondary"
                            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <FileText size={14} /> Ver PDF Emitido
                          </button>
                          {!isViewer && (
                            <button
                              onClick={() => setUploadingDocId(doc.id)}
                              className="btn btn-secondary"
                              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Upload size={14} /> {doc.status === 'SIGNED' ? 'Reemplazar Firmado' : 'Subir PDF Firmado'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Documentos Adjuntos Externos (Facturas SII, Pagos, Evidencias) */}
                <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.4px' }}>
                  Documentos Externos & Adjuntos ({selectedExpedient.documentLinks?.length || 0})
                </h4>

                {selectedExpedient.documentLinks?.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)' }}>
                    <Receipt size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                    No hay facturas SII ni comprobantes externos cargados.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedExpedient.documentLinks?.map((link: any) => {
                      const doc = link.document;
                      if (!doc) return null;
                      return (
                        <div
                          key={link.id || doc.id}
                          style={{
                            padding: '14px 16px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>{doc.originalName}</span>
                              <span className="badge badge-success">{doc.category}</span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              SHA-256: <code>{doc.sha256?.substring(0, 20)}...</code> | Tamaño: {((Number(doc.fileSize) || 0) / 1024).toFixed(1)} KB | Subido: {new Date(doc.createdAt).toLocaleString('es-CL')}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              onClick={() => handleViewAttachedDoc(doc.id, doc.originalName)}
                              className="btn btn-secondary"
                              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <FileText size={14} /> Ver Documento
                            </button>
                            {!isViewer && (
                              <button
                                onClick={() => handleDeleteAttachedDoc(doc.id, doc.originalName)}
                                className="btn btn-danger"
                                style={{
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  padding: '6px 12px',
                                  borderRadius: 'var(--radius-sm)',
                                  cursor: 'pointer'
                                }}
                                title="Eliminar documento adjunto del expediente"
                              >
                                <Trash2 size={14} /> Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Modal subir PDF firmado */}
                {uploadingDocId && (
                  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', width: '420px' }}>
                      <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Cargar Documento Firmado por Cliente</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Selecciona el archivo PDF firmado por el cliente. Este archivo quedará incorporado permanentemente en el expediente y en el paquete ZIP de auditoría.
                      </p>
                      <form onSubmit={handleUploadSignedPdf}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                          <label className="form-label">Archivo PDF Firmado</label>
                          <input type="file" accept="application/pdf" className="form-input" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} required />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button type="button" onClick={() => setUploadingDocId(null)} className="btn btn-secondary">Cancelar</button>
                          <button type="submit" className="btn btn-primary" disabled={!selectedFile}>Confirmar y Guardar en Expediente</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Historial — MEJ-07 */}
            {activeTab === 'history' && (
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={18} color="var(--accent-primary)" /> Historial de Actividad
                </h3>
                {loadingHistory ? (
                  <div style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>Cargando historial...</div>
                ) : auditLogs.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <Clock size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.2 }} />
                    Sin registros de auditoría para este expediente.
                    <div style={{ fontSize: '12px', marginTop: '8px' }}>Los eventos se registran cuando se crean, modifican o cierran los expedientes.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {auditLogs.map((log: any) => (
                      <div
                        key={log.id}
                        style={{
                          display: 'flex', gap: '16px', alignItems: 'flex-start',
                          padding: '12px 16px', backgroundColor: '#0f172a',
                          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', marginTop: '5px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent-primary)' }}>{log.action}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {new Date(log.createdAt).toLocaleString('es-CL')}
                            </span>
                          </div>
                          {log.user && (
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              Por: {log.user.fullName} ({log.user.role})
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
            Seleccione un expediente para visualizar el detalle 360°.
          </div>
        )}
      </div>

      {/* Modal Cargar Factura SII */}
      {showInvoiceModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '500px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={20} color="var(--accent-primary)" /> Cargar Factura SII al Expediente
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Expediente: <strong style={{ color: 'var(--accent-primary)' }}>{selectedExpedient?.code}</strong> — {selectedExpedient?.title}
            </p>
            <form onSubmit={handleUploadInvoiceSubmit}>
              <div className="form-group">
                <label className="form-label">Número de Folio SII *</label>
                <input
                  type="number" className="form-input" placeholder="Ej: 12345"
                  value={invFolio} onChange={(e) => setInvFolio(e.target.value)} required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo Documento SII</label>
                  <select className="form-select" value={invDocType} onChange={(e) => setInvDocType(e.target.value)}>
                    <option value="110">Tipo 110 (Exportación Sin IVA)</option>
                    <option value="33">Tipo 33 (Factura Electrónica)</option>
                    <option value="34">Tipo 34 (Factura No Afecta / Exenta)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Monto Total (USD) *</label>
                  <input
                    type="number" step="0.01" className="form-input" placeholder="Ej: 2500.00"
                    value={invAmount} onChange={(e) => setInvAmount(e.target.value)} required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Emisión SII *</label>
                <input
                  type="date" className="form-input"
                  value={invDate} onChange={(e) => setInvDate(e.target.value)} required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Archivo PDF Oficial del SII *</label>
                <input
                  type="file" accept="application/pdf" className="form-input"
                  onChange={(e) => setInvFile(e.target.files?.[0] || null)} required
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  El archivo se guardará en la carpeta <code>06-Facturacion/</code> del expediente y se verificará su Hash SHA-256.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={uploadingInvoice || !invFile}>
                  {uploadingInvoice ? 'Subiendo e Integrando...' : 'Cargar y Validar Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cargar Comprobante de Pago / Informe SumUp */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={20} color="var(--accent-primary)" /> Registrar Informe de Depósito SumUp / Pago
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Expediente: <strong style={{ color: 'var(--accent-primary)' }}>{selectedExpedient?.code}</strong> — {selectedExpedient?.title}
            </p>
            <form onSubmit={handleUploadPaymentSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Archivo de Pago / Informe SumUp (PDF o Imagen) *</label>
                <input
                  type="file" accept="application/pdf,image/*" className="form-input"
                  onChange={handlePayFileChange} required
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Sube el <strong>Informe de Depósitos oficial de SumUp</strong> (PDF o captura). El sistema extraerá automáticamente el monto bruto, comisiones, monto neto y referencia para la conciliación bancaria Santander.
                </div>
              </div>

              {parsingSumUp && (
                <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--accent-primary)' }}>
                  Analizando estructura del Informe de Depósitos SumUp...
                </div>
              )}

              {sumUpInfo && (
                <div style={{ padding: '14px', marginBottom: '16px', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: '6px', fontSize: '13px' }}>
                    ✓ Informe de Depósito SumUp Extraído Exitosamente
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', color: 'var(--text-secondary)' }}>
                    <div><strong>Bruto Tarjeta:</strong> ${sumUpInfo.grossAmount?.toLocaleString('es-CL')} CLP</div>
                    <div><strong>Comisión SumUp:</strong> -${sumUpInfo.feeAmount?.toLocaleString('es-CL')} CLP</div>
                    <div style={{ color: 'var(--success)', fontWeight: 600 }}><strong>Depósito Neto:</strong> ${sumUpInfo.netAmount?.toLocaleString('es-CL')} CLP</div>
                    <div><strong>Referencia:</strong> {sumUpInfo.referenceNumber || 'N/A'}</div>
                    <div><strong>Periodo Depósito:</strong> {sumUpInfo.periodDate || 'N/A'}</div>
                    <div><strong>RUT Comercio:</strong> {sumUpInfo.companyRut || 'N/A'}</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Monto Bruto Pagado *</label>
                  <input
                    type="number" step="0.01" className="form-input" placeholder="Ej: 10000"
                    value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Moneda</label>
                  <select className="form-select" value={payCurrency} onChange={(e) => setPayCurrency(e.target.value)}>
                    <option value="CLP">CLP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Método de Pago *</label>
                  <select className="form-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                    <option value="SumUp Link">SumUp Link</option>
                    <option value="Transferencia Santander">Transferencia Santander</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Stripe">Stripe</option>
                    <option value="Transferencia Internacional (SWIFT)">Transferencia SWIFT</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha del Pago / Depósito *</label>
                  <input
                    type="date" className="form-input"
                    value={payDate} onChange={(e) => setPayDate(e.target.value)} required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Equivalente en USD Pactado <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  <input
                    type="number" step="0.01" className="form-input" placeholder="Ej: 50.00"
                    value={payUsdEquivalent} onChange={(e) => setPayUsdEquivalent(e.target.value)}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Monto que amortiza este pago del contrato</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Cambio Aplicado <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(CLP/USD)</span></label>
                  <input
                    type="number" step="0.01" className="form-input" placeholder="Ej: 955.00"
                    value={payExchangeRate} onChange={(e) => setPayExchangeRate(e.target.value)}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Dólar fijado al momento del cobro</div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">N° Transacción / Ref. Bancaria <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                <input
                  type="text" className="form-input" placeholder="Ej: PID1772959 o comprobante"
                  value={payRef} onChange={(e) => setPayRef(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowPaymentModal(false); setSumUpInfo(null); }} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={uploadingPayment || !payFile}>
                  {uploadingPayment ? 'Subiendo e Integrando...' : 'Cargar Informe / Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Expediente — MEJ-05: selector de contrato */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '500px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Crear Nuevo Expediente</h3>
            <form onSubmit={handleCreateExpedient}>
              <div className="form-group">
                <label className="form-label">Cliente *</label>
                <select
                  className="form-select"
                  value={selectedCustomer}
                  onChange={(e) => { setSelectedCustomer(e.target.value); setSelectedContract(''); fetchContractsByCustomer(e.target.value); }}
                  required
                >
                  <option value="">Seleccione un cliente...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.legalName} ({c.taxId})</option>
                  ))}
                </select>
              </div>

              {/* MEJ-05: Selector de contrato */}
              {selectedCustomer && (
                <div className="form-group">
                  <label className="form-label">Contrato SOW asociado <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  {contracts.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
                      Este cliente no tiene contratos SOW registrados.
                    </div>
                  ) : (
                    <select className="form-select" value={selectedContract} onChange={(e) => setSelectedContract(e.target.value)}>
                      <option value="">Sin contrato específico</option>
                      {contracts.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Título del Trabajo / Operación *</label>
                <input
                  type="text" className="form-input"
                  placeholder="Ej: Mantenimiento Preventivo Servidores Q3"
                  value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Tratamiento Tributario Declarado *</label>
                <select className="form-select" value={taxTreatment} onChange={(e) => setTaxTreatment(e.target.value)}>
                  <option value="EXPORT_SERVICE">Servicio Exportación (Sin IVA)</option>
                  <option value="VAT_APPLIED">Afecto a IVA (19%)</option>
                  <option value="VAT_EXEMPT">Exento de IVA</option>
                  <option value="NO_INVOICE">Operación No Facturable</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Expediente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Excepción Manual — MEJ-02 */}
      {showExceptionModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '480px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>Registrar Excepción Manual</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Expediente: <strong style={{ color: 'var(--accent-primary)' }}>{selectedExpedient?.code}</strong>
            </p>
            <form onSubmit={handleCreateException}>
              <div className="form-group">
                <label className="form-label">Título de la Excepción *</label>
                <input type="text" className="form-input" value={excTitle} onChange={(e) => setExcTitle(e.target.value)}
                  placeholder="Ej: Cliente no firmó en plazo acordado" required />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción Detallada *</label>
                <textarea className="form-textarea" rows={3} value={excDescription}
                  onChange={(e) => setExcDescription(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Severidad</label>
                <select className="form-select" value={excSeverity} onChange={(e) => setExcSeverity(e.target.value as any)}>
                  <option value="INFO">🔵 INFO — Solo informativo</option>
                  <option value="WARNING">🟡 WARNING — Requiere atención</option>
                  <option value="CRITICAL">🔴 CRITICAL — Acción inmediata</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowExceptionModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Excepción</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Calculadora SumUp */}
      {showSumUpModal && selectedExpedient && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', width: '800px', maxWidth: '95vw', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '16px', margin: 0 }}>Calculadora de Cobro SumUp — {selectedExpedient.code}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSumUpModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <SumUpCalculator
                initialAmountUsd={Number(selectedExpedient.contract?.totalAmount || selectedExpedient.invoices?.[0]?.totalAmount || '')}
                expedientCode={selectedExpedient.code}
                customerName={selectedExpedient.customer?.legalName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
