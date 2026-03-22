import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { financialReportsAPI, type FinancialReport } from '@/services/api';
import {
  FileSpreadsheet,
  Plus,
  Loader2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Brouillon', className: 'bg-slate-100 text-slate-800' },
  PENDING: { label: 'En attente de validation', className: 'bg-amber-100 text-amber-900' },
  APPROVED: { label: 'Approuvé', className: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'Rejeté', className: 'bg-red-100 text-red-800' },
};

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const FinancialReportsList = () => {
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');
  const [comment, setComment] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await financialReportsAPI.listMine();
      setReports(data);
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(totalAmount.replace(',', '.'));
    if (Number.isNaN(amt) || amt <= 0) return;
    try {
      setCreating(true);
      const r = await financialReportsAPI.create({
        total_amount: amt,
        comment: comment.trim() || undefined,
      });
      setReports((prev) => [r, ...prev]);
      setShowCreate(false);
      setTotalAmount('');
      setComment('');
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 rounded-xl">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rapports financiers</h1>
            <p className="text-sm text-gray-500">
              Déclarez un montant, ajoutez des lignes justifiées, soumettez pour validation (SANA Djibril).
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nouveau rapport
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {showCreate && (
        <div className="bg-white border border-indigo-200 rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Nouveau rapport (brouillon)</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant global (USD) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full max-w-xs border border-gray-300 rounded-xl px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none"
                placeholder="Objet du rapport…"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium disabled:opacity-60"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Créer le brouillon'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <p className="text-center text-gray-500 py-12">Aucun rapport pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => {
            const st = STATUS_LABEL[r.status] || STATUS_LABEL.DRAFT;
            return (
              <li key={r.id}>
                <Link
                  to={`/financial-reports/${r.id}`}
                  className="flex items-center justify-between gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-indigo-600">{r.id.slice(0, 8)}…</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.className}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {fmt(r.totalAmount)} USD
                    </p>
                    <p className="text-xs text-gray-500">
                      Justifié : {fmt(r.totalJustified)} · Reste : {fmt(r.remainingAmount)} ·{' '}
                      {r.items.length} ligne(s)
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
