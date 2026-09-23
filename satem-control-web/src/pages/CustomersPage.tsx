import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building2, Plus, FileSignature, ArrowRight, ExternalLink } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  // Form Cliente
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [countryCode, setCountryCode] = useState('USA');
  const [email, setEmail] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('/customers'), api.get('/contracts')])
      .then(([custRes, contRes]) => {
        setCustomers(custRes.data.data);
        setContracts(contRes.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/customers', {
        legalName,
        taxId,
        countryCode,
        email,
      });
      if (res.data.warning) {
        alert(`Advertencia: ${res.data.warning}`);
      }
      setShowCustomerModal(false);
      setLegalName('');
      setTaxId('');
      setCountryCode('USA');
      setEmail('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al crear cliente');
    }
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Cargando clientes y contratos...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Clientes Extranjeros & Contratos SOW</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Registro de empresas contratantes y sus contratos. Para generar un contrato SOW con PDF oficial usa el Wizard.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!isViewer && (
            <button onClick={() => setShowCustomerModal(true)} className="btn btn-secondary">
              <Plus size={18} /> Nuevo Cliente
            </button>
          )}
          <button
            onClick={() => navigate('/contracts/wizard')}
            className="btn btn-primary"
            disabled={isViewer}
          >
            <FileSignature size={18} /> Generar Contrato SOW
            <ExternalLink size={14} style={{ opacity: 0.7 }} />
          </button>
        </div>
      </div>

      {/* Banner informativo del Wizard SOW */}
      <div style={{
        padding: '14px 20px',
        backgroundColor: 'rgba(0, 168, 150, 0.08)',
        border: '1px solid var(--accent-primary)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileSignature size={20} color="var(--accent-primary)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-primary)' }}>
              Wizard de Contrato SOW Bilingüe (ES/EN)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Genera el contrato en BD + PDF oficial con cláusula tributaria de exportación en un solo flujo guiado de 3 pasos.
            </div>
          </div>
        </div>
        <button onClick={() => navigate('/contracts/wizard')} className="btn btn-primary" style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
          Abrir Wizard <ArrowRight size={16} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Tabla Clientes */}
        <div className="table-container">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} color="var(--accent-primary)" /> Clientes Internacionales
            </h3>
            <span className="badge badge-info">{customers.length} registrados</span>
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Razón Social</th>
                <th>País</th>
                <th>Tax ID</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                    Sin clientes registrados. Crea el primero con "Nuevo Cliente".
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{c.code}</td>
                    <td>{c.legalName}</td>
                    <td>
                      <span className="badge badge-info">{c.countryCode}</span>
                    </td>
                    <td style={{ fontSize: '13px' }}>{c.taxId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tabla Contratos */}
        <div className="table-container">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSignature size={20} color="var(--success)" /> Contratos SOW Vigentes
            </h3>
            <span className="badge badge-success">{contracts.length} activos</span>
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Cliente</th>
                <th>Horas Consumidas</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                    Sin contratos. Usa el Wizard SOW para crear uno con PDF.
                  </td>
                </tr>
              ) : (
                contracts.map((ct) => (
                  <tr key={ct.id}>
                    <td style={{ fontWeight: 'bold' }}>{ct.code}</td>
                    <td>{ct.title}</td>
                    <td>{ct.customer?.legalName}</td>
                    <td>
                      <span className="badge badge-warning">
                        {ct.consumedHours} / {ct.contractedHours || '∞'} hrs
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Cliente */}
      {showCustomerModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '480px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>Crear Cliente Internacional</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Una vez creado, podrás generar un Contrato SOW desde el Wizard.
            </p>
            <form onSubmit={handleCreateCustomer}>
              <div className="form-group">
                <label className="form-label">Razón Social del Cliente</label>
                <input type="text" className="form-input" value={legalName} onChange={(e) => setLegalName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Tax ID / Identificación Fiscal Extranjera</label>
                <input type="text" className="form-input" value={taxId} onChange={(e) => setTaxId(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">País</label>
                <select className="form-select" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                  <option value="USA">Estados Unidos</option>
                  <option value="PER">Perú</option>
                  <option value="COL">Colombia</option>
                  <option value="MEX">México</option>
                  <option value="ESP">España</option>
                  <option value="ARG">Argentina</option>
                  <option value="BRA">Brasil</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Email de Contacto (opcional)</label>
                <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowCustomerModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
