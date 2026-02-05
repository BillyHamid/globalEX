import { useAuth } from '@/contexts/AuthContext';
import { KPICard } from '@/components/common/KPICard';
import { KPI } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getRoleLabel } from '@/utils/roleConfig';
import { ArrowLeftRight, Clock, CheckCircle, Globe } from 'lucide-react';

// Mock data generators pour GLOBAL EXCHANGE
const generateKPIs = (role: string): KPI[] => {
  const baseKPIs: Record<string, KPI[]> = {
    admin: [
      { label: 'Agents actifs', value: '24', change: 8, trend: 'up', icon: 'Users' },
      { label: 'Total transferts', value: '$2,345,000', change: 15, trend: 'up', icon: 'ArrowLeftRight' },
      { label: 'Transferts ce mois', value: '1,567', change: 12, trend: 'up', icon: 'TrendingUp' },
      { label: 'En attente', value: '45', change: -5, trend: 'down', icon: 'Clock' },
      { label: 'Taux de réussite', value: '98.5%', change: 0.5, trend: 'up', icon: 'CheckCircle' },
      { label: 'Commissions', value: '$45,670', change: 18, trend: 'up', icon: 'DollarSign' },
    ],
    supervisor: [
      { label: 'Transferts actifs', value: '234', change: 8, trend: 'up', icon: 'ArrowLeftRight' },
      { label: 'Volume total', value: '$1,234,500', change: 15, trend: 'up', icon: 'DollarSign' },
      { label: 'En attente', value: '45', change: -10, trend: 'down', icon: 'Clock' },
      { label: 'Payés aujourd\'hui', value: '89', change: 12, trend: 'up', icon: 'CheckCircle' },
      { label: 'Agents en ligne', value: '18', change: 5, trend: 'up', icon: 'Users' },
      { label: 'Temps moyen', value: '2h 15min', change: -8, trend: 'down', icon: 'Clock' },
    ],
    sender_agent: [
      { label: 'Mes transferts', value: '156', change: 12, trend: 'up', icon: 'ArrowLeftRight' },
      { label: 'Volume envoyé', value: '$345,000', change: 18, trend: 'up', icon: 'DollarSign' },
      { label: 'En attente', value: '12', change: -5, trend: 'down', icon: 'Clock' },
      { label: 'Payés', value: '144', change: 15, trend: 'up', icon: 'CheckCircle' },
      { label: 'Bénéficiaires', value: '89', change: 8, trend: 'up', icon: 'Users' },
      { label: 'Ma commission', value: '$2,450', change: 20, trend: 'up', icon: 'TrendingUp' },
    ],
    payer_agent: [
      { label: 'À payer', value: '23', change: -12, trend: 'down', icon: 'Clock' },
      { label: 'Payés aujourd\'hui', value: '45', change: 25, trend: 'up', icon: 'CheckCircle' },
      { label: 'Volume payé', value: '15,500,000 FCFA', change: 18, trend: 'up', icon: 'DollarSign' },
      { label: 'Bénéficiaires servis', value: '42', change: 15, trend: 'up', icon: 'Users' },
      { label: 'Ma commission', value: '385,000 FCFA', change: 22, trend: 'up', icon: 'TrendingUp' },
      { label: 'Temps moyen', value: '8 min', change: -15, trend: 'down', icon: 'Clock' },
    ],
  };

  return baseKPIs[role] || baseKPIs['admin'];
};

const transfersData = [
  { month: 'Jan', envoyés: 125, payés: 120 },
  { month: 'Fév', envoyés: 145, payés: 140 },
  { month: 'Mar', envoyés: 168, payés: 165 },
  { month: 'Avr', envoyés: 189, payés: 185 },
  { month: 'Mai', envoyés: 210, payés: 205 },
  { month: 'Juin', envoyés: 234, payés: 228 },
];

