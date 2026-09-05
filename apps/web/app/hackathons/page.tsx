'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Trophy,
  SlidersHorizontal,
  LayoutGrid,
  List,
  RotateCcw,
  Clock,
  Sparkles,
  Radio,
} from 'lucide-react';
import Link from 'next/link';
import { EventCategory, EventStatus, EventType } from '@hackers-unity/shared-types';
import { HackathonCard } from '@/components/hackathon-card';
import { usePublishedEvents } from '@/lib/hooks/use-events';
import { ExtendedEvent } from '@/lib/mock-data';
import { formatCurrency, getDaysLeft, getStatusBadge, getCategoryBadge } from '@/lib/utils';
import { RegistrationModal } from '@/components/registration-modal';

export default function HackathonsDirectoryPage() {
  const { events, loading, error } = usePublishedEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'prize' | 'deadline' | 'newest' | 'popular'>('prize');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeRegEvent, setActiveRegEvent] = useState<ExtendedEvent | null>(null);

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        const matchQuery =
          !searchQuery ||
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          event.organizerName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchCategory = selectedCategory === 'ALL' || event.category === selectedCategory;
        const matchType = selectedType === 'ALL' || event.eventType === selectedType;
        const matchStatus = selectedStatus === 'ALL' || event.status === selectedStatus;

        return matchQuery && matchCategory && matchType && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'prize') return (b.totalPrizeValue || 0) - (a.totalPrizeValue || 0);
        if (sortBy === 'deadline')
          return new Date(a.registrationDeadline).getTime() - new Date(b.registrationDeadline).getTime();
        if (sortBy === 'popular') return (b.participantsCount || 0) - (a.participantsCount || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [events, searchQuery, selectedCategory, selectedType, selectedStatus, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedType('ALL');
    setSelectedStatus('ALL');
    setSortBy('prize');
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== 'ALL' || selectedType !== 'ALL' || selectedStatus !== 'ALL';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* ─── Page Header ────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0099e6] text-xs font-bold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#0099e6]" />
            <span>Live Hackathons Directory</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Explore Hackathons & Sprints
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl font-medium">
            Browse through live events powered by Supabase Realtime with escrow-backed prize pools, world-class judges, and vibrant developer squads.
          </p>
        </div>

        <Link
          href="/host"
          className="px-5 py-2.5 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Host a Hackathon</span>
        </Link>
      </div>

      {/* ─── Search and Filters Bar ──────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 space-y-4">
        {/* Top search & view toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#0099e6]" />
            <input
              type="text"
              placeholder="Search hackathons by keyword, tech stack (#AI, #Web3), or host..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-800 outline-none text-xs cursor-pointer font-bold"
              >
                <option value="prize">Highest Prize Pool</option>
                <option value="deadline">Closing Soon</option>
                <option value="popular">Most Popular</option>
                <option value="newest">Recently Added</option>
              </select>
            </div>

            {/* Grid / List toggle */}
            <div className="flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#0099e6] shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-[#0099e6] shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          {/* Categories */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-bold">Type:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: EventCategory.HACKATHON, label: 'Hackathons' },
              { id: EventCategory.COMPETITION, label: 'Competitions' },
              { id: EventCategory.QUIZ, label: 'Quizzes / Speed' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#0099e6] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 hidden md:block" />

          {/* Mode */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-bold">Format:</span>
            {[
              { id: 'ALL', label: 'All Formats' },
              { id: EventType.ONLINE, label: 'Online' },
              { id: EventType.OFFLINE, label: 'In-Person' },
              { id: EventType.HYBRID, label: 'Hybrid' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setSelectedType(fmt.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedType === fmt.id
                    ? 'bg-[#f97316] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 hidden md:block" />

          {/* Status */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-bold">Status:</span>
            {[
              { id: 'ALL', label: 'All Status' },
              { id: EventStatus.PUBLISHED, label: 'Open' },
              { id: EventStatus.ONGOING, label: 'Live Now' },
              { id: EventStatus.COMPLETED, label: 'Completed' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedStatus === st.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto flex items-center gap-1 text-xs text-[#ea580c] hover:underline font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Results Counter ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 text-xs text-slate-500 font-medium">
        <span>
          Showing <span className="font-bold text-slate-900">{filteredEvents.length}</span> live hackathons
        </span>
        <span className="text-[11px] text-slate-400">Updates dynamically via Supabase Realtime</span>
      </div>

      {/* ─── Loading Skeleton ────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 animate-pulse">
              <div className="h-40 bg-slate-200 rounded-xl" />
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-12 bg-slate-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        /* ─── Grid View ───────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <HackathonCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        /* ─── List View ───────────────────────────────────────────── */
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const statusInfo = getStatusBadge(event.status);
            const categoryInfo = getCategoryBadge(event.category);
            const deadlineInfo = getDaysLeft(event.registrationDeadline);

            return (
              <div
                key={event.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#0099e6]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#0099e6] border border-sky-200">
                      {categoryInfo.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-medium">{event.eventType}</span>
                  </div>

                  <Link href={`/hackathons/${event.slug}`} className="block">
                    <h3 className="text-lg font-bold text-slate-900 hover:text-[#0099e6] transition-colors">
                      {event.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-600 line-clamp-1 max-w-3xl font-medium">
                    {event.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap font-medium">
                    <span className="text-slate-700 font-semibold">By {event.organizerName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-[#ea580c] font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{deadlineInfo.text}</span>
                    </span>
                    <span>•</span>
                    <span className="text-[#0099e6] font-semibold">{event.tags.slice(0, 3).join(', ')}</span>
                  </div>
                </div>

                {/* Right Prize & CTA */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Prize Pool</div>
                    <div className="text-lg font-black text-[#ea580c] font-mono">
                      {formatCurrency(event.totalPrizeValue)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/hackathons/${event.slug}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => setActiveRegEvent(event)}
                      className="px-4 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-sm shadow-sky-500/20 transition-all cursor-pointer"
                    >
                      Register
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No hackathons match your search</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
          <button
            onClick={resetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {activeRegEvent && (
        <RegistrationModal
          event={activeRegEvent}
          isOpen={!!activeRegEvent}
          onClose={() => setActiveRegEvent(null)}
        />
      )}
    </div>
  );
}
