import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building2, Plus, FileSignature, ArrowRight, ExternalLink, Edit2, MapPin, Phone, Mail } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  // Form Cliente (Crear / Editar)
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [countryCode, setCountryCode] = useState('USA');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
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

  const openCreateModal = () => {
    setEditingCustomer(null);
    setLegalName('');
    setTaxId('');
    setCountryCode('USA');
    setAddress('');
    setCity('');
    setPhone('');
    setEmail('');
    setShowCustomerModal(true);
  };

  const openEditModal = (c: any) => {
    setEditingCustomer(c);
    setLegalName(c.legalName || '');
    setTaxId(c.taxId || '');
    setCountryCode(c.countryCode || 'USA');
    setAddress(c.address || '');
    setCity(c.city || '');
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setShowCustomerModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, {
          legalName,
          taxId,
          countryCode,
          address,
          city,
          phone,
          email,
        });
      } else {
        const res = await api.post('/customers', {
          legalName,
          taxId,
          countryCode,
          address,
          city,
          phone,
          email,
        });
        if (res.data.warning) {
          alert(`Advertencia: ${res.data.warning}`);
        }
      }
      setShowCustomerModal(false);
      setEditingCustomer(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al guardar cliente');
    }
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Cargando clientes y contratos...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Clientes Extranjeros & Contratos SOW</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Registro de empresas contratantes y sus contratos. Para generar un contrato SOW con PDF oficial usa el Wizard.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {!isViewer && (
            <button onClick={openCreateModal} className="btn btn-secondary">
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
        flexWrap: 'wrap',
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

      <div className="grid-split">
        {/* Tabla Clientes */}
        <div className="table-container">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} color="var(--accent-primary)" /> Clientes Internacionales
            </h3>
            <span className="badge badge-info">{customers.length} registrados</span>
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código / Razón Social</th>
                <th>País / Tax ID</th>
                <th>Domicilio & Contacto</th>
                <th>Acciones</th>
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
                    <td>
                      <div style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{c.code}</div>
                      <div style={{ fontWeight: 600, marginTop: '2px' }}>{c.legalName}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{c.country?.name || c.countryCode}</span>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Tax ID: {c.taxId}
                      </div>
                    </td>
                    <td>
                      {c.address ? (
                        <div style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="var(--accent-primary)" /> {c.address}{c.city ? `, ${c.city}` : ''}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: 'var(--warning)', fontStyle: 'italic' }}>
                          ⚠ Sin domicilio registrado
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {c.email && <span>{c.email}</span>}
                        {c.phone && <span> {c.email ? '| ' : ''}{c.phone}</span>}
                      </div>
                    </td>
                    <td>
                      {!isViewer && (
                        <button
                          onClick={() => openEditModal(c)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Editar Domicilio, Teléfono y Datos"
                        >
                          <Edit2 size={13} /> Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tabla Contratos */}
        <div className="table-container">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSignature size={20} color="var(--success)" /> Contratos SOW Vigentes
            </h3>
            <span className="badge badge-success">{contracts.length} activos</span>
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Consumo</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                    Sin contratos. Usa el Wizard SOW para crear uno con PDF.
                  </td>
                </tr>
              ) : (
                contracts.map((ct) => (
                  <tr key={ct.id}>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{ct.code}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ct.title}</div>
                    </td>
                    <td style={{ fontSize: '13px' }}>{ct.customer?.legalName}</td>
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

      {/* Modal Crear / Editar Cliente */}
      {showCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>
              {editingCustomer ? `Editar Cliente: ${editingCustomer.legalName}` : 'Crear Cliente Internacional'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              El domicilio y datos de contacto se incorporarán automáticamente en los contratos SOW y expedientes.
            </p>
            <form onSubmit={handleSaveCustomer}>
              <div className="form-group">
                <label className="form-label">Razón Social del Cliente</label>
                <input type="text" className="form-input" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Ej: FAMILIA SEGURA LLC" required />
              </div>
              <div className="grid-form-2">
                <div className="form-group">
                  <label className="form-label">Tax ID / Identificación Fiscal</label>
                  <input type="text" className="form-input" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="Ej: 93-2163996" required />
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
                    <option value="CHL">Chile</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Domicilio / Dirección del Cliente</label>
                <input type="text" className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej: 123 Main Street, Suite 400" />
              </div>
              <div className="form-group">
                <label className="form-label">Ciudad / Estado</label>
                <input type="text" className="form-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej: Miami, FL" />
              </div>
              <div className="grid-form-2">
                <div className="form-group">
                  <label className="form-label">Email de Contacto</label>
                  <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@cliente.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono de Contacto</label>
                  <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 305 123 4567" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => { setShowCustomerModal(false); setEditingCustomer(null); }} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
