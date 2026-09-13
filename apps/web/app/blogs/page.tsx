'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Sparkles,
  Clock,
  User,
  ArrowRight,
  ChevronRight,
  Share2,
  X,
  Check,
  Tag,
  Flame,
  Filter,
} from 'lucide-react';
import { BLOG_POSTS, BlogPost } from '@/lib/blogs-data';

const CATEGORIES = [
  'ALL',
  'Hackathons',
  'AI & Agents',
  'Squad Formation',
  'Career & Big Tech',
  'Pitch & Judging',
  'Web3 & DeepTech',
] as const;

export default function BlogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Keyboard escape handler for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBlog(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const featuredBlog = useMemo(() => {
    return BLOG_POSTS.find((b) => b.featured) || BLOG_POSTS[0];
  }, []);

  const filteredBlogs = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesCategory =
        activeCategory === 'ALL' || post.category === activeCategory;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesQuery =
        post.title.toLowerCase().includes(q) ||
        post.subtitle.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.author.name.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, activeCategory]);

  const handleShare = (post: BlogPost) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/blogs/${post.slug}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/70 dark:bg-[#05070d] text-slate-900 dark:text-slate-100 selection:bg-[#0099e6] selection:text-white relative overflow-hidden transition-colors duration-300">
      {/* ─── Ambient Glassmorphism Background Glows ─────────────────── */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0099e6]/12 dark:bg-[#0099e6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#f97316]/10 dark:bg-[#f97316]/06 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 w-80 h-80 bg-sky-400/10 dark:bg-sky-500/05 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-10 -left-10 select-none pointer-events-none text-[120px] sm:text-[180px] font-black tracking-tighter text-slate-900/[0.02] dark:text-white/[0.02] uppercase leading-none">
        BLOGS
      </div>

      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <div className="relative pt-12 pb-16 lg:pb-20 border-b border-slate-200/80 dark:border-white/[0.08] bg-gradient-to-b from-white/70 via-transparent to-transparent dark:from-[#0c1220]/80 dark:via-[#070a13]/60 dark:to-transparent backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            {/* Glass Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 dark:bg-white/[0.05] border border-slate-200/90 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 backdrop-blur-xl shadow-xs mx-auto">
              <BookOpen className="w-3.5 h-3.5 text-[#0099e6]" />
              <span className="tracking-wider uppercase text-[11px]">Hacker&apos;s Unity Insights</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Stories, playbooks &amp;{' '}
              <span className="bg-gradient-to-r from-[#0099e6] via-sky-400 to-[#f97316] bg-clip-text text-transparent">
                builder wisdom.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Deep dives on winning national hackathons, architecting autonomous AI agents, assembling dream squads, and landing offers at Amazon &amp; Microsoft.
            </p>

            {/* Frosted Glass Search Bar */}
            <div className="pt-2 max-w-xl mx-auto">
              <div className="relative group">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#0099e6] transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles by topic, e.g. 'winning hackathons', 'squads', 'AI agents'..."
                  className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.05] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm backdrop-blur-xl focus:outline-none focus:border-[#0099e6] focus:ring-2 focus:ring-[#0099e6]/20 transition-all shadow-lg shadow-slate-200/40 dark:shadow-black/60"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content Area ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
        {/* ─── Featured Hero Article Card (Glassmorphism) ───────────── */}
        {!searchQuery && activeCategory === 'ALL' && featuredBlog && (
          <div className="relative rounded-3xl overflow-hidden bg-white/70 dark:bg-gradient-to-br dark:from-[#0d1424]/90 dark:via-[#090d16]/80 dark:to-[#06080f]/90 border border-slate-200/90 dark:border-white/[0.1] backdrop-blur-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/80 transition-all duration-300 hover:border-[#0099e6]/50 group">
            {/* Top Glowing Hairline */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#0099e6] to-transparent opacity-80" />

            <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Text Content */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/30 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                    <Flame className="w-3 h-3" />
                    <span>FEATURED PLAYBOOK</span>
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {featuredBlog.readTime}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-[#0099e6] transition-colors">
                  {featuredBlog.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {featuredBlog.subtitle}
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0099e6] to-sky-400 text-white font-black text-xs flex items-center justify-center shadow-md shadow-sky-500/20">
                    {featuredBlog.author.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {featuredBlog.author.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {featuredBlog.author.role} • {featuredBlog.publishedAt}
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedBlog(featuredBlog)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/25 border border-sky-400/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Read Full Article</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare(featuredBlog)}
                    className="p-3 rounded-2xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                    title="Share article"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Right Column: Visual Glass Banner */}
              <div className="lg:col-span-5">
                <div className={`relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-gradient-to-br ${featuredBlog.coverGradient} border border-slate-200/80 dark:border-white/15 p-6 flex flex-col justify-between shadow-2xl backdrop-blur-xl group-hover:scale-[1.02] transition-transform duration-500`}>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider border border-white/10">
                      {featuredBlog.category}
                    </span>
                    <span className="text-[10px] font-mono text-white/80 bg-black/30 px-2 py-0.5 rounded backdrop-blur-xs">
                      36H SPRINT
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xl sm:text-2xl font-black text-white leading-tight">
                      Hackathon Mastery Framework
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {featuredBlog.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Category Filter Pills (Glassmorphism) ────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer backdrop-blur-xl ${
                  isActive
                    ? 'bg-[#0099e6] text-white shadow-md shadow-sky-500/30 border border-sky-400/40 scale-105'
                    : 'bg-white/60 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.06] shadow-xs'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-white/[0.08] pb-3 font-medium">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{filteredBlogs.length}</strong> articles
            {activeCategory !== 'ALL' && ` in "${activeCategory}"`}
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('ALL');
              }}
              className="text-[#0099e6] hover:underline font-bold cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ─── 6 Glassmorphism Blog Cards Grid ──────────────────────── */}
        {filteredBlogs.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white/60 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] p-8 space-y-4 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No articles found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              We couldn&apos;t find any blog matching &quot;{searchQuery}&quot;. Try adjusting your keywords or selecting another category.
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredBlogs.map((blog) => (
              <article
                key={blog.id}
                onClick={() => setSelectedBlog(blog)}
                className="group rounded-3xl overflow-hidden bg-white/70 dark:bg-[#0b101b]/80 border border-slate-200/80 dark:border-white/[0.08] hover:border-[#0099e6]/60 dark:hover:border-[#0099e6]/60 backdrop-blur-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/70 hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 cursor-pointer relative"
              >
                {/* Top Glowing Hairline on Card Hover */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#0099e6] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Frosted Header / Cover Preview */}
                  <div className={`relative h-44 w-full bg-gradient-to-br ${blog.coverGradient} p-5 flex flex-col justify-between overflow-hidden border-b border-slate-200/60 dark:border-white/[0.08]`}>
                    {/* Inner Ambient Glow */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10">
                      <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider border border-white/10 shadow-xs">
                        {blog.category}
                      </span>
                      <div className="inline-flex items-center gap-1 text-[11px] font-mono text-white/90 bg-black/30 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>{blog.readTime}</span>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <div className="flex flex-wrap gap-1">
                        {blog.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-[9px] font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#0099e6] transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-normal">
                      {blog.excerpt}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Author & Read More */}
                <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 dark:border-white/[0.06] mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0099e6] to-sky-400 text-white font-black text-[11px] flex items-center justify-center shadow-xs">
                      {blog.author.initials}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {blog.author.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {blog.publishedAt}
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0099e6] group-hover:translate-x-1 transition-transform">
                    <span>Read</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ─── Bottom Metallic Glass CTA Banner ─────────────────────── */}
        <div className="pt-8">
          <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-white/70 dark:bg-gradient-to-b dark:from-[#111827]/90 dark:via-[#0b0f19]/80 dark:to-[#06080f]/90 border border-slate-200/90 dark:border-white/[0.1] backdrop-blur-2xl shadow-2xl shadow-slate-200/60 dark:shadow-black/80 text-center space-y-6 relative overflow-hidden group">
            {/* Top Cyan Glowing Line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#0099e6] to-transparent opacity-80" />

            {/* Ambient Glows */}
            <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-[#0099e6]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -right-16 -top-16 w-72 h-72 bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Brand Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-300 backdrop-blur-md relative z-10">
              <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" />
              <span>Contribute to Hacker&apos;s Unity</span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white max-w-2xl mx-auto leading-tight relative z-10">
              Have a hackathon breakdown or technical playbook to share?{' '}
              <span className="bg-gradient-to-r from-[#0099e6] via-sky-400 to-[#f97316] bg-clip-text text-transparent">
                Write for our community.
              </span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed relative z-10 font-normal">
              Join our network of guest contributors, mentors, and engineering leads. Get your insights read by over 50,000+ passionate developers and founders.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 relative z-10">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#0099e6] hover:bg-[#0088cc] text-white font-bold text-xs sm:text-sm shadow-xl shadow-sky-500/25 hover:scale-105 active:scale-95 transition-all border border-sky-400/30 cursor-pointer"
              >
                <span>Submit Article Pitch</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/podcasts"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-800 dark:text-white font-bold text-xs sm:text-sm border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
              >
                <span>Explore Podcasts</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Ultra-Sleek Glassmorphic Article Reading Modal ─────────── */}
      {selectedBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-3xl rounded-3xl bg-white/95 dark:bg-[#0c1220]/95 border border-slate-200 dark:border-white/15 backdrop-blur-3xl shadow-2xl shadow-black/80 overflow-hidden my-8 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Glow bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#0099e6] via-sky-400 to-[#f97316]" />

            {/* Modal Header */}
            <div className="p-6 sm:p-8 border-b border-slate-200/80 dark:border-white/10 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#0099e6]/10 text-[#0099e6] border border-[#0099e6]/30 text-[10px] font-black uppercase tracking-wider">
                    {selectedBlog.category}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {selectedBlog.readTime} • {selectedBlog.publishedAt}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-snug">
                  {selectedBlog.title}
                </h2>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedBlog(null)}
                className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {/* Author Banner Card */}
              <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0099e6] to-sky-400 text-white font-black text-xs flex items-center justify-center shadow-md shadow-sky-500/20">
                    {selectedBlog.author.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {selectedBlog.author.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedBlog.author.role}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleShare(selectedBlog)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.08] hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-white/10 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </>
                  )}
                </button>
              </div>

              {/* Subtitle Highlight */}
              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-xs sm:text-sm text-sky-900 dark:text-sky-300 font-medium leading-relaxed">
                💡 <strong>Core Takeaway:</strong> {selectedBlog.subtitle}
              </div>

              {/* Paragraphs */}
              <div className="space-y-4">
                {selectedBlog.content.map((paragraph, index) => {
                  if (paragraph.startsWith('### ')) {
                    return (
                      <h4
                        key={index}
                        className="text-lg sm:text-xl font-black text-slate-900 dark:text-white pt-3 pb-1 tracking-tight"
                      >
                        {paragraph.replace('### ', '')}
                      </h4>
                    );
                  }
                  if (paragraph.startsWith('- ')) {
                    return (
                      <li key={index} className="ml-4 list-disc text-slate-600 dark:text-slate-300">
                        {paragraph.replace('- ', '')}
                      </li>
                    );
                  }
                  return (
                    <p key={index} className="leading-relaxed">
                      {paragraph}
                    </p>
                  );
                })}
              </div>

              {/* Tags */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center gap-2 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {selectedBlog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-xs font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-white/[0.02]">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Published on Hacker&apos;s Unity Platform
              </span>
              <button
                type="button"
                onClick={() => setSelectedBlog(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-white/[0.1] hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
