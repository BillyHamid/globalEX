// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backendglobal-71dp.onrender.com/api';

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

export const getAuthToken = () => authToken;

// Generic fetch wrapper
const fetchAPI = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const headers: HeadersInit = {
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers,
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
        ...(token && { Authorization: `Bearer ${token}` }),
        // Ne pas mettre Content-Type pour FormData, le navigateur le fait automatiquement
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
    const response = await fetch(`${API_BASE_URL}/transfers/${id}/proof`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors du téléchargement');
    }

    // Obtenir le nom du fichier depuis les headers
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'proof.pdf';
    if (contentDisposition) {
      const matches = /filename="(.+)"/.exec(contentDisposition);
      if (matches) filename = matches[1];
    }

    // Créer un blob et télécharger
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
// HEALTH CHECK
// ==========================================
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
    const response = await fetch(`${API_BASE_URL}/cash/entry/${entryId}/proof`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Impossible de charger la preuve');
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

export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};
