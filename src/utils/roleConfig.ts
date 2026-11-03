import { MenuItem, Role, User } from '@/types';

// ==========================================
// GLOBAL EXCHANGE - Configuration des Rôles
// ==========================================

export const getRoleLabel = (role: Role): string => {
  const labels: Record<Role, string> = {
    admin: 'Administrateur',
    supervisor: 'Superviseur',
    sender_agent: 'Agent expéditeur',
    payer_agent: 'Agent payeur',
  };
  return labels[role];
};

export const getRoleColor = (role: Role): string => {
  const colors: Record<Role, string> = {
    admin: 'bg-purple-100 text-purple-800',
    supervisor: 'bg-blue-100 text-blue-800',
    sender_agent: 'bg-green-100 text-green-800',
    payer_agent: 'bg-orange-100 text-orange-800',
  };
  return colors[role];
};

export const menuItems: MenuItem[] = [
  {
    label: 'Tableau de bord',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    roles: ['admin', 'supervisor', 'sender_agent', 'payer_agent'],
  },
  {
    label: 'Transferts',
    path: '/transfers',
    icon: 'ArrowLeftRight',
    roles: ['admin', 'supervisor', 'sender_agent', 'payer_agent'],
  },
  {
    label: 'Nouveau Transfert',
    path: '/transfers/new',
    icon: 'PlusCircle',
    roles: ['admin', 'sender_agent', 'payer_agent'],
  },
  {
    label: 'Journal des Transactions',
    path: '/transactions/journal',
    icon: 'FileText',
    roles: ['admin', 'supervisor', 'sender_agent', 'payer_agent'],
  },
  {
    label: 'Dashboard Caisse',
    path: '/cash',
    icon: 'DollarSign',
    roles: ['admin', 'supervisor', 'sender_agent', 'payer_agent'],
  },
  {
    label: 'Utilisateurs & Agents',
    path: '/users',
    icon: 'Users',
    roles: ['admin', 'supervisor'],
  },
  {
    label: 'Dépenses Spéciales',
    path: '/special-expenses',
    icon: 'Wallet',
    roles: ['admin', 'sender_agent'],
  },
  {
    label: 'Rôles & Permissions',
    path: '/roles',
    icon: 'Shield',
    roles: ['admin'],
  },
  {
    label: 'Rapports financiers',
    path: '/financial-reports',
    icon: 'FileSpreadsheet',
    roles: ['payer_agent'],
  },
  {
    label: 'Valider rapports',
    path: '/financial-reports/admin/validation',
    icon: 'ClipboardCheck',
    roles: ['admin'],
  },
];

const BERNADETTE_EMAIL = 'bernadette@globalexchange.com';

export const getMenuItemsForRole = (role: Role): MenuItem[] => {
  return menuItems.filter(item => item.roles.includes(role));
};

/** Menu filtré selon les permissions effectives et les règles des rapports financiers. */
export const getMenuItemsForUser = (user: User): MenuItem[] => {
  const isSpecialExpensesAllowed =
    hasPermission(user, 'special_expenses.manage');

  return menuItems.filter((item) => {
    if (item.path === '/special-expenses') return isSpecialExpensesAllowed;
    if (item.path === '/financial-reports') return user.email === BERNADETTE_EMAIL;
    if (item.path === '/financial-reports/admin/validation') return user.role === 'admin';
    const permission = menuPermissions[item.path];
    if (permission) return hasPermission(user, permission);
    return item.roles.includes(user.role);
  });
};

// Les permissions effectives viennent de l'API et incluent les accès nominatifs.
export const hasPermission = (user: User | null | undefined, permission: string): boolean => {
  return !!user && (user.role === 'admin' || (user.permissions || []).includes(permission));
};

const menuPermissions: Record<string, string> = {
  '/transfers': 'transfers.view',
  '/transfers/new': 'transfers.create',
  '/transactions/journal': 'transfers.view',
  '/cash': 'cash.view',
  '/users': 'users.view',
};
