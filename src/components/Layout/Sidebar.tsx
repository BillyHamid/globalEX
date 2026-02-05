import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getMenuItemsForRole, getRoleLabel, getRoleColor } from '@/utils/roleConfig';
import * as LucideIcons from 'lucide-react';

interface IconComponent {
  [key: string]: React.ComponentType<{ className?: string }>;
}

const icons: IconComponent = LucideIcons as unknown as IconComponent;

export const Sidebar = () => {
  const { user } = useAuth();
  
  if (!user) return null;

  const menuItems = getMenuItemsForRole(user.role);

  const getIcon = (iconName: string) => {
    const IconComponent = icons[iconName] || icons.Layout;
    return IconComponent;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Agent Info Card */}
      <div className="p-4 border-b border-gray-100">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{user.name}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
          {user.country && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <LucideIcons.MapPin className="w-4 h-4" />
              <span>{user.country}</span>
            </div>
          )}
          {user.agentCode && (
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
              <LucideIcons.Hash className="w-4 h-4" />
              <span className="font-mono">{user.agentCode}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = getIcon(item.icon);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30' 
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Actions rapides</p>
        <div className="space-y-2">
          {user.role === 'sender_agent' && (
            <NavLink
              to="/transfers/new"
              className="flex items-center gap-2 w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
            >
              <LucideIcons.PlusCircle className="w-4 h-4" />
              Nouveau transfert
            </NavLink>
          )}
          {user.role === 'payer_agent' && (
            <NavLink
              to="/transfers/pending"
              className="flex items-center gap-2 w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
            >
              <LucideIcons.Clock className="w-4 h-4" />
              Transferts à payer
            </NavLink>
          )}
        </div>
      </div>
    </aside>
  );
};
