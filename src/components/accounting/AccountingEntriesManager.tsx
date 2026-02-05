// @ts-nocheck
// TODO: Ce composant est legacy et sera remplacé par les nouveaux composants GLOBAL EXCHANGE
import { useState } from 'react';
import { AccountingEntry } from '@/types';
import { DataTable } from '@/components/common/DataTable';
import { Plus, Save, X } from 'lucide-react';

interface AccountingEntryFormProps {
  onSubmit: (entry: Omit<AccountingEntry, 'id' | 'createdBy' | 'createdAt' | 'status'>) => void;
  onCancel: () => void;
}

const AccountingEntryForm = ({ onSubmit, onCancel }: AccountingEntryFormProps) => {
  const [formData, setFormData] = useState({
    reference: '',
    date: new Date().toISOString().split('T')[0],
    accountCode: '',
    accountLabel: '',
    debit: 0,
    credit: 0,
    description: '',
    journal: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('debit') || name.includes('credit') ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
          <input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code compte</label>
          <input
            type="text"
            name="accountCode"
            value={formData.accountCode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Libellé compte</label>
          <input
            type="text"
            name="accountLabel"
            value={formData.accountLabel}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Débit</label>
          <input
            type="number"
            name="debit"
            value={formData.debit}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Crédit</label>
          <input
            type="number"
            name="credit"
            value={formData.credit}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Journal</label>
          <input
            type="text"
            name="journal"
            value={formData.journal}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <X className="w-4 h-4 mr-1" /> Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Save className="w-4 h-4 mr-1" /> Enregistrer
        </button>
      </div>
    </form>
  );
};

interface AccountingEntriesManagerProps {
  entries: AccountingEntry[];
  onAddEntry: (entry: Omit<AccountingEntry, 'id' | 'createdBy' | 'createdAt' | 'status'>) => void;
}

export const AccountingEntriesManager = ({ entries, onAddEntry }: AccountingEntriesManagerProps) => {
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (data: Omit<AccountingEntry, 'id' | 'createdBy' | 'createdAt' | 'status'>) => {
    onAddEntry(data);
    setShowForm(false);
  };

  const columns = [
    { header: 'Référence', accessor: 'reference' as keyof AccountingEntry },
    { header: 'Date', accessor: 'date' as keyof AccountingEntry },
    { header: 'Code compte', accessor: 'accountCode' as keyof AccountingEntry },
    { header: 'Libellé compte', accessor: 'accountLabel' as keyof AccountingEntry },
    { 
      header: 'Débit', 
      accessor: 'debit' as keyof AccountingEntry,
      render: (value: number) => value.toLocaleString('fr-FR') + ' FCFA'
    },
    { 
      header: 'Crédit', 
      accessor: 'credit' as keyof AccountingEntry,
      render: (value: number) => value.toLocaleString('fr-FR') + ' FCFA'
    },
    { header: 'Journal', accessor: 'journal' as keyof AccountingEntry },
    { header: 'Statut', accessor: 'status' as keyof AccountingEntry },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Saisie des écritures comptables</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" /> Nouvelle écriture
        </button>
      </div>

      {showForm && (
        <AccountingEntryForm 
          onSubmit={handleSubmit} 
          onCancel={() => setShowForm(false)} 
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable data={entries} columns={columns} />
      </div>
    </div>
  );
};