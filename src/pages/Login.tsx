import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, ArrowLeftRight, Mail, Lock, Eye, EyeOff, Globe } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Email ou mot de passe incorrect');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 border border-white/20">
          <div className="text-center mb-6 sm:mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-lg shadow-emerald-500/30">
              <div className="relative">
                <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-white absolute -left-1 -top-1 opacity-50" />
                <ArrowLeftRight className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 sm:mb-3">
              GLOBAL EXCHANGE
            </h1>
            <p className="text-gray-600 text-sm sm:text-lg">Plateforme de Transferts d'Argent</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-r-lg text-sm">
                <div className="flex items-center">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="votre.email@globalexchange.com"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center touch-manipulation"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-0">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500 active:text-emerald-700">
                  Mot de passe oublié?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 active:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 touch-manipulation min-h-[48px]"
            >
              <LogIn className="w-5 h-5" />
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion...
                </>
              ) : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
            <p className="text-xs text-center text-gray-500 mb-3 sm:mb-4 font-medium">
              Comptes de démonstration:
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs max-h-[200px] sm:max-h-none overflow-y-auto">
              <button 
                type="button"
                onClick={() => setEmail('admin@globalexchange.com')}
                className="bg-purple-50 rounded-lg p-2.5 sm:p-3 flex justify-between items-center hover:bg-purple-100 active:bg-purple-200 transition-colors touch-manipulation text-left w-full"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-purple-800 truncate text-[11px] sm:text-xs">admin@globalexchange.com</p>
                  <p className="text-purple-600 text-[10px] sm:text-xs">Administrateur</p>
                </div>
                <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded text-[10px] sm:text-xs flex-shrink-0 ml-2">Admin</span>
              </button>
              <button 
                type="button"
                onClick={() => setEmail('razack@globalexchange.com')}
                className="bg-blue-50 rounded-lg p-2.5 sm:p-3 flex justify-between items-center hover:bg-blue-100 active:bg-blue-200 transition-colors touch-manipulation text-left w-full"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-blue-800 truncate text-[11px] sm:text-xs">razack@globalexchange.com</p>
                  <p className="text-blue-600 text-[10px] sm:text-xs">Zongo Razack (USA)</p>
                </div>
                <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-[10px] sm:text-xs flex-shrink-0 ml-2">USA</span>
              </button>
              {/* Agents Burkina Faso */}
              <button 
                type="button"
                onClick={() => setEmail('bernadette@globalexchange.com')}
                className="bg-orange-50 rounded-lg p-2.5 sm:p-3 flex justify-between items-center hover:bg-orange-100 active:bg-orange-200 transition-colors touch-manipulation text-left w-full"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-orange-800 truncate text-[11px] sm:text-xs">bernadette@globalexchange.com</p>
                  <p className="text-orange-600 text-[10px] sm:text-xs">Bernadette Tassembedo</p>
                </div>
                <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-[10px] sm:text-xs flex-shrink-0 ml-2">BF</span>
              </button>
              <button 
                type="button"
                onClick={() => setEmail('abibata@globalexchange.com')}
                className="bg-orange-50 rounded-lg p-2.5 sm:p-3 flex justify-between items-center hover:bg-orange-100 active:bg-orange-200 transition-colors touch-manipulation text-left w-full"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-orange-800 truncate text-[11px] sm:text-xs">abibata@globalexchange.com</p>
                  <p className="text-orange-600 text-[10px] sm:text-xs">Abibata Zougrana</p>
                </div>
                <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-[10px] sm:text-xs flex-shrink-0 ml-2">BF</span>
              </button>
              <button 
                type="button"
                onClick={() => setEmail('mohamadi@globalexchange.com')}
                className="bg-orange-50 rounded-lg p-2.5 sm:p-3 flex justify-between items-center hover:bg-orange-100 active:bg-orange-200 transition-colors touch-manipulation text-left w-full"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-orange-800 truncate text-[11px] sm:text-xs">mohamadi@globalexchange.com</p>
                  <p className="text-orange-600 text-[10px] sm:text-xs">Mohamadi Sana</p>
                </div>
                <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-[10px] sm:text-xs flex-shrink-0 ml-2">BF</span>
              </button>
            </div>
            <p className="text-[10px] sm:text-xs text-center text-gray-400 mt-2 sm:mt-3">(N'importe quel mot de passe)</p>
          </div>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-[10px] sm:text-xs text-gray-500">
              © {new Date().getFullYear()} GLOBAL EXCHANGE. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
