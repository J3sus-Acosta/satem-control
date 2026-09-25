import React, { useState, useEffect } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROUTE_LABELS: Record<string, string> = {
  '/':                    'Dashboard',
  '/control-center':     'Centro de Control',
  '/expedients':         'Expedientes',
  '/customers':          'Clientes & Contratos',
  '/contracts/wizard':   'Wizard SOW',
  '/documents/generator': 'Generador de Documentos',
  '/billing':            'Facturación & SumUp',
  '/bank':               'Conciliación Bancaria',
  '/admin/templates':    'Plantillas Documentales',
  '/admin/users':        'Gestión de Usuarios',
};

interface BreadcrumbHeaderProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

const BreadcrumbHeader: React.FC<BreadcrumbHeaderProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  const currentLabel = ROUTE_LABELS[location.pathname] || location.pathname;

  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="mobile-menu-toggle"
          aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', minWidth: 0 }}>
          <span style={{ color: 'var(--text-muted)' }} className="header-user-email">SATEM</span>
          <ChevronRight size={13} color="var(--text-muted)" className="header-user-email" />
          <span style={{ color: 'var(--accent-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="breadcrumb-text">
            {currentLabel}
          </span>
        </div>
      </div>
      <div className="header-right">
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }} className="header-user-email">
          {user?.email}
        </span>
        <span className="badge badge-info">{user?.role}</span>
      </div>
    </header>
  );
};

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Cerrar sidebar al cambiar de ruta
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeSidebar = () => setMobileSidebarOpen(false);

  return (
    <div className="app-container">
      {/* Backdrop para móviles */}
      <div
        className={`sidebar-backdrop ${mobileSidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar Navigation Drawer */}
      <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <img src="/assets/logo-icon.png" alt="SATEM Icon" style={{ height: '28px', filter: 'brightness(0) invert(1)' }} />
              <span style={{ fontSize: '19px', fontWeight: 'bold', color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>
                SATEM Control
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Soluciones Inteligentes SpA</span>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="mobile-menu-toggle"
            style={{ display: mobileSidebarOpen ? 'inline-flex' : 'none' }}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <NavLink
            to="/"
            end
            onClick={closeSidebar}
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>

          <NavLink
            to="/control-center"
            onClick={closeSidebar}
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <ShieldAlert size={18} /> Centro de Control
          </NavLink>

          <NavLink
            to="/expedients"
            onClick={closeSidebar}
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <FolderKanban size={18} /> Expedientes
          </NavLink>

          <NavLink
            to="/customers"
            onClick={closeSidebar}
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <Building2 size={18} /> Clientes & Contratos
          </NavLink>

          <NavLink
            to="/documents/generator"
            onClick={closeSidebar}
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <FilePlus size={18} /> Generar Documento
          </NavLink>

          <NavLink
            to="/billing"
            onClick={closeSidebar}
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <FileSpreadsheet size={18} /> Facturación & SumUp
          </NavLink>

          <NavLink
            to="/bank"
            onClick={closeSidebar}
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
                onClick={closeSidebar}
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
              onClick={closeSidebar}
              className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start' }}
            >
              <Users size={18} /> Gestión de Usuarios
            </NavLink>
          )}
        </nav>

        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={20} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.fullName}
              </div>
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
        <BreadcrumbHeader
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          isMobileMenuOpen={mobileSidebarOpen}
        />

        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
