import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { financialReportsAPI, type FinancialReport } from '@/services/api';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Trash2,
  Send,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react';

const BERNADETTE_EMAIL = 'bernadette@globalexchange.com';

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Brouillon', className: 'bg-slate-100 text-slate-800' },
  PENDING: { label: 'En attente de validation', className: 'bg-amber-100 text-amber-900' },
  APPROVED: { label: 'Approuvé', className: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'Rejeté', className: 'bg-red-100 text-red-800' },
};

export const FinancialReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editTotal, setEditTotal] = useState('');
  const [editComment, setEditComment] = useState('');
  const [label, setLabel] = useState('');
  const [lineAmount, setLineAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const isBernadette = user?.email === BERNADETTE_EMAIL;
  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const r = await financialReportsAPI.get(id);
      setReport(r);
      setEditTotal(String(r.totalAmount));
      setEditComment(r.comment || '');
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveMeta = async () => {
    if (!id || !report) return;
    const amt = parseFloat(editTotal.replace(',', '.'));
    if (Number.isNaN(amt) || amt <= 0) return;
    try {
      setBusy(true);
      const r = await financialReportsAPI.update(id, {
        total_amount: amt,
        comment: editComment,
      });
      setReport(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const addLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const amt = parseFloat(lineAmount.replace(',', '.'));
    if (!label.trim() || Number.isNaN(amt) || amt <= 0) return;
    try {
      setBusy(true);
      const { report: r } = await financialReportsAPI.addItem(id, {
        label: label.trim(),
        amount: amt,
        proof: proofFile,
      });
      setReport(r);
      setLabel('');
      setLineAmount('');
      setProofFile(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const removeLine = async (itemId: string) => {
    if (!id || !confirm('Supprimer cette ligne ?')) return;
    try {
      setBusy(true);
      const r = await financialReportsAPI.deleteItem(id, itemId);
      setReport(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitReport = async () => {
    if (!id || !confirm('Soumettre ce rapport pour validation par l’administrateur ?')) return;
    try {
      setBusy(true);
      const r = await financialReportsAPI.submit(id);
      setReport(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!id) return;
    try {
      setBusy(true);
      const r = await financialReportsAPI.approve(id);
      setReport(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!id) return;
    try {
      setBusy(true);
      const r = await financialReportsAPI.reject(id, rejectReason);
      setReport(r);
      setShowReject(false);
      setRejectReason('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteDraft = async () => {
    if (!id || !confirm('Supprimer définitivement ce brouillon ?')) return;
    try {
      setBusy(true);
      await financialReportsAPI.deleteDraft(id);
      navigate('/financial-reports');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const openProof = async (itemId: string) => {
    if (!id) return;
    try {
      await financialReportsAPI.openItemProof(id, itemId);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!user || (!isBernadette && !isAdmin)) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-700">Accès réservé à Bernadette ou à l’administrateur.</p>
        <Link to="/dashboard" className="text-indigo-600 mt-4 inline-block">
          Retour
        </Link>
      </div>
    );
  }

  if (loading || !report) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const st = STATUS[report.status] || STATUS.DRAFT;
  const canEditDraft = isBernadette && report.status === 'DRAFT';
  const canValidate = isAdmin && report.status === 'PENDING';

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      <Link
        to={isAdmin ? '/financial-reports/admin/validation' : '/financial-reports'}
        className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Link>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.className}`}>{st.label}</span>
          <span className="text-xs text-gray-400 font-mono">{report.id}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{fmt(report.totalAmount)} USD</h1>
        <p className="text-sm text-gray-600 mt-1">Par {report.creatorName}</p>

        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-gray-500 text-xs">Total justifié</p>
            <p className="font-semibold text-gray-900">{fmt(report.totalJustified)} USD</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-gray-500 text-xs">Reste à allouer</p>
            <p className="font-semibold text-gray-900">{fmt(report.remainingAmount)} USD</p>
          </div>
        </div>

        {report.comment && (
          <p className="mt-4 text-sm text-gray-700 border-t pt-4">
            <span className="text-gray-500">Commentaire : </span>
            {report.comment}
          </p>
        )}

        {report.status === 'REJECTED' && report.rejectionReason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-900">
            <strong>Motif du rejet :</strong> {report.rejectionReason}
          </div>
        )}

        {report.validatedAt && report.validatorName && (
          <p className="mt-3 text-xs text-gray-500">
            Traité par {report.validatorName} le {new Date(report.validatedAt).toLocaleString('fr-FR')}
          </p>
        )}
      </div>

      {canEditDraft && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Montant global & commentaire</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Montant (USD)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={editTotal}
                onChange={(e) => setEditTotal(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-600">Commentaire</label>
              <textarea
                rows={2}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1 resize-none"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => saveMeta()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" />
          Lignes de dépense
        </h2>
        {report.items.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune ligne. Ajoutez des montants détaillés (≤ montant global).</p>
        ) : (
          <ul className="space-y-2">
            {report.items.map((it) => (
              <li
                key={it.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl text-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">{it.label}</p>
                  <p className="text-indigo-700 font-semibold">{fmt(it.amount)} USD</p>
                </div>
                <div className="flex items-center gap-2">
                  {it.proofFile && (
                    <button
                      type="button"
                      onClick={() => openProof(it.id)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Voir justificatif
                    </button>
                  )}
                  {canEditDraft && (
                    <button
                      type="button"
                      onClick={() => removeLine(it.id)}
                      disabled={busy}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canEditDraft && (
        <form onSubmit={addLine} className="bg-white border border-dashed border-indigo-200 rounded-2xl p-5 space-y-3">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Ajouter une ligne
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="Libellé *"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Montant USD *"
              value={lineAmount}
              onChange={(e) => setLineAmount(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Justificatif (JPG, PNG, PDF, max 5 Mo)</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              className="block w-full text-sm mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
          >
            Ajouter la ligne
          </button>
        </form>
      )}

      {canEditDraft && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || report.items.length === 0}
            onClick={() => submitReport()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Soumettre pour validation
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => deleteDraft()}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-700 rounded-xl text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer le brouillon
          </button>
        </div>
      )}

      {canValidate && (
        <div className="border border-violet-200 bg-violet-50/50 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-violet-900">Décision</h3>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => approve()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              Approuver
            </button>
            {!showReject ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowReject(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium"
              >
                <XCircle className="w-4 h-4" />
                Rejeter
              </button>
            ) : (
              <div className="w-full space-y-2">
                <textarea
                  placeholder="Motif du rejet *"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy || !rejectReason.trim()}
                    onClick={() => reject()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    Confirmer le rejet
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReject(false)}
                    className="px-4 py-2 border rounded-lg text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
