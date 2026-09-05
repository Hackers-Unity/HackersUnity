'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  AlertCircle,
  Rocket,
} from 'lucide-react';
import { useNotifications } from '@/lib/notification-context';
import { formatRelativeTime } from '@/lib/notification-service';
import { NotificationDbType } from '@hackers-unity/shared-types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function getNotificationIcon(type: NotificationDbType, icon?: string) {
  // If there's an emoji icon, use it
  if (icon && /\p{Emoji}/u.test(icon)) {
    return <span className="text-sm">{icon}</span>;
  }

  const iconClass = 'w-4 h-4';
  switch (type) {
    case NotificationDbType.EVENT: return <Rocket className={`${iconClass} text-cyan-500`} />;
    case NotificationDbType.REGISTRATION: return <Sparkles className={`${iconClass} text-emerald-500`} />;
    case NotificationDbType.REMINDER: return <Calendar className={`${iconClass} text-amber-500`} />;
    case NotificationDbType.ANNOUNCEMENT: return <Megaphone className={`${iconClass} text-[#0099e6]`} />;
    case NotificationDbType.TEAM: return <Users className={`${iconClass} text-violet-500`} />;
    case NotificationDbType.RESULT: return <Trophy className={`${iconClass} text-amber-500`} />;
    case NotificationDbType.NEWS: return <Newspaper className={`${iconClass} text-pink-500`} />;
    case NotificationDbType.SYSTEM: return <Bell className={`${iconClass} text-slate-500`} />;
    default: return <Bell className={`${iconClass} text-slate-500`} />;
  }
}

function getNotificationBg(type: NotificationDbType, isRead: boolean): string {
  if (isRead) return 'bg-white hover:bg-slate-50';
  switch (type) {
    case NotificationDbType.EVENT: return 'bg-cyan-50/60 hover:bg-cyan-50';
    case NotificationDbType.REGISTRATION: return 'bg-emerald-50/60 hover:bg-emerald-50';
    case NotificationDbType.REMINDER: return 'bg-amber-50/60 hover:bg-amber-50';
    case NotificationDbType.ANNOUNCEMENT: return 'bg-sky-50/60 hover:bg-sky-50';
    case NotificationDbType.TEAM: return 'bg-violet-50/60 hover:bg-violet-50';
    case NotificationDbType.RESULT: return 'bg-amber-50/60 hover:bg-amber-50';
    case NotificationDbType.NEWS: return 'bg-pink-50/60 hover:bg-pink-50';
    default: return 'bg-slate-50/60 hover:bg-slate-50';
  }
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
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
    // Delay to prevent the opening click from immediately closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

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
      className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-200/60 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#0099e6]" />
          <span className="text-sm font-extrabold text-slate-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#0099e6] text-white text-[10px] font-bold min-w-[18px] text-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
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

      {/* Notification List */}
      <div className="max-h-[380px] overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#0099e6] mb-2" />
            <span className="text-xs font-medium">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-slate-300" />
            </div>
            <span className="text-xs font-bold text-slate-500">No notifications yet</span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              You&apos;ll see updates about events, teams & more here
            </span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${getNotificationBg(
                  notif.notification.type,
                  notif.isRead
                )}`}
              >
                {/* Icon */}
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {getNotificationIcon(notif.notification.type, notif.notification.icon)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs leading-tight line-clamp-1 ${
                      notif.isRead ? 'font-semibold text-slate-600' : 'font-bold text-slate-900'
                    }`}>
                      {notif.notification.title}
                    </span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#0099e6] shrink-0 mt-1" />
                    )}
                  </div>
                  <p className={`text-[11px] mt-0.5 leading-snug line-clamp-2 ${
                    notif.isRead ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {notif.notification.message}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {formatRelativeTime(notif.notification.createdAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-2.5 text-center">
          <span className="text-[10px] text-slate-400 font-medium">
            Showing latest {Math.min(notifications.length, 30)} notifications
          </span>
        </div>
      )}
    </div>
  );
}
