// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// En-têtes pour ngrok (évite la page d'avertissement du plan gratuit)
const NGROK_HEADERS: Record<string, string> = { 'ngrok-skip-browser-warning': 'true' };

// Token management
let authToken: string | null = localStorage.getItem('token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Toujours utiliser la source la plus à jour (mémoire ou localStorage) pour éviter les désynchronisations
export const getAuthToken = () => authToken ?? localStorage.getItem('token');

// Generic fetch wrapper
const fetchAPI = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    ...(options.headers as Record<string, string>),
    ...NGROK_HEADERS,
    ...(token && { Authorization: `Bearer ${token}` }), // En dernier pour ne jamais être écrasé
  };
  // Ne pas fixer Content-Type pour FormData (le navigateur ajoute multipart boundary)
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // 401 = token manquant ou expiré → déconnecter et rediriger vers login
      if (response.status === 401) {
        setAuthToken(null);
        localStorage.removeItem('user');
        const loginPath = `${window.location.origin}/login`;
        window.location.href = loginPath;
        throw new Error('Session expirée ou non connecté. Veuillez vous connecter.');
      }

      // Try to parse error message from response
      let errorMessage = 'Une erreur est survenue';
      let errorDetails = null;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        // Si c'est une erreur de validation, inclure les détails
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const validationErrors = errorData.errors.map((e: any) => `${e.field}: ${e.message}`).join('\n');
          errorMessage = `${errorMessage}\n\n${validationErrors}`;
        }
        errorDetails = errorData;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || `Erreur ${response.status}`;
      }
      const error = new Error(errorMessage);
      (error as any).details = errorDetails;
      (error as any).status = response.status;
      throw error;
    }

    // Parse JSON response
    const data = await response.json();
    return data;
  } catch (error: any) {
    // Handle network errors (Failed to fetch)
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error(
        `Impossible de se connecter au serveur. Vérifiez que le backend est démarré et accessible (API: ${API_BASE_URL}).`
      );
    }
    // Re-throw other errors
    throw error;
  }
};

