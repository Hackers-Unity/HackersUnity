'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useNotifications } from '@/lib/notification-context';

export function NotificationToast() {
  const router = useRouter();
  const { latestToast, dismissToast } = useNotifications();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (latestToast) {
      setExiting(false);
      setVisible(true);

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setVisible(false);
          dismissToast();
        }, 300);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [latestToast, dismissToast]);

  if (!visible || !latestToast) return null;

  const handleClick = () => {
    if (latestToast.notification.actionUrl) {
      router.push(latestToast.notification.actionUrl);
    }
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      dismissToast();
    }, 200);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      dismissToast();
    }, 200);
  };

  return (
    <div
      className={`fixed top-20 right-4 z-[60] max-w-sm w-full transition-all duration-300 ${
        exiting
          ? 'opacity-0 translate-x-4 scale-95'
          : 'opacity-100 translate-x-0 scale-100 animate-in slide-in-from-right-5 fade-in'
      }`}
    >
      <div
        onClick={handleClick}
        className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-300/40 cursor-pointer hover:border-[#0099e6]/30 transition-colors group"
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
            <span className="text-base">{latestToast.notification.icon || '🔔'}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-extrabold text-slate-900 line-clamp-1">
              {latestToast.notification.title}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-snug">
              {latestToast.notification.message}
            </p>
          </div>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-2.5 h-0.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0099e6] rounded-full"
            style={{
              animation: 'toast-progress 5s linear forwards',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
