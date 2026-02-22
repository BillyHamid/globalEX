import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cashAPI } from '@/services/api';
import { CashEntryModal } from '@/components/cash/CashEntryModal';
import { CashExpenseModal } from '@/components/cash/CashExpenseModal';
import { 
  DollarSign, TrendingUp, TrendingDown, RefreshCw, 
  Loader2, ArrowUpCircle, ArrowDownCircle, FileText,
  Calculator, Users, History, Plus, Minus, Eye
} from 'lucide-react';

function ViewProofButton({ entryId }: { entryId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleView = async () => {
    setError(null);
    setLoading(true);
    try {
      const blob = await cashAPI.getEntryProofBlob(entryId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-0.5">
      <button
        type="button"
        onClick={handleView}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
        Voir preuve
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

interface CashDashboardData {
  accounts: {
    usa: { name: string; currency: string; balance: number; formattedBalance: string };
    burkina: { name: string; currency: string; balance: number; formattedBalance: string };
  };
  totals: {
    tmountUSD: number;
    tfeesUSD: number;
    tmountXOF: number;
    tfeesXOF: number;
    totalPaidTransfers: number;
    totalPaidUsaToBf?: number;
    totalPaidBfToUsa?: number;
    bfaToUsaAmountSentXOF?: number;
    bfaToUsaAmountReceivedUSD?: number;
  };
  profit: {
    totalUSD: number;
    formattedTotal: string;
    partnerShareUSD: number;
    formattedPartnerShare: string;
  };
  recentEntries: Array<{
    id: string;
    accountName: string;
    transactionId: string | null;
    transferReference: string | null;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    currency: string;
    description: string;
    proofFilePath?: string;
    createdBy: string | null;
    createdAt: string;
  }>;
}

export const CashDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CashDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modals pour entrées/dépenses
  const [entryModal, setEntryModal] = useState<{ isOpen: boolean; accountName: 'USA' | 'BURKINA' }>({ isOpen: false, accountName: 'USA' });
  const [expenseModal, setExpenseModal] = useState<{ isOpen: boolean; accountName: 'USA' | 'BURKINA' }>({ isOpen: false, accountName: 'USA' });

  const fetchDashboard = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const dashboardData = await cashAPI.getDashboard();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du dashboard caisse');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEntrySuccess = () => {
    fetchDashboard(true);
  };

  const handleExpenseSuccess = () => {
    fetchDashboard(true);
  };

  if (!user) return null;

  // Agents BF : ne voient que la caisse Burkina (vue restreinte)
  const isAgentBF = user.country && (
    user.country === 'BFA' ||
    user.country === 'Burkina Faso' ||
    String(user.country).toLowerCase().includes('burkina')
  );
  const isAgentRole = user.role === 'sender_agent' || user.role === 'payer_agent';
  const restrictToBurkina = isAgentBF && isAgentRole;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-gray-600">Chargement du dashboard caisse...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
        <p className="text-red-700">{error || 'Erreur lors du chargement'}</p>
        <button
          onClick={() => fetchDashboard()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Caisse</h1>
          <p className="text-gray-600 mt-1">
            {restrictToBurkina ? 'Vue Caisse Burkina Faso uniquement' : 'Suivi financier en temps réel - USA / Burkina Faso'}
          </p>
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Règles métier (masqué pour les agents BF) */}
      {!restrictToBurkina && (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <p className="font-medium mb-2">Règles métier</p>
        <ul className="space-y-1 text-amber-800">
          <li><strong>Tmount = montant de la Caisse USA.</strong> Quand il y a des mouvements dans la caisse (entrée, dépense, transfert), le Tmount change. USA → Burkina : client donne USD → caisse USA augmente ; paiement au BF → caisse Burkina diminue.</li>
          <li><strong>Burkina → USA :</strong> Client donne XOF → caisse Burkina augmente ; paiement aux USA → caisse USA diminue.</li>
        </ul>
      </div>
      )}

      {/* Soldes des caisses */}
      <div className={`grid gap-6 ${restrictToBurkina ? 'grid-cols-1 max-w-xl' : 'grid-cols-1 md:grid-cols-2'}`}>
        {/* Tmount = Caisse USA (masqué pour les agents BF) */}
        {!restrictToBurkina && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Tmount — Caisse USA
            </h2>
            <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
              USD
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-blue-900 mb-4">
            {data.accounts.usa.formattedBalance}
          </div>
          <p className="text-sm text-blue-700 mb-4">
            Tmount = ce solde. À chaque mouvement (entrée, dépense, transfert), Tmount est mis à jour.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setEntryModal({ isOpen: true, accountName: 'USA' })}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Entrée
            </button>
            <button
              onClick={() => setExpenseModal({ isOpen: true, accountName: 'USA' })}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <Minus className="w-4 h-4" />
              Dépense
            </button>
          </div>
        </div>
        )}

        {/* Caisse Burkina */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-200 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Caisse Burkina Faso
            </h2>
            <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm font-medium">
              XOF
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-emerald-900 mb-4">
            {data.accounts.burkina.formattedBalance}
          </div>
          <p className="text-sm text-emerald-700 mb-4">Solde actuel (augmente quand client donne XOF BF→USA, diminue quand on paie au BF pour USA→BF)</p>
          <div className="flex gap-2">
            <button
              onClick={() => setEntryModal({ isOpen: true, accountName: 'BURKINA' })}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Entrée
            </button>
            <button
              onClick={() => setExpenseModal({ isOpen: true, accountName: 'BURKINA' })}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <Minus className="w-4 h-4" />
              Dépense
            </button>
          </div>
        </div>
      </div>

      {/* Totaux et statistiques (masqués pour les agents BF) */}
      {!restrictToBurkina && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tmount = solde Caisse USA (évolue avec les mouvements) */}
        <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Tmount</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {data.accounts.usa.formattedBalance}
          </div>
          <p className="text-xs text-gray-500 mt-1">= Solde Caisse USA (change à chaque mouvement)</p>
        </div>

        {/* Tfees USD — USA → Burkina */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Calculator className="w-4 h-4" />
            <span className="text-sm font-medium">Tfees USD</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            ${data.totals.tfeesUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-500 mt-1">Frais USA → Burkina</p>
        </div>

        {/* Bénéfice total */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium">Bénéfice Total</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {data.profit.formattedTotal}
          </div>
          <p className="text-xs text-gray-500 mt-1">Frais cumulés</p>
        </div>

        {/* Partage 50/50 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">Partage Partenaire</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {data.profit.formattedPartnerShare}
          </div>
          <p className="text-xs text-gray-500 mt-1">50% du bénéfice</p>
        </div>
      </div>
      )}

      {/* Tmount XOF (USA→BF) + Transferts payés USA→BF (masqués pour les agents BF) */}
      {!restrictToBurkina && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tmount XOF — USA → Burkina (montants remis au BF) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Tmount XOF</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {data.totals.tmountXOF.toLocaleString('fr-FR')} FCFA
          </div>
          <p className="text-xs text-gray-500 mt-1">USA → Burkina : montants remis au BF</p>
        </div>

        {/* Transferts payés USA → BF */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Transferts USA → BF payés</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {data.totals.totalPaidUsaToBf ?? data.totals.totalPaidTransfers}
          </div>
          <p className="text-xs text-gray-500 mt-1">Nombre de transferts USA → Burkina complétés</p>
        </div>
      </div>
      )}

      {/* Section BF → USA */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Transferts Burkina → USA (hors Tmount)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500">Envoyés (XOF)</p>
            <p className="text-lg font-bold text-slate-900">
              {(data.totals.bfaToUsaAmountSentXOF ?? 0).toLocaleString('fr-FR')} FCFA
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Remis (USD)</p>
            <p className="text-lg font-bold text-slate-900">
              ${(data.totals.bfaToUsaAmountReceivedUSD ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Nombre payés</p>
            <p className="text-lg font-bold text-slate-900">{data.totals.totalPaidBfToUsa ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Historique récent (agents BF : uniquement écritures BURKINA) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5" />
            {restrictToBurkina ? 'Historique récent (Caisse Burkina)' : 'Historique récent (Journal comptable)'}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                {!restrictToBurkina && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transfert</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preuve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(restrictToBurkina ? data.recentEntries.filter((e) => e.accountName === 'BURKINA') : data.recentEntries).length === 0 ? (
                <tr>
                  <td colSpan={restrictToBurkina ? 6 : 7} className="px-4 py-8 text-center text-gray-500">
                    Aucune écriture récente
                  </td>
                </tr>
              ) : (
                (restrictToBurkina ? data.recentEntries.filter((e) => e.accountName === 'BURKINA') : data.recentEntries).map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(entry.createdAt)}
                    </td>
                    {!restrictToBurkina && (
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.accountName === 'USA' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {entry.accountName}
                      </span>
                    </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {entry.type === 'CREDIT' ? (
                          <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          entry.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {entry.type === 'CREDIT' ? 'CRÉDIT' : 'DÉBIT'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {entry.currency === 'USD' ? '$' : ''}
                      {entry.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {entry.currency === 'XOF' ? ' FCFA' : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entry.description}
                    </td>
                    <td className="px-4 py-3">
                      {entry.transferReference ? (
                        <span className="text-xs font-mono text-blue-600">
                          {entry.transferReference}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {entry.proofFilePath ? (
                        <ViewProofButton entryId={entry.id} />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals (agents BF : seul BURKINA est proposé via l'UI) */}
      <CashEntryModal
        isOpen={entryModal.isOpen}
        onClose={() => setEntryModal({ isOpen: false, accountName: 'USA' })}
        accountName={entryModal.accountName}
        currency={entryModal.accountName === 'USA' ? 'USD' : 'XOF'}
        onSuccess={handleEntrySuccess}
        onSubmit={async (accountName, amount, description, proofFile) => {
          await cashAPI.addEntry(accountName, amount, description, proofFile);
        }}
        title={`Ajouter une entrée d'argent - ${entryModal.accountName === 'USA' ? 'Caisse USA' : 'Caisse Burkina Faso'}`}
        buttonLabel="Enregistrer l'entrée"
      />

      <CashExpenseModal
        isOpen={expenseModal.isOpen}
        onClose={() => setExpenseModal({ isOpen: false, accountName: 'USA' })}
        accountName={expenseModal.accountName}
        currency={expenseModal.accountName === 'USA' ? 'USD' : 'XOF'}
        currentBalance={expenseModal.accountName === 'USA' ? data.accounts.usa.balance : data.accounts.burkina.balance}
        onSuccess={handleExpenseSuccess}
        onSubmit={async (accountName, amount, description) => {
          await cashAPI.addExpense(accountName, amount, description);
        }}
      />
    </div>
  );
};
