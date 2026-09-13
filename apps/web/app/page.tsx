'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Trophy,
  Users,
  ArrowRight,
  ShieldCheck,
  Zap,
  Flame,
  ChevronDown,
  Bot,
  Blocks,
  Globe,
  Cloud,
  Code2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { HackathonCard } from '@/components/hackathon-card';
import { usePublishedEvents } from '@/lib/hooks/use-events';

import { AuthModal } from '@/components/auth-modal';
import { AiHeroPanel } from '@/components/ai-hero-panel';
import { PodcastSection } from '@/components/podcast-section';
import { TestimonialsSection } from '@/components/testimonials-section';
import { JoinTeamSection } from '@/components/join-team-section';

// Event gallery photos
import galleryStage from '@/assets/hackstorm_stage.jpg';
import galleryHall from '@/assets/hackstorm_hall.jpg';
import galleryWinners from '@/assets/hackstorm_winners.jpg';
import galleryInauguration from '@/assets/hackstorm_inauguration.jpg';
import gallerySpeaker from '@/assets/hackstorm_speaker.jpg';
import galleryBooth from '@/assets/hackstorm_booth.jpg';
import galleryDevelopers from '@/assets/hackstorm_developers.jpg';
import galleryMentoring from '@/assets/hackstorm_mentoring.jpg';
import galleryDiscussions from '@/assets/hackstorm_discussions.jpg';
import galleryFocus from '@/assets/hackstorm_focus.jpg';
import galleryStellar from '@/assets/stellar_bootcamp.jpg';
import galleryHive from '@/assets/hive_mentors.jpg';

// CodeWars event photos
import codeWars1 from '@/assets/CodeWars1.jpg';
import codeWars2 from '@/assets/CodeWars2.jpg';
import codeWars3 from '@/assets/CodeWars3.jpg';
import codeWars4 from '@/assets/CodeWars4.jpg';
import codeWars5 from '@/assets/CodeWars5.jpg';
import codeWars6 from '@/assets/CodeWars6.jpg';
import codeWars7 from '@/assets/CodeWars7.jpg';
import codeWars8 from '@/assets/CodeWars8.jpg';
import codeWars9 from '@/assets/CodeWars9.jpg';
import codeWars10 from '@/assets/CodeWars10.jpg';
import codeWars11 from '@/assets/CodeWars11.jpg';
import codeWars12 from '@/assets/CodeWars12.jpg';
import codeWars13 from '@/assets/CodeWars13.jpg';
import codeWars14 from '@/assets/CodeWars14.jpg';
import codeWars15 from '@/assets/CodeWars15.jpg';
import stellarHU from '@/assets/StellarHU.jpg';
import stellarHU1 from '@/assets/StellarHU1.jpg';
import stellarHU2 from '@/assets/StellarHU2.jpg';
import workshopPhoto from '@/assets/6.jpg';

