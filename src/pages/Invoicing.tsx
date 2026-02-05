import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Plus, FileText, Download, Send } from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    number: 'FAC-2024-001',
    client: 'Société ABC SARL',
    amount: 1250000,
    date: '2024-01-15',
    dueDate: '2024-02-15',
    status: 'paid',
  },
  {
    id: '2',
    number: 'FAC-2024-002',
    client: 'Entreprise XYZ',
    amount: 890000,
    date: '2024-01-10',
    dueDate: '2024-02-10',
    status: 'sent',
  },
  {
    id: '3',
    number: 'FAC-2024-003',
    client: 'Groupe GHI',
    amount: 1560000,
    date: '2024-01-08',
    dueDate: '2024-02-08',
    status: 'overdue',
  },
  {
    id: '4',
    number: 'FAC-2024-004',
    client: 'Société ABC SARL',
    amount: 980000,
    date: '2024-01-20',
    dueDate: '2024-02-20',
    status: 'draft',
  },
];

export const Invoicing = () => {
  const columns = [
    {
      header: 'Numéro',
      accessor: 'number' as keyof Invoice,
    },
    {
      header: 'Client',
      accessor: 'client' as keyof Invoice,
    },
    {
      header: 'Montant',
      accessor: 'amount' as keyof Invoice,
      render: (value: number) => `${value.toLocaleString()} FCFA`,
    },
    {
      header: 'Date',
      accessor: 'date' as keyof Invoice,
    },
    {
      header: 'Date d\'échéance',
      accessor: 'dueDate' as keyof Invoice,
    },
    {
      header: 'Statut',
      accessor: 'status' as keyof Invoice,
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      header: 'Actions',
      accessor: (_row: Invoice) => (
        <div className="flex items-center gap-2">
          <button className="p-1 text-primary-600 hover:text-primary-700" title="Télécharger">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-1 text-primary-600 hover:text-primary-700" title="Envoyer">
            <Send className="w-4 h-4" />
          </button>
          <button className="p-1 text-primary-600 hover:text-primary-700" title="Voir">
            <FileText className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Facturation & Paiements</h1>
          <p className="text-gray-600">Gérez les factures et les paiements clients</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nouvelle facture
        </button>
      </div>

      <DataTable data={mockInvoices} columns={columns} filterable />
    </div>
  );
};
