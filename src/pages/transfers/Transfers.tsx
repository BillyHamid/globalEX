import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { transfersAPI } from '@/services/api';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmTransferModal } from '@/components/transfers/ConfirmTransferModal';
import { 
  Plus, Search, Filter, ArrowLeftRight, Clock, CheckCircle, 
  XCircle, Eye, RefreshCw, Download, Loader2, Ban, FileCheck, Trash2
} from 'lucide-react';

interface TransferItem {
  id: string;
  reference: string;
  sender: {
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
  };
  beneficiary: {
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
    city: string;
  };
  amountSent: number;
  currencySent: string;
  exchangeRate: number;
  amountReceived: number;
  currencyReceived: string;
  sendMethod?: 'cash' | 'zelle' | 'orange_money' | 'wave' | 'bank_transfer';
  status: 'pending' | 'in_progress' | 'paid' | 'cancelled';
  createdAt: string;
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
}

const SEND_METHOD_CONFIG: Record<string, { label: string; color: string }> = {
  cash: { label: 'Espèces', color: 'bg-amber-100 text-amber-800 border border-amber-200' },
  zelle: { label: 'Zelle', color: 'bg-purple-100 text-purple-800 border border-purple-200' },
  orange_money: { label: 'Orange Money', color: 'bg-orange-100 text-orange-800 border border-orange-200' },
  wave: { label: 'Wave', color: 'bg-cyan-100 text-cyan-800 border border-cyan-200' },
  bank_transfer: { label: 'Virement bancaire', color: 'bg-indigo-100 text-indigo-800 border border-indigo-200' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
  paid: { label: 'Payé', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export const Transfers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusFromUrl = searchParams.get('status');
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    if (statusFromUrl && ['pending', 'in_progress', 'paid', 'cancelled'].includes(statusFromUrl)) return statusFromUrl;
    return 'all';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; transferId: string; reference: string } | null>(null);

  // Garder le filtre synchronisé avec l'URL (?status=pending etc.)
  useEffect(() => {
    const s = searchParams.get('status');
    if (s && ['pending', 'in_progress', 'paid', 'cancelled'].includes(s) && statusFilter !== s) setStatusFilter(s);
  }, [searchParams]);

  // Fetch transfers from API
  const fetchTransfers = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);

    try {
      const params: any = { limit: 100 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await transfersAPI.getAll(params);
      setTransfers(response.data);
    } catch (err: any) {
      console.error('Error fetching transfers:', err);
      setError(err.message || 'Erreur lors du chargement des transferts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [statusFilter]);

  // Filter by search term (client-side)
  const filteredTransfers = transfers.filter(transfer => {
    if (searchTerm === '') return true;
    const search = searchTerm.toLowerCase();
    return (
      transfer.reference.toLowerCase().includes(search) ||
      `${transfer.sender.firstName} ${transfer.sender.lastName}`.toLowerCase().includes(search) ||
      `${transfer.beneficiary.firstName} ${transfer.beneficiary.lastName}`.toLowerCase().includes(search) ||
      transfer.beneficiary.phone.includes(search)
    );
  });

  const stats = {
    total: transfers.length,
    pending: transfers.filter(t => t.status === 'pending').length,
    paid: transfers.filter(t => t.status === 'paid').length,
    cancelled: transfers.filter(t => t.status === 'cancelled').length,
  };

  // Handle confirm with proof (nouvelle méthode sécurisée)
  const handleConfirmWithProof = (transferId: string, reference: string) => {
    setConfirmModal({ isOpen: true, transferId, reference });
  };

  // Handle cancel
  const handleCancel = async (transferId: string) => {
    const reason = prompt('Raison de l\'annulation :');
    if (reason === null) return;
    
    try {
      await transfersAPI.cancel(transferId, reason);
      fetchTransfers(true);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'annulation');
    }
  };

  // Handle delete (admin only)
  const handleDelete = async (transferId: string, reference: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le transfert ${reference} ?\n\nCette action est irréversible.`)) {
      return;
    }
    
    try {
      await transfersAPI.delete(transferId);
      fetchTransfers(true);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

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

  const columns = [
    {
      header: 'Référence',
      accessor: 'reference' as keyof TransferItem,
      render: (value: string) => (
        <span className="font-mono text-emerald-600 font-semibold text-sm">{value}</span>
      ),
    },
    {
      header: 'Expéditeur',
      accessor: 'sender' as keyof TransferItem,
      render: (_value: any, row: TransferItem) => (
        <div>
          <p className="font-medium text-gray-900">{row.sender.firstName} {row.sender.lastName}</p>
          <p className="text-xs text-gray-500">{row.sender.country}</p>
        </div>
      ),
    },
    {
      header: 'Bénéficiaire',
      accessor: 'beneficiary' as keyof TransferItem,
      render: (_value: any, row: TransferItem) => (
        <div>
          <p className="font-medium text-gray-900">{row.beneficiary.firstName} {row.beneficiary.lastName}</p>
          <p className="text-xs text-gray-500">{row.beneficiary.phone}</p>
        </div>
      ),
    },
    {
      header: 'Montant envoyé',
      accessor: 'amountSent' as keyof TransferItem,
      render: (value: number, row: TransferItem) => (
        <span className="font-medium">{value.toLocaleString()} {row.currencySent}</span>
      ),
    },
    {
      header: 'Mode de paiement',
      accessor: 'sendMethod' as keyof TransferItem,
      render: (value: string) => {
        const config = value ? SEND_METHOD_CONFIG[value] : null;
        if (!config) return <span className="text-gray-400 text-sm">—</span>;
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${config.color}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      header: 'Taux du jour',
      accessor: 'exchangeRate' as keyof TransferItem,
      render: (value: number, row: TransferItem) => {
        const isBFtoUSA = row.sender.country === 'BFA' && row.beneficiary.country === 'USA';
        if (isBFtoUSA) {
          // Pour BF → USA, afficher le taux inverse (1 XOF = X USD)
          const inverseRate = (1 / value).toFixed(4);
          return (
            <span className="text-sm text-gray-700">
              1 XOF = {inverseRate} {row.currencyReceived}
            </span>
          );
        } else {
          // Pour USA → BF, afficher normalement (1 USD = X XOF)
          return (
            <span className="text-sm text-gray-700">
              1 {row.currencySent} = {value.toLocaleString()} {row.currencyReceived}
            </span>
          );
        }
      },
    },
    {
      header: 'À remettre',
      accessor: 'amountReceived' as keyof TransferItem,
      render: (value: number, row: TransferItem) => (
        <span className="font-bold text-emerald-600">{value.toLocaleString()} {row.currencyReceived || 'XOF'}</span>
      ),
    },
    {
      header: 'Agent',
      accessor: 'createdBy' as keyof TransferItem,
      render: (_value: any, row: TransferItem) => (
        <div>
          <p className="font-medium text-gray-900">{row.createdBy?.name ?? '—'}</p>
          {row.paidBy && (
            <p className="text-xs text-gray-500" title="Payé par">Payé par: {row.paidBy.name}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Statut',
      accessor: 'status' as keyof TransferItem,
      render: (value: string) => {
        const config = STATUS_CONFIG[value] || STATUS_CONFIG.pending;
        const Icon = config.icon;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        );
      },
    },
    {
      header: 'Date',
      accessor: 'createdAt' as keyof TransferItem,
      render: (value: string) => (
        <span className="text-sm text-gray-600">{formatDate(value)}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id' as keyof TransferItem,
      render: (_value: any, row: TransferItem) => {
        // Vérifier si l'utilisateur peut confirmer ce transfert
        // Si l'agent créateur est du BF, seul un agent USA peut confirmer
        // Si l'agent créateur est des USA, seul un agent BF peut confirmer
        const creatorCountry = row.createdBy?.country;
        const userCountry = user?.country;
        
        const canConfirmByRole = row.status === 'pending' && 
          (user?.role === 'sender_agent' || user?.role === 'payer_agent' || user?.role === 'admin' || user?.role === 'supervisor');
        
        let canConfirmByCountry = true;
        if (canConfirmByRole && creatorCountry && userCountry && (user?.role !== 'admin' && user?.role !== 'supervisor')) {
          // Vérifier que l'utilisateur est du pays opposé
          const isCreatorBF = creatorCountry === 'BFA' || creatorCountry === 'Burkina Faso';
          const isCreatorUSA = creatorCountry === 'USA' || creatorCountry === 'États-Unis';
          const isUserBF = userCountry === 'BFA' || userCountry === 'Burkina Faso';
          const isUserUSA = userCountry === 'USA' || userCountry === 'États-Unis';
          
          if (isCreatorBF && !isUserUSA) {
            canConfirmByCountry = false;
          } else if (isCreatorUSA && !isUserBF) {
            canConfirmByCountry = false;
          }
        }
        
        const canConfirm = canConfirmByRole && canConfirmByCountry;
        
        return (
          <div className="flex items-center gap-1">
            <button 
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Voir détails"
              onClick={() => navigate(`/transfers/${row.id}`)}
            >
              <Eye className="w-4 h-4" />
            </button>
            {canConfirm && (
              <button 
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 bg-emerald-50"
                title="Confirmer avec preuve (obligatoire)"
                onClick={() => handleConfirmWithProof(row.id, row.reference)}
              >
                <FileCheck className="w-4 h-4" />
              </button>
            )}
            {row.proofFilePath && (
              <button 
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Voir la preuve"
                onClick={async () => {
                  try {
                    await transfersAPI.downloadProof(row.id);
                  } catch (err: any) {
                    alert(err.message || 'Erreur lors du téléchargement');
                  }
                }}
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {row.status === 'pending' && (user?.role === 'admin' || user?.role === 'supervisor') && (
              <button 
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Annuler"
                onClick={() => handleCancel(row.id)}
              >
                <Ban className="w-4 h-4" />
              </button>
            )}
            {user?.role === 'admin' && (
              <button 
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer (admin uniquement)"
                onClick={() => handleDelete(row.id, row.reference)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowLeftRight className="w-7 h-7 text-emerald-600" />
            Transferts
          </h1>
          <p className="text-gray-600">Gérez toutes les transactions de transfert</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTransfers(true)}
            disabled={refreshing}
            className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          {(user.role === 'admin' || user.role === 'sender_agent' || user.role === 'payer_agent') && (
            <button
              onClick={() => navigate('/transfers/new')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
            >
              <Plus className="w-5 h-5" />
              Nouvelle transaction
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <p className="text-sm text-amber-600">En attente</p>
          <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-sm text-emerald-600">Payés</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.paid}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-sm text-red-600">Annulés</p>
          <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par référence, expéditeur ou bénéficiaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="in_progress">En cours</option>
              <option value="paid">Payé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
          <button className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Download className="w-5 h-5" />
            Exporter
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
          <p className="text-gray-600">Chargement des transferts...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-xl border border-red-100 p-6 text-center">
          <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => fetchTransfers()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      ) : filteredTransfers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Aucun transfert trouvé</p>
          <p className="text-gray-400 mt-2">
            {searchTerm ? 'Essayez de modifier votre recherche' : 'Créez votre premier transfert'}
          </p>
          {!searchTerm && (user?.role === 'sender_agent' || user?.role === 'payer_agent') && (
            <button
              onClick={() => navigate('/transfers/new')}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nouveau transfert
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto max-w-full">
          <DataTable data={filteredTransfers} columns={columns} />
        </div>
      )}

      {/* Modal de confirmation avec preuve */}
      {confirmModal && (
        <ConfirmTransferModal
          transferId={confirmModal.transferId}
          transferReference={confirmModal.reference}
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          onSuccess={() => {
            fetchTransfers(true);
            setConfirmModal(null);
          }}
        />
      )}
    </div>
  );
};
