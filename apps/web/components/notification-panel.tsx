'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Loader2,
  Sparkles,
  Megaphone,
  Calendar,
  Users,
  Trophy,
  Newspaper,
  Rocket,
  ExternalLink,
} from 'lucide-react';
import { useNotifications } from '@/lib/notification-context';
import { formatRelativeTime } from '@/lib/notification-service';
import { NotificationDbType } from '@hackers-unity/shared-types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'all' | 'events' | 'announcements';

function stripEmojis(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getNotificationIcon(type: NotificationDbType) {
  const iconClass = 'w-4 h-4';
  switch (type) {
    case NotificationDbType.EVENT:
      return <Rocket className={`${iconClass} text-[#0099e6]`} />;
    case NotificationDbType.REGISTRATION:
      return <Sparkles className={`${iconClass} text-emerald-500`} />;
    case NotificationDbType.REMINDER:
      return <Calendar className={`${iconClass} text-amber-500`} />;
    case NotificationDbType.ANNOUNCEMENT:
      return <Megaphone className={`${iconClass} text-[#0099e6]`} />;
    case NotificationDbType.TEAM:
      return <Users className={`${iconClass} text-violet-500`} />;
    case NotificationDbType.RESULT:
      return <Trophy className={`${iconClass} text-amber-500`} />;
    case NotificationDbType.NEWS:
      return <Newspaper className={`${iconClass} text-pink-500`} />;
    case NotificationDbType.SYSTEM:
      return <Bell className={`${iconClass} text-slate-500`} />;
    default:
      return <Bell className={`${iconClass} text-slate-500`} />;
  }
}

function getNotificationBg(type: NotificationDbType, isRead: boolean): string {
  if (isRead) return 'bg-white hover:bg-slate-50';
  switch (type) {
    case NotificationDbType.EVENT:
      return 'bg-cyan-50/60 hover:bg-cyan-50';
    case NotificationDbType.REGISTRATION:
      return 'bg-emerald-50/60 hover:bg-emerald-50';
    case NotificationDbType.REMINDER:
      return 'bg-amber-50/60 hover:bg-amber-50';
    case NotificationDbType.ANNOUNCEMENT:
      return 'bg-sky-50/60 hover:bg-sky-50';
    case NotificationDbType.TEAM:
      return 'bg-violet-50/60 hover:bg-violet-50';
    case NotificationDbType.RESULT:
      return 'bg-amber-50/60 hover:bg-amber-50';
    case NotificationDbType.NEWS:
      return 'bg-pink-50/60 hover:bg-pink-50';
    default:
      return 'bg-slate-50/60 hover:bg-slate-50';
  }
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'events') {
      return notifications.filter(
        (n) =>
          n.notification.type === NotificationDbType.EVENT ||
          n.notification.eventId ||
          n.id.startsWith('event-notif-')
      );
    }
    if (activeTab === 'announcements') {
      return notifications.filter(
        (n) =>
          n.notification.type === NotificationDbType.ANNOUNCEMENT ||
          n.notification.type === NotificationDbType.NEWS ||
          n.notification.type === NotificationDbType.SYSTEM ||
          n.id.startsWith('announcement-')
      );
    }
    return notifications;
  }, [notifications, activeTab]);

  const eventsCount = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.notification.type === NotificationDbType.EVENT ||
          n.notification.eventId ||
          n.id.startsWith('event-notif-')
      ).length,
    [notifications]
  );

  const announcementsCount = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.notification.type === NotificationDbType.ANNOUNCEMENT ||
          n.notification.type === NotificationDbType.NEWS ||
          n.notification.type === NotificationDbType.SYSTEM ||
          n.id.startsWith('announcement-')
      ).length,
    [notifications]
  );

  if (!isOpen) return null;

  const handleNotificationClick = async (notif: typeof notifications[0]) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    if (notif.notification.actionUrl) {
      router.push(notif.notification.actionUrl);
      onClose();
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-300/60 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#0099e6]/10 flex items-center justify-center text-[#0099e6]">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#f97316] text-white text-[10px] font-bold min-w-[18px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              markAllAsRead();
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-[#0099e6] hover:text-[#0284c7] transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Clean Filter Tabs (No Emojis) */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-white">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors text-center ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors text-center ${
            activeTab === 'events'
              ? 'bg-[#0099e6] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Events ({eventsCount})
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors text-center ${
            activeTab === 'announcements'
              ? 'bg-[#0099e6] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Updates ({announcementsCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-[360px] overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#0099e6] mb-2" />
            <span className="text-xs font-medium">Connecting to live feed...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-slate-300" />
            </div>
            <span className="text-xs font-bold text-slate-600">No {activeTab === 'all' ? '' : activeTab} notifications yet</span>
            <span className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
              {activeTab === 'events'
                ? 'Upcoming hackathons & challenges will appear here in real time.'
                : 'Live announcements and community updates appear here.'}
            </span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer group ${getNotificationBg(
                  notif.notification.type,
                  notif.isRead
                )}`}
              >
                {/* SVG Icon Box (Clean Vector) */}
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center shrink-0 shadow-2xs mt-0.5 group-hover:scale-105 transition-transform">
                  {getNotificationIcon(notif.notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-xs leading-tight line-clamp-1 ${
                        notif.isRead ? 'font-semibold text-slate-700' : 'font-extrabold text-slate-900'
                      }`}
                    >
                      {stripEmojis(notif.notification.title)}
                    </span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#0099e6] shrink-0 mt-1" />
                    )}
                  </div>
                  <p
                    className={`text-[11px] mt-1 leading-snug line-clamp-2 ${
                      notif.isRead ? 'text-slate-500' : 'text-slate-600'
                    }`}
                  >
                    {stripEmojis(notif.notification.message)}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-slate-400">
                      {formatRelativeTime(notif.notification.createdAt)}
                    </span>
                    {notif.notification.actionUrl && (
                      <span className="text-[10px] font-bold text-[#0099e6] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        View details <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/50 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">Realtime sync active</span>
        <Link
          href="/hackathons"
          onClick={onClose}
          className="text-[#0099e6] hover:text-[#0284c7] font-bold transition-colors"
        >
          Explore All Hackathons &rarr;
        </Link>
      </div>
    </div>
  );
}
