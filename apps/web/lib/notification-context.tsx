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
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [latestToast, setLatestToast] = useState<UserNotification | null>(null);

  // Track subscription cleanup to prevent duplicates
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const activeSubKeyRef = useRef<string | null>(null);

  // Load notifications (works for both guests and logged-in users!)
  const loadNotifications = useCallback(async (userId?: string) => {
    setLoading(true);
    try {
      const [notifResult, countResult] = await Promise.all([
        fetchUserNotifications(userId, 30),
        getUnreadCount(userId),
      ]);
      setNotifications(notifResult.data);
      setUnreadCount(countResult);
    } catch (err) {
      console.warn('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup / teardown realtime subscription for events, announcements & user inbox
  useEffect(() => {
    const currentKey = user?.id || 'guest_all';

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

    // Load initial notifications
    loadNotifications(user?.id);

    // Subscribe to realtime hub (events, announcements, user notifications)
    const cleanup = subscribeToRealtimeNotifications(user?.id, (newNotif) => {
      setNotifications((prev) => {
        // Deduplicate
        if (
          prev.some(
            (n) =>
              n.id === newNotif.id ||
              (n.notification?.id && n.notification.id === newNotif.notification?.id)
          )
        ) {
          return prev;
        }
        return [newNotif, ...prev];
      });

      setUnreadCount((prev) => prev + 1);

      // Trigger instant toast notification popup
      setLatestToast(newNotif);
    });

    unsubscribeRef.current = cleanup;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      activeSubKeyRef.current = null;
    };
  }, [user?.id, loadNotifications]);

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
      user?.id &&
      !userNotificationId.startsWith('event-notif-') &&
      !userNotificationId.startsWith('announcement-')
    ) {
      await markNotificationAsRead(userNotificationId);
    }
  }, [user?.id]);

  const markAllAsRead = useCallback(async () => {
    const allIds = notifications.map((n) => n.id);
    markAllLocalNotificationsAsRead(allIds);

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    if (user?.id) {
      await markAllNotificationsAsRead(user.id);
    }
  }, [user?.id, notifications]);

  const refreshNotifications = useCallback(async () => {
    await loadNotifications(user?.id);
  }, [user?.id, loadNotifications]);

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
