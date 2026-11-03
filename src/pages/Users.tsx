import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { UserFormModal, UserFormValues } from '@/components/users/UserFormModal';
import { Role, User } from '@/types';
import { Plus, Edit, Trash2, MapPin, Power } from 'lucide-react';
import { getRoleLabel, getRoleColor, hasPermission } from '@/utils/roleConfig';
import { usersAPI } from '@/services/api';

export const Users = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const canManageUsers = currentUser?.role === 'admin';
  const canViewUsers = hasPermission(currentUser, 'users.view');
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFilter = searchParams.get('role') || '';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await usersAPI.getDirectory());
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewUsers) void loadUsers();
  }, [canViewUsers]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: UserFormValues) => {
    setSuccess(null);
    if (editingUser) {
      await usersAPI.update(editingUser.id, {
        name: values.name,
        phone: values.phone || undefined,
        country: values.country || undefined,
        agentCode: values.agentCode || undefined,
        role: values.role,
        specialAccess: values.specialAccess,
      });
      if (editingUser.id === currentUser?.id) await refreshUser();
    } else {
      await usersAPI.create({
        email: values.email,
        password: values.password,
        name: values.name,
        phone: values.phone || undefined,
        role: values.role,
        specialAccess: values.specialAccess,
        country: values.country || undefined,
        agentCode: values.agentCode || undefined,
      });
    }
    await loadUsers();
    setSuccess(editingUser ? 'Utilisateur, rôle et accès mis à jour.' : 'Utilisateur créé.');
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
    ...(canManageUsers ? [{
      header: 'Actions',
      accessor: (row: User) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1 text-emerald-600 hover:text-emerald-700"
            title="Modifier"
            aria-label={`Modifier ${row.name}`}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleActive(row)}
            disabled={row.id === currentUser?.id}
            className="p-1 text-blue-600 hover:text-blue-700"
            title={row.isActive ? 'Désactiver' : 'Activer'}
            aria-label={`${row.isActive ? 'Désactiver' : 'Activer'} ${row.name}`}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            disabled={row.id === currentUser?.id}
            className="p-1 text-red-600 hover:text-red-700"
            title="Supprimer"
            aria-label={`Supprimer ${row.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    }] : []),
  ];

  if (!canViewUsers) {
    return <p role="alert" className="text-red-700">Vous n’avez pas accès à la gestion des utilisateurs.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Utilisateurs & Agents</h1>
          <p className="text-gray-600">{canManageUsers ? 'Modifiez les informations et le rôle de chaque utilisateur.' : 'Consultez les utilisateurs et leurs rôles.'}</p>
        </div>
        {canManageUsers && <button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter un utilisateur
        </button>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="user-role-filter" className="text-sm font-medium text-gray-700">Filtrer par rôle</label>
        <select
          id="user-role-filter"
          value={roleFilter}
          onChange={(event) => setSearchParams(event.target.value ? { role: event.target.value } : {})}
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="">Tous les rôles</option>
          {(['admin', 'supervisor', 'sender_agent', 'payer_agent'] as Role[]).map(role => (
            <option key={role} value={role}>{getRoleLabel(role)}</option>
          ))}
        </select>
        {canManageUsers && <Link to="/roles" className="text-sm font-medium text-emerald-700 hover:underline">Voir les rôles et permissions</Link>}
      </div>

      {success && <div role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">{success}</div>}

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
        <DataTable key={roleFilter} data={users.filter(user => !roleFilter || user.role === roleFilter)} columns={columns} />
      )}

      {canManageUsers && <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        user={editingUser}
        roleLocked={editingUser?.id === currentUser?.id}
      />}
    </div>
  );
};
