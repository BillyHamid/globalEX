// @ts-nocheck
// TODO: Ce composant est legacy et sera remplacé par les nouveaux composants GLOBAL EXCHANGE
import { useState } from 'react';
import { AccountingEntry, Lettering } from '@/types';
import { DataTable } from '@/components/common/DataTable';
import { CheckCircle, XCircle, Plus, Save } from 'lucide-react';

interface LetteringFormProps {
  entries: AccountingEntry[];
  onSubmit: (lettering: Omit<Lettering, 'id' | 'createdBy' | 'createdAt'>) => void;
  onCancel: () => void;
}

const LetteringForm = ({ entries, onSubmit, onCancel }: LetteringFormProps) => {
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [letteringDate, setLetteringDate] = useState(new Date().toISOString().split('T')[0]);
  const [letteringReference, setLetteringReference] = useState('');

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId) 
        : [...prev, entryId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEntries.length < 2) {
      alert('Veuillez sélectionner au moins 2 écritures à lettrer');
      return;
    }

    const totalAmount = entries
      .filter(entry => selectedEntries.includes(entry.id))
      .reduce((sum, entry) => sum + Math.abs(entry.debit - entry.credit), 0);

    onSubmit({
      entryIds: selectedEntries,
      letteringDate,
      letteringReference,
      totalAmount,
      status: 'pending'
    });
  };

  // Filtrer les écritures non lettrées
  const unletteredEntries = entries.filter(entry => 
    !entry.status || entry.status !== 'reversed'
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de lettrage</label>
          <input
            type="date"
            value={letteringDate}
            onChange={(e) => setLetteringDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Référence de lettrage</label>
          <input
            type="text"
            value={letteringReference}
            onChange={(e) => setLetteringReference(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3">Sélectionnez les écritures à lettrer</h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compte</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Débit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crédit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {unletteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedEntries.includes(entry.id)}
                      onChange={() => toggleEntrySelection(entry.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.accountCode} - {entry.accountLabel}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.debit.toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.credit.toLocaleString('fr-FR')} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <XCircle className="w-4 h-4 mr-1" /> Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          disabled={selectedEntries.length < 2}
        >
          <Save className="w-4 h-4 mr-1" /> Lettrer les écritures
        </button>
      </div>
    </form>
  );
};

interface LetteringManagerProps {
  letterings: Lettering[];
  entries: AccountingEntry[];
  onCreateLettering: (lettering: Omit<Lettering, 'id' | 'createdBy' | 'createdAt'>) => void;
}

export const LetteringManager = ({ letterings, entries, onCreateLettering }: LetteringManagerProps) => {
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (data: Omit<Lettering, 'id' | 'createdBy' | 'createdAt'>) => {
    onCreateLettering(data);
    setShowForm(false);
  };

  const columns = [
    { header: 'Référence', accessor: 'letteringReference' as keyof Lettering },
    { header: 'Date', accessor: 'letteringDate' as keyof Lettering },
    { 
      header: 'Montant total', 
      accessor: 'totalAmount' as keyof Lettering,
      render: (value: number) => value.toLocaleString('fr-FR') + ' FCFA'
    },
    { header: 'Statut', accessor: 'status' as keyof Lettering },
    { 
      header: 'Écritures associées', 
      accessor: 'entryIds' as keyof Lettering,
      render: (value: string[]) => value.length
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Lettrage des écritures</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" /> Nouveau lettrage
        </button>
      </div>

      {showForm && (
        <LetteringForm 
          entries={entries} 
          onSubmit={handleSubmit} 
          onCancel={() => setShowForm(false)} 
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable data={letterings} columns={columns} />
      </div>
    </div>
  );
};