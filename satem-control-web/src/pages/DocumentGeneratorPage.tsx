import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Download, Eye, Sparkles, Building, FolderKanban,
  CheckCircle2, RefreshCw, Send, ArrowLeft, ArrowRight, Layers, FilePlus,
  ChevronDown, ChevronUp, Check, ShieldCheck, Clock, DollarSign, FileCheck2
} from 'lucide-react';

export const DocumentGeneratorPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Query params iniciales (por si viene desde un expediente o cliente)
  const queryCustomerId = searchParams.get('customerId') || '';
  const queryContractId = searchParams.get('contractId') || '';
  const queryExpedientId = searchParams.get('expedientId') || '';
  const queryTemplateId = searchParams.get('templateId') || '';

  // Estados de datos
  const [templates, setTemplates] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [expedients, setExpedients] = useState<any[]>([]);
  const [companyConfig, setCompanyConfig] = useState<any>(null);

  // Estados de selección de entidad
  const [selectedTemplateId, setSelectedTemplateId] = useState(queryTemplateId);
  const [selectedCustomerId, setSelectedCustomerId] = useState(queryCustomerId);
  const [selectedContractId, setSelectedContractId] = useState(queryContractId);
  const [selectedExpedientId, setSelectedExpedientId] = useState(queryExpedientId);

  // Variables auto-pobladas del documento
  const [docNumberDisplay, setDocNumberDisplay] = useState('RC-2026-000003');
  const [docTitle, setDocTitle] = useState('Acta de Recepción Conforme de Servicios / Certificate of Service Acceptance & Conformity');
  const [docDescription, setDocDescription] = useState('Prestación de servicios profesionales de consultoría técnica, desarrollo cloud y aseguramiento operativo para exportación.');
  const [docAmount, setDocAmount] = useState('5000.00');
  const [docCurrency, setDocCurrency] = useState('USD');
  const [docHours, setDocHours] = useState('80');
  const [docPaymentTerms, setDocPaymentTerms] = useState('Transferencia Bancaria Internacional / SumUp');
  
  // Estado para acordeón de ajustes avanzados
  const [showAdvancedEdit, setShowAdvancedEdit] = useState(false);

  // Estado UI
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ id: string; documentNumber: string; expedient?: any } | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');

  // Títulos automáticos por categoría de plantilla
  const getBilingualTitle = (category: string, tplName: string) => {
    switch (category) {
      case 'RECEPTION_CONFORMITY':
        return 'Acta de Recepción Conforme de Servicios / Certificate of Service Acceptance & Conformity';
      case 'WORK_ORDER':
        return 'Orden de Trabajo Autorizada / Authorized Work Order';
      case 'ATTENTION_REPORT':
        return 'Informe Técnico de Atención / Technical Attention & Incident Report';
      case 'SERVICE_REPORT':
        return 'Informe Ejecutivo de Servicios Prestados / Executive Service & Performance Report';
      case 'COMMERCIAL_PROPOSAL':
        return 'Propuesta Comercial de Servicios TI / Commercial Proposal & Service Statement';
      case 'QUOTATION':
        return 'Cotización Oficial de Servicios TI / Official Service Quotation';
      case 'CONTRACT':
        return 'Contrato de Servicios Internacionales / International Services Agreement';
      default:
        return tplName || 'Documento Oficial SATEM';
    }
  };

  const getCategoryPrefix = (category: string) => {
    switch (category) {
      case 'RECEPTION_CONFORMITY': return 'RC';
      case 'WORK_ORDER': return 'OT';
      case 'ATTENTION_REPORT': return 'AT';
      case 'SERVICE_REPORT': return 'SRV';
      case 'COMMERCIAL_PROPOSAL': return 'PROP';
      case 'QUOTATION': return 'COT';
      case 'CONTRACT': return 'SOW';
      default: return 'DOC';
    }
  };

  // Carga inicial
  useEffect(() => {
    Promise.all([
      api.get('/document-templates'),
      api.get('/customers'),
      api.get('/contracts'),
      api.get('/expedients'),
      api.get('/company/config').catch(() => ({ data: { data: {} } })),
    ])
      .then(([tplRes, custRes, contRes, expRes, compRes]) => {
        const tpls = tplRes.data.data || [];
        setTemplates(tpls);
        
        // Priorizar queryTemplateId o la primera plantilla (o RECEPTION_CONFORMITY si existe)
        let initialTpl = tpls.find((t: any) => t.id === queryTemplateId);
        if (!initialTpl) {
          initialTpl = tpls.find((t: any) => t.category === 'RECEPTION_CONFORMITY') || tpls[0];
        }
        if (initialTpl) {
          setSelectedTemplateId(initialTpl.id);
          setDocTitle(getBilingualTitle(initialTpl.category, initialTpl.name));
          setDocNumberDisplay(`${getCategoryPrefix(initialTpl.category)}-2026-AUTOMÁTICO`);
        }

        const custList = custRes.data.data || [];
        setCustomers(custList);
        const contList = contRes.data.data || [];
        setContracts(contList);
        const expList = expRes.data.data || [];
        setExpedients(expList);
        setCompanyConfig(compRes.data.data || {});

        // Si se pasa queryCustomerId, sincronizar contrato y expediente
        if (queryCustomerId) {
          setSelectedCustomerId(queryCustomerId);
          const custConts = contList.filter((c: any) => c.customerId === queryCustomerId);
          if (custConts.length > 0 && !queryContractId) {
            setSelectedContractId(custConts[0].id);
          }
        }
      })
      .catch((err) => console.error('Error cargando generador:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filtrar contratos y expedientes por cliente seleccionado
  const availableContracts = selectedCustomerId
    ? contracts.filter((c) => c.customerId === selectedCustomerId)
    : contracts;

  const availableExpedients = selectedCustomerId
    ? expedients.filter((e) => e.customerId === selectedCustomerId)
    : expedients;

  // Manejar cambio de plantilla
  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      setDocTitle(getBilingualTitle(tpl.category, tpl.name));
      setDocNumberDisplay(`${getCategoryPrefix(tpl.category)}-2026-AUTOMÁTICO`);
    }
  };

  // Manejar cambio de cliente
  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const custContracts = contracts.filter((c) => c.customerId === custId);
    if (custContracts.length > 0) {
      const firstContract = custContracts[0];
      setSelectedContractId(firstContract.id);
      applyContractData(firstContract);
    } else {
      setSelectedContractId('');
      const custExpedients = expedients.filter((e) => e.customerId === custId);
      if (custExpedients.length > 0) {
        setSelectedExpedientId(custExpedients[0].id);
      } else {
        setSelectedExpedientId('');
      }
    }
  };

  // Manejar cambio de contrato
  const handleContractChange = (contId: string) => {
    setSelectedContractId(contId);
    const contract = contracts.find((c) => c.id === contId);
    if (contract) {
      applyContractData(contract);
    }
  };

  // Función auxiliar para volcar datos del contrato automáticamente
  const applyContractData = (contract: any) => {
    if (!contract) return;
    if (contract.description) setDocDescription(contract.description);
    if (contract.totalAmount != null) {
      setDocAmount(Number(contract.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
    if (contract.currency) setDocCurrency(contract.currency);
    if (contract.contractedHours != null) setDocHours(String(contract.contractedHours));
    if (contract.paymentTerms) setDocPaymentTerms(contract.paymentTerms);

    // Auto-vincular el expediente asociado al contrato
    if (contract.expedients && contract.expedients.length > 0) {
      setSelectedExpedientId(contract.expedients[0].id);
    } else {
      const matchingExp = expedients.find((e) => e.contractId === contract.id);
      if (matchingExp) setSelectedExpedientId(matchingExp.id);
    }
  };

  // Actualizar previsualización interactiva HTML en tiempo real
  useEffect(() => {
    const currentTpl = templates.find((t) => t.id === selectedTemplateId);
    if (!currentTpl) return;

    const rawTemplate = currentTpl.versions?.[0]?.htmlTemplate || currentTpl.html || '<p>Plantilla sin contenido</p>';
    const customer = customers.find((c) => c.id === selectedCustomerId) || {};
    const contract = contracts.find((c) => c.id === selectedContractId) || {};
    const expedient = expedients.find((e) => e.id === selectedExpedientId) || {};

    const typeLabels: Record<string, string> = {
      HOURLY: 'Bolsa de Horas (Hourly)',
      PER_ATTENTION: 'Por Atención / Incidencia',
      ATTENTION_PACKAGE: 'Paquete de Atenciones',
      FIXED_PERIOD: 'Período Fijo / Retainer',
      RETAINER: 'Retainer Mensual',
      OTHER: 'Servicios Profesionales TI',
    };

    const modalityLabels: Record<string, string> = {
      RECURRING: 'Recurrente / Periódico',
      ONE_TIME: 'Servicio Único',
      OPEN_ENDED: 'Plazo Indefinido / Según Consumo',
    };

    const formatDateStr = (d?: Date | string | null) => {
      if (!d) return '';
      try {
        const dateObj = typeof d === 'string' ? new Date(d) : d;
        if (isNaN(dateObj.getTime())) return String(d);
        return dateObj.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
      } catch {
        return String(d);
      }
    };

    const todayFormatted = formatDateStr(new Date());
    const startFormatted = contract.startDate ? formatDateStr(contract.startDate) : todayFormatted;
    const endFormatted = contract.endDate ? formatDateStr(contract.endDate) : 'Indefinida / Según horas consumidas';

    const defaultExportClause = 'Servicio prestado desde Chile y aprovechado íntegramente en el extranjero por el Cliente, exento de IVA conforme al Art. 12 letra E Nº 7 del D.L. 825 de la Ley sobre Impuesto a las Ventas y Servicios.';

    let rendered = rawTemplate
      .replace(/\{\{empresa\.nombre\}\}/g, companyConfig?.legalName || 'SATEM Soluciones Inteligentes SpA')
      .replace(/\{\{empresa\.rut\}\}/g, companyConfig?.taxId || '77.654.321-K')
      .replace(/\{\{empresa\.email\}\}/g, companyConfig?.email || 'contacto@satem.cl')
      .replace(/\{\{empresa\.telefono\}\}/g, companyConfig?.phone || '+56 2 2999 8888')
      .replace(/\{\{empresa\.website\}\}/g, companyConfig?.website || 'https://www.satem.cl')
      .replace(/\{\{empresa\.direccion\}\}/g, companyConfig?.address || 'Av. Providencia 1234, Of. 601')
      .replace(/\{\{empresa\.ciudad\}\}/g, companyConfig?.city || 'Santiago')
      .replace(/\{\{empresa\.pais\}\}/g, companyConfig?.country || 'Chile')
      .replace(/\{\{empresa\.representanteLegal\}\}/g, companyConfig?.legalRepresentative || 'Jesús Acosta')
      .replace(/\{\{empresa\.cargoRepresentante\}\}/g, companyConfig?.legalRepresentativeTitle || 'Gerente General')
      .replace(/\{\{cliente\.nombreLegal\}\}/g, customer.legalName || '[Nombre del Cliente]')
      .replace(/\{\{cliente\.taxId\}\}/g, customer.taxId || '[Tax ID / RUT]')
      .replace(/\{\{cliente\.pais\}\}/g, customer.country?.name || customer.countryCode || '[País Cliente]')
      .replace(/\{\{cliente\.ciudad\}\}/g, customer.city || '[Ciudad Cliente]')
      .replace(/\{\{cliente\.direccion\}\}/g, customer.address || '[Dirección Cliente]')
      .replace(/\{\{cliente\.email\}\}/g, customer.email || '[Email Cliente]')
      .replace(/\{\{contrato\.codigo\}\}/g, contract.code || 'SOW-2026-XXXX')
      .replace(/\{\{contrato\.titulo\}\}/g, contract.title || docTitle)
      .replace(/\{\{contrato\.descripcion\}\}/g, docDescription)
      .replace(/\{\{contrato\.tipoNombre\}\}/g, typeLabels[contract.type] || 'Bolsa de Horas (Hourly)')
      .replace(/\{\{contrato\.modalidadNombre\}\}/g, modalityLabels[contract.modality] || 'Recurrente / Periódico')
      .replace(/\{\{contrato\.valor\}\}/g, docAmount)
      .replace(/\{\{contrato\.moneda\}\}/g, docCurrency)
      .replace(/\{\{contrato\.horas\}\}/g, docHours)
      .replace(/\{\{contrato\.tarifaHora\}\}/g, contract.rate ? `$${Number(contract.rate).toFixed(2)} ${docCurrency}/hr` : `$${(parseFloat(docAmount.replace(/,/g, '')) / (parseFloat(docHours) || 1)).toFixed(2)} ${docCurrency}/hr`)
      .replace(/\{\{contrato\.metodoPago\}\}/g, docPaymentTerms)
      .replace(/\{\{contrato\.fechaEmision\}\}/g, todayFormatted)
      .replace(/\{\{contrato\.fechaInicio\}\}/g, startFormatted)
      .replace(/\{\{contrato\.fechaTermino\}\}/g, endFormatted)
      .replace(/\{\{contrato\.clausulaExportacion\}\}/g, defaultExportClause)
      .replace(/\{\{documento\.codigo\}\}/g, docNumberDisplay)
      .replace(/\{\{documento\.fechaEmision\}\}/g, todayFormatted)
      .replace(/\{\{rc\.codigo\}\}/g, docNumberDisplay)
      .replace(/\{\{cot\.codigo\}\}/g, docNumberDisplay)
      .replace(/\{\{ot\.codigo\}\}/g, docNumberDisplay)
      .replace(/\{\{atencion\.codigo\}\}/g, docNumberDisplay)
      .replace(/\{\{expediente\.codigo\}\}/g, expedient.code || 'EXP-2026-XXXX');

    setPreviewHtml(rendered);
  }, [
    selectedTemplateId, selectedCustomerId, selectedContractId, selectedExpedientId,
    docNumberDisplay, docTitle, docDescription, docAmount, docCurrency, docHours, docPaymentTerms,
    templates, customers, contracts, expedients, companyConfig
  ]);

  const handleGenerate = async () => {
    if (!selectedTemplateId) {
      alert('Por favor selecciona una plantilla documental.');
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post('/document-instances/generate', {
        templateId: selectedTemplateId,
        documentNumber: 'AUTO', // Correlativo automático por backend
        customerId: selectedCustomerId || undefined,
        contractId: selectedContractId || undefined,
        expedientId: selectedExpedientId || undefined,
        customVariables: {
          contrato: {
            titulo: docTitle,
            descripcion: docDescription,
            valor: docAmount,
            moneda: docCurrency,
            horas: docHours,
            metodoPago: docPaymentTerms,
          },
        },
      });

      const instance = res.data.data;
      setGeneratedResult(instance);
      setDocNumberDisplay(instance.documentNumber);
      alert(`¡Documento ${instance.documentNumber} generado exitosamente y registrado en el expediente!`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al generar documento');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = async (docId: string, docNumber?: string) => {
    try {
      const res = await api.get(`/document-instances/${docId}/pdf`, { responseType: 'blob' });
      const fileBlob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${docNumber || 'DOCUMENTO'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Error al descargar el PDF generado');
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '24px' }}>Cargando Generador de Documentos...</div>;
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const selectedCustomerObj = customers.find((c) => c.id === selectedCustomerId);
  const selectedContractObj = contracts.find((c) => c.id === selectedContractId);
  const selectedExpedientObj = expedients.find((e) => e.id === selectedExpedientId);

  return (
    <div style={{ maxWidth: '1500px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <FilePlus size={26} color="var(--accent-primary)" /> Generador de Documentos & Propuestas Comerciales
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Generación automatizada de actas de recepción, órdenes de trabajo, cotizaciones y documentos vinculados al expediente con previsualización en tiempo real.
          </p>
        </div>

        {generatedResult && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => handleDownloadPdf(generatedResult.id, generatedResult.documentNumber)} className="btn btn-primary">
              <Download size={16} /> Descargar {generatedResult.documentNumber} (PDF)
            </button>
            <button onClick={() => navigate('/expedients')} className="btn btn-secondary">
              <FolderKanban size={16} /> Ver en Expedientes
            </button>
          </div>
        )}
      </div>

      {/* Grid Principal: Formulario a la izquierda y Previsualización a la derecha */}
      <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Panel Izquierdo de Selección y Resumen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Tarjeta 1: Selección de Plantilla y Entidad */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={17} color="var(--accent-primary)" /> 1. Plantilla y Entidad
            </h3>

            <div className="form-group">
              <label className="form-label">Plantilla Documental *</label>
              <select
                className="form-select"
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.category}] {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cliente (Opcional / Recomendado)</label>
              <select
                className="form-select"
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
              >
                <option value="">-- Sin cliente asignado (Genérico) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.legalName} ({c.countryCode || c.country?.name || 'Cliente'})
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomerId && availableContracts.length > 0 && (
              <div className="form-group">
                <label className="form-label">Vincular a Contrato Existente</label>
                <select
                  className="form-select"
                  value={selectedContractId}
                  onChange={(e) => handleContractChange(e.target.value)}
                >
                  <option value="">-- Ningún contrato específico --</option>
                  {availableContracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedCustomerId && availableExpedients.length > 0 && (
              <div className="form-group" style={{ marginBottom: '4px' }}>
                <label className="form-label">Vincular a Expediente Existente</label>
                <select
                  className="form-select"
                  value={selectedExpedientId}
                  onChange={(e) => setSelectedExpedientId(e.target.value)}
                >
                  <option value="">-- Auto-asignar expediente según contrato --</option>
                  {availableExpedients.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.code} — {exp.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tarjeta 2: Resumen de Datos Extraídos Automáticamente */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <ShieldCheck size={17} color="var(--success)" /> 2. Datos Automáticos del Documento
              </h3>
              <span className="badge badge-success" style={{ fontSize: '11px', padding: '3px 8px' }}>
                SINCRONIZADO
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Los parámetros del documento se han extraído automáticamente del contrato y expediente seleccionados.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#0f172a', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Folio Correlativo:</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                  {docNumberDisplay}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tipo / Título:</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc', maxWidth: '240px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {docTitle}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cliente Asignado:</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                  {selectedCustomerObj ? selectedCustomerObj.legalName : 'Sin cliente'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Contrato SOW:</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8' }}>
                  {selectedContractObj ? selectedContractObj.code : 'Sin contrato marco'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Expediente Destino:</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
                  {selectedExpedientObj ? selectedExpedientObj.code : 'Auto-asignado'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monto & Horas:</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)' }}>
                  ${docAmount} {docCurrency} | {docHours} Horas
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Condición de Pago:</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '240px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {docPaymentTerms}
                </span>
              </div>
            </div>

            {/* Acordeón opcional para ajustes avanzados */}
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setShowAdvancedEdit(!showAdvancedEdit)}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent-primary)',
                  fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 0', textDecoration: 'underline'
                }}
              >
                {showAdvancedEdit ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showAdvancedEdit ? 'Ocultar ajustes manuales' : 'Personalizar o editar datos (Opcional)'}
              </button>

              {showAdvancedEdit && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Título Personalizado</label>
                    <input type="text" className="form-input" style={{ fontSize: '12px' }} value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Alcance / Descripción Detallada</label>
                    <textarea className="form-textarea" rows={3} style={{ fontSize: '12px' }} value={docDescription} onChange={(e) => setDocDescription(e.target.value)} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Monto ({docCurrency})</label>
                      <input type="text" className="form-input" style={{ fontSize: '12px' }} value={docAmount} onChange={(e) => setDocAmount(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Horas / Unidades</label>
                      <input type="text" className="form-input" style={{ fontSize: '12px' }} value={docHours} onChange={(e) => setDocHours(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Condición / Método de Pago</label>
                    <input type="text" className="form-input" style={{ fontSize: '12px' }} value={docPaymentTerms} onChange={(e) => setDocPaymentTerms(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {/* Botón Principal Generar y Registrar */}
            {!isViewer && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn btn-primary"
                style={{
                  width: '100%', justifyContent: 'center', padding: '14px',
                  fontSize: '14px', fontWeight: 700, backgroundColor: 'var(--accent-primary)'
                }}
              >
                <FileCheck2 size={18} /> {generating ? 'Generando y Guardando PDF...' : 'Generar y Registrar Documento'}
              </button>
            )}
          </div>
        </div>

        {/* Panel Derecho: Previsualización en Vivo */}
        <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', minHeight: '750px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={17} color="#00a896" /> Previsualización en Tiempo Real Oficial (Puppeteer PDF Output)
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Formato A4 Oficial SATEM</span>
          </div>

          <iframe
            title="preview"
            style={{ width: '100%', flex: 1, minHeight: '680px', border: 'none', borderRadius: '4px' }}
            srcDoc={previewHtml}
          />
        </div>
      </div>
    </div>
  );
};
