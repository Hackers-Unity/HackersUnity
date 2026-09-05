'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type ConsentChoice = 'accepted' | 'rejected' | 'custom' | null;

const CONSENT_KEY = 'hu_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Check if user already made a choice
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // Small delay so the page loads first, then the banner slides in
      const timer = setTimeout(() => {
        setVisible(true);
        // Trigger entrance animation after mount
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setAnimate(true));
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = (choice: ConsentChoice) => {
    if (choice) {
      localStorage.setItem(CONSENT_KEY, choice);
    }
    // Slide-out animation
    setAnimate(false);
    setTimeout(() => setVisible(false), 350);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className={`
        fixed bottom-6 left-6 z-[9999] w-[370px] max-w-[calc(100vw-48px)]
        rounded-2xl bg-white
        border border-slate-200/80
        shadow-[0_8px_40px_-8px_rgba(15,23,42,0.10),0_2px_12px_-2px_rgba(15,23,42,0.06)]
        transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* Content */}
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-2">
          We value your privacy
        </h3>
        <p className="text-[13px] leading-[1.6] text-slate-500">
          We use cookies to keep the site running, measure performance, and
          personalize content. Choose which categories you allow. You can change
          your choice anytime from the footer.{' '}
          <Link
            href="/privacy"
            className="text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline transition-colors"
          >
            Privacy Policy
          </Link>
          ,{' '}
          <Link
            href="/privacy"
            className="text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline transition-colors"
          >
            Cookie Policy
          </Link>
          ,{' '}
          <Link
            href="/terms"
            className="text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline transition-colors"
          >
            Terms of Use
          </Link>
        </p>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-slate-100" />

      {/* Buttons */}
      <div className="px-6 py-4 flex items-center gap-2.5">
        <button
          onClick={() => handleChoice('accepted')}
          className="
            flex-1 px-4 py-2 text-[13px] font-medium
            rounded-lg border border-slate-200
            text-slate-700 bg-white
            hover:bg-slate-50 hover:border-slate-300
            active:bg-slate-100
            transition-all duration-150
            cursor-pointer
          "
        >
          Accept All
        </button>
        <button
          onClick={() => handleChoice('rejected')}
          className="
            flex-1 px-4 py-2 text-[13px] font-medium
            rounded-lg border border-slate-200
            text-slate-700 bg-white
            hover:bg-slate-50 hover:border-slate-300
            active:bg-slate-100
            transition-all duration-150
            cursor-pointer
          "
        >
          Reject All
        </button>
        <button
          onClick={() => handleChoice('custom')}
          className="
            flex-1 px-4 py-2 text-[13px] font-medium
            rounded-lg border border-slate-200
            text-slate-700 bg-white
            hover:bg-slate-50 hover:border-slate-300
            active:bg-slate-100
            transition-all duration-150
            cursor-pointer
          "
        >
          Preferences
        </button>
      </div>
    </div>
  );
}
