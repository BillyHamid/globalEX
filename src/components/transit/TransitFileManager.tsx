// @ts-nocheck
// TODO: Ce composant est legacy et sera remplacé par les nouveaux composants GLOBAL EXCHANGE
import { useState } from 'react';
import { TransitFile, TaricClassification } from '@/types';
import { DataTable } from '@/components/common/DataTable';
import { Plus, Edit, Package, FileText, Search } from 'lucide-react';

interface TransitFileFormProps {
  onSubmit: (file: Omit<TransitFile, 'id' | 'creationDate'>) => void;
  onCancel: () => void;
  file?: TransitFile;
}

const TransitFileForm = ({ onSubmit, onCancel, file }: TransitFileFormProps) => {
  const [formData, setFormData] = useState({
    reference: file?.reference || '',
    fileType: file?.fileType || 'DAU',
    status: file?.status || 'initiated',
    goodsDescription: file?.goodsDescription || '',
    originCountry: file?.originCountry || '',
    destinationCountry: file?.destinationCountry || '',
    estimatedDuties: file?.estimatedDuties || 0,
    assignedAgent: file?.assignedAgent || '',
    client: file?.client || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedDuties' ? Number(value) : value
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de dossier</label>
          <select
            name="fileType"
            value={formData.fileType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="DAU">DAU (Déclaration d'Accompagnement des Usages)</option>
            <option value="DSI">DSI (Déclaration Sommaire d'Importation)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="initiated">Initié</option>
            <option value="in_progress">En cours</option>
            <option value="submitted">Soumis</option>
            <option value="approved">Approuvé</option>
            <option value="rejected">Rejeté</option>
            <option value="closed">Clôturé</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agent assigné</label>
          <input
            type="text"
            name="assignedAgent"
            value={formData.assignedAgent}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
          <input
            type="text"
            name="client"
            value={formData.client}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pays d'origine</label>
          <input
            type="text"
            name="originCountry"
            value={formData.originCountry}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pays de destination</label>
          <input
            type="text"
            name="destinationCountry"
            value={formData.destinationCountry}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Droits estimés (FCFA)</label>
          <input
            type="number"
            name="estimatedDuties"
            value={formData.estimatedDuties}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description des marchandises</label>
        <textarea
          name="goodsDescription"
          value={formData.goodsDescription}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        ></textarea>
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
          {file ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

interface TaricClassificationFormProps {
  onSubmit: (classification: Omit<TaricClassification, 'id'>) => void;
  onCancel: () => void;
  classification?: TaricClassification;
}

const TaricClassificationForm = ({ onSubmit, onCancel, classification }: TaricClassificationFormProps) => {
  const [formData, setFormData] = useState({
    code: classification?.code || '',
    description: classification?.description || '',
    dutyRate: classification?.dutyRate || 0,
    vatRate: classification?.vatRate || 0,
    validFrom: classification?.validFrom || new Date().toISOString().split('T')[0]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'dutyRate' || name === 'vatRate' ? Number(value) : value
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Code TARIC</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Taux de droits (%)</label>
          <input
            type="number"
            name="dutyRate"
            value={formData.dutyRate}
            onChange={handleChange}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Taux TVA (%)</label>
          <input
            type="number"
            name="vatRate"
            value={formData.vatRate}
            onChange={handleChange}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valable à partir de</label>
          <input
            type="date"
            name="validFrom"
            value={formData.validFrom}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        ></textarea>
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
          {classification ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

interface TransitFileManagerProps {
  files: TransitFile[];
  classifications: TaricClassification[];
  onAddFile: (file: Omit<TransitFile, 'id' | 'creationDate'>) => void;
  onUpdateFile: (id: string, file: Partial<TransitFile>) => void;
  onAddClassification: (classification: Omit<TaricClassification, 'id'>) => void;
}

export const TransitFileManager = ({ 
  files, 
  classifications, 
  onAddFile, 
  onUpdateFile, 
  onAddClassification 
}: TransitFileManagerProps) => {
  const [showFileForm, setShowFileForm] = useState(false);
  const [showClassificationForm, setShowClassificationForm] = useState(false);
  const [editingFile, setEditingFile] = useState<TransitFile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileSubmit = (data: Omit<TransitFile, 'id' | 'creationDate'>) => {
    if (editingFile) {
      onUpdateFile(editingFile.id, data);
    } else {
      onAddFile(data);
    }
    setShowFileForm(false);
    setEditingFile(null);
  };

  const handleEditFile = (file: TransitFile) => {
    setEditingFile(file);
    setShowFileForm(true);
  };

  const handleClassificationSubmit = (data: Omit<TaricClassification, 'id'>) => {
    onAddClassification(data);
    setShowClassificationForm(false);
  };

  // Colonnes pour les dossiers de transit
  const fileColumns = [
    { header: 'Référence', accessor: 'reference' as keyof TransitFile },
    { header: 'Type', accessor: 'fileType' as keyof TransitFile },
    { header: 'Statut', accessor: 'status' as keyof TransitFile },
    { header: 'Client', accessor: 'client' as keyof TransitFile },
    { 
      header: 'Droits estimés', 
      accessor: 'estimatedDuties' as keyof TransitFile,
      render: (value: number) => value.toLocaleString('fr-FR') + ' FCFA'
    },
    { 
      header: 'Agent assigné', 
      accessor: 'assignedAgent' as keyof TransitFile 
    },
    { 
      header: 'Actions', 
      accessor: (row: TransitFile) => (
        <button
          onClick={() => handleEditFile(row)}
          className="text-blue-600 hover:text-blue-900 flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" /> Modifier
        </button>
      )
    },
  ];

  // Colonnes pour les classifications TARIC
  const classificationColumns = [
    { header: 'Code', accessor: 'code' as keyof TaricClassification },
    { header: 'Description', accessor: 'description' as keyof TaricClassification },
    { header: 'Taux de droits (%)', accessor: 'dutyRate' as keyof TaricClassification },
    { header: 'Taux TVA (%)', accessor: 'vatRate' as keyof TaricClassification },
    { header: 'Valable à partir', accessor: 'validFrom' as keyof TaricClassification },
  ];

  // Filtrer les dossiers en fonction du terme de recherche
  const filteredFiles = files.filter(file => 
    file.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.goodsDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Gestion des dossiers de transit</h2>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={() => {
              setEditingFile(null);
              setShowFileForm(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" /> Nouveau dossier
          </button>
          <button
            onClick={() => setShowClassificationForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <FileText className="w-4 h-4 mr-1" /> Classification TARIC
          </button>
        </div>
      </div>

      {showFileForm && (
        <TransitFileForm 
          onSubmit={handleFileSubmit} 
          onCancel={() => {
            setShowFileForm(false);
            setEditingFile(null);
          }} 
          file={editingFile || undefined}
        />
      )}

      {showClassificationForm && (
        <TaricClassificationForm 
          onSubmit={handleClassificationSubmit} 
          onCancel={() => setShowClassificationForm(false)} 
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable data={filteredFiles} columns={fileColumns} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center">
          <FileText className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-800">Classifications TARIC</h3>
        </div>
        <DataTable data={classifications} columns={classificationColumns} />
      </div>
    </div>
  );
};