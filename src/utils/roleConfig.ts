import { MenuItem, Role } from '@/types';

// ==========================================
// GLOBAL EXCHANGE - Configuration des Rôles
// ==========================================

export const getRoleLabel = (role: Role): string => {
  const labels: Record<Role, string> = {
    admin: 'Administrateur',
    supervisor: 'Superviseur',
    sender_agent: 'Agent Expéditeur',
    payer_agent: 'Agent Payeur',
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
    label: 'Transferts en attente',
    path: '/transfers/pending',
    icon: 'Clock',
    roles: ['admin', 'supervisor', 'payer_agent'],
  },
  {
    label: 'Journal des Transactions',
    path: '/transactions/journal',
    icon: 'FileText',
    roles: ['admin', 'supervisor', 'sender_agent', 'payer_agent'],
  },
  {
    label: 'Stats USA / BF',
    path: '/transactions/by-country',
    icon: 'Globe',
    roles: ['admin', 'supervisor', 'sender_agent', 'payer_agent'],
  },
  {
    label: 'Agents',
    path: '/agents',
    icon: 'Users',
    roles: ['admin', 'supervisor'],
  },
  {
    label: 'Bénéficiaires',
    path: '/beneficiaries',
    icon: 'UserCheck',
    roles: ['admin', 'supervisor', 'sender_agent', 'payer_agent'],
  },
  {
    label: 'Expéditeurs',
    path: '/senders',
    icon: 'UserPlus',
    roles: ['admin', 'supervisor', 'sender_agent', 'payer_agent'],
  },
  {
    label: 'Notifications',
    path: '/notifications',
    icon: 'Bell',
    roles: ['admin', 'supervisor'],
  },
  {
    label: 'Transactions',
    path: '/transactions',
    icon: 'Receipt',
    roles: ['admin', 'supervisor'],
  },
  {
    label: 'Taux de change',
    path: '/exchange-rates',
    icon: 'TrendingUp',
    roles: ['admin'],
  },
  {
    label: 'Frais & Commissions',
    path: '/fees',
    icon: 'Percent',
    roles: ['admin'],
  },
  {
    label: 'Rapports',
    path: '/reports',
    icon: 'BarChart3',
    roles: ['admin', 'supervisor'],
  },
  {
    label: 'Statistiques',
    path: '/statistics',
    icon: 'PieChart',
    roles: ['admin', 'supervisor', 'sender_agent', 'payer_agent'],
  },
  {
    label: 'Utilisateurs',
    path: '/users',
    icon: 'Users',
    roles: ['admin'],
  },
  {
    label: 'Paramètres',
    path: '/settings',
    icon: 'Settings',
    roles: ['admin'],
  },
  {
    label: 'Journal d\'audit',
    path: '/audit-logs',
    icon: 'FileText',
    roles: ['admin'],
  },
];

export const getMenuItemsForRole = (role: Role): MenuItem[] => {
  return menuItems.filter(item => item.roles.includes(role));
};

// Permissions par rôle
export const rolePermissions: Record<Role, string[]> = {
  admin: [
    'transfers.create',
    'transfers.view',
    'transfers.edit',
    'transfers.cancel',
    'transfers.pay',
    'agents.create',
    'agents.view',
    'agents.edit',
    'agents.delete',
    'users.create',
    'users.view',
    'users.edit',
    'users.delete',
    'reports.view',
    'reports.export',
    'settings.view',
    'settings.edit',
    'audit.view',
  ],
  supervisor: [
    'transfers.view',
    'transfers.edit',
    'transfers.cancel',
    'agents.view',
    'users.view',
    'reports.view',
    'reports.export',
  ],
  sender_agent: [
    'transfers.create',
    'transfers.view',
    'beneficiaries.create',
    'beneficiaries.view',
    'senders.create',
    'senders.view',
  ],
  payer_agent: [
    'transfers.create',
    'transfers.view',
    'transfers.pay',
    'beneficiaries.create',
    'beneficiaries.view',
    'senders.create',
    'senders.view',
  ],
};

export const hasPermission = (role: Role, permission: string): boolean => {
  return rolePermissions[role]?.includes(permission) ?? false;
};
