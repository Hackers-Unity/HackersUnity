import { supabase } from './supabase';
import {
  UserNotification,
  NotificationDbType,
  NotificationTargetType,
  CreateNotificationDto,
} from '@hackers-unity/shared-types';

const LOCAL_READ_KEY = 'hackers_unity_read_notifications';

// ─── LOCAL STORAGE HELPERS FOR READ NOTIFICATIONS ────────
export function getLocalReadNotificationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_READ_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markLocalNotificationAsRead(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalReadNotificationIds();
    current.add(id);
    localStorage.setItem(LOCAL_READ_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.warn('Failed to mark notification as read locally:', e);
  }
}

export function markAllLocalNotificationsAsRead(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalReadNotificationIds();
    ids.forEach((id) => current.add(id));
    localStorage.setItem(LOCAL_READ_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.warn('Failed to mark all notifications as read locally:', e);
  }
}

// ─── HELPERS ─────────────────────────────────────────────

function mapDbToUserNotification(row: any): UserNotification {
  const readIds = getLocalReadNotificationIds();
  const isRead = row.is_read || readIds.has(row.id) || readIds.has(row.notification_id);

  return {
    id: row.id,
    userId: row.user_id,
    notificationId: row.notification_id,
    isRead,
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

// ─── FETCH PUBLIC ANNOUNCEMENTS & EVENTS ─────────────────

export async function fetchPublicAnnouncementsAndEvents(): Promise<UserNotification[]> {
  const readIds = getLocalReadNotificationIds();
  const list: UserNotification[] = [];

  // 1. Fetch broadcast announcements from 'notifications' table
  try {
    const { data: dbNotifs } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);

    if (dbNotifs && dbNotifs.length > 0) {
      for (const n of dbNotifs) {
        list.push({
          id: n.id,
          userId: 'public',
          notificationId: n.id,
          isRead: readIds.has(n.id),
          createdAt: n.created_at,
          notification: {
            id: n.id,
            title: n.title,
            message: n.message,
            type: (n.type as NotificationDbType) || NotificationDbType.ANNOUNCEMENT,
            icon: n.icon || getDefaultIcon(n.type as NotificationDbType),
            eventId: n.event_id || null,
            senderId: n.sender_id || null,
            newsId: n.news_id || null,
            actionUrl: n.action_url || null,
            createdAt: n.created_at,
          },
        });
      }
    }
  } catch (e) {
    console.warn('Notice: public notifications fetch:', e);
  }

  // 2. Fetch live & recent events from 'events' table
  try {
    const { data: dbEvents } = await supabase
      .from('events')
      .select('id, slug, title, tagline, short_description, status, total_prize_value, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (dbEvents && dbEvents.length > 0) {
      for (const ev of dbEvents) {
        const notifId = `event-notif-${ev.id}`;
        list.push({
          id: notifId,
          userId: 'public',
          notificationId: ev.id,
          isRead: readIds.has(notifId),
          createdAt: ev.created_at || new Date().toISOString(),
          notification: {
            id: ev.id,
            title: `Hackathon: ${ev.title}`,
            message:
              ev.tagline ||
              ev.short_description ||
              `Registrations are active! Prize pool: ${ev.total_prize_value || 'Verified rewards'}. Build with top innovators.`,
            type: NotificationDbType.EVENT,
            icon: 'rocket',
            eventId: ev.id,
            senderId: null,
            newsId: null,
            actionUrl: `/hackathons/${ev.slug || ev.id}`,
            createdAt: ev.created_at || new Date().toISOString(),
          },
        });
      }
    }
  } catch (e) {
    console.warn('Notice: events notification fetch:', e);
  }

  // 3. Fallback high-value platform announcements so users always have rich announcements
  const fallbackAnnouncements: UserNotification[] = [
    {
      id: 'announcement-welcome',
      userId: 'public',
      notificationId: 'announcement-welcome',
      isRead: readIds.has('announcement-welcome'),
      createdAt: '2026-09-01T12:00:00Z',
      notification: {
        id: 'announcement-welcome',
        title: "Welcome to Hacker's Unity Platform",
        message:
          "India's premier hackathon and developer ecosystem. Explore competitions, match with teammates, and submit cutting-edge prototypes.",
        type: NotificationDbType.ANNOUNCEMENT,
        icon: 'megaphone',
        eventId: null,
        senderId: null,
        newsId: null,
        actionUrl: '/hackathons',
        createdAt: '2026-09-01T12:00:00Z',
      },
    },
    {
      id: 'announcement-teammates',
      userId: 'public',
      notificationId: 'announcement-teammates',
      isRead: readIds.has('announcement-teammates'),
      createdAt: '2026-08-20T10:00:00Z',
      notification: {
        id: 'announcement-teammates',
        title: 'Teammate Matching is Live',
        message: 'Looking for developers, designers, or AI builders? Connect and assemble your hackathon squad today.',
        type: NotificationDbType.TEAM,
        icon: 'users',
        eventId: null,
        senderId: null,
        newsId: null,
        actionUrl: '/opportunities/find-teammates',
        createdAt: '2026-08-20T10:00:00Z',
      },
    },
  ];

  for (const item of fallbackAnnouncements) {
    if (!list.some((existing) => existing.id === item.id || existing.notification.title === item.notification.title)) {
      list.push(item);
    }
  }

  // Sort by createdAt descending
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

// ─── FETCH USER NOTIFICATIONS ────────────────────────────

export async function fetchUserNotifications(
  userId?: string,
  limit = 30,
  offset = 0
): Promise<{ data: UserNotification[]; error?: string }> {
  try {
    const publicNotifs = await fetchPublicAnnouncementsAndEvents();

    if (!userId) {
      return { data: publicNotifs.slice(offset, offset + limit) };
    }

    const { data: userRows, error } = await supabase
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

    if (error) {
      return { data: publicNotifs.slice(offset, offset + limit) };
    }

    const personalNotifs: UserNotification[] = (userRows || []).map(mapDbToUserNotification);

    // Merge & deduplicate
    const seenIds = new Set<string>();
    const merged: UserNotification[] = [];

    for (const notif of [...personalNotifs, ...publicNotifs]) {
      const key = notif.notification.id || notif.id;
      if (!seenIds.has(key)) {
        seenIds.add(key);
        merged.push(notif);
      }
    }

    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { data: merged.slice(offset, offset + limit) };
  } catch (err: any) {
    const publicNotifs = await fetchPublicAnnouncementsAndEvents();
    return { data: publicNotifs };
  }
}

// ─── GET UNREAD COUNT ────────────────────────────────────

export async function getUnreadCount(userId?: string): Promise<number> {
  try {
    const { data } = await fetchUserNotifications(userId, 50);
    return (data || []).filter((n) => !n.isRead).length;
  } catch {
    return 0;
  }
}

// ─── MARK AS READ ────────────────────────────────────────

export async function markNotificationAsRead(
  userNotificationId: string
): Promise<{ error?: string }> {
  markLocalNotificationAsRead(userNotificationId);

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
  userId?: string
): Promise<{ error?: string }> {
  try {
    if (userId) {
      await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
    }
    return {};
  } catch (err: any) {
    return { error: err.message || 'Failed to mark all as read' };
  }
}

// ─── REALTIME SUBSCRIPTION (Events, Announcements & Users) ───

export function subscribeToRealtimeNotifications(
  userId: string | undefined | null,
  onNewNotification: (notification: UserNotification) => void
) {
  const channelName = `realtime-hub-${userId || 'guest'}-${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    // 1. Broadcast announcements (instant delivery to all connected browsers)
    .on('broadcast', { event: 'announcement' }, (payload: any) => {
      const p = payload.payload?.notification || payload.payload;
      if (!p) return;

      const notif: UserNotification = {
        id: p.id || `announcement-${Date.now()}`,
        userId: userId || 'public',
        notificationId: p.id || `announcement-${Date.now()}`,
        isRead: false,
        createdAt: p.createdAt || new Date().toISOString(),
        notification: {
          id: p.id || `announcement-${Date.now()}`,
          title: p.title || 'Platform Announcement',
          message: p.message || '',
          type: (p.type as NotificationDbType) || NotificationDbType.ANNOUNCEMENT,
          icon: p.icon || 'megaphone',
          eventId: p.eventId || null,
          senderId: p.senderId || null,
          newsId: p.newsId || null,
          actionUrl: p.actionUrl || null,
          createdAt: p.createdAt || new Date().toISOString(),
        },
      };
      onNewNotification(notif);
    })
    // 2. Broadcast event created / updated (from event creator)
    .on('broadcast', { event: 'event_created' }, (payload: any) => {
      const ev = payload.payload?.event || payload.payload;
      if (!ev) return;

      const notifId = `event-notif-${ev.id || Date.now()}`;
      const notif: UserNotification = {
        id: notifId,
        userId: userId || 'public',
        notificationId: ev.id,
        isRead: false,
        createdAt: new Date().toISOString(),
        notification: {
          id: ev.id,
          title: `New Hackathon: ${ev.title}`,
          message:
            ev.tagline ||
            ev.short_description ||
            `Registrations are live! Prize pool: ${ev.total_prize_value || 'Prizes'}. Assemble your squad now!`,
          type: NotificationDbType.EVENT,
          icon: 'rocket',
          eventId: ev.id,
          senderId: null,
          newsId: null,
          actionUrl: `/hackathons/${ev.slug || ev.id}`,
          createdAt: new Date().toISOString(),
        },
      };
      onNewNotification(notif);
    })
    // 3. Postgres Changes on 'events' table
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
      },
      (payload: any) => {
        const ev = payload.new;
        if (!ev) return;
        const notifId = `event-notif-${ev.id}`;
        const notif: UserNotification = {
          id: notifId,
          userId: userId || 'public',
          notificationId: ev.id,
          isRead: false,
          createdAt: ev.created_at || new Date().toISOString(),
          notification: {
            id: ev.id,
            title: `New Hackathon: ${ev.title}`,
            message:
              ev.tagline ||
              ev.short_description ||
              `A brand new hackathon is now open for registration! Check rules and join.`,
            type: NotificationDbType.EVENT,
            icon: 'rocket',
            eventId: ev.id,
            senderId: null,
            newsId: null,
            actionUrl: `/hackathons/${ev.slug || ev.id}`,
            createdAt: ev.created_at || new Date().toISOString(),
          },
        };
        onNewNotification(notif);
      }
    )
    // 4. Postgres Changes on 'notifications' table
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      },
      (payload: any) => {
        const n = payload.new;
        if (!n) return;
        const notif: UserNotification = {
          id: n.id,
          userId: userId || 'public',
          notificationId: n.id,
          isRead: false,
          createdAt: n.created_at || new Date().toISOString(),
          notification: {
            id: n.id,
            title: n.title,
            message: n.message,
            type: (n.type as NotificationDbType) || NotificationDbType.ANNOUNCEMENT,
            icon: n.icon || getDefaultIcon(n.type as NotificationDbType),
            eventId: n.event_id || null,
            senderId: n.sender_id || null,
            newsId: n.news_id || null,
            actionUrl: n.action_url || null,
            createdAt: n.created_at || new Date().toISOString(),
          },
        };
        onNewNotification(notif);
      }
    );

  // 5. If authenticated, listen to user-specific inbox
  if (userId) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${userId}`,
      },
      async (payload: any) => {
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
    );
  }

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── BROADCAST REALTIME ANNOUNCEMENT ─────────────────────

export async function broadcastAnnouncement(payload: {
  title: string;
  message: string;
  type?: NotificationDbType;
  icon?: string;
  actionUrl?: string;
  eventId?: string;
}) {
  try {
    const channel = supabase.channel('public:announcements_realtime');
    await channel.send({
      type: 'broadcast',
      event: 'announcement',
      payload: {
        notification: {
          id: `broadcast-${Date.now()}`,
          title: payload.title,
          message: payload.message,
          type: payload.type || NotificationDbType.ANNOUNCEMENT,
          icon: payload.icon || '📢',
          actionUrl: payload.actionUrl || null,
          eventId: payload.eventId || null,
          createdAt: new Date().toISOString(),
        },
      },
    });
  } catch (err) {
    console.warn('Failed to broadcast realtime announcement:', err);
  }
}

// ─── CREATE NOTIFICATION (Admin/Organizer) ───────────────

export async function createNotification(
  dto: CreateNotificationDto,
  senderId: string
): Promise<{ data?: { id: string }; error?: string }> {
  try {
    // 1. Instant Realtime Broadcast to all connected clients immediately!
    broadcastAnnouncement({
      title: dto.title,
      message: dto.message,
      type: dto.type,
      icon: dto.icon || getDefaultIcon(dto.type),
      actionUrl: dto.actionUrl || undefined,
      eventId: dto.eventId || undefined,
    });

    // 2. Insert master notification in Postgres (safely handles senderId)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(senderId);

    const { data: notif, error: notifError } = await supabase
      .from('notifications')
      .insert({
        title: dto.title,
        message: dto.message,
        type: dto.type,
        icon: dto.icon || getDefaultIcon(dto.type),
        event_id: dto.eventId || null,
        news_id: dto.newsId || null,
        sender_id: isUuid ? senderId : null,
        target_type: dto.targetType,
        action_url: dto.actionUrl || null,
        metadata: dto.metadata || {},
      })
      .select('id')
      .single();

    if (notifError || !notif) {
      // Broadcast was already sent in real time!
      return { data: { id: `broadcast-${Date.now()}` } };
    }

    // 3. Fan out to target users in user_notifications
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

  const uniqueIds = [...new Set(userIds)];
  const rows = uniqueIds.map((uid) => ({
    user_id: uid,
    notification_id: notificationId,
  }));

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
    const isSenderUuid = options?.senderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(options.senderId);

    const { data: notif, error: notifError } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type,
        icon: options?.icon || getDefaultIcon(type),
        event_id: options?.eventId || null,
        sender_id: isSenderUuid ? options?.senderId : null,
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
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return { data: [], error: error.message };
    return { data: data || [] };
  } catch (err: any) {
    return { data: [], error: err.message };
  }
}

// ─── DEFAULT ICONS ───────────────────────────────────────

export function getDefaultIcon(type: NotificationDbType): string {
  switch (type) {
    case NotificationDbType.EVENT: return 'rocket';
    case NotificationDbType.REGISTRATION: return 'sparkles';
    case NotificationDbType.REMINDER: return 'calendar';
    case NotificationDbType.ANNOUNCEMENT: return 'megaphone';
    case NotificationDbType.TEAM: return 'users';
    case NotificationDbType.RESULT: return 'trophy';
    case NotificationDbType.NEWS: return 'newspaper';
    case NotificationDbType.SYSTEM: return 'bell';
    default: return 'bell';
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
