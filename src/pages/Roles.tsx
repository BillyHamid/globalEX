import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Shield, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/common/DataTable';
import { getRoleLabel } from '@/utils/roleConfig';
import { rolesAPI, type RoleDefinition, type RolesConfiguration } from '@/services/api';

export const Roles = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<RolesConfiguration | null>(null);
  const [editing, setEditing] = useState<RoleDefinition | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError(null);
    try { setConfig(await rolesAPI.getAll()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Chargement impossible.'); }
  };
  useEffect(() => { if (user?.role === 'admin') void load(); }, [user?.role]);

  if (user?.role !== 'admin') {
    return <p role="alert" className="text-red-700">La configuration des rôles est réservée aux administrateurs.</p>;
  }

  const togglePermission = (id: string, checked: boolean) => {
    if (!config) return;
    setSelected(current => checked
      ? [...new Set([...current, id, ...(config.dependencies[id] || [])])]
      : current.filter(permission => permission !== id && !(config.dependencies[permission] || []).includes(id)));
  };

  const save = async () => {
    if (!editing || !config) return;
    setSaving(true);
    setError(null);
    try {
      await rolesAPI.update(editing.role, selected);
      setConfig({ ...config, roles: config.roles.map(role => role.id === editing.id ? { ...role, permissions: selected } : role) });
      setSuccess(`Permissions du rôle « ${getRoleLabel(editing.role)} » enregistrées.`);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rôles & Permissions</h1>
        <p className="mt-2 text-gray-600">Définissez les actions autorisées pour chaque rôle. Les changements s’appliquent aux utilisateurs de ce rôle dès leur prochaine action.</p>
      </div>
      {success && <div role="status" className="rounded-lg bg-emerald-50 p-4 text-emerald-800">{success}</div>}
      {error && !editing && <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error} <button onClick={() => void load()} className="underline">Réessayer</button></div>}
      {!config && !error && <p role="status">Chargement des rôles…</p>}
      {config && <DataTable data={config.roles} searchable={false} columns={[
        { header: 'Rôle', accessor: 'role', render: (_, role) => <span className="flex items-center gap-2 font-medium"><Shield className="h-4 w-4 text-emerald-600" />{getRoleLabel(role.role)}</span> },
        { header: 'Permissions', accessor: 'permissions', render: (permissions: string[]) => `${permissions.length} / ${config.catalog.length}` },
        { header: 'Utilisateurs', accessor: 'usersCount', render: (_, role) => <Link className="text-emerald-700 hover:underline" to={`/users?role=${role.role}`}>{role.usersCount} utilisateur(s)</Link> },
        { header: 'Actions', accessor: role => <button aria-label={`${role.editable ? 'Modifier' : 'Voir'} les permissions : ${getRoleLabel(role.role)}`} onClick={() => { setEditing(role); setSelected([...role.permissions]); setError(null); setSuccess(null); }} className="inline-flex items-center gap-2 text-emerald-700 hover:underline"><Edit className="h-4 w-4" />{role.editable ? 'Modifier les permissions' : 'Voir les permissions'}</button> },
      ]} />}
      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p>L’administrateur conserve tous les droits. La création des comptes et l’attribution des rôles restent réservées aux administrateurs.</p>
        <p>L’accès spécial aux dépenses, aux prêts et à la modification/annulation des transferts se règle individuellement dans Utilisateurs & Agents. Bernadette peut préparer ses rapports financiers ; leur validation reste réservée à l’administrateur.</p>
      </div>
      {editing && config && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <section role="dialog" aria-modal="true" aria-labelledby="role-editor-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 id="role-editor-title" className="text-xl font-bold">Permissions — {getRoleLabel(editing.role)}</h2>
            <button aria-label="Fermer" disabled={saving} onClick={() => setEditing(null)}><X className="h-5 w-5" /></button>
          </div>
          {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
          {[...new Set(config.catalog.map(permission => permission.group))].map(group => <fieldset key={group} className="mb-5" disabled={saving || !editing.editable}>
            <legend className="mb-2 font-semibold text-gray-900">{group}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {config.catalog.filter(permission => permission.group === group).map(permission => <label key={permission.id} className="flex items-start gap-2 text-sm text-gray-700">
                <input type="checkbox" className="mt-1 accent-emerald-600" checked={selected.includes(permission.id)} onChange={event => togglePermission(permission.id, event.target.checked)} />
                {permission.label}
              </label>)}
            </div>
          </fieldset>)}
          <div className="flex justify-end gap-3 border-t pt-4">
            <button disabled={saving} onClick={() => { setEditing(null); setError(null); }} className="rounded-lg border px-4 py-2">{editing.editable ? 'Annuler' : 'Fermer'}</button>
            {editing.editable && <button disabled={saving} onClick={() => void save()} className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer les permissions'}</button>}
          </div>
        </section>
      </div>}
    </div>
  );
};
