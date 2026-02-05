// @ts-nocheck
// TODO: Ce composant est legacy et sera remplacé par les nouveaux composants GLOBAL EXCHANGE
import { useState } from 'react';
import { AccountingEntry, Lettering, Budget, BudgetVariance, TaxPackage, TaxDocument } from '@/types';
import { AccountingEntriesManager } from '@/components/accounting/AccountingEntriesManager';
import { LetteringManager } from '@/components/accounting/LetteringManager';
import { BudgetManager } from '@/components/accounting/BudgetManager';
import { TaxPackagesManager } from '@/components/accounting/TaxPackagesManager';
import { AuditTrailManager } from '@/components/accounting/AuditTrailManager';

const mockAccountingEntries: AccountingEntry[] = [
  {
    id: 'AE-001',
    reference: 'ENT-2024-001',
    date: '2024-01-15',
    accountCode: '411',
    accountLabel: 'Clients',
    debit: 1500000,
    credit: 0,
    description: 'Vente de marchandises à crédit',
    journal: 'Ventes',
    status: 'posted',
    createdBy: 'comptable1',
    createdAt: '2024-01-15T09:30:00',
  },
  {
    id: 'AE-002',
    reference: 'ENT-2024-002',
    date: '2024-01-16',
    accountCode: '512',
    accountLabel: 'Banque',
    debit: 0,
    credit: 1500000,
    description: 'Encaissement client',
    journal: 'Banque',
    status: 'posted',
    createdBy: 'comptable1',
    createdAt: '2024-01-16T10:15:00',
  },
];

const mockLetterings: Lettering[] = [
  {
    id: 'LET-001',
    entryIds: ['AE-001', 'AE-002'],
    letteringDate: '2024-01-16',
    letteringReference: 'LTR-2024-001',
    totalAmount: 1500000,
    status: 'completed',
    createdBy: 'comptable1',
    createdAt: '2024-01-16T11:00:00',
  },
];

const mockBudgets: Budget[] = [
  {
    id: 'BUD-001',
    label: 'Marketing',
    year: 2024,
    amount: 10000000,
    allocated: 8000000,
    consumed: 6500000,
    remaining: 1500000,
    status: 'approved',
    department: 'Commercial',
    category: 'Communication'
  },
  {
    id: 'BUD-002',
    label: 'RH',
    year: 2024,
    amount: 15000000,
    allocated: 12000000,
    consumed: 11000000,
    remaining: 1000000,
    status: 'approved',
    department: 'Ressources Humaines',
    category: 'Salaires'
  },
];

const mockVariances: BudgetVariance[] = [
  {
    id: 'VAR-001',
    budgetId: 'BUD-001',
    varianceAmount: -500000,
    variancePercentage: -7.69,
    actualAmount: 7000000,
    plannedAmount: 6500000,
    period: 'Janvier 2024',
    explanation: 'Dépenses imprévues pour campagne marketing'
  },
  {
    id: 'VAR-002',
    budgetId: 'BUD-002',
    varianceAmount: 200000,
    variancePercentage: 1.82,
    actualAmount: 11200000,
    plannedAmount: 11000000,
    period: 'Janvier 2024',
    explanation: 'Heures supplémentaires'
  },
];

const mockTaxPackages: TaxPackage[] = [
  {
    id: 'TXP-001',
    year: 2023,
    period: 'annual',
    status: 'submitted',
    submissionDate: '2024-01-15',
    validationDate: '2024-01-20',
    documents: []
  },
  {
    id: 'TXP-002',
    year: 2024,
    period: 'first_quarter',
    status: 'draft',
    documents: []
  },
];

const mockTaxDocuments: TaxDocument[] = [
  {
    id: 'TXD-001',
    type: 'balance_sheet',
    fileName: 'bilan_2023.pdf',
    filePath: '/documents/tax/bilan_2023.pdf',
    uploadedAt: '2024-01-15T10:30:00',
    uploadedBy: 'comptable1'
  },
  {
    id: 'TXD-002',
    type: 'income_statement',
    fileName: 'compte_resultat_2023.pdf',
    filePath: '/documents/tax/compte_resultat_2023.pdf',
    uploadedAt: '2024-01-15T11:00:00',
    uploadedBy: 'comptable1'
  },
];

const mockAuditTrails = [
  {
    id: 'AUD-001',
    date: '2024-01-15T09:30:00',
    user: 'comptable1',
    action: 'Création écriture',
    module: 'Comptabilité',
    details: 'Création de l\'écriture ENT-2024-001',
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0...'
  },
  {
    id: 'AUD-002',
    date: '2024-01-15T10:15:00',
    user: 'comptable2',
    action: 'Validation écriture',
    module: 'Comptabilité',
    details: 'Validation de l\'écriture ENT-2024-001',
    ipAddress: '192.168.1.11',
    userAgent: 'Mozilla/5.0...'
  },
];

