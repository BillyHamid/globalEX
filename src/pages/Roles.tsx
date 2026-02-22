import { DataTable } from '@/components/common/DataTable';
import { getRoleLabel } from '@/utils/roleConfig';
import { Shield, Edit, Eye } from 'lucide-react';
import { Role } from '@/types';

interface RolePermission {
  id: string;
  role: Role;
  permissions: string[];
  usersCount: number;
}

const roles: Role[] = [
  'admin',
  'supervisor',
  'sender_agent',
  'payer_agent',
];

const mockRoles: RolePermission[] = roles.map((role, idx) => ({
  id: String(idx + 1),
  role,
  permissions: [
    role === 'admin' ? 'Toutes les permissions' :
    role === 'supervisor' ? 'Vue globale, Supervision, Rapports' :
    (role === 'sender_agent' || role === 'payer_agent') ? 'Création transferts, Paiement transferts, Gestion bénéficiaires' :
    'Création transferts, Paiement transferts, Gestion bénéficiaires',
  ],
  usersCount: Math.floor(Math.random() * 10) + 1,
}));

export const Roles = () => {
  const columns = [
    {
      header: 'Rôle',
      accessor: 'role' as keyof RolePermission,
      render: (value: Role) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span className="font-medium">{getRoleLabel(value)}</span>
        </div>
      ),
    },
    {
      header: 'Permissions',
      accessor: 'permissions' as keyof RolePermission,
      render: (value: string[]) => (
        <span className="text-sm text-gray-600">{value.join(', ')}</span>
      ),
    },
    {
      header: 'Utilisateurs',
      accessor: 'usersCount' as keyof RolePermission,
      render: (value: number) => (
        <span className="font-medium">{value} utilisateur(s)</span>
      ),
    },
    {
      header: 'Actions',
      accessor: (_row: RolePermission) => (
        <div className="flex items-center gap-2">
          <button className="p-1 text-emerald-600 hover:text-emerald-700" title="Voir détails">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1 text-emerald-600 hover:text-emerald-700" title="Modifier">
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Rôles & Permissions</h1>
          <p className="text-gray-600">Configurez les rôles et leurs permissions</p>
        </div>
      </div>

      <DataTable data={mockRoles} columns={columns} />
    </div>
  );
};
