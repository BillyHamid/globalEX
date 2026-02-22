import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getMenuItemsForRole, getRoleLabel, getRoleColor } from '@/utils/roleConfig';
import { useMobileMenu } from './MainLayout';
import * as LucideIcons from 'lucide-react';
import { NotificationStatus } from '@/components/notifications/NotificationStatus';

interface IconComponent {
  [key: string]: React.ComponentType<{ className?: string }>;
}

const icons: IconComponent = LucideIcons as unknown as IconComponent;

export const Sidebar = () => {
  const { user } = useAuth();
  const { isOpen, close } = useMobileMenu();
  
  if (!user) return null;

  const menuItems = getMenuItemsForRole(user.role);

  const getIcon = (iconName: string) => {
    const IconComponent = icons[iconName] || icons.Layout;
    return IconComponent;
  };

  // Handle link click - close menu on mobile
  const handleLinkClick = () => {
    close();
  };

  return (
    <aside 
      className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 sm:w-80 lg:w-64 
        bg-white border-r border-gray-200 
        h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]
        top-14 sm:top-16 lg:top-0
        overflow-y-auto overflow-x-hidden
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        scrollbar-thin scrollbar-thumb-gray-300
      `}
    >
      {/* Agent Info Card */}
      <div className="p-3 sm:p-4 border-b border-gray-100">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">{user.name}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
          {user.country && (
            <div className="mt-2 sm:mt-3 flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <LucideIcons.MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{user.country}</span>
            </div>
          )}
          {user.agentCode && (
            <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <LucideIcons.Hash className="w-4 h-4 flex-shrink-0" />
              <span className="font-mono truncate">{user.agentCode}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 sm:p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = getIcon(item.icon);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200 touch-manipulation ${
                  isActive 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30' 
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="p-3 sm:p-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Actions rapides</p>
        <div className="space-y-2">
          {(user.role === 'sender_agent' || user.role === 'payer_agent') && (
            <NavLink
              to="/transfers/new"
              onClick={handleLinkClick}
              className="flex items-center gap-2 w-full px-4 py-2.5 sm:py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 active:bg-emerald-700 transition-colors text-sm font-medium touch-manipulation"
            >
              <LucideIcons.PlusCircle className="w-4 h-4 flex-shrink-0" />
              <span>Nouveau transfert</span>
            </NavLink>
          )}
          {(user.role === 'sender_agent' || user.role === 'payer_agent') && (
            <NavLink
              to="/transfers?status=pending"
              onClick={handleLinkClick}
              className="flex items-center gap-2 w-full px-4 py-2.5 sm:py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 active:bg-amber-700 transition-colors text-sm font-medium touch-manipulation"
            >
              <LucideIcons.Clock className="w-4 h-4 flex-shrink-0" />
              <span>Transferts à payer</span>
            </NavLink>
          )}
        </div>
      </div>

      {/* Notifications Status */}
      <div className="p-3 sm:p-4 border-t border-gray-100">
        <NotificationStatus />
      </div>

      {/* Mobile: User info at bottom */}
      <div className="lg:hidden p-3 sm:p-4 border-t border-gray-100 mt-auto">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <LucideIcons.User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
