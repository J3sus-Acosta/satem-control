import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FolderKanban, Plus, CheckCircle, AlertTriangle, Download,
  FileText, Lock, ShieldAlert, Clock, History, FilePlus, Upload,
  DollarSign, Receipt, CreditCard, ExternalLink, ChevronDown, ChevronUp, RotateCcw,
  Trash2, Calculator, X, Wrench, ClipboardCheck, Users, FileSpreadsheet
} from 'lucide-react';
import { SumUpCalculator } from '../components/SumUpCalculator';

export const ExpedientsPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';
  const navigate = useNavigate();

  const [expedients, setExpedients] = useState<any[]>([]);
  const [selectedExpedient, setSelectedExpedient] = useState<any>(null);
  const [isClosedExpedientExpanded, setIsClosedExpedientExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'integrity' | 'exceptions' | 'documents' | 'history' | 'workOrders'>('integrity');
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
  const [invCurrency, setInvCurrency] = useState('USD');
  const [invAmount, setInvAmount] = useState('');
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [invFile, setInvFile] = useState<File | null>(null);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

  const handleOpenInvoiceModal = () => {
    const isNational = selectedExpedient?.taxTreatment === 'VAT_APPLIED' || selectedExpedient?.contract?.currency === 'CLP';
    if (isNational) {
      setInvCurrency('CLP');
      setInvDocType('33');
    } else {
      setInvCurrency('USD');
      setInvDocType('110');
    }
    setShowInvoiceModal(true);
  };

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

  // Operaciones / OTs / Atenciones / Recepción
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [techniciansList, setTechniciansList] = useState<any[]>([]);

  // Modal Crear OT
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [otTitle, setOtTitle] = useState('');
  const [otDescription, setOtDescription] = useState('');

  // Modal Registrar Atención
  const [showAttentionModal, setShowAttentionModal] = useState<any | null>(null);
  const [attServiceTypeId, setAttServiceTypeId] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attStartTime, setAttStartTime] = useState('09:00');
  const [attEndTime, setAttEndTime] = useState('13:00');
  const [attHours, setAttHours] = useState('4.0');
  const [attProblem, setAttProblem] = useState('');
  const [attWorkDone, setAttWorkDone] = useState('');
  const [attResult, setAttResult] = useState('');
  const [attSelectedTechs, setAttSelectedTechs] = useState<string[]>([]);

  // Modal Registrar Recepción Conforme
  const [showReceptionModal, setShowReceptionModal] = useState<any | null>(null);
  const [recDate, setRecDate] = useState(new Date().toISOString().slice(0, 10));
  const [recAcceptedByName, setRecAcceptedByName] = useState('');
  const [recAcceptedByRole, setRecAcceptedByRole] = useState('');
  const [recAcceptedByEmail, setRecAcceptedByEmail] = useState('');
  const [recComments, setRecComments] = useState('');

  const [fetchError, setFetchError] = useState<string | null>(null);

  // ————————————————————————
  // Fetch expedients
  // ————————————————————————
  const fetchExpedients = () => {
    setLoading(true);
    setFetchError(null);
    api.get('/expedients')
      .then((res) => {
        const list = res.data.data || [];
        setExpedients(list);
        if (list.length > 0) {
          fetchExpedientDetail(list[0].id);
        } else {
          setSelectedExpedient(null);
        }
      })
      .catch((err) => {
        console.error('Error fetching expedients:', err);
        const errMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Error al comunicarse con el servidor';
        setFetchError(errMsg);
      })
      .finally(() => setLoading(false));
  };

  const fetchExpedientDetail = (id: string) => {
    api.get(`/expedients/${id}`)
      .then((res) => {
        if (res.data?.data) {
          setSelectedExpedient(res.data.data);
          setIsClosedExpedientExpanded(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching expedient detail:', err);
        setExpedients((prev) => {
          const item = prev.find((e) => e.id === id);
          if (item) {
            setSelectedExpedient(item);
            setIsClosedExpedientExpanded(false);
          }
          return prev;
        });
      });
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
    api.get('/customers').then((res) => setCustomers(res.data.data)).catch(() => {});
    api.get('/work-orders/service-types').then((res) => setServiceTypes(res.data.data || [])).catch(() => {});
    api.get('/users').then((res) => setTechniciansList(res.data.data || [])).catch(() => {});
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
    formData.append('currency', invCurrency);

    const gross = parseFloat(invAmount) || 0;
    if (invDocType === '33') {
      const net = Math.round(gross / 1.19);
      const vat = gross - net;
      formData.append('netAmount', String(net));
      formData.append('vatAmount', String(vat));
      formData.append('totalAmount', String(gross));
    } else {
      formData.append('netAmount', String(gross));
      formData.append('vatAmount', '0');
      formData.append('totalAmount', String(gross));
    }

    formData.append('taxTreatment', selectedExpedient.taxTreatment || (invCurrency === 'CLP' ? 'VAT_APPLIED' : 'EXPORT_SERVICE'));
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

  const getItemEffectiveInfo = (item: any, exp: any) => {
    const isContractItem = item.code === 'CONTRACT_PRESENT' || item.code === 'CONTRACT' || item.name?.toLowerCase().includes('contrato') || item.name?.toLowerCase().includes('sow');
    const isWoItem = item.code === 'WORK_ORDER_PRESENT' || item.code === 'WORK_ORDER' || item.name?.toLowerCase().includes('orden de trabajo');
    const isRcItem = item.code === 'RECEPTION_SIGNED' || item.code === 'RECEPTION_CONFORMITY' || item.name?.toLowerCase().includes('recepción') || item.name?.toLowerCase().includes('recepcion');

    if (isContractItem) {
      const contractDoc = (exp?.documentInstances || []).find(
        (d: any) =>
          (d.category === 'CONTRACT' ||
            d.template?.category === 'CONTRACT' ||
            d.template?.code?.toUpperCase().includes('SOW') ||
            d.documentNumber?.startsWith('SOW') ||
            d.documentNumber?.startsWith('CON')) &&
          d.category !== 'RECEPTION_CONFORMITY' &&
          d.category !== 'WORK_ORDER' &&
          !d.documentNumber?.startsWith('RC') &&
          !d.documentNumber?.startsWith('OT')
      );
      const contractAttachedDocId = (exp?.documentLinks || []).find(
        (l: any) =>
          l.document?.category === 'CONTRACT' &&
          l.document?.category !== 'RECEPTION' &&
          l.document?.category !== 'WORK_ORDER' &&
          l.document?.category !== 'BANK_RECEIPT'
      )?.document?.id;

      const isSigned = Boolean((contractDoc && contractDoc.status === 'SIGNED' && contractDoc.signedPdfPath) || contractAttachedDocId);
      const docCode = contractDoc?.documentNumber || exp?.contract?.code || 'SOW';

      return {
        status: isSigned ? 'COMPLETED' : 'PENDING',
        observation: isSigned
          ? `Contrato SOW firmado por cliente cargado y verificado (${docCode})`
          : (contractDoc ? `Contrato SOW emitido (${docCode}) — Pendiente de firma del cliente` : 'Pendiente de emisión y firma de Contrato SOW'),
      };
    }

    if (isWoItem) {
      const woDoc = (exp?.documentInstances || []).find(
        (d: any) =>
          (d.category === 'WORK_ORDER' || d.template?.category === 'WORK_ORDER' || d.documentNumber?.startsWith('OT')) &&
          d.category !== 'RECEPTION_CONFORMITY' &&
          !d.documentNumber?.startsWith('RC')
      );
      const isSigned = Boolean(woDoc && woDoc.status === 'SIGNED' && woDoc.signedPdfPath);
      const docCode = woDoc?.documentNumber || (exp?.workOrders?.[0]?.code) || 'OT';

      return {
        status: isSigned ? 'COMPLETED' : 'PENDING',
        observation: isSigned
          ? `Orden de Trabajo autorizada y firmada por cliente (${docCode})`
          : (woDoc || exp?.workOrders?.length > 0 ? `Orden de Trabajo autorizada emitida (${docCode}) — Pendiente de firma` : 'Pendiente de autorización y emisión de Orden de Trabajo'),
      };
    }

    if (isRcItem) {
      const rcDoc = (exp?.documentInstances || []).find(
        (d: any) =>
          (d.category === 'RECEPTION_CONFORMITY' ||
            d.template?.category === 'RECEPTION_CONFORMITY' ||
            d.documentNumber?.startsWith('RC') ||
            d.documentNumber?.startsWith('REC')) &&
          (d.status === 'SIGNED' || !!d.signedPdfPath)
      );
      const rcAttachedDocId = (exp?.documentLinks || []).find(
        (l: any) =>
          l.document?.category === 'RECEPTION' ||
          l.document?.category === 'RECEPTION_CONFORMITY' ||
          l.document?.originalName?.toUpperCase().includes('RC') ||
          l.document?.originalName?.toUpperCase().includes('RECEPCION')
      )?.document?.id;
      const hasWoRc = exp?.workOrders?.some((w: any) => Boolean(w.receptionConformity));

      const isSigned = Boolean(rcDoc || rcAttachedDocId || hasWoRc);
      const docCode = rcDoc?.documentNumber || exp?.workOrders?.find((w: any) => w.receptionConformity)?.receptionConformity?.code || 'RC';

      return {
        status: isSigned ? 'COMPLETED' : 'PENDING',
        observation: isSigned
          ? `Recepción Conforme firmada por cliente cargada y verificada (${docCode})`
          : 'Pendiente de emisión y firma de Recepción Conforme',
      };
    }

    return {
      status: item.status,
      observation: item.observation,
    };
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Cargando expedientes...</div>;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Gestión de Expedientes (EXP-YYYY-NNNNNN)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Unidad central de control operativo, facturación, integridad y snapshots de cierre SATEM.
          </p>
        </div>
        {!isViewer && (
          <div className="page-header-actions">
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={18} /> Nuevo Expediente
            </button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {fetchError && (
        <div style={{ padding: '14px 18px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', color: '#f87171', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong>Error al cargar expedientes:</strong> {fetchError}
          </div>
          <button onClick={fetchExpedients} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}>
            Reintentar
          </button>
        </div>
      )}

      <div className="expedients-layout">
        {/* Lista lateral */}
        <div className="expedients-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '4px' }}>
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
            {expedients.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                Sin expedientes registrados aún.
              </div>
            ) : (
              expedients.slice(0, sidebarLimit).map((exp) => (
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
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-word' }}>{exp.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-word' }}>{exp.customer?.legalName}</div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="badge badge-info">{exp.status}</span>
                    <span className="badge badge-success">{exp.taxTreatment}</span>
                  </div>
                </div>
              ))
            )}
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
          <div className="expedients-detail-card">
            {/* Header expediente */}
            <div className="expedient-header-top">
              <div className="expedient-title-block">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', margin: 0 }}>{selectedExpedient.code}</h2>
                  <span className="badge badge-info">{selectedExpedient.status}</span>
                  <span className="badge badge-success">{selectedExpedient.taxTreatment}</span>
                </div>
                <div style={{ fontSize: 'clamp(14px, 2vw, 16px)', fontWeight: 600, marginTop: '6px', wordBreak: 'break-word' }}>{selectedExpedient.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', wordBreak: 'break-word' }}>
                  Cliente: <strong>{selectedExpedient.customer?.legalName}</strong> ({selectedExpedient.customer?.country?.name}) | Tax ID: {selectedExpedient.customer?.taxId}
                </div>
              </div>

              {!isViewer && (
                <div className="expedient-header-actions">
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
                <div className="expedient-header-actions">
                  <button onClick={() => handleDownloadBundle(selectedExpedient.id, selectedExpedient.code)} className="btn btn-secondary">
                    <Download size={16} /> ZIP Bundle
                  </button>
                </div>
              )}
            </div>

            {/* Si el expediente está cerrado, mostrar banner de Cierre 100% y control de contraer/expandir */}
            {(() => {
              const isClosed = selectedExpedient.status === 'CLOSED' || selectedExpedient.status === 'CLOSED_WITH_EXCEPTION';
              if (!isClosed) return null;

              return (
                <div style={{
                  marginTop: '16px',
                  marginBottom: '16px',
                  padding: '16px 20px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle size={22} color="var(--success)" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--success)' }}>
                          Expediente Cerrado al 100% (Auditoría Inmutable Congelada)
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {selectedExpedient.closedAt ? `Fecha de cierre: ${new Date(selectedExpedient.closedAt).toLocaleString('es-CL')}` : 'Cierre completado'}
                          {selectedExpedient.closeReason ? ` • Motivo: "${selectedExpedient.closeReason}"` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsClosedExpedientExpanded((prev) => !prev)}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {isClosedExpedientExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      {isClosedExpedientExpanded ? 'Contraer Vista Detallada de Documentos' : 'Expandir Vista Detallada de Documentos'}
                    </button>
                  </div>

                  {!isClosedExpedientExpanded && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        📄 Total Documentos: <strong style={{ color: 'var(--text-primary)' }}>{(selectedExpedient.documentInstances?.length || 0) + (selectedExpedient.documentLinks?.length || 0)}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        🛠️ Órdenes de Trabajo: <strong style={{ color: 'var(--text-primary)' }}>{selectedExpedient.workOrders?.length || 0}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        📑 Facturas SII: <strong style={{ color: 'var(--text-primary)' }}>{selectedExpedient.invoices?.length || 0}</strong>
                      </div>
                      {selectedExpedient.snapshots?.[0]?.checksumSha256 && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                          🔐 Snapshot SHA-256: <code>{selectedExpedient.snapshots[0].checksumSha256}</code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Tabs y contenido de expediente: visible siempre si está abierto o si fue expandido manualmente si está cerrado */}
            {(!(selectedExpedient.status === 'CLOSED' || selectedExpedient.status === 'CLOSED_WITH_EXCEPTION') || isClosedExpedientExpanded) && (
              <>
            {/* Tabs */}
            <div className="tabs-nav">
              {(() => {
                const totalExternalDocs = new Set([
                  ...(selectedExpedient.documentLinks || []).map((l: any) => l.document?.id || l.documentId),
                  ...(selectedExpedient.integrityItems || []).map((i: any) => i.document?.id || i.documentId),
                  ...(selectedExpedient.invoices || []).map((i: any) => i.pdfDocumentId || i.pdfDocument?.id),
                  ...(selectedExpedient.invoices || []).flatMap((i: any) => (i.paymentRequests || []).flatMap((pr: any) => (pr.payments || []).map((p: any) => p.proofDocumentId || p.proofDocument?.id))),
                  ...(selectedExpedient.payments || []).map((p: any) => p.proofDocumentId || p.proofDocument?.id),
                ].filter(Boolean)).size;

                return [
                  { key: 'integrity',  label: `Integridad (${(selectedExpedient.integrityItems || []).filter((i: any) => getItemEffectiveInfo(i, selectedExpedient).status === 'COMPLETED').length}/${selectedExpedient.integrityItems?.length || 0})` },
                  { key: 'workOrders', label: `Operaciones & OTs (${selectedExpedient.workOrders?.length || 0})` },
                  { key: 'exceptions', label: `Excepciones (${selectedExpedient.exceptions?.length || 0})` },
                  { key: 'documents',  label: `Documentos (${(selectedExpedient.documentInstances?.length || 0) + totalExternalDocs})` },
                  { key: 'summary',    label: 'Resumen Operativo' },
                  { key: 'history',    label: 'Historial' },
                ];
              })().map(({ key, label }) => (
                <button
                  key={key}
                  className={`tab-btn ${activeTab === key ? 'active' : ''}`}
                  onClick={() => setActiveTab(key as any)}
                >
                  {key === 'history' && <History size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
                  {key === 'workOrders' && <Wrench size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
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
                    {
                      label: 'Contrato / SOW',
                      value: selectedExpedient.contract
                        ? `${selectedExpedient.contract.code} (${selectedExpedient.contract.currency === 'CLP' ? `$${Math.round(selectedExpedient.contract.totalAmount || 0).toLocaleString('es-CL')} CLP` : `$${Number(selectedExpedient.contract.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`})`
                        : 'Sin contrato específico'
                    },
                    {
                      label: 'Órdenes de Trabajo (OT)',
                      value: `${(selectedExpedient.workOrders?.length || 0) + (selectedExpedient.documentInstances?.filter((d: any) => d.category === 'WORK_ORDER' || d.template?.category === 'WORK_ORDER').length || 0)} registrada(s)`
                    },
                    {
                      label: 'Atenciones Técnicas SATEM',
                      value: `${selectedExpedient.documentInstances?.filter((d: any) => d.category === 'ATTENTION_REPORT' || d.template?.category === 'ATTENTION_REPORT').length || 0} ejecutada(s)`
                    },
                    {
                      label: 'Facturas SII Registradas',
                      value: (() => {
                        const invs = selectedExpedient.invoices || [];
                        const clpSum = invs.filter((i: any) => i.currency === 'CLP').reduce((s: number, i: any) => s + Number(i.totalAmount || 0), 0);
                        const usdSum = invs.filter((i: any) => i.currency === 'USD').reduce((s: number, i: any) => s + Number(i.totalAmount || 0), 0);
                        const parts = [];
                        if (clpSum > 0) parts.push(`$${clpSum.toLocaleString('es-CL')} CLP`);
                        if (usdSum > 0) parts.push(`$${usdSum.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`);
                        return `${invs.length} emitidas${parts.length > 0 ? ` (${parts.join(' + ')})` : ''}`;
                      })()
                    },
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

            {/* TAB: Órdenes de Trabajo, Atenciones y Recepción */}
            {activeTab === 'workOrders' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', margin: 0 }}>Órdenes de Trabajo (OT) & Atenciones Técnicas</h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Registro de horas trabajadas, técnicos asignados y estado de recepción conforme por el cliente.
                    </div>
                  </div>
                  {!isViewer && (
                    <button
                      type="button"
                      onClick={() => setShowWorkOrderModal(true)}
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      <Plus size={14} /> + Nueva Orden de Trabajo (OT)
                    </button>
                  )}
                </div>

                {(!selectedExpedient.workOrders || selectedExpedient.workOrders.length === 0) ? (
                  <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Sin Órdenes de Trabajo registradas para este expediente. Haz clic en "+ Nueva Orden de Trabajo (OT)" para autorizar el trabajo.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedExpedient.workOrders.map((wo: any) => {
                      const hasReception = Boolean(wo.receptionConformity);
                      const attentionsCount = wo.attentions?.length || 0;
                      const totalHoursWorked = (wo.attentions || []).reduce((acc: number, a: any) => acc + (parseFloat(a.hoursWorked) || 0), 0);

                      return (
                        <div
                          key={wo.id}
                          style={{
                            backgroundColor: '#0f172a',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ padding: '14px 18px', backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '15px' }}>{wo.code}</span>
                                <span className={`badge ${wo.status === 'CONFORMED' ? 'badge-success' : (wo.status === 'AUTHORIZED' || wo.status === 'IN_PROGRESS' ? 'badge-info' : 'badge-warning')}`}>
                                  {wo.status}
                                </span>
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{wo.title}</div>
                              {wo.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{wo.description}</div>}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {(wo.documentInstanceId || selectedExpedient.documentInstances?.some((d: any) => d.id === wo.id || d.documentNumber === wo.code)) && (
                                <button
                                  type="button"
                                  onClick={() => handleViewPdf(wo.documentInstanceId || wo.id, wo.documentNumber || wo.code)}
                                  className="btn btn-secondary"
                                  style={{ fontSize: '11.5px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <FileText size={13} /> Ver OT (PDF)
                                </button>
                              )}
                              {!isViewer && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowAttentionModal(wo);
                                      if (serviceTypes.length > 0) setAttServiceTypeId(serviceTypes[0].id);
                                    }}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '11.5px', padding: '4px 8px' }}
                                  >
                                    <Wrench size={13} /> + Registrar Atención
                                  </button>
                                  {!hasReception && (
                                    <button
                                      type="button"
                                      onClick={() => setShowReceptionModal(wo)}
                                      className="btn btn-secondary"
                                      style={{ fontSize: '11.5px', padding: '4px 8px', color: 'var(--success)', borderColor: 'var(--success)' }}
                                    >
                                      <ClipboardCheck size={13} /> + Recepción Conforme
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Cuerpo de la OT: Atenciones y Recepción */}
                          <div style={{ padding: '14px 18px' }}>
                            {/* Recepción Conforme Badge */}
                            {hasReception && (
                              <div style={{ padding: '12px 16px', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ fontSize: '12.5px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={15} color="var(--success)" />
                                    <strong style={{ color: 'var(--success)' }}>Recepción Conforme Firmada ({wo.receptionConformity.code})</strong>
                                  </div>
                                  <div style={{ color: 'var(--text-secondary)', marginTop: '3px' }}>
                                    Aceptado por <strong>{wo.receptionConformity.acceptedByName}</strong> {wo.receptionConformity.acceptedByRole ? `(${wo.receptionConformity.acceptedByRole})` : ''} el {new Date(wo.receptionConformity.receptionDate).toLocaleDateString('es-CL')}.
                                  </div>
                                  {wo.receptionConformity.comments && <div style={{ fontStyle: 'italic', marginTop: '2px', color: 'var(--text-muted)' }}>"{wo.receptionConformity.comments}"</div>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleViewPdf(wo.receptionConformity.documentInstanceId || wo.receptionConformity.id, wo.receptionConformity.code)}
                                    className="btn btn-primary"
                                    style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <FileText size={13} /> Ver Acta Firmada (PDF)
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Resumen de Horas */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                              <span>Atenciones Técnicas: <strong>{attentionsCount}</strong></span>
                              <span>Total Horas Ejecutadas: <strong style={{ color: 'var(--text-primary)' }}>{totalHoursWorked} hrs</strong></span>
                            </div>

                            {/* Listado de Atenciones */}
                            {attentionsCount === 0 ? (
                              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Sin atenciones técnicas ingresadas aún.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(wo.attentions || []).map((att: any) => (
                                  <div
                                    key={att.id}
                                    style={{
                                      padding: '10px 12px',
                                      backgroundColor: 'rgba(255,255,255,0.02)',
                                      border: '1px solid rgba(255,255,255,0.05)',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                      <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                        {att.code} • {att.serviceType?.name || 'Servicio TI'}
                                      </span>
                                      <span className="badge badge-info" style={{ fontSize: '10px' }}>
                                        {att.hoursWorked} hrs • {new Date(att.attentionDate).toLocaleDateString('es-CL')}
                                      </span>
                                    </div>
                                    <div style={{ color: 'var(--text-primary)' }}>
                                      <strong>Trabajo Realizado:</strong> {att.workDone}
                                    </div>
                                    {att.result && (
                                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '11px' }}>
                                        <strong>Resultado:</strong> {att.result}
                                      </div>
                                    )}
                                    {att.technicians && att.technicians.length > 0 && (
                                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Users size={11} /> Técnicos: {att.technicians.map((t: any) => t.technician?.fullName || t.technician?.email).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Integridad */}
            {activeTab === 'integrity' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ fontSize: '15px', margin: 0 }}>Checklist de Integridad Operativa y Auditoría</h3>
                  {!isViewer && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedExpedient.contract?.currency !== 'CLP' && selectedExpedient.taxTreatment !== 'VAT_APPLIED' && (
                        <button
                          onClick={() => setShowSumUpModal(true)}
                          className="btn btn-secondary"
                          style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                          title="Calcular cobro SumUp en CLP con Dólar Observado en vivo"
                        >
                          <Calculator size={14} /> Calculadora SumUp
                        </button>
                      )}
                      <button
                        onClick={handleOpenInvoiceModal}
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
                    const effective = getItemEffectiveInfo(item, selectedExpedient);
                    const isCompleted = effective.status === 'COMPLETED';
                    const effectiveObservation = effective.observation || item.observation;
                    const docId = item.documentId || item.document?.id;

                    return (
                      <div
                        key={item.id}
                        className="integrity-item-row"
                        style={{
                          borderColor: isCompleted ? 'var(--success)' : 'var(--warning)',
                        }}
                      >
                        <div className="expedient-item-info">
                          <div style={{ fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>{item.name}</span>
                            {item.isRequired && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(Obligatorio)</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Categoría: {item.category}</div>
                          {effectiveObservation && (
                            <div style={{ fontSize: '11.5px', color: isCompleted ? 'var(--success)' : 'var(--warning)', marginTop: '4px', fontWeight: 600, wordBreak: 'break-word' }}>
                              {isCompleted ? '✓ ' : '⚠ '}{effectiveObservation}
                            </div>
                          )}
                          {item.code === 'RECONCILIATION_COMPLETED' && (
                            <div style={{ marginTop: '10px', width: '100%', maxWidth: '460px' }}>
                              {(() => {
                                const match = item.observation?.match(/Progreso:\s*(\d+)%/) || item.observation?.match(/Pagado y Conciliado:\s*(\d+)%/);
                                const reconPct = match ? parseInt(match[1], 10) : (isCompleted ? 100 : 0);
                                return (
                                    <>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '5px', flexWrap: 'wrap', gap: '4px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Progreso de Cobro del Contrato ({selectedExpedient.contract?.currency || 'USD'})</span>
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
                          {isCompleted && item.completedAt && (
                            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Completado el: {new Date(item.completedAt).toLocaleString('es-CL')}
                            </div>
                          )}
                        </div>

                        <div className="expedient-item-actions">
                          {/* 1. Contrato SOW */}
                          {item.code === 'CONTRACT_PRESENT' && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {(() => {
                                const contractDoc = (selectedExpedient.documentInstances || []).find(
                                  (d: any) =>
                                    (d.category === 'CONTRACT' ||
                                      d.category === 'SOW' ||
                                      d.template?.category === 'CONTRACT' ||
                                      d.template?.code?.toUpperCase().includes('SOW') ||
                                      d.documentNumber?.startsWith('SOW') ||
                                      d.documentNumber?.startsWith('CON')) &&
                                    d.category !== 'RECEPTION_CONFORMITY' &&
                                    d.category !== 'WORK_ORDER' &&
                                    d.category !== 'QUOTATION' &&
                                    d.category !== 'ATTENTION_REPORT' &&
                                    d.category !== 'SERVICE_REPORT' &&
                                    !d.documentNumber?.startsWith('RC') &&
                                    !d.documentNumber?.startsWith('REC') &&
                                    !d.documentNumber?.startsWith('OT') &&
                                    !d.documentNumber?.startsWith('COT')
                                );
                                const contractAttachedDocId = (selectedExpedient.documentLinks || []).find(
                                  (l: any) =>
                                    (l.document?.category === 'CONTRACT' || l.document?.category === 'SOW') &&
                                    l.document?.category !== 'RECEPTION' &&
                                    l.document?.category !== 'WORK_ORDER' &&
                                    l.document?.category !== 'BANK_RECEIPT'
                                )?.document?.id;

                                return (
                                  <>
                                    {contractDoc ? (
                                      <>
                                        {contractDoc.status === 'SIGNED' && contractDoc.signedPdfPath && (
                                          <button
                                            onClick={() => handleViewSignedPdf(contractDoc.id, contractDoc.documentNumber || 'SOW')}
                                            className="btn btn-success"
                                            style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}
                                          >
                                            <CheckCircle size={13} /> Ver SOW Firmado
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleViewPdf(contractDoc.id, contractDoc.documentNumber || 'SOW')}
                                          className="btn btn-secondary"
                                          style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                          <FileText size={13} /> Ver SOW Emitido
                                        </button>
                                        {!isViewer && (
                                          <button
                                            onClick={() => setUploadingDocId(contractDoc.id)}
                                            className={`btn ${contractDoc.status === 'SIGNED' ? 'btn-secondary' : 'btn-primary'}`}
                                            style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                          >
                                            <Upload size={13} /> {contractDoc.status === 'SIGNED' ? 'Reemplazar Firmado' : '+ Subir SOW Firmado'}
                                          </button>
                                        )}
                                      </>
                                    ) : contractAttachedDocId ? (
                                      <button
                                        onClick={() => handleViewAttachedDoc(contractAttachedDocId, `CONTRATO_SOW_${selectedExpedient.code}.pdf`)}
                                        className="btn btn-secondary"
                                        style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                      >
                                        <FileText size={13} /> Ver Contrato SOW
                                      </button>
                                    ) : (
                                      !isViewer && (
                                        <button
                                          onClick={() => navigate(`/documents/generator?customerId=${selectedExpedient.customerId}&expedientId=${selectedExpedient.id}${selectedExpedient.contractId ? `&contractId=${selectedExpedient.contractId}` : ''}`)}
                                          className="btn btn-primary"
                                          style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                          <FilePlus size={13} /> + Generar SOW
                                        </button>
                                      )
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}

                          {/* 2. Orden de Trabajo (OT) */}
                          {item.code === 'WORK_ORDER_PRESENT' && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {(() => {
                                const woDoc = (selectedExpedient.documentInstances || []).find(
                                  (d: any) =>
                                    d.category === 'WORK_ORDER' ||
                                    d.template?.category === 'WORK_ORDER' ||
                                    d.documentNumber?.startsWith('OT') ||
                                    (selectedExpedient.workOrders && selectedExpedient.workOrders.some((w: any) => w.id === d.workOrderId))
                                );
                                return (
                                  <>
                                    {woDoc ? (
                                      <>
                                        {woDoc.status === 'SIGNED' && woDoc.signedPdfPath && (
                                          <button
                                            onClick={() => handleViewSignedPdf(woDoc.id, woDoc.documentNumber || 'OT')}
                                            className="btn btn-success"
                                            style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}
                                          >
                                            <CheckCircle size={13} /> Ver OT Firmada
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleViewPdf(woDoc.id, woDoc.documentNumber || 'OT')}
                                          className="btn btn-secondary"
                                          style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                          <FileText size={13} /> Ver OT Emitida
                                        </button>
                                        {!isViewer && (
                                          <button
                                            onClick={() => setUploadingDocId(woDoc.id)}
                                            className={`btn ${woDoc.status === 'SIGNED' ? 'btn-secondary' : 'btn-primary'}`}
                                            style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                          >
                                            <Upload size={13} /> {woDoc.status === 'SIGNED' ? 'Reemplazar Firmada' : '+ Subir OT Firmada'}
                                          </button>
                                        )}
                                      </>
                                    ) : (
                                      !isViewer && (
                                        <button
                                          onClick={() => navigate(`/documents/generator?customerId=${selectedExpedient.customerId}&expedientId=${selectedExpedient.id}`)}
                                          className="btn btn-primary"
                                          style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                          <FilePlus size={13} /> + Generar OT
                                        </button>
                                      )
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}

                          {/* 3. Recepción Conforme */}
                          {item.code === 'RECEPTION_SIGNED' && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {(() => {
                                const rcDoc = (selectedExpedient.documentInstances || []).find(
                                  (d: any) =>
                                    d.category === 'RECEPTION_CONFORMITY' ||
                                    d.template?.category === 'RECEPTION_CONFORMITY' ||
                                    d.documentNumber?.startsWith('RC') ||
                                    d.documentNumber?.startsWith('REC')
                                );
                                const rcAttachedDocId =
                                  docId ||
                                  (selectedExpedient.documentLinks || []).find(
                                    (l: any) =>
                                      l.document?.category === 'RECEPTION' ||
                                      l.document?.category === 'RECEPTION_CONFORMITY' ||
                                      l.document?.originalName?.toUpperCase().includes('RC') ||
                                      l.document?.originalName?.toUpperCase().includes('RECEPCION')
                                  )?.document?.id;

                                return (
                                  <>
                                    {rcDoc ? (
                                      <>
                                        {rcDoc.status === 'SIGNED' && rcDoc.signedPdfPath && (
                                          <button
                                            onClick={() => handleViewSignedPdf(rcDoc.id, rcDoc.documentNumber || 'RC')}
                                            className="btn btn-success"
                                            style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}
                                          >
                                            <CheckCircle size={13} /> Ver Recepción Firmada
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleViewPdf(rcDoc.id, rcDoc.documentNumber || 'RC')}
                                          className="btn btn-secondary"
                                          style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                          <FileText size={13} /> Ver Acta Emitida
                                        </button>
                                        {!isViewer && (
                                          <button
                                            onClick={() => setUploadingDocId(rcDoc.id)}
                                            className={`btn ${rcDoc.status === 'SIGNED' ? 'btn-secondary' : 'btn-primary'}`}
                                            style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                          >
                                            <Upload size={13} /> {rcDoc.status === 'SIGNED' ? 'Reemplazar Firmada' : '+ Subir Recepción Firmada'}
                                          </button>
                                        )}
                                      </>
                                    ) : rcAttachedDocId ? (
                                      <button
                                        onClick={() => handleViewAttachedDoc(rcAttachedDocId, `RECEPCION_CONFORME_${selectedExpedient.code}.pdf`)}
                                        className="btn btn-secondary"
                                        style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                      >
                                        <FileText size={13} /> Ver Recepción Conforme
                                      </button>
                                    ) : (
                                      !isViewer && (
                                        <button
                                          onClick={() => navigate(`/documents/generator?customerId=${selectedExpedient.customerId}&expedientId=${selectedExpedient.id}`)}
                                          className="btn btn-primary"
                                          style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                          <FilePlus size={13} /> + Generar Recepción
                                        </button>
                                      )
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}

                          {/* 4. Cotización */}
                          {item.code === 'QUOTATION_PRESENT' && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {(() => {
                                const quotDoc = (selectedExpedient.documentInstances || []).find(
                                  (d: any) => d.category === 'QUOTATION' || d.template?.category === 'QUOTATION'
                                );
                                return (
                                  <>
                                    {quotDoc ? (
                                      <>
                                        {quotDoc.status === 'SIGNED' && quotDoc.signedPdfPath && (
                                          <button
                                            onClick={() => handleViewSignedPdf(quotDoc.id, quotDoc.documentNumber || 'COT')}
                                            className="btn btn-success"
                                            style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}
                                          >
                                            <CheckCircle size={13} /> Ver Cotización Firmada
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleViewPdf(quotDoc.id, quotDoc.documentNumber || 'COT')}
                                          className="btn btn-secondary"
                                          style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                          <FileText size={13} /> Ver Cotización Emitida
                                        </button>
                                        {!isViewer && (
                                          <button
                                            onClick={() => setUploadingDocId(quotDoc.id)}
                                            className="btn btn-secondary"
                                            style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                          >
                                            <Upload size={13} /> {quotDoc.status === 'SIGNED' ? 'Reemplazar' : 'Subir Firmada'}
                                          </button>
                                        )}
                                      </>
                                    ) : (
                                      !isViewer && (
                                        <button
                                          onClick={() => navigate(`/documents/generator?customerId=${selectedExpedient.customerId}&expedientId=${selectedExpedient.id}`)}
                                          className="btn btn-primary"
                                          style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                          <FilePlus size={13} /> + Generar Cotización
                                        </button>
                                      )
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}

                          {/* 5. Factura SII */}
                          {item.code === 'INVOICE_REGISTERED' && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {(() => {
                                const invoiceDocId = docId || selectedExpedient.invoices?.find((i: any) => i.pdfDocumentId || i.pdfDocument?.id)?.pdfDocumentId || selectedExpedient.invoices?.[0]?.pdfDocument?.id;
                                return invoiceDocId ? (
                                  <button
                                    onClick={() => handleViewAttachedDoc(invoiceDocId, `FACTURA_SII_${selectedExpedient.code}.pdf`)}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <FileText size={13} /> Ver Factura
                                  </button>
                                ) : null;
                              })()}
                              {!isViewer && (
                                <button
                                  onClick={handleOpenInvoiceModal}
                                  className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                                  style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                  <Upload size={13} /> {isCompleted ? 'Reemplazar Factura' : '+ Cargar Factura SII'}
                                </button>
                              )}
                            </div>
                          )}

                          {/* 6. Comprobante de Pago */}
                          {item.code === 'PAYMENT_PROOF_PRESENT' && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {(() => {
                                const paymentDocId = docId || selectedExpedient.payments?.find((p: any) => p.proofDocumentId || p.proofDocument?.id)?.proofDocumentId || selectedExpedient.documentLinks?.find((l: any) => l.document?.category === 'PAYMENT_PROOF' || l.document?.category === 'SUMUP_PROOF')?.document?.id;
                                return paymentDocId ? (
                                  <button
                                    onClick={() => handleViewAttachedDoc(paymentDocId, `COMPROBANTE_PAGO_${selectedExpedient.code}.pdf`)}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <FileText size={13} /> Ver Comprobante
                                  </button>
                                ) : null;
                              })()}
                              {!isViewer && (
                                <button
                                  onClick={() => setShowPaymentModal(true)}
                                  className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                                  style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                  <Upload size={13} /> {isCompleted ? 'Reemplazar' : '+ Cargar Comprobante'}
                                </button>
                              )}
                            </div>
                          )}

                          {/* 7. Conciliación Bancaria */}
                          {item.code === 'RECONCILIATION_COMPLETED' && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {(() => {
                                const bankDocId = docId || item.documentId || item.document?.id || selectedExpedient.documentLinks?.find((l: any) => l.document?.category === 'BANK_RECEIPT')?.document?.id;
                                return bankDocId ? (
                                  <button
                                    onClick={() => handleViewAttachedDoc(bankDocId, `CARTOLA_SANTANDER_${selectedExpedient.code}.pdf`)}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <FileSpreadsheet size={13} color="var(--accent-primary)" /> Ver Cartola Bancaria
                                  </button>
                                ) : null;
                              })()}
                              <button
                                onClick={() => navigate('/bank')}
                                className="btn btn-secondary"
                                style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                              >
                                <ExternalLink size={13} /> Ir a Conciliación Bancaria
                              </button>
                            </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ fontSize: '15px', margin: 0 }}>
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
                        className="expedient-item-row"
                        style={{
                          borderLeftWidth: '4px',
                          borderLeftStyle: 'solid',
                          borderColor: exc.severity === 'CRITICAL' ? 'var(--danger)' : exc.severity === 'WARNING' ? 'var(--warning)' : 'var(--info)',
                        }}
                      >
                        <div className="expedient-item-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
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
                        <div className="expedient-item-actions">
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
                        onClick={handleOpenInvoiceModal}
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
                        className="doc-item-row"
                        style={{
                          borderColor: doc.status === 'SIGNED' ? 'rgba(16,185,129,0.4)' : 'var(--border-color)',
                          boxShadow: doc.status === 'SIGNED' ? '0 0 15px rgba(16,185,129,0.08)' : 'none',
                        }}
                      >
                        <div className="expedient-item-info">
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
                            <div style={{ fontSize: '11.5px', color: 'var(--success)', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
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
                        <div className="expedient-item-actions">
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
                {(() => {
                  const externalDocsMap = new Map<string, any>();

                  // a) Documentos desde documentLinks
                  (selectedExpedient.documentLinks || []).forEach((link: any) => {
                    const doc = link.document || link;
                    if (doc?.id) {
                      externalDocsMap.set(doc.id, {
                        ...doc,
                        linkId: link.id,
                      });
                    }
                  });

                  // b) Documentos desde integridad (ej: comprobante de pago o factura asociada al checklist)
                  (selectedExpedient.integrityItems || []).forEach((item: any) => {
                    if (item.document?.id && !externalDocsMap.has(item.document.id)) {
                      externalDocsMap.set(item.document.id, {
                        ...item.document,
                        category: item.document.category || (item.code === 'PAYMENT_PROOF_PRESENT' ? 'PAYMENT_PROOF' : 'EVIDENCE'),
                      });
                    }
                  });

                  // c) Documentos desde Facturas SII
                  (selectedExpedient.invoices || []).forEach((inv: any) => {
                    if (inv.pdfDocument?.id && !externalDocsMap.has(inv.pdfDocument.id)) {
                      externalDocsMap.set(inv.pdfDocument.id, {
                        ...inv.pdfDocument,
                        category: inv.pdfDocument.category || 'INVOICE',
                        originalName: inv.pdfDocument.originalName || `Factura_SII_Folio_${inv.siiFolio}.pdf`,
                      });
                    }
                    if (inv.xmlDocument?.id && !externalDocsMap.has(inv.xmlDocument.id)) {
                      externalDocsMap.set(inv.xmlDocument.id, {
                        ...inv.xmlDocument,
                        category: inv.xmlDocument.category || 'INVOICE',
                      });
                    }
                    // Pagos vinculados a la factura
                    (inv.paymentRequests || []).forEach((pr: any) => {
                      (pr.payments || []).forEach((p: any) => {
                        if (p.proofDocument?.id && !externalDocsMap.has(p.proofDocument.id)) {
                          externalDocsMap.set(p.proofDocument.id, {
                            ...p.proofDocument,
                            category: p.proofDocument.category || 'PAYMENT_PROOF',
                          });
                        }
                      });
                    });
                  });

                  // d) Documentos directos de pagos si existieran
                  (selectedExpedient.payments || []).forEach((p: any) => {
                    if (p.proofDocument?.id && !externalDocsMap.has(p.proofDocument.id)) {
                      externalDocsMap.set(p.proofDocument.id, {
                        ...p.proofDocument,
                        category: p.proofDocument.category || 'PAYMENT_PROOF',
                      });
                    }
                  });

                  const externalDocs = Array.from(externalDocsMap.values());

                  return (
                    <div>
                      <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.4px' }}>
                        Documentos Externos & Adjuntos ({externalDocs.length})
                      </h4>

                      {externalDocs.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)' }}>
                          <Receipt size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                          No hay facturas SII ni comprobantes externos cargados.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {externalDocs.map((doc: any) => {
                            const isPayment = doc.category === 'PAYMENT_PROOF' || doc.category === 'SUMUP_PROOF' || doc.category === 'BANK_RECEIPT';
                            const isInvoice = doc.category === 'INVOICE';

                            return (
                              <div
                                key={doc.id}
                                className="doc-item-row"
                              >
                                <div className="expedient-item-info">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>{doc.originalName}</span>
                                    <span className={`badge ${isPayment ? 'badge-success' : isInvoice ? 'badge-info' : 'badge-secondary'}`}>
                                      {doc.category}
                                    </span>
                                    {(() => {
                                      if (isInvoice) {
                                        const inv = (selectedExpedient.invoices || []).find((i: any) => i.pdfDocumentId === doc.id || i.xmlDocumentId === doc.id);
                                        if (inv) {
                                          return (
                                            <span className="badge badge-info" style={{ fontWeight: 600 }}>
                                              {inv.currency === 'CLP' ? `$${Math.round(inv.totalAmount).toLocaleString('es-CL')} CLP` : `$${Number(inv.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`} • DTE {inv.siiDocType || '110'} (Folio {inv.siiFolio})
                                            </span>
                                          );
                                        }
                                      }
                                      if (isPayment) {
                                        const pay = (selectedExpedient.payments || []).find((p: any) => p.proofDocumentId === doc.id);
                                        if (pay) {
                                          return (
                                            <span className="badge badge-success" style={{ fontWeight: 600 }}>
                                              {pay.currency === 'CLP' ? `$${Math.round(pay.amount).toLocaleString('es-CL')} CLP` : `$${Number(pay.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`} • {pay.paymentMethod || 'Pago'}
                                            </span>
                                          );
                                        }
                                      }
                                      return null;
                                    })()}
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    SHA-256: <code>{doc.sha256?.substring(0, 20)}...</code> | Tamaño: {((Number(doc.fileSize) || 0) / 1024).toFixed(1)} KB | Subido: {doc.createdAt ? new Date(doc.createdAt).toLocaleString('es-CL') : 'N/A'}
                                  </div>
                                </div>
                                <div className="expedient-item-actions">
                                  <button
                                    onClick={() => handleViewAttachedDoc(doc.id, doc.originalName)}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                  >
                                    <FileText size={14} /> Ver Documento
                                  </button>
                                  {!isViewer && isPayment && (
                                    <button
                                      onClick={() => setShowPaymentModal(true)}
                                      className="btn btn-secondary"
                                      style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                      title="Reemplazar comprobante o informe de pago"
                                    >
                                      <Upload size={14} /> Reemplazar
                                    </button>
                                  )}
                                  {!isViewer && isInvoice && (
                                    <button
                                      onClick={handleOpenInvoiceModal}
                                      className="btn btn-secondary"
                                      style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                      title="Reemplazar Factura SII"
                                    >
                                      <Upload size={14} /> Reemplazar
                                    </button>
                                  )}
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
                    </div>
                  );
                })()}

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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
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
            </>
            )}
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <FolderKanban size={48} color="var(--accent-primary)" style={{ opacity: 0.5, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {expedients.length === 0 ? 'No hay expedientes registrados aún' : 'Ningún expediente seleccionado'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '460px', marginBottom: '20px' }}>
              {expedients.length === 0
                ? 'Crea tu primer expediente para gestionar contratos, órdenes de trabajo, facturación SII y trazabilidad tributaria SATEM.'
                : 'Selecciona un expediente de la lista lateral para visualizar su detalle 360°, trazabilidad documental y estado de integridad.'}
            </p>
            {!isViewer && (
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} /> Crear Nuevo Expediente
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Cargar Factura SII */}
      {showInvoiceModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '520px' }}>
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

              <div className="grid-form-3">
                <div className="form-group">
                  <label className="form-label">Tipo Documento SII</label>
                  <select
                    className="form-select"
                    value={invDocType}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setInvDocType(nextType);
                      if (nextType === '33' || nextType === '34') {
                        setInvCurrency('CLP');
                      } else if (nextType === '110') {
                        setInvCurrency('USD');
                      }
                    }}
                  >
                    <option value="110">Tipo 110 (Exportación Sin IVA)</option>
                    <option value="33">Tipo 33 (Factura Afecta IVA 19%)</option>
                    <option value="34">Tipo 34 (Factura Exenta / No Afecta)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Moneda</label>
                  <select
                    className="form-select"
                    value={invCurrency}
                    onChange={(e) => setInvCurrency(e.target.value)}
                  >
                    <option value="CLP">CLP (Pesos Chilenos)</option>
                    <option value="USD">USD (Dólares)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Monto Total ({invCurrency}) *</label>
                  <input
                    type="number"
                    step={invCurrency === 'CLP' ? '1' : '0.01'}
                    className="form-input"
                    placeholder={invCurrency === 'CLP' ? 'Ej: 1190000' : 'Ej: 2500.00'}
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              {invDocType === '33' && parseFloat(invAmount) > 0 && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(0, 168, 150, 0.08)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '16px',
                  fontSize: '12px',
                }}>
                  <div style={{ color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '2px' }}>
                    Desglose Tributario DTE 33 (IVA 19%):
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Neto: <strong>${Math.round((parseFloat(invAmount) || 0) / 1.19).toLocaleString('es-CL')} {invCurrency}</strong> + 
                    IVA (19%): <strong>${Math.round((parseFloat(invAmount) || 0) - Math.round((parseFloat(invAmount) || 0) / 1.19)).toLocaleString('es-CL')} {invCurrency}</strong> = 
                    Total: <strong>${Math.round(parseFloat(invAmount) || 0).toLocaleString('es-CL')} {invCurrency}</strong>
                  </div>
                </div>
              )}

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
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '580px' }}>
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
                  <div className="grid-form-2" style={{ gap: '6px', color: 'var(--text-secondary)' }}>
                    <div><strong>Bruto Tarjeta:</strong> ${sumUpInfo.grossAmount?.toLocaleString('es-CL')} CLP</div>
                    <div><strong>Comisión SumUp:</strong> -${sumUpInfo.feeAmount?.toLocaleString('es-CL')} CLP</div>
                    <div style={{ color: 'var(--success)', fontWeight: 600 }}><strong>Depósito Neto:</strong> ${sumUpInfo.netAmount?.toLocaleString('es-CL')} CLP</div>
                    <div><strong>Referencia:</strong> {sumUpInfo.referenceNumber || 'N/A'}</div>
                    <div><strong>Periodo Depósito:</strong> {sumUpInfo.periodDate || 'N/A'}</div>
                    <div><strong>RUT Comercio:</strong> {sumUpInfo.companyRut || 'N/A'}</div>
                  </div>
                </div>
              )}

              <div className="grid-form-2">
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

              <div className="grid-form-2">
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

              <div className="grid-form-2">
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

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '520px' }}>
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

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Expediente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Excepción Manual — MEJ-02 */}
      {showExceptionModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '500px' }}>
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
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setShowExceptionModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Excepción</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Calculadora SumUp */}
      {showSumUpModal && selectedExpedient && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '820px', padding: 0 }}>
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
      {/* Modal Crear Orden de Trabajo */}
      {showWorkOrderModal && selectedExpedient && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>Nueva Orden de Trabajo (OT)</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Autoriza una nueva Orden de Trabajo para el expediente {selectedExpedient.code}.
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.post('/work-orders', {
                  expedientId: selectedExpedient.id,
                  title: otTitle,
                  description: otDescription || undefined,
                });
                setShowWorkOrderModal(false);
                setOtTitle('');
                setOtDescription('');
                fetchExpedientDetail(selectedExpedient.id);
                fetchExpedients();
              } catch (err: any) {
                alert(err.response?.data?.error?.message || 'Error al crear OT');
              }
            }}>
              <div className="form-group">
                <label className="form-label">Título de la Orden de Trabajo *</label>
                <input type="text" className="form-input" value={otTitle} onChange={(e) => setOtTitle(e.target.value)} placeholder="Ej: Implementación Módulo de Facturación" required />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción / Alcance</label>
                <textarea className="form-textarea" value={otDescription} onChange={(e) => setOtDescription(e.target.value)} placeholder="Detalle de tareas a realizar" rows={3} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowWorkOrderModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Autorizar OT</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Atención Técnica */}
      {showAttentionModal && selectedExpedient && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '540px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>
              Registrar Atención Técnica — {showAttentionModal.code}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (attSelectedTechs.length === 0) {
                alert('Debe asignar al menos 1 técnico');
                return;
              }
              try {
                const startDateTime = new Date(`${attDate}T${attStartTime}:00`);
                const endDateTime = new Date(`${attDate}T${attEndTime}:00`);
                await api.post('/work-orders/attentions', {
                  expedientId: selectedExpedient.id,
                  workOrderId: showAttentionModal.id,
                  contractId: selectedExpedient.contractId || undefined,
                  serviceTypeId: attServiceTypeId,
                  attentionDate: new Date(attDate).toISOString(),
                  startTime: startDateTime.toISOString(),
                  endTime: endDateTime.toISOString(),
                  hoursWorked: parseFloat(attHours) || 1,
                  problem: attProblem,
                  workDone: attWorkDone,
                  result: attResult,
                  technicianIds: attSelectedTechs,
                });
                setShowAttentionModal(null);
                setAttProblem('');
                setAttWorkDone('');
                setAttResult('');
                fetchExpedientDetail(selectedExpedient.id);
                fetchExpedients();
              } catch (err: any) {
                alert(err.response?.data?.error?.message || 'Error al registrar atención');
              }
            }}>
              <div className="grid-form-2">
                <div className="form-group">
                  <label className="form-label">Tipo de Servicio *</label>
                  <select className="form-select" value={attServiceTypeId} onChange={(e) => setAttServiceTypeId(e.target.value)} required>
                    {serviceTypes.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Atención *</label>
                  <input type="date" className="form-input" value={attDate} onChange={(e) => setAttDate(e.target.value)} required />
                </div>
              </div>

              <div className="grid-form-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Hora Inicio</label>
                  <input type="time" className="form-input" value={attStartTime} onChange={(e) => setAttStartTime(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora Término</label>
                  <input type="time" className="form-input" value={attEndTime} onChange={(e) => setAttEndTime(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Horas Trabajadas</label>
                  <input type="number" step="0.5" className="form-input" value={attHours} onChange={(e) => setAttHours(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Técnicos Asignados *</label>
                <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  {techniciansList.map((tech) => (
                    <label key={tech.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', margin: '4px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={attSelectedTechs.includes(tech.id)}
                        onChange={(e) => {
                          if (e.target.checked) setAttSelectedTechs([...attSelectedTechs, tech.id]);
                          else setAttSelectedTechs(attSelectedTechs.filter(id => id !== tech.id));
                        }}
                      />
                      {tech.fullName || tech.email} ({tech.role})
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Requerimiento / Problema *</label>
                <textarea className="form-textarea" value={attProblem} onChange={(e) => setAttProblem(e.target.value)} placeholder="Descripción del requerimiento inicial" rows={2} required />
              </div>

              <div className="form-group">
                <label className="form-label">Trabajo Realizado *</label>
                <textarea className="form-textarea" value={attWorkDone} onChange={(e) => setAttWorkDone(e.target.value)} placeholder="Acciones técnicas ejecutadas" rows={2} required />
              </div>

              <div className="form-group">
                <label className="form-label">Resultado / Estado Final *</label>
                <textarea className="form-textarea" value={attResult} onChange={(e) => setAttResult(e.target.value)} placeholder="Resultado validado y conforme" rows={2} required />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowAttentionModal(null)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Atención</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Recepción Conforme */}
      {showReceptionModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>
              Registrar Recepción Conforme — {showReceptionModal.code}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Registra la conformidad formal del cliente sobre los servicios ejecutados.
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.post('/work-orders/receptions', {
                  workOrderId: showReceptionModal.id,
                  receptionDate: new Date(recDate).toISOString(),
                  acceptedByName: recAcceptedByName,
                  acceptedByRole: recAcceptedByRole || undefined,
                  acceptedByEmail: recAcceptedByEmail || undefined,
                  comments: recComments || undefined,
                });
                setShowReceptionModal(null);
                setRecAcceptedByName('');
                setRecAcceptedByRole('');
                setRecAcceptedByEmail('');
                setRecComments('');
                fetchExpedientDetail(selectedExpedient.id);
                fetchExpedients();
              } catch (err: any) {
                alert(err.response?.data?.error?.message || 'Error al registrar recepción conforme');
              }
            }}>
              <div className="form-group">
                <label className="form-label">Fecha de Recepción *</label>
                <input type="date" className="form-input" value={recDate} onChange={(e) => setRecDate(e.target.value)} required />
              </div>
              <div className="grid-form-2">
                <div className="form-group">
                  <label className="form-label">Nombre de Quien Acepta *</label>
                  <input type="text" className="form-input" value={recAcceptedByName} onChange={(e) => setRecAcceptedByName(e.target.value)} placeholder="Ej: Robert Smith" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo / Rol</label>
                  <input type="text" className="form-input" value={recAcceptedByRole} onChange={(e) => setRecAcceptedByRole(e.target.value)} placeholder="Ej: Project Manager" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email de Quien Acepta</label>
                <input type="email" className="form-input" value={recAcceptedByEmail} onChange={(e) => setRecAcceptedByEmail(e.target.value)} placeholder="robert@client.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Comentarios / Observaciones de Conformidad</label>
                <textarea className="form-textarea" value={recComments} onChange={(e) => setRecComments(e.target.value)} placeholder="Servicio entregado a entera conformidad" rows={2} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowReceptionModal(null)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Firmar Recepción Conforme</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal subir PDF firmado */}
      {uploadingDocId && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Cargar Documento Firmado por Cliente</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Selecciona el archivo PDF firmado por el cliente. Este archivo quedará incorporado permanentemente en el expediente y en el paquete ZIP de auditoría.
            </p>
            <form onSubmit={handleUploadSignedPdf}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Archivo PDF Firmado</label>
                <input type="file" accept="application/pdf" className="form-input" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} required />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setUploadingDocId(null)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={!selectedFile}>Confirmar y Guardar en Expediente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
