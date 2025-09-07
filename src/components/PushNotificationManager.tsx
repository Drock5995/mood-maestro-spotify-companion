"use client";

import { useEffect } from 'react';
import { useSpotify } from '@/context/SpotifyContext';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
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

export default function PushNotificationManager() {
  const { session } = useSpotify();

  useEffect(() => {
    if (!session?.user) return;

    const setupPushNotifications = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          
          let subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            console.log('User is already subscribed.');
            return;
          }

          const permission = await window.Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('Notification permission not granted.');
            return;
          }

          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          console.log("VAPID Public Key from env:", vapidPublicKey); // Debugging log
          if (!vapidPublicKey) {
            console.error('VAPID public key not found in environment.');
            toast.error('Push notification setup is incomplete on the server.');
            return;
          }

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });

          const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
              user_id: session.user.id,
              subscription: subscription.toJSON(),
            }, { onConflict: 'user_id' });

          if (error) {
            console.error('Error saving push subscription:', error);
            toast.error('Failed to save notification settings.');
          } else {
            console.log('User subscribed to push notifications.');
            toast.success('Notifications enabled!');
          }

        } catch (error) {
          console.error('Service Worker registration failed:', error);
          if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
          }
          toast.error('Could not enable notifications. Please check permissions and try again.');
        }
      }
    };

    const timer = setTimeout(setupPushNotifications, 3000);
    return () => clearTimeout(timer);

  }, [session]);

  return null;
}