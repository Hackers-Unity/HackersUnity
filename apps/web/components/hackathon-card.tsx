'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy,
  Users,
  Bookmark,
  ArrowUpRight,
  Sparkles,
  Clock,
} from 'lucide-react';
import { ExtendedEvent } from '@/lib/mock-data';
import { EVENT_IMAGE_MAP, getEventImageSrc } from '@/lib/event-images';
import { formatCurrency, getDaysLeft, getStatusBadge, getCategoryBadge } from '@/lib/utils';
import { toggleBookmarkEvent, getBookmarkedEventIds } from '@/lib/storage';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';
import { RegistrationModal } from './registration-modal';

interface HackathonCardProps {
  event: ExtendedEvent;
  isBookmarked?: boolean;
  onBookmarkChange?: () => void;
}

export function HackathonCard({ event, isBookmarked, onBookmarkChange }: HackathonCardProps) {
  const { user, supabaseUser } = useAuth();
  const [bookmarked, setBookmarked] = useState<boolean>(() => {
    if (isBookmarked !== undefined) return isBookmarked;
    if (typeof window === 'undefined') return false;
    const ids = getBookmarkedEventIds();
    return ids.includes(event.id) || ids.includes(event.slug);
  });
  const [showRegModal, setShowRegModal] = useState(false);
  const [imgError, setImgError] = useState(false);
  const bannerImageSrc = getEventImageSrc(event);

  useEffect(() => {
    if (isBookmarked !== undefined) {
      setBookmarked(isBookmarked);
      return;
    }
    const updateState = () => {
      const ids = getBookmarkedEventIds();
      setBookmarked(ids.includes(event.id) || ids.includes(event.slug));
    };
    updateState();
    window.addEventListener('hackers_unity_storage_change', updateState);
    return () => window.removeEventListener('hackers_unity_storage_change', updateState);
  }, [event.id, event.slug, isBookmarked]);

  const statusInfo = getStatusBadge(event.status);
  const categoryInfo = getCategoryBadge(event.category);
  const deadlineInfo = getDaysLeft(event.registrationDeadline);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const userId = supabaseUser?.id || user?.id;
    toggleBookmarkEvent(event.id, userId);
    setBookmarked(!bookmarked);
    onBookmarkChange?.();
  };

  return (
    <>
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-[#0099e6]/40 transition-all duration-300">
        {/* Top Image / Banner Header */}
        <div className="h-44 w-full relative overflow-hidden bg-slate-900 border-b border-slate-100">
          {bannerImageSrc && !imgError ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerImageSrc}
                alt={event.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
            </>
          ) : (
            <div className={`w-full h-full bg-gradient-to-r ${event.bannerGradient || 'from-sky-900 via-slate-900 to-black'} flex items-center justify-center p-4 text-center`}>
              <span className="text-white/80 font-bold text-lg tracking-tight drop-shadow-md">{event.title}</span>
            </div>
          )}

          {/* Badges & Bookmark */}
          <div className="absolute inset-0 p-3.5 flex items-start justify-between z-10 pointer-events-none">
            <div className="flex items-center gap-1.5 flex-wrap pointer-events-auto">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-md text-[#0099e6] border border-white/40 shadow-xs">
                {categoryInfo.label}
              </span>
              {event.featured && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ea580c] text-white shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> FEATURED
                </span>
              )}
            </div>

            <button
              onClick={handleBookmark}
              title={bookmarked ? 'Remove Bookmark' : 'Save Hackathon'}
              className={`p-2 rounded-xl border backdrop-blur-md transition-all cursor-pointer pointer-events-auto ${
                bookmarked
                  ? 'bg-[#0099e6] text-white border-[#0099e6] shadow-sm'
                  : 'bg-white/90 text-slate-700 hover:text-slate-900 border-white/60 shadow-xs hover:bg-white'
              }`}
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            {/* Status & Deadline pill */}
            <div className="flex items-center justify-between gap-2 mb-2 text-xs">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                <span>{statusInfo.label}</span>
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-medium ${deadlineInfo.urgent ? 'text-[#ea580c] font-bold' : 'text-slate-500'}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{deadlineInfo.text}</span>
              </div>
            </div>

            {/* Title & Organizer with Logo */}
            <div className="flex items-start gap-2.5">
              {(event.logoUrl || event.organizerLogo) && (
                <div className="w-8 h-8 rounded-lg border border-slate-200/90 bg-white p-0.5 shadow-2xs shrink-0 overflow-hidden mt-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.logoUrl || event.organizerLogo}
                    alt={event.title}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link href={`/hackathons/${event.slug}`} className="block group-hover:text-[#0099e6] transition-colors">
                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                    {event.title}
                  </h3>
                </Link>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                  <span>by</span>
                  <span className="font-semibold text-slate-700 truncate">{event.organizerName}</span>
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {event.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600 border border-slate-200"
              >
                #{tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-400">
                +{event.tags.length - 3}
              </span>
            )}
          </div>

          {/* Stats Bar (Prizes, Location, Builders) */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ea580c]">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Prize Pool</div>
                <div className="font-extrabold text-[#ea580c] text-sm truncate" title={event.prize || formatCurrency(event.totalPrizeValue)}>
                  {event.prize || formatCurrency(event.totalPrizeValue)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0099e6]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Hackers</div>
                <div className="font-bold text-slate-800 text-xs">
                  {event.participantsDisplay || `${event.participantsCount.toLocaleString()}+`} Registered
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <Link
              href={`/hackathons/${event.slug}`}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-all"
            >
              <span>{event.ctaText || 'Explore Details'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            {event.registrationLink && event.registrationLink.startsWith('http') ? (
              <a
                href={event.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-4 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-xs shadow-sky-500/30 transition-all text-center inline-block"
              >
                Register
              </a>
            ) : (
              <Link
                href={`/hackathons/${event.slug}/register`}
                className="py-2 px-4 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-xs shadow-sky-500/30 transition-all text-center inline-block"
              >
                Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
