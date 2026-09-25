import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  Briefcase,
  Calculator,
  Wrench,
  Clock,
} from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'OPERATIONS' | 'ACCOUNTING' | 'TECHNICIAN' | 'VIEWER';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

const ROLE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; color: string; bg: string; icon: React.ReactNode; description: string }
> = {
  ADMIN: {
    label: 'Administrador',
    badgeClass: 'badge-danger',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    icon: <Shield size={14} />,
    description: 'Acceso total y configuración del sistema, plantillas y usuarios.',
  },
  OPERATIONS: {
    label: 'Operaciones',
    badgeClass: 'badge-info',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    icon: <Briefcase size={14} />,
    description: 'Gestión completa de proyectos, expedientes, clientes y contratos.',
  },
  ACCOUNTING: {
    label: 'Finanzas & Facturación',
    badgeClass: 'badge-warning',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    icon: <Calculator size={14} />,
    description: 'Cobros SumUp, conciliación bancaria Santander y estado financiero.',
  },
  TECHNICIAN: {
    label: 'Técnico / Operativo',
    badgeClass: 'badge-success',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    icon: <Wrench size={14} />,
    description: 'Visualización y actualización técnica de expedientes asignados.',
  },
  VIEWER: {
    label: 'Solo Lectura',
    badgeClass: 'badge-secondary',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    icon: <Eye size={14} />,
    description: 'Consulta y auditoría de información sin permisos de edición.',
  },
};

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form State: Crear Usuario
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'OPERATIONS' | 'ACCOUNTING' | 'TECHNICIAN' | 'VIEWER'>('OPERATIONS');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPasswordText, setShowNewPasswordText] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState('');

  // Form State: Editar Usuario
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'OPERATIONS' | 'ACCOUNTING' | 'TECHNICIAN' | 'VIEWER'>('OPERATIONS');
  const [editIsActive, setEditIsActive] = useState(true);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Form State: Cambiar Contraseña
  const [pwdPassword, setPwdPassword] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [showPwdText, setShowPwdText] = useState(false);
  const [submittingPwd, setSubmittingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');

  // Form State: Eliminar
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Feedback general
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Métricas
  const activeAdminsCount = useMemo(() => {
    return users.filter((u) => u.role === 'ADMIN' && u.isActive).length;
  }, [users]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const inactive = total - active;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    const opsAndFinance = users.filter((u) => u.role === 'OPERATIONS' || u.role === 'ACCOUNTING').length;
    return { total, active, inactive, admins, opsAndFinance };
  }, [users]);

  // Filtrado
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.isActive) ||
        (statusFilter === 'INACTIVE' && !u.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Helper Generar Contraseña Segura
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Abrir Modal Crear
  const handleOpenCreate = () => {
    setNewFullName('');
    setNewEmail('');
    setNewRole('OPERATIONS');
    setNewPassword(generateRandomPassword());
    setShowNewPasswordText(true);
    setCreateError('');
    setShowCreateModal(true);
  };

  // Abrir Modal Editar
  const handleOpenEdit = (target: UserItem) => {
    setSelectedUser(target);
    setEditFullName(target.fullName);
    setEditRole(target.role);
    setEditIsActive(target.isActive);
    setEditError('');
    setShowEditModal(true);
  };

  // Abrir Modal Contraseña (incluyendo para el propio admin)
  const handleOpenPassword = (target: UserItem) => {
    setSelectedUser(target);
    setPwdPassword('');
    setPwdConfirm('');
    setShowPwdText(false);
    setPwdError('');
    setShowPasswordModal(true);
  };

  // Abrir Modal Eliminar
  const handleOpenDelete = (target: UserItem) => {
    setSelectedUser(target);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  // Toggle Rápido de Estado (Activar/Desactivar)
  const handleQuickToggleActive = async (target: UserItem) => {
    if (target.role === 'ADMIN' && target.isActive && activeAdminsCount <= 1) {
      showToast('No es posible deshabilitar al único Administrador activo del sistema.', 'error');
      return;
    }

    try {
      await api.put(`/users/${target.id}`, { isActive: !target.isActive });
      showToast(`Usuario ${!target.isActive ? 'activado' : 'deshabilitado'} correctamente`);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error al cambiar estado del usuario', 'error');
    }
  };

  // Enviar Creación de Usuario
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!newFullName.trim() || !newEmail.trim() || !newPassword) {
      setCreateError('Todos los campos son obligatorios');
      return;
    }
    if (newPassword.length < 8) {
      setCreateError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setSubmittingCreate(true);
    try {
      await api.post('/users', {
        fullName: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        password: newPassword,
      });
      setShowCreateModal(false);
      showToast('Usuario creado con éxito');
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.response?.data?.error?.message || 'Error al crear usuario');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Enviar Edición de Usuario
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError('');

    // Verificación frontend de salvaguarda de último admin
    if (selectedUser.role === 'ADMIN' && activeAdminsCount <= 1) {
      if (editRole !== 'ADMIN') {
        setEditError('No puedes cambiar el rol del único Administrador activo. Asigna otro Administrador primero.');
        return;
      }
      if (!editIsActive) {
        setEditError('No puedes deshabilitar al único Administrador activo del sistema.');
        return;
      }
    }

    setSubmittingEdit(true);
    try {
      await api.put(`/users/${selectedUser.id}`, {
        fullName: editFullName.trim(),
        role: editRole,
        isActive: editIsActive,
      });
      setShowEditModal(false);
      showToast('Usuario actualizado exitosamente');
      fetchUsers();
    } catch (err: any) {
      setEditError(err.response?.data?.error?.message || 'Error al actualizar usuario');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Enviar Cambio de Contraseña
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setPwdError('');

    if (!pwdPassword) {
      setPwdError('Por favor ingresa una nueva contraseña');
      return;
    }
    if (pwdPassword.length < 8) {
      setPwdError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (pwdPassword !== pwdConfirm) {
      setPwdError('Las contraseñas no coinciden');
      return;
    }

    setSubmittingPwd(true);
    try {
      await api.put(`/users/${selectedUser.id}`, {
        password: pwdPassword,
      });
      const isSelf = selectedUser.id === currentUser?.id;
      showToast(isSelf ? 'Tu contraseña ha sido actualizada exitosamente' : `Contraseña de ${selectedUser.fullName} actualizada exitosamente`);
      setShowPasswordModal(false);
    } catch (err: any) {
      setPwdError(err.response?.data?.error?.message || 'Error al actualizar contraseña');
    } finally {
      setSubmittingPwd(false);
    }
  };

  // Enviar Eliminación (Soft Delete)
  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setDeleteError('');

    if (selectedUser.id === currentUser?.id) {
      setDeleteError('No puedes eliminar tu propia cuenta en sesión activa.');
      return;
    }

    if (selectedUser.role === 'ADMIN' && activeAdminsCount <= 1) {
      setDeleteError('No es posible eliminar al único Administrador del sistema.');
      return;
    }

    setSubmittingDelete(true);
    try {
      await api.delete(`/users/${selectedUser.id}`);
      setShowDeleteModal(false);
      showToast('Usuario eliminado correctamente');
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.response?.data?.error?.message || 'Error al eliminar usuario');
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toastMessage.type === 'success' ? '#065f46' : '#991b1b',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 500,
            border: `1px solid ${toastMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
          }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="var(--accent-primary)" /> Gestión & Administración de Usuarios
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Administra roles, accesos, seguridad de credenciales y salvaguardas de permisos del sistema.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchUsers} className="btn btn-secondary" title="Actualizar lista">
            <RefreshCw size={16} />
          </button>
          <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Usuarios
            </span>
            <Users size={20} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>{stats.total}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {stats.active} activos · {stats.inactive} inactivos
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Administradores
            </span>
            <Shield size={20} color="#ef4444" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px', color: '#ef4444' }}>
            {stats.admins}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {activeAdminsCount} administrador(es) activo(s)
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Operaciones & Finanzas
            </span>
            <Briefcase size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px', color: '#3b82f6' }}>
            {stats.opsAndFinance}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Gestión de proyectos y cobranza
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Estado del Sistema
            </span>
            <UserCheck size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} /> Salvaguardas Activas
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Mínimo 1 Admin garantizado
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div
        className="card"
        style={{
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            className="input-field"
            style={{ paddingLeft: '36px', width: '100%' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="input-field"
            style={{ width: 'auto', minWidth: '160px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">Todos los Roles</option>
            <option value="ADMIN">Administrador</option>
            <option value="OPERATIONS">Operaciones</option>
            <option value="ACCOUNTING">Finanzas & Cobranza</option>
            <option value="TECHNICIAN">Técnico / Campo</option>
            <option value="VIEWER">Solo Lectura</option>
          </select>

          <select
            className="input-field"
            style={{ width: 'auto', minWidth: '140px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Solo Activos</option>
            <option value="INACTIVE">Solo Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '14px 16px', fontWeight: 600 }}>USUARIO</th>
              <th style={{ padding: '14px 16px', fontWeight: 600 }}>ROL / PERMISOS</th>
              <th style={{ padding: '14px 16px', fontWeight: 600 }}>ESTADO</th>
              <th style={{ padding: '14px 16px', fontWeight: 600 }}>FECHA REGISTRO</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                  <div>Cargando lista de usuarios...</div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Users size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div>No se encontraron usuarios con los criterios de búsqueda.</div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isSoleActiveAdmin = u.role === 'ADMIN' && u.isActive && activeAdminsCount <= 1;
                const roleMeta = ROLE_CONFIG[u.role] || ROLE_CONFIG.VIEWER;

                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: isSelf ? 'rgba(0, 168, 150, 0.04)' : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Columna Usuario */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            backgroundColor: roleMeta.bg,
                            color: roleMeta.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '14px',
                            border: `1px solid ${roleMeta.color}40`,
                          }}
                        >
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {u.fullName}
                            {isSelf && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--accent-glow)',
                                  color: 'var(--accent-primary)',
                                  fontWeight: 700,
                                }}
                              >
                                Tú (Sesión Activa)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Columna Rol */}
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: roleMeta.bg,
                          color: roleMeta.color,
                          fontWeight: 600,
                          fontSize: '12px',
                          border: `1px solid ${roleMeta.color}30`,
                        }}
                      >
                        {roleMeta.icon}
                        {roleMeta.label}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '240px' }}>
                        {roleMeta.description}
                      </div>
                    </td>

                    {/* Columna Estado */}
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleQuickToggleActive(u)}
                        disabled={isSoleActiveAdmin}
                        title={
                          isSoleActiveAdmin
                            ? 'No es posible deshabilitar al único administrador activo'
                            : u.isActive
                            ? 'Clic para deshabilitar usuario'
                            : 'Clic para habilitar usuario'
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: isSoleActiveAdmin ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          borderRadius: '20px',
                          backgroundColor: u.isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: u.isActive ? '#10b981' : '#ef4444',
                          fontSize: '12px',
                          fontWeight: 600,
                          opacity: isSoleActiveAdmin ? 0.8 : 1,
                        }}
                      >
                        {u.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>

                    {/* Columna Registro */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} color="var(--text-muted)" />
                        {new Date(u.createdAt).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    {/* Columna Acciones */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* Botón Cambiar Contraseña (disponible tanto para self como para otros) */}
                        <button
                          onClick={() => handleOpenPassword(u)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px', gap: '4px' }}
                          title={isSelf ? 'Cambiar mi propia contraseña' : `Cambiar contraseña de ${u.fullName}`}
                        >
                          <KeyRound size={14} color="var(--accent-primary)" />
                          <span>Clave</span>
                        </button>

                        {/* Botón Editar */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px', gap: '4px' }}
                          title="Editar nombre, rol o estado"
                        >
                          <Edit2 size={14} />
                          <span>Editar</span>
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          onClick={() => handleOpenDelete(u)}
                          disabled={isSelf || isSoleActiveAdmin}
                          className="btn btn-secondary"
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            color: isSelf || isSoleActiveAdmin ? 'var(--text-muted)' : '#ef4444',
                            cursor: isSelf || isSoleActiveAdmin ? 'not-allowed' : 'pointer',
                            opacity: isSelf || isSoleActiveAdmin ? 0.4 : 1,
                          }}
                          title={
                            isSelf
                              ? 'No puedes eliminar tu propia cuenta en sesión activa'
                              : isSoleActiveAdmin
                              ? 'No puedes eliminar al único administrador'
                              : 'Eliminar usuario'
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREAR USUARIO                                                   */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--accent-primary)" /> Crear Nuevo Usuario
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            {createError && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} /> {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Marcelo Morales"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Correo Electrónico (Login)
                </label>
                <input
                  type="email"
                  required
                  placeholder="usuario@satemsoluciones.com"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Rol en la Plataforma
                </label>
                <select
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                >
                  <option value="ADMIN">ADMINISTRADOR — Control Total y Usuarios</option>
                  <option value="OPERATIONS">OPERACIONES — Gestión de Proyectos, Expedientes y SOW</option>
                  <option value="ACCOUNTING">FINANZAS & FACTURACIÓN — SumUp, Santander y Cobros</option>
                  <option value="TECHNICIAN">TÉCNICO — Operativo y Actualización de Expedientes</option>
                  <option value="VIEWER">SOLO LECTURA — Consulta y Auditoría</option>
                </select>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {ROLE_CONFIG[newRole]?.description}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Contraseña Inicial (mín. 8 caracteres)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateRandomPassword())}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                    }}
                  >
                    <Sparkles size={12} /> Generar Clave Segura
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPasswordText ? 'text' : 'password'}
                    required
                    minLength={8}
                    className="input-field"
                    style={{ width: '100%', paddingRight: '40px', fontFamily: showNewPasswordText ? 'monospace' : 'inherit' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasswordText(!showNewPasswordText)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showNewPasswordText ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={submittingCreate} className="btn btn-primary">
                  {submittingCreate ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDITAR USUARIO                                                  */}
      {/* ========================================================================= */}
      {showEditModal && selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="var(--accent-primary)" /> Modificar Usuario
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            {editError && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} /> {editError}
              </div>
            )}

            {/* Banner Informativo si es el único Administrador */}
            {selectedUser.role === 'ADMIN' && activeAdminsCount <= 1 && (
              <div
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#f59e0b',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <Shield size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Salvaguarda Activa:</strong> Este es el único Administrador activo del sistema. No se puede quitar su rol de Administrador ni deshabilitarlo hasta que exista otro Administrador activo.
                </span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Correo Electrónico (No modificable)
                </label>
                <input
                  type="email"
                  disabled
                  className="input-field"
                  style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }}
                  value={selectedUser.email}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Rol de Usuario
                </label>
                <select
                  className="input-field"
                  style={{ width: '100%' }}
                  value={editRole}
                  disabled={selectedUser.role === 'ADMIN' && activeAdminsCount <= 1}
                  onChange={(e) => setEditRole(e.target.value as any)}
                >
                  <option value="ADMIN">ADMINISTRADOR — Control Total</option>
                  <option value="OPERATIONS">OPERACIONES — Gestión y SOW</option>
                  <option value="ACCOUNTING">FINANZAS & FACTURACIÓN — SumUp y Banco</option>
                  <option value="TECHNICIAN">TÉCNICO — Operativo y Campo</option>
                  <option value="VIEWER">SOLO LECTURA — Consulta</option>
                </select>
              </div>

              <div style={{ marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    disabled={selectedUser.role === 'ADMIN' && activeAdminsCount <= 1}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                  />
                  <span style={{ fontWeight: 500 }}>Cuenta Habilitada / Activa</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={submittingEdit} className="btn btn-primary">
                  {submittingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CAMBIAR CONTRASEÑA                                              */}
      {/* ========================================================================= */}
      {showPasswordModal && selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} color="var(--accent-primary)" />
                {selectedUser.id === currentUser?.id ? 'Cambiar Mi Contraseña' : 'Restablecer Contraseña'}
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Actualizando credenciales para <strong>{selectedUser.fullName}</strong> ({selectedUser.email}).
            </p>

            {pwdError && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} /> {pwdError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Nueva Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const gen = generateRandomPassword();
                      setPwdPassword(gen);
                      setPwdConfirm(gen);
                      setShowPwdText(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                    }}
                  >
                    <Sparkles size={12} /> Generar Clave Segura
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwdText ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    className="input-field"
                    style={{ width: '100%', paddingRight: '40px', fontFamily: showPwdText ? 'monospace' : 'inherit' }}
                    value={pwdPassword}
                    onChange={(e) => setPwdPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwdText(!showPwdText)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showPwdText ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Confirmar Contraseña
                </label>
                <input
                  type={showPwdText ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Repita la nueva contraseña"
                  className="input-field"
                  style={{ width: '100%', fontFamily: showPwdText ? 'monospace' : 'inherit' }}
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={submittingPwd} className="btn btn-primary">
                  {submittingPwd ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIRMAR ELIMINACIÓN                                           */}
      {/* ========================================================================= */}
      {showDeleteModal && selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#ef4444' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={22} />
              </div>
              <h3 style={{ fontSize: '18px', color: '#ef4444' }}>Eliminar Usuario</h3>
            </div>

            {deleteError && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} /> {deleteError}
              </div>
            )}

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              ¿Estás seguro de que deseas eliminar permanentemente el acceso para{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{selectedUser.fullName}</strong> ({selectedUser.email})?
              Esta acción revocará de inmediato todas sus sesiones y credenciales de acceso.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">
                Cancelar
              </button>
              <button
                type="button"
                disabled={submittingDelete}
                onClick={handleDeleteSubmit}
                className="btn btn-primary"
                style={{ backgroundColor: '#ef4444', borderColor: '#dc2626' }}
              >
                {submittingDelete ? 'Eliminando...' : 'Sí, Eliminar Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
