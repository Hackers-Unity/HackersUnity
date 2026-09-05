// ─── Enums ───────────────────────────────────────────────

export enum NotificationType {
  // Registration
  REGISTRATION_CONFIRMED = 'REGISTRATION_CONFIRMED',
  REGISTRATION_WAITLISTED = 'REGISTRATION_WAITLISTED',
  REGISTRATION_REJECTED = 'REGISTRATION_REJECTED',
  // Team
  TEAM_INVITE_RECEIVED = 'TEAM_INVITE_RECEIVED',
  TEAM_INVITE_ACCEPTED = 'TEAM_INVITE_ACCEPTED',
  TEAM_INVITE_DECLINED = 'TEAM_INVITE_DECLINED',
  TEAM_JOIN = 'TEAM_JOIN',
  TEAM_LEAVE = 'TEAM_LEAVE',
  // Events
  NEW_EVENT = 'NEW_EVENT',
  EVENT_REMINDER = 'EVENT_REMINDER',
  DEADLINE_REMINDER = 'DEADLINE_REMINDER',
  EVENT_UPDATE = 'EVENT_UPDATE',
  EVENT_STATUS_CHANGE = 'EVENT_STATUS_CHANGE',
  EVENT_APPROVED = 'EVENT_APPROVED',
  EVENT_REJECTED = 'EVENT_REJECTED',
  // Results
  RESULT_ANNOUNCEMENT = 'RESULT_ANNOUNCEMENT',
  WINNER_ANNOUNCEMENT = 'WINNER_ANNOUNCEMENT',
  // Announcements
  ORGANIZER_ANNOUNCEMENT = 'ORGANIZER_ANNOUNCEMENT',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  // News
  NEWS_PUBLISHED = 'NEWS_PUBLISHED',
}

export enum NotificationDbType {
  EVENT = 'event',
  REGISTRATION = 'registration',
  REMINDER = 'reminder',
  ANNOUNCEMENT = 'announcement',
  TEAM = 'team',
  RESULT = 'result',
  SYSTEM = 'system',
  NEWS = 'news',
}

export enum NotificationTargetType {
  ALL = 'all',
  SPECIFIC_USER = 'specific_user',
  EVENT_PARTICIPANTS = 'event_participants',
  EVENT_ORGANIZERS = 'event_organizers',
  TEAM_MEMBERS = 'team_members',
  SELECTED_USERS = 'selected_users',
}

export enum NewsCategory {
  HACKATHONS = 'hackathons',
  TECHNOLOGY = 'technology',
  AI = 'ai',
  COMPETITIONS = 'competitions',
  INTERNSHIPS = 'internships',
  OPPORTUNITIES = 'opportunities',
  PLATFORM_UPDATES = 'platform_updates',
}

export enum NewsStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

// ─── Database Row Types ──────────────────────────────────

export interface DbNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationDbType;
  icon: string;
  event_id: string | null;
  sender_id: string | null;
  news_id: string | null;
  target_type: NotificationTargetType;
  action_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DbUserNotification {
  id: string;
  user_id: string;
  notification_id: string;
  is_read: boolean;
  created_at: string;
}

export interface DbNewsArticle {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  cover_image: string | null;
  category: NewsCategory;
  author_id: string | null;
  status: NewsStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Client-Side Types ───────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  createdAt: string;
}

/** Joined user_notification + notification data for the notification panel */
export interface UserNotification {
  id: string;
  userId: string;
  notificationId: string;
  isRead: boolean;
  createdAt: string;
  notification: {
    id: string;
    title: string;
    message: string;
    type: NotificationDbType;
    icon: string;
    eventId: string | null;
    senderId: string | null;
    newsId: string | null;
    actionUrl: string | null;
    createdAt: string;
  };
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  coverImage: string | null;
  category: NewsCategory;
  authorId: string | null;
  authorName?: string;
  authorAvatar?: string;
  status: NewsStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

// ─── DTOs ────────────────────────────────────────────────

export interface CreateNotificationDto {
  title: string;
  message: string;
  type: NotificationDbType;
  icon?: string;
  eventId?: string;
  newsId?: string;
  targetType: NotificationTargetType;
  targetUserIds?: string[];
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateNewsDto {
  title: string;
  slug?: string;
  description?: string;
  content?: string;
  coverImage?: string;
  category: NewsCategory;
  status?: NewsStatus;
  sendNotification?: boolean;
}

export interface UpdateNewsDto {
  title?: string;
  description?: string;
  content?: string;
  coverImage?: string;
  category?: NewsCategory;
  status?: NewsStatus;
}
