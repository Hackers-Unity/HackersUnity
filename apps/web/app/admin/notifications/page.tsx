'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Megaphone,
  Send,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowLeft,
  Eye,
  History,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  NotificationDbType,
  NotificationTargetType,
  UserRole,
} from '@hackers-unity/shared-types';
import { createNotification, fetchSentNotifications, formatRelativeTime } from '@/lib/notification-service';
import { supabase } from '@/lib/supabase';
import { MOCK_EVENTS } from '@/lib/mock-data';

const POPULAR_EMOJIS = ['🔔', '🚀', '📢', '🎉', '⏰', '🏆', '👥', '⚡', '🤖', '🔥', '💡'];

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Tabs: 'broadcast' | 'history'
  const [activeTab, setActiveTab] = useState<'broadcast' | 'history'>('broadcast');

  // Broadcast Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notifType, setNotifType] = useState<NotificationDbType>(NotificationDbType.ANNOUNCEMENT);
  const [icon, setIcon] = useState('📢');
  const [targetType, setTargetType] = useState<NotificationTargetType>(NotificationTargetType.ALL);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  // History State
  const [sentHistory, setSentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Events list for participant selector
  const [eventsList, setEventsList] = useState<{ id: string; title: string; slug: string }[]>([]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const { data } = await supabase.from('events').select('id, title, slug');
        if (data && data.length > 0) {
          setEventsList(data);
        } else {
          setEventsList(MOCK_EVENTS.map((e) => ({ id: e.id, title: e.title, slug: e.slug })));
        }
      } catch {
        setEventsList(MOCK_EVENTS.map((e) => ({ id: e.id, title: e.title, slug: e.slug })));
      }
    }
    loadEvents();
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && user?.id) {
      setLoadingHistory(true);
      fetchSentNotifications(user.id).then((res) => {
        setSentHistory(res.data);
        setLoadingHistory(false);
      });
    }
  }, [activeTab, user?.id]);

  // Auth Guard: Admin or Organizer only
  const isAuthorized =
    user &&
    (user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.ORGANIZER ||
      user.email?.includes('admin') ||
      user.email?.includes('chinmay'));

  if (!authLoading && !isAuthorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Access Restricted</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          The Broadcast Studio is reserved for platform administrators and verified hackathon organizers.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs transition-all shadow-sm"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Handle Send Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setNotifError('Please enter both a title and message.');
      return;
    }

    setIsSendingNotif(true);
    setNotifError(null);
    setNotifSuccess(false);

    let targetIds: string[] | undefined;
    if (targetType === NotificationTargetType.SPECIFIC_USER && targetUserId.trim()) {
      targetIds = [targetUserId.trim()];
    }

    const res = await createNotification(
      {
        title: title.trim(),
        message: message.trim(),
        type: notifType,
        icon: icon || '🔔',
        eventId: targetType === NotificationTargetType.EVENT_PARTICIPANTS ? selectedEventId || undefined : undefined,
        targetType: targetType,
        targetUserIds: targetIds,
        actionUrl: actionUrl.trim() || undefined,
      },
      user?.id || 'usr_admin'
    );

    setIsSendingNotif(false);

    if (res.error) {
      setNotifError(res.error);
    } else {
      setNotifSuccess(true);
      setTitle('');
      setMessage('');
      setActionUrl('');
      setTimeout(() => setNotifSuccess(false), 4000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Toast Feedback */}
      {notifSuccess && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-950 text-white text-xs font-bold shadow-2xl border border-emerald-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 backdrop-blur-xl">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-white">Notification Broadcast Sent!</div>
            <div className="text-[11px] text-slate-400 font-normal">Realtime channels updated across all targeted clients.</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#0099e6] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>Broadcast Announcements Studio</span>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#ea580c] text-[10px] font-extrabold uppercase tracking-wider border border-orange-200">
              Admin
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Publish platform announcements and send targeted hackathon alerts to participants in real time.
          </p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'broadcast'
              ? 'bg-[#0099e6] text-white shadow-xs'
              : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Broadcast Notification</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-[#0099e6] text-white shadow-xs'
              : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Sent Broadcast Log</span>
        </button>
      </div>

      {/* ═══ TAB 1: BROADCAST NOTIFICATION ═══ */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: 7 cols */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSendNotification} className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#0099e6]" />
                  <span>Compose Realtime Broadcast</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Sends an instant toast and in-app notification to the chosen audience.
                </p>
              </div>

              {notifError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{notifError}</span>
                </div>
              )}

              {/* Title & Emoji Icon */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Broadcast Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Submissions Now Open: Hackers Unity 2026!"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Icon / Emoji</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      maxLength={4}
                      className="w-16 px-3 py-2 text-center rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {POPULAR_EMOJIS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setIcon(em)}
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center text-sm transition-all cursor-pointer ${
                            icon === em
                              ? 'bg-sky-50 border-[#0099e6] scale-110 shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Message Content *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Keep it concise, actionable, and informative..."
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] resize-none"
                />
              </div>

              {/* Type & Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Notification Category</label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value as NotificationDbType)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                  >
                    <option value={NotificationDbType.ANNOUNCEMENT}>📢 Announcement</option>
                    <option value={NotificationDbType.EVENT}>🚀 Event Update</option>
                    <option value={NotificationDbType.REMINDER}>⏰ Deadline Alert</option>
                    <option value={NotificationDbType.SYSTEM}>⚡ System Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Audience</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as NotificationTargetType)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                  >
                    <option value={NotificationTargetType.ALL}>🌍 All Platform Users</option>
                    <option value={NotificationTargetType.EVENT_PARTICIPANTS}>👥 Event Participants</option>
                    <option value={NotificationTargetType.SPECIFIC_USER}>👤 Specific User ID</option>
                  </select>
                </div>
              </div>

              {/* Conditional Event Selector */}
              {targetType === NotificationTargetType.EVENT_PARTICIPANTS && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Hackathon / Event</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                  >
                    <option value="">-- Choose an Event --</option>
                    {eventsList.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional User Selector */}
              {targetType === NotificationTargetType.SPECIFIC_USER && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Target User ID</label>
                  <input
                    type="text"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="Enter user UUID e.g. usr_1001"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                  />
                </div>
              )}

              {/* Action Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Action Link URL (Optional)</label>
                <input
                  type="text"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="e.g. /hackathons/codewars"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              {/* Submit button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSendingNotif}
                  className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSendingNotif ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Dispatch Broadcast Realtime</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Live Preview: 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-lg space-y-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-sky-400 uppercase tracking-wider">
                <Eye className="w-4 h-4" />
                <span>Realtime Toast Preview</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                This is how the broadcast alert will look to end users when received on their screen.
              </p>

              {/* Simulated Toast Card */}
              <div className="pt-3">
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-sky-500/30 text-white shadow-2xl backdrop-blur-xl flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-lg shrink-0">
                    {icon || '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white truncate">
                        {title.trim() || 'Broadcast Announcement Title'}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">just now</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-normal mt-1 line-clamp-2">
                      {message.trim() || 'Your broadcast message preview will appear here dynamically as you compose it.'}
                    </p>
                    {actionUrl && (
                      <div className="mt-2 text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1">
                        <span>Open Link</span>
                        <span>→</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notification Drawer Simulation */}
              <div className="pt-3 border-t border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 mb-2">Notification Drawer Item Preview:</div>
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sm flex items-center justify-center shrink-0">
                    {icon || '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                      <span className="truncate">{title.trim() || 'Notification Item'}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0099e6]"></span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {message.trim() || 'Toast preview message preview snippet.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 2: DISPATCH HISTORY ═══ */}
      {activeTab === 'history' && (
        <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-[#0099e6]" />
              <span>Past Dispatches & Broadcasts</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Log of notifications and announcements sent from your account.
            </p>
          </div>

          {loadingHistory ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#0099e6] mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-400">Loading history...</p>
            </div>
          ) : sentHistory.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-600">No past broadcasts found</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Dispatches you send will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sentHistory.map((item) => (
                <div key={item.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center font-bold text-sm shrink-0">
                      {item.icon || '🔔'}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">{item.title}</div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{item.message}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        <span className="capitalize font-semibold text-slate-600">Audience: {item.target_type}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {item.action_url && (
                    <Link
                      href={item.action_url}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors whitespace-nowrap"
                    >
                      View Link
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
