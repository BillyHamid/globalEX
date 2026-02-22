import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { transfersAPI } from '@/services/api';
import { 
  ArrowLeft, Eye, Download, Loader2, XCircle, 
  User, Phone, MapPin, DollarSign, Calendar, FileText, CheckCircle, Clock, Ban
} from 'lucide-react';

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

const SEND_METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces',
  zelle: 'Zelle',
  orange_money: 'Orange Money',
  wave: 'Wave',
  bank_transfer: 'Virement bancaire',
};

export const TransferDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          </div>
        </div>

        {/* Informations financières */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Informations financières
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Montant envoyé</p>
                <p className="text-xl font-bold text-gray-900">
                  {transfer.amountSent.toLocaleString()} {transfer.currencySent}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Frais</p>
                <p className="text-xl font-bold text-amber-600">
                  {transfer.fees.toLocaleString()} {transfer.currencySent}
                </p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-1">Montant à remettre</p>
              <p className="text-2xl font-bold text-emerald-600">
                {transfer.amountReceived.toLocaleString()} {transfer.currencyReceived}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Taux de change</p>
              <p className="text-base text-gray-900">1 {transfer.currencySent} = {transfer.exchangeRate} {transfer.currencyReceived}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Méthode de paiement</p>
              <p className="text-base text-gray-900">{SEND_METHOD_LABELS[transfer.sendMethod] || transfer.sendMethod}</p>
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
