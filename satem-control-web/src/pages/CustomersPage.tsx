import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Building2, Plus, FileSignature, ArrowRight, ExternalLink, Edit2, MapPin,
  Phone, Mail, Users, GitCommit, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  // Modales de Entidades / Contactos / Versión de Contrato
  const [showEntityModal, setShowEntityModal] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState<string | null>(null);
  const [showVersionModal, setShowVersionModal] = useState<any | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  // Form Cliente
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [countryCode, setCountryCode] = useState('USA');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [branchName, setBranchName] = useState('Casa Matriz');

  // Form Entidad / Sucursal
  const [entityName, setEntityName] = useState('');
  const [entityTaxId, setEntityTaxId] = useState('');
  const [entityAddress, setEntityAddress] = useState('');
  const [entityIsPrimary, setEntityIsPrimary] = useState(false);

  // Form Contacto
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactType, setContactType] = useState('TECHNICAL');
  const [contactIsPrimary, setContactIsPrimary] = useState(false);

  // Form Versión / Adenda Contrato
  const [versionTitle, setVersionTitle] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  const [versionStartDate, setVersionStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [versionEndDate, setVersionEndDate] = useState('');
  const [versionTotalAmount, setVersionTotalAmount] = useState('');
  const [versionRate, setVersionRate] = useState('');
  const [versionHours, setVersionHours] = useState('');
  const [versionReason, setVersionReason] = useState('');

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
    setBranchName('Casa Matriz');
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
    setBranchName('');
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
          branchName: branchName || 'Casa Matriz',
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

  const handleAddEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    const custId = showEntityModal || editingCustomer?.id;
    if (!custId || !entityName.trim()) return;
    try {
      await api.post(`/customers/${custId}/entities`, {
        name: entityName.trim(),
        taxId: entityTaxId || undefined,
        address: entityAddress || undefined,
        isPrimary: entityIsPrimary,
      });
      setShowEntityModal(null);
      setEntityName('');
      setEntityTaxId('');
      setEntityAddress('');
      setEntityIsPrimary(false);
      if (editingCustomer && editingCustomer.id === custId) {
        const updatedCust = await api.get(`/customers/${custId}`);
        setEditingCustomer(updatedCust.data.data);
      }
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al agregar entidad/sucursal');
    }
  };

  const handleDeleteEntity = async (customerId: string, entityId: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la sucursal "${name}"?`)) return;
    try {
      await api.delete(`/customers/${customerId}/entities/${entityId}`);
      if (editingCustomer && editingCustomer.id === customerId) {
        const updatedCust = await api.get(`/customers/${customerId}`);
        setEditingCustomer(updatedCust.data.data);
      }
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al eliminar sucursal');
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showContactModal) return;
    try {
      await api.post(`/customers/${showContactModal}/contacts`, {
        name: contactName,
        title: contactTitle || undefined,
        email: contactEmail,
        phone: contactPhone || undefined,
        contactType,
        isPrimary: contactIsPrimary,
      });
      setShowContactModal(null);
      setContactName('');
      setContactTitle('');
      setContactEmail('');
      setContactPhone('');
      setContactType('TECHNICAL');
      setContactIsPrimary(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al registrar contacto');
    }
  };

  const openVersionModal = (contract: any) => {
    setShowVersionModal(contract);
    setVersionTitle(contract.title || '');
    setVersionDescription(contract.description || '');
    setVersionStartDate(contract.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : '');
    setVersionEndDate(contract.endDate ? new Date(contract.endDate).toISOString().slice(0, 10) : '');
    setVersionTotalAmount(contract.totalAmount ? String(contract.totalAmount) : '');
    setVersionRate(contract.rate ? String(contract.rate) : '');
    setVersionHours(contract.contractedHours ? String(contract.contractedHours) : '');
    setVersionReason('');
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showVersionModal) return;
    try {
      await api.post(`/contracts/${showVersionModal.id}/versions`, {
        title: versionTitle,
        description: versionDescription || undefined,
        startDate: versionStartDate,
        endDate: versionEndDate ? versionEndDate : undefined,
        totalAmount: versionTotalAmount ? parseFloat(versionTotalAmount) : undefined,
        rate: versionRate ? parseFloat(versionRate) : undefined,
        contractedHours: versionHours ? parseFloat(versionHours) : undefined,
        changeReason: versionReason,
      });
      setShowVersionModal(null);
      fetchData();
      alert('Nueva versión / adenda creada exitosamente');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al generar nueva versión del contrato');
    }
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Cargando clientes y contratos...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Clientes Extranjeros & Contratos SOW</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Registro de empresas contratantes, contactos, sucursales y contratos de exportación de servicios TI.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/admin/client-users')}
            className="btn btn-secondary"
            title="Administrar accesos y contraseñas del Portal de Clientes"
          >
            <Users size={18} /> Usuarios Portal
          </button>
          {!isViewer && (
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus size={18} /> Nuevo Cliente
            </button>
          )}
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
          Generar Contrato SOW <ArrowRight size={16} />
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
                customers.map((c) => {
                  const isExpanded = expandedCustomerId === c.id;
                  const contactsCount = c.contacts?.length || 0;
                  const entitiesCount = c.entities?.length || 0;

                  return (
                    <React.Fragment key={c.id}>
                      <tr>
                        <td>
                          <div style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{c.code}</div>
                          <div style={{ fontWeight: 600, marginTop: '2px' }}>{c.legalName}</div>
                          <div style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setExpandedCustomerId(isExpanded ? null : c.id)}
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                color: 'var(--text-secondary)',
                                fontSize: '11px',
                                padding: '2px 6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Users size={12} /> {contactsCount} contactos | {entitiesCount} sucursales
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          </div>
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
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {!isViewer && (
                              <button
                                onClick={() => openEditModal(c)}
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Editar Cliente"
                              >
                                <Edit2 size={13} /> Editar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Fila expandible de Contactos y Sucursales */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '16px 20px', borderLeft: '3px solid var(--accent-primary)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                              {/* Contactos */}
                              <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Users size={14} /> Contactos Directos ({contactsCount})
                                  </span>
                                  {!isViewer && (
                                    <button
                                      type="button"
                                      onClick={() => setShowContactModal(c.id)}
                                      className="btn btn-secondary"
                                      style={{ padding: '2px 6px', fontSize: '11px' }}
                                    >
                                      + Contacto
                                    </button>
                                  )}
                                </div>
                                {contactsCount === 0 ? (
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sin contactos adicionales registrados.</div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {c.contacts.map((ct: any) => (
                                      <div key={ct.id} style={{ fontSize: '12px', padding: '6px 8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                                        <div style={{ fontWeight: 600 }}>{ct.name} {ct.isPrimary && <span className="badge badge-success" style={{ fontSize: '9px' }}>Principal</span>}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ct.title || ct.contactType} • {ct.email} {ct.phone ? `• ${ct.phone}` : ''}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Sucursales / Entidades */}
                              <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Building2 size={14} /> Sucursales / Entidades ({entitiesCount})
                                  </span>
                                  {!isViewer && (
                                    <button
                                      type="button"
                                      onClick={() => setShowEntityModal(c.id)}
                                      className="btn btn-secondary"
                                      style={{ padding: '2px 6px', fontSize: '11px' }}
                                    >
                                      + Sucursal
                                    </button>
                                  )}
                                </div>
                                {entitiesCount === 0 ? (
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Opera con la razón social principal.</div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {c.entities.map((ent: any) => (
                                      <div key={ent.id} style={{ fontSize: '12px', padding: '6px 8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                                        <div style={{ fontWeight: 600 }}>{ent.name} {ent.isPrimary && <span className="badge badge-success" style={{ fontSize: '9px' }}>Principal</span>}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ent.taxId ? `Tax ID: ${ent.taxId}` : ''} {ent.address ? `• ${ent.address}` : ''}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
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
                <th>Código / Versión</th>
                <th>Cliente & Título</th>
                <th>Consumo & Monto</th>
                <th>Acciones</th>
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
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{ct.code}</div>
                      <span className="badge badge-info" style={{ fontSize: '10px' }}>
                        v{ct.currentVersion || 1} ({ct.versions?.length || 1} adendas)
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{ct.customer?.legalName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ct.title}</div>
                    </td>
                    <td>
                      <span className="badge badge-warning">
                        {ct.consumedHours} / {ct.contractedHours || '∞'} hrs
                      </span>
                      {ct.totalAmount && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          ${Number(ct.totalAmount).toLocaleString('en-US')} {ct.currency}
                        </div>
                      )}
                    </td>
                    <td>
                      {!isViewer && (
                        <button
                          type="button"
                          onClick={() => openVersionModal(ct)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Crear Nueva Versión / Adenda"
                        >
                          <GitCommit size={12} /> + Adenda
                        </button>
                      )}
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

              {!editingCustomer && (
                <div className="form-group" style={{ backgroundColor: 'rgba(0, 168, 150, 0.08)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--accent-primary)' }}>
                  <label className="form-label" style={{ color: 'var(--accent-primary)' }}>Sucursal Inicial / Casa Matriz *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="Ej: Casa Matriz"
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    * Se registrará automáticamente como la sucursal/entidad principal del cliente.
                  </span>
                </div>
              )}

              {editingCustomer && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={16} color="var(--accent-primary)" /> Sucursales / Filiales Registradas ({editingCustomer.entities?.length || 0})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowEntityModal(editingCustomer.id)}
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      <Plus size={13} /> + Agregar Sucursal
                    </button>
                  </div>
                  {(!editingCustomer.entities || editingCustomer.entities.length === 0) ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                      Sin sucursales registradas. Haz clic en "+ Agregar Sucursal".
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                      {editingCustomer.entities.map((ent: any) => (
                        <div key={ent.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {ent.name}
                              {ent.isPrimary && <span className="badge badge-success" style={{ fontSize: '9.5px' }}>Casa Matriz</span>}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {ent.address || 'Sin dirección específica'} {ent.taxId ? `• Tax ID: ${ent.taxId}` : ''}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntity(editingCustomer.id, ent.id, ent.name)}
                            className="btn-icon"
                            style={{ color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                            title="Eliminar sucursal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => { setShowCustomerModal(false); setEditingCustomer(null); }} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Entidad / Sucursal */}
      {showEntityModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '460px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>Agregar Sucursal / Entidad</h3>
            <form onSubmit={handleAddEntity}>
              <div className="form-group">
                <label className="form-label">Nombre de Sucursal / Razón Social Local</label>
                <input type="text" className="form-input" value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="Ej: Sede Miami Operaciones" required />
              </div>
              <div className="form-group">
                <label className="form-label">Tax ID Local (Opcional)</label>
                <input type="text" className="form-input" value={entityTaxId} onChange={(e) => setEntityTaxId(e.target.value)} placeholder="Tax ID específico" />
              </div>
              <div className="form-group">
                <label className="form-label">Dirección / Domicilio</label>
                <input type="text" className="form-input" value={entityAddress} onChange={(e) => setEntityAddress(e.target.value)} placeholder="Dirección completa" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <input type="checkbox" id="entPrimary" checked={entityIsPrimary} onChange={(e) => setEntityIsPrimary(e.target.checked)} />
                <label htmlFor="entPrimary" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Es la entidad principal de facturación</label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEntityModal(null)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Sucursal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Contacto */}
      {showContactModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '460px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>Registrar Contacto</h3>
            <form onSubmit={handleAddContact}>
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input type="text" className="form-input" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Ej: John Doe" required />
              </div>
              <div className="grid-form-2">
                <div className="form-group">
                  <label className="form-label">Cargo / Título</label>
                  <input type="text" className="form-input" value={contactTitle} onChange={(e) => setContactTitle(e.target.value)} placeholder="Ej: CTO / Director TI" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Contacto</label>
                  <select className="form-select" value={contactType} onChange={(e) => setContactType(e.target.value)}>
                    <option value="TECHNICAL">Técnico</option>
                    <option value="ADMINISTRATIVE">Administrativo</option>
                    <option value="FINANCIAL">Financiero / Pagos</option>
                    <option value="MANAGER">Gerencia / Representante</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
              </div>
              <div className="grid-form-2">
                <div className="form-group">
                  <label className="form-label">Email Oficial *</label>
                  <input type="email" className="form-input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="john@company.com" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input type="text" className="form-input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1 ..." />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <input type="checkbox" id="contPrimary" checked={contactIsPrimary} onChange={(e) => setContactIsPrimary(e.target.checked)} />
                <label htmlFor="contPrimary" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Contacto principal para notificaciones</label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowContactModal(null)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Contacto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Nueva Versión / Adenda de Contrato */}
      {showVersionModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '17px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GitCommit size={18} color="var(--accent-primary)" />
              Nueva Versión / Adenda: {showVersionModal.code}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Se registrará la versión v{(showVersionModal.currentVersion || 1) + 1} conservando el historial y trazabilidad inmutable.
            </p>
            <form onSubmit={handleCreateVersion}>
              <div className="form-group">
                <label className="form-label">Título del Contrato</label>
                <input type="text" className="form-input" value={versionTitle} onChange={(e) => setVersionTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Motivo del Cambio / Justificación de la Adenda *</label>
                <textarea
                  className="form-textarea"
                  value={versionReason}
                  onChange={(e) => setVersionReason(e.target.value)}
                  placeholder="Ej: Aumento de bolsa de horas a 80 hrs y ampliación de vigencia al Q4"
                  rows={2}
                  required
                />
              </div>
              <div className="grid-form-2">
                <div className="form-group">
                  <label className="form-label">Fecha Inicio</label>
                  <input type="date" className="form-input" value={versionStartDate} onChange={(e) => setVersionStartDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha Término (Opcional)</label>
                  <input type="date" className="form-input" value={versionEndDate} onChange={(e) => setVersionEndDate(e.target.value)} />
                </div>
              </div>
              <div className="grid-form-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Horas Totales</label>
                  <input type="number" step="0.5" className="form-input" value={versionHours} onChange={(e) => setVersionHours(e.target.value)} placeholder="Horas" />
                </div>
                <div className="form-group">
                  <label className="form-label">Monto ({showVersionModal.currency})</label>
                  <input type="number" step="0.01" className="form-input" value={versionTotalAmount} onChange={(e) => setVersionTotalAmount(e.target.value)} placeholder="Total" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tarifa/Hora</label>
                  <input type="number" step="0.01" className="form-input" value={versionRate} onChange={(e) => setVersionRate(e.target.value)} placeholder="USD/h" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowVersionModal(null)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Emitir Nueva Versión</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
