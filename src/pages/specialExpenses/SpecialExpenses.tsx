import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  specialExpensesAPI,
  type SpecialExpense,
  type Loan,
  type PersonalWallet,
} from '@/services/api';
import {
  Wallet,
  TrendingDown,
  Banknote,
  Plus,
  AlertCircle,
  Loader2,
  Receipt,
  ArrowRightLeft,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  User,
} from 'lucide-react';

// ─────────────────────────────────────────────
// RBAC : accès admin + razack@globalexchange.com
// ─────────────────────────────────────────────
const RAZACK_EMAIL = 'razack@globalexchange.com';

const useIsAuthorized = () => {
  const { user } = useAuth();
  return user?.role === 'admin' || user?.email === RAZACK_EMAIL;
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const today = () => new Date().toISOString().split('T')[0];

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────
export const SpecialExpenses = () => {
  const authorized = useIsAuthorized();
  const [activeTab, setActiveTab] = useState<'expenses' | 'loans'>('expenses');

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle className="w-14 h-14 text-red-400" />
        <h2 className="text-xl font-bold text-gray-700">Accès refusé</h2>
        <p className="text-gray-500 max-w-sm">
          Ce module est réservé à l'Admin et à Zongo Razack.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-xl">
          <Wallet className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dépenses Spéciales</h1>
          <p className="text-sm text-gray-500">Gestion des dépenses et des prêts internes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'expenses'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          Dépense simple
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'loans'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Banknote className="w-4 h-4" />
          Prêt
        </button>
      </div>

      {/* Content */}
      {activeTab === 'expenses' ? <ExpensesSection /> : <LoansSection />}
    </div>
  );
};

