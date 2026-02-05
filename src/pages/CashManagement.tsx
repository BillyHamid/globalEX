import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Plus, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

// Type local pour les transactions de caisse
interface CashTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  reference?: string;
}

const mockTransactions: CashTransaction[] = [
  {
    id: '1',
    type: 'income',
    category: 'Commission',
    amount: 125000,
    description: 'Commission sur transfert GX-2026-00456',
    date: '2026-01-30',
    status: 'approved',
    reference: 'COM-001',
  },
  {
    id: '2',
    type: 'expense',
    category: 'Paiement',
    amount: 450000,
    description: 'Paiement transfert GX-2026-00455',
    date: '2026-01-30',
    status: 'approved',
    reference: 'PAY-001',
  },
  {
    id: '3',
    type: 'income',
    category: 'Commission',
    amount: 89000,
    description: 'Commission sur transfert GX-2026-00454',
    date: '2026-01-29',
    status: 'approved',
    reference: 'COM-002',
  },
  {
    id: '4',
    type: 'expense',
    category: 'Paiement',
    amount: 325000,
    description: 'Paiement transfert GX-2026-00453',
    date: '2026-01-29',
    status: 'pending',
    reference: 'PAY-002',
  },
  {
    id: '5',
    type: 'income',
    category: 'Frais',
    amount: 15000,
    description: 'Frais de service',
    date: '2026-01-28',
    status: 'approved',
    reference: 'FEE-001',
  },
];

export const CashManagement = () => {
  const totalIncome = mockTransactions
    .filter(t => t.type === 'income' && t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = mockTransactions
    .filter(t => t.type === 'expense' && t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0);

  const columns = [
    {
      header: 'Type',
      accessor: 'type' as keyof CashTransaction,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {value === 'income' ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className="capitalize">{value === 'income' ? 'Entrée' : 'Sortie'}</span>
        </div>
      ),
    },
    {
      header: 'Catégorie',
      accessor: 'category' as keyof CashTransaction,
    },
    {
      header: 'Description',
      accessor: 'description' as keyof CashTransaction,
    },
    {
      header: 'Montant',
      accessor: 'amount' as keyof CashTransaction,
      render: (value: number, row: CashTransaction) => (
        <span className={row.type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {row.type === 'income' ? '+' : '-'} {value.toLocaleString()} FCFA
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: 'date' as keyof CashTransaction,
    },
    {
      header: 'Statut',
      accessor: 'status' as keyof CashTransaction,
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      header: 'Référence',
      accessor: 'reference' as keyof CashTransaction,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion Caisse</h1>
          <p className="text-gray-600">Suivez les transactions financières</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          Nouvelle transaction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Solde disponible</p>
              <p className="text-2xl font-bold text-gray-900">
                {(totalIncome - totalExpenses).toLocaleString()} FCFA
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total entrées</p>
              <p className="text-2xl font-bold text-green-600">
                +{totalIncome.toLocaleString()} FCFA
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total sorties</p>
              <p className="text-2xl font-bold text-red-600">
                -{totalExpenses.toLocaleString()} FCFA
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <DataTable data={mockTransactions} columns={columns} filterable />
    </div>
  );
};
