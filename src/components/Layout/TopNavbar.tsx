import { LogOut, Bell, Search, User, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getRoleLabel } from '@/utils/roleConfig';

export const TopNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-emerald-600 to-teal-700 h-16 px-6 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">GLOBAL EXCHANGE</h1>
            <p className="text-xs text-emerald-100">Transferts d'argent</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un transfert..."
            className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 w-64 text-white placeholder-white/60"
          />
        </div>

        <button className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/20">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-emerald-100">{user && getRoleLabel(user.role)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
            <User className="w-5 h-5 text-white" />
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
