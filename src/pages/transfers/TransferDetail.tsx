import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { transfersAPI } from '@/services/api';
import { 
  ArrowLeft, Download, Loader2, XCircle, 
  User, Phone, MapPin, DollarSign, Calendar, FileText, CheckCircle, Clock, Ban, Pencil
} from 'lucide-react';
import { SEND_METHOD_LABELS, SEND_METHOD_DISPLAY_ORDER } from '@/constants/sendMethods';
import { getPendingCorridorHighlight, isBfToUsaCorridor } from '@/utils/transferCorridorDisplay';

interface TransferDetail {
  id: string;
  reference: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    country: string;
  };
  beneficiary: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
    city: string;
    idType?: string;
    idNumber?: string;
    hasIdProof?: boolean;
  };
  amountSent: number;
  currencySent: string;
  exchangeRate: number;
  fees: number;
  amountReceived: number;
  currencyReceived: string;
  sendMethod: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  cancelledAt?: string;
  createdBy: {
    id: string;
    name: string;
    country?: string;
  };
  paidBy?: {
    id: string;
    name: string;
  };
  proofFilePath?: string;
  confirmationComment?: string;
  confirmedAt?: string;
  notes?: string;
  cancellationReason?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-800', icon: Clock },
  paid: { label: 'Payé', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: Ban },
};

const RAZACK_EMAIL = 'razack@globalexchange.com';

type EditFormState = {
  senderFirstName: string;
  senderLastName: string;
  senderPhone: string;
  senderEmail: string;
  senderCountry: string;
  benFirstName: string;
  benLastName: string;
  benPhone: string;
  benCountry: string;
  benCity: string;
  benIdType: string;
  benIdNumber: string;
  amountSent: string;
  currency: string;
  exchangeRate: string;
  fees: string;
  sendMethod: string;
  notes: string;
};

const transferToEditForm = (t: TransferDetail): EditFormState => ({
  senderFirstName: t.sender.firstName,
  senderLastName: t.sender.lastName,
  senderPhone: t.sender.phone,
  senderEmail: t.sender.email || '',
  senderCountry: t.sender.country,
  benFirstName: t.beneficiary.firstName,
  benLastName: t.beneficiary.lastName,
  benPhone: t.beneficiary.phone,
  benCountry: t.beneficiary.country,
  benCity: t.beneficiary.city,
  benIdType: t.beneficiary.idType || '',
  benIdNumber: t.beneficiary.idNumber || '',
  amountSent: String(t.amountSent),
  currency: t.currencySent,
  exchangeRate: String(t.exchangeRate),
  fees: String(t.fees),
  sendMethod: t.sendMethod,
  notes: t.notes || '',
});

