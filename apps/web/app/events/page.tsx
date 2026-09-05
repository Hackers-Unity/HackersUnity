'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Calendar,
  Sparkles,
  LayoutGrid,
  List,
  RotateCcw,
  Radio,
} from 'lucide-react';
import Link from 'next/link';
import { EventCategory, EventType } from '@hackers-unity/shared-types';
import { HackathonCard } from '@/components/hackathon-card';
import { usePublishedEvents } from '@/lib/hooks/use-events';

export default function EventsDirectoryPage() {
  const { events, loading, error } = usePublishedEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'deadline'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter events (focusing on tech events, workshops, webinars, conferences, or all non-hackathon/all events)
  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        const matchQuery =
          !searchQuery ||
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          event.organizerName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchCategory =
          selectedCategory === 'ALL'
            ? true
            : event.category === selectedCategory;

        const matchType = selectedType === 'ALL' || event.eventType === selectedType;

        return matchQuery && matchCategory && matchType;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline')
          return new Date(a.registrationDeadline).getTime() - new Date(b.registrationDeadline).getTime();
        if (sortBy === 'popular') return (b.participantsCount || 0) - (a.participantsCount || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [events, searchQuery, selectedCategory, selectedType, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedType('ALL');
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'ALL' || selectedType !== 'ALL';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* ─── Page Header ────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#ea580c] text-xs font-bold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#ea580c]" />
            <span>Tech Events & Workshops</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Discover Tech Events & Meetups
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl font-medium">
            Explore hands-on workshops, AI conferences, developer meetups, and keynote sessions hosted by top tech communities.
          </p>
        </div>

        <Link
          href="/host"
          className="px-5 py-2.5 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Host a Tech Event</span>
        </Link>
      </div>

      {/* ─── Search and Filters Bar ──────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#0099e6]" />
            <input
              type="text"
              placeholder="Search events by topic, technology (#AI, #Web3), or organizer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-800 outline-none text-xs cursor-pointer font-bold"
              >
                <option value="newest">Recently Added</option>
                <option value="popular">Most Popular</option>
                <option value="deadline">Closing Soon</option>
              </select>
            </div>

            <div className="flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#0099e6] shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-[#0099e6] shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category & Format Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: 'All Events', val: 'ALL' },
              { label: 'Workshops', val: EventCategory.WORKSHOP },
              { label: 'Conferences', val: EventCategory.CONFERENCE },
              { label: 'Webinars', val: EventCategory.WEBINAR },
              { label: 'Competitions', val: EventCategory.COMPETITION },
              { label: 'Hackathons', val: EventCategory.HACKATHON },
            ].map((cat) => (
              <button
                key={cat.val}
                onClick={() => setSelectedCategory(cat.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  selectedCategory === cat.val
                    ? 'bg-[#0099e6] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Formats</option>
              <option value={EventType.ONLINE}>Online Only</option>
              <option value={EventType.OFFLINE}>In-Person / Offline</option>
              <option value={EventType.HYBRID}>Hybrid</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Events Grid/List ────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 rounded-3xl bg-white border border-slate-200 p-6 animate-pulse space-y-4">
              <div className="h-44 bg-slate-100 rounded-2xl" />
              <div className="h-6 bg-slate-100 rounded-md w-3/4" />
              <div className="h-4 bg-slate-100 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-xl font-bold text-slate-800">No events match your search</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Try adjusting your search keywords, event categories, or format filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'flex flex-col gap-4'
          }
        >
          {filteredEvents.map((event) => (
            <HackathonCard
              key={event.id}
              event={event}
            />
          ))}
        </div>
      )}
    </div>
  );
}