// ─────────────────────────────────────────────
// SECTION : DÉPENSES SIMPLES
// ─────────────────────────────────────────────
const ExpensesSection = () => {
  const [availableTfees, setAvailableTfees] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<SpecialExpense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [bal, list] = await Promise.all([
        specialExpensesAPI.getTfeesBalance(),
        specialExpensesAPI.listExpenses(),
      ]);
      setAvailableTfees(bal.availableTfees);
      setExpenses(list.expenses);
      setTotal(list.total);
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (exp: SpecialExpense) => {
    setExpenses((prev) => [exp, ...prev]);
    setTotal((t) => t + 1);
    setAvailableTfees((prev) => (prev !== null ? prev - exp.amount : null));
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      {/* TFEES Balance card */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-purple-600 font-medium">Solde TFEES disponible</p>
          {loading ? (
            <div className="h-8 w-32 bg-purple-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-3xl font-bold text-purple-800 mt-1">
              {availableTfees !== null ? `${fmt(availableTfees)} USD` : '—'}
            </p>
          )}
          <p className="text-xs text-purple-500 mt-1">Frais USA→BF payés − dépenses déjà effectuées</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="p-2 rounded-lg bg-white text-purple-600 hover:bg-purple-50 border border-purple-200 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle dépense
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <ExpenseForm
          availableTfees={availableTfees ?? 0}
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            Historique des dépenses{' '}
            <span className="ml-1 text-xs font-normal text-gray-400">({total})</span>
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Receipt className="w-10 h-10 mb-2" />
            <p className="text-sm">Aucune dépense enregistrée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3 text-left">Par</th>
                  <th className="px-4 py-3 text-center">Justificatif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(exp.expenseDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{exp.description}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600 whitespace-nowrap">
                      − {fmt(exp.amount)} USD
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{exp.createdByName}</td>
                    <td className="px-4 py-3 text-center">
                      {exp.receiptImage ? (
                        <a
                          href={specialExpensesAPI.getReceiptUrl(exp.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium transition-colors"
                        >
                          <Receipt className="w-3 h-3" />
                          Voir
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// FORMULAIRE : DÉPENSE SIMPLE
// ─────────────────────────────────────────────
interface ExpenseFormProps {
  availableTfees: number;
  onCreated: (exp: SpecialExpense) => void;
  onCancel: () => void;
}

const ExpenseForm = ({ availableTfees, onCreated, onCancel }: ExpenseFormProps) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(today());
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Le montant doit être un nombre positif.');
      return;
    }
    if (parsedAmount > availableTfees) {
      setError(`Solde TFEES insuffisant. Disponible : ${fmt(availableTfees)} USD.`);
      return;
    }
    if (!description.trim()) {
      setError('La description est obligatoire.');
      return;
    }

    try {
      setSubmitting(true);
      const created = await specialExpensesAPI.createExpense({
        amount: parsedAmount,
        description: description.trim(),
        expense_date: expenseDate,
        receipt_image: receiptFile || undefined,
      });
      onCreated(created);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-purple-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Nouvelle dépense simple</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motif / Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez la dépense..."
            required
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pièce justificative <span className="text-xs text-gray-400">(optionnel – JPG, PNG, PDF, max 5 Mo)</span>
          </label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Valider la dépense
          </button>
        </div>
      </form>
    </div>
  );
};

// ─────────────────────────────────────────────
// SECTION : PRÊTS
// ─────────────────────────────────────────────
const LoansSection = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<PersonalWallet[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ws, ls] = await Promise.all([
        specialExpensesAPI.getWallets(),
        specialExpensesAPI.listLoans(),
      ]);
      setWallets(ws);
      setLoans(ls.loans);
      setTotal(ls.total);
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (loan: Loan) => {
    setLoans((prev) => [loan, ...prev]);
    setTotal((t) => t + 1);
    setShowForm(false);
    load();
  };

  const myWallet = wallets.find((w) => w.userId === user?.id || w.email === user?.email);
  const otherWallet = wallets.find((w) => w.userId !== user?.id && w.email !== user?.email);

  // Calculer les stats depuis l'historique
  const myId = user?.id;
  const totalDonné = loans.filter((l) => l.lenderId === myId).reduce((s, l) => s + l.amount, 0);
  const totalReçu = loans.filter((l) => l.borrowerId === myId).reduce((s, l) => s + l.amount, 0);

  return (
    <div className="space-y-5">
      {/* ── Wallets ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : wallets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {wallets.map((w) => {
            const isMe = w.userId === user?.id || w.email === user?.email;
            const isPositive = w.balance >= 0;
            return (
              <div
                key={w.userId}
                className={`rounded-2xl p-5 border ${
                  isMe
                    ? isPositive
                      ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
                      : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                    : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isMe ? (isPositive ? 'bg-emerald-100' : 'bg-red-100') : 'bg-blue-100'}`}>
                      <User className={`w-3.5 h-3.5 ${isMe ? (isPositive ? 'text-emerald-600' : 'text-red-600') : 'text-blue-600'}`} />
                    </div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${
                      isMe ? (isPositive ? 'text-emerald-600' : 'text-red-600') : 'text-blue-600'
                    }`}>
                      {isMe ? 'Ma caisse' : 'Caisse partenaire'}
                    </p>
                  </div>
                  {isMe && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isPositive ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {isPositive ? '▲ Créditeur' : '▼ Débiteur'}
                    </span>
                  )}
                </div>
                <p className="font-bold text-gray-800 mt-1">{w.name}</p>
                <p className={`text-3xl font-bold mt-2 ${
                  isMe ? (isPositive ? 'text-emerald-700' : 'text-red-600') : 'text-blue-700'
                }`}>
                  {isPositive ? '' : '−'}{fmt(Math.abs(w.balance))} <span className="text-base font-normal">USD</span>
                </p>
                {isMe && (
                  <div className="mt-3 pt-3 border-t border-white/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Total prêté</p>
                      <p className="font-semibold text-red-600">− {fmt(totalDonné)} USD</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total reçu</p>
                      <p className="font-semibold text-emerald-600">+ {fmt(totalReçu)} USD</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Boutons ── */}
      <div className="flex items-center justify-between">
        <button onClick={load} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors" title="Rafraîchir">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau prêt
        </button>
      </div>

      {/* ── Formulaire ── */}
      {showForm && (
        <LoanForm
          myWallet={myWallet}
          otherWallet={otherWallet}
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* ── Tableau historique ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            Historique des prêts
            <span className="ml-2 text-xs font-normal text-gray-400">({total})</span>
          </h3>
          {!loading && loans.length > 0 && (
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <TrendingDown className="w-3 h-3" /> Prêté : {fmt(totalDonné)} USD
              </span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <TrendingUp className="w-3 h-3" /> Reçu : {fmt(totalReçu)} USD
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : loans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ArrowRightLeft className="w-10 h-10 mb-2" />
            <p className="text-sm">Aucun prêt enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Sens</th>
                  <th className="px-4 py-3 text-left">De → Vers</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3 text-left">Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loans.map((loan) => {
                  const iGave = loan.lenderId === myId;
                  return (
                    <tr key={loan.id} className={`transition-colors ${iGave ? 'hover:bg-red-50/50' : 'hover:bg-emerald-50/50'}`}>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(loan.loanDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          iGave
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {iGave ? '↑ J\'ai prêté' : '↓ J\'ai reçu'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="font-medium text-gray-800">{loan.lenderName}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-800">{loan.borrowerName}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${iGave ? 'text-red-600' : 'text-emerald-600'}`}>
                        {iGave ? '−' : '+'}{fmt(loan.amount)} USD
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{loan.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// FORMULAIRE : PRÊT
// ─────────────────────────────────────────────
interface LoanFormProps {
  myWallet: PersonalWallet | undefined;
  otherWallet: PersonalWallet | undefined;
  onCreated: (loan: Loan) => void;
  onCancel: () => void;
}

const LoanForm = ({ myWallet, otherWallet, onCreated, onCancel }: LoanFormProps) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loanDate, setLoanDate] = useState(today());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Logique backend : le créateur est toujours le lender (prêteur)
  const myName = myWallet?.name ?? 'Vous';
  const otherName = otherWallet?.name ?? 'Autre partie';
  const parsedAmt = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isNaN(parsedAmt) || parsedAmt <= 0) { setError('Le montant doit être un nombre positif.'); return; }
    if (!reason.trim()) { setError('Le motif est obligatoire.'); return; }
    try {
      setSubmitting(true);
      const loan = await specialExpensesAPI.createLoan({ amount: parsedAmt, reason: reason.trim(), loan_date: loanDate });
      onCreated(loan);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-3">Nouveau prêt</h3>

      {/* Aperçu de la transaction */}
      {myWallet && otherWallet && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
          <div className="text-center">
            <p className="text-[11px] text-blue-500 uppercase font-semibold">Prêteur (vous débitez)</p>
            <p className="font-bold text-gray-800 mt-0.5">{myName}</p>
            <p className="text-sm font-semibold text-red-600 mt-0.5">
              {parsedAmt > 0 ? `− ${fmt(parsedAmt)} USD` : '—'}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 text-blue-400">
            <ArrowRight className="w-5 h-5" />
            <span className="text-[10px] text-blue-400">prête à</span>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-blue-500 uppercase font-semibold">Receveur (crédité)</p>
            <p className="font-bold text-gray-800 mt-0.5">{otherName}</p>
            <p className="text-sm font-semibold text-emerald-600 mt-0.5">
              {parsedAmt > 0 ? `+ ${fmt(parsedAmt)} USD` : '—'}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="0.01" step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={loanDate}
              onChange={(e) => setLoanDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motif <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Avance sur salaire, Remboursement partiel..."
            required
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Valider le prêt
          </button>
        </div>
      </form>
    </div>
  );
};

export default SpecialExpenses;
