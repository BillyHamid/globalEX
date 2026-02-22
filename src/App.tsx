import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Login } from '@/pages/Login';

const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Users = lazy(() => import('@/pages/Users').then(m => ({ default: m.Users })));
const Roles = lazy(() => import('@/pages/Roles').then(m => ({ default: m.Roles })));
const Clients = lazy(() => import('@/pages/Clients').then(m => ({ default: m.Clients })));
const Shipments = lazy(() => import('@/pages/Shipments').then(m => ({ default: m.Shipments })));
const CashManagement = lazy(() => import('@/pages/CashManagement').then(m => ({ default: m.CashManagement })));
const Invoicing = lazy(() => import('@/pages/Invoicing').then(m => ({ default: m.Invoicing })));
const Reports = lazy(() => import('@/pages/Reports').then(m => ({ default: m.Reports })));
const EmailAlerts = lazy(() => import('@/pages/EmailAlerts').then(m => ({ default: m.EmailAlerts })));
const Transfers = lazy(() => import('@/pages/transfers/Transfers').then(m => ({ default: m.Transfers })));
const NewTransfer = lazy(() => import('@/pages/transfers/NewTransfer').then(m => ({ default: m.NewTransfer })));
const TransferDetail = lazy(() => import('@/pages/transfers/TransferDetail').then(m => ({ default: m.TransferDetail })));
const TransactionJournal = lazy(() => import('@/pages/transactions/TransactionJournal').then(m => ({ default: m.TransactionJournal })));
const CountryStats = lazy(() => import('@/pages/transactions/CountryStats').then(m => ({ default: m.CountryStats })));
const CashDashboard = lazy(() => import('@/pages/cash/CashDashboard').then(m => ({ default: m.CashDashboard })));
const AccountingDashboard = lazy(() => import('@/pages/accounting/AccountingDashboard').then(m => ({ default: m.AccountingDashboard })));
const TransitDashboard = lazy(() => import('@/pages/transit/TransitDashboard').then(m => ({ default: m.TransitDashboard })));
const TransitAgentDashboard = lazy(() => import('@/pages/transit/TransitAgentDashboard').then(m => ({ default: m.TransitAgentDashboard })));
const LogisticsDashboard = lazy(() => import('@/pages/logistics/LogisticsDashboard').then(m => ({ default: m.LogisticsDashboard })));
const LogisticsManagerDashboard = lazy(() => import('@/pages/logistics/LogisticsManagerDashboard').then(m => ({ default: m.LogisticsManagerDashboard })));

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function PageFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
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
        <Route path="transfers/pending" element={<Navigate to="/transfers?status=pending" replace />} />
        <Route path="transfers/:id" element={<TransferDetail />} />
        <Route path="transactions/journal" element={<TransactionJournal />} />
        <Route path="transactions/by-country" element={<CountryStats />} />
        
        {/* Cash Management */}
        <Route path="cash" element={<CashDashboard />} />
        
        {/* Users & Settings */}
        <Route path="users" element={<Users />} />
        <Route path="agents" element={<Users />} />
        <Route path="roles" element={<Roles />} />
        
        {/* Legacy routes */}
        <Route path="clients" element={<Clients />} />
        <Route path="beneficiaries" element={<Clients />} />
        <Route path="senders" element={<Clients />} />
        <Route path="shipments" element={<Shipments />} />
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
    </Suspense>
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
