// @ts-nocheck
// TODO: Ce composant est legacy et sera remplacé par les nouveaux composants GLOBAL EXCHANGE
import { useState } from 'react';
import { Role } from '@/types';
import { DataTable } from '@/components/common/DataTable';
import { User, Shield, Settings, Plus, Edit, Trash2 } from 'lucide-react';

interface RolePermission {
  id: string;
  roleId: Role;
  moduleName: string;
  permissions: string[]; // ex: ['read', 'write', 'delete']
}

interface RoleManagerProps {
  roles: Role[];
  rolePermissions: RolePermission[];
  onAddRole: (role: Role) => void;
  onUpdateRole: (roleId: Role, permissions: RolePermission) => void;
  onDeleteRole: (roleId: Role) => void;
}

const RoleManager = ({ roles, rolePermissions, onAddRole, onUpdateRole, onDeleteRole }: RoleManagerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const modules = [
    'Comptabilité',
    'Transit',
    'Douane',
    'Logistique',
    'Trésorerie',
    'RH',
    'Commercial',
    'Administratif'
  ];

  const permissionTypes = [
    'Création',
    'Lecture',
    'Modification',
    'Suppression',
    'Validation',
    'Export'
  ];

  const handleAddRole = () => {
    setEditingRole(null);
    setSelectedModule('');
    setSelectedPermissions([]);
    setShowForm(true);
  };

  const handleEditRole = (roleId: Role) => {
    setEditingRole(roleId);
    // Charger les permissions existantes pour ce rôle
    const rolePerm = rolePermissions.find(rp => rp.roleId === roleId);
    if (rolePerm) {
      setSelectedModule(rolePerm.moduleName);
      setSelectedPermissions(rolePerm.permissions);
    }
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!selectedModule || selectedPermissions.length === 0) {
      alert('Veuillez sélectionner un module et au moins une permission');
      return;
    }

    const newPermission: RolePermission = {
      id: editingRole ? `${editingRole}-perm` : `perm-${rolePermissions.length + 1}`,
      roleId: editingRole as Role || 'cashier', // Valeur par défaut temporaire
      moduleName: selectedModule,
      permissions: selectedPermissions
    };

    if (editingRole) {
      onUpdateRole(editingRole, newPermission);
    } else {
      // Pour cet exemple, nous allons juste ajouter une permission
      console.log('Ajouter une nouvelle permission:', newPermission);
    }

    setShowForm(false);
    setEditingRole(null);
    setSelectedModule('');
    setSelectedPermissions([]);
  };

  const columns = [
    { header: 'Rôle', accessor: 'roleId' as keyof RolePermission },
    { header: 'Module', accessor: 'moduleName' as keyof RolePermission },
    { 
      header: 'Permissions', 
      accessor: 'permissions' as keyof RolePermission,
      render: (value: string[]) => value.join(', ')
    },
    { 
      header: 'Actions', 
      accessor: (row: RolePermission) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditRole(row.roleId)}
            className="text-blue-600 hover:text-blue-900 flex items-center"
          >
            <Edit className="w-4 h-4 mr-1" /> Modifier
          </button>
          <button
            onClick={() => onDeleteRole(row.roleId)}
            className="text-red-600 hover:text-red-900 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-1" /> Supprimer
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Gestion des rôles et permissions
        </h2>
        <button
          onClick={handleAddRole}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" /> Nouvelle attribution
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {editingRole ? `Modifier les permissions pour ${editingRole}` : 'Attribuer des permissions à un rôle'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
              <select
                value={editingRole || ''}
                onChange={(e) => setEditingRole(e.target.value as Role)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!!editingRole}
              >
                <option value="">Sélectionner un rôle</option>
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un module</option>
                {modules.map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {permissionTypes.map(permission => (
                <label key={permission} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permission)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPermissions([...selectedPermissions, permission]);
                      } else {
                        setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
                      }
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{permission}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingRole(null);
                setSelectedModule('');
                setSelectedPermissions([]);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingRole ? 'Mettre à jour' : 'Attribuer'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable data={rolePermissions} columns={columns} />
      </div>
    </div>
  );
};

export default RoleManager;