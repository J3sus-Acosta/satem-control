import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  FileSignature, ArrowRight, ArrowLeft, CheckCircle2,
  Building, DollarSign, Lock, FolderKanban, Download,
  Upload, FileText, Eye, Sparkles, Briefcase, Plus,
} from 'lucide-react';

export const ContractWizardPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estado del resultado exitoso
  const [generatedResult, setGeneratedResult] = useState<{
    contract: any;
    documentInstance: any;
    expedient: any;
  } | null>(null);

  // Estado para subida de firmado rápido
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [uploadingSigned, setUploadingSigned] = useState(false);
  const [signedUploadedSuccess, setSignedUploadedSuccess] = useState(false);

  // Form Wizard State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [contractTitle, setContractTitle] = useState('Statement of Work - Servicios Internacionales 2026');
  const [description, setDescription] = useState('Desarrollo de Software, Consultoría Técnica y Soporte Infraestructura Cloud');
  const [contractType, setContractType] = useState('HOURLY');
  const [modality, setModality] = useState('RECURRING');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [contractedHours, setContractedHours] = useState('100');
  const [totalAmount, setTotalAmount] = useState('7500');
  const [currency, setCurrency] = useState('USD');
  const [paymentTerms, setPaymentTerms] = useState('Zelle / SumUp / Wire Transfer en USD');
  const [exportClause, setExportClause] = useState('Servicio prestado desde Chile y utilizado exclusivamente en el extranjero por el Cliente, exento de IVA conforme al Art. 12 letra E Nº 7 del D.L. 825 de la Ley sobre Impuesto a las Ventas y Servicios.');

  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/customers'), api.get('/document-templates')])
      .then(([custRes, tplRes]) => {
        setCustomers(custRes.data.data);
        const tpls = tplRes.data.data.filter((t: any) => t.category === 'CONTRACT');
        setTemplates(tpls);
        if (tpls.length > 0) setSelectedTemplateId(tpls[0].id);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleGenerateContract = async () => {
    setSubmitting(true);
    try {
      // 1. Crear el Contrato en DB (el backend auto-crea el Expediente en la misma transacción)
      const contractRes = await api.post('/contracts', {
        customerId: selectedCustomerId,
        type: contractType,
        modality,
        title: contractTitle,
        description,
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        currency,
        totalAmount: parseFloat(totalAmount) || 0,
        contractedHours: parseFloat(contractedHours) || 0,
        paymentTerms,
      });

      const createdContract = contractRes.data.data;
      const createdExpedient = createdContract.expedient;

      // 2. Generar Instancia Documental en PDF / HTML vinculada al contrato y al expediente con TODOS los datos
      const docRes = await api.post('/document-instances/generate', {
        templateId: selectedTemplateId,
        documentNumber: createdContract.code,
        customerId: selectedCustomerId,
        contractId: createdContract.id,
        expedientId: createdExpedient?.id,
        customVariables: {
          contrato: {
            codigo: createdContract.code,
            titulo: contractTitle,
            descripcion: description,
            tipo: contractType,
            modalidad: modality,
            horas: contractedHours,
            valor: totalAmount,
            moneda: currency,
            metodoPago: paymentTerms,
            fechaInicio: startDate,
            fechaTermino: endDate || 'Indefinida / Según horas consumidas',
            clausulaExportacion: exportClause,
          },
        },
      });

      const createdDoc = docRes.data.data;

      // 3. Establecer resultado para mostrar la pantalla de éxito con descarga y acciones
      setGeneratedResult({
        contract: createdContract,
        documentInstance: createdDoc,
        expedient: createdExpedient,
      });
      setStep(4);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al generar contrato SOW');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async (docId?: string) => {
    const id = docId || generatedResult?.documentInstance?.id;
    if (!id) return;
    try {
      const res = await api.get(`/document-instances/${id}/pdf`, { responseType: 'blob' });
      const fileBlob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${generatedResult?.contract?.code || 'CONTRATO-SOW'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Error al descargar el PDF');
    }
  };

  const handleUploadSigned = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedFile || !generatedResult?.documentInstance?.id) return;
    setUploadingSigned(true);
    const formData = new FormData();
    formData.append('signedPdf', signedFile);
    try {
      await api.post(`/document-instances/${generatedResult.documentInstance.id}/upload-signed`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSignedUploadedSuccess(true);
      alert('¡Documento firmado subido y verificado exitosamente!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al subir documento firmado');
    } finally {
      setUploadingSigned(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Cargando wizard de contratos...</div>;

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <FileSignature size={28} color="var(--accent-primary)" /> Wizard de Contrato SOW Bilingüe (ES/EN)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Generador asistido de Declaración de Trabajo (SOW), carga en plantilla oficial y creación automática de expediente.
        </p>
      </div>

      {/* Indicador de Pasos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        {[
          { n: 1, label: '1. Cliente & Plantilla' },
          { n: 2, label: '2. Alcance & Servicios' },
          { n: 3, label: '3. Honorarios & Previa' },
          { n: 4, label: '4. Descarga & Expediente' },
        ].map(({ n, label }) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step === n ? 'var(--accent-primary)' : step > n ? 'var(--success)' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '13px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              backgroundColor: step === n ? 'var(--accent-primary)' : step > n ? 'var(--success)' : 'var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 800, color: '#fff',
            }}>
              {step > n ? '✓' : n}
            </div>
            {label}
          </div>
        ))}
      </div>

      {/* Paso 1: Cliente & Plantilla */}
      {step === 1 && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '28px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Paso 1: Selección de Cliente Contratante</h3>

          <div className="form-group">
            <label className="form-label">Cliente Extranjero</label>
            <select className="form-select" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required>
              <option value="">Seleccione un cliente registrado...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.legalName} ({c.countryCode}) - RUT/Tax ID: {c.taxId}
                </option>
              ))}
            </select>
            {customers.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--warning)', marginTop: '6px' }}>
                ⚠ No hay clientes registrados. Ve a{' '}
                <span
                  style={{ color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate('/customers')}
                >
                  Clientes & Contratos
                </span>{' '}
                para crear uno primero.
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Plantilla Contractual Oficial</label>
            {templates.length > 0 ? (
              <select className="form-select" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (v{t.currentVersion}.0 - {t.language})
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--warning)' }}>
                ⚠ Sin plantillas de tipo CONTRACT activas. Ve a{' '}
                <span
                  style={{ color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate('/admin/templates')}
                >
                  Plantillas Admin
                </span>{' '}
                para configurar una.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setStep(2)} className="btn btn-primary" disabled={!selectedCustomerId}>
              Siguiente <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Paso 2: Alcance & Servicios */}
      {step === 2 && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '28px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Paso 2: Título, Fechas y Alcance del Servicio</h3>

          <div className="form-group">
            <label className="form-label">Título de la Declaración de Trabajo (SOW)</label>
            <input type="text" className="form-input" value={contractTitle} onChange={(e) => setContractTitle(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Tipo de Contrato</label>
              <select className="form-select" value={contractType} onChange={(e) => setContractType(e.target.value)}>
                <option value="HOURLY">Bolsa de Horas (Hourly)</option>
                <option value="PER_ATTENTION">Por Atención / Incidencia</option>
                <option value="ATTENTION_PACKAGE">Paquete de Atenciones</option>
                <option value="FIXED_PERIOD">Período Fijo / Retainer</option>
                <option value="RETAINER">Retainer Mensual</option>
                <option value="OTHER">Servicios Profesionales TI</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Modalidad de Ejecución</label>
              <select className="form-select" value={modality} onChange={(e) => setModality(e.target.value)}>
                <option value="RECURRING">Recurrente / Periódico</option>
                <option value="ONE_TIME">Servicio Único / Proyecto Cerrado</option>
                <option value="OPEN_ENDED">Plazo Indefinido / Según Consumo</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Fecha de Inicio</label>
              <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Término / Vigencia <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
              <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="Dejar vacío si es indefinido" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción Detallada del Alcance (Scope of Work)</label>
            <textarea className="form-textarea" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button onClick={() => setStep(1)} className="btn btn-secondary">
              <ArrowLeft size={18} /> Anterior
            </button>
            <button onClick={() => setStep(3)} className="btn btn-primary">
              Siguiente <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Honorarios, Resumen & Generación */}
      {step === 3 && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '28px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Paso 3: Honorarios, Condiciones & Confirmación</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Horas / Unidades</label>
              <input type="number" className="form-input" value={contractedHours} onChange={(e) => setContractedHours(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Moneda</label>
              <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
                <option value="CLP">CLP - Peso Chileno</option>
                <option value="UF">UF - Unidad de Fomento</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Monto Total ({currency})</label>
              <input type="number" className="form-input" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
            </div>
          </div>

          {parseFloat(contractedHours) > 0 && parseFloat(totalAmount) > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--accent-primary)', marginBottom: '14px', fontWeight: 600 }}>
              💡 Tarifa calculada: ${(parseFloat(totalAmount) / parseFloat(contractedHours)).toFixed(2)} {currency}/hora
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Forma y Condiciones de Pago</label>
            <input type="text" className="form-input" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Cláusula de Exención de IVA (Exportación de Servicios)</label>
            <textarea className="form-textarea" rows={2} value={exportClause} onChange={(e) => setExportClause(e.target.value)} required />
          </div>

          {/* Resumen previo de datos cargados */}
          <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={16} /> Resumen de Datos que se Plasmarán en el SOW:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <div><strong>Cliente:</strong> {selectedCustomer?.legalName} ({selectedCustomer?.taxId})</div>
              <div><strong>País:</strong> {selectedCustomer?.countryCode}</div>
              <div><strong>Plantilla:</strong> {selectedTemplate?.name || 'SOW Oficial'}</div>
              <div><strong>Monto:</strong> ${totalAmount} {currency} ({contractedHours} hrs)</div>
              <div><strong>Vigencia:</strong> {startDate} {endDate ? `al ${endDate}` : '(Indefinida)'}</div>
              <div><strong>Modalidad:</strong> {modality}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(2)} className="btn btn-secondary" disabled={submitting}>
              <ArrowLeft size={18} /> Anterior
            </button>
            <button onClick={handleGenerateContract} className="btn btn-primary" disabled={submitting}>
              <CheckCircle2 size={18} /> {submitting ? 'Generando SOW y Expediente...' : 'Generar Contrato SOW & Crear Expediente'}
            </button>
          </div>
        </div>
      )}

      {/* Paso 4: Descarga, Expediente y Subida de Firmado */}
      {step === 4 && generatedResult && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--success)', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: '0 0 40px rgba(16,185,129,0.15)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <CheckCircle2 size={56} color="var(--success)" style={{ margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '22px', color: 'var(--success)', marginBottom: '6px' }}>
              ¡Contrato SOW & Expediente Creados con Éxito!
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
              <span className="badge badge-info" style={{ fontSize: '13px' }}>Contrato: {generatedResult.contract.code}</span>
              <span className="badge badge-success" style={{ fontSize: '13px' }}>Expediente: {generatedResult.expedient?.code || 'EXP-AUTO'}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
            {/* Tarjeta de Descarga y Envío */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <h4 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '10px' }}>
                <Download size={18} /> 1. Descargar Documento
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Descarga el SOW generado en PDF con el formato oficial SATEM para revisarlo, firmarlo o enviarlo al cliente.
              </p>
              <button
                onClick={() => handleDownloadPdf()}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Download size={18} /> Descargar SOW (PDF)
              </button>
            </div>

            {/* Tarjeta de Subida de Firmado (Opcional) */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <h4 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', marginBottom: '10px' }}>
                <Upload size={18} /> 2. Cargar PDF Firmado (Opcional)
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Si el cliente ya firmó el contrato, sube el PDF firmado. También puedes hacerlo más tarde desde el expediente sin bloquear tus operaciones.
              </p>
              {signedUploadedSuccess ? (
                <div style={{ padding: '10px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '12px', textAlign: 'center' }}>
                  ✓ Documento firmado cargado exitosamente.
                </div>
              ) : (
                <form onSubmit={handleUploadSigned} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSignedFile(e.target.files?.[0] || null)}
                    style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={!signedFile || uploadingSigned}
                    style={{ fontSize: '12px', justifyContent: 'center' }}
                  >
                    <Upload size={14} /> {uploadingSigned ? 'Subiendo...' : 'Subir Firmado'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Acciones para continuar el flujo */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/expedients')}
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              <FolderKanban size={18} /> Ir al Expediente ({generatedResult.expedient?.code})
            </button>

            <button
              onClick={() => navigate('/documents/generator')}
              className="btn btn-secondary"
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              <Plus size={18} /> Generar Otro Documento / Propuesta
            </button>

            <button
              onClick={() => navigate('/customers')}
              className="btn btn-secondary"
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              <Building size={18} /> Ver Clientes & Contratos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

