import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { KPICard } from '@/components/common/KPICard';
import { KPI } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getRoleLabel } from '@/utils/roleConfig';
import { ArrowLeftRight, Clock, CheckCircle, Globe, Loader2 } from 'lucide-react';
import { statsAPI } from '@/services/api';
import { transfersAPI } from '@/services/api';

interface DashboardData {
  today: { transfers: number; totalSent: number; totalReceived: number };
  month: { transfers: number; totalSent: number; totalFees: number };
  byStatus: {
    pending: { count: number; amount: number };
    inProgress: { count: number; amount: number };
    paid: { count: number; amount: number };
    cancelled: { count: number; amount: number };
  };
}

interface TransferStatsData {
  monthly: { month: string; sent: number; paid: number }[];
}

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-emerald-100 text-emerald-800',
    in_progress: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  const labels: Record<string, string> = {
    pending: 'En attente',
    paid: 'Payé',
    in_progress: 'En cours',
    cancelled: 'Annulé',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
};

const formatAmount = (amount: number, currency: string = 'USD') => {
  if (currency === 'XOF') return `${Math.round(amount).toLocaleString('fr-FR')} XOF`;
  return `$${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [transferStats, setTransferStats] = useState<TransferStatsData | null>(null);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const [dashboardRes, transferStatsRes, transfersRes] = await Promise.all([
          statsAPI.getDashboard(),
          statsAPI.getTransfers(),
          transfersAPI.getAll({ limit: 5 }),
        ]);
        setDashboard(dashboardRes);
        setTransferStats(transferStatsRes);
        setRecentTransfers(transfersRes?.data || []);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des indicateurs');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-gray-600">Chargement des indicateurs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
        <p className="text-red-700">{error}</p>
        <p className="text-sm text-gray-600 mt-2">Vérifiez que le backend est démarré.</p>
      </div>
    );
  }

  const byStatus = dashboard?.byStatus || {
    pending: { count: 0, amount: 0 },
    inProgress: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
    cancelled: { count: 0, amount: 0 },
  };
  const totalTransfers = byStatus.pending.count + byStatus.inProgress.count + byStatus.paid.count + byStatus.cancelled.count;
  const successRate = totalTransfers > 0 ? ((byStatus.paid.count / totalTransfers) * 100).toFixed(1) : '0';

  const kpis: KPI[] = [
    { label: 'Total transferts', value: dashboard?.month?.transfers ?? 0, icon: 'ArrowLeftRight' },
    { label: 'Volume ce mois', value: formatAmount(dashboard?.month?.totalSent ?? 0), icon: 'DollarSign' },
    { label: 'En attente', value: byStatus.pending.count, icon: 'Clock' },
    { label: 'Payés', value: byStatus.paid.count, icon: 'CheckCircle' },
    { label: 'Taux de réussite', value: `${successRate}%`, icon: 'TrendingUp' },
    { label: 'Frais ce mois', value: formatAmount(dashboard?.month?.totalFees ?? 0), icon: 'DollarSign' },
  ];

  const statusData = [
    { name: 'Payés', value: byStatus.paid.count, color: '#10b981' },
    { name: 'En attente', value: byStatus.pending.count, color: '#f59e0b' },
    { name: 'En cours', value: byStatus.inProgress.count, color: '#3b82f6' },
    { name: 'Annulés', value: byStatus.cancelled.count, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const chartData = transferStats?.monthly?.map((m) => ({
    month: m.month,
    envoyés: m.sent,
    payés: m.paid,
  })) || [];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <Globe className="w-6 h-6 sm:w-8 sm:h-8" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">GLOBAL EXCHANGE</h1>
            </div>
            <p className="text-emerald-100 text-sm sm:text-base lg:text-lg">
              Bienvenue, {user.name} — {getRoleLabel(user.role)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/30">
              <p className="text-xs sm:text-sm opacity-90">Transferts aujourd&apos;hui</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">{dashboard?.today?.transfers ?? 0}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/30">
              <p className="text-xs sm:text-sm opacity-90">Volume aujourd&apos;hui</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                {dashboard?.today?.totalSent != null ? formatAmount(dashboard.today.totalSent) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {kpis.map((kpi, idx) => (
          <KPICard key={idx} kpi={kpi} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 flex-shrink-0" />
              <span className="truncate">Transferts (6 mois)</span>
            </h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500" />
              <span className="text-gray-600">Envoyés</span>
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500 ml-2 sm:ml-3" />
              <span className="text-gray-600">Payés</span>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={35} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="envoyés" stroke="#10b981" strokeWidth={2} dot={{ stroke: '#10b981', strokeWidth: 2, r: 3, fill: 'white' }} name="Envoyés" />
                <Line type="monotone" dataKey="payés" stroke="#3b82f6" strokeWidth={2} dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 3, fill: 'white' }} name="Payés" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">Aucune donnée sur la période</div>
          )}
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 flex-shrink-0" />
              <span>Statut</span>
            </h2>
            <div className="bg-emerald-100 text-emerald-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
              Total: {statusData.reduce((sum, item) => sum + item.value, 0)}
            </div>
          </div>
          {statusData.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={5} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">Aucun transfert</div>
          )}
        </div>
      </div>

      {/* Transferts récents */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
          <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 flex-shrink-0" />
          Transferts récents
        </h2>
        <div className="space-y-3 sm:space-y-4">
          {recentTransfers.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">Aucun transfert récent</p>
          ) : (
            recentTransfers.map((t: any) => (
              <div
                key={t.id}
                className="flex items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation cursor-pointer"
                onClick={() => navigate(`/transfers/${t.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <span className="font-mono text-xs sm:text-sm text-emerald-600 font-semibold">{t.reference}</span>
                    {getStatusBadge(t.status)}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                    {t.sender?.firstName} {t.sender?.lastName} → {t.beneficiary?.firstName} {t.beneficiary?.lastName}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400">
                    {t.createdAt ? new Date(t.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">
                    {t.amountSent != null ? `${t.amountSent.toLocaleString('fr-FR')} ${t.currencySent || 'USD'}` : '—'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate('/transfers')}
          className="w-full mt-3 sm:mt-4 py-2.5 sm:py-2 text-emerald-600 font-medium hover:bg-emerald-50 active:bg-emerald-100 rounded-lg transition-colors touch-manipulation text-sm sm:text-base"
        >
          Voir tous les transferts →
        </button>
      </div>

      {/* Résumé mois en cours */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-emerald-100">
        <div className="flex flex-col gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Ce mois</h3>
            <p className="text-gray-600 text-sm mt-1">Transferts et volume</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="text-center bg-white/50 rounded-lg sm:rounded-xl p-3">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600">{dashboard?.month?.transfers ?? 0}</p>
              <p className="text-xs sm:text-sm text-gray-600">Transferts</p>
            </div>
            <div className="text-center bg-white/50 rounded-lg sm:rounded-xl p-3">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{formatAmount(dashboard?.month?.totalSent ?? 0)}</p>
              <p className="text-xs sm:text-sm text-gray-600">Volume</p>
            </div>
            <div className="text-center bg-white/50 rounded-lg sm:rounded-xl p-3">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-600">{byStatus.pending.count}</p>
              <p className="text-xs sm:text-sm text-gray-600">En attente</p>
            </div>
            <div className="text-center bg-white/50 rounded-lg sm:rounded-xl p-3">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{formatAmount(dashboard?.month?.totalFees ?? 0)}</p>
              <p className="text-xs sm:text-sm text-gray-600">Frais</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
