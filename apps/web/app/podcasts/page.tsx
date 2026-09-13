'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Share2,
  Search,
  Sparkles,
  Radio,
  Check,
  ExternalLink,
  X,
  Grid,
  List,
  Clock,
  User,
  Headphones,
  RotateCcw,
  RotateCw,
  Shuffle,
  Repeat,
  Tv,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { FaAmazon, FaMicrosoft, FaYoutube, FaSpotify } from 'react-icons/fa6';
import { SiIeee } from 'react-icons/si';
import { PODCAST_EPISODES, PodcastEpisode } from '@/lib/podcasts-data';

function CompanyBadge({ type, name }: { type: PodcastEpisode['companyType']; name: string }) {
  if (type === 'amazon') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
        <FaAmazon className="w-3.5 h-3.5 text-[#ff9900]" />
        <span>{name}</span>
      </span>
    );
  }

  if (type === 'microsoft') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 font-bold text-[11px]">
        <span className="grid grid-cols-2 gap-0.5 w-3 h-3">
          <span className="bg-[#f25022] rounded-[1px]" />
          <span className="bg-[#7fba00] rounded-[1px]" />
          <span className="bg-[#00a4ef] rounded-[1px]" />
          <span className="bg-[#ffb900] rounded-[1px]" />
        </span>
        <span>{name}</span>
      </span>
    );
  }

  if (type === 'ieee') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
        <SiIeee className="w-4 h-4 text-[#00629b]" />
        <span>{name}</span>
      </span>
    );
  }

  if (type === 'tcs') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
        <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
        <span>{name}</span>
      </span>
    );
  }

  if (type === 'macys') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-[11px]">
        <span className="text-rose-500 text-xs">★</span>
        <span>{name}</span>
      </span>
    );
  }

  if (type === 'mphasis') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>{name}</span>
      </span>
    );
  }

  if (type === 'ssc') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold text-[11px]">
        <span className="w-2 h-2 rounded-full bg-cyan-500" />
        <span>{name}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-[11px]">
      <Sparkles className="w-3 h-3 text-purple-500" />
      <span>{name}</span>
    </span>
  );
}

const CATEGORIES = [
  { id: 'all', label: 'All Episodes' },
  { id: 'big-tech', label: 'Big Tech & MAANG' },
  { id: 'leadership', label: 'Engineering Leadership' },
  { id: 'ai-cloud', label: 'AI, LLMs & Cloud' },
  { id: 'product', label: 'Product Management' },
  { id: 'system-design', label: 'System Design & Scale' },
];

