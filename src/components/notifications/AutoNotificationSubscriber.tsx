import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  isPushSupported,
  getPermissionStatus,
  subscribeToPush,
  registerServiceWorker
} from '@/services/pushNotifications';

/**
 * Component that automatically subscribes to push notifications on login
 * Especially important for payer_agents who need to receive transfer alerts
 */
export const AutoNotificationSubscriber: React.FC = () => {
  const { isAuthenticated, token, user } = useAuth();
  const hasAttempted = useRef(false);

  useEffect(() => {
    const autoSubscribe = async () => {
      // Only attempt once per session
      if (hasAttempted.current) return;
      
      // Must be authenticated with a token
      if (!isAuthenticated || !token) return;
      
      // Check if push is supported
      if (!isPushSupported()) {
        console.log('Push notifications not supported');
        return;
      }

      // Check current permission status
      const permission = getPermissionStatus();
      
      // If already denied, don't bother
      if (permission === 'denied') {
        console.log('Notification permission denied');
        return;
      }

      hasAttempted.current = true;

      try {
        // Register service worker first
        await registerServiceWorker();

        // If permission is default, request it (browser will show prompt)
        // If granted, subscribe directly
        if (permission === 'granted' || permission === 'default') {
          console.log('Auto-subscribing to push notifications...');
          const success = await subscribeToPush(token);
          
          if (success) {
            console.log('✅ Auto-subscribed to push notifications');
          }
        }
      } catch (error) {
        console.error('Auto-subscribe failed:', error);
      }
    };

    // Small delay to ensure everything is loaded
    const timer = setTimeout(autoSubscribe, 2000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, token, user]);

  // This component doesn't render anything
  return null;
};

export default AutoNotificationSubscriber;
