import { supabase } from './supabase';
import {
  UserNotification,
  NotificationDbType,
  NotificationTargetType,
  CreateNotificationDto,
} from '@hackers-unity/shared-types';

// ─── HELPERS ─────────────────────────────────────────────

function mapDbToUserNotification(row: any): UserNotification {
  return {
    id: row.id,
    userId: row.user_id,
    notificationId: row.notification_id,
    isRead: row.is_read,
    createdAt: row.created_at,
    notification: {
      id: row.notifications?.id || row.notification_id,
      title: row.notifications?.title || 'Notification',
      message: row.notifications?.message || '',
      type: row.notifications?.type || NotificationDbType.SYSTEM,
      icon: row.notifications?.icon || '🔔',
      eventId: row.notifications?.event_id || null,
      senderId: row.notifications?.sender_id || null,
      newsId: row.notifications?.news_id || null,
      actionUrl: row.notifications?.action_url || null,
      createdAt: row.notifications?.created_at || row.created_at,
    },
  };
}

// ─── FETCH USER NOTIFICATIONS ────────────────────────────

export async function fetchUserNotifications(
  userId: string,
  limit = 30,
  offset = 0
): Promise<{ data: UserNotification[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_notifications')
      .select(`
        id,
        user_id,
        notification_id,
        is_read,
        created_at,
        notifications (
          id,
          title,
          message,
          type,
          icon,
          event_id,
          sender_id,
          news_id,
          action_url,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return { data: [], error: error.message };
    return { data: (data || []).map(mapDbToUserNotification) };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch notifications' };
  }
}

// ─── GET UNREAD COUNT ────────────────────────────────────

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('user_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

// ─── MARK AS READ ────────────────────────────────────────

export async function markNotificationAsRead(
  userNotificationId: string
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', userNotificationId);

    if (error) return { error: error.message };
    return {};
  } catch (err: any) {
    return { error: err.message || 'Failed to mark as read' };
  }
}

// ─── MARK ALL AS READ ────────────────────────────────────

export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return { error: error.message };
    return {};
  } catch (err: any) {
    return { error: err.message || 'Failed to mark all as read' };
  }
}

// ─── REALTIME SUBSCRIPTION ──────────────────────────────

export function subscribeToRealtimeNotifications(
  userId: string,
  onNewNotification: (notification: UserNotification) => void
) {
  const channel = supabase
    .channel(`user-notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        // Fetch the full notification with joined data
        const { data } = await supabase
          .from('user_notifications')
          .select(`
            id,
            user_id,
            notification_id,
            is_read,
            created_at,
            notifications (
              id,
              title,
              message,
              type,
              icon,
              event_id,
              sender_id,
              news_id,
              action_url,
              created_at
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          onNewNotification(mapDbToUserNotification(data));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── CREATE NOTIFICATION (Admin/Organizer) ───────────────

export async function createNotification(
  dto: CreateNotificationDto,
  senderId: string
): Promise<{ data?: { id: string }; error?: string }> {
  try {
    // 1. Insert the master notification record
    const { data: notif, error: notifError } = await supabase
      .from('notifications')
      .insert({
        title: dto.title,
        message: dto.message,
        type: dto.type,
        icon: dto.icon || getDefaultIcon(dto.type),
        event_id: dto.eventId || null,
        news_id: dto.newsId || null,
        sender_id: senderId,
        target_type: dto.targetType,
        action_url: dto.actionUrl || null,
        metadata: dto.metadata || {},
      })
      .select('id')
      .single();

    if (notifError || !notif) {
      return { error: notifError?.message || 'Failed to create notification' };
    }

    // 2. Fan out to target users
    await fanOutNotification(notif.id, dto);

    return { data: { id: notif.id } };
  } catch (err: any) {
    return { error: err.message || 'Failed to create notification' };
  }
}

// ─── FAN OUT NOTIFICATION TO TARGET USERS ────────────────

async function fanOutNotification(
  notificationId: string,
  dto: CreateNotificationDto
) {
  let userIds: string[] = [];

  switch (dto.targetType) {
    case NotificationTargetType.ALL: {
      const { data } = await supabase
        .from('profiles')
        .select('id');
      userIds = (data || []).map((p: any) => p.id);
      break;
    }
    case NotificationTargetType.SPECIFIC_USER:
    case NotificationTargetType.SELECTED_USERS: {
      userIds = dto.targetUserIds || [];
      break;
    }
    case NotificationTargetType.EVENT_PARTICIPANTS: {
      if (dto.eventId) {
        const { data } = await supabase
          .from('registrations')
          .select('user_id')
          .eq('event_id', dto.eventId);
        userIds = (data || []).map((r: any) => r.user_id);
      }
      break;
    }
    case NotificationTargetType.EVENT_ORGANIZERS: {
      if (dto.eventId) {
        const { data } = await supabase
          .from('events')
          .select('organizer_id')
          .eq('id', dto.eventId)
          .single();
        if (data?.organizer_id) {
          userIds = [data.organizer_id];
        }
      }
      break;
    }
    case NotificationTargetType.TEAM_MEMBERS: {
      // Use metadata.team_id if available
      const teamId = dto.metadata?.team_id as string;
      if (teamId) {
        const { data } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', teamId);
        userIds = (data || []).map((m: any) => m.user_id);
      }
      break;
    }
  }

  if (userIds.length === 0) return;

  // Batch insert — deduplicate
  const uniqueIds = [...new Set(userIds)];
  const rows = uniqueIds.map((uid) => ({
    user_id: uid,
    notification_id: notificationId,
  }));

  // Insert in chunks of 500 to avoid request size limits
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await supabase
      .from('user_notifications')
      .upsert(chunk, { onConflict: 'user_id,notification_id' })
      .then(({ error }) => {
        if (error) console.warn('Fan-out chunk error:', error.message);
      });
  }
}

// ─── SEND NOTIFICATION FOR SPECIFIC USER ─────────────────

export async function sendNotificationToUser(
  userId: string,
  title: string,
  message: string,
  type: NotificationDbType,
  options?: {
    icon?: string;
    eventId?: string;
    actionUrl?: string;
    senderId?: string;
  }
): Promise<{ error?: string }> {
  try {
    const { data: notif, error: notifError } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type,
        icon: options?.icon || getDefaultIcon(type),
        event_id: options?.eventId || null,
        sender_id: options?.senderId || null,
        target_type: NotificationTargetType.SPECIFIC_USER,
        action_url: options?.actionUrl || null,
      })
      .select('id')
      .single();

    if (notifError || !notif) return { error: notifError?.message || 'Failed' };

    const { error: linkError } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        notification_id: notif.id,
      });

    if (linkError) return { error: linkError.message };
    return {};
  } catch (err: any) {
    return { error: err.message || 'Failed to send notification' };
  }
}

// ─── FETCH SENT NOTIFICATIONS (Admin View) ───────────────

export async function fetchSentNotifications(
  senderId: string,
  limit = 50
): Promise<{ data: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('sender_id', senderId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return { data: [], error: error.message };
    return { data: data || [] };
  } catch (err: any) {
    return { data: [], error: err.message };
  }
}

// ─── DEFAULT ICONS ───────────────────────────────────────

function getDefaultIcon(type: NotificationDbType): string {
  switch (type) {
    case NotificationDbType.EVENT: return '🚀';
    case NotificationDbType.REGISTRATION: return '🎉';
    case NotificationDbType.REMINDER: return '⏰';
    case NotificationDbType.ANNOUNCEMENT: return '📢';
    case NotificationDbType.TEAM: return '👥';
    case NotificationDbType.RESULT: return '🏆';
    case NotificationDbType.NEWS: return '📰';
    case NotificationDbType.SYSTEM: return '🔔';
    default: return '🔔';
  }
}

// ─── RELATIVE TIME FORMATTER ─────────────────────────────

export function formatRelativeTime(dateString: string): string {
  const now = new Date().getTime();
  const past = new Date(dateString).getTime();
  const diff = now - past;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}
