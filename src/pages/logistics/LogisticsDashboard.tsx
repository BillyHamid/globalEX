// @ts-nocheck
// TODO: Ce composant est legacy et sera remplacé par les nouveaux composants GLOBAL EXCHANGE
import { useState } from 'react';
import { DataTable } from '@/components/common/DataTable';
import { Package, Truck, Warehouse, Users, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface LogisticShipment {
  id: string;
  reference: string;
  client: string;
  origin: string;
  destination: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled' | 'customs_hold';
  amount: number;
  createdDate: string;
  deliveryDate?: string;
  carrier: string;
  weight: number;
  volume: number;
}

interface WarehouseStock {
  id: string;
  productName: string;
  productCode: string;
  quantity: number;
  reserved: number;
  available: number;
  location: string;
  lastUpdated: string;
  threshold: number;
}

interface LogisticOrder {
  id: string;
  orderNumber: string;
  client: string;
  items: number;
  status: 'draft' | 'confirmed' | 'picked' | 'packed' | 'shipped' | 'delivered';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdDate: string;
  scheduledDate: string;
  assignedWarehouse: string;
}

const mockShipments: LogisticShipment[] = [
  {
    id: 'SH-001',
    reference: 'EXP-2024-001',
    client: 'AgriEquip SA',
    origin: 'Abidjan, Côte d\'Ivoire',
    destination: 'Ouagadougou, Burkina Faso',
    status: 'in_transit',
    amount: 2500000,
    createdDate: '2024-01-10',
    deliveryDate: '2024-01-18',
    carrier: 'Transit International',
    weight: 1200,
    volume: 45
  },
  {
    id: 'SH-002',
    reference: 'IMP-2024-001',
    client: 'Chemical Industries Ltd',
    origin: 'Hamburg, Allemagne',
    destination: 'Lomé, Togo',
    status: 'customs_hold',
    amount: 1800000,
    createdDate: '2024-01-12',
    deliveryDate: '2024-01-25',
    carrier: 'EuroFreight GmbH',
    weight: 850,
    volume: 32
  },
  {
    id: 'SH-003',
    reference: 'DOM-2024-001',
    client: 'Local Distributor Co.',
    origin: 'Ouagadougou',
    destination: 'Bobo-Dioulasso',
    status: 'delivered',
    amount: 450000,
    createdDate: '2024-01-08',
    deliveryDate: '2024-01-10',
    carrier: 'National Transport',
    weight: 300,
    volume: 12
  },
];

const mockStock: WarehouseStock[] = [
  {
    id: 'STK-001',
    productName: 'Tracteur Agricole modèle X',
    productCode: 'TR-X-2024',
    quantity: 25,
    reserved: 8,
    available: 17,
    location: 'Entrepôt Principal A1',
    lastUpdated: '2024-01-15',
    threshold: 10
  },
  {
    id: 'STK-002',
    productName: 'Pièces Détachées Tracteur',
    productCode: 'PD-T-001',
    quantity: 150,
    reserved: 45,
    available: 105,
    location: 'Entrepôt Pièces Détachées B2',
    lastUpdated: '2024-01-14',
    threshold: 50
  },
  {
    id: 'STK-003',
    productName: 'Produits Chimiques Spécialisés',
    productCode: 'PC-S-2024',
    quantity: 8,
    reserved: 5,
    available: 3,
    location: 'Entrepôt Produits Dangereux C3',
    lastUpdated: '2024-01-15',
    threshold: 10
  },
];

const mockOrders: LogisticOrder[] = [
  {
    id: 'ORD-001',
    orderNumber: 'LOG-2024-001',
    client: 'AgriEquip SA',
    items: 12,
    status: 'shipped',
    priority: 'normal',
    createdDate: '2024-01-09',
    scheduledDate: '2024-01-18',
    assignedWarehouse: 'Entrepôt Principal'
  },
  {
    id: 'ORD-002',
    orderNumber: 'LOG-2024-002',
    client: 'Industrial Parts Co.',
    items: 28,
    status: 'packed',
    priority: 'high',
    createdDate: '2024-01-12',
    scheduledDate: '2024-01-16',
    assignedWarehouse: 'Entrepôt Pièces Détachées'
  },
  {
    id: 'ORD-003',
    orderNumber: 'LOG-2024-003',
    client: 'Chemical Industries Ltd',
    items: 5,
    status: 'confirmed',
    priority: 'urgent',
    createdDate: '2024-01-14',
    scheduledDate: '2024-01-15',
    assignedWarehouse: 'Entrepôt Produits Dangereux'
  },
];

export const LogisticsDashboard = () => {
  const [shipments] = useState<LogisticShipment[]>(mockShipments);
  const [stock] = useState<WarehouseStock[]>(mockStock);
  const [orders] = useState<LogisticOrder[]>(mockOrders);

  const shipmentColumns = [
    { header: 'Référence', accessor: 'reference' as keyof LogisticShipment },
    { header: 'Client', accessor: 'client' as keyof LogisticShipment },
    { header: 'Origine', accessor: 'origin' as keyof LogisticShipment },
    { header: 'Destination', accessor: 'destination' as keyof LogisticShipment },
    { 
      header: 'Statut', 
      accessor: 'status' as keyof LogisticShipment,
      render: (value: string) => (
        <div className="flex items-center">
          {value === 'pending' && <XCircle className="w-4 h-4 text-yellow-500 mr-1" />}
          {value === 'in_transit' && <Truck className="w-4 h-4 text-blue-500 mr-1" />}
          {value === 'delivered' && <CheckCircle className="w-4 h-4 text-green-500 mr-1" />}
          {value === 'cancelled' && <XCircle className="w-4 h-4 text-red-500 mr-1" />}
          {value === 'customs_hold' && <AlertTriangle className="w-4 h-4 text-orange-500 mr-1" />}
          <span>
            {value === 'pending' && 'En attente'}
            {value === 'in_transit' && 'En transit'}
            {value === 'delivered' && 'Livré'}
            {value === 'cancelled' && 'Annulé'}
            {value === 'customs_hold' && 'Retenue douane'}
          </span>
        </div>
      )
    },
    { 
      header: 'Montant', 
      accessor: 'amount' as keyof LogisticShipment,
      render: (value: number) => value.toLocaleString('fr-FR') + ' FCFA'
    },
    { 
      header: 'Poids (kg)', 
      accessor: 'weight' as keyof LogisticShipment 
    },
    { 
      header: 'Volume (m³)', 
      accessor: 'volume' as keyof LogisticShipment 
    },
  ];

  const stockColumns = [
    { header: 'Code produit', accessor: 'productCode' as keyof WarehouseStock },
    { header: 'Nom produit', accessor: 'productName' as keyof WarehouseStock },
    { 
      header: 'Quantité totale', 
      accessor: 'quantity' as keyof WarehouseStock 
    },
    { 
      header: 'Réservé', 
      accessor: 'reserved' as keyof WarehouseStock 
    },
    { 
      header: 'Disponible', 
      accessor: 'available' as keyof WarehouseStock,
      render: (value: number, row: WarehouseStock) => (
        <span className={value < row.threshold ? 'text-red-600 font-bold' : 'text-gray-900'}>
          {value}
        </span>
      )
    },
    { 
      header: 'Emplacement', 
      accessor: 'location' as keyof WarehouseStock 
    },
    { 
      header: 'Dernière mise à jour', 
      accessor: 'lastUpdated' as keyof WarehouseStock,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
  ];

  const orderColumns = [
    { header: 'N° commande', accessor: 'orderNumber' as keyof LogisticOrder },
    { header: 'Client', accessor: 'client' as keyof LogisticOrder },
    { 
      header: 'Articles', 
      accessor: 'items' as keyof LogisticOrder 
    },
    { 
      header: 'Statut', 
      accessor: 'status' as keyof LogisticOrder,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value === 'draft' ? 'bg-gray-100 text-gray-800' :
          value === 'confirmed' ? 'bg-blue-100 text-blue-800' :
          value === 'picked' ? 'bg-yellow-100 text-yellow-800' :
          value === 'packed' ? 'bg-purple-100 text-purple-800' :
          value === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value === 'draft' && 'Brouillon'}
          {value === 'confirmed' && 'Confirmé'}
          {value === 'picked' && 'Prélèvement'}
          {value === 'packed' && 'Conditionné'}
          {value === 'shipped' && 'Expédié'}
          {value === 'delivered' && 'Livré'}
        </span>
      )
    },
    { 
      header: 'Priorité', 
      accessor: 'priority' as keyof LogisticOrder,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value === 'low' ? 'bg-green-100 text-green-800' :
          value === 'normal' ? 'bg-blue-100 text-blue-800' :
          value === 'high' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value === 'low' && 'Basse'}
          {value === 'normal' && 'Normale'}
          {value === 'high' && 'Haute'}
          {value === 'urgent' && 'Urgente'}
        </span>
      )
    },
    { 
      header: 'Entrepôt assigné', 
      accessor: 'assignedWarehouse' as keyof LogisticOrder 
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 text-white rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Logistique</h1>
            <p className="text-amber-100 text-lg">Gestion des expéditions, entrepôts et commandes logistiques</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Expéditions en cours</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {shipments.filter(s => s.status === 'in_transit').length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Commandes urgentes</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {orders.filter(o => o.priority === 'urgent').length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Stock critique</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {stock.filter(s => s.available < s.threshold).length}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Suivi des expéditions
              </h2>
            </div>
            <div className="p-4">
              <DataTable data={shipments} columns={shipmentColumns} />
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-green-600" />
                Stock disponible
              </h2>
            </div>
            <div className="p-4">
              <DataTable data={stock} columns={stockColumns} />
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Commandes logistiques
              </h2>
            </div>
            <div className="p-4">
              <DataTable data={orders} columns={orderColumns} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};