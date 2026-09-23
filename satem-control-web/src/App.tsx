import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ControlCenterPage } from './pages/ControlCenterPage';
import { ExpedientsPage } from './pages/ExpedientsPage';
import { CustomersPage } from './pages/CustomersPage';
import { BillingPage } from './pages/BillingPage';
import { BankPage } from './pages/BankPage';
import { TemplatesPage } from './pages/admin/TemplatesPage';
import { TemplateEditorPage } from './pages/admin/TemplateEditorPage';
import { ContractWizardPage } from './pages/ContractWizardPage';
import { DocumentGeneratorPage } from './pages/DocumentGeneratorPage';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: '#fff', padding: '40px' }}>Cargando sesión...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

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
              <Route path="admin/templates" element={<TemplatesPage />} />
              <Route path="admin/templates/:id/editor" element={<TemplateEditorPage />} />
              <Route path="contracts/wizard" element={<ContractWizardPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
