import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Download, Eye, Sparkles, Building, FolderKanban,
  CheckCircle2, RefreshCw, Send, ArrowLeft, ArrowRight, Layers, FilePlus
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

  // Estados de formulario
  const [selectedTemplateId, setSelectedTemplateId] = useState(queryTemplateId);
  const [selectedCustomerId, setSelectedCustomerId] = useState(queryCustomerId);
  const [selectedContractId, setSelectedContractId] = useState(queryContractId);
  const [selectedExpedientId, setSelectedExpedientId] = useState(queryExpedientId);

  // Variables editables del documento
  const [docNumber, setDocNumber] = useState(`DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [docTitle, setDocTitle] = useState('Propuesta Comercial & Alcance Técnico 2026');
  const [docDescription, setDocDescription] = useState('Prestación de servicios profesionales de consultoría técnica, desarrollo cloud y aseguramiento operativo para exportación.');
  const [docAmount, setDocAmount] = useState('5000');
  const [docCurrency, setDocCurrency] = useState('USD');
  const [docHours, setDocHours] = useState('80');
  const [docPaymentTerms, setDocPaymentTerms] = useState('Transferencia Bancaria Internacional / SumUp');

  // Estado UI
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ id: string; documentNumber: string } | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');

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
        if (tpls.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(tpls[0].id);
        }
        setCustomers(custRes.data.data || []);
        setContracts(contRes.data.data || []);
        setExpedients(expRes.data.data || []);
        setCompanyConfig(compRes.data.data || {});
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

  // Auto-seleccionar si el cliente cambia
  useEffect(() => {
    if (selectedCustomerId && availableContracts.length > 0 && !selectedContractId) {
      // no forzar pero si tiene expediente auto-enlazar
    }
  }, [selectedCustomerId]);

  // Actualizar previsualización interactiva HTML
  useEffect(() => {
    const currentTpl = templates.find((t) => t.id === selectedTemplateId);
    if (!currentTpl) return;

    const rawTemplate = currentTpl.versions?.[0]?.htmlTemplate || currentTpl.html || '<p>Plantilla sin contenido</p>';
    const customer = customers.find((c) => c.id === selectedCustomerId) || {};
    const contract = contracts.find((c) => c.id === selectedContractId) || {};
    const expedient = expedients.find((e) => e.id === selectedExpedientId) || {};

    let rendered = rawTemplate
      .replace(/\{\{empresa\.nombre\}\}/g, companyConfig?.legalName || 'SATEM SpA')
      .replace(/\{\{empresa\.rut\}\}/g, companyConfig?.taxId || '77.890.123-K')
      .replace(/\{\{empresa\.email\}\}/g, companyConfig?.email || 'contacto@satem.cl')
      .replace(/\{\{empresa\.website\}\}/g, companyConfig?.website || 'www.satemsoluciones.com')
      .replace(/\{\{empresa\.direccion\}\}/g, companyConfig?.address || 'Av. Providencia 1234, Of 501')
      .replace(/\{\{empresa\.pais\}\}/g, companyConfig?.country || 'Chile')
      .replace(/\{\{empresa\.representanteLegal\}\}/g, companyConfig?.legalRepresentative || 'Jesús Acosta')
      .replace(/\{\{cliente\.nombreLegal\}\}/g, customer.legalName || '[Nombre del Cliente]')
      .replace(/\{\{cliente\.taxId\}\}/g, customer.taxId || '[Tax ID / RUT]')
      .replace(/\{\{cliente\.pais\}\}/g, customer.countryCode || customer.country?.name || '[País Cliente]')
      .replace(/\{\{cliente\.direccion\}\}/g, customer.address || '[Dirección Cliente]')
      .replace(/\{\{cliente\.email\}\}/g, customer.email || '[Email Cliente]')
      .replace(/\{\{contrato\.codigo\}\}/g, contract.code || docNumber)
      .replace(/\{\{contrato\.titulo\}\}/g, docTitle)
      .replace(/\{\{contrato\.descripcion\}\}/g, docDescription)
      .replace(/\{\{contrato\.valor\}\}/g, docAmount)
      .replace(/\{\{contrato\.moneda\}\}/g, docCurrency)
      .replace(/\{\{contrato\.horas\}\}/g, docHours)
      .replace(/\{\{contrato\.metodoPago\}\}/g, docPaymentTerms)
      .replace(/\{\{expediente\.codigo\}\}/g, expedient.code || 'EXP-AUTOMÁTICO')
      .replace(/\{\{ot\.codigo\}\}/g, `OT-${docNumber}`)
      .replace(/\{\{atencion\.codigo\}\}/g, `AT-${docNumber}`);

    setPreviewHtml(rendered);
  }, [
    selectedTemplateId, selectedCustomerId, selectedContractId, selectedExpedientId,
    docNumber, docTitle, docDescription, docAmount, docCurrency, docHours, docPaymentTerms,
    templates, customers, contracts, expedients, companyConfig
  ]);

  const handleGenerate = async () => {
    if (!selectedTemplateId) {
      alert('Por favor selecciona una plantilla');
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post('/document-instances/generate', {
        templateId: selectedTemplateId,
        documentNumber: docNumber,
        customerId: selectedCustomerId || undefined,
        contractId: selectedContractId || undefined,
        expedientId: selectedExpedientId || undefined,
        customVariables: {
          contrato: {
            codigo: docNumber,
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
      alert('¡Documento generado exitosamente en PDF y vinculado!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al generar documento');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = async (docId: string) => {
    try {
      const res = await api.get(`/document-instances/${docId}/pdf`, { responseType: 'blob' });
      const fileBlob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${docNumber}.pdf`);
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

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <FilePlus size={26} color="var(--accent-primary)" /> Generador de Documentos & Propuestas Comerciales
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Crea propuestas comerciales, cotizaciones, actas u órdenes de trabajo basadas en plantillas oficiales con previsualización en tiempo real.
          </p>
        </div>

        {generatedResult && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => handleDownloadPdf(generatedResult.id)} className="btn btn-primary">
              <Download size={16} /> Descargar {generatedResult.documentNumber} (PDF)
            </button>
            <button onClick={() => navigate('/expedients')} className="btn btn-secondary">
              <FolderKanban size={16} /> Ver en Expedientes
            </button>
          </div>
        )}
      </div>

      {/* Grid Principal: Formulario a la izquierda y Previsualización a la derecha */}
      <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Panel de Configuración y Datos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Tarjeta 1: Selección de Plantilla y Cliente */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={17} color="var(--accent-primary)" /> 1. Plantilla y Entidad
            </h3>

            <div className="form-group">
              <label className="form-label">Plantilla Documental</label>
              <select
                className="form-select"
                value={selectedTemplateId}
                onChange={(e) => {
                  setSelectedTemplateId(e.target.value);
                  const t = templates.find((tpl) => tpl.id === e.target.value);
                  if (t) setDocTitle(t.name);
                }}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.category}] {t.name} (v{t.currentVersion}.0)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cliente (Opcional / Recomendado)</label>
              <select
                className="form-select"
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setSelectedContractId('');
                  setSelectedExpedientId('');
                }}
              >
                <option value="">-- Sin cliente asignado (Genérico) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.legalName} ({c.countryCode})
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomerId && availableContracts.length > 0 && (
              <div className="form-group">
                <label className="form-label">Vincular a Contrato Existente (Opcional)</label>
                <select
                  className="form-select"
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
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
              <div className="form-group">
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

          {/* Tarjeta 2: Datos Específicos del Documento */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={17} color="var(--warning)" /> 2. Contenido del Documento
            </h3>

            <div className="form-group">
              <label className="form-label">Número / Código de Documento</label>
              <input
                type="text"
                className="form-input"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Título del Documento</label>
              <input
                type="text"
                className="form-input"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Alcance / Descripción Detallada</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={docDescription}
                onChange={(e) => setDocDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Monto Total ({docCurrency})</label>
                <input
                  type="number"
                  className="form-input"
                  value={docAmount}
                  onChange={(e) => setDocAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Horas / Unidades</label>
                <input
                  type="number"
                  className="form-input"
                  value={docHours}
                  onChange={(e) => setDocHours(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Condiciones / Método de Pago</label>
              <input
                type="text"
                className="form-input"
                value={docPaymentTerms}
                onChange={(e) => setDocPaymentTerms(e.target.value)}
              />
            </div>

            {!isViewer && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '12px' }}
              >
                <CheckCircle2 size={18} /> {generating ? 'Generando PDF...' : 'Generar y Registrar Documento'}
              </button>
            )}
          </div>
        </div>

        {/* Panel Derecho: Previsualización en Vivo */}
        <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', minHeight: '680px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={16} color="#00a896" /> Previsualización en Tiempo Real (Puppeteer PDF Output)
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Formato A4 Oficial</span>
          </div>

          <iframe
            title="preview"
            style={{ width: '100%', flex: 1, minHeight: '620px', border: 'none' }}
            srcDoc={previewHtml}
          />
        </div>
      </div>
    </div>
  );
};
