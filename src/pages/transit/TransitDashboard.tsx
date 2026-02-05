// @ts-nocheck
// TODO: Ce composant est legacy et sera remplacé par les nouveaux composants GLOBAL EXCHANGE
import { useState } from 'react';
import { TransitFile, TaricClassification, AdministrationTracking } from '@/types';
import { TransitFileManager } from '@/components/transit/TransitFileManager';
import { AdministrationTrackingManager } from '@/components/transit/AdministrationTrackingManager';

const mockTransitFiles: TransitFile[] = [
  {
    id: 'TF-001',
    reference: 'DAU-2024-001',
    fileType: 'DAU',
    status: 'approved',
    creationDate: '2024-01-10',
    submissionDate: '2024-01-12',
    approvalDate: '2024-01-15',
    goodsDescription: 'Machines agricoles neuves',
    originCountry: 'France',
    destinationCountry: 'Burkina Faso',
    estimatedDuties: 2500000,
    actualDuties: 2450000,
    assignedAgent: 'agent_transit1',
    client: 'AgriEquip SA'
  },
  {
    id: 'TF-002',
    reference: 'DSI-2024-001',
    fileType: 'DSI',
    status: 'in_progress',
    creationDate: '2024-01-14',
    goodsDescription: 'Produits chimiques industriels',
    originCountry: 'Allemagne',
    destinationCountry: 'Burkina Faso',
    estimatedDuties: 1800000,
    actualDuties: 0,
    assignedAgent: 'agent_transit2',
    client: 'Chemical Industries Ltd'
  },
];

const mockTaricClassifications: TaricClassification[] = [
  {
    id: 'TAR-001',
    code: '8432.10.00',
    description: 'Tracteurs agricoles',
    dutyRate: 10,
    vatRate: 18,
    additionalTaxes: [
      { id: 'AT-001', type: 'TSP', rate: 1, calculationBase: 'value' },
      { id: 'AT-002', type: 'FST', rate: 0.5, calculationBase: 'value' }
    ],
    validFrom: '2024-01-01'
  },
  {
    id: 'TAR-002',
    code: '2903.11.00',
    description: 'Hydrocarbures halogénés',
    dutyRate: 15,
    vatRate: 18,
    additionalTaxes: [
      { id: 'AT-003', type: 'TSP', rate: 1, calculationBase: 'value' }
    ],
    validFrom: '2024-01-01'
  },
];

const mockTrackings: AdministrationTracking[] = [
  {
    id: 'TRK-001',
    fileId: 'TF-001',
    administration: 'Direction des Douanes',
    status: 'approved',
    updateDate: '2024-01-15T10:30:00',
    comments: 'Dossier complet approuvé'
  },
  {
    id: 'TRK-002',
    fileId: 'TF-001',
    administration: 'ONAM',
    status: 'approved',
    updateDate: '2024-01-14T14:20:00',
    comments: 'Conformité sanitaire OK'
  },
  {
    id: 'TRK-003',
    fileId: 'TF-002',
    administration: 'Direction des Douanes',
    status: 'processing',
    updateDate: '2024-01-16T09:15:00',
    comments: 'En attente de document complémentaire'
  },
];

export const TransitDashboard = () => {
  const [files, setFiles] = useState<TransitFile[]>(mockTransitFiles);
  const [classifications, setClassifications] = useState<TaricClassification[]>(mockTaricClassifications);
  const [trackings, setTrackings] = useState<AdministrationTracking[]>(mockTrackings);

  const handleAddFile = (file: Omit<TransitFile, 'id' | 'creationDate'>) => {
    const newFile: TransitFile = {
      ...file,
      id: `TF-${files.length + 1}`,
      creationDate: new Date().toISOString().split('T')[0],
      status: 'initiated'
    };
    setFiles([...files, newFile]);
  };

  const handleUpdateFile = (id: string, updates: Partial<TransitFile>) => {
    setFiles(files.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  };

  const handleAddClassification = (classification: Omit<TaricClassification, 'id'>) => {
    const newClassification: TaricClassification = {
      ...classification,
      id: `TAR-${classifications.length + 1}`
    };
    setClassifications([...classifications, newClassification]);
  };

  const handleTrackUpdate = (tracking: Omit<AdministrationTracking, 'id'>) => {
    const newTracking: AdministrationTracking = {
      ...tracking,
      id: `TRK-${trackings.length + 1}`
    };
    setTrackings([...trackings, newTracking]);
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Transit & Douane</h1>
            <p className="text-green-100 text-lg">Gestion des dossiers de transit et conformité douanière</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div>
          <TransitFileManager 
            files={files} 
            classifications={classifications} 
            onAddFile={handleAddFile} 
            onUpdateFile={handleUpdateFile} 
            onAddClassification={handleAddClassification} 
          />
        </div>

        <div>
          <AdministrationTrackingManager 
            files={files} 
            trackings={trackings} 
            onTrackUpdate={handleTrackUpdate} 
          />
        </div>
      </div>
    </div>
  );
};