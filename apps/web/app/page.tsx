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
} from 'lucide-react';
import { HackathonCard } from '@/components/hackathon-card';
import { usePublishedEvents } from '@/lib/hooks/use-events';

import { AuthModal } from '@/components/auth-modal';
import { HeroSearch } from '@/components/hero-search';

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

export default function HomePage() {
  const { events, loading } = usePublishedEvents();
  const [authOpen, setAuthOpen] = useState(false);

  // Gallery scroll-reveal via Intersection Observer
  const gallerySectionRef = useRef<HTMLElement>(null);
  const [galleryVisible, setGalleryVisible] = useState(false);

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
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 bg-grid-pattern">
        {/* Soft Ambient Brand Mesh */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0099e6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold mb-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0099e6] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0099e6]" />
            </span>
            <span className="font-mono uppercase tracking-wider text-xs">
              <strong className="text-[#0099e6]">15+ LIVE HACKATHONS</strong> • <strong className="text-[#ea580c]">$350K PRIZE POOLS</strong>
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight max-w-5xl leading-[1.1] mb-6">
            Where Student Talent Finds a {' '}
            <span className="text-gradient-brand">Platform & Ideas</span> Become Impact.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed mb-8 font-medium">
            Discover premier hackathons across AI Agents, Web3, and DeepTech. Match with world-class teammates, build high-impact prototypes, and win verified payouts on Hacker&apos;s Unity.
          </p>

          {/* Interactive Hero Search with Live Autocomplete & Redirection */}
          <HeroSearch />



          {/* Metrics Ticker */}
          <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5 pt-8 border-t border-slate-200/80">
            {/* Stat 1: Hackathons */}
            <div className="group relative p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mb-2 group-hover:scale-110 transition-transform">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                10+
              </div>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-bold whitespace-nowrap">
                Hackathons Hosted
              </div>
            </div>

            {/* Stat 2: Events */}
            <div className="group relative p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-orange-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ea580c] mb-2 group-hover:scale-110 transition-transform">
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#ea580c] tracking-tight whitespace-nowrap">
                30+
              </div>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-bold whitespace-nowrap">
                Events Conducted
              </div>
            </div>

            {/* Stat 3: Impressions */}
            <div className="group relative p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-sky-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0099e6] mb-2 group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0099e6] tracking-tight whitespace-nowrap">
                5M+
              </div>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-bold whitespace-nowrap">
                Impressions
              </div>
            </div>

            {/* Stat 4: Community Members */}
            <div className="group relative p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-600 tracking-tight whitespace-nowrap">
                50,000+
              </div>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-bold whitespace-nowrap">
                Community Members
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Partners Marquee ─────────────────────────────────────── */}
      <section className="py-10 border-b border-slate-200/80 bg-white overflow-hidden">
        <div className="text-center mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Trusted by builders from leading organizations worldwide
          </p>
        </div>

        {/* Marquee wrapper — CSS animation scrolls right-to-left */}
        <div className="relative w-full overflow-hidden">
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div className="flex animate-marquee-reverse whitespace-nowrap gap-16 items-center">
            {/* First set */}
            {[
              { name: 'OpenAI', style: 'font-extrabold text-2xl tracking-tighter' },
              { name: 'Trainzex AI', href: 'https://trainzexai.in', style: 'font-extrabold text-2xl tracking-tight text-slate-700 hover:text-[#0099e6]' },
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
                  className="shrink-0 flex items-center text-slate-400 hover:text-slate-900 transition-colors px-3 cursor-pointer"
                >
                  <span className={partner.style}>{partner.name}</span>
                </a>
              ) : (
                <div
                  key={partner.name}
                  className="shrink-0 flex items-center text-slate-400 hover:text-slate-900 transition-colors px-3 cursor-pointer"
                >
                  <span className={partner.style}>{partner.name}</span>
                </div>
              )
            ))}

            {/* Duplicate set for seamless continuous loop */}
            {[
              { name: 'OpenAI-2', label: 'OpenAI', style: 'font-extrabold text-2xl tracking-tighter' },
              { name: 'Trainzex-2', label: 'Trainzex AI', href: 'https://trainzexai.in', style: 'font-extrabold text-2xl tracking-tight text-slate-700 hover:text-[#0099e6]' },
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
                  className="shrink-0 flex items-center text-slate-400 hover:text-slate-900 transition-colors px-3 cursor-pointer"
                >
                  <span className={partner.style}>{partner.label}</span>
                </a>
              ) : (
                <div
                  key={partner.name}
                  className="shrink-0 flex items-center text-slate-400 hover:text-slate-900 transition-colors px-3 cursor-pointer"
                >
                  <span className={partner.style}>{partner.label}</span>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured & Trending Hackathons (Single-Row Continuous Marquee) ─── */}
      <section className="py-16 md:py-24 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#ea580c] text-xs font-bold uppercase tracking-wider mb-2">
                <Flame className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Flagship Arenas</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Featured & Trending Hackathons
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                Top prize pools, venture-backed sponsors, and global recognition.
              </p>
            </div>

            <Link
              href="/hackathons"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0099e6] hover:text-[#0284c7] hover:underline"
            >
              <span>View All Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Continuous Horizontal Moving Track */}
        {events.length > 0 ? (
          <div className="relative w-full overflow-hidden py-4">
            {/* Soft Edge Gradient Fades */}
            <div className="absolute inset-y-0 left-0 w-8 sm:w-24 bg-gradient-to-r from-[#f8fafc] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 sm:w-24 bg-gradient-to-l from-[#f8fafc] to-transparent z-10 pointer-events-none" />

            <div className="flex animate-events-marquee gap-6 items-stretch w-max hover:[animation-play-state:paused]">
              {/* Set 1 */}
              {events.map((event) => (
                <div key={event.id} className="w-[340px] sm:w-[380px] shrink-0">
                  <HackathonCard event={event} />
                </div>
              ))}

              {/* Set 2 (Duplicate for seamless infinite right-to-left loop) */}
              {events.map((event) => (
                <div key={`${event.id}-dup`} className="w-[340px] sm:w-[380px] shrink-0">
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
        className={`relative py-20 md:py-28 overflow-hidden ${
          galleryVisible ? 'gallery-section-visible' : 'gallery-section-hidden'
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>The Builder Standard</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Why Hackers & Organizers Choose Hacker&apos;s Unity
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
            Engineered from the ground up for maximum fairness, transparency, and developer speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0099e6]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">A Platform to Showcase Your Talent</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Hacker’s Unity gives students the right platform to showcase their skills, ideas, creativity, and technical talent to a wider community and industry.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ea580c]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Don’t Just Build Projects. Build Products.</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              We believe hackathons should go beyond temporary projects. Build solutions that solve real-world problems and have the potential to become real products and startups.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Turn Your Idea Into a Startup</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
             The journey doesn't end when the hackathon does. We aim to help promising builders take their ideas forward, validate them, and grow them into impactful startups.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Host Hackathon CTA ───────────────────────────────────── */}
      <section className="pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0099e6] via-[#0284c7] to-[#f97316] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
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

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
