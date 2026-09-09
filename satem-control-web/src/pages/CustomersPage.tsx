import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Building2, Plus, Globe, Mail, Phone, FileSignature } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  // Form Cliente
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [countryCode, setCountryCode] = useState('USA');
  const [email, setEmail] = useState('');

  // Form Contrato
  const [contractTitle, setContractTitle] = useState('');
  const [contractCustomer, setContractCustomer] = useState('');
  const [contractType, setContractType] = useState('HOURLY');
  const [contractHours, setContractHours] = useState('100');

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
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al crear cliente');
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/contracts', {
        customerId: contractCustomer,
        title: contractTitle,
        type: contractType,
        modality: 'RECURRING',
        startDate: new Date().toISOString(),
        contractedHours: parseFloat(contractHours),
      });
      setShowContractModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al crear contrato');
    }
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Cargando clientes y contratos...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Clientes Extranjeros & Contratos / SOW</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Registro permanente de empresas contratantes, contactos, paquetes de atenciones y contratos por horas.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowCustomerModal(true)} className="btn btn-primary">
            <Plus size={18} /> Nuevo Cliente
          </button>
          <button onClick={() => setShowContractModal(true)} className="btn btn-secondary">
            <FileSignature size={18} /> Nuevo Contrato SOW
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Tabla Clientes */}
        <div className="table-container">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} color="var(--accent-primary)" /> Clientes Internacionales
            </h3>
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
              {customers.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{c.code}</td>
                  <td>{c.legalName}</td>
                  <td>
                    <span className="badge badge-info">{c.countryCode}</span>
                  </td>
                  <td style={{ fontSize: '13px' }}>{c.taxId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabla Contratos */}
        <div className="table-container">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSignature size={20} color="var(--success)" /> Contratos SOW Vigentes
            </h3>
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
              {contracts.map((ct) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Cliente */}
      {showCustomerModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '480px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Crear Cliente Internacional</h3>
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
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowCustomerModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Contrato */}
      {showContractModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '480px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Crear Contrato / SOW</h3>
            <form onSubmit={handleCreateContract}>
              <div className="form-group">
                <label className="form-label">Cliente</label>
                <select className="form-select" value={contractCustomer} onChange={(e) => setContractCustomer(e.target.value)} required>
                  <option value="">Seleccione un cliente...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.legalName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Título del Contrato SOW</label>
                <input type="text" className="form-input" value={contractTitle} onChange={(e) => setContractTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Horas Contratadas</label>
                <input type="number" className="form-input" value={contractHours} onChange={(e) => setContractHours(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowContractModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Contrato</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
