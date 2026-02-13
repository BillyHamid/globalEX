import React from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * Simple notification status indicator
 * Shows if notifications are enabled and allows toggling
 */
export const NotificationStatus: React.FC = () => {
  const {
    isSupported,
    permission,
    subscribed,
    loading,
    subscribe,
    unsubscribe
  } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const handleClick = async () => {
    if (subscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || permission === 'denied'}
      className={`
        flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors
        ${subscribed 
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
        ${permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      title={permission === 'denied' ? 'Notifications bloquées dans le navigateur' : ''}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : subscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      <span className="flex-1 text-left">
        {subscribed ? 'Notifications activées' : 'Notifications désactivées'}
      </span>
      {subscribed && (
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
      )}
    </button>
  );
};

export default NotificationStatus;
