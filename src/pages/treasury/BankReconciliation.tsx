// @ts-nocheck
// TODO: Ce composant est legacy et sera remplacé par les nouveaux composants GLOBAL EXCHANGE
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  reconciled: boolean;
}

interface BankReconciliation {
  id: string;
  bankAccountId: string;
  period: string;
  startBalance: number;
  endBalance: number;
  status: 'pending' | 'reconciled' | 'discrepancy';
  reconciledAt?: string;
  transactions: BankTransaction[];
}

const mockReconciliations: BankReconciliation[] = [
  {
    id: '1',
    bankAccount: 'UBA - 0123456789',
    statementDate: '2024-01-31',
    openingBalance: 5000000,
    closingBalance: 5700000,
    reconciled: true,
    reconciledBy: 'chief_accountant@fasotrans.bf',
    reconciledAt: '2024-02-01T10:00:00',
    transactions: [
      {
        id: '1',
        date: '2024-01-15',
        description: 'Virement client ABC',
        amount: 1500000,
        type: 'credit',
        reference: 'VIR-001',
        reconciled: true,
        matchedEntryId: 'AC-2024-001',
      },
      {
        id: '2',
        date: '2024-01-20',
        description: 'Paiement fournisseur XYZ',
        amount: 800000,
        type: 'debit',
        reference: 'CHQ-001',
        reconciled: true,
        matchedEntryId: 'AC-2024-005',
      },
    ],
  },
  {
    id: '2',
    bankAccount: 'ECOBANK - 9876543210',
    statementDate: '2024-01-31',
    openingBalance: 3000000,
    closingBalance: 3500000,
    reconciled: false,
    transactions: [
      {
        id: '3',
        date: '2024-01-18',
        description: 'Virement client DEF',
        amount: 2000000,
        type: 'credit',
        reference: 'VIR-002',
        reconciled: false,
      },
      {
        id: '4',
        date: '2024-01-25',
        description: 'Frais bancaires',
        amount: 50000,
        type: 'debit',
        reference: 'FRAIS-001',
        reconciled: false,
      },
    ],
  },
];

export function BankReconciliation() {
  const [selectedReconciliation, setSelectedReconciliation] = useState<string | null>(null);

  const reconciliationColumns = [
    {
      header: 'Compte bancaire',
      accessor: 'bankAccount' as keyof BankReconciliation,
    },
    {
      header: 'Date relevé',
      accessor: 'statementDate' as keyof BankReconciliation,
    },
    {
      header: 'Solde ouverture',
      accessor: 'openingBalance' as keyof BankReconciliation,
      render: (value: number) => `${value.toLocaleString('fr-FR')} FCFA`,
    },
    {
      header: 'Solde clôture',
      accessor: 'closingBalance' as keyof BankReconciliation,
      render: (value: number) => `${value.toLocaleString('fr-FR')} FCFA`,
    },
    {
      header: 'Transactions',
      accessor: 'transactions' as keyof BankReconciliation,
      render: (value: BankTransaction[]) => value.length,
    },
    {
      header: 'Statut',
      accessor: 'reconciled' as keyof BankReconciliation,
      render: (value: boolean) => (
        <div className="flex items-center gap-2">
          {value ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Rapproché</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-600">À rapprocher</span>
            </>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: BankReconciliation) => (
        <button
          onClick={() => setSelectedReconciliation(row.id)}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Rapprocher
        </button>
      ),
    },
  ];

  const selectedRecon = mockReconciliations.find(r => r.id === selectedReconciliation);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Rapprochement Bancaire</h1>
          <p className="text-gray-600">Rapprochement automatique et manuel des comptes bancaires</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Rapprochement Automatique
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Comptes à rapprocher</p>
          <p className="text-2xl font-bold text-yellow-600">
            {mockReconciliations.filter(r => !r.reconciled).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Comptes rapprochés</p>
          <p className="text-2xl font-bold text-green-600">
            {mockReconciliations.filter(r => r.reconciled).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Écarts détectés</p>
          <p className="text-2xl font-bold text-red-600">0</p>
        </div>
      </div>

      <DataTable data={mockReconciliations} columns={reconciliationColumns} />

      {selectedRecon && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Transactions - {selectedRecon.bankAccount}
          </h2>
          <div className="space-y-2">
            {selectedRecon.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-sm text-gray-600">{tx.date} - {tx.reference}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'} {tx.amount.toLocaleString('fr-FR')} FCFA
                  </p>
                  {tx.reconciled ? (
                    <span className="text-xs text-green-600">✓ Rapproché</span>
                  ) : (
                    <span className="text-xs text-yellow-600">À rapprocher</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
