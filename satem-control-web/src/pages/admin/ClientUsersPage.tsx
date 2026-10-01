import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Users,
  UserPlus,
  UserCheck,
  Search,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  Send,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Lock,
  ExternalLink,
} from 'lucide-react';

interface CustomerOption {
  id: string;
  legalName: string;
  taxId: string;
  entities?: Array<{ id: string; name: string }>;
}

interface ClientUserItem {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  customerId: string;
  customer?: { id: string; code: string; legalName: string; taxId: string };
  isInvitePending: boolean;
  invitedAt?: string;
  lastLoginAt?: string;
  allowedEntities?: Array<{ id: string; name: string }>;
  createdAt: string;
}

export const ClientUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientUsers, setClientUsers] = useState<ClientUserItem[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ClientUserItem | null>(null);

  // Form states
  const [formEmail, setFormEmail] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formInitialPassword, setFormInitialPassword] = useState('');
  const [formSendInvite, setFormSendInvite] = useState(true);
  const [formAllowedEntityIds, setFormAllowedEntityIds] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCustomersList = async () => {
    try {
      const res = await api.get('/customers');
      const list = res.data?.data || [];
      setCustomers(list);
      return list;
    } catch (err) {
      console.error('Error fetching customers:', err);
      return [];
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Cargar clientes siempre
      const custList = await fetchCustomersList();

      // 2. Cargar usuarios cliente
      try {
        const usersRes = await api.get('/admin/client-users', {
          params: {
            search: search || undefined,
            customerId: selectedCustomerFilter || undefined,
          },
        });
        setClientUsers(usersRes.data?.data || []);
      } catch (userErr: any) {
        console.warn('Endpoint /admin/client-users pendiente de backend:', userErr);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al cargar la información.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCustomerFilter]);

  const handleOpenCreateModal = async () => {
    let currentCustomers = customers;
    if (!currentCustomers || currentCustomers.length === 0) {
      currentCustomers = await fetchCustomersList();
    }
    setFormEmail('');
    setFormFullName('');
    setFormPhone('');
    setFormCustomerId(currentCustomers.length > 0 ? currentCustomers[0].id : '');
    setFormInitialPassword('');
    setFormSendInvite(true);
    setFormAllowedEntityIds([]);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (user: ClientUserItem) => {
    setEditingUser(user);
    setFormFullName(user.fullName);
    setFormPhone(user.phone || '');
    setFormIsActive(user.isActive);
    setFormInitialPassword('');
    setFormAllowedEntityIds(user.allowedEntities?.map((e) => e.id) || []);
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.post('/admin/client-users', {
        email: formEmail,
        fullName: formFullName,
        phone: formPhone || undefined,
        customerId: formCustomerId,
        initialPassword: formInitialPassword || undefined,
        sendInviteEmail: formSendInvite,
        allowedEntityIds: formAllowedEntityIds,
      });

      setSuccessMsg('Usuario cliente creado exitosamente.');
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al crear el usuario cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    if (!editingUser) return;
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.put(`/admin/client-users/${editingUser.id}`, {
        fullName: formFullName,
        phone: formPhone || undefined,
        isActive: formIsActive,
        password: formInitialPassword || undefined,
        allowedEntityIds: formAllowedEntityIds,
      });

      setSuccessMsg('Usuario cliente actualizado correctamente.');
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al actualizar el usuario.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: ClientUserItem) => {
    if (!window.confirm(`¿Está seguro de desactivar la cuenta del usuario ${user.fullName} (${user.email})?`)) {
      return;
    }

    try {
      await api.delete(`/admin/client-users/${user.id}`);
      setSuccessMsg('Usuario cliente desactivado.');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al desactivar el usuario.');
    }
  };

  const handleResendInvite = async (user: ClientUserItem) => {
    try {
      await api.post(`/admin/client-users/${user.id}/resend-invite`);
      setSuccessMsg(`Invitación reenviada correctamente a ${user.email}.`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al reenviar la invitación.');
    }
  };

  const selectedCustomerObj = customers.find((c) => c.id === (editingUser ? editingUser.customerId : formCustomerId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub-navegación Usuarios */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => navigate('/admin/users')}
          className="btn btn-secondary"
          style={{ fontSize: '13px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Users size={16} /> Personal Interno SATEM
        </button>
        <button
          onClick={() => navigate('/admin/client-users')}
          className="btn btn-primary"
          style={{ fontSize: '13px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <UserCheck size={16} /> Usuarios Cliente (Portal)
        </button>
      </div>

      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={22} color="var(--accent-primary)" /> Gestión de Usuarios Cliente (Portal)
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Administre los accesos y credenciales para que los clientes consulten expedientes y firmen documentos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchData} className="btn btn-secondary" style={{ fontSize: '13px' }}>
            <RefreshCw size={15} /> Actualizar
          </button>
          <button onClick={handleOpenCreateModal} className="btn btn-primary" style={{ fontSize: '13px' }}>
            <UserPlus size={16} /> Crear Usuario Cliente
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMsg && (
        <div style={{ backgroundColor: 'var(--success-bg)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ backgroundColor: 'var(--danger-bg)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '16px' }}>
        <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo o empresa..."
              style={{ width: '100%', paddingLeft: '38px' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <div style={{ width: '240px' }}>
            <select
              value={selectedCustomerFilter}
              onChange={(e) => setSelectedCustomerFilter(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Todas las Empresas</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.legalName}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Filtrar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Usuario / Email</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Empresa Cliente</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Entidades Permitidas</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Estado Cuenta</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Último Acceso</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : clientUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron usuarios clientes registrados.
                  </td>
                </tr>
              ) : (
                clientUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.fullName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                      {u.phone && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.phone}</div>}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{u.customer?.legalName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RUT: {u.customer?.taxId}</div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {u.allowedEntities && u.allowedEntities.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {u.allowedEntities.map((ent) => (
                            <span key={ent.id} className="badge badge-info" style={{ fontSize: '10.5px' }}>
                              {ent.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Todas las entidades</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {u.isActive ? (
                          <span className="badge badge-success" style={{ width: 'fit-content' }}>Activo</span>
                        ) : (
                          <span className="badge badge-danger" style={{ width: 'fit-content' }}>Inactivo</span>
                        )}
                        {u.isInvitePending && (
                          <span className="badge badge-warning" style={{ width: 'fit-content', fontSize: '10px' }}>
                            Invitación Pendiente
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('es-CL') : 'Nunca'}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {u.isInvitePending && (
                          <button
                            type="button"
                            onClick={() => handleResendInvite(u)}
                            className="btn btn-secondary"
                            style={{ padding: '6px', fontSize: '11px' }}
                            title="Reenviar invitación por correo"
                          >
                            <Send size={14} color="var(--accent-primary)" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(u)}
                          className="btn btn-secondary"
                          style={{ padding: '6px' }}
                          title="Editar usuario"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="btn btn-danger"
                          style={{ padding: '6px' }}
                          title="Desactivar usuario"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <UserPlus size={20} color="var(--accent-primary)" /> Crear Usuario Cliente
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {customers.length === 0 ? (
              <div style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 600, fontSize: '14px' }}>
                  <AlertCircle size={18} /> No hay clientes registrados
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Para crear un usuario de acceso al portal, primero debe existir al menos un cliente (empresa) creado en el sistema.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/customers')}
                  className="btn btn-primary"
                  style={{ width: 'fit-content', marginTop: '4px', fontSize: '13px' }}
                >
                  <ExternalLink size={14} /> Ir a Registrar Cliente en Clientes & Contratos
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Empresa Cliente Existente *
                  </label>
                  <select
                    required
                    value={formCustomerId}
                    onChange={(e) => {
                      setFormCustomerId(e.target.value);
                      setFormAllowedEntityIds([]);
                    }}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Seleccione un Cliente Registrado ({customers.length} disponibles) --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.legalName} (RUT: {c.taxId})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    * Debe asociar el usuario a uno de los clientes registrados previamente en el sistema.
                  </span>
                </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="cliente@empresa.com"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Teléfono de Contacto (Opcional)
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Contraseña Inicial (Opcional)
                </label>
                <input
                  type="password"
                  value={formInitialPassword}
                  onChange={(e) => setFormInitialPassword(e.target.value)}
                  placeholder="Dejar vacío para que el cliente la defina al aceptar la invitación"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Entity Access checkboxes */}
              {selectedCustomerObj?.entities && selectedCustomerObj.entities.length > 0 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Restricción de Entidades / Sucursales
                  </label>
                  <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                    {selectedCustomerObj.entities.map((ent) => (
                      <label key={ent.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formAllowedEntityIds.includes(ent.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormAllowedEntityIds([...formAllowedEntityIds, ent.id]);
                            } else {
                              setFormAllowedEntityIds(formAllowedEntityIds.filter((id) => id !== ent.id));
                            }
                          }}
                        />
                        <span>{ent.name}</span>
                      </label>
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    * Si no selecciona ninguna entidad, el usuario tendrá acceso a todos los expedientes de la empresa.
                  </span>
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={formSendInvite}
                  onChange={(e) => setFormSendInvite(e.target.checked)}
                />
                <span>Enviar correo de invitación con enlace de activación inmediatamente</span>
              </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitting || !formCustomerId} className="btn btn-primary">
                    {submitting ? 'Creando...' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Edit2 size={20} color="var(--accent-primary)" /> Editar Usuario Cliente
              </h3>
              <button onClick={() => setShowEditModal(false)} className="btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  disabled
                  value={editingUser.email}
                  style={{ width: '100%', opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Nueva Contraseña (Opcional)
                </label>
                <input
                  type="password"
                  value={formInitialPassword}
                  onChange={(e) => setFormInitialPassword(e.target.value)}
                  placeholder="Dejar vacío para no modificar"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Entity Access checkboxes */}
              {selectedCustomerObj?.entities && selectedCustomerObj.entities.length > 0 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Acceso por Entidad / Sucursal
                  </label>
                  <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                    {selectedCustomerObj.entities.map((ent) => (
                      <label key={ent.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formAllowedEntityIds.includes(ent.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormAllowedEntityIds([...formAllowedEntityIds, ent.id]);
                            } else {
                              setFormAllowedEntityIds(formAllowedEntityIds.filter((id) => id !== ent.id));
                            }
                          }}
                        />
                        <span>{ent.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                />
                <span>Cuenta Activa (permite inicio de sesión en el portal)</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
