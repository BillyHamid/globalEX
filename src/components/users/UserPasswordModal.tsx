import { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import type { User } from '@/types';

interface UserPasswordModalProps {
  user: User;
  isCurrentUser: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string, confirmPassword: string) => Promise<void>;
}

export const UserPasswordModal = ({ user, isCurrentUser, onClose, onSubmit }: UserPasswordModalProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (Array.from(newPassword).length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (new TextEncoder().encode(newPassword).length > 72) {
      setError('Le mot de passe est trop long. Utilisez un mot de passe plus court.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe doivent être identiques.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(newPassword, confirmPassword);
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de modifier le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="user-password-title" className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center gap-3">
          <h2 id="user-password-title" className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 shrink-0" /> Modifier le mot de passe
          </h2>
          <button type="button" onClick={onClose} aria-label="Fermer" disabled={loading} className="text-gray-400 hover:text-gray-600 disabled:opacity-50"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-600 break-all">{user.email}</p>
          </div>
          <p className="text-sm text-gray-600">
            {isCurrentUser
              ? 'Votre session sera fermée après la modification. Reconnectez-vous avec votre nouveau mot de passe.'
              : 'Les sessions de cet utilisateur seront fermées. Il devra se reconnecter avec le nouveau mot de passe.'}
          </p>
          <div>
            <label htmlFor="user-new-password" className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
            <input id="user-new-password" name="newPassword" type="password" autoComplete="new-password" required minLength={6}
              value={newPassword} onChange={event => setNewPassword(event.target.value)} disabled={loading}
              aria-describedby="password-help" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <p id="password-help" className="mt-1 text-xs text-gray-500">6 caractères minimum.</p>
          </div>
          <div>
            <label htmlFor="user-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
            <input id="user-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required
              value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50">Annuler</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
