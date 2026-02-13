import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { statsAPI } from '@/services/api';
import { 
  Globe, Calendar, RefreshCw, TrendingUp, DollarSign,
  Loader2, XCircle, ArrowUpRight, ArrowDownRight,
  CheckCircle, Clock, Users
} from 'lucide-react';

interface CountryStats {
  transfers: number;
  totalSent?: number;
  totalReceived?: number;
  totalFees?: number;
  pending: number;
  paid: number;
}

export const CountryStats = () => {
  const { user } = useAuth();
  const [usaStats, setUsaStats] = useState<CountryStats | null>(null);
  const [bfStats, setBfStats] = useState<CountryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);

    try {
      const data = await statsAPI.getStatsByCountry({ date: selectedDate });
      setUsaStats(data.usa);
      setBfStats(data.bf);
    } catch (err: any) {
      console.error('Error fetching country stats:', err);
      setError(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedDate]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-emerald-600" />
            Statistiques par Pays
          </h1>
          <p className="text-gray-600">Vue séparée USA et Burkina Faso</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-xl border border-red-100 p-6 text-center">
          <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => fetchStats()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* USA Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🇺🇸</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">États-Unis</h2>
                  <p className="text-sm text-gray-600">Agents expéditeurs</p>
                </div>
              </div>
              <ArrowUpRight className="w-6 h-6 text-blue-600" />
            </div>

            {usaStats && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <p className="text-sm text-gray-500 mb-1">Transferts</p>
                    <p className="text-2xl font-bold text-gray-900">{usaStats.transfers}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <p className="text-sm text-gray-500 mb-1">Total envoyé</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${usaStats.totalSent?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <p className="text-sm text-gray-500 mb-1">Frais totaux</p>
                    <p className="text-2xl font-bold text-amber-600">
                      ${usaStats.totalFees?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <p className="text-sm text-gray-500 mb-1">En attente</p>
                    <p className="text-2xl font-bold text-amber-600">{usaStats.pending}</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Payés</p>
                      <p className="text-2xl font-bold text-emerald-600">{usaStats.paid}</p>
                    </div>
                    {usaStats.transfers > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Taux de réussite</p>
                        <p className="text-xl font-bold text-emerald-600">
                          {Math.round((usaStats.paid / usaStats.transfers) * 100)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BF Stats */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🇧🇫</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Burkina Faso</h2>
                  <p className="text-sm text-gray-600">Agents payeurs</p>
                </div>
              </div>
              <ArrowDownRight className="w-6 h-6 text-emerald-600" />
            </div>

            {bfStats && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-emerald-100">
                    <p className="text-sm text-gray-500 mb-1">Transferts</p>
                    <p className="text-2xl font-bold text-gray-900">{bfStats.transfers}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-emerald-100">
                    <p className="text-sm text-gray-500 mb-1">Total reçu</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {bfStats.totalReceived?.toLocaleString() || '0'} XOF
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-emerald-100">
                    <p className="text-sm text-gray-500 mb-1">En attente</p>
                    <p className="text-2xl font-bold text-amber-600">{bfStats.pending}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-emerald-100">
                    <p className="text-sm text-gray-500 mb-1">Payés</p>
                    <p className="text-2xl font-bold text-emerald-600">{bfStats.paid}</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-emerald-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Taux de paiement</p>
                      {bfStats.transfers > 0 && (
                        <p className="text-2xl font-bold text-emerald-600">
                          {Math.round((bfStats.paid / bfStats.transfers) * 100)}%
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Volume moyen</p>
                      {bfStats.paid > 0 && bfStats.totalReceived && (
                        <p className="text-xl font-bold text-emerald-600">
                          {Math.round((bfStats.totalReceived / bfStats.paid) / 1000)}k XOF
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparison Summary */}
      {usaStats && bfStats && !loading && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Résumé Comparatif
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-gray-600 mb-1">Total envoyé (USA)</p>
              <p className="text-xl font-bold text-blue-600">
                ${usaStats.totalSent?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <p className="text-sm text-gray-600 mb-1">Total reçu (BF)</p>
              <p className="text-xl font-bold text-emerald-600">
                {bfStats.totalReceived?.toLocaleString() || '0'} XOF
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <p className="text-sm text-gray-600 mb-1">Frais totaux</p>
              <p className="text-xl font-bold text-purple-600">
                ${usaStats.totalFees?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
