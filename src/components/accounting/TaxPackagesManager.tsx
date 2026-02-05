// @ts-nocheck
// TODO: Ce composant est legacy et sera remplacé par les nouveaux composants GLOBAL EXCHANGE
import { useState } from 'react';
import { TaxPackage, TaxDocument } from '@/types';
import { DataTable } from '@/components/common/DataTable';
import { FileText, Upload, Download, Eye, Plus, CheckCircle, XCircle } from 'lucide-react';

interface TaxPackageFormProps {
  onSubmit: (pkg: Omit<TaxPackage, 'id' | 'documents'>) => void;
  onCancel: () => void;
  pkg?: TaxPackage;
}

const TaxPackageForm = ({ onSubmit, onCancel, pkg }: TaxPackageFormProps) => {
  const [formData, setFormData] = useState({
    year: pkg?.year || new Date().getFullYear(),
    period: pkg?.period || 'annual',
    status: pkg?.status || 'draft'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? Number(value) : value
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
          <select
            name="period"
            value={formData.period}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="annual">Annuel</option>
            <option value="first_quarter">Premier trimestre</option>
            <option value="second_quarter">Deuxième trimestre</option>
            <option value="third_quarter">Troisième trimestre</option>
            <option value="fourth_quarter">Quatrième trimestre</option>
            <option value="first_semester">Premier semestre</option>
            <option value="second_semester">Second semestre</option>
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
            <option value="draft">Brouillon</option>
            <option value="submitted">Soumis</option>
            <option value="validated">Validé</option>
          </select>
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
          {pkg ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

interface DocumentUploadFormProps {
  onUpload: (document: Omit<TaxDocument, 'id' | 'uploadedAt' | 'uploadedBy'>) => void;
  onCancel: () => void;
  pkgId: string;
}

const DocumentUploadForm = ({ onUpload, onCancel, pkgId }: DocumentUploadFormProps) => {
  const [formData, setFormData] = useState({
    type: '',
    fileName: '',
    filePath: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpload(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de document</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Sélectionner un type</option>
            <option value="balance_sheet">Bilan</option>
            <option value="income_statement">Compte de résultat</option>
            <option value="cash_flow">État de flux de trésorerie</option>
            <option value="tax_return">Déclaration fiscale</option>
            <option value="audit_report">Rapport d'audit</option>
            <option value="compliance_certificate">Certificat de conformité</option>
            <option value="other">Autre</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom du fichier</label>
          <input
            type="text"
            name="fileName"
            value={formData.fileName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chemin d'accès</label>
          <input
            type="text"
            name="filePath"
            value={formData.filePath}
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
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Upload className="w-4 h-4 mr-1" /> Télécharger
        </button>
      </div>
    </form>
  );
};

interface TaxPackagesManagerProps {
  packages: TaxPackage[];
  documents: TaxDocument[];
  onAddPackage: (pkg: Omit<TaxPackage, 'id' | 'documents'>) => void;
  onUpdatePackage: (id: string, pkg: Partial<TaxPackage>) => void;
  onAddDocument: (doc: Omit<TaxDocument, 'id' | 'uploadedAt' | 'uploadedBy'>) => void;
}

export const TaxPackagesManager = ({ 
  packages, 
  documents, 
  onAddPackage, 
  onUpdatePackage, 
  onAddDocument 
}: TaxPackagesManagerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<TaxPackage | null>(null);

  const handleSubmit = (data: Omit<TaxPackage, 'id' | 'documents'>) => {
    if (editingPackage) {
      onUpdatePackage(editingPackage.id, data);
    } else {
      onAddPackage(data);
    }
    setShowForm(false);
    setEditingPackage(null);
  };

  const handleUploadSubmit = (data: Omit<TaxDocument, 'id' | 'uploadedAt' | 'uploadedBy'>) => {
    if (selectedPackage) {
      onAddDocument(data);
      setShowUploadForm(false);
      setSelectedPackage(null);
    }
  };

  const handleEdit = (pkg: TaxPackage) => {
    setEditingPackage(pkg);
    setShowForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'validated': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const packageColumns = [
    { header: 'Année', accessor: 'year' as keyof TaxPackage },
    { header: 'Période', accessor: 'period' as keyof TaxPackage },
    { 
      header: 'Statut', 
      accessor: 'status' as keyof TaxPackage,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value === 'draft' && 'Brouillon'}
          {value === 'submitted' && 'Soumis'}
          {value === 'validated' && 'Validé'}
        </span>
      )
    },
    { 
      header: 'Documents', 
      accessor: 'documents' as keyof TaxPackage,
      render: (value: TaxDocument[]) => value.length
    },
    { 
      header: 'Actions', 
      accessor: (row: TaxPackage) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedPackage(row.id);
              setShowUploadForm(true);
            }}
            className="text-blue-600 hover:text-blue-900 flex items-center"
          >
            <Upload className="w-4 h-4 mr-1" /> Doc
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="text-green-600 hover:text-green-900 flex items-center"
          >
            <FileText className="w-4 h-4 mr-1" /> Modifier
          </button>
        </div>
      )
    },
  ];

  const documentColumns = [
    { header: 'Type', accessor: 'type' as keyof TaxDocument },
    { header: 'Nom du fichier', accessor: 'fileName' as keyof TaxDocument },
    { 
      header: 'Téléchargé le', 
      accessor: 'uploadedAt' as keyof TaxDocument,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { 
      header: 'Actions', 
      accessor: (row: TaxDocument) => (
        <div className="flex space-x-2">
          <button className="text-blue-600 hover:text-blue-900 flex items-center">
            <Download className="w-4 h-4 mr-1" /> Télécharger
          </button>
          <button className="text-green-600 hover:text-green-900 flex items-center">
            <Eye className="w-4 h-4 mr-1" /> Voir
          </button>
        </div>
      )
    },
  ];

  // Obtenir les documents du paquet sélectionné
  const packageDocuments = selectedPackage 
    ? documents.filter(doc => doc.id.startsWith(selectedPackage)) 
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Gestion des liasses fiscales</h2>
        <button
          onClick={() => {
            setEditingPackage(null);
            setShowForm(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" /> Nouvelle liasse
        </button>
      </div>

      {showForm && (
        <TaxPackageForm 
          onSubmit={handleSubmit} 
          onCancel={() => {
            setShowForm(false);
            setEditingPackage(null);
          }} 
          pkg={editingPackage || undefined}
        />
      )}

      {showUploadForm && selectedPackage && (
        <DocumentUploadForm 
          onUpload={handleUploadSubmit} 
          onCancel={() => {
            setShowUploadForm(false);
            setSelectedPackage(null);
          }} 
          pkgId={selectedPackage}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable data={packages} columns={packageColumns} />
      </div>

      {selectedPackage && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-800">
              Documents de la liasse: {packages.find(p => p.id === selectedPackage)?.year}
            </h3>
          </div>
          <DataTable data={packageDocuments} columns={documentColumns} />
        </div>
      )}
    </div>
  );
};