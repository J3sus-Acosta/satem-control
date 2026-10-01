import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortalAuthProvider, usePortalAuth } from './context/PortalAuthContext';
import { AppLayout } from './layouts/AppLayout';
import { PortalLayout } from './layouts/PortalLayout';

// Internal Admin / Operations Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ControlCenterPage } from './pages/ControlCenterPage';
import { ExpedientsPage } from './pages/ExpedientsPage';
import { CustomersPage } from './pages/CustomersPage';
import { BillingPage } from './pages/BillingPage';
import { BankPage } from './pages/BankPage';
import { TemplatesPage } from './pages/admin/TemplatesPage';
import { TemplateEditorPage } from './pages/admin/TemplateEditorPage';
import { UsersPage } from './pages/admin/UsersPage';
import { ClientUsersPage } from './pages/admin/ClientUsersPage';
import { ContractWizardPage } from './pages/ContractWizardPage';
import { DocumentGeneratorPage } from './pages/DocumentGeneratorPage';

// Portal Client Pages
import { PortalLoginPage } from './pages/portal/PortalLoginPage';
import { PortalAcceptInvitePage } from './pages/portal/PortalAcceptInvitePage';
import { PortalExpedientsPage } from './pages/portal/PortalExpedientsPage';
import { PortalExpedientDetailPage } from './pages/portal/PortalExpedientDetailPage';
import { PortalSignDocumentPage } from './pages/portal/PortalSignDocumentPage';
import { PortalProfilePage } from './pages/portal/PortalProfilePage';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: '#fff', padding: '40px' }}>Cargando sesión...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const ProtectedPortalRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { clientUser, loading } = usePortalAuth();
  if (loading) return <div style={{ color: '#fff', padding: '40px' }}>Cargando portal...</div>;
  if (!clientUser) return <Navigate to="/portal/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PortalAuthProvider>
            <Routes>
              {/* Rutas Públicas de Login e Invitaciones */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/portal/login" element={<PortalLoginPage />} />
              <Route path="/portal/invite/:token" element={<PortalAcceptInvitePage />} />

              {/* Portal de Clientes */}
              <Route
                path="/portal"
                element={
                  <ProtectedPortalRoute>
                    <PortalLayout />
                  </ProtectedPortalRoute>
                }
              >
                <Route index element={<Navigate to="/portal/expedients" replace />} />
                <Route path="expedients" element={<PortalExpedientsPage />} />
                <Route path="expedients/:id" element={<PortalExpedientDetailPage />} />
                <Route path="signatures" element={<PortalSignDocumentPage />} />
                <Route path="profile" element={<PortalProfilePage />} />
              </Route>

              {/* Panel de Gestión Interna SATEM */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="control-center" element={<ControlCenterPage />} />
                <Route path="expedients" element={<ExpedientsPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="documents/generator" element={<DocumentGeneratorPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="bank" element={<BankPage />} />
                <Route
                  path="admin/templates"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'OPERATIONS']}>
                      <TemplatesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/templates/:id/editor"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'OPERATIONS']}>
                      <TemplateEditorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/client-users"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'OPERATIONS']}>
                      <ClientUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="contracts/wizard" element={<ContractWizardPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PortalAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
