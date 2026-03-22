import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { financialReportsAPI, type FinancialReport, type FinancialReportStatus } from '@/services/api';
import {
  ClipboardCheck,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  History,
} from 'lucide-react';
import { formatReportMoney } from './formatMoney';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
};

export const FinancialReportsAdmin = () => {
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [pending, setPending] = useState<FinancialReport[]>([]);
  const [history, setHistory] = useState<FinancialReport[]>([]);
  const [filter, setFilter] = useState<FinancialReportStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    const data = await financialReportsAPI.listForReview();
    setPending(data);
  }, []);

  const loadHistory = useCallback(async () => {
    const data = await financialReportsAPI.listHistory(filter || undefined);
    setHistory(data);
  }, [filter]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadPending(), loadHistory()]);
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [loadPending, loadHistory]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, filter, loadHistory]);

  const list = tab === 'pending' ? pending : history;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-violet-100 rounded-xl">
          <ClipboardCheck className="w-7 h-7 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validation des rapports financiers</h1>
          <p className="text-sm text-gray-500">
            Montants en <strong>XOF</strong>. Rapports soumis par Bernadette — à approuver ou rejeter (SANA Djibrill).
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            tab === 'pending' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          À traiter ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
            tab === 'history' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <History className="w-4 h-4" />
          Historique
        </button>
        <button
          type="button"
          onClick={() => load()}
          className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {tab === 'history' && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filtrer :</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FinancialReportStatus | '')}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          >
            <option value="">Tous</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvés</option>
            <option value="REJECTED">Rejetés</option>
            <option value="DRAFT">Brouillons</option>
          </select>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          {tab === 'pending' ? 'Aucun rapport en attente.' : 'Aucun rapport dans cet historique.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((r) => (
            <li key={r.id}>
              <Link
                to={`/financial-reports/${r.id}`}
                className="flex items-center justify-between gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-violet-200 hover:shadow-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">{r.creatorName}</p>
                  <p className="text-sm text-gray-500">
                    {formatReportMoney(r.totalAmount, r.currency ?? 'XOF')} · {STATUS_LABEL[r.status]} ·{' '}
                    {r.items.length} ligne(s)
                  </p>
                  {r.submittedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Soumis le {new Date(r.submittedAt).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
