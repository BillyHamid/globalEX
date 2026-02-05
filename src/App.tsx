import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Users } from '@/pages/Users';
import { Roles } from '@/pages/Roles';
import { Clients } from '@/pages/Clients';
import { Shipments } from '@/pages/Shipments';
import { CashManagement } from '@/pages/CashManagement';
import { Invoicing } from '@/pages/Invoicing';
import { Reports } from '@/pages/Reports';
import { EmailAlerts } from '@/pages/EmailAlerts';
// Transfers - GLOBAL EXCHANGE
import { Transfers } from '@/pages/transfers/Transfers';
import { NewTransfer } from '@/pages/transfers/NewTransfer';
// Accounting
import { AccountingDashboard } from '@/pages/accounting/AccountingDashboard';
// Transit
import { TransitDashboard } from '@/pages/transit/TransitDashboard';
import { TransitAgentDashboard } from '@/pages/transit/TransitAgentDashboard';
// Logistics
import { LogisticsDashboard } from '@/pages/logistics/LogisticsDashboard';
import { LogisticsManagerDashboard } from '@/pages/logistics/LogisticsManagerDashboard';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* GLOBAL EXCHANGE - Transfers */}
        <Route path="transfers" element={<Transfers />} />
        <Route path="transfers/new" element={<NewTransfer />} />
        <Route path="transfers/pending" element={<Transfers />} />
        
        {/* Users & Settings */}
        <Route path="users" element={<Users />} />
        <Route path="agents" element={<Users />} />
        <Route path="roles" element={<Roles />} />
        
        {/* Legacy routes */}
        <Route path="clients" element={<Clients />} />
        <Route path="beneficiaries" element={<Clients />} />
        <Route path="senders" element={<Clients />} />
        <Route path="shipments" element={<Shipments />} />
        <Route path="cash" element={<CashManagement />} />
        <Route path="transactions" element={<CashManagement />} />
        <Route path="invoicing" element={<Invoicing />} />
        <Route path="reports" element={<Reports />} />
        <Route path="statistics" element={<Reports />} />
        <Route path="alerts" element={<EmailAlerts />} />
        <Route path="notifications" element={<EmailAlerts />} />
        
        {/* Accounting Routes */}
        <Route path="accounting" element={<AccountingDashboard />} />
        
        {/* Transit Routes */}
        <Route path="transit" element={<TransitDashboard />} />
        <Route path="transit-agent" element={<TransitAgentDashboard />} />
        
        {/* Logistics Routes */}
        <Route path="logistics" element={<LogisticsDashboard />} />
        <Route path="logistics-manager" element={<LogisticsManagerDashboard />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
