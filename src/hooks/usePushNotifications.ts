import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  isPushSupported,
  getPermissionStatus,
  isSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestNotification,
  registerServiceWorker
} from '@/services/pushNotifications';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  loading: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTest: () => Promise<boolean>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const { isAuthenticated, token } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check support and status on mount
  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true);
      setError(null);

      const supported = isPushSupported();
      setIsSupported(supported);

      if (supported) {
        setPermission(getPermissionStatus());
        
        // Register service worker
        await registerServiceWorker();
        
        // Check subscription status
        const isSub = await isSubscribed();
        setSubscribed(isSub);
      }

      setLoading(false);
    };

    checkStatus();
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Vous devez être connecté');
      return false;
    }

    // Get token from context or localStorage
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      setError('Token non disponible. Veuillez vous reconnecter.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await subscribeToPush(authToken);
      if (success) {
        setSubscribed(true);
        setPermission('granted');
      } else {
        setError('Échec de l\'abonnement');
      }
      return success;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'abonnement');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const authToken = token || localStorage.getItem('token') || '';
      const success = await unsubscribeFromPush(authToken);
      if (success) {
        setSubscribed(false);
      }
      return success;
    } catch (err: any) {
      setError(err.message || 'Erreur lors du désabonnement');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Send test notification
  const sendTest = useCallback(async (): Promise<boolean> => {
    if (!subscribed) {
      setError('Vous devez d\'abord activer les notifications');
      return false;
    }

    try {
      const authToken = token || localStorage.getItem('token') || '';
      return await sendTestNotification(authToken);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi');
      return false;
    }
  }, [subscribed, token]);

  return {
    isSupported,
    permission,
    subscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
    sendTest
  };
};
