// @ts-nocheck
// TODO: Ce composant est legacy et sera remplacé par les nouveaux composants GLOBAL EXCHANGE
import { useState } from 'react';
import { Budget, BudgetVariance } from '@/types';
import { DataTable } from '@/components/common/DataTable';
import { Plus, Edit, TrendingUp, TrendingDown } from 'lucide-react';

interface BudgetFormProps {
  onSubmit: (budget: Omit<Budget, 'id'>) => void;
  onCancel: () => void;
  budget?: Budget;
}

const BudgetForm = ({ onSubmit, onCancel, budget }: BudgetFormProps) => {
  const [formData, setFormData] = useState({
    label: budget?.label || '',
    year: budget?.year || new Date().getFullYear(),
    amount: budget?.amount || 0,
    department: budget?.department || '',
    category: budget?.category || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'amount' ? Number(value) : value
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
          <input
            type="text"
            name="label"
            value={formData.label}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleChange}
            min="2000"
            max="2100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Montant budgété</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {budget ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

interface VarianceAnalysisProps {
  variances: BudgetVariance[];
}

const VarianceAnalysis = ({ variances }: VarianceAnalysisProps) => {
  const varianceColumns = [
    { header: 'Budget', accessor: 'budgetId' as keyof BudgetVariance },
    { 
      header: 'Montant prévu', 
      accessor: 'plannedAmount' as keyof BudgetVariance,
      render: (value: number) => value.toLocaleString('fr-FR') + ' FCFA'
    },
    { 
      header: 'Montant réel', 
      accessor: 'actualAmount' as keyof BudgetVariance,
      render: (value: number) => value.toLocaleString('fr-FR') + ' FCFA'
    },
    { 
      header: 'Écart', 
      accessor: 'varianceAmount' as keyof BudgetVariance,
      render: (value: number) => (
        <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
          {value >= 0 ? '+' : ''}{value.toLocaleString('fr-FR')} FCFA
        </span>
      )
    },
    { 
      header: '% Écart', 
      accessor: 'variancePercentage' as keyof BudgetVariance,
      render: (value: number) => (
        <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
          {value >= 0 ? '+' : ''}{value.toFixed(2)}%
        </span>
      )
    },
    { header: 'Période', accessor: 'period' as keyof BudgetVariance },
    { header: 'Explication', accessor: 'explanation' as keyof BudgetVariance },
  ];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">Analyse des écarts budgétaires</h3>
      </div>
      <DataTable data={variances} columns={varianceColumns} />
    </div>
  );
};

interface BudgetManagerProps {
  budgets: Budget[];
  variances: BudgetVariance[];
  onAddBudget: (budget: Omit<Budget, 'id'>) => void;
  onUpdateBudget: (id: string, budget: Partial<Budget>) => void;
}

export const BudgetManager = ({ budgets, variances, onAddBudget, onUpdateBudget }: BudgetManagerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const handleSubmit = (data: Omit<Budget, 'id'>) => {
    if (editingBudget) {
      onUpdateBudget(editingBudget.id, data);
    } else {
      onAddBudget(data);
    }
    setShowForm(false);
    setEditingBudget(null);
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const budgetColumns = [
    { header: 'Libellé', accessor: 'label' as keyof Budget },
    { header: 'Année', accessor: 'year' as keyof Budget },
    { 
      header: 'Montant budgété', 
      accessor: 'amount' as keyof Budget,
      render: (value: number) => value.toLocaleString('fr-FR') + ' FCFA'
    },
    { 
      header: 'Consommé', 
      accessor: 'consumed' as keyof Budget,
      render: (value: number) => value.toLocaleString('fr-FR') + ' FCFA'
    },
    { 
      header: 'Restant', 
      accessor: 'remaining' as keyof Budget,
      render: (value: number) => value.toLocaleString('fr-FR') + ' FCFA'
    },
    { header: 'Statut', accessor: 'status' as keyof Budget },
    { 
      header: 'Actions', 
      accessor: (row: Budget) => (
        <button
          onClick={() => handleEdit(row)}
          className="text-blue-600 hover:text-blue-900 flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" /> Modifier
        </button>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Gestion des budgets</h2>
        <button
          onClick={() => {
            setEditingBudget(null);
            setShowForm(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" /> Nouveau budget
        </button>
      </div>

      {showForm && (
        <BudgetForm 
          onSubmit={handleSubmit} 
          onCancel={() => {
            setShowForm(false);
            setEditingBudget(null);
          }} 
          budget={editingBudget || undefined}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable data={budgets} columns={budgetColumns} />
      </div>

      <VarianceAnalysis variances={variances} />
    </div>
  );
};