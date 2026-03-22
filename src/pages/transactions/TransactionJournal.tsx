import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { statsAPI } from '@/services/api';
import { 
  FileText, Calendar, Download, RefreshCw, 
  CheckCircle, Clock,
  Loader2, XCircle, DollarSign, Banknote
} from 'lucide-react';

interface JournalEntry {
  id: string;
  reference: string;
  sender: { name: string; country: string };
  beneficiary: { name: string; phone: string; country: string };
  amountSent: number;
  currencySent: string;
  exchangeRate: number;
  rateReel: number | null;
  majoration: number | null;
  fees: number;
  amountReceived: number;
  currencyReceived: string;
  status: string;
  createdAt: string;
  creator: { name: string; country: string; role: string };
  payer?: { name: string; country: string };
  cumulative: { amount: number; fees: number };
}

interface DirectionSummary {
  totalTransfers: number;
  totalAmount: number;
  totalFees: number;
  totalReceived: number;
  pendingCount: number;
  paidCount: number;
  currencyAmount: string;
  currencyFees: string;
  currencyReceived: string;
}

interface DirectionData {
  journal: JournalEntry[];
  summary: DirectionSummary;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
  paid: { label: 'Payé', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
};

type TabDirection = 'usa' | 'bf';

const TAB_CONFIG: Record<TabDirection, { label: string; flag: string; subtitle: string; icon: any; accent: string; accentBg: string }> = {
  usa: {
    label: 'États-Unis → Burkina',
    flag: '🇺🇸',
    subtitle: 'Transferts envoyés depuis les USA',
    icon: DollarSign,
    accent: 'text-blue-600',
    accentBg: 'bg-blue-600',
  },
  bf: {
    label: 'Burkina → États-Unis',
    flag: '🇧🇫',
    subtitle: 'Transferts envoyés depuis le Burkina',
    icon: Banknote,
    accent: 'text-orange-600',
    accentBg: 'bg-orange-600',
  },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatCurrency = (amount: number, currency: string) =>
  `${amount.toLocaleString('fr-FR')} ${currency}`;

const SummaryCards = ({ summary, direction }: { summary: DirectionSummary; direction: TabDirection }) => {
  const cfg = TAB_CONFIG[direction];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-500">Transferts</p>
        <p className="text-2xl font-bold text-gray-900">{summary.totalTransfers}</p>
      </div>
      <div className={`rounded-xl p-4 border ${direction === 'usa' ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
        <p className={`text-sm ${cfg.accent}`}>Montant envoyé</p>
        <p className={`text-2xl font-bold ${direction === 'usa' ? 'text-blue-700' : 'text-orange-700'}`}>
          {summary.totalAmount.toLocaleString('fr-FR')} {summary.currencyAmount}
        </p>
      </div>
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
        <p className="text-sm text-amber-600">Frais totaux</p>
        <p className="text-2xl font-bold text-amber-700">
          {summary.totalFees.toLocaleString('fr-FR')} {summary.currencyFees}
        </p>
      </div>
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <p className="text-sm text-emerald-600">Montant reçu</p>
        <p className="text-2xl font-bold text-emerald-700">
          {summary.totalReceived.toLocaleString('fr-FR')} {summary.currencyReceived}
        </p>
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
  );
};

const JournalTable = ({ entries, direction }: { entries: JournalEntry[]; direction: TabDirection }) => {
  const cfg = TAB_CONFIG[direction];
  const isBf = direction === 'bf';
  const cumulLabel = isBf ? 'Tmount BF' : 'Tmount';
  const cumulFeesLabel = isBf ? 'Tfees BF' : 'Tfees';

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Aucun transfert {cfg.label}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Réf.</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bénéficiaire</th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Montant</th>
              {isBf && <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Taux réel</th>}
              {isBf && <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Taux paie.</th>}
              {isBf && <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Marge</th>}
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Frais</th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">{cumulLabel}</th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">{cumulFeesLabel}</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Agent</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map((entry) => {
              const StatusIcon = STATUS_CONFIG[entry.status]?.icon || Clock;
              const statusConfig = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;

              return (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3">
                    <span className="font-mono text-sm text-emerald-600 font-semibold">{entry.reference}</span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-gray-900">{entry.beneficiary.name}</p>
                    <p className="text-xs text-gray-500">{entry.beneficiary.phone}</p>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-medium">{formatCurrency(entry.amountSent, entry.currencySent)}</span>
                  </td>
                  {isBf && (
                    <td className="px-3 py-3 text-right">
                      {entry.rateReel !== null ? (
                        <span className="text-sm text-gray-700">{entry.rateReel.toLocaleString('fr-FR')}</span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  )}
                  {isBf && (
                    <td className="px-3 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">{entry.exchangeRate.toLocaleString('fr-FR')}</span>
                    </td>
                  )}
                  {isBf && (
                    <td className="px-3 py-3 text-right">
                      {entry.majoration !== null ? (
                        <span className={`text-sm font-semibold ${entry.majoration > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {entry.majoration > 0 ? `+${entry.majoration.toLocaleString('fr-FR')}` : '0'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm text-amber-600 font-medium">{formatCurrency(entry.fees, 'USD')}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={`text-sm font-bold ${isBf ? 'text-orange-600' : 'text-blue-600'}`}>
                      {entry.cumulative.amount.toLocaleString('fr-FR')}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-bold text-amber-600">
                      {formatCurrency(entry.cumulative.fees, 'USD')}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm text-gray-900">{entry.creator.name}</p>
                    <p className="text-xs text-gray-500">{entry.creator.country}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-sm text-gray-600">{formatDate(entry.createdAt)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const TransactionJournal = () => {
  const { user } = useAuth();
  const [usaData, setUsaData] = useState<DirectionData | null>(null);
  const [bfData, setBfData] = useState<DirectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabDirection>('usa');

  const fetchJournal = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const params: any = {};
      if (selectedDate) params.date = selectedDate;

      const data = await statsAPI.getJournal(params);
      setUsaData(data.usa);
      setBfData(data.bf);
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
  }, [selectedDate]);

  if (!user) return null;

  const currentData = activeTab === 'usa' ? usaData : bfData;
  const tabCfg = TAB_CONFIG[activeTab];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" />
            Journal des Transactions
          </h1>
          <p className="text-gray-600">Vue séparée par direction de transfert</p>
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
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Effacer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Direction Tabs */}
      <div className="flex gap-2">
        {(Object.keys(TAB_CONFIG) as TabDirection[]).map((dir) => {
          const cfg = TAB_CONFIG[dir];
          const isActive = activeTab === dir;
          const count = dir === 'usa'
            ? usaData?.summary.totalTransfers ?? 0
            : bfData?.summary.totalTransfers ?? 0;

          return (
            <button
              key={dir}
              onClick={() => setActiveTab(dir)}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl font-medium transition-all
                ${isActive
                  ? `${cfg.accentBg} text-white shadow-lg shadow-${dir === 'usa' ? 'blue' : 'orange'}-200`
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              <span className="text-lg">{cfg.flag}</span>
              <span className="hidden sm:inline">{cfg.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
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
      ) : currentData ? (
        <div className="space-y-6">
          <div className={`flex items-center gap-2 px-1`}>
            <span className="text-xl">{tabCfg.flag}</span>
            <h2 className={`text-lg font-bold ${tabCfg.accent}`}>{tabCfg.label}</h2>
            <span className="text-sm text-gray-500">— {tabCfg.subtitle}</span>
          </div>
          <SummaryCards summary={currentData.summary} direction={activeTab} />
          <JournalTable entries={currentData.journal} direction={activeTab} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Aucune donnée disponible</p>
        </div>
      )}
    </div>
  );
};
