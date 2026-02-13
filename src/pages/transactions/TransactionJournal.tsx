import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { statsAPI, transfersAPI } from '@/services/api';
import { 
  FileText, Calendar, Filter, Download, RefreshCw, 
  DollarSign, TrendingUp, CheckCircle, Clock, Globe,
  Loader2, XCircle, ArrowLeftRight
} from 'lucide-react';

interface JournalEntry {
  id: string;
  reference: string;
  sender: {
    name: string;
    country: string;
  };
  beneficiary: {
    name: string;
    phone: string;
    country: string;
  };
  amountSent: number;
  currencySent: string;
  fees: number;
  amountReceived: number;
  currencyReceived: string;
  status: string;
  createdAt: string;
  creator: {
    name: string;
    country: string;
    role: string;
  };
  payer?: {
    name: string;
    country: string;
  };
  cumulative: {
    amount: number;
    fees: number;
  };
}

interface Summary {
  totalTransfers: number;
  totalAmount: number;
  totalFees: number;
  totalReceived: number;
  pendingCount: number;
  paidCount: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
  paid: { label: 'Payé', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export const TransactionJournal = () => {
  const { user } = useAuth();
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchJournal = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);

    try {
      const params: any = { date: selectedDate };
      if (selectedCountry !== 'all') {
        params.country = selectedCountry;
      }
      
      const data = await statsAPI.getJournal(params);
      setJournal(data.journal);
      setSummary(data.summary);
    } catch (err: any) {
      console.error('Error fetching journal:', err);
      setError(err.message || 'Erreur lors du chargement du journal');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJournal();
  }, [selectedDate, selectedCountry]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" />
            Journal des Transactions
          </h1>
          <p className="text-gray-600">Récapitulatif avec totaux cumulatifs (Tmount, Tfees)</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchJournal(true)}
            disabled={refreshing}
            className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Download className="w-5 h-5" />
            Exporter
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tous les pays</option>
              <option value="USA">USA</option>
              <option value="BFA">Burkina Faso</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Total Transferts</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalTransfers}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-600">Tmount</p>
            <p className="text-2xl font-bold text-blue-700">{summary.totalAmount.toLocaleString()} USD</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <p className="text-sm text-amber-600">Tfees</p>
            <p className="text-2xl font-bold text-amber-700">{summary.totalFees.toLocaleString()} USD</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-sm text-emerald-600">Total Reçu</p>
            <p className="text-2xl font-bold text-emerald-700">{summary.totalReceived.toLocaleString()} XOF</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="text-sm text-purple-600">En attente</p>
            <p className="text-2xl font-bold text-purple-700">{summary.pendingCount}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-sm text-green-600">Payés</p>
            <p className="text-2xl font-bold text-green-700">{summary.paidCount}</p>
          </div>
        </div>
      )}

      {/* Journal Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
          <p className="text-gray-600">Chargement du journal...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-xl border border-red-100 p-6 text-center">
          <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => fetchJournal()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      ) : journal.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Aucune transaction pour cette date</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Réf.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bénéficiaire</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Montant</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Frais</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Tmount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Tfees</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {journal.map((entry) => {
                  const StatusIcon = STATUS_CONFIG[entry.status]?.icon || Clock;
                  const statusConfig = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
                  
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-emerald-600 font-semibold">{entry.reference}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{entry.beneficiary.name}</p>
                          <p className="text-xs text-gray-500">{entry.beneficiary.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium">{formatCurrency(entry.amountSent, entry.currencySent)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-amber-600 font-medium">{formatCurrency(entry.fees, entry.currencySent)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-blue-600">{entry.cumulative.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-amber-600">{entry.cumulative.fees.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-900">{entry.creator.name}</p>
                          <p className="text-xs text-gray-500">{entry.creator.country}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{formatDate(entry.createdAt)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
