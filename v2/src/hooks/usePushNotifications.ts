"use client";

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api-client';

// Convert base64 URL to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
      
      // iOS Safari specific: check if running as PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      if (isIOS && !isStandalone && !supported) {
        setError('ב-Safari באייפון, יש להוסיף את האתר למסך הבית כדי לקבל התראות Push');
      }
    };
    
    checkSupport();
  }, []);

  // Check existing subscription on mount
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported) {
        setLoading(false);
        return;
      }
      
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        
        if (existingSub) {
          setSubscription(existingSub);
          setIsSubscribed(true);
        }
      } catch (err: any) {
        console.error('Error checking subscription:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkSubscription();
  }, [isSupported]);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications not supported');
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/sw-push.js');
      return registration;
    } catch (err: any) {
      console.error('Service Worker registration failed:', err);
      throw err;
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications not supported');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        setError('Notification permission denied');
        setLoading(false);
        return false;
      }
      
      // Register service worker
      const registration = await registerServiceWorker();
      await navigator.serviceWorker.ready;
      
      // Get VAPID public key from server
      const { data: { publicKey } } = await api.get('/push/vapid-public-key');
      
      // Subscribe to push manager
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      
      // Send subscription to server
      await api.post('/push/subscribe', {
        endpoint: sub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sub.getKey('p256dh')!)))),
          auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sub.getKey('auth')!))))
        }
      });
      
      setSubscription(sub);
      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Push subscription error:', err);
      setError(err.message || 'Failed to subscribe');
      setLoading(false);
      return false;
    }
  }, [isSupported, registerServiceWorker]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) {
      return true;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await subscription.unsubscribe();
      await api.delete('/push/unsubscribe');
      
      setSubscription(null);
      setIsSubscribed(false);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Push unsubscribe error:', err);
      setError(err.message || 'Failed to unsubscribe');
      setLoading(false);
      return false;
    }
  }, [subscription]);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    error,
    subscribe,
    unsubscribe
  };
};

export default usePushNotifications;
