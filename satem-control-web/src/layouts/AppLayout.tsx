import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FileSignature,
  FolderKanban,
  FileSpreadsheet,
  Landmark,
  ShieldAlert,
  LogOut,
  User,
  Calculator,
  FileCode,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
            to="/contracts/wizard"
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <FileSignature size={18} /> Generar Contrato SOW
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <Building2 size={18} /> Clientes & Contratos
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

          <div style={{ margin: '8px 0', borderTop: '1px dashed var(--border-color)' }} />

          <NavLink
            to="/admin/templates"
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <FileCode size={18} /> Plantillas Documentales
          </NavLink>
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
        <header className="header">
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            SATEM Soluciones Inteligentes SpA — Trazabilidad & Auditoría
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge-info">{user?.role}</span>
          </div>
        </header>

        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