export default function HomePage() {
  const { events, loading } = usePublishedEvents();
  const [authOpen, setAuthOpen] = useState(false);

  // Gallery scroll-reveal via Intersection Observer
  const gallerySectionRef = useRef<HTMLElement>(null);
  const [galleryVisible, setGalleryVisible] = useState(false);

  // Workshop carousel (manual)
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Featured Hackathons manual horizontal scroll
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkEventsScroll = () => {
    const el = eventsScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 15);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 15);
  };

  useEffect(() => {
    const el = eventsScrollRef.current;
    if (!el) return;
    checkEventsScroll();
    const t1 = setTimeout(checkEventsScroll, 100);
    const t2 = setTimeout(checkEventsScroll, 500);
    el.addEventListener('scroll', checkEventsScroll, { passive: true });
    window.addEventListener('resize', checkEventsScroll);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      el.removeEventListener('scroll', checkEventsScroll);
      window.removeEventListener('resize', checkEventsScroll);
    };
  }, [events]);

  const scrollEvents = (direction: 'left' | 'right') => {
    if (eventsScrollRef.current) {
      const scrollAmount = 404; // 380px card + 24px gap
      eventsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const node = gallerySectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGalleryVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);



  const galleryRow1 = [
    { src: galleryStage, label: 'Hackstorm — Grand Stage' },
    { src: codeWars1, label: 'CodeWars — Inauguration Stage' },
    { src: galleryHall, label: 'Hackstorm — Hacking Arena' },
    { src: codeWars2, label: 'CodeWars — Opening Ceremony' },
    { src: galleryWinners, label: 'Hackstorm — Winners' },
    { src: codeWars3, label: 'CodeWars — Keynote Session' },
    { src: galleryInauguration, label: 'Hackstorm — Inauguration' },
    { src: codeWars4, label: 'CodeWars — Panel Discussion' },
    { src: gallerySpeaker, label: 'Hackstorm — Speaker Session' },
    { src: codeWars5, label: 'CodeWars — Hacking Arena' },
    { src: galleryBooth, label: 'Hackstorm — Sponsor Booth' },
    { src: codeWars6, label: 'CodeWars — Team Collaboration' },
    { src: codeWars7, label: 'CodeWars — Demo Presentation' },
    { src: stellarHU, label: 'Stellar Bootcamp — Workshop' },
  ];

  const galleryRow2 = [
    { src: galleryDevelopers, label: 'Hackstorm — Developers' },
    { src: codeWars8, label: 'CodeWars — Mentoring Session' },
    { src: galleryMentoring, label: 'Hackstorm — Mentoring' },
    { src: codeWars9, label: 'CodeWars — Judging Round' },
    { src: galleryDiscussions, label: 'Hackstorm — Discussions' },
    { src: codeWars10, label: 'CodeWars — Audience' },
    { src: galleryFocus, label: 'Hackstorm — Focus Mode' },
    { src: codeWars11, label: 'CodeWars — Prize Ceremony' },
    { src: galleryStellar, label: 'Stellar Bootcamp' },
    { src: codeWars12, label: 'CodeWars — Winners Celebration' },
    { src: galleryHive, label: 'Hive — Mentor Connect' },
    { src: codeWars13, label: 'CodeWars — Networking' },
    { src: codeWars14, label: 'CodeWars — Closing Ceremony' },
    { src: codeWars15, label: 'CodeWars — Group Photo' },
    { src: stellarHU1, label: 'Stellar Bootcamp — Hands-on' },
    { src: stellarHU2, label: 'Stellar Bootcamp — Community' },
  ];

  return (
    <div className="flex flex-col flex-1">
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 dark:border-white/[0.08] bg-grid-pattern">
        {/* Soft Ambient Brand Mesh */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0099e6]/10 dark:bg-[#0099e6]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-[#f97316]/10 dark:bg-[#f97316]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs font-bold mb-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 max-w-full justify-center">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0099e6] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0099e6]" />
            </span>
            <span className="font-mono uppercase tracking-wider text-[10px] sm:text-xs text-center">
              <strong className="text-[#0099e6]">15+ LIVE HACKATHONS</strong> • <strong className="text-[#ea580c]">$350K PRIZE POOLS</strong>
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight max-w-5xl leading-[1.15] sm:leading-[1.1] mb-6">
            Where Student Talent Finds a {' '}
            <span className="text-gradient-brand">Platform & Ideas</span> Become Impact.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed mb-8 font-medium">
            Discover premier hackathons across AI Agents, Web3, and DeepTech. Match with world-class teammates, build high-impact prototypes, and win verified payouts on Hacker&apos;s Unity.
          </p>

          {/* AI Command Center: Find & Build with Groq */}
          <AiHeroPanel />



          {/* Metrics Ticker */}
          <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-5 pt-8 border-t border-slate-200/80 dark:border-white/[0.08]">
            {/* Stat 1: Hackathons */}
            <div className="group relative p-3 sm:p-5 rounded-2xl bg-white/90 dark:bg-[#0c1017]/90 backdrop-blur-sm border border-slate-200/90 dark:border-white/[0.08] shadow-xs hover:shadow-lg dark:hover:shadow-black/70 hover:border-slate-300 dark:hover:border-white/[0.18] hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-800 dark:text-slate-200 mb-2 group-hover:scale-110 transition-transform">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                10+
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-bold text-center leading-tight">
                Hackathons Hosted
              </div>
            </div>

            {/* Stat 2: Events */}
            <div className="group relative p-3 sm:p-5 rounded-2xl bg-white/90 dark:bg-[#0c1017]/90 backdrop-blur-sm border border-slate-200/90 dark:border-white/[0.08] shadow-xs hover:shadow-lg dark:hover:shadow-black/70 hover:border-orange-200 dark:hover:border-orange-500/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 flex items-center justify-center text-[#ea580c] mb-2 group-hover:scale-110 transition-transform">
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#ea580c] tracking-tight">
                30+
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-bold text-center leading-tight">
                Events Conducted
              </div>
            </div>

            {/* Stat 3: Impressions */}
            <div className="group relative p-3 sm:p-5 rounded-2xl bg-white/90 dark:bg-[#0c1017]/90 backdrop-blur-sm border border-slate-200/90 dark:border-white/[0.08] shadow-xs hover:shadow-lg dark:hover:shadow-black/70 hover:border-sky-200 dark:hover:border-sky-500/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center text-[#0099e6] mb-2 group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0099e6] tracking-tight">
                5M+
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-bold text-center leading-tight">
                Impressions
              </div>
            </div>

            {/* Stat 4: Community Members */}
            <div className="group relative p-3 sm:p-5 rounded-2xl bg-white/90 dark:bg-[#0c1017]/90 backdrop-blur-sm border border-slate-200/90 dark:border-white/[0.08] shadow-xs hover:shadow-lg dark:hover:shadow-black/70 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-2 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-600 tracking-tight">
                50,000+
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-bold text-center leading-tight">
                Community Members
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Partners Marquee ─────────────────────────────────────── */}
      <section className="py-10 border-b border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#05070c] overflow-hidden">
        <div className="text-center mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Trusted by builders from leading organizations worldwide
          </p>
        </div>

        {/* Marquee wrapper — CSS animation scrolls right-to-left */}
        <div className="relative w-full overflow-hidden">
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-8 sm:w-16 lg:w-24 bg-gradient-to-r from-white dark:from-[#05070c] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 sm:w-16 lg:w-24 bg-gradient-to-l from-white dark:from-[#05070c] to-transparent z-10 pointer-events-none" />

          <div className="flex animate-marquee-reverse whitespace-nowrap gap-16 items-center">
            {/* First set */}
            {[
              { name: 'OpenAI', style: 'font-extrabold text-2xl tracking-tighter' },
              { name: 'Trainzex AI', href: 'https://trainzexai.in', style: 'font-extrabold text-2xl tracking-tight text-slate-700 dark:text-slate-300 hover:text-[#0099e6]' },
              { name: 'Google', style: 'font-bold text-2xl tracking-tight' },
              { name: 'Microsoft', style: 'font-semibold text-2xl tracking-tight' },
              { name: 'amazon', style: 'font-extrabold text-2xl lowercase tracking-tight' },
              { name: 'n8n', style: 'font-black text-3xl lowercase tracking-tighter' },
              { name: 'ElevenLabs', style: 'font-bold text-2xl tracking-tight' },
              { name: 'ORACLE', style: 'font-black text-2xl tracking-widest font-mono' },
              { name: 'Meta', style: 'font-extrabold text-2xl tracking-tight' },
              { name: 'GitHub', style: 'font-bold text-2xl tracking-tight' },
              { name: '▲ Vercel', style: 'font-extrabold text-2xl tracking-tight' },
            ].map((partner) => (
              partner.href ? (
                <a
                  key={partner.name}
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 cursor-pointer"
                >
                  <span className={partner.style}>{partner.name}</span>
                </a>
              ) : (
                <div
                  key={partner.name}
                  className="shrink-0 flex items-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 cursor-pointer"
                >
                  <span className={partner.style}>{partner.name}</span>
                </div>
              )
            ))}

            {/* Duplicate set for seamless continuous loop */}
            {[
              { name: 'OpenAI-2', label: 'OpenAI', style: 'font-extrabold text-2xl tracking-tighter' },
              { name: 'Trainzex-2', label: 'Trainzex AI', href: 'https://trainzexai.in', style: 'font-extrabold text-2xl tracking-tight text-slate-700 dark:text-slate-300 hover:text-[#0099e6]' },
              { name: 'Google-2', label: 'Google', style: 'font-bold text-2xl tracking-tight' },
              { name: 'Microsoft-2', label: 'Microsoft', style: 'font-semibold text-2xl tracking-tight' },
              { name: 'amazon-2', label: 'amazon', style: 'font-extrabold text-2xl lowercase tracking-tight' },
              { name: 'n8n-2', label: 'n8n', style: 'font-black text-3xl lowercase tracking-tighter' },
              { name: 'ElevenLabs-2', label: 'ElevenLabs', style: 'font-bold text-2xl tracking-tight' },
              { name: 'ORACLE-2', label: 'ORACLE', style: 'font-black text-2xl tracking-widest font-mono' },
              { name: 'Meta-2', label: 'Meta', style: 'font-extrabold text-2xl tracking-tight' },
              { name: 'GitHub-2', label: 'GitHub', style: 'font-bold text-2xl tracking-tight' },
              { name: '▲ Vercel-2', label: '▲ Vercel', style: 'font-extrabold text-2xl tracking-tight' },
            ].map((partner) => (
              partner.href ? (
                <a
                  key={partner.name}
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 cursor-pointer"
                >
                  <span className={partner.style}>{partner.label}</span>
                </a>
              ) : (
                <div
                  key={partner.name}
                  className="shrink-0 flex items-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 cursor-pointer"
                >
                  <span className={partner.style}>{partner.label}</span>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured & Trending Hackathons (Horizontal Manual Carousel) ─── */}
      <section className="py-16 md:py-24 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-[#ea580c] text-xs font-bold uppercase tracking-wider mb-2">
                <Flame className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Flagship Arenas</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Featured & Trending Hackathons
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Top prize pools, venture-backed sponsors, and global recognition.
              </p>
            </div>

            <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
              <Link
                href="/hackathons"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0099e6] hover:text-[#0284c7] hover:underline"
              >
                <span>View All Events</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollEvents('left')}
                  disabled={!canScrollLeft}
                  aria-label="Previous events"
                  className="w-10 h-10 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:text-[#0099e6] shadow-xs flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollEvents('right')}
                  disabled={!canScrollRight}
                  aria-label="Next events"
                  className="w-10 h-10 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:text-[#0099e6] shadow-xs flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Horizontal Scrollable Track */}
        {events.length > 0 ? (
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 group">
            {/* Floating Left Button on Track */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollEvents('left')}
                aria-label="Scroll left"
                className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 dark:bg-[#0c1017]/95 hover:bg-white dark:hover:bg-[#151c28] text-slate-800 dark:text-slate-200 shadow-xl border border-slate-200/90 dark:border-white/[0.1] items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 backdrop-blur-sm"
              >
                <ChevronLeft className="w-6 h-6 text-slate-700 dark:text-slate-200" />
              </button>
            )}

            {/* Floating Right Button on Track */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollEvents('right')}
                aria-label="Scroll right"
                className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 dark:bg-[#0c1017]/95 hover:bg-white dark:hover:bg-[#151c28] text-slate-800 dark:text-slate-200 shadow-xl border border-slate-200/90 dark:border-white/[0.1] items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 backdrop-blur-sm"
              >
                <ChevronRight className="w-6 h-6 text-slate-700 dark:text-slate-200" />
              </button>
            )}

            {/* Soft Edge Gradient Fades */}
            {canScrollLeft && (
              <div className="absolute inset-y-0 left-4 sm:left-6 lg:left-8 w-12 bg-gradient-to-r from-[#f8fafc] dark:from-[#05070c] to-transparent z-10 pointer-events-none" />
            )}
            {canScrollRight && (
              <div className="absolute inset-y-0 right-4 sm:right-6 lg:right-8 w-12 bg-gradient-to-l from-[#f8fafc] dark:from-[#05070c] to-transparent z-10 pointer-events-none" />
            )}

            <div
              ref={eventsScrollRef}
              className="flex gap-6 items-stretch overflow-x-auto py-4 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
            >
              {events.map((event) => (
                <div key={event.id} className="w-[84vw] max-w-[340px] sm:w-[380px] shrink-0 snap-start">
                  <HackathonCard event={event} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Trophy className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No hackathons currently available</h3>
              <p className="text-xs text-slate-500 mt-1">Check back soon for new competitions.</p>
            </div>
          </div>
        )}
      </section>

      {/* ─── Event Gallery ─────────────────────────────────────────── */}
      <section
        ref={gallerySectionRef}
        className={`relative py-20 md:py-28 overflow-hidden ${galleryVisible ? 'gallery-section-visible' : 'gallery-section-hidden'
          }`}
        style={{
          background:
            'linear-gradient(165deg, #0f172a 0%, #1e293b 40%, #0f172a 70%, #1a1a2e 100%)',
        }}
      >
        {/* Ambient mesh blobs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#0099e6]/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#f97316]/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0284c7]/5 rounded-full blur-[140px] pointer-events-none" />

        {/* Section Header */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-sky-300 text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Highlights</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Moments from Our{' '}
            <span
              style={{
                background:
                  'linear-gradient(135deg, #38bdf8 0%, #0099e6 50%, #f97316 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Events
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-3 max-w-xl mx-auto font-medium">
            From 24-hour hackathons to speaker sessions and bootcamps — here's a
            glimpse of the energy that powers Hacker&apos;s Unity.
          </p>
        </div>

        {/* Row 1 — scrolls left */}
        <div className="relative w-full overflow-hidden mb-5">
          {/* Edge fades */}
          <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#0f172a] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#0f172a] to-transparent z-10 pointer-events-none" />

          <div className="flex animate-gallery-left gap-5 w-max hover:[animation-play-state:paused]">
            {/* Set 1 */}
            {galleryRow1.map((photo, i) => (
              <div
                key={`r1-${i}`}
                className="gallery-card-3d relative w-[320px] sm:w-[400px] h-[220px] sm:h-[270px] rounded-2xl overflow-hidden shrink-0 cursor-pointer group"
              >
                <Image
                  src={photo.src}
                  alt={photo.label}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="400px"
                  quality={80}
                />
                {/* Dark vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
                {/* Caption */}
                <div className="gallery-caption absolute bottom-0 left-0 right-0 px-4 py-3 backdrop-blur-md bg-white/10 border-t border-white/15">
                  <p className="text-white text-xs font-bold tracking-wide">
                    {photo.label}
                  </p>
                </div>
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {galleryRow1.map((photo, i) => (
              <div
                key={`r1-dup-${i}`}
                className="gallery-card-3d relative w-[320px] sm:w-[400px] h-[220px] sm:h-[270px] rounded-2xl overflow-hidden shrink-0 cursor-pointer group"
              >
                <Image
                  src={photo.src}
                  alt={photo.label}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="400px"
                  quality={80}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
                <div className="gallery-caption absolute bottom-0 left-0 right-0 px-4 py-3 backdrop-blur-md bg-white/10 border-t border-white/15">
                  <p className="text-white text-xs font-bold tracking-wide">
                    {photo.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 — scrolls right */}
        <div className="relative w-full overflow-hidden">
          {/* Edge fades */}
          <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#0f172a] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#0f172a] to-transparent z-10 pointer-events-none" />

          <div className="flex animate-gallery-right gap-5 w-max hover:[animation-play-state:paused]">
            {/* Set 1 */}
            {galleryRow2.map((photo, i) => (
              <div
                key={`r2-${i}`}
                className="gallery-card-3d relative w-[280px] sm:w-[360px] h-[200px] sm:h-[240px] rounded-2xl overflow-hidden shrink-0 cursor-pointer group"
              >
                <Image
                  src={photo.src}
                  alt={photo.label}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="360px"
                  quality={80}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
                <div className="gallery-caption absolute bottom-0 left-0 right-0 px-4 py-3 backdrop-blur-md bg-white/10 border-t border-white/15">
                  <p className="text-white text-xs font-bold tracking-wide">
                    {photo.label}
                  </p>
                </div>
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {galleryRow2.map((photo, i) => (
              <div
                key={`r2-dup-${i}`}
                className="gallery-card-3d relative w-[280px] sm:w-[360px] h-[200px] sm:h-[240px] rounded-2xl overflow-hidden shrink-0 cursor-pointer group"
              >
                <Image
                  src={photo.src}
                  alt={photo.label}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="360px"
                  quality={80}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
                <div className="gallery-caption absolute bottom-0 left-0 right-0 px-4 py-3 backdrop-blur-md bg-white/10 border-t border-white/15">
                  <p className="text-white text-xs font-bold tracking-wide">
                    {photo.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Hacker's Unity Matrix ─────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>The Builder Standard</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Why Hackers & Organizers Choose Hacker&apos;s Unity
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Engineered from the ground up for maximum fairness, transparency, and developer speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center text-[#0099e6]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">A Platform to Showcase Your Talent</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Hacker’s Unity gives students the right platform to showcase their skills, ideas, creativity, and technical talent to a wider community and industry.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 flex items-center justify-center text-[#ea580c]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Don’t Just Build Projects. Build Products.</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              We believe hackathons should go beyond temporary projects. Build solutions that solve real-world problems and have the potential to become real products and startups.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Turn Your Idea Into a Startup</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              The journey doesn't end when the hackathon does. We aim to help promising builders take their ideas forward, validate them, and grow them into impactful startups.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Industry Leaders Podcast Section ──────────────────────── */}
      <PodcastSection />

      {/* ─── AI & Blockchain Workshops — Manual Carousel (Responsive) ── */}
      <section className="relative w-full py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="w-full rounded-2xl sm:rounded-3xl bg-[#090d16] border border-slate-800/90 shadow-2xl p-5 sm:p-7 lg:p-10 relative overflow-hidden my-4 lg:my-0">
            {/* Decorative subtle ambient glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center w-full relative z-10">

              {/* ── Left: Text content (5 cols) ── */}
              <div className="lg:col-span-5 space-y-4 sm:space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-500/15 text-violet-300 border border-violet-500/30">
                    Workshops &amp; Events
                  </span>
                  <span className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-500/15 text-orange-300 border border-orange-500/30">
                    In-Person
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15]">
                  We Host{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b4d8] via-[#38bdf8] to-[#f97316]">
                    AI &amp; Blockchain
                  </span>{' '}
                  Workshops Across India
                </h2>

                <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed font-normal">
                  From hands-on Web3 bootcamps to AI/ML deep-dives, we bring developer-focused
                  workshops and sprints to colleges and tech communities nationwide. Our events
                  are designed to turn curious learners into confident builders.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-1">
                  {[
                    { label: 'AI / ML', icon: Bot, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
                    { label: 'Blockchain', icon: Blocks, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                    { label: 'Web3', icon: Globe, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                    { label: 'Cloud & DevOps', icon: Cloud, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
                    { label: 'Open Source', icon: Code2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                    { label: 'Cybersecurity', icon: ShieldCheck, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
                  ].map((topic) => {
                    const Icon = topic.icon;
                    return (
                      <div
                        key={topic.label}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors shadow-sm"
                      >
                        <div className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${topic.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-200 truncate">{topic.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 pt-1 border-t border-slate-800/80 sm:border-t-0 mt-2 sm:mt-0">
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white">30+</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold">Workshops Hosted</p>
                  </div>
                  <div className="w-px h-8 sm:h-10 bg-slate-800" />
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white">10K+</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold">Developers Trained</p>
                  </div>
                  <div className="w-px h-8 sm:h-10 bg-slate-800" />
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white">15+</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold">Cities Reached</p>
                  </div>
                </div>

                {/* Slide indicator dots */}
                <div className="flex items-center gap-2 pt-1 sm:pt-2">
                  {[
                    'JECRC Foundation',
                    'Poornima College',
                  ].map((label, i) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setActiveSlide(i)}
                      className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 cursor-pointer ${activeSlide === i
                          ? 'w-7 sm:w-8 bg-gradient-to-r from-[#0099e6] to-[#f97316]'
                          : 'w-2 sm:w-2.5 bg-slate-700 hover:bg-slate-600'
                        }`}
                      aria-label={label}
                    />
                  ))}
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium ml-2">
                    {activeSlide === 0 ? 'JECRC Foundation' : 'Poornima College of Engineering'}
                  </span>
                </div>
              </div>

              {/* ── Right: Slide Gallery (7 cols - responsive image focus) ── */}
              <div
                className="lg:col-span-7 relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 h-[260px] xs:h-[300px] sm:h-[380px] lg:h-[520px] touch-pan-y group"
                onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  if (touchStartX === null) return;
                  const diff = touchStartX - e.changedTouches[0].clientX;
                  if (diff > 40) {
                    setActiveSlide(1);
                  } else if (diff < -40) {
                    setActiveSlide(0);
                  }
                  setTouchStartX(null);
                }}
              >
                {/* Ambient glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-violet-500/15 to-orange-500/20 rounded-3xl blur-2xl pointer-events-none" style={{ zIndex: -1 }} />

                {/* Prev / Next buttons */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlide((prev) => (prev === 0 ? 1 : 0));
                  }}
                  aria-label="Previous event photo"
                  className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all shadow-lg cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlide((prev) => (prev === 1 ? 0 : 1));
                  }}
                  aria-label="Next event photo"
                  className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all shadow-lg cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Slide track — slides horizontally */}
                <div
                  className="flex h-full absolute inset-0 transition-transform duration-500 ease-out"
                  style={{
                    width: '200%',
                    transform: `translateX(-${activeSlide * 50}%)`,
                  }}
                >
                  {/* Slide 0: workshopPhoto (6.jpg) */}
                  <div className="relative w-1/2 h-full flex-shrink-0">
                    <Image
                      src={workshopPhoto}
                      alt="AI & Blockchain Workshop — JECRC Foundation"
                      className="w-full h-full object-cover"
                      fill
                      placeholder="blur"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col justify-end p-3.5 sm:p-6">
                      <span className="inline-block self-start px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-sm mb-1 sm:mb-2">
                        Hands-on Sprint
                      </span>
                      <p className="text-white text-xs sm:text-base lg:text-lg font-bold leading-tight sm:leading-snug">Build on Stellar Bootcamp — JECRC Foundation</p>
                      <p className="text-slate-300 text-[10px] sm:text-xs lg:text-sm font-medium">Web3 &amp; Blockchain hands-on developer workshop</p>
                    </div>
                  </div>

                  {/* Slide 1: stellarHU (StellarHU.jpg) */}
                  <div className="relative w-1/2 h-full flex-shrink-0">
                    <Image
                      src={stellarHU}
                      alt="Stellar Bootcamp — Poornima College"
                      className="w-full h-full object-cover"
                      fill
                      placeholder="blur"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col justify-end p-3.5 sm:p-6">
                      <span className="inline-block self-start px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30 backdrop-blur-sm mb-1 sm:mb-2">
                        Featured Event
                      </span>
                      <p className="text-white text-xs sm:text-base lg:text-lg font-bold leading-tight sm:leading-snug">Build on Stellar Bootcamp — PCE</p>
                      <p className="text-slate-300 text-[10px] sm:text-xs lg:text-sm font-medium">Poornima College of Engineering</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─── Host Hackathon CTA ───────────────────────────────────── */}
      <section className="pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="p-6 sm:p-10 md:p-12 rounded-3xl bg-gradient-to-r from-[#0099e6] via-[#0284c7] to-[#f97316] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-md">
              ORGANIZER SUITE
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Hosting a Hackathon or Developer Sprint?
            </h3>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed font-medium">
              Launch registration in under 5 minutes. Get access to our 50,000+ builder network, automated submission review sandboxes, and verified judge scorecards.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/host"
              className="px-6 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs text-center shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              Host Hackathon Free
            </Link>
            <Link
              href="/hackathons"
              className="px-6 py-3 rounded-xl bg-black/20 text-white text-xs font-bold text-center hover:bg-black/30 border border-white/20 transition-colors whitespace-nowrap"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Join Hacker's Unity Team CTA ──────────────────────────── */}
      <JoinTeamSection />

      {/* ─── Industry Leader Testimonials (H2S Style) ─────────────── */}
      <TestimonialsSection />

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
