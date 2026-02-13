import { LogOut, Bell, Search, User, ArrowLeftRight, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getRoleLabel } from '@/utils/roleConfig';
import { useMobileMenu } from './MainLayout';
import { useState } from 'react';

export const TopNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isOpen, toggle } = useMobileMenu();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-emerald-600 to-teal-700 h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between shadow-lg sticky top-0 z-50">
      {/* Left side - Logo & Menu button */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Hamburger menu - mobile only */}
        <button 
          onClick={toggle}
          className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="hidden xs:block">
            <h1 className="text-base sm:text-xl font-bold text-white">GLOBAL EXCHANGE</h1>
            <p className="text-[10px] sm:text-xs text-emerald-100 hidden sm:block">Transferts d'argent</p>
          </div>
          {/* Short name on very small screens */}
          <h1 className="xs:hidden text-base font-bold text-white">GX</h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 sm:gap-4">
        {/* Search - Desktop */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un transfert..."
            className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 w-48 lg:w-64 text-white placeholder-white/60 text-sm"
          />
        </div>

        {/* Search button - Mobile */}
        <button 
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="md:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
        </button>

        {/* User info - Hidden on mobile, shown on tablet+ */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-white/20">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-white truncate max-w-[120px]">{user?.name}</p>
            <p className="text-xs text-emerald-100">{user && getRoleLabel(user.role)}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Logout only on very small screens */}
        <button
          onClick={handleLogout}
          className="sm:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Déconnexion"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile search bar - Full width dropdown */}
      {showMobileSearch && (
        <div className="absolute top-full left-0 right-0 p-3 bg-gradient-to-r from-emerald-600 to-teal-700 md:hidden border-t border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un transfert..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/60"
              autoFocus
            />
          </div>
        </div>
      )}
    </nav>
  );
};
