'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play,
  Search,
  Sparkles,
  ExternalLink,
  X,
  Clock,
  User,
  Headphones,
  ArrowDown,
  ArrowRight,
  Layers,
  Radio,
  Tv,
  CheckCircle2,
} from 'lucide-react';
import { FaYoutube } from 'react-icons/fa6';
import { PODCAST_EPISODES, PodcastEpisode } from '@/lib/podcasts-data';

const CATEGORIES = [
  { id: 'ALL', label: 'ALL' },
  { id: 'STARTUP & BIG TECH', label: 'STARTUP & BIG TECH', filter: (ep: PodcastEpisode) => ep.category === 'big-tech' },
  { id: 'ENGINEERING & SCALE', label: 'ENGINEERING & SCALE', filter: (ep: PodcastEpisode) => ep.category === 'system-design' },
  { id: 'AI & INNOVATION', label: 'AI & INNOVATION', filter: (ep: PodcastEpisode) => ep.category === 'ai-cloud' },
  { id: 'CAREER & LEADERSHIP', label: 'CAREER & LEADERSHIP', filter: (ep: PodcastEpisode) => ep.category === 'leadership' },
  { id: 'PRODUCT & STRATEGY', label: 'PRODUCT & STRATEGY', filter: (ep: PodcastEpisode) => ep.category === 'product' },
];

function getCategoryBadge(ep: PodcastEpisode) {
  if (ep.category === 'big-tech') return 'STARTUP & BIG TECH';
  if (ep.category === 'ai-cloud') return 'AI & INNOVATION';
  if (ep.category === 'leadership') return 'CAREER & LEADERSHIP';
  if (ep.category === 'system-design') return 'ENGINEERING & SCALE';
  if (ep.category === 'product') return 'PRODUCT & STRATEGY';
  return 'TECH PODCAST';
}

