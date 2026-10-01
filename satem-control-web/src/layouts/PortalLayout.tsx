import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FolderKanban,
  FileCheck2,
  User,
  LogOut,
  Building2,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { usePortalAuth } from '../context/PortalAuthContext';

const PORTAL_ROUTE_LABELS: Record<string, string> = {
  '/portal':              'Mis Expedientes',
  '/portal/expedients':   'Mis Expedientes',
  '/portal/signatures':   'Documentos por Firmar',
  '/portal/profile':      'Mi Cuenta y Seguridad',
};

export const PortalLayout: React.FC = () => {
  const { clientUser, logout } = usePortalAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/portal/login');
  };

  const closeSidebar = () => setMobileSidebarOpen(false);

  const currentLabel = PORTAL_ROUTE_LABELS[location.pathname] || 'Portal Clientes';

  return (
    <div className="app-container">
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileSidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <img src="/assets/logo-icon.png" alt="SATEM Icon" style={{ height: '28px', filter: 'brightness(0) invert(1)' }} />
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>
                SATEM Portal
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Portal de Clientes y Trazabilidad</span>
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

        {/* Customer Badge Box */}
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Building2 size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Empresa Cliente
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {clientUser?.customerName || 'Cliente SATEM'}
          </div>
          {clientUser?.customerTaxId && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RUT: {clientUser.customerTaxId}</div>
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <NavLink
            to="/portal/expedients"
            onClick={closeSidebar}
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <FolderKanban size={18} /> Mis Expedientes
          </NavLink>

          <NavLink
            to="/portal/signatures"
            onClick={closeSidebar}
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <FileCheck2 size={18} /> Firmar Documentos
          </NavLink>

          <NavLink
            to="/portal/profile"
            onClick={closeSidebar}
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <User size={18} /> Mi Perfil & Seguridad
          </NavLink>
        </nav>

        {/* User profile footer */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 168, 150, 0.15)',
                border: '1px solid var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User size={18} color="var(--accent-primary)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {clientUser?.fullName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {clientUser?.email}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="mobile-menu-toggle"
              aria-label={mobileSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', minWidth: 0 }}>
              <span style={{ color: 'var(--text-muted)' }} className="header-user-email">Portal</span>
              <ChevronRight size={13} color="var(--text-muted)" className="header-user-email" />
              <span style={{ color: 'var(--accent-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentLabel}
              </span>
            </div>
          </div>
          <div className="header-right">
            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> Acceso Seguro Cliente
            </span>
          </div>
        </header>

        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
