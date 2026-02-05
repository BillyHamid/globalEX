import { FileText, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const monthlyRevenue = [
  { month: 'Jan', revenue: 8.5, target: 10 },
  { month: 'Fév', revenue: 9.2, target: 10 },
  { month: 'Mar', revenue: 10.1, target: 10 },
  { month: 'Avr', revenue: 11.5, target: 12 },
  { month: 'Mai', revenue: 12.3, target: 12 },
  { month: 'Juin', revenue: 12.8, target: 12 },
];

const topClients = [
  { client: 'Groupe GHI', amount: 18.9, shipments: 234 },
  { client: 'Société ABC SARL', amount: 12.5, shipments: 145 },
  { client: 'Entreprise XYZ', amount: 8.9, shipments: 89 },
  { client: 'Compagnie DEF', amount: 2.1, shipments: 23 },
];

export const Reports = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Rapports</h1>
          <p className="text-gray-600">Consultez et générez des rapports détaillés</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Période
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exporter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Rapport financier</h3>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">Mensuel</p>
          <button className="text-sm text-primary-600 hover:text-primary-700">Générer →</button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Rapport opérationnel</h3>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">Hebdomadaire</p>
          <button className="text-sm text-primary-600 hover:text-primary-700">Générer →</button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Rapport clients</h3>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">Mensuel</p>
          <button className="text-sm text-primary-600 hover:text-primary-700">Générer →</button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Audit</h3>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">Trimestriel</p>
          <button className="text-sm text-primary-600 hover:text-primary-700">Générer →</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Revenus vs Objectifs (6 derniers mois)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#0284c7" name="Revenus (M FCFA)" strokeWidth={2} />
              <Line type="monotone" dataKey="target" stroke="#dc2626" name="Objectif (M FCFA)" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Clients par Revenus
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topClients}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="client" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#0284c7" name="Revenus (M FCFA)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
