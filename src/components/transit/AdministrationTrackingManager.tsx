// @ts-nocheck
// TODO: Ce composant est legacy et sera remplacé par les nouveaux composants GLOBAL EXCHANGE
import { useState } from 'react';
import { AdministrationTracking, TransitFile } from '@/types';
import { DataTable } from '@/components/common/DataTable';
import { Eye, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface TrackingDetailProps {
  tracking: AdministrationTracking;
}

const TrackingDetail = ({ tracking }: TrackingDetailProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="border-l-4 border-blue-500 pl-4 py-2 ml-2">
      <div className="flex items-center justify-between">
        <div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tracking.status)}`}>
            {tracking.status === 'pending' && 'En attente'}
            {tracking.status === 'processing' && 'En traitement'}
            {tracking.status === 'approved' && 'Approuvé'}
            {tracking.status === 'rejected' && 'Rejeté'}
          </span>
          <p className="text-sm text-gray-600 mt-1">{tracking.administration}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{new Date(tracking.updateDate).toLocaleDateString()}</p>
          {tracking.comments && (
            <p className="text-xs text-gray-600 mt-1 italic">"{tracking.comments}"</p>
          )}
        </div>
      </div>
    </div>
  );
};

interface FileTrackingViewProps {
  file: TransitFile;
  trackings: AdministrationTracking[];
}

const FileTrackingView = ({ file, trackings }: FileTrackingViewProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'processing': return 'text-yellow-600';
      case 'pending': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{file.reference} - {file.fileType}</h3>
          <p className="text-gray-600">{file.goodsDescription}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(file.status)}`}>
          {file.status === 'initiated' && 'Initié'}
          {file.status === 'in_progress' && 'En cours'}
          {file.status === 'submitted' && 'Soumis'}
          {file.status === 'approved' && 'Approuvé'}
          {file.status === 'rejected' && 'Rejeté'}
          {file.status === 'closed' && 'Clôturé'}
        </span>
      </div>

      <div className="border-l-2 border-gray-200 pl-4">
        {trackings.map((tracking, index) => (
          <TrackingDetail key={index} tracking={tracking} />
        ))}
      </div>
    </div>
  );
};

interface AdministrationTrackingManagerProps {
  files: TransitFile[];
  trackings: AdministrationTracking[];
  onTrackUpdate: (tracking: Omit<AdministrationTracking, 'id'>) => void;
}

export const AdministrationTrackingManager = ({ 
  files, 
  trackings, 
  onTrackUpdate 
}: AdministrationTrackingManagerProps) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleTrackUpdate = () => {
    if (!selectedFile) return;
    
    const newTracking: Omit<AdministrationTracking, 'id'> = {
      fileId: selectedFile,
      administration: 'Direction des Douanes',
      status: 'pending',
      updateDate: new Date().toISOString(),
      comments: 'Nouvelle mise à jour'
    };
    
    onTrackUpdate(newTracking);
  };

  const fileColumns = [
    { header: 'Référence', accessor: 'reference' as keyof TransitFile },
    { header: 'Type', accessor: 'fileType' as keyof TransitFile },
    { header: 'Client', accessor: 'client' as keyof TransitFile },
    { header: 'Statut', accessor: 'status' as keyof TransitFile },
    { 
      header: 'Pays destination', 
      accessor: 'destinationCountry' as keyof TransitFile 
    },
    { 
      header: 'Actions', 
      accessor: (row: TransitFile) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedFile(row.id);
              setShowDetails(true);
            }}
            className="text-blue-600 hover:text-blue-900 flex items-center"
          >
            <Eye className="w-4 h-4 mr-1" /> Suivre
          </button>
        </div>
      )
    },
  ];

  const trackingColumns = [
    { header: 'Dossier', accessor: 'fileId' as keyof AdministrationTracking },
    { header: 'Administration', accessor: 'administration' as keyof AdministrationTracking },
    { header: 'Statut', accessor: 'status' as keyof AdministrationTracking },
    { 
      header: 'Date', 
      accessor: 'updateDate' as keyof AdministrationTracking,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { header: 'Commentaires', accessor: 'comments' as keyof AdministrationTracking },
  ];

  const filteredTrackings = selectedFile 
    ? trackings.filter(t => t.fileId === selectedFile) 
    : trackings;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Suivi des dossiers - Liaisons administrations</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Liste des dossiers</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <DataTable data={files} columns={fileColumns} />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Suivi des administrations</h3>
            {selectedFile && (
              <button
                onClick={handleTrackUpdate}
                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                <ExternalLink className="w-3 h-3 mr-1" /> Nouvelle mise à jour
              </button>
            )}
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <DataTable data={filteredTrackings} columns={trackingColumns} />
          </div>
        </div>
      </div>

      {showDetails && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Détails du suivi</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <FileTrackingView 
                file={files.find(f => f.id === selectedFile)!} 
                trackings={trackings.filter(t => t.fileId === selectedFile)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};