const statusData = [
  { name: 'Payés', value: 1234, color: '#10b981' },
  { name: 'En attente', value: 45, color: '#f59e0b' },
  { name: 'En cours', value: 23, color: '#3b82f6' },
  { name: 'Annulés', value: 12, color: '#ef4444' },
];

const countryData = [
  { country: 'USA → Burkina', count: 456, amount: '$234,000' },
  { country: 'France → Côte d\'Ivoire', count: 234, amount: '€145,000' },
  { country: 'USA → Mali', count: 189, amount: '$98,000' },
  { country: 'Canada → Sénégal', count: 145, amount: 'CAD 87,000' },
];

const recentTransfers = [
  { id: 'GX-2026-00456', sender: 'John Smith', beneficiary: 'Amadou Ouédraogo', amount: '$500', status: 'pending', date: '2026-01-30 10:30' },
  { id: 'GX-2026-00455', sender: 'Marie Dupont', beneficiary: 'Fatou Koné', amount: '€350', status: 'paid', date: '2026-01-30 09:45' },
  { id: 'GX-2026-00454', sender: 'James Wilson', beneficiary: 'Ibrahima Traoré', amount: '$750', status: 'paid', date: '2026-01-30 09:15' },
  { id: 'GX-2026-00453', sender: 'Sophie Martin', beneficiary: 'Moussa Diallo', amount: '€200', status: 'in_progress', date: '2026-01-30 08:50' },
];

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
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  const kpis = generateKPIs(user.role);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-8 h-8" />
              <h1 className="text-3xl font-bold">GLOBAL EXCHANGE</h1>
            </div>
            <p className="text-emerald-100 text-lg">
              Bienvenue, {user.name} - {getRoleLabel(user.role)}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <p className="text-sm opacity-90">Transferts aujourd'hui</p>
              <p className="text-2xl font-bold">156</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <p className="text-sm opacity-90">Volume</p>
              <p className="text-2xl font-bold">$89,500</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.slice(0, 6).map((kpi, idx) => (
          <KPICard key={idx} kpi={kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transferts Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ArrowLeftRight className="h-6 w-6 text-emerald-600" />
              Transferts (6 derniers mois)
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-600">Envoyés</span>
              <div className="w-3 h-3 rounded-full bg-blue-500 ml-3"></div>
              <span className="text-sm text-gray-600">Payés</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={transfersData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="envoyés"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ stroke: '#10b981', strokeWidth: 2, r: 4, fill: 'white' }}
                name="Transferts envoyés"
              />
              <Line
                type="monotone"
                dataKey="payés"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 4, fill: 'white' }}
                name="Transferts payés"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
              Statut des transferts
            </h2>
            <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
              Total: {statusData.reduce((sum, item) => sum + item.value, 0)}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transfers & Top Corridors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transfers */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock className="h-6 w-6 text-amber-600" />
            Transferts récents
          </h2>
          <div className="space-y-4">
            {recentTransfers.map((transfer) => (
              <div key={transfer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-emerald-600 font-semibold">{transfer.id}</span>
                    {getStatusBadge(transfer.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {transfer.sender} → {transfer.beneficiary}
                  </p>
                  <p className="text-xs text-gray-400">{transfer.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{transfer.amount}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition-colors">
            Voir tous les transferts →
          </button>
        </div>

        {/* Top Corridors */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-600" />
            Corridors principaux
          </h2>
          <div className="space-y-4">
            {countryData.map((corridor, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{corridor.country}</p>
                    <p className="text-sm text-gray-500">{corridor.count} transferts</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">{corridor.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Performance de cette semaine</h3>
            <p className="text-gray-600 mt-1">Comparaison avec la semaine dernière</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">+18%</p>
              <p className="text-sm text-gray-600">Volume</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">+12%</p>
              <p className="text-sm text-gray-600">Transferts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">-15%</p>
              <p className="text-sm text-gray-600">Temps moyen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">+8%</p>
              <p className="text-sm text-gray-600">Nouveaux bénéficiaires</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
