// ==========================================
// GLOBAL EXCHANGE - Types & Interfaces
// ==========================================

// Rôles du système
export type Role =
  | 'admin'           // Administrateur système
  | 'supervisor'      // Superviseur des opérations
  | 'sender_agent'    // Agent expéditeur (ex: USA, France)
  | 'payer_agent';    // Agent payeur (ex: Burkina, Côte d'Ivoire)

// Statuts des transferts
export type TransferStatus =
  | 'pending'         // En attente de paiement
  | 'notified'        // Agent payeur notifié
  | 'in_progress'     // Bénéficiaire présent, en cours de traitement
  | 'paid'            // Payé au bénéficiaire
  | 'cancelled'       // Annulé
  | 'expired';        // Expiré (non réclamé)

// Méthodes de notification
export type NotificationType = 'whatsapp' | 'sms' | 'email' | 'push';

// ==========================================
// Utilisateurs & Authentification
// ==========================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  phone?: string;
  country?: string;
  agentCode?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Permission {
  module: string;
  actions: string[];
}

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
  roles: Role[];
  children?: MenuItem[];
}

// ==========================================
// Agents
// ==========================================

export interface Agent {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  country: string;
  city: string;
  address?: string;
  type: 'sender' | 'payer' | 'both';
  status: 'active' | 'inactive' | 'suspended';
  balance: number;
  commission: number; // Pourcentage de commission
  totalTransactions: number;
  totalAmount: number;
  createdAt: string;
  lastActivityAt?: string;
}

// ==========================================
// Expéditeurs & Bénéficiaires
// ==========================================

export interface Sender {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  country: string;
  city?: string;
  address?: string;
  idType?: 'passport' | 'national_id' | 'driver_license';
  idNumber?: string;
  totalTransfers: number;
  createdAt: string;
}

export interface Beneficiary {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  country: string;
  city?: string;
  address?: string;
  idType?: 'passport' | 'national_id' | 'driver_license';
  idNumber?: string;
  relationship?: string; // Lien avec l'expéditeur
  totalReceived: number;
  createdAt: string;
}

// ==========================================
// Transferts
// ==========================================

export interface Transfer {
  id: string;
  reference: string;          // Référence unique (ex: GX-2026-00001)
  
  // Montants
  amountSent: number;         // Montant envoyé
  currency: string;           // Devise (USD, EUR, XOF, etc.)
  amountReceived: number;     // Montant à recevoir (après conversion)
  receiveCurrency: string;    // Devise de réception
  exchangeRate: number;       // Taux de change appliqué
  fees: number;               // Frais de transfert
  commission: number;         // Commission agent
  
  // Acteurs
  senderId: string;
  senderName: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  
  // Agents
  senderAgentId: string;
  senderAgentName: string;
  senderAgentCountry: string;
  payerAgentId?: string;
  payerAgentName?: string;
  payerAgentCountry?: string;
  
  // Statut & Dates
  status: TransferStatus;
  createdAt: string;
  notifiedAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  expiresAt: string;
  
  // Paiement
  paymentMethod?: 'cash' | 'mobile_money' | 'bank_transfer';
  paymentProof?: string;      // URL ou référence de la preuve
  paidBy?: string;            // ID de l'agent qui a payé
  
  // Notes
  notes?: string;
  cancellationReason?: string;
}

// ==========================================
// Notifications
// ==========================================

export interface Notification {
  id: string;
  type: NotificationType;
  recipientId: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  transferId: string;
  transferReference: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  createdAt: string;
}

// ==========================================
// Transactions & Comptabilité
// ==========================================

export interface Transaction {
  id: string;
  type: 'transfer_in' | 'transfer_out' | 'commission' | 'fee' | 'adjustment';
  transferId?: string;
  transferReference?: string;
  agentId: string;
  agentName: string;
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  createdBy: string;
}

// ==========================================
// Statistiques & KPIs
// ==========================================

export interface KPI {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  color?: string;
}

export interface DailyStats {
  date: string;
  totalTransfers: number;
  totalAmount: number;
  pendingCount: number;
  paidCount: number;
  cancelledCount: number;
  fees: number;
  commissions: number;
}

export interface AgentStats {
  agentId: string;
  agentName: string;
  country: string;
  totalSent: number;
  totalPaid: number;
  pendingCount: number;
  averageProcessingTime: number; // En minutes
  successRate: number; // Pourcentage
}

// ==========================================
// Configuration & Paramètres
// ==========================================

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  validFrom: string;
  validUntil?: string;
  createdBy: string;
  createdAt: string;
}

export interface FeeStructure {
  id: string;
  minAmount: number;
  maxAmount: number;
  feeType: 'fixed' | 'percentage';
  feeValue: number;
  currency: string;
  isActive: boolean;
}

export interface Country {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  flag?: string;
}

// ==========================================
// Audit & Logs
// ==========================================

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  entityId?: string;
  entityType?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ==========================================
// Legacy Types (pour rétrocompatibilité)
// ==========================================

// Types pour la comptabilité
export interface AccountingEntry {
  id: string;
  reference: string;
  date: string;
  accountCode: string;
  accountLabel: string;
  debit: number;
  credit: number;
  description: string;
  journal: string;
  status: 'draft' | 'posted' | 'reversed';
  createdBy: string;
  createdAt: string;
  validatedBy?: string;
  validatedAt?: string;
}

export interface Lettering {
  id: string;
  entryIds: string[];
  letteringDate: string;
  letteringReference: string;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
}

export interface TaxPackage {
  id: string;
  year: number;
  period: string;
  status: 'draft' | 'submitted' | 'validated';
  submissionDate?: string;
  validationDate?: string;
  documents: TaxDocument[];
}

export interface TaxDocument {
  id: string;
  type: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Budget {
  id: string;
  label: string;
  year: number;
  amount: number;
  allocated: number;
  consumed: number;
  remaining: number;
  status: 'draft' | 'approved' | 'locked';
  department?: string;
  category?: string;
}

export interface BudgetVariance {
  id: string;
  budgetId: string;
  varianceAmount: number;
  variancePercentage: number;
  actualAmount: number;
  plannedAmount: number;
  period: string;
  explanation?: string;
}

// Types pour le transit/douane
export interface TransitFile {
  id: string;
  reference: string;
  fileType: 'DAU' | 'DSI';
  status: 'initiated' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'closed';
  creationDate: string;
  submissionDate?: string;
  approvalDate?: string;
  goodsDescription: string;
  originCountry: string;
  destinationCountry: string;
  estimatedDuties: number;
  actualDuties: number;
  assignedAgent: string;
  client: string;
}

export interface TaricClassification {
  id: string;
  code: string;
  description: string;
  dutyRate: number;
  vatRate: number;
  additionalTaxes: TaxRate[];
  validFrom: string;
  validUntil?: string;
}

export interface TaxRate {
  id: string;
  type: string;
  rate: number;
  calculationBase: string;
}

export interface TransitWorkflow {
  id: string;
  fileId: string;
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  assignedTo: string;
  startDate: string;
  endDate?: string;
  comments?: string;
}

export interface AdministrationTracking {
  id: string;
  fileId: string;
  administration: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  updateDate: string;
  comments?: string;
}

// Legacy types for old components
export interface Shipment {
  id: string;
  reference: string;
  client: string;
  origin: string;
  destination: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  amount: number;
  createdDate: string;
  deliveryDate?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  totalShipments: number;
  totalAmount: number;
  createdDate: string;
}