// ==========================================
// AUTH API
// ==========================================
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetchAPI<{
      success: boolean;
      data: { token: string; user: any };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: string;
    country?: string;
    agentCode?: string;
  }) => {
    const response = await fetchAPI<{
      success: boolean;
      data: { token: string; user: any };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data;
  },

  getMe: async () => {
    const response = await fetchAPI<{ success: boolean; data: any }>('/auth/me');
    return response.data;
  },

  logout: async () => {
    await fetchAPI('/auth/logout', { method: 'POST' });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    await fetchAPI('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// ==========================================
// USERS API
// ==========================================
export const usersAPI = {
  getAll: async (params?: { role?: string; isActive?: boolean; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await fetchAPI<{ success: boolean; data: any[]; pagination: any }>(
      `/users${queryString}`
    );
    return response;
  },

  getById: async (id: string) => {
    const response = await fetchAPI<{ success: boolean; data: any }>(`/users/${id}`);
    return response.data;
  },

  create: async (userData: any) => {
    const response = await fetchAPI<{ success: boolean; data: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data;
  },

  update: async (id: string, userData: any) => {
    const response = await fetchAPI<{ success: boolean; data: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response.data;
  },

  delete: async (id: string) => {
    await fetchAPI(`/users/${id}`, { method: 'DELETE' });
  },

  toggleActive: async (id: string) => {
    const response = await fetchAPI<{ success: boolean; data: { isActive: boolean } }>(
      `/users/${id}/toggle-active`,
      { method: 'PATCH' }
    );
    return response.data;
  },
};

// ==========================================
// TRANSFERS API
// ==========================================
export const transfersAPI = {
  getAll: async (params?: { status?: string; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await fetchAPI<{ success: boolean; data: any[]; pagination: any }>(
      `/transfers${queryString}`
    );
    return response;
  },

  getPending: async () => {
    const response = await fetchAPI<{ success: boolean; data: any[] }>('/transfers/pending');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await fetchAPI<{ success: boolean; data: any }>(`/transfers/${id}`);
    return response.data;
  },

  getByReference: async (reference: string) => {
    const response = await fetchAPI<{ success: boolean; data: any }>(
      `/transfers/reference/${reference}`
    );
    return response.data;
  },

  create: async (transferData: {
    sender: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      country: string;
    };
    beneficiary: {
      firstName: string;
      lastName: string;
      phone: string;
      country: string;
      city: string;
      idType?: string;
      idNumber?: string;
    };
    amountSent: number;
    currency: string;
    exchangeRate: number;
    sendMethod: string;
    notes?: string;
  }) => {
    const response = await fetchAPI<{ success: boolean; data: any }>('/transfers', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
    return response.data;
  },

  markAsPaid: async (id: string) => {
    const response = await fetchAPI<{ success: boolean; data: any }>(`/transfers/${id}/pay`, {
      method: 'PATCH',
    });
    return response.data;
  },

  cancel: async (id: string, reason?: string) => {
    const response = await fetchAPI<{ success: boolean; data: any }>(`/transfers/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    return response.data;
  },

  confirmWithProof: async (id: string, proofFile: File, comment?: string) => {
    const formData = new FormData();
    formData.append('proof_file', proofFile);
    if (comment) {
      formData.append('comment', comment);
    }

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/transfers/${id}/confirm`, {
      method: 'POST',
      headers: {
        ...NGROK_HEADERS,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la confirmation');
    }

    return data;
  },

  delete: async (id: string) => {
    await fetchAPI(`/transfers/${id}`, { method: 'DELETE' });
  },

  downloadProof: async (id: string): Promise<void> => {
    const token = getAuthToken();
    const headers: HeadersInit = {
      ...NGROK_HEADERS,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    const response = await fetch(`${API_BASE_URL}/transfers/${id}/proof`, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Erreur lors du téléchargement');
    }

    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      throw new Error('Réponse invalide : le fichier n\'a pas été reçu correctement');
    }

    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'proof.pdf';
    if (contentDisposition) {
      const matches = /filename="([^"]+)"/.exec(contentDisposition);
      if (matches) filename = matches[1];
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// ==========================================
// BENEFICIARIES API
// ==========================================
export const beneficiariesAPI = {
  getAll: async (params?: { search?: string; country?: string; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await fetchAPI<{ success: boolean; data: any[]; pagination: any }>(
      `/beneficiaries${queryString}`
    );
    return response;
  },

  getById: async (id: string) => {
    const response = await fetchAPI<{ success: boolean; data: any }>(`/beneficiaries/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await fetchAPI<{ success: boolean; data: any }>('/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await fetchAPI<{ success: boolean; data: any }>(`/beneficiaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  delete: async (id: string) => {
    await fetchAPI(`/beneficiaries/${id}`, { method: 'DELETE' });
  },

  searchByPhone: async (phone: string) => {
    const response = await fetchAPI<{ success: boolean; data: any[] }>(
      `/beneficiaries/search/${phone}`
    );
    return response.data;
  },
};

// ==========================================
// SENDERS API
// ==========================================
export const sendersAPI = {
  getAll: async (params?: { search?: string; country?: string; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await fetchAPI<{ success: boolean; data: any[]; pagination: any }>(
      `/senders${queryString}`
    );
    return response;
  },

  getById: async (id: string) => {
    const response = await fetchAPI<{ success: boolean; data: any }>(`/senders/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await fetchAPI<{ success: boolean; data: any }>('/senders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await fetchAPI<{ success: boolean; data: any }>(`/senders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  delete: async (id: string) => {
    await fetchAPI(`/senders/${id}`, { method: 'DELETE' });
  },

  searchByPhone: async (phone: string) => {
    const response = await fetchAPI<{ success: boolean; data: any[] }>(`/senders/search/${phone}`);
    return response.data;
  },
};

// ==========================================
// STATS API
// ==========================================
export const statsAPI = {
  getDashboard: async () => {
    const response = await fetchAPI<{ success: boolean; data: any }>('/stats/dashboard');
    return response.data;
  },

  getTransfers: async () => {
    const response = await fetchAPI<{ success: boolean; data: any }>('/stats/transfers');
    return response.data;
  },

  getAgents: async () => {
    const response = await fetchAPI<{ success: boolean; data: any[] }>('/stats/agents');
    return response.data;
  },

  getJournal: async (params?: { date?: string; country?: string; agentId?: string }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await fetchAPI<{ success: boolean; data: any }>(`/stats/journal${queryString}`);
    return response.data;
  },

  getStatsByCountry: async (params?: { date?: string }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await fetchAPI<{ success: boolean; data: any }>(`/stats/by-country${queryString}`);
    return response.data;
  },
};

// ==========================================
// EXCHANGE RATES API
// ==========================================
export const exchangeRatesAPI = {
  getUsdXof: async (): Promise<number> => {
    const response = await fetchAPI<{ success: boolean; data: { USD_XOF: number } }>('/exchange-rates');
    return response.data?.USD_XOF ?? 587; // taux_paiement (557 + 30)
  },

  /** Taux complet : taux_paiement = taux_reel + marge (30) */
  getUsdXofDetails: async (): Promise<{ rateReel: number; ratePaiement: number; marge: number }> => {
    const response = await fetchAPI<{
      success: boolean;
      data: { rateReel?: number; ratePaiement?: number; marge?: number; USD_XOF?: number };
    }>('/exchange-rates');
    const d = response.data;
    const ratePaiement = d?.ratePaiement ?? d?.USD_XOF ?? 587;
    const marge = d?.marge ?? 30;
    const rateReel = d?.rateReel ?? ratePaiement - marge;
    return { rateReel, ratePaiement, marge };
  },
};

// ==========================================
// CASH API (Gestion de caisse)
// ==========================================
export const cashAPI = {
  getDashboard: async () => {
    const response = await fetchAPI<{
      success: boolean;
      data: {
        accounts: {
          usa: { name: string; currency: string; balance: number; formattedBalance: string };
          burkina: { name: string; currency: string; balance: number; formattedBalance: string };
        };
        totals: {
          tmountUSD: number;
          tfeesUSD: number;
          tmountXOF: number;
          tfeesXOF: number;
          totalPaidTransfers: number;
        };
        profit: {
          totalUSD: number;
          formattedTotal: string;
          partnerShareUSD: number;
          formattedPartnerShare: string;
        };
        recentEntries: Array<{
          id: string;
          accountName: string;
          transactionId: string | null;
          transferReference: string | null;
          type: 'DEBIT' | 'CREDIT';
          amount: number;
          currency: string;
          description: string;
          proofFilePath?: string;
          createdBy: string | null;
          createdAt: string;
        }>;
      };
    }>('/cash/dashboard');
    return response.data;
  },

  getLedgerHistory: async (accountName: string, limit = 50) => {
    const response = await fetchAPI<{
      success: boolean;
      data: Array<{
        id: string;
        accountName: string;
        transactionId: string | null;
        transferReference: string | null;
        type: 'DEBIT' | 'CREDIT';
        amount: number;
        currency: string;
        description: string;
        createdBy: string | null;
        createdAt: string;
      }>;
    }>(`/cash/ledger/${accountName}?limit=${limit}`);
    return response.data;
  },

  addEntry: async (accountName: string, amount: number, description: string, proofFile: File) => {
    const formData = new FormData();
    formData.append('accountName', accountName);
    formData.append('amount', String(amount));
    formData.append('description', description);
    formData.append('proof_file', proofFile);
    const response = await fetchAPI<{
      success: boolean;
      message: string;
      data: {
        entry: {
          id: string;
          accountName: string;
          type: string;
          amount: number;
          currency: string;
          description: string;
          proofFilePath?: string;
          createdAt: string;
        };
        account: {
          name: string;
          currency: string;
          balance: number;
          formattedBalance: string;
        };
      };
    }>('/cash/entry', {
      method: 'POST',
      body: formData,
    });
    return response.data;
  },

  /** Récupère le fichier preuve d'une entrée (pour affichage dans un nouvel onglet) */
  getEntryProofBlob: async (entryId: string): Promise<Blob> => {
    const token = getAuthToken();
    const headers: HeadersInit = {
      ...NGROK_HEADERS,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    const response = await fetch(`${API_BASE_URL}/cash/entry/${entryId}/proof`, { headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Impossible de charger la preuve');
    }
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      throw new Error('Réponse invalide : le fichier n\'a pas été reçu correctement');
    }
    return response.blob();
  },

  addExpense: async (accountName: string, amount: number, description: string) => {
    const response = await fetchAPI<{
      success: boolean;
      message: string;
      data: {
        entry: {
          id: string;
          accountName: string;
          type: string;
          amount: number;
          currency: string;
          description: string;
          createdAt: string;
        };
        account: {
          name: string;
          currency: string;
          balance: number;
          formattedBalance: string;
        };
      };
    }>('/cash/expense', {
      method: 'POST',
      body: JSON.stringify({ accountName, amount, description }),
    });
    return response.data;
  },
};

// ─────────────────────────────────────────────────────────────
// Dépenses Spéciales API
// ─────────────────────────────────────────────────────────────

export interface SpecialExpense {
  id: string;
  type: 'simple_expense';
  amount: number;
  description: string;
  expenseDate: string;
  receiptImage: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  lenderId: string;
  lenderName: string | null;
  lenderEmail: string | null;
  borrowerId: string;
  borrowerName: string | null;
  borrowerEmail: string | null;
  amount: number;
  reason: string;
  loanDate: string;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalWallet {
  userId: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  currency: string;
}

// ==========================================
// RAPPORTS FINANCIERS (Bernadette → validation admin)
// ==========================================

export interface FinancialReportItem {
  id: string;
  reportId: string;
  label: string;
  amount: number;
  proofFile: string | null;
  createdAt: string;
}

export type FinancialReportStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface FinancialReport {
  id: string;
  createdBy: string;
  creatorName: string | null;
  totalAmount: number;
  comment: string | null;
  status: FinancialReportStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  validatedBy: string | null;
  validatorName: string | null;
  validatedAt: string | null;
  rejectionReason: string | null;
  totalJustified: number;
  remainingAmount: number;
  items: FinancialReportItem[];
}

export const financialReportsAPI = {
  create: async (body: { total_amount: number; comment?: string }): Promise<FinancialReport> => {
    const res = await fetchAPI<{ success: boolean; data: FinancialReport }>('/financial-reports', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.data;
  },

  listMine: async (): Promise<FinancialReport[]> => {
    const res = await fetchAPI<{ success: boolean; data: FinancialReport[] }>('/financial-reports/mine');
    return res.data;
  },

  listForReview: async (): Promise<FinancialReport[]> => {
    const res = await fetchAPI<{ success: boolean; data: FinancialReport[] }>(
      '/financial-reports/for-review'
    );
    return res.data;
  },

  listHistory: async (status?: FinancialReportStatus): Promise<FinancialReport[]> => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetchAPI<{ success: boolean; data: FinancialReport[] }>(
      `/financial-reports/history${q}`
    );
    return res.data;
  },

  get: async (id: string): Promise<FinancialReport> => {
    const res = await fetchAPI<{ success: boolean; data: FinancialReport }>(`/financial-reports/${id}`);
    return res.data;
  },

  update: async (
    id: string,
    body: { total_amount?: number; comment?: string }
  ): Promise<FinancialReport> => {
    const res = await fetchAPI<{ success: boolean; data: FinancialReport }>(`/financial-reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return res.data;
  },

  deleteDraft: async (id: string): Promise<void> => {
    await fetchAPI(`/financial-reports/${id}`, { method: 'DELETE' });
  },

  addItem: async (
    reportId: string,
    data: { label: string; amount: number; proof?: File | null }
  ): Promise<{ item: FinancialReportItem; report: FinancialReport }> => {
    const formData = new FormData();
    formData.append('label', data.label);
    formData.append('amount', String(data.amount));
    if (data.proof) formData.append('proof', data.proof);
    const res = await fetchAPI<{ success: boolean; data: { item: FinancialReportItem; report: FinancialReport } }>(
      `/financial-reports/${reportId}/items`,
      { method: 'POST', body: formData }
    );
    return res.data;
  },

  deleteItem: async (reportId: string, itemId: string): Promise<FinancialReport> => {
    const res = await fetchAPI<{ success: boolean; data: FinancialReport }>(
      `/financial-reports/${reportId}/items/${itemId}`,
      { method: 'DELETE' }
    );
    return res.data;
  },

  submit: async (id: string): Promise<FinancialReport> => {
    const res = await fetchAPI<{ success: boolean; data: FinancialReport }>(
      `/financial-reports/${id}/submit`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    return res.data;
  },

  approve: async (id: string): Promise<FinancialReport> => {
    const res = await fetchAPI<{ success: boolean; data: FinancialReport }>(
      `/financial-reports/${id}/approve`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    return res.data;
  },

  reject: async (id: string, reason?: string): Promise<FinancialReport> => {
    const res = await fetchAPI<{ success: boolean; data: FinancialReport }>(
      `/financial-reports/${id}/reject`,
      { method: 'POST', body: JSON.stringify({ reason: reason || '' }) }
    );
    return res.data;
  },

  /** Ouvre le justificatif dans un nouvel onglet (avec token). */
  openItemProof: async (reportId: string, itemId: string): Promise<void> => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/financial-reports/${reportId}/items/${itemId}/proof`, {
      headers: {
        ...NGROK_HEADERS,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || 'Impossible de charger le justificatif');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};

export const specialExpensesAPI = {
  getTfeesBalance: async (): Promise<{ availableTfees: number }> => {
    const res = await fetchAPI<{ success: boolean; data: { availableTfees: number } }>(
      '/special-expenses/tfees-balance'
    );
    return res.data;
  },

  listExpenses: async (page = 1, limit = 20): Promise<{ expenses: SpecialExpense[]; total: number }> => {
    const res = await fetchAPI<{ success: boolean; data: { expenses: SpecialExpense[]; total: number } }>(
      `/special-expenses?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  createExpense: async (data: {
    amount: number;
    description: string;
    expense_date: string;
    receipt_image?: File;
  }): Promise<SpecialExpense> => {
    const formData = new FormData();
    formData.append('amount', String(data.amount));
    formData.append('description', data.description);
    formData.append('expense_date', data.expense_date);
    if (data.receipt_image) formData.append('receipt_image', data.receipt_image);

    const res = await fetchAPI<{ success: boolean; data: SpecialExpense }>('/special-expenses', {
      method: 'POST',
      body: formData,
    });
    return res.data;
  },

  getReceiptUrl: (expenseId: string): string =>
    `${API_BASE_URL}/special-expenses/${expenseId}/receipt`,

  getWallets: async (): Promise<PersonalWallet[]> => {
    const res = await fetchAPI<{ success: boolean; data: PersonalWallet[] }>(
      '/special-expenses/wallets'
    );
    return res.data;
  },

  listLoans: async (page = 1, limit = 20): Promise<{ loans: Loan[]; total: number }> => {
    const res = await fetchAPI<{ success: boolean; data: { loans: Loan[]; total: number } }>(
      `/special-expenses/loans?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  createLoan: async (data: {
    amount: number;
    reason: string;
    loan_date: string;
  }): Promise<Loan> => {
    const res = await fetchAPI<{ success: boolean; data: Loan }>('/special-expenses/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};

export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: NGROK_HEADERS,
    });
    return response.ok;
  } catch {
    return false;
  }
};
