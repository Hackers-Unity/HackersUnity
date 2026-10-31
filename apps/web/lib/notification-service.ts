import { supabase } from './supabase';
import { getLocalPendingInvitesForEmail } from './storage';
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
      metadata: row.notifications?.metadata || null,
    },
  };
}

// ─── FETCH PUBLIC ANNOUNCEMENTS & EVENTS ─────────────────

export async function fetchPublicAnnouncementsAndEvents(): Promise<UserNotification[]> {
  const readIds = getLocalReadNotificationIds();
  const list: UserNotification[] = [];

  // 1. Fetch broadcast announcements from 'notifications' table (strictly target_type === 'all' and public types)
  try {
    const { data: dbNotifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('target_type', 'all')
      .in('type', ['event', 'announcement', 'news', 'system', 'reminder'])
      .order('created_at', { ascending: false })
      .limit(15);

    if (dbNotifs && dbNotifs.length > 0) {
      for (const n of dbNotifs) {
        // Enforce safety: Registrations and submissions are strictly never public
        if (n.target_type !== 'all') continue;
        if (n.type === 'registration') continue;
        const titleLower = (n.title || '').toLowerCase();
        if (
          titleLower.includes('registration') ||
          titleLower.includes('payment confirmed') ||
          titleLower.includes('submitted') ||
          titleLower.includes('submission')
        ) {
          continue;
        }

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
    let optOutNewEvents = false;
    if (typeof window !== 'undefined') {
      try {
        const rawPrefs = localStorage.getItem('hackers_unity_notification_prefs');
        if (rawPrefs) {
          const parsed = JSON.parse(rawPrefs);
          if (parsed.notifyNewEvents === false) optOutNewEvents = true;
        }
      } catch {}
    }

    if (!optOutNewEvents) {
      let dbEvents: any[] = [];
      if (typeof window !== 'undefined') {
        try {
          const res = await fetch('/api/events', { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.events)) {
              dbEvents = json.events.slice(0, 10);
            }
          }
        } catch {}
      }

      if (dbEvents.length === 0) {
        const { data } = await supabase
          .from('events')
          .select('id, slug, title, tagline, short_description, status, total_prize_value, created_at')
          .in('status', ['PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED'])
          .order('created_at', { ascending: false })
          .limit(10);
        if (data) dbEvents = data;
      }

      if (dbEvents && dbEvents.length > 0) {
        for (const ev of dbEvents) {
          const s = String(ev.status || '').toUpperCase();
          if (s === 'REJECTED' || s === 'DRAFT' || s === 'PENDING_APPROVAL') continue;
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
  userEmailOrLimit?: string | number,
  limitOrOffset = 30,
  offsetVal = 0
): Promise<{ data: UserNotification[]; error?: string }> {
  let userEmail: string | undefined;
  let limit = 30;
  let offset = 0;

  if (typeof userEmailOrLimit === 'string') {
    userEmail = userEmailOrLimit;
    limit = typeof limitOrOffset === 'number' ? limitOrOffset : 30;
    offset = typeof offsetVal === 'number' ? offsetVal : 0;
  } else if (typeof userEmailOrLimit === 'number') {
    limit = userEmailOrLimit;
    offset = typeof limitOrOffset === 'number' ? limitOrOffset : 0;
  }

  try {
    const readIds = getLocalReadNotificationIds();
    const publicNotifs = await fetchPublicAnnouncementsAndEvents();

    // 1. Fetch pending team invites for the user's email
    const inviteNotifs: UserNotification[] = [];
    if (userEmail) {
      const cleanEmail = userEmail.toLowerCase().trim();
      try {
        // Query Supabase for pending invitations
        const { data: dbInvites } = await supabase
          .from('team_invitations')
          .select(`
            id,
            team_id,
            event_id,
            invited_by,
            invited_email,
            status,
            invite_token,
            created_at,
            teams (
              id,
              name,
              leader_id,
              profiles:leader_id (name, email, avatar_url)
            ),
            events (
              id,
              title,
              slug
            ),
            profiles:invited_by (
              name,
              email
            )
          `)
          .ilike('invited_email', cleanEmail)
          .eq('status', 'PENDING')
          .order('created_at', { ascending: false });

        // Query local storage pending invites
        const localInvites = getLocalPendingInvitesForEmail(cleanEmail);
        const allPending = [...(dbInvites || []), ...localInvites];

        const seenTokens = new Set<string>();
        for (const inv of allPending) {
          const token = inv.invite_token || inv.id;
          if (!token || seenTokens.has(token)) continue;
          seenTokens.add(token);

          const notifId = `invite-${inv.id || token}`;
          const isRead = readIds.has(notifId) || readIds.has(token);
          const teamName = inv.teams?.name || 'Squad';
          const eventTitle = inv.events?.title || 'Hackathon';
          const eventSlug = inv.events?.slug || inv.event_id || 'wchl-2025';
          const inviterName = inv.profiles?.name || inv.teams?.profiles?.name || 'Squad Leader';

          inviteNotifs.push({
            id: notifId,
            userId: userId || 'public',
            notificationId: notifId,
            isRead,
            createdAt: inv.created_at || new Date().toISOString(),
            notification: {
              id: notifId,
              title: `Squad Invite: ${teamName}`,
              message: `${inviterName} invited you to join "${teamName}" for ${eventTitle}!`,
              type: NotificationDbType.TEAM,
              icon: 'users',
              eventId: inv.event_id || null,
              senderId: inv.invited_by || null,
              newsId: null,
              actionUrl: `/hackathons/${eventSlug}/invite?token=${inv.invite_token}`,
              createdAt: inv.created_at || new Date().toISOString(),
              metadata: {
                inviteToken: inv.invite_token,
                teamId: inv.team_id,
                teamName: teamName,
                eventSlug: eventSlug,
                eventTitle: eventTitle,
                invitedByName: inviterName,
                status: inv.status || 'PENDING',
              },
            },
          });
        }
      } catch (inviteErr) {
        console.warn('Error fetching team invite notifications:', inviteErr);
      }
    }

    if (!userId && !userEmail) {
      return { data: publicNotifs.slice(offset, offset + limit) };
    }

    let personalNotifs: UserNotification[] = [];
    if (userId) {
      // 1. Identify all events hosted or co-hosted by this user
      const hostedEventIds = new Set<string>();
      let isPlatformAdmin = false;

      try {
        const [hostedRes, adminEventsRes, profileRes] = await Promise.all([
          supabase.from('events').select('id, slug').eq('organizer_id', userId),
          supabase.from('event_admins').select('event_id').eq('user_id', userId),
          supabase.from('profiles').select('role').eq('id', userId).maybeSingle(),
        ]);

        if (hostedRes.data) {
          hostedRes.data.forEach((ev: any) => {
            if (ev.id) hostedEventIds.add(ev.id);
            if (ev.slug) hostedEventIds.add(ev.slug);
          });
        }
        if (adminEventsRes.data) {
          adminEventsRes.data.forEach((ch: any) => {
            if (ch.event_id) hostedEventIds.add(ch.event_id);
          });
        }
        if (profileRes.data?.role === 'ADMIN' || profileRes.data?.role === 'SUPER_ADMIN') {
          isPlatformAdmin = true;
        }
      } catch (hostLookupErr) {
        console.warn('Notice host lookup error:', hostLookupErr);
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
            metadata,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!error && userRows) {
        const rawPersonal = userRows.map(mapDbToUserNotification);

        // Filter: registrations and submissions must ONLY go to the host who organized the event
        personalNotifs = rawPersonal.filter((notif) => {
          const type = notif.notification.type;
          const titleLower = (notif.notification.title || '').toLowerCase();
          const actionUrl = notif.notification.actionUrl || '';
          const isReg =
            type === NotificationDbType.REGISTRATION ||
            titleLower.includes('registration');
          const isSub =
            Boolean(notif.notification.metadata?.isSubmission) ||
            titleLower.includes('project submitted') ||
            titleLower.includes('submission received') ||
            actionUrl.includes('/submissions') ||
            actionUrl.includes('/registrations');

          if (isReg || isSub) {
            const evId = notif.notification.eventId;
            const isHost = isPlatformAdmin || (evId ? hostedEventIds.has(evId) : false);
            // Only event hosts/organizers should receive registration and submission alerts
            return isHost;
          }

          // Other notifications (team invites, reminders, system updates) are allowed for the user
          return true;
        });
      }
    }

    // Merge & deduplicate
    const seenKeys = new Set<string>();
    const merged: UserNotification[] = [];

    // Prioritize pending invites first, then personal notifications, then public announcements
    for (const notif of [...inviteNotifs, ...personalNotifs, ...publicNotifs]) {
      const inviteToken = notif.notification.metadata?.inviteToken;
      const key = inviteToken ? `invite-token-${inviteToken}` : notif.notification.id || notif.id;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
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

export async function getUnreadCount(userId?: string, userEmail?: string): Promise<number> {
  try {
    const { data } = await fetchUserNotifications(userId, userEmail, 50);
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
  onNewNotification: (notification: UserNotification) => void,
  userEmail?: string | null
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
    // 2.5. Broadcast team invite (instant delivery to recipient by email or userId)
    .on('broadcast', { event: 'team_invite' }, (payload: any) => {
      const p = payload.payload;
      if (!p) return;

      const emailMatches = Boolean(
        userEmail &&
        p.invitedEmail &&
        p.invitedEmail.toLowerCase().trim() === userEmail.toLowerCase().trim()
      );
      const userMatches = Boolean(userId && p.targetUserId && p.targetUserId === userId);

      if (!emailMatches && !userMatches) return;

      const notifId = `invite-live-${p.inviteToken || Date.now()}`;
      const notif: UserNotification = {
        id: notifId,
        userId: userId || 'public',
        notificationId: notifId,
        isRead: false,
        createdAt: p.createdAt || new Date().toISOString(),
        notification: {
          id: notifId,
          title: `Squad Invite: ${p.teamName || 'Squad'}`,
          message: `${p.invitedByName || 'A teammate'} invited you to join "${p.teamName || 'Squad'}" for ${p.hackathonTitle || 'Hackathon'}!`,
          type: NotificationDbType.TEAM,
          icon: 'users',
          eventId: null,
          senderId: null,
          newsId: null,
          actionUrl: p.actionUrl || `/hackathons/${p.hackathonSlug || 'wchl-2025'}/invite?token=${p.inviteToken}`,
          createdAt: p.createdAt || new Date().toISOString(),
          metadata: {
            inviteToken: p.inviteToken,
            teamName: p.teamName,
            eventSlug: p.hackathonSlug,
            eventTitle: p.hackathonTitle,
            invitedByName: p.invitedByName,
            status: 'PENDING',
          },
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
        // Strictly only deliver global announcements meant for ALL users
        if (n.target_type !== 'all') return;
        if (n.type === 'registration') return;
        const titleLower = (n.title || '').toLowerCase();
        if (
          titleLower.includes('registration') ||
          titleLower.includes('payment confirmed') ||
          titleLower.includes('submitted') ||
          titleLower.includes('submission')
        ) {
          return;
        }

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
            metadata: n.metadata || null,
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
              metadata,
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
    // 1. Instant Realtime Broadcast to all connected clients ONLY if target is ALL
    if (dto.targetType === NotificationTargetType.ALL) {
      broadcastAnnouncement({
        title: dto.title,
        message: dto.message,
        type: dto.type,
        icon: dto.icon || getDefaultIcon(dto.type),
        actionUrl: dto.actionUrl || undefined,
        eventId: dto.eventId || undefined,
      });
    }

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

// ─── SEND NOTIFICATION TO EVENT HOST / ORGANIZER ONLY ───
export async function sendOrganizerAlertNotification(params: {
  eventId: string;
  title: string;
  message: string;
  type?: NotificationDbType;
  icon?: string;
  actionUrl?: string;
  senderId?: string | null;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { eventId, title, message, type = NotificationDbType.REGISTRATION, icon, actionUrl, senderId, metadata } = params;
    if (!eventId) return { success: false, error: 'Missing eventId' };

    // Find the event organizer
    let resolvedEventId = eventId;
    let organizerId: string | null = null;
    let eventSlug = eventId;
    let eventTitle = '';

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId);
    let query = supabase.from('events').select('id, title, slug, organizer_id');
    query = isUuid ? query.eq('id', eventId) : query.eq('slug', eventId);
    const { data: eventData } = await query.maybeSingle();

    if (eventData) {
      resolvedEventId = eventData.id;
      organizerId = eventData.organizer_id;
      eventSlug = eventData.slug || resolvedEventId;
      eventTitle = eventData.title || '';
    }

    if (!organizerId) {
      return { success: false, error: 'Event organizer not found' };
    }

    // Collect all organizer/admin IDs (organizer + co-hosts in event_admins)
    const hostUserIds = new Set<string>([organizerId]);
    try {
      const { data: coHosts } = await supabase
        .from('event_admins')
        .select('user_id')
        .eq('event_id', resolvedEventId);
      if (coHosts) {
        coHosts.forEach((ch: any) => {
          if (ch.user_id) hostUserIds.add(ch.user_id);
        });
      }
    } catch {}

    const isSenderUuid = senderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(senderId);
    const resolvedActionUrl = actionUrl || (type === NotificationDbType.REGISTRATION
      ? `/dashboard/events/${eventSlug}/registrations`
      : `/dashboard/events/${eventSlug}/submissions`);

    // Insert master notification with target_type = specific_user
    const { data: notif, error: notifError } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type,
        icon: icon || getDefaultIcon(type),
        event_id: resolvedEventId,
        sender_id: isSenderUuid ? senderId : null,
        target_type: NotificationTargetType.SPECIFIC_USER,
        action_url: resolvedActionUrl,
        metadata: {
          eventId: resolvedEventId,
          eventSlug,
          eventTitle,
          role: 'organizer_alert',
          ...(metadata || {}),
        },
      })
      .select('id')
      .single();

    if (notifError || !notif) {
      return { success: false, error: notifError?.message || 'Failed to create notification' };
    }

    // Deliver strictly to host(s) in user_notifications
    const rows = Array.from(hostUserIds).map((uid) => ({
      user_id: uid,
      notification_id: notif.id,
      is_read: false,
    }));

    const { error: linkErr } = await supabase
      .from('user_notifications')
      .upsert(rows, { onConflict: 'user_id,notification_id' });

    if (linkErr) {
      return { success: false, error: linkErr.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
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
