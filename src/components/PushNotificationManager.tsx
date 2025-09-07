"use client";

import { useEffect, useCallback } from 'react';
import { useSpotify } from '@/context/SpotifyContext';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';

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

  const setupPushNotifications = useCallback(async () => {
    if (!session?.user || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Permission is now requested inside this user-triggered function
      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Notification permission denied.');
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key not found.');
        toast.error('Push notification setup is incomplete on the server.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
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
        throw error;
      }
      
      toast.success('Notifications enabled!');

    } catch (error) {
      console.error('Push Notification setup failed:', error);
      toast.error('Could not enable notifications.');
    }
  }, [session]);


  useEffect(() => {
    if (!session?.user) return;

    // Check if we should prompt the user
    const checkAndPrompt = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window && Notification.permission === 'default') {
        // Check if user is already subscribed in our DB to avoid re-prompting
        const { data } = await supabase
          .from('push_subscriptions')
          .select('user_id')
          .eq('user_id', session.user!.id)
          .single();

        if (!data) {
          // User is not subscribed, so we can prompt them.
          toast(
            (t) => (
              <div className="flex items-center space-x-4">
                <Bell className="w-8 h-8 text-purple-400" />
                <div className="flex-1">
                  <p className="font-bold">Stay in the loop!</p>
                  <p className="text-sm">Enable notifications for messages and friend requests.</p>
                </div>
                <button
                  onClick={() => {
                    setupPushNotifications();
                    toast.dismiss(t.id);
                  }}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-md font-semibold text-sm hover:bg-purple-700"
                >
                  Enable
                </button>
              </div>
            ),
            {
              duration: Infinity, // Keep it open until user interacts
            }
          );
        }
      }
    };

    // Delay the prompt slightly so it doesn't appear instantly on load
    const timer = setTimeout(checkAndPrompt, 5000);
    return () => clearTimeout(timer);

  }, [session, setupPushNotifications]);

  return null;
}