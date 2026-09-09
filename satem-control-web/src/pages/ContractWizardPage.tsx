import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { FileSignature, ArrowRight, ArrowLeft, CheckCircle2, Building, DollarSign, Lock } from 'lucide-react';

export const ContractWizardPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Wizard State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [contractTitle, setContractTitle] = useState('Statement of Work - Servicios Internacionales 2026');
  const [description, setDescription] = useState('Desarrollo de Software, Consultoría Técnica y Soporte Infraestructura Cloud');
  const [contractType, setContractType] = useState('HOURLY');
  const [contractedHours, setContractedHours] = useState('100');
  const [totalAmount, setTotalAmount] = useState('7500');
  const [currency, setCurrency] = useState('USD');
  const [paymentTerms, setPaymentTerms] = useState('Zelle / SumUp / Wire Transfer en USD');
  const [exportClause, setExportClause] = useState('Servicio prestado desde Chile y utilizado exclusivamente en el extranjero exento de IVA');

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

  const handleGenerateContract = async () => {
    try {
      // 1. Crear el Contrato en DB
      const contractRes = await api.post('/contracts', {
        customerId: selectedCustomerId,
        type: contractType,
        modality: 'RECURRING',
        title: contractTitle,
        description,
        startDate: new Date().toISOString(),
        currency,
        totalAmount: parseFloat(totalAmount),
        contractedHours: parseFloat(contractedHours),
        paymentTerms,
      });

      const createdContract = contractRes.data.data;

      // 2. Generar Instancia Documental en PDF / HTML congelado
      await api.post('/document-instances/generate', {
        templateId: selectedTemplateId,
        documentNumber: createdContract.code,
        customerId: selectedCustomerId,
        contractId: createdContract.id,
        customVariables: {
          contrato: {
            codigo: createdContract.code,
            titulo: contractTitle,
            descripcion: description,
            tipo: contractType,
            horas: contractedHours,
            valor: totalAmount,
            moneda: currency,
            metodoPago: paymentTerms,
          },
        },
      });

      alert(`¡Contrato ${createdContract.code} e Instancia Documental PDF generados exitosamente!`);
      navigate('/customers');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al generar contrato SOW');
    }
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Cargando wizard de contratos...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <FileSignature size={28} color="var(--accent-primary)" /> Wizard de Contrato SOW Bilingüe (ES/EN)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Generador asistido de Declaración de Trabajo (SOW) y Contratos de Exportación de Servicios SATEM.
        </p>
      </div>

      {/* Indicador de Pasos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div style={{ color: step === 1 ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 'bold' }}>1. Cliente & Plantilla</div>
        <div style={{ color: step === 2 ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 'bold' }}>2. Alcance & Servicios</div>
        <div style={{ color: step === 3 ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 'bold' }}>3. Honorarios & Exportación</div>
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
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Plantilla Contractual Oficial</label>
            <select className="form-select" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (v{t.currentVersion}.0 - {t.language})
                </option>
              ))}
            </select>
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
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Paso 2: Título y Alcance del Servicio</h3>

          <div className="form-group">
            <label className="form-label">Título de la Declaración de Trabajo (SOW)</label>
            <input type="text" className="form-input" value={contractTitle} onChange={(e) => setContractTitle(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción Detallada del Alcance</label>
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

      {/* Paso 3: Honorarios & Confirmación */}
      {step === 3 && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '28px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Paso 3: Honorarios, Cláusula de Exportación & Firma</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Horas Contratadas</label>
              <input type="number" className="form-input" value={contractedHours} onChange={(e) => setContractedHours(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Monto Total ({currency})</label>
              <input type="number" className="form-input" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Forma y Condiciones de Pago</label>
            <input type="text" className="form-input" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} required />
          </div>

          <div style={{ padding: '12px 16px', backgroundColor: '#0f172a', borderLeft: '4px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)', marginBottom: '24px', fontSize: '12px' }}>
            <strong>🔒 Cláusula de Exención Tributaria Registrada:</strong><br />
            {exportClause}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(2)} className="btn btn-secondary">
              <ArrowLeft size={18} /> Anterior
            </button>
            <button onClick={handleGenerateContract} className="btn btn-primary">
              <CheckCircle2 size={18} /> Generar Contrato SOW & PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
