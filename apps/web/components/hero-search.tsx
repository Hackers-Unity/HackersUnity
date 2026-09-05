'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  X,
  Trophy,
  Users,
  ArrowRight,
  Zap,
  Calendar,
  Sparkles,
  MapPin,
  Flame,
  Tag,
} from 'lucide-react';
import { usePublishedEvents } from '@/lib/hooks/use-events';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ExtendedEvent } from '@/lib/mock-data';

export function HeroSearch() {
  const router = useRouter();
  const { events } = usePublishedEvents();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter events based on query
  const trimmed = query.trim().toLowerCase();
  const matchingEvents = events.filter((e) => {
    if (!trimmed) return true;
    return (
      e.title.toLowerCase().includes(trimmed) ||
      (e.description && e.description.toLowerCase().includes(trimmed)) ||
      e.tags.some((t) => t.toLowerCase().includes(trimmed)) ||
      (e.organizerName && e.organizerName.toLowerCase().includes(trimmed)) ||
      (e.domain && e.domain.toLowerCase().includes(trimmed))
    );
  });

  const displayedEvents = trimmed ? matchingEvents.slice(0, 5) : events.slice(0, 4);

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < displayedEvents.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayedEvents.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && displayedEvents[selectedIndex]) {
        router.push(`/hackathons/${displayedEvents[selectedIndex].slug}`);
        setIsOpen(false);
      } else if (query.trim()) {
        router.push(`/hackathons?q=${encodeURIComponent(query.trim())}`);
        setIsOpen(false);
      } else {
        router.push('/hackathons');
        setIsOpen(false);
      }
    }
  };

  const handleSelectEvent = (event: ExtendedEvent) => {
    router.push(`/hackathons/${event.slug}`);
    setIsOpen(false);
  };

  const handleSelectTag = (tag: string) => {
    setQuery(tag);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleExploreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/hackathons?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/hackathons');
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mb-6 z-30">
      {/* Search Input Bar */}
      <form
        onSubmit={handleExploreSubmit}
        className={`w-full bg-white p-2 rounded-2xl border transition-all duration-200 flex items-center gap-2 shadow-xl shadow-slate-200/60 ${
          isOpen
            ? 'border-[#0099e6] ring-4 ring-[#0099e6]/10'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <Search className="w-5 h-5 text-[#0099e6] ml-3 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for hackathons, tech events, or topics (e.g. AI, Web3, Python)..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none px-2 py-1.5 font-medium"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedIndex(-1);
              inputRef.current?.focus();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span>Explore</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Interactive Autocomplete / Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-300/60 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
          {/* Section 1: Trending Tags */}
          {!trimmed && (
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Popular Search Topics</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['GenAI', 'Autonomous Agents', 'ZK-Proofs', 'Robotics', 'DeFi', 'Next.js 16', 'PyTorch'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleSelectTag(tag)}
                    className="px-3 py-1 rounded-xl bg-white hover:bg-sky-50 text-xs font-bold text-slate-700 hover:text-[#0099e6] border border-slate-200 hover:border-[#0099e6]/40 shadow-2xs transition-all cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Hackathon Suggestions */}
          <div className="p-3">
            <div className="px-3 py-1.5 text-[11px] font-extrabold text-[#0099e6] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                {trimmed ? `Matching Hackathons (${matchingEvents.length})` : 'Featured Hackathons'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Click to open or use ↑↓ keys
              </span>
            </div>

            {displayedEvents.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Search className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">No hackathons found for &quot;{query}&quot;</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Try searching with broader terms like AI, Web3, or Python.</p>
              </div>
            ) : (
              <div className="space-y-1 mt-1">
                {displayedEvents.map((evt, idx) => {
                  const isSelected = selectedIndex === idx;
                  const prizeText = evt.prize || (evt.totalPrizeValue ? formatCurrency(evt.totalPrizeValue) : 'Prizes');

                  return (
                    <div
                      key={evt.id}
                      onClick={() => handleSelectEvent(evt)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-sky-50 border border-sky-200 shadow-2xs'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Event Thumbnail / Icon */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0099e6] to-[#0284c7] text-white flex items-center justify-center font-black text-sm shadow-2xs shrink-0 overflow-hidden">
                          {evt.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />
                          ) : (
                            <Trophy className="w-5 h-5" />
                          )}
                        </div>

                        {/* Event Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                              {evt.title}
                            </h4>
                            <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                              {evt.mode || 'Online'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                            <span className="text-[#ea580c] font-bold">{prizeText}</span>
                            <span>•</span>
                            <span>{evt.organizerName || "Hacker's Unity"}</span>
                            {evt.tags && evt.tags.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-slate-400 font-normal truncate">
                                  {evt.tags.slice(0, 2).join(', ')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Indicator */}
                      <div className="flex items-center gap-1 text-xs font-bold text-[#0099e6] shrink-0">
                        <span className="hidden sm:inline">View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Footer Action Bar */}
          <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              href={query.trim() ? `/hackathons?q=${encodeURIComponent(query.trim())}` : '/hackathons'}
              onClick={() => setIsOpen(false)}
              className="text-[#0099e6] hover:text-[#0284c7] font-black flex items-center gap-1.5"
            >
              <span>View all {matchingEvents.length} hackathons in directory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Press Enter ↵ to search
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
