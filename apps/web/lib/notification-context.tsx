'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './auth-context';
import { UserNotification } from '@hackers-unity/shared-types';
import {
  fetchUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
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
  const [loading, setLoading] = useState(false);
  const [latestToast, setLatestToast] = useState<UserNotification | null>(null);

  // Track subscription cleanup to prevent duplicates
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Load notifications when user changes
  const loadNotifications = useCallback(async (userId: string) => {
    setLoading(true);
    const [notifResult, countResult] = await Promise.all([
      fetchUserNotifications(userId, 30),
      getUnreadCount(userId),
    ]);
    setNotifications(notifResult.data);
    setUnreadCount(countResult);
    setLoading(false);
  }, []);

  // Setup / teardown realtime subscription
  useEffect(() => {
    // Cleanup previous subscription if user changes
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!user?.id) {
      // No user — reset state
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      userIdRef.current = null;
      return;
    }

    // Prevent duplicate subscriptions for the same user
    if (userIdRef.current === user.id) return;
    userIdRef.current = user.id;

    // Load initial notifications
    loadNotifications(user.id);

    // Subscribe to realtime
    const cleanup = subscribeToRealtimeNotifications(user.id, (newNotif) => {
      // Add to the top of the list
      setNotifications((prev) => {
        // Prevent duplicates
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
      // Trigger toast
      setLatestToast(newNotif);
    });

    unsubscribeRef.current = cleanup;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      userIdRef.current = null;
    };
  }, [user?.id, loadNotifications]);

  const markAsRead = useCallback(async (userNotificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === userNotificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await markNotificationAsRead(userNotificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    await markAllNotificationsAsRead(user.id);
  }, [user?.id]);

  const refreshNotifications = useCallback(async () => {
    if (user?.id) {
      await loadNotifications(user.id);
    }
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
