import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { CustomerLayout } from './components/layout/CustomerLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Admin / Staff Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { PlansPage } from './pages/plans/PlansPage';
import { QuotationsPage } from './pages/quotations/QuotationsPage';
import { SubscriptionsPage } from './pages/subscriptions/SubscriptionsPage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { TaxesPage } from './pages/taxes/TaxesPage';
import { DiscountsPage } from './pages/discounts/DiscountsPage';
import { HealthScorePage } from './pages/intelligence/HealthScorePage';
import { SimulatorPage } from './pages/simulator/SimulatorPage';
import { StaffManagementPage } from './pages/staff/StaffManagementPage';

// Customer Portal Pages
import { CustomerPortalOverview } from './pages/portal/CustomerPortalOverview';
import { CustomerSubscriptionsPage } from './pages/portal/CustomerSubscriptionsPage';
import { CustomerInvoicesPage } from './pages/portal/CustomerInvoicesPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; staffOnly?: boolean }> = ({ children, staffOnly }) => {
  const { isAuthenticated, isStaff, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-sans text-sm">
        Initializing SUBSIGHT...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (staffOnly && !isStaff) {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { isAuthenticated, isCustomer, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return isCustomer ? <Navigate to="/portal" replace /> : <Navigate to="/app/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin & Staff Operations */}
          <Route
            path="/app"
            element={
              <ProtectedRoute staffOnly>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="taxes" element={<TaxesPage />} />
            <Route path="discounts" element={<DiscountsPage />} />
            <Route path="intelligence" element={<HealthScorePage />} />
            <Route path="simulator" element={<SimulatorPage />} />
            <Route path="staff" element={<StaffManagementPage />} />
          </Route>

          {/* Customer Self-Service Portal */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CustomerPortalOverview />} />
            <Route path="subscriptions" element={<CustomerSubscriptionsPage />} />
            <Route path="invoices" element={<CustomerInvoicesPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