export default function PodcastsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Featured episode for the hero card
  const featuredEpisode = PODCAST_EPISODES[0]; // Mihir Shelar - Amazon

  // Filtered episodes
  const filteredEpisodes = useMemo(() => {
    return PODCAST_EPISODES.filter((ep) => {
      let matchesCat = true;
      if (activeCategory !== 'ALL') {
        const catConfig = CATEGORIES.find((c) => c.id === activeCategory);
        if (catConfig && catConfig.filter) {
          matchesCat = catConfig.filter(ep);
        }
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        ep.name.toLowerCase().includes(q) ||
        ep.title.toLowerCase().includes(q) ||
        ep.company.toLowerCase().includes(q) ||
        ep.designation.toLowerCase().includes(q) ||
        ep.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCat && matchesQuery;
    });
  }, [searchQuery, activeCategory]);

  const handleScrollToEpisodes = () => {
    const el = document.getElementById('episodes');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/70 dark:bg-[#05070d] text-slate-900 dark:text-slate-100 selection:bg-[#0099e6] selection:text-white relative overflow-hidden transition-colors duration-300">
      {/* ─── Hero Section (Matching SheKunj Reference) ───────────────── */}
      <div className="relative pt-10 pb-16 lg:pb-24 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-white/70 via-transparent to-transparent dark:from-[#0c1220] dark:via-[#070a13] dark:to-[#05070d] backdrop-blur-xs">
        {/* Background Ambient Glows & Watermark */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0099e6]/12 dark:bg-[#0099e6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#0099e6]/12 dark:bg-[#0099e6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-1/4 w-80 h-80 bg-[#f97316]/10 dark:bg-[#f97316]/05 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -left-10 select-none pointer-events-none text-[120px] sm:text-[180px] font-black tracking-tighter text-slate-900/[0.02] dark:text-white/[0.02] uppercase leading-none">
          PODCASTS
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Category Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-white/[0.05] border border-slate-200/90 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 backdrop-blur-xl shadow-xs">
                <Headphones className="w-3.5 h-3.5 text-[#0099e6]" />
                <span className="tracking-wider uppercase text-[11px]">Hacker&apos;s Unity Podcasts</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                Voices that <span className="text-slate-900 dark:text-white">matter</span>,{' '}
                <span className="bg-gradient-to-r from-[#0099e6] via-sky-400 to-[#f97316] bg-clip-text text-transparent">
                  stories that resonate.
                </span>
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed font-normal">
                Discover the latest top-notch stories from a worldwide community of tech leaders, quality informative engineering podcasts and verified mentors.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleScrollToEpisodes}
                  className="px-6 py-3.5 rounded-2xl bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/25 border border-sky-400/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Discover podcasts</span>
                  <ArrowDown className="w-4 h-4" />
                </button>

                <a
                  href="https://youtube.com/@hackerunity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-2xl bg-[#ea3323] hover:bg-[#d92215] text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <FaYoutube className="w-4 h-4" />
                  <span>Watch on YouTube</span>
                </a>
              </div>

              {/* Listener Social Proof & Highlights */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-white/[0.08] flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500 dark:text-slate-400">
                {/* Avatar stack */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full border-2 border-white dark:border-[#0c1220] overflow-hidden bg-slate-800">
                      <Image src="/podcasts/kirshna.jpg" alt="Listener" width={28} height={28} className="w-full h-full object-cover" />
                    </div>
                    <div className="w-7 h-7 rounded-full border-2 border-white dark:border-[#0c1220] overflow-hidden bg-slate-800">
                      <Image src="/podcasts/ankur.jpg" alt="Listener" width={28} height={28} className="w-full h-full object-cover" />
                    </div>
                    <div className="w-7 h-7 rounded-full border-2 border-white dark:border-[#0c1220] overflow-hidden bg-slate-800">
                      <Image src="/podcasts/abhijitroy.jpg" alt="Listener" width={28} height={28} className="w-full h-full object-cover" />
                    </div>
                    <div className="w-7 h-7 rounded-full border-2 border-white dark:border-[#0c1220] overflow-hidden bg-[#0099e6] text-white text-[9px] font-black flex items-center justify-center">
                      50K+
                    </div>
                  </div>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">50K+ Listeners</strong> streaming on Hacker&apos;s Unity
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-4 text-slate-400 dark:text-slate-500 text-[11px]">
                  <span>•</span>
                  <span>Diverse Topics</span>
                  <span>•</span>
                  <span>Expert Mentors</span>
                  <span>•</span>
                  <span>Anywhere, Anytime</span>
                </div>
              </div>
            </div>

            {/* Right: Featured Podcast Card (As in SheKunj reference) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-sm rounded-3xl p-4 sm:p-5 bg-white/70 dark:bg-gradient-to-b dark:from-[#131b2e] dark:to-[#0a0f1d] border border-slate-200/90 dark:border-white/10 shadow-xl shadow-slate-200/60 dark:shadow-2xl dark:shadow-black/80 hover:border-[#0099e6]/50 transition-all duration-300 group backdrop-blur-xl">
                {/* Image Container */}
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 dark:border-white/10 mb-4">
                  <Image
                    src={featuredEpisode.image}
                    alt={featuredEpisode.title}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top-right Play circle */}
                  <a
                    href={featuredEpisode.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition-colors"
                  >
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </a>

                  {/* Category Badge overlay */}
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/90 backdrop-blur-md text-black font-extrabold text-[10px] tracking-wider uppercase">
                      STARTUP &amp; BIG TECH
                    </span>
                  </div>
                </div>

                {/* Card Text Content */}
                <div className="space-y-2 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0099e6]">
                    FEATURED
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#0099e6] transition-colors">
                    {featuredEpisode.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {featuredEpisode.tagline}
                  </p>
                </div>

                {/* Watch Button */}
                <a
                  href={featuredEpisode.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-[#ea3323] hover:bg-[#d92215] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <FaYoutube className="w-4 h-4" />
                  <span>Watch on YouTube</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── All Podcast Episodes Section ───────────────────────────── */}
      <div id="episodes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 space-y-8">
        {/* Header & Search Bar Row (Exact reference layout) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              All Podcast Episodes
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              Discover the stories, experiences, and insights behind the people creating impact in their fields.
            </p>
          </div>

          {/* Search Box on Right */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search episodes..."
              className="w-full pl-10 pr-9 py-2.5 rounded-full bg-white/80 dark:bg-white/[0.05] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#0099e6] focus:ring-1 focus:ring-[#0099e6] transition-colors shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills (Exact reference pill styling) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer backdrop-blur-xl ${
                activeCategory === cat.id
                  ? 'bg-[#0099e6] text-white shadow-md shadow-sky-500/30 border border-sky-400/40'
                  : 'bg-white/60 dark:bg-white/[0.05] hover:bg-white dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/5 shadow-xs'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Zero Results State */}
        {filteredEpisodes.length === 0 && (
          <div className="py-20 text-center rounded-3xl bg-white/60 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] p-8 space-y-4 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No episodes found</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              We couldn&apos;t find any episodes matching &quot;{searchQuery}&quot;. Try adjusting your search keywords.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('ALL');
              }}
              className="px-5 py-2 rounded-full bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-sky-500/20"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Episode Cards Grid (Matching Screenshots 2 & 3) */}
        {filteredEpisodes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredEpisodes.map((ep) => (
              <div
                key={ep.id}
                className="group rounded-3xl bg-white/70 dark:bg-[#0b101b] border border-slate-200/80 dark:border-white/[0.08] hover:border-[#0099e6]/60 shadow-lg shadow-slate-200/50 dark:shadow-xl dark:shadow-black/60 transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1 backdrop-blur-xl"
              >
                {/* Card Thumbnail Area */}
                <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden">
                  <Image
                    src={ep.image}
                    alt={ep.name}
                    width={360}
                    height={270}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top-left category badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-slate-200 border border-white/10 text-[9px] font-extrabold uppercase tracking-wider">
                    {getCategoryBadge(ep)}
                  </span>

                  {/* Top-right play circle */}
                  <a
                    href={ep.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                  </a>

                  {/* Duration overlay bottom-right */}
                  <span className="absolute bottom-2.5 right-3 text-[10px] font-mono font-bold text-slate-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                    {ep.duration}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#0099e6] transition-colors">
                      {ep.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {ep.name} • {ep.designation} ({ep.company})
                    </p>
                  </div>

                  {/* Watch on YouTube Button */}
                  <a
                    href={ep.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-[#ea3323] hover:bg-[#d92215] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <FaYoutube className="w-4 h-4" />
                    <span>Watch on YouTube</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Counter */}
        <div className="pt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing {filteredEpisodes.length} of {PODCAST_EPISODES.length} Episodes
        </div>

        {/* ─── Bottom Metallic Black / Glass Hacker's Unity CTA Banner ── */}
        <div className="pt-6">
          <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-white/70 dark:bg-gradient-to-b dark:from-[#111827] dark:via-[#0b0f19] dark:to-[#06080f] border border-slate-200/90 dark:border-white/[0.1] shadow-xl shadow-slate-200/60 dark:shadow-2xl dark:shadow-black/80 text-center space-y-6 relative overflow-hidden group backdrop-blur-xl">
            {/* Top Cyan Glowing Line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#0099e6] to-transparent opacity-80" />

            {/* Ambient Glows */}
            <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-[#0099e6]/12 dark:bg-[#0099e6]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -right-16 -top-16 w-72 h-72 bg-[#f97316]/10 dark:bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/5 dark:from-sky-900/15 via-transparent to-transparent pointer-events-none" />

            {/* Brand Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-300 backdrop-blur-md relative z-10 shadow-xs">
              <span className="text-[#f97316] font-black tracking-wider">UNITE.</span>
              <span className="text-[#0099e6] font-black tracking-wider">CODE.</span>
              <span className="text-slate-900 dark:text-white font-black tracking-wider">CREATE.</span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white max-w-2xl mx-auto leading-tight relative z-10">
              Hacker&apos;s Unity brings together people who{' '}
              <span className="bg-gradient-to-r from-[#0099e6] via-sky-400 to-[#f97316] bg-clip-text text-transparent">
                educate, inspire and build.
              </span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed relative z-10">
              Catch the latest episodes, deep-dive interviews, and engineering insights directly on our official YouTube channel.
            </p>

            <div className="pt-2 relative z-10">
              <a
                href="https://youtube.com/@hackerunity"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-[#ea3323] hover:bg-[#d92215] text-white font-black text-xs sm:text-sm shadow-xl shadow-red-600/25 hover:scale-105 active:scale-95 transition-all border border-red-400/30 cursor-pointer"
              >
                <FaYoutube className="w-4 h-4" />
                <span>Watch on YouTube →</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
