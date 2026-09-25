import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  FileSpreadsheet,
  Landmark,
  ShieldAlert,
  LogOut,
  User,
  Users,
  FileCode,
  ChevronRight,
  FilePlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROUTE_LABELS: Record<string, string> = {
  '/':                   'Dashboard',
  '/control-center':    'Centro de Control',
  '/expedients':        'Expedientes',
  '/customers':         'Clientes & Contratos',
  '/contracts/wizard':  'Wizard SOW',
  '/documents/generator':'Generador de Documentos',
  '/billing':           'Facturación & SumUp',
  '/bank':              'Conciliación Bancaria',
  '/admin/templates':   'Plantillas Documentales',
  '/admin/users':       'Gestión de Usuarios',
};

const BreadcrumbHeader: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const currentLabel = ROUTE_LABELS[location.pathname] || location.pathname;

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
        <span style={{ color: 'var(--text-muted)' }}>SATEM Control</span>
        <ChevronRight size={14} color="var(--text-muted)" />
        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{currentLabel}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</span>
        <span className="badge badge-info">{user?.role}</span>
      </div>
    </header>
  );
};

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <img src="/assets/logo-icon.png" alt="SATEM Icon" style={{ height: '28px', filter: 'brightness(0) invert(1)' }} />
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>SATEM Control</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Soluciones Inteligentes SpA — Operaciones</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>

          <NavLink
            to="/control-center"
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <ShieldAlert size={18} /> Centro de Control
          </NavLink>

          <NavLink
            to="/expedients"
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <FolderKanban size={18} /> Expedientes
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <Building2 size={18} /> Clientes & Contratos
          </NavLink>

          <NavLink
            to="/documents/generator"
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <FilePlus size={18} /> Generar Documento / Propuesta
          </NavLink>

          <NavLink
            to="/billing"
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <FileSpreadsheet size={18} /> Facturación & SumUp
          </NavLink>

          <NavLink
            to="/bank"
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <Landmark size={18} /> Conciliación Bancaria
          </NavLink>

          {(user?.role === 'ADMIN' || user?.role === 'OPERATIONS') && (
            <>
              <div style={{ margin: '8px 0', borderTop: '1px dashed var(--border-color)' }} />
              <NavLink
                to="/admin/templates"
                className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start' }}
              >
                <FileCode size={18} /> Plantillas Documentales
              </NavLink>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start' }}
            >
              <Users size={18} /> Gestión de Usuarios
            </NavLink>
          )}
        </nav>

        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{user?.fullName}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <BreadcrumbHeader />


        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
