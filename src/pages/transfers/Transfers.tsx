import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { transfersAPI } from '@/services/api';
import { DataTable } from '@/components/common/DataTable';
import { 
  Plus, Search, Filter, ArrowLeftRight, Clock, CheckCircle, 
  XCircle, Eye, RefreshCw, Download, Loader2, Ban
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
  amountReceived: number;
  currencyReceived: string;
  status: 'pending' | 'in_progress' | 'paid' | 'cancelled';
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  paidBy?: {
    id: string;
    name: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
  paid: { label: 'Payé', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export const Transfers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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

  // Handle mark as paid
  const handleMarkAsPaid = async (transferId: string) => {
    if (!confirm('Confirmer le paiement de ce transfert ?')) return;
    
    try {
      await transfersAPI.markAsPaid(transferId);
      fetchTransfers(true);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du paiement');
    }
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
      header: 'À remettre',
      accessor: 'amountReceived' as keyof TransferItem,
      render: (value: number) => (
        <span className="font-bold text-emerald-600">{value.toLocaleString()} XOF</span>
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
      accessor: (row: TransferItem) => (
        <div className="flex items-center gap-1">
          <button 
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Voir détails"
            onClick={() => navigate(`/transfers/${row.id}`)}
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'pending' && (user?.role === 'payer_agent' || user?.role === 'admin') && (
            <button 
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Marquer comme payé"
              onClick={() => handleMarkAsPaid(row.id)}
            >
              <CheckCircle className="w-4 h-4" />
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
        </div>
      ),
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <DataTable data={filteredTransfers} columns={columns} />
        </div>
      )}
    </div>
  );
};
