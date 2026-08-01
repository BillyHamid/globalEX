import { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { User, Role } from '@/types';
import { getRoleLabel } from '@/utils/roleConfig';

export interface UserFormValues {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: Role;
  country: string;
  agentCode: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  /** Utilisateur à modifier ; si absent, le modal est en mode création */
  user?: User | null;
}

const ROLES: Role[] = ['admin', 'supervisor', 'sender_agent', 'payer_agent'];

const emptyForm: UserFormValues = {
  email: '',
  password: '',
  name: '',
  phone: '',
  role: 'sender_agent',
  country: '',
  agentCode: '',
};

export const UserFormModal = ({ isOpen, onClose, onSubmit, user }: UserFormModalProps) => {
  const isEditMode = Boolean(user);
  const [form, setForm] = useState<UserFormValues>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setForm(
      user
        ? {
            email: user.email,
            password: '',
            name: user.name,
            phone: user.phone || '',
            role: user.role,
            country: user.country || '',
            agentCode: user.agentCode || '',
          }
        : emptyForm
    );
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleChange = (field: keyof UserFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email.trim()) {
      setError("L'email est requis");
      return;
    }
    if (!isEditMode && form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (!form.name.trim()) {
      setError('Le nom est requis');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {isEditMode ? "Modifier l'utilisateur" : 'Ajouter un utilisateur'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
              placeholder="Jean Dupont"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="jean.dupont@globalexchange.com"
              required
              disabled={loading || isEditMode}
            />
          </div>

          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                placeholder="6 caractères minimum"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rôle *</label>
            <select
              value={form.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
              required
              disabled={loading}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
              placeholder="+225 07 12 34 56"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
              placeholder="Côte d'Ivoire"
              disabled={loading}
            />
          </div>

          {(form.role === 'sender_agent' || form.role === 'payer_agent') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code agent</label>
              <input
                type="text"
                value={form.agentCode}
                onChange={(e) => handleChange('agentCode', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                placeholder="CI-001"
                disabled={loading}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : isEditMode ? (
                'Enregistrer'
              ) : (
                "Créer l'utilisateur"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
