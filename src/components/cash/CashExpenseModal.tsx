import { useState } from 'react';
import { X, DollarSign, Minus } from 'lucide-react';

interface CashExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountName: 'USA' | 'BURKINA';
  currency: 'USD' | 'XOF';
  currentBalance: number;
  onSuccess: () => void;
  onSubmit: (accountName: string, amount: number, description: string) => Promise<void>;
}

export const CashExpenseModal = ({
  isOpen,
  onClose,
  accountName,
  currency,
  currentBalance,
  onSuccess,
  onSubmit,
}: CashExpenseModalProps) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError('Le montant doit être positif');
      return;
    }

    if (!description.trim()) {
      setError('La description est requise');
      return;
    }

    const expenseAmount = parseFloat(amount);
    const newBalance = currentBalance - expenseAmount;

    // Avertissement si le solde devient négatif (mais on autorise quand même)
    if (newBalance < 0) {
      if (!confirm(`Attention: Cette dépense fera passer le solde à ${newBalance.toLocaleString('fr-FR')} ${currency}. Continuer ?`)) {
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit(accountName, expenseAmount, description.trim());
      setAmount('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Minus className="w-5 h-5 text-red-600" />
            Enregistrer une dépense
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compte
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="font-medium text-gray-900">
                {accountName === 'USA' ? 'Caisse USA' : 'Caisse Burkina Faso'}
              </span>
              <span className="ml-2 text-sm text-gray-500">({currency})</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Solde actuel: {currency === 'USD' ? '$' : ''}
              {currentBalance.toLocaleString('fr-FR', { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: currency === 'USD' ? 2 : 0 })}
              {currency === 'XOF' ? ' FCFA' : ''}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant ({currency}) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base"
                placeholder={currency === 'USD' ? '0.00' : '0'}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base resize-none"
              rows={3}
              placeholder="Décrivez cette dépense..."
              required
              disabled={loading}
            />
          </div>

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
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer la dépense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
