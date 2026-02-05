// @ts-nocheck
// TODO: Ce composant est legacy et sera remplacé par les nouveaux composants GLOBAL EXCHANGE
import { useState } from 'react';
import { DataTable } from '@/components/common/DataTable';
import { FileText, Eye, Download, Upload, Filter, Calendar, User } from 'lucide-react';

interface AuditTrail {
  id: string;
  date: string;
  user: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ComplianceReport {
  id: string;
  title: string;
  date: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  author: string;
  ohadaCompliant: boolean;
  reportType: string;
  filePath: string;
}

interface AuditTrailManagerProps {
  trails: AuditTrail[];
  reports: ComplianceReport[];
  onExport: (reportIds: string[]) => void;
}

export const AuditTrailManager = ({ trails, reports, onExport }: AuditTrailManagerProps) => {
  const [selectedTrails, setSelectedTrails] = useState<string[]>([]);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [filterModule, setFilterModule] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [viewMode, setViewMode] = useState<'trails' | 'reports'>('trails');

  const toggleTrailSelection = (id: string) => {
    setSelectedTrails(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const toggleReportSelection = (id: string) => {
    setSelectedReports(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAllTrails = () => {
    if (selectedTrails.length === filteredTrails.length) {
      setSelectedTrails([]);
    } else {
      setSelectedTrails(filteredTrails.map(trail => trail.id));
    }
  };

  const selectAllReports = () => {
    if (selectedReports.length === filteredReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(filteredReports.map(report => report.id));
    }
  };

  const handleExportSelected = () => {
    if (viewMode === 'reports') {
      onExport(selectedReports);
    }
  };

  // Filtrer les trails
  const filteredTrails = trails.filter(trail => {
    return (
      (filterModule ? trail.module.toLowerCase().includes(filterModule.toLowerCase()) : true) &&
      (filterUser ? trail.user.toLowerCase().includes(filterUser.toLowerCase()) : true) &&
      (filterDate ? trail.date.startsWith(filterDate) : true)
    );
  });

  // Filtrer les rapports
  const filteredReports = reports.filter(report => {
    return (
      (filterModule ? report.reportType.toLowerCase().includes(filterModule.toLowerCase()) : true) &&
      (filterUser ? report.author.toLowerCase().includes(filterUser.toLowerCase()) : true) &&
      (filterDate ? report.date.startsWith(filterDate) : true)
    );
  });

  const trailColumns = [
    { 
      header: (
        <input
          type="checkbox"
          checked={selectedTrails.length === filteredTrails.length && filteredTrails.length > 0}
          onChange={selectAllTrails}
          className="rounded text-blue-600 focus:ring-blue-500"
        />
      ),
      accessor: (row: AuditTrail) => (
        <input
          type="checkbox"
          checked={selectedTrails.includes(row.id)}
          onChange={() => toggleTrailSelection(row.id)}
          className="rounded text-blue-600 focus:ring-blue-500"
        />
      )
    },
    { 
      header: 'Date', 
      accessor: 'date' as keyof AuditTrail,
      render: (value: string) => new Date(value).toLocaleString()
    },
    { 
      header: 'Utilisateur', 
      accessor: 'user' as keyof AuditTrail,
      render: (value: string) => (
        <div className="flex items-center">
          <User className="w-4 h-4 mr-2 text-gray-500" />
          {value}
        </div>
      )
    },
    { header: 'Action', accessor: 'action' as keyof AuditTrail },
    { header: 'Module', accessor: 'module' as keyof AuditTrail },
    { 
      header: 'Détails', 
      accessor: 'details' as keyof AuditTrail,
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      )
    },
  ];

  const reportColumns = [
    { 
      header: (
        <input
          type="checkbox"
          checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
          onChange={selectAllReports}
          className="rounded text-blue-600 focus:ring-blue-500"
        />
      ),
      accessor: (row: ComplianceReport) => (
        <input
          type="checkbox"
          checked={selectedReports.includes(row.id)}
          onChange={() => toggleReportSelection(row.id)}
          className="rounded text-blue-600 focus:ring-blue-500"
        />
      )
    },
    { 
      header: 'Date', 
      accessor: 'date' as keyof ComplianceReport,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { header: 'Titre', accessor: 'title' as keyof ComplianceReport },
    { 
      header: 'Type', 
      accessor: 'reportType' as keyof ComplianceReport 
    },
    { 
      header: 'Auteur', 
      accessor: 'author' as keyof ComplianceReport 
    },
    { 
      header: 'Conformité OHADA', 
      accessor: 'ohadaCompliant' as keyof ComplianceReport,
      render: (value: boolean) => (
        <span className={value ? 'text-green-600' : 'text-red-600'}>
          {value ? 'Conforme' : 'Non conforme'}
        </span>
      )
    },
    { 
      header: 'Statut', 
      accessor: 'status' as keyof ComplianceReport,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          value === 'reviewed' ? 'bg-blue-100 text-blue-800' :
          value === 'approved' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value === 'pending' && 'En attente'}
          {value === 'reviewed' && 'Revu'}
          {value === 'approved' && 'Approuvé'}
          {value === 'rejected' && 'Rejeté'}
        </span>
      )
    },
    { 
      header: 'Actions', 
      accessor: (row: ComplianceReport) => (
        <div className="flex space-x-2">
          <button className="text-blue-600 hover:text-blue-900 flex items-center">
            <Eye className="w-4 h-4 mr-1" /> Voir
          </button>
          <button className="text-green-600 hover:text-green-900 flex items-center">
            <Download className="w-4 h-4 mr-1" /> Télécharger
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Audit Trail & Conformité OHADA</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('trails')}
              className={`px-4 py-2 rounded-md ${
                viewMode === 'trails' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Journal d'audit
            </button>
            <button
              onClick={() => setViewMode('reports')}
              className={`px-4 py-2 rounded-md ${
                viewMode === 'reports' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rapports de conformité
            </button>
          </div>
          <button
            onClick={handleExportSelected}
            disabled={selectedReports.length === 0}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4 mr-1" /> Exporter sélection
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Filtrer par module..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
          />
          <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Filtrer par utilisateur..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
          />
          <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <div className="relative">
          <input
            type="date"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {viewMode === 'trails' ? (
          <DataTable data={filteredTrails} columns={trailColumns} />
        ) : (
          <DataTable data={filteredReports} columns={reportColumns} />
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
          <FileText className="w-5 h-5 text-blue-600 mr-2" />
          Informations sur la conformité OHADA
        </h3>
        <div className="prose max-w-none text-gray-600">
          <p>
            Le système assure le suivi de la conformité aux normes OHADA (Organisation pour l'Harmonisation 
            en Afrique du Droit des Affaires) pour garantir que les pratiques comptables et juridiques 
            respectent les standards régionaux.
          </p>
          <p className="mt-2">
            Les rapports de conformité sont générés périodiquement pour valider que les processus internes 
            respectent les exigences OHADA en matière de tenue de la comptabilité, de certification des 
            états financiers et de reporting réglementaire.
          </p>
        </div>
      </div>
    </div>
  );
};