import { KPI } from '@/types';
import * as LucideIcons from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  kpi: KPI;
}

interface IconComponent {
  [key: string]: React.ComponentType<{ className?: string }>;
}

const icons: IconComponent = LucideIcons as unknown as IconComponent;

export const KPICard: React.FC<KPICardProps> = ({ kpi }) => {
  const Icon = kpi.icon ? icons[kpi.icon] || icons.TrendingUp : null;

  // Déterminer la couleur de fond en fonction de l'icône
  const getBgColor = () => {
    if (kpi.icon === 'TrendingUp' || kpi.icon === 'CheckCircle' || kpi.icon === 'Package') {
      return 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100';
    } else if (kpi.icon === 'TrendingDown' || kpi.icon === 'XCircle' || kpi.icon === 'AlertTriangle') {
      return 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-100';
    } else if (kpi.icon === 'DollarSign' || kpi.icon === 'Wallet' || kpi.icon === 'TrendingUp') {
      return 'bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100';
    } else if (kpi.icon === 'Users' || kpi.icon === 'Building2') {
      return 'bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100';
    } else {
      return 'bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-100';
    }
  };

  // Déterminer la couleur de l'icône
  const getIconColor = () => {
    if (kpi.icon === 'TrendingUp' || kpi.icon === 'CheckCircle' || kpi.icon === 'Package') {
      return 'text-green-600';
    } else if (kpi.icon === 'TrendingDown' || kpi.icon === 'XCircle' || kpi.icon === 'AlertTriangle') {
      return 'text-red-600';
    } else if (kpi.icon === 'DollarSign' || kpi.icon === 'Wallet' || kpi.icon === 'TrendingUp') {
      return 'text-blue-600';
    } else if (kpi.icon === 'Users' || kpi.icon === 'Building2') {
      return 'text-indigo-600';
    } else {
      return 'text-gray-600';
    }
  };

  return (
    <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg transition-all duration-300 hover:shadow-xl active:shadow-md ${getBgColor()}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2 truncate">{kpi.label}</p>
          <p className="text-lg sm:text-xl lg:text-3xl font-bold text-gray-900 truncate">{kpi.value}</p>
          {kpi.change !== undefined && (
            <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-3 flex-wrap">
              {kpi.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              ) : kpi.trend === 'down' ? (
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
              ) : null}
              <span
                className={`text-xs sm:text-sm font-semibold ${
                  kpi.trend === 'up'
                    ? 'text-green-700'
                    : kpi.trend === 'down'
                    ? 'text-red-700'
                    : 'text-gray-700'
                }`}
              >
                {kpi.change > 0 ? '+' : ''}
                {kpi.change}%
              </span>
              <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:inline">vs précédent</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-2 sm:p-3 lg:p-4 bg-white rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
            <Icon className={`w-5 h-5 sm:w-6 lg:w-7 sm:h-6 lg:h-7 ${getIconColor()}`} />
          </div>
        )}
      </div>
    </div>
  );
};
