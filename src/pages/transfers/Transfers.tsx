import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/common/DataTable';
import { 
  Plus, Search, Filter, ArrowLeftRight, Clock, CheckCircle, 
  XCircle, Eye, AlertTriangle, Download, RefreshCw
} from 'lucide-react';

interface TransferItem {
  id: string;
  reference: string;
  senderName: string;
  senderCountry: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiaryCountry: string;
  amountSent: number;
  currency: string;
  amountReceived: number;
  status: 'pending' | 'notified' | 'in_progress' | 'paid' | 'cancelled' | 'expired';
  createdAt: string;
  agentName: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800', icon: Clock },
  notified: { label: 'Notifié', color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
  in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
  paid: { label: 'Payé', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
  expired: { label: 'Expiré', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

const MOCK_TRANSFERS: TransferItem[] = [
  {
    id: '1',
    reference: 'GX-2026-000456',
    senderName: 'John Smith',
    senderCountry: 'USA',
    beneficiaryName: 'Amadou Ouédraogo',
    beneficiaryPhone: '+226 70 12 34 56',
    beneficiaryCountry: 'Burkina Faso',
    amountSent: 500,
    currency: 'USD',
    amountReceived: 307500,
    status: 'pending',
    createdAt: '2026-01-30 10:30',
    agentName: 'John Smith (USA-001)',
  },
  {
    id: '2',
    reference: 'GX-2026-000455',
    senderName: 'Marie Dupont',
    senderCountry: 'France',
    beneficiaryName: 'Fatou Koné',
    beneficiaryPhone: '+225 07 45 67 89',
    beneficiaryCountry: 'Côte d\'Ivoire',
    amountSent: 350,
    currency: 'EUR',
    amountReceived: 229585,
    status: 'paid',
    createdAt: '2026-01-30 09:45',
    agentName: 'Pierre Dupont (FR-001)',
  },
  {
    id: '3',
    reference: 'GX-2026-000454',
    senderName: 'James Wilson',
    senderCountry: 'USA',
    beneficiaryName: 'Ibrahima Traoré',
    beneficiaryPhone: '+226 76 54 32 10',
    beneficiaryCountry: 'Burkina Faso',
    amountSent: 750,
    currency: 'USD',
    amountReceived: 461250,
    status: 'paid',
    createdAt: '2026-01-30 09:15',
    agentName: 'John Smith (USA-001)',
  },
  {
    id: '4',
    reference: 'GX-2026-000453',
    senderName: 'Sophie Martin',
    senderCountry: 'France',
    beneficiaryName: 'Moussa Diallo',
    beneficiaryPhone: '+223 70 11 22 33',
    beneficiaryCountry: 'Mali',
    amountSent: 200,
    currency: 'EUR',
    amountReceived: 131191,
    status: 'in_progress',
    createdAt: '2026-01-30 08:50',
    agentName: 'Pierre Dupont (FR-001)',
  },
  {
    id: '5',
    reference: 'GX-2026-000452',
    senderName: 'Robert Brown',
    senderCountry: 'Canada',
    beneficiaryName: 'Aissata Sow',
    beneficiaryPhone: '+221 77 88 99 00',
    beneficiaryCountry: 'Sénégal',
    amountSent: 400,
    currency: 'CAD',
    amountReceived: 180000,
    status: 'pending',
    createdAt: '2026-01-29 16:20',
    agentName: 'Agent Canada (CA-001)',
  },
  {
    id: '6',
    reference: 'GX-2026-000451',
    senderName: 'Alice Johnson',
    senderCountry: 'USA',
    beneficiaryName: 'Oumar Keita',
    beneficiaryPhone: '+226 70 99 88 77',
    beneficiaryCountry: 'Burkina Faso',
    amountSent: 150,
    currency: 'USD',
    amountReceived: 92250,
    status: 'cancelled',
    createdAt: '2026-01-29 14:10',
    agentName: 'John Smith (USA-001)',
  },
];

export const Transfers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransfers = MOCK_TRANSFERS.filter(transfer => {
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      transfer.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: MOCK_TRANSFERS.length,
    pending: MOCK_TRANSFERS.filter(t => t.status === 'pending').length,
    paid: MOCK_TRANSFERS.filter(t => t.status === 'paid').length,
    cancelled: MOCK_TRANSFERS.filter(t => t.status === 'cancelled').length,
  };

  const columns = [
    {
      header: 'Référence',
      accessor: 'reference' as keyof TransferItem,
      render: (value: string) => (
        <span className="font-mono text-emerald-600 font-semibold">{value}</span>
      ),
    },
    {
      header: 'Expéditeur',
      accessor: 'senderName' as keyof TransferItem,
      render: (value: string, row: TransferItem) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{row.senderCountry}</p>
        </div>
      ),
    },
    {
      header: 'Bénéficiaire',
      accessor: 'beneficiaryName' as keyof TransferItem,
      render: (value: string, row: TransferItem) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{row.beneficiaryPhone}</p>
        </div>
      ),
    },
    {
      header: 'Montant envoyé',
      accessor: 'amountSent' as keyof TransferItem,
      render: (value: number, row: TransferItem) => (
        <span className="font-medium">{value.toLocaleString()} {row.currency}</span>
      ),
    },
    {
      header: 'À remettre',
      accessor: 'amountReceived' as keyof TransferItem,
      render: (value: number) => (
        <span className="font-bold text-emerald-600">{value.toLocaleString()} FCFA</span>
      ),
    },
    {
      header: 'Statut',
      accessor: 'status' as keyof TransferItem,
      render: (value: string) => {
        const config = STATUS_CONFIG[value];
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
        <span className="text-sm text-gray-600">{value}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: (_row: TransferItem) => (
        <div className="flex items-center gap-2">
          <button 
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Voir détails"
          >
            <Eye className="w-4 h-4" />
          </button>
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
        
        {(user.role === 'admin' || user.role === 'sender_agent') && (
          <button
            onClick={() => navigate('/transfers/new')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nouvelle transaction
          </button>
        )}
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
              <option value="notified">Notifié</option>
              <option value="in_progress">En cours</option>
              <option value="paid">Payé</option>
              <option value="cancelled">Annulé</option>
              <option value="expired">Expiré</option>
            </select>
          </div>
          <button className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Download className="w-5 h-5" />
            Exporter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable data={filteredTransfers} columns={columns} />
      </div>
    </div>
  );
};
