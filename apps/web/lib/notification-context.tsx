'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './auth-context';
import { UserNotification } from '@hackers-unity/shared-types';
import {
  fetchUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markLocalNotificationAsRead,
  markAllLocalNotificationsAsRead,
  subscribeToRealtimeNotifications,
} from './notification-service';

interface NotificationContextType {
  notifications: UserNotification[];
  unreadCount: number;
  loading: boolean;
  /** Newly arrived realtime notification (for toast display) */
  latestToast: UserNotification | null;
  /** Clear the latest toast (after it's been displayed) */
  dismissToast: () => void;
  markAsRead: (userNotificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, supabaseUser } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [latestToast, setLatestToast] = useState<UserNotification | null>(null);

  const userId = supabaseUser?.id || user?.id;
  const userEmail = supabaseUser?.email || user?.email;

  // Track subscription cleanup and loading status to prevent duplicates and flickering
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const activeSubKeyRef = useRef<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  // Load notifications (works for both guests and logged-in users!)
  const loadNotifications = useCallback(async (uid?: string, email?: string, silent = false) => {
    // Only show full loading spinner on true initial load before any data is cached
    if (!silent && !hasLoadedOnceRef.current) {
      setLoading(true);
    }
    try {
      const notifResult = await fetchUserNotifications(uid, email, 30);
      const items = notifResult?.data || [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.isRead).length);
      hasLoadedOnceRef.current = true;
    } catch (err) {
      console.warn('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup / teardown realtime subscription for events, announcements, team invites & user inbox
  useEffect(() => {
    const currentKey = `${userId || 'guest'}_${userEmail || 'noemail'}`;

    // Avoid duplicate subscriptions if key hasn't changed
    if (activeSubKeyRef.current === currentKey && unsubscribeRef.current) {
      return;
    }

    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    activeSubKeyRef.current = currentKey;

    // Load notifications silently if we already have notifications
    loadNotifications(userId, userEmail, hasLoadedOnceRef.current);

    // Subscribe to realtime hub (events, announcements, team invites, user notifications)
    const cleanup = subscribeToRealtimeNotifications(
      userId,
      (newNotif) => {
        setNotifications((prev) => {
          const inviteToken = newNotif.notification?.metadata?.inviteToken;
          // Deduplicate
          if (
            prev.some((n) => {
              if (inviteToken && n.notification?.metadata?.inviteToken === inviteToken) {
                return true;
              }
              return (
                n.id === newNotif.id ||
                (n.notification?.id && n.notification.id === newNotif.notification?.id)
              );
            })
          ) {
            return prev;
          }
          return [newNotif, ...prev];
        });

        setUnreadCount((prev) => prev + 1);

        // Trigger instant toast notification popup
        setLatestToast(newNotif);
      },
      userEmail
    );

    unsubscribeRef.current = cleanup;

    // Also listen to local storage changes to reload notifications across tabs or local invite actions (debounced)
    let storageTimer: ReturnType<typeof setTimeout> | null = null;
    const handleStorageChange = () => {
      if (storageTimer) clearTimeout(storageTimer);
      storageTimer = setTimeout(() => {
        loadNotifications(userId, userEmail, true);
      }, 500);
    };
    window.addEventListener('hackers_unity_storage_change', handleStorageChange);

    return () => {
      if (storageTimer) clearTimeout(storageTimer);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      window.removeEventListener('hackers_unity_storage_change', handleStorageChange);
    };
  }, [userId, userEmail, loadNotifications]);

  const markAsRead = useCallback(async (userNotificationId: string) => {
    // 1. Mark in localStorage
    markLocalNotificationAsRead(userNotificationId);

    // 2. Optimistic local update
    setNotifications((prev) =>
      prev.map((n) => (n.id === userNotificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // 3. If signed in and valid DB notification, mark in Supabase
    if (
      userId &&
      !userNotificationId.startsWith('event-notif-') &&
      !userNotificationId.startsWith('announcement-') &&
      !userNotificationId.startsWith('invite-')
    ) {
      await markNotificationAsRead(userNotificationId);
    }
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    const allIds = notifications.map((n) => n.id);
    markAllLocalNotificationsAsRead(allIds);

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    if (userId) {
      await markAllNotificationsAsRead(userId);
    }
  }, [userId, notifications]);

  const refreshNotifications = useCallback(async () => {
    await loadNotifications(userId, userEmail);
  }, [userId, userEmail, loadNotifications]);

  const dismissToast = useCallback(() => {
    setLatestToast(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        latestToast,
        dismissToast,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
