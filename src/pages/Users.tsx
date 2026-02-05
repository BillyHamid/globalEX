import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { User } from '@/types';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { getRoleLabel, getRoleColor } from '@/utils/roleConfig';

const mockUsers: User[] = [
  { 
    id: '1', 
    email: 'admin@globalexchange.com', 
    name: 'Admin Système', 
    role: 'admin',
    phone: '+1 555 000 0001',
    country: 'USA',
    isActive: true,
    createdAt: '2024-01-01'
  },
  { 
    id: '2', 
    email: 'superviseur@globalexchange.com', 
    name: 'Jean Superviseur', 
    role: 'supervisor',
    phone: '+1 555 000 0002',
    country: 'USA',
    isActive: true,
    createdAt: '2024-01-01'
  },
  { 
    id: '3', 
    email: 'agent.usa@globalexchange.com', 
    name: 'John Smith', 
    role: 'sender_agent',
    phone: '+1 555 123 4567',
    country: 'USA',
    agentCode: 'USA-001',
    isActive: true,
    createdAt: '2024-01-15'
  },
  { 
    id: '4', 
    email: 'agent.burkina@globalexchange.com', 
    name: 'Amadou Ouédraogo', 
    role: 'payer_agent',
    phone: '+226 70 12 34 56',
    country: 'Burkina Faso',
    agentCode: 'BF-001',
    isActive: true,
    createdAt: '2024-01-15'
  },
  { 
    id: '5', 
    email: 'agent.france@globalexchange.com', 
    name: 'Pierre Dupont', 
    role: 'sender_agent',
    phone: '+33 6 12 34 56 78',
    country: 'France',
    agentCode: 'FR-001',
    isActive: true,
    createdAt: '2024-02-01'
  },
  { 
    id: '6', 
    email: 'agent.cote@globalexchange.com', 
    name: 'Kouassi Yao', 
    role: 'payer_agent',
    phone: '+225 07 12 34 56',
    country: 'Côte d\'Ivoire',
    agentCode: 'CI-001',
    isActive: true,
    createdAt: '2024-02-01'
  },
];

export const Users = () => {
  const columns = [
    {
      header: 'Utilisateur',
      accessor: 'name' as keyof User,
      render: (value: string, row: User) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      header: 'Pays',
      accessor: 'country' as keyof User,
      render: (value: string) => (
        <div className="flex items-center gap-1 text-gray-600">
          <MapPin className="w-4 h-4" />
          {value || 'Non défini'}
        </div>
      ),
    },
    {
      header: 'Rôle',
      accessor: 'role' as keyof User,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(value as any)}`}>
          {getRoleLabel(value as any)}
        </span>
      ),
    },
    {
      header: 'Code Agent',
      accessor: 'agentCode' as keyof User,
      render: (value: string) => (
        <span className="font-mono text-sm text-gray-600">{value || '-'}</span>
      ),
    },
    {
      header: 'Statut',
      accessor: 'isActive' as keyof User,
      render: (value: boolean) => <StatusBadge status={value ? 'active' : 'inactive'} />,
    },
    {
      header: 'Actions',
      accessor: (_row: User) => (
        <div className="flex items-center gap-2">
          <button className="p-1 text-emerald-600 hover:text-emerald-700" title="Modifier">
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-1 text-red-600 hover:text-red-700" title="Supprimer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Utilisateurs & Agents</h1>
          <p className="text-gray-600">Gérez les utilisateurs et agents du système</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          Ajouter un utilisateur
        </button>
      </div>

      <DataTable data={mockUsers} columns={columns} />
    </div>
  );
};
