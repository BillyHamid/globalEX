import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Shipment } from '@/types';
import { Plus, Eye, Edit, FileText } from 'lucide-react';

const mockShipments: Shipment[] = [
  {
    id: '1',
    reference: 'EXP-2024-001',
    client: 'Société ABC SARL',
    origin: 'Ouagadougou',
    destination: 'Bobo-Dioulasso',
    status: 'in_transit',
    amount: 125000,
    createdDate: '2024-01-15',
    deliveryDate: '2024-01-20',
  },
  {
    id: '2',
    reference: 'EXP-2024-002',
    client: 'Entreprise XYZ',
    origin: 'Ouagadougou',
    destination: 'Koudougou',
    status: 'delivered',
    amount: 89000,
    createdDate: '2024-01-10',
    deliveryDate: '2024-01-12',
  },
  {
    id: '3',
    reference: 'EXP-2024-003',
    client: 'Groupe GHI',
    origin: 'Ouagadougou',
    destination: 'Fada N\'gourma',
    status: 'pending',
    amount: 156000,
    createdDate: '2024-01-18',
  },
  {
    id: '4',
    reference: 'EXP-2024-004',
    client: 'Société ABC SARL',
    origin: 'Ouagadougou',
    destination: 'Ouahigouya',
    status: 'in_transit',
    amount: 98000,
    createdDate: '2024-01-14',
    deliveryDate: '2024-01-19',
  },
  {
    id: '5',
    reference: 'EXP-2024-005',
    client: 'Compagnie DEF',
    origin: 'Ouagadougou',
    destination: 'Dori',
    status: 'cancelled',
    amount: 145000,
    createdDate: '2024-01-12',
  },
];

export const Shipments = () => {
  const columns = [
    {
      header: 'Référence',
      accessor: 'reference' as keyof Shipment,
    },
    {
      header: 'Client',
      accessor: 'client' as keyof Shipment,
    },
    {
      header: 'Origine',
      accessor: 'origin' as keyof Shipment,
    },
    {
      header: 'Destination',
      accessor: 'destination' as keyof Shipment,
    },
    {
      header: 'Montant',
      accessor: 'amount' as keyof Shipment,
      render: (value: number) => `${value.toLocaleString()} FCFA`,
    },
    {
      header: 'Statut',
      accessor: 'status' as keyof Shipment,
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      header: 'Date création',
      accessor: 'createdDate' as keyof Shipment,
    },
    {
      header: 'Actions',
      accessor: (_row: Shipment) => (
        <div className="flex items-center gap-2">
          <button className="p-1 text-primary-600 hover:text-primary-700" title="Voir détails">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1 text-primary-600 hover:text-primary-700" title="Modifier">
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-1 text-primary-600 hover:text-primary-700" title="Document">
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dossiers / Expéditions</h1>
          <p className="text-gray-600">Gérez les expéditions et suivre leur statut</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nouvelle expédition
        </button>
      </div>

      <DataTable data={mockShipments} columns={columns} filterable />
    </div>
  );
};
