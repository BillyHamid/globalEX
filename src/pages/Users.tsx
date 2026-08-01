import { useEffect, useState } from 'react';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { UserFormModal, UserFormValues } from '@/components/users/UserFormModal';
import { User } from '@/types';
import { Plus, Edit, Trash2, MapPin, Power } from 'lucide-react';
import { getRoleLabel, getRoleColor } from '@/utils/roleConfig';
import { usersAPI } from '@/services/api';

export const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data as User[]);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: UserFormValues) => {
    if (editingUser) {
      await usersAPI.update(editingUser.id, {
        name: values.name,
        phone: values.phone || undefined,
        country: values.country || undefined,
        agentCode: values.agentCode || undefined,
        role: values.role,
      });
    } else {
      await usersAPI.create({
        email: values.email,
        password: values.password,
        name: values.name,
        phone: values.phone || undefined,
        role: values.role,
        country: values.country || undefined,
        agentCode: values.agentCode || undefined,
      });
    }
    await loadUsers();
  };

  const handleDelete = async (user: User) => {
    const ok = window.confirm(`Supprimer l'utilisateur "${user.name}" ? Cette action est irréversible.`);
    if (!ok) return;
    try {
      await usersAPI.delete(user.id);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await usersAPI.toggleActive(user.id);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de statut');
    }
  };

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
      accessor: (row: User) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1 text-emerald-600 hover:text-emerald-700"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleActive(row)}
            className="p-1 text-blue-600 hover:text-blue-700"
            title={row.isActive ? 'Désactiver' : 'Activer'}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1 text-red-600 hover:text-red-700"
            title="Supprimer"
          >
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
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter un utilisateur
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DataTable data={users} columns={columns} />
      )}

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        user={editingUser}
      />
    </div>
  );
};
