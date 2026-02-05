import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Client } from '@/types';
import { Plus, Eye, Edit } from 'lucide-react';

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Société ABC SARL',
    email: 'contact@abc.bf',
    phone: '+226 70 12 34 56',
    status: 'active',
    totalShipments: 145,
    totalAmount: 12500000,
    createdDate: '2023-01-15',
  },
  {
    id: '2',
    name: 'Entreprise XYZ',
    email: 'info@xyz.bf',
    phone: '+226 76 98 76 54',
    status: 'active',
    totalShipments: 89,
    totalAmount: 8900000,
    createdDate: '2023-03-20',
  },
  {
    id: '3',
    name: 'Compagnie DEF',
    email: 'admin@def.bf',
    phone: '+226 25 40 12 34',
    status: 'inactive',
    totalShipments: 23,
    totalAmount: 2100000,
    createdDate: '2023-06-10',
  },
  {
    id: '4',
    name: 'Groupe GHI',
    email: 'contact@ghi.bf',
    phone: '+226 50 30 20 10',
    status: 'active',
    totalShipments: 234,
    totalAmount: 18900000,
    createdDate: '2022-11-05',
  },
];

export const Clients = () => {
  const columns = [
    {
      header: 'Nom',
      accessor: 'name' as keyof Client,
    },
    {
      header: 'Email',
      accessor: 'email' as keyof Client,
    },
    {
      header: 'Téléphone',
      accessor: 'phone' as keyof Client,
    },
    {
      header: 'Expéditions',
      accessor: 'totalShipments' as keyof Client,
    },
    {
      header: 'Montant total',
      accessor: 'totalAmount' as keyof Client,
      render: (value: number) => `${(value / 1000000).toFixed(1)}M FCFA`,
    },
    {
      header: 'Statut',
      accessor: 'status' as keyof Client,
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      header: 'Actions',
      accessor: (_row: Client) => (
        <div className="flex items-center gap-2">
          <button className="p-1 text-primary-600 hover:text-primary-700" title="Voir">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1 text-primary-600 hover:text-primary-700" title="Modifier">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Clients</h1>
          <p className="text-gray-600">Gérez vos clients et leurs informations</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Ajouter un client 
        </button>
      </div>

      <DataTable data={mockClients} columns={columns} filterable />
    </div>
  );
};
