import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Plus, Bell, Mail, Settings } from 'lucide-react';

interface Alert {
  id: string;
  name: string;
  type: 'invoice' | 'shipment' | 'payment' | 'system';
  recipients: string[];
  status: 'active' | 'inactive';
  lastSent?: string;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    name: 'Nouvelle facture créée',
    type: 'invoice',
    recipients: ['finance@fasotrans.bf', 'dg@fasotrans.bf'],
    status: 'active',
    lastSent: '2024-01-15 10:30',
  },
  {
    id: '2',
    name: 'Expédition livrée',
    type: 'shipment',
    recipients: ['operations@fasotrans.bf'],
    status: 'active',
    lastSent: '2024-01-15 14:20',
  },
  {
    id: '3',
    name: 'Paiement reçu',
    type: 'payment',
    recipients: ['finance@fasotrans.bf', 'cashier@fasotrans.bf'],
    status: 'active',
    lastSent: '2024-01-15 09:15',
  },
  {
    id: '4',
    name: 'Alerte système',
    type: 'system',
    recipients: ['admin@fasotrans.bf'],
    status: 'active',
    lastSent: '2024-01-14 16:45',
  },
  {
    id: '5',
    name: 'Facture impayée',
    type: 'invoice',
    recipients: ['finance@fasotrans.bf'],
    status: 'inactive',
  },
];

const typeLabels = {
  invoice: 'Facturation',
  shipment: 'Expédition',
  payment: 'Paiement',
  system: 'Système',
};

export const EmailAlerts = () => {
  const columns = [
    {
      header: 'Nom',
      accessor: 'name' as keyof Alert,
    },
    {
      header: 'Type',
      accessor: 'type' as keyof Alert,
      render: (value: string) => (
        <span className="text-sm text-gray-600">{typeLabels[value as keyof typeof typeLabels]}</span>
      ),
    },
    {
      header: 'Destinataires',
      accessor: 'recipients' as keyof Alert,
      render: (value: string[]) => (
        <span className="text-sm text-gray-600">{value.join(', ')}</span>
      ),
    },
    {
      header: 'Statut',
      accessor: 'status' as keyof Alert,
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      header: 'Dernier envoi',
      accessor: 'lastSent' as keyof Alert,
      render: (value?: string) => value || <span className="text-gray-400">Jamais</span>,
    },
    {
      header: 'Actions',
      accessor: (_row: Alert) => (
        <div className="flex items-center gap-2">
          <button className="p-1 text-primary-600 hover:text-primary-700" title="Configurer">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-1 text-primary-600 hover:text-primary-700" title="Tester">
            <Mail className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Alertes Email</h1>
          <p className="text-gray-600">Configurez les notifications par email</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nouvelle alerte
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Alertes actives</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockAlerts.filter(a => a.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Bell className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Alertes envoyées aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">23</p>
            </div>
            <div className="p-3 bg-primary-50 rounded-lg">
              <Mail className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Taux de livraison</p>
              <p className="text-2xl font-bold text-gray-900">98.5%</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <DataTable data={mockAlerts} columns={columns} filterable />
    </div>
  );
};
