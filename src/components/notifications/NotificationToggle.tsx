import React from 'react';
import { Bell, BellOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationToggleProps {
  showTest?: boolean;
  compact?: boolean;
}

export const NotificationToggle: React.FC<NotificationToggleProps> = ({ 
  showTest = false,
  compact = false 
}) => {
  const {
    isSupported,
    permission,
    subscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
    sendTest
  } = usePushNotifications();

  if (!isSupported) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <BellOff className="w-4 h-4" />
        <span>Notifications non supportées</span>
      </div>
    );
  }

  const handleToggle = async () => {
    if (subscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleTest = async () => {
    await sendTest();
  };

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`p-2 rounded-lg transition-colors ${
          subscribed 
            ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
        title={subscribed ? 'Notifications activées' : 'Activer les notifications'}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : subscribed ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            subscribed ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
          }`}>
            {subscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Notifications Push</h3>
            <p className="text-sm text-gray-500">
              {subscribed 
                ? 'Recevez des alertes même quand l\'app est fermée' 
                : 'Activez pour recevoir des alertes en temps réel'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            subscribed
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {subscribed ? 'Désactiver' : 'Activer'}
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
          <XCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {subscribed && showTest && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={handleTest}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Envoyer une notification test
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <div className="mt-3 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
          <strong>Permission refusée.</strong> Vous devez autoriser les notifications 
          dans les paramètres de votre navigateur.
        </div>
      )}
    </div>
  );
};

export default NotificationToggle;