export default function PodcastsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Player state
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(PODCAST_EPISODES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(14); // simulated 14%
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [likedEpisodes, setLikedEpisodes] = useState<Record<string, boolean>>({
    'ep-amazon': true,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Video Modal State
  const [videoModalEpisode, setVideoModalEpisode] = useState<PodcastEpisode | null>(null);

  // Filtered episodes
  const filteredEpisodes = useMemo(() => {
    return PODCAST_EPISODES.filter((ep) => {
      const matchesCategory = selectedCategory === 'all' || ep.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        ep.name.toLowerCase().includes(q) ||
        ep.title.toLowerCase().includes(q) ||
        ep.company.toLowerCase().includes(q) ||
        ep.designation.toLowerCase().includes(q) ||
        ep.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  const handlePlayEpisode = (ep: PodcastEpisode) => {
    if (currentEpisode?.id === ep.id) {
      setIsPlaying((prev) => !prev);
    } else {
      setCurrentEpisode(ep);
      setIsPlaying(true);
      setProgress(5);
    }
  };

  const handleToggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedEpisodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyShowLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hackersunity.com';
    navigator.clipboard.writeText(`${origin}/podcasts`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNextEpisode = () => {
    if (!currentEpisode) return;
    const currentIndex = PODCAST_EPISODES.findIndex((e) => e.id === currentEpisode.id);
    const nextIndex = (currentIndex + 1) % PODCAST_EPISODES.length;
    setCurrentEpisode(PODCAST_EPISODES[nextIndex]);
    setIsPlaying(true);
    setProgress(0);
  };

  const handlePrevEpisode = () => {
    if (!currentEpisode) return;
    const currentIndex = PODCAST_EPISODES.findIndex((e) => e.id === currentEpisode.id);
    const prevIndex = (currentIndex - 1 + PODCAST_EPISODES.length) % PODCAST_EPISODES.length;
    setCurrentEpisode(PODCAST_EPISODES[prevIndex]);
    setIsPlaying(true);
    setProgress(0);
  };

  // Format progress seconds
  const formatTime = (totalSeconds: number, percent: number) => {
    const current = Math.floor((totalSeconds * percent) / 100);
    const mins = Math.floor(current / 60);
    const secs = current % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex-1 bg-[#0a0e17] text-white min-h-screen pb-36 relative selection:bg-[#1ed760] selection:text-black">
      {/* ─── Ambient Spotify-style Glow ─── */}
      <div className="absolute top-0 left-0 right-0 h-[480px] bg-gradient-to-b from-[#1ed760]/12 via-[#0099e6]/8 to-transparent pointer-events-none" />

      {/* ─── Spotify Show Header ─── */}
      <div className="relative border-b border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent pt-8 sm:pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb / Badge */}
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Home
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-bold text-[#1ed760] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span>Podcasts</span>
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-slate-400 truncate">Beyond The Mic Series</span>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
            {/* Show Artwork / Cover */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 shrink-0 border border-white/10 group">
              <Image
                src="/podcasts/mihirshelar.jpg"
                alt="Beyond The Mic Podcast Show"
                width={256}
                height={256}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black text-[#1ed760] flex items-center gap-1.5 uppercase tracking-wider">
                <FaSpotify className="w-3.5 h-3.5" />
                <span>Verified Show</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Original Series</p>
                <p className="text-sm font-black text-white truncate">Hacker&apos;s Unity</p>
              </div>
            </div>

            {/* Show Details */}
            <div className="space-y-3.5 text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1ed760]/15 border border-[#1ed760]/30 text-[#1ed760] text-xs font-extrabold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Official Tech Podcast</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Beyond The Mic: Industry Insider
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">
                Unfiltered engineering journeys, system design strategies, cloud architecture, and high-impact career secrets from engineering leaders and staff software engineers at{' '}
                <strong className="text-white">Amazon, Microsoft, Macy&apos;s, TCS, and IEEE</strong>.
              </p>

              {/* Show Stats */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400 pt-1 font-medium">
                <span className="flex items-center gap-1 text-white font-bold">
                  <User className="w-3.5 h-3.5 text-[#1ed760]" />
                  <span>Hosted by Hacker&apos;s Unity</span>
                </span>
                <span>•</span>
                <span>8 Full Episodes</span>
                <span>•</span>
                <span>~6.5 Hours Runtime</span>
                <span>•</span>
                <span className="text-[#1ed760] font-bold">100% Free Access</span>
              </div>

              {/* Spotify Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
                {/* Big Green Play Button */}
                <button
                  type="button"
                  onClick={() => handlePlayEpisode(PODCAST_EPISODES[0])}
                  className="px-6 py-3 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] hover:scale-105 active:scale-95 text-black font-extrabold text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-[#1ed760]/25 transition-all cursor-pointer"
                >
                  {isPlaying && currentEpisode?.id === PODCAST_EPISODES[0].id ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause Episode</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Latest Episode</span>
                    </>
                  )}
                </button>

                {/* Follow Button */}
                <button
                  type="button"
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`px-5 py-3 rounded-full border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isFollowing
                      ? 'border-[#1ed760] text-[#1ed760] bg-[#1ed760]/10'
                      : 'border-white/20 hover:border-white text-white hover:bg-white/5'
                  }`}
                >
                  {isFollowing ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{isFollowing ? 'Following' : 'Follow Show'}</span>
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={handleCopyShowLink}
                  className="px-4 py-3 rounded-full border border-white/20 hover:border-white text-white hover:bg-white/5 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                  title="Share podcast page link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-[#1ed760]" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
                </button>

                {/* YouTube Channel CTA */}
                <a
                  href="https://youtube.com/@hackerunity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <FaYoutube className="w-3.5 h-3.5 text-red-500" />
                  <span>Subscribe on YouTube</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content Container ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* ─── Category Filter Pills & Search Bar ─── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-white text-black shadow-md'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border border-white/[0.06]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search & View Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search episodes, guests, topics..."
                className="w-full pl-9 pr-8 py-2 rounded-full bg-white/[0.06] border border-white/10 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#1ed760] focus:ring-1 focus:ring-[#1ed760]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-full bg-white/[0.06] border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-colors ${
                  viewMode === 'list' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                }`}
                title="Playlist Tracklist View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                }`}
                title="Cards Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Featured Episode Spotlight Banner ─── */}
        {selectedCategory === 'all' && !searchQuery && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#121824] to-slate-900/60 border border-[#1ed760]/30 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#1ed760]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 shadow-lg border border-white/10">
                  <Image
                    src="/podcasts/mihirshelar.jpg"
                    alt="Featured Episode"
                    width={120}
                    height={120}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handlePlayEpisode(PODCAST_EPISODES[0])}
                      className="w-10 h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1ed760]/20 text-[#1ed760] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Featured Episode #1
                    </span>
                    <span className="text-slate-400 text-xs">52 mins • Full Length</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-[#1ed760] transition-colors">
                    Amazon Technical Manager Reveals Industry Secrets
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl line-clamp-2">
                    Mihir Shelar on building technology at hyperscale, navigating engineering leadership, and scaling your tech career inside Big Tech.
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <CompanyBadge type="amazon" name="Amazon" />
                    <span className="text-xs text-slate-400 font-medium">Mihir Shelar</span>
                  </div>
                </div>
              </div>

              {/* Spotlight Buttons */}
              <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => handlePlayEpisode(PODCAST_EPISODES[0])}
                  className="flex-1 lg:flex-initial px-5 py-2.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Listen Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVideoModalEpisode(PODCAST_EPISODES[0])}
                  className="flex-1 lg:flex-initial px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
                >
                  <Tv className="w-3.5 h-3.5 text-red-400" />
                  <span>Watch Video</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Zero Results State ─── */}
        {filteredEpisodes.length === 0 && (
          <div className="py-20 text-center rounded-3xl bg-white/[0.02] border border-white/[0.08] p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No episodes found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              We couldn&apos;t find any episodes matching &quot;{searchQuery}&quot;. Try adjusting your search keywords or clear filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-full bg-[#1ed760] text-black text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* ─── Spotify Playlist Tracklist View ─── */}
        {viewMode === 'list' && filteredEpisodes.length > 0 && (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 sm:px-6 py-3 text-[11px] font-bold text-slate-400 border-b border-white/[0.06] uppercase tracking-wider">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-6 sm:col-span-5">Title &amp; Guest</div>
              <div className="hidden sm:block sm:col-span-3">Company &amp; Focus</div>
              <div className="hidden md:flex md:col-span-2 items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Duration</span>
              </div>
              <div className="col-span-5 sm:col-span-3 md:col-span-1 text-right">Watch</div>
            </div>

            {/* Episode Rows */}
            <div className="divide-y divide-white/[0.04]">
              {filteredEpisodes.map((ep, idx) => {
                const isCurrentActive = currentEpisode?.id === ep.id;
                const isItemPlaying = isCurrentActive && isPlaying;
                const isLiked = !!likedEpisodes[ep.id];

                return (
                  <div
                    key={ep.id}
                    onClick={() => handlePlayEpisode(ep)}
                    className={`grid grid-cols-12 gap-4 px-4 sm:px-6 py-3.5 items-center transition-all group cursor-pointer ${
                      isCurrentActive
                        ? 'bg-white/[0.08] text-[#1ed760]'
                        : 'hover:bg-white/[0.04] text-white'
                    }`}
                  >
                    {/* Track Number / Play Button */}
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayEpisode(ep);
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 group-hover:text-black group-hover:bg-[#1ed760] transition-all cursor-pointer"
                      >
                        {isItemPlaying ? (
                          <div className="flex items-center gap-0.5 h-3.5">
                            <span className="w-0.5 bg-[#1ed760] group-hover:bg-black h-3 animate-pulse" />
                            <span className="w-0.5 bg-[#1ed760] group-hover:bg-black h-4 animate-pulse delay-75" />
                            <span className="w-0.5 bg-[#1ed760] group-hover:bg-black h-2 animate-pulse delay-150" />
                          </div>
                        ) : (
                          <>
                            <span className="group-hover:hidden text-xs font-mono font-bold">
                              {ep.episodeNumber}
                            </span>
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5 hidden group-hover:block" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Title & Guest details */}
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-slate-900">
                        <Image
                          src={ep.image}
                          alt={ep.name}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="truncate">
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isCurrentActive ? 'text-[#1ed760]' : 'text-white group-hover:text-[#1ed760]'
                          }`}
                        >
                          {ep.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                          <span className="font-semibold text-slate-200">{ep.name}</span>
                          <span>•</span>
                          <span className="truncate">{ep.designation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Company & Tags */}
                    <div className="hidden sm:block sm:col-span-3">
                      <div className="flex items-center gap-2">
                        <CompanyBadge type={ep.companyType} name={ep.company} />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
                        {ep.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.04] truncate"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="hidden md:flex md:col-span-2 items-center justify-center gap-2 text-xs font-mono text-slate-400">
                      <button
                        type="button"
                        onClick={(e) => handleToggleLike(ep.id, e)}
                        className={`p-1.5 rounded-full transition-colors ${
                          isLiked ? 'text-[#1ed760]' : 'text-slate-500 hover:text-white'
                        }`}
                        title="Save to favorites"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      </button>
                      <span>{ep.duration}</span>
                    </div>

                    {/* Watch on YouTube button */}
                    <div className="col-span-5 sm:col-span-3 md:col-span-1 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoModalEpisode(ep);
                        }}
                        className="p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Watch full video"
                      >
                        <FaYoutube className="w-3.5 h-3.5 text-red-500" />
                        <span className="hidden sm:inline text-[11px]">Watch</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Spotify Cards Grid View ─── */}
        {viewMode === 'grid' && filteredEpisodes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredEpisodes.map((ep) => {
              const isCurrentActive = currentEpisode?.id === ep.id;
              const isItemPlaying = isCurrentActive && isPlaying;
              const isLiked = !!likedEpisodes[ep.id];

              return (
                <div
                  key={ep.id}
                  onClick={() => handlePlayEpisode(ep)}
                  className={`group p-4 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-[#1ed760]/40 transition-all duration-300 flex flex-col justify-between cursor-pointer relative shadow-lg ${
                    isCurrentActive ? 'ring-2 ring-[#1ed760]' : ''
                  }`}
                >
                  <div>
                    {/* Artwork Container with Floating Spotify Play Button */}
                    <div className="relative aspect-video sm:aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/10 mb-3.5">
                      <Image
                        src={ep.image}
                        alt={ep.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Episode Pill */}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
                        EP #{ep.episodeNumber}
                      </span>

                      {/* Floating Play Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayEpisode(ep);
                        }}
                        className={`absolute bottom-3 right-3 w-11 h-11 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl transition-all duration-300 cursor-pointer ${
                          isItemPlaying
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110'
                        }`}
                      >
                        {isItemPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Episode Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <CompanyBadge type={ep.companyType} name={ep.company} />
                        <span className="text-[10px] font-mono text-slate-400">{ep.duration}</span>
                      </div>

                      <h4
                        className={`text-sm font-bold line-clamp-2 leading-snug ${
                          isCurrentActive ? 'text-[#1ed760]' : 'text-white group-hover:text-[#1ed760]'
                        }`}
                      >
                        {ep.title}
                      </h4>

                      <p className="text-xs text-slate-400 font-medium">
                        {ep.name} • <span className="text-slate-500">{ep.designation}</span>
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Row */}
                  <div className="pt-4 mt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={(e) => handleToggleLike(ep.id, e)}
                      className={`p-1 transition-colors ${
                        isLiked ? 'text-[#1ed760]' : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoModalEpisode(ep);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <FaYoutube className="w-3.5 h-3.5 text-red-500" />
                      <span>Watch Full Video</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Sticky Spotify-Style Player Bar (Persistent Bottom Player) ─── */}
      {currentEpisode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-2xl border-t border-white/10 px-4 sm:px-6 py-3 shadow-2xl transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left: Now Playing Metadata */}
            <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-slate-900 shadow-md">
                <Image
                  src={currentEpisode.image}
                  alt={currentEpisode.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-center gap-0.5 h-3">
                      <span className="w-0.5 bg-[#1ed760] h-3 animate-pulse" />
                      <span className="w-0.5 bg-[#1ed760] h-4 animate-pulse delay-75" />
                      <span className="w-0.5 bg-[#1ed760] h-2 animate-pulse delay-150" />
                    </div>
                  </div>
                )}
              </div>

              <div className="truncate hidden xs:block">
                <h5 className="text-xs font-bold text-white truncate hover:underline cursor-pointer">
                  {currentEpisode.title}
                </h5>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentEpisode.name} • {currentEpisode.company}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleLike(currentEpisode.id)}
                className={`p-1.5 rounded-full transition-colors hidden sm:block ${
                  likedEpisodes[currentEpisode.id]
                    ? 'text-[#1ed760]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Save episode"
              >
                <Heart
                  className={`w-4 h-4 ${likedEpisodes[currentEpisode.id] ? 'fill-current' : ''}`}
                />
              </button>
            </div>

            {/* Center: Playback Controls & Progress Scrubber */}
            <div className="flex flex-col items-center gap-1.5 w-full max-w-md">
              {/* Buttons */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handlePrevEpisode}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Previous episode"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Big Round Spotify Play Button */}
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-9 h-9 rounded-full bg-white hover:bg-white/90 hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-lg transition-all cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNextEpisode}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Next episode"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Scrubber Bar */}
              <div className="flex items-center gap-2 w-full text-[10px] font-mono text-slate-400">
                <span>{formatTime(currentEpisode.durationSeconds, progress)}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#1ed760] hover:accent-[#1fdf64]"
                />
                <span>{currentEpisode.duration}</span>
              </div>
            </div>

            {/* Right: Watch Video & Volume */}
            <div className="flex items-center justify-end gap-3 w-1/4 min-w-[150px]">
              {/* Watch Video Modal Opener */}
              <button
                type="button"
                onClick={() => setVideoModalEpisode(currentEpisode)}
                className="px-3 py-1.5 rounded-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <FaYoutube className="w-3.5 h-3.5 text-red-500" />
                <span className="hidden md:inline">Watch Video</span>
              </button>

              {/* Volume */}
              <div className="hidden lg:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-18 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-[#1ed760]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Full YouTube Video Modal (Theater Mode) ─── */}
      {videoModalEpisode && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in"
          onClick={() => setVideoModalEpisode(null)}
        >
          <div
            className="w-full max-w-4xl bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col space-y-4 p-4 sm:p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center">
                  <FaYoutube className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-lg">
                    {videoModalEpisode.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Featuring {videoModalEpisode.name} ({videoModalEpisode.company})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVideoModalEpisode(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoModalEpisode.videoId}?autoplay=1&rel=0`}
                title={videoModalEpisode.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {/* Episode Summary */}
            <div className="space-y-2 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CompanyBadge type={videoModalEpisode.companyType} name={videoModalEpisode.company} />
                  <span className="text-xs text-slate-400 font-mono">Duration: {videoModalEpisode.duration}</span>
                </div>
                <a
                  href={videoModalEpisode.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#1ed760] hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Open on YouTube App</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {videoModalEpisode.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