const mockComplianceReports = [
  {
    id: 'CR-001',
    title: 'Rapport de conformité OHADA Q4 2023',
    date: '2024-01-10',
    status: 'approved',
    author: 'auditeur1',
    ohadaCompliant: true,
    reportType: 'quarterly',
    filePath: '/documents/reports/ohada_q4_2023.pdf'
  },
  {
    id: 'CR-002',
    title: 'Analyse des écarts budgétaires 2023',
    date: '2024-01-12',
    status: 'reviewed',
    author: 'controleur1',
    ohadaCompliant: true,
    reportType: 'annual',
    filePath: '/documents/reports/ecarts_budget_2023.pdf'
  },
];

export const AccountingDashboard = () => {
  const [entries, setEntries] = useState<AccountingEntry[]>(mockAccountingEntries);
  const [letterings, setLetterings] = useState<Lettering[]>(mockLetterings);
  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets);
  const [variances, setVariances] = useState<BudgetVariance[]>(mockVariances);
  const [taxPackages, setTaxPackages] = useState<TaxPackage[]>(mockTaxPackages);
  const [taxDocuments, setTaxDocuments] = useState<TaxDocument[]>(mockTaxDocuments);

  const handleAddEntry = (entry: Omit<AccountingEntry, 'id' | 'createdBy' | 'createdAt' | 'status'>) => {
    const newEntry: AccountingEntry = {
      ...entry,
      id: `AE-${entries.length + 1}`,
      status: 'draft',
      createdBy: 'currentUser', // Remplacer par l'utilisateur connecté
      createdAt: new Date().toISOString(),
    };
    setEntries([...entries, newEntry]);
  };

  const handleCreateLettering = (lettering: Omit<Lettering, 'id' | 'createdBy' | 'createdAt'>) => {
    const newLettering: Lettering = {
      ...lettering,
      id: `LET-${letterings.length + 1}`,
      createdBy: 'currentUser', // Remplacer par l'utilisateur connecté
      createdAt: new Date().toISOString(),
    };
    setLetterings([...letterings, newLettering]);
  };

  const handleAddBudget = (budget: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budget,
      id: `BUD-${budgets.length + 1}`,
      allocated: 0,
      consumed: 0,
      remaining: budget.amount,
      status: 'draft',
    };
    setBudgets([...budgets, newBudget]);
  };

  const handleUpdateBudget = (id: string, updates: Partial<Budget>) => {
    setBudgets(budgets.map(budget => 
      budget.id === id ? { ...budget, ...updates } : budget
    ));
  };

  const handleAddTaxPackage = (pkg: Omit<TaxPackage, 'id' | 'documents'>) => {
    const newPackage: TaxPackage = {
      ...pkg,
      id: `TXP-${taxPackages.length + 1}`,
      documents: [],
    };
    setTaxPackages([...taxPackages, newPackage]);
  };

  const handleUpdateTaxPackage = (id: string, updates: Partial<TaxPackage>) => {
    setTaxPackages(taxPackages.map(pkg => 
      pkg.id === id ? { ...pkg, ...updates } : pkg
    ));
  };

  const handleAddTaxDocument = (doc: Omit<TaxDocument, 'id' | 'uploadedAt' | 'uploadedBy'>) => {
    const newDoc: TaxDocument = {
      ...doc,
      id: `${doc.type}-${taxDocuments.length + 1}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'currentUser', // Remplacer par l'utilisateur connecté
    };
    setTaxDocuments([...taxDocuments, newDoc]);
  };

  const handleExportReports = (reportIds: string[]) => {
    console.log('Exporting reports:', reportIds);
    // Implémenter la logique d'exportation
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Comptabilité</h1>
            <p className="text-blue-100 text-lg">Gestion des écritures, budgets et conformité OHADA</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2">
          <AccountingEntriesManager 
            entries={entries} 
            onAddEntry={handleAddEntry} 
          />
        </div>

        <div>
          <LetteringManager 
            letterings={letterings} 
            entries={entries} 
            onCreateLettering={handleCreateLettering} 
          />
        </div>

        <div>
          <BudgetManager 
            budgets={budgets} 
            variances={variances} 
            onAddBudget={handleAddBudget} 
            onUpdateBudget={handleUpdateBudget} 
          />
        </div>

        <div className="lg:col-span-2">
          <TaxPackagesManager 
            packages={taxPackages} 
            documents={taxDocuments} 
            onAddPackage={handleAddTaxPackage} 
            onUpdatePackage={handleUpdateTaxPackage} 
            onAddDocument={handleAddTaxDocument} 
          />
        </div>

        <div className="lg:col-span-2">
          <AuditTrailManager 
            trails={mockAuditTrails} 
            reports={mockComplianceReports} 
            onExport={handleExportReports} 
          />
        </div>
      </div>
    </div>
  );
};