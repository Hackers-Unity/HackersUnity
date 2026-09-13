'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Sparkles,
  Clock,
  Calendar,
  ArrowRight,
  ChevronRight,
  Share2,
  X,
  Check,
  Tag,
  Flame,
  Layers,
  PenTool,
  Plus,
} from 'lucide-react';
import { BLOG_POSTS, BlogPost } from '@/lib/blogs-data';

const CATEGORIES = [
  'ALL',
  'Agentic AI',
  'Space Domain',
  'Web3',
  'IoT',
  'Cybersecurity',
  'Cloud',
] as const;

export default function BlogsPage() {
  const [blogsList, setBlogsList] = useState<BlogPost[]>(BLOG_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false);

  // Fetch approved blogs from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadBlogs() {
      try {
        setIsLoadingBlogs(true);
        const res = await fetch('/api/blogs');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.blogs) && data.blogs.length > 0) {
            setBlogsList(data.blogs);
          }
        }
      } catch {
        // Fallback to static seed
      } finally {
        if (isMounted) setIsLoadingBlogs(false);
      }
    }
    loadBlogs();
    return () => {
      isMounted = false;
    };
  }, []);

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
    return blogsList.find((b) => b.featured) || blogsList[0];
  }, [blogsList]);

  const filteredBlogs = useMemo(() => {
    return blogsList.filter((post) => {
      const matchesCategory =
        activeCategory === 'ALL' || post.category === activeCategory;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesQuery =
        post.title.toLowerCase().includes(q) ||
        post.subtitle.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [blogsList, searchQuery, activeCategory]);

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

      {/* ─── Hero Section (Reference Style) ─────────────────────────── */}
      <div className="relative pt-10 pb-12 lg:pb-16 border-b border-slate-200/80 dark:border-white/[0.08] bg-gradient-to-b from-white/70 via-transparent to-transparent dark:from-[#0a0e17] dark:via-[#060910] dark:to-transparent backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Top Bar with Badge (Left) and Write Blog button (Top Right Corner) */}
          <div className="flex items-center justify-between gap-4 mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 dark:bg-white/[0.06] border border-slate-700/60 dark:border-white/10 text-xs font-semibold text-slate-300 backdrop-blur-xl shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0099e6] animate-pulse" />
              <span className="tracking-widest uppercase text-[10px] sm:text-[11px] font-extrabold text-slate-300">
                The Hacker&apos;s Unity Blog
              </span>
            </div>

            <Link
              href="/blogs/write"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-500/25 transition-all cursor-pointer group hover:scale-[1.03] active:scale-95"
            >
              <PenTool className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>Write Blog</span>
            </Link>
          </div>

          {/* Two-Column Editorial Headline & Description (Reference Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end">
            <div className="lg:col-span-7 space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Stories, guides &amp;{' '}
                <span className="font-serif italic font-normal text-[#0099e6] dark:text-sky-400">
                  field notes
                </span>
                <br />
                from builders.
              </h1>
            </div>

            <div className="lg:col-span-5 lg:pb-1">
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Case studies, success stories and deep technical guides on AI, Web3, Space, IoT, and cloud architecture — straight from the community that ships.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content Area ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-12">
        {/* ─── Featured Hero Article Card (Reference Style: Image on Left, Content on Right) ── */}
        {!searchQuery && activeCategory === 'ALL' && featuredBlog && (
          <div
            onClick={() => setSelectedBlog(featuredBlog)}
            className="group relative rounded-[28px] sm:rounded-[36px] overflow-hidden bg-white dark:bg-[#0b101b] border border-slate-200/90 dark:border-white/[0.08] shadow-2xl shadow-slate-200/60 dark:shadow-black/80 transition-all duration-300 hover:border-[#0099e6]/50 cursor-pointer"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[420px] lg:min-h-[460px]">
              {/* Left Column: Visual Image Container (approx 50%) */}
              <div className="lg:col-span-6 relative overflow-hidden bg-slate-950 min-h-[300px] sm:min-h-[380px] lg:min-h-full">
                <Image
                  src={featuredBlog.image}
                  alt={featuredBlog.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/30" />

                {/* Mobile overlay pill badge */}
                <div className="absolute top-4 left-4 lg:hidden">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider border border-white/20">
                    {featuredBlog.category}
                  </span>
                </div>
              </div>

              {/* Right Column: Editorial Text Content (approx 50%) */}
              <div className="lg:col-span-6 p-7 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Top Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                      FEATURED
                    </span>
                    <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500 dark:text-slate-400">
                      {featuredBlog.category}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {featuredBlog.publishedAt}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#0099e6]" />
                      <span>{featuredBlog.readTime}</span>
                    </span>
                  </div>

                  {/* Headline */}
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-[1.22] group-hover:text-[#0099e6] transition-colors">
                    {featuredBlog.title}
                  </h2>

                  {/* Subtitle / Excerpt */}
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal line-clamp-3">
                    {featuredBlog.subtitle || featuredBlog.excerpt}
                  </p>
                </div>

                {/* Bottom CTA Row: Read the story → */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-[#0099e6] dark:group-hover:text-sky-400 underline underline-offset-8 decoration-slate-400 dark:decoration-slate-600 group-hover:decoration-[#0099e6] transition-all">
                    <span>Read the story</span>
                    <span className="group-hover:translate-x-1.5 transition-transform">→</span>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(featuredBlog);
                    }}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                    title="Share article"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Category Filter Pills ────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md scale-105'
                    : 'bg-white/70 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/[0.06]'
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
                className="group rounded-3xl overflow-hidden bg-white dark:bg-[#0b101b] border border-slate-200/90 dark:border-white/[0.08] hover:border-[#0099e6]/60 dark:hover:border-[#0099e6]/60 shadow-lg shadow-slate-200/50 dark:shadow-black/70 hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 cursor-pointer relative"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900 border-b border-slate-200/60 dark:border-white/[0.08]">
                    <Image
                      src={blog.image}
                      alt={blog.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Category badge top-left */}
                    <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider border border-white/10 shadow-xs z-10">
                      {blog.category}
                    </span>

                    {/* Read time top-right */}
                    <div className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 text-[11px] font-mono text-white/90 bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/10 z-10">
                      <Clock className="w-3 h-3 text-[#0099e6]" />
                      <span>{blog.readTime}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#0099e6]" />
                      <span>{blog.publishedAt}</span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#0099e6] transition-colors">
                      {blog.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal">
                      {blog.excerpt}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Read story link */}
                <div className="p-6 pt-0 border-t border-slate-100 dark:border-white/[0.06] mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0099e6] dark:group-hover:text-sky-400 underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700 group-hover:decoration-[#0099e6] transition-all">
                    <span>Read story</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>

                  <span className="text-[11px] text-slate-400 font-medium">
                    Hacker&apos;s Unity
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
              <span>Contribute Technical Articles</span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white max-w-2xl mx-auto leading-tight relative z-10">
              Passionate about deep tech research &amp; engineering playbooks?{' '}
              <span className="bg-gradient-to-r from-[#0099e6] via-sky-400 to-[#f97316] bg-clip-text text-transparent">
                Publish on Hacker&apos;s Unity.
              </span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed relative z-10 font-normal">
              Share your research across Agentic AI, SpaceTech, Web3, IoT, and Cybersecurity with 50,000+ engineers, researchers, and founders.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 relative z-10">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#0099e6] hover:bg-[#0088cc] text-white font-bold text-xs sm:text-sm shadow-xl shadow-sky-500/25 hover:scale-105 active:scale-95 transition-all border border-sky-400/30 cursor-pointer"
              >
                <span>Submit Topic Proposal</span>
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

            {/* Modal Header with Cover Image */}
            <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900 shrink-0">
              <Image
                src={selectedBlog.image}
                alt={selectedBlog.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1220] via-black/40 to-transparent" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedBlog(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md border border-white/20 z-20"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-black/60 text-white border border-white/20 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                    {selectedBlog.category}
                  </span>
                  <span className="text-xs text-slate-200 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#0099e6]" />
                    <span>{selectedBlog.publishedAt}</span>
                  </span>
                  <span className="text-xs text-slate-200 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#0099e6]" />
                    <span>{selectedBlog.readTime}</span>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {selectedBlog.title}
                </h2>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {/* Share & Meta Bar */}
              <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-4 backdrop-blur-md">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Published in <strong>{selectedBlog.category}</strong> Domain
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
                Hacker&apos;s Unity Research &amp; Engineering
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