export const TransferDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchTransfer = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await transfersAPI.getById(id);
        setTransfer(data);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement du transfert');
      } finally {
        setLoading(false);
      }
    };
    fetchTransfer();
  }, [id]);

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

  const handleDelete = async () => {
    if (!transfer) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le transfert ${transfer.reference} ?\n\nCette action est irréversible.`)) {
      return;
    }
    try {
      await transfersAPI.delete(transfer.id);
      navigate('/transfers');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const canCancelTransfer =
    !!user &&
    !!transfer &&
    ['pending', 'in_progress', 'paid', 'confirmed'].includes(transfer.status) &&
    (user.role === 'admin' ||
      user.role === 'supervisor' ||
      (user.email || '').toLowerCase() === RAZACK_EMAIL);

  const handleCancelTransfer = async () => {
    if (!transfer) return;
    const paidLike = transfer.status === 'paid' || transfer.status === 'confirmed';
    if (paidLike) {
      const ok = window.confirm(
        `Ce transfert (${transfer.reference}) est déjà payé. L’annulation contre-passera toutes les écritures comptables et marquera le transfert comme annulé. Continuer ?`
      );
      if (!ok) return;
    }
    const reason = prompt('Raison de l\'annulation :');
    if (reason === null) return;
    try {
      await transfersAPI.cancel(transfer.id, reason);
      const data = await transfersAPI.getById(transfer.id);
      setTransfer(data as TransferDetail);
      setEditing(false);
      setEditForm(null);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'annulation');
    }
  };

  const canEditTransfer =
    !!user &&
    transfer?.status === 'pending' &&
    (user.role === 'admin' || (user.email || '').toLowerCase() === RAZACK_EMAIL);

  const startEdit = () => {
    if (!transfer) return;
    setEditForm(transferToEditForm(transfer));
    setEditError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm(null);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!transfer || !editForm) return;
    setEditError(null);
    const amountSent = parseFloat(editForm.amountSent.replace(',', '.'));
    const exchangeRate = parseFloat(editForm.exchangeRate.replace(',', '.'));
    if (!Number.isFinite(amountSent) || amountSent < 1) {
      setEditError('Montant envoyé invalide');
      return;
    }
    if (!Number.isFinite(exchangeRate) || exchangeRate < 1) {
      setEditError('Taux de change invalide');
      return;
    }
    const isBfToUsa = editForm.senderCountry === 'BFA' && editForm.benCountry === 'USA';
    const isUsaToBf = editForm.senderCountry === 'USA' && editForm.benCountry === 'BFA';
    if (!isBfToUsa && !isUsaToBf) {
      setEditError('Corridor invalide : expéditeur USA → bénéficiaire BF, ou l’inverse.');
      return;
    }
    let currencyReceived: string | undefined;
    if (isUsaToBf) currencyReceived = 'XOF';
    if (isBfToUsa) currencyReceived = 'USD';

    const payload: Parameters<typeof transfersAPI.update>[1] = {
      sender: {
        firstName: editForm.senderFirstName.trim(),
        lastName: editForm.senderLastName.trim(),
        phone: editForm.senderPhone.trim(),
        email: editForm.senderEmail.trim() || undefined,
        country: editForm.senderCountry,
      },
      beneficiary: {
        firstName: editForm.benFirstName.trim(),
        lastName: editForm.benLastName.trim(),
        phone: editForm.benPhone.trim(),
        country: editForm.benCountry,
        city: editForm.benCity.trim(),
        idType: editForm.benIdType.trim() || undefined,
        idNumber: editForm.benIdNumber.trim() || undefined,
      },
      amountSent,
      currency: editForm.currency,
      exchangeRate,
      sendMethod: editForm.sendMethod,
      notes: editForm.notes.trim() || undefined,
      currencyReceived,
    };
    const feeVal = parseFloat(editForm.fees.replace(',', '.'));
    if (!Number.isFinite(feeVal) || feeVal < 0) {
      setEditError('Frais invalides');
      return;
    }
    payload.fees = feeVal;

    setSavingEdit(true);
    try {
      const data = await transfersAPI.update(transfer.id, payload);
      setTransfer(data as TransferDetail);
      setEditing(false);
      setEditForm(null);
    } catch (err: any) {
      setEditError(err.message || 'Erreur lors de l’enregistrement');
    } finally {
      setSavingEdit(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-gray-600">Chargement des détails...</p>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
        <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">{error || 'Transfert non trouvé'}</p>
        <button
          onClick={() => navigate('/transfers')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[transfer.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const pendingHi = getPendingCorridorHighlight(transfer);
  const isBfToUsa = isBfToUsaCorridor(transfer.sender.country, transfer.beneficiary.country);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/transfers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="font-mono text-emerald-600">{transfer.reference}</span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                <StatusIcon className="w-4 h-4" />
                {statusConfig.label}
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Détails du transfert</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEditTransfer && (
            <button
              type="button"
              onClick={editing ? cancelEdit : startEdit}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              {editing ? 'Annuler la modification' : 'Modifier'}
            </button>
          )}
          {canCancelTransfer && (
            <button
              type="button"
              onClick={handleCancelTransfer}
              className="px-4 py-2 border border-red-300 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Annuler le transfert
            </button>
          )}
          {user.role === 'admin' && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Ban className="w-4 h-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>

      {editing && editForm && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Modifier le transfert (en attente)</h2>
          <p className="text-sm text-gray-600">
            Réservé à l&apos;administrateur et à Razack. Les montants ou le corridor peuvent recalculer l&apos;écriture de caisse initiale.
          </p>
          {editError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{editError}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Expéditeur</p>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Prénom" value={editForm.senderFirstName} onChange={(e) => setEditForm({ ...editForm, senderFirstName: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nom" value={editForm.senderLastName} onChange={(e) => setEditForm({ ...editForm, senderLastName: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Téléphone" value={editForm.senderPhone} onChange={(e) => setEditForm({ ...editForm, senderPhone: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Email (optionnel)" value={editForm.senderEmail} onChange={(e) => setEditForm({ ...editForm, senderEmail: e.target.value })} />
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={editForm.senderCountry} onChange={(e) => setEditForm({ ...editForm, senderCountry: e.target.value })}>
                <option value="USA">USA</option>
                <option value="BFA">Burkina Faso (BFA)</option>
              </select>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Bénéficiaire</p>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Prénom" value={editForm.benFirstName} onChange={(e) => setEditForm({ ...editForm, benFirstName: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nom" value={editForm.benLastName} onChange={(e) => setEditForm({ ...editForm, benLastName: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Téléphone" value={editForm.benPhone} onChange={(e) => setEditForm({ ...editForm, benPhone: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ville" value={editForm.benCity} onChange={(e) => setEditForm({ ...editForm, benCity: e.target.value })} />
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={editForm.benCountry} onChange={(e) => setEditForm({ ...editForm, benCountry: e.target.value })}>
                <option value="USA">USA</option>
                <option value="BFA">Burkina Faso (BFA)</option>
              </select>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Type pièce (optionnel)" value={editForm.benIdType} onChange={(e) => setEditForm({ ...editForm, benIdType: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="N° pièce (optionnel)" value={editForm.benIdNumber} onChange={(e) => setEditForm({ ...editForm, benIdNumber: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Financier</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input className="w-full border rounded-lg px-3 py-2 text-sm" type="text" inputMode="decimal" placeholder="Montant envoyé" value={editForm.amountSent} onChange={(e) => setEditForm({ ...editForm, amountSent: e.target.value })} />
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}>
                  <option value="USD">USD</option>
                  <option value="XOF">XOF</option>
                </select>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" type="text" inputMode="decimal" placeholder="Taux de change" value={editForm.exchangeRate} onChange={(e) => setEditForm({ ...editForm, exchangeRate: e.target.value })} />
                <input className="w-full border rounded-lg px-3 py-2 text-sm" type="text" inputMode="decimal" placeholder="Frais" value={editForm.fees} onChange={(e) => setEditForm({ ...editForm, fees: e.target.value })} />
              </div>
              <select className="w-full max-w-md border rounded-lg px-3 py-2 text-sm" value={editForm.sendMethod} onChange={(e) => setEditForm({ ...editForm, sendMethod: e.target.value })}>
                {SEND_METHOD_DISPLAY_ORDER.map((id) => (
                  <option key={id} value={id}>{SEND_METHOD_LABELS[id] || id}</option>
                ))}
              </select>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-[72px]" placeholder="Notes (optionnel)" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Enregistrer
            </button>
            <button type="button" onClick={cancelEdit} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Fermer sans enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expéditeur */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Expéditeur
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Nom complet</p>
              <p className="text-base font-medium text-gray-900">
                {transfer.sender.firstName} {transfer.sender.lastName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-600">{transfer.sender.phone}</p>
            </div>
            {transfer.sender.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm text-gray-600">{transfer.sender.email}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-600">{transfer.sender.country}</p>
            </div>
          </div>
        </div>

        {/* Bénéficiaire */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            Bénéficiaire
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Nom complet</p>
              <p className="text-base font-medium text-gray-900">
                {transfer.beneficiary.firstName} {transfer.beneficiary.lastName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-600">{transfer.beneficiary.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-600">
                {transfer.beneficiary.city}, {transfer.beneficiary.country}
              </p>
            </div>
            {transfer.beneficiary.idType && transfer.beneficiary.idNumber && (
              <div>
                <p className="text-sm text-gray-500">Pièce d'identité</p>
                <p className="text-sm text-gray-600">
                  {transfer.beneficiary.idType}: {transfer.beneficiary.idNumber}
                </p>
              </div>
            )}
            {transfer.beneficiary.hasIdProof && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Fichier pièce d&apos;identité</p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await transfersAPI.downloadBeneficiaryIdProof(transfer.id);
                    } catch (err: any) {
                      alert(err.message || 'Erreur lors du téléchargement');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le scan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Informations financières */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Informations financières
          </h2>
          <div className="space-y-4">
            {pendingHi ? (
              <>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                  <p className="text-sm font-medium text-emerald-800 mb-1">{pendingHi.primaryHint}</p>
                  <p className="text-3xl font-bold text-emerald-700">
                    {pendingHi.primaryAmount.toLocaleString('fr-FR')} {pendingHi.primaryCurrency}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {pendingHi.secondaryHint} :{' '}
                    <span className="font-medium text-gray-900">
                      {pendingHi.secondaryAmount.toLocaleString('fr-FR')} {pendingHi.secondaryCurrency}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Frais</p>
                  <p className="text-xl font-bold text-amber-600">
                    {transfer.fees.toLocaleString('fr-FR')} {transfer.currencySent}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Montant envoyé</p>
                    <p className="text-xl font-bold text-gray-900">
                      {transfer.amountSent.toLocaleString('fr-FR')} {transfer.currencySent}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Frais</p>
                    <p className="text-xl font-bold text-amber-600">
                      {transfer.fees.toLocaleString('fr-FR')} {transfer.currencySent}
                    </p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-1">Montant à remettre</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {transfer.amountReceived.toLocaleString('fr-FR')} {transfer.currencyReceived}
                  </p>
                </div>
              </>
            )}
            <div>
              <p className="text-sm text-gray-500">Taux de change</p>
              <p className="text-base text-gray-900">
                {isBfToUsa ? (
                  <>1 XOF = {(1 / transfer.exchangeRate).toFixed(4)} {transfer.currencyReceived}</>
                ) : (
                  <>1 {transfer.currencySent} = {transfer.exchangeRate.toLocaleString('fr-FR')} {transfer.currencyReceived}</>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Méthode de paiement (à l&apos;émission)</p>
              <p className="text-base font-semibold text-gray-900">
                {SEND_METHOD_LABELS[transfer.sendMethod] || transfer.sendMethod}
              </p>
              {pendingHi ? (
                <p className="text-sm text-amber-900 font-medium mt-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                  En attente : cette opération a été initiée avec ce mode côté pays expéditeur. Le solde à effectuer côté partenaire est indiqué ci-dessus (
                  {transfer.sender.country === 'USA' && transfer.beneficiary.country === 'BFA'
                    ? 'paiement au Burkina en XOF'
                    : 'paiement aux USA en USD'}
                  ).
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Informations système */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            Informations système
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Créé par</p>
              <p className="text-base font-medium text-gray-900">
                {transfer.createdBy.name}
                {transfer.createdBy.country && (
                  <span className="text-sm text-gray-500 ml-2">({transfer.createdBy.country})</span>
                )}
              </p>
            </div>
            {transfer.paidBy && (
              <div>
                <p className="text-sm text-gray-500">Payé par</p>
                <p className="text-base font-medium text-gray-900">{transfer.paidBy.name}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Date de création</p>
                <p className="text-sm text-gray-600">{formatDate(transfer.createdAt)}</p>
              </div>
            </div>
            {transfer.paidAt && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-sm text-gray-500">Date de paiement</p>
                  <p className="text-sm text-gray-600">{formatDate(transfer.paidAt)}</p>
                </div>
              </div>
            )}
            {transfer.cancelledAt && (
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-sm text-gray-500">Date d'annulation</p>
                  <p className="text-sm text-gray-600">{formatDate(transfer.cancelledAt)}</p>
                </div>
              </div>
            )}
            {transfer.proofFilePath && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Preuve de paiement</p>
                <button
                  onClick={async () => {
                    try {
                      await transfersAPI.downloadProof(transfer.id);
                    } catch (err: any) {
                      alert(err.message || 'Erreur lors du téléchargement');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger la preuve
                </button>
              </div>
            )}
            {transfer.confirmationComment && (
              <div>
                <p className="text-sm text-gray-500">Commentaire de confirmation</p>
                <p className="text-sm text-gray-600 mt-1">{transfer.confirmationComment}</p>
              </div>
            )}
            {transfer.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm text-gray-600 mt-1">{transfer.notes}</p>
              </div>
            )}
            {transfer.cancellationReason && (
              <div>
                <p className="text-sm text-gray-500">Raison d'annulation</p>
                <p className="text-sm text-red-600 mt-1">{transfer.cancellationReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
