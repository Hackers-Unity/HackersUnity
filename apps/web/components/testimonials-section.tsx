'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Quote, Sparkles } from 'lucide-react';
import { FaAmazon } from 'react-icons/fa6';

export interface TestimonialItem {
  id: string;
  name: string;
  designation: string;
  company: string;
  avatar: string;
  quote: string;
  companyLogo: 'microsoft' | 'amazon' | 'covlant' | 'tiktok' | 'tcs';
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'krishna-tirupati',
    name: 'Krishna Kishor Tirupati',
    designation: 'Senior Software Engineer at Microsoft',
    company: 'Microsoft',
    avatar: '/testimonials/krishna-tirupati.jpeg',
    quote:
      "Mentoring student developers on Hacker's Unity has been an incredible experience. The enthusiasm, technical depth, and velocity with which teams turn ideas into working prototypes reflect the caliber of modern builders.",
    companyLogo: 'microsoft',
  },
  {
    id: 'mihir-shelar',
    name: 'MihiR Shelar',
    designation: 'Technical Program Manager III at Amazon',
    company: 'Amazon',
    avatar: '/testimonials/mihir-shelar.jpeg',
    quote:
      "Hacker's Unity provides an outstanding bridge between classroom concepts and hyperscale production engineering. The focus on real-world execution prepares students for top-tier industry roles.",
    companyLogo: 'amazon',
  },
  {
    id: 'dhanunjay-mamidi',
    name: 'Dhanunjay Mamidi',
    designation: 'Co-Founder & CDO @Covlant AI Inc',
    company: 'Covlant AI Inc',
    avatar: '/testimonials/dhanunjay-mamidi.jpeg',
    quote:
      "The talent and rapid iteration pace we witnessed during Hacker's Unity challenges are remarkable. It is an exceptional proving ground for the next wave of AI and deep-tech founders.",
    companyLogo: 'covlant',
  },
  {
    id: 'naga-pothuraju',
    name: 'Naga D Pothuraju',
    designation: 'Senior Engineering Manager at TikTok',
    company: 'TikTok',
    avatar: '/testimonials/naga-pothuraju.png',
    quote:
      'Seeing participants tackle distributed systems and high-throughput challenges with such dedication was truly inspiring. Hacker’s Unity creates high-stakes, collaborative arenas that nurture top talent.',
    companyLogo: 'tiktok',
  },
  {
    id: 'abhijit-roy',
    name: 'Abhijit Roy',
    designation: 'Solution Architect at Tata Consultancy Services',
    company: 'Tata Consultancy Services',
    avatar: '/testimonials/abhijit-roy.jpeg',
    quote:
      'Guiding teams through solution architecture and enterprise scalability on Hacker’s Unity has been immensely rewarding. The platform cultivates structured problem solving and technical excellence.',
    companyLogo: 'tcs',
  },
];

function CompanyLogo({ type }: { type: TestimonialItem['companyLogo'] }) {
  switch (type) {
    case 'microsoft':
      return (
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
            <span className="bg-[#f25022] rounded-[0.5px] w-[7px] h-[7px]" />
            <span className="bg-[#7fba00] rounded-[0.5px] w-[7px] h-[7px]" />
            <span className="bg-[#00a4ef] rounded-[0.5px] w-[7px] h-[7px]" />
            <span className="bg-[#ffb900] rounded-[0.5px] w-[7px] h-[7px]" />
          </div>
          <span className="text-base font-semibold text-slate-800 dark:text-slate-200 tracking-tight font-sans">
            Microsoft
          </span>
        </div>
      );
    case 'amazon':
      return (
        <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-200">
          <FaAmazon className="w-5 h-5 text-slate-900 dark:text-slate-200" />
          <span className="text-base font-black tracking-tight">amazon</span>
        </div>
      );
    case 'covlant':
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md overflow-hidden relative border border-slate-200 dark:border-white/[0.1] shrink-0">
            <Image
              src="/testimonials/covlant-logo.jpeg"
              alt="Covlant AI"
              fill
              className="object-cover"
            />
          </div>
          <span className="text-sm font-black text-slate-900 dark:text-slate-200 tracking-tight">
            Covlant AI
          </span>
        </div>
      );
    case 'tiktok':
      return (
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 fill-slate-900 dark:fill-slate-200" viewBox="0 0 24 24">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.32V9.32a8.32 8.32 0 0 0 3.91 1.25V7.12a4.88 4.88 0 0 1 0-.43z" />
          </svg>
          <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            TikTok
          </span>
        </div>
      );
    case 'tcs':
      return (
        <div className="flex items-center gap-2">
          <div className="px-1.5 py-0.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[11px] tracking-wider">
            TCS
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
            Tata Consultancy Services
          </span>
        </div>
      );
    default:
      return null;
  }
}

export function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 15);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 15);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    const t1 = setTimeout(checkScroll, 100);
    const t2 = setTimeout(checkScroll, 500);
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="relative py-16 md:py-24 w-full overflow-hidden bg-gradient-to-b from-[#f8fafc]/60 via-white to-[#f8fafc]/40 dark:from-[#05070c] dark:via-[#080b11] dark:to-[#05070c] border-t border-slate-100 dark:border-white/[0.08]">
      {/* Ambient background glows (matching H2S subtle bubbles) */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 w-72 h-72 bg-sky-100/50 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-8 w-80 h-80 bg-blue-100/40 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-[#0099e6] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" />
            <span>Industry Endorsements</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Backed by Builders, <span className="text-gradient-brand">Trusted by Leaders</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 font-medium">
            Real perspectives from senior engineering leaders, architects, and founders actively mentoring and backing talent on Hacker&apos;s Unity.
          </p>
        </div>

        {/* Carousel Container with Left/Right Buttons */}
        <div className="relative group">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous testimonial"
            className="hidden sm:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white dark:bg-[#0c1017] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-[#0099e6] shadow-xl border border-slate-200/80 dark:border-white/[0.08] items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Next testimonial"
            className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white dark:bg-[#0c1017] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-[#0099e6] shadow-xl border border-slate-200/80 dark:border-white/[0.08] items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Cards Track */}
          <div
            ref={scrollRef}
            className="flex items-stretch gap-6 overflow-x-auto py-4 px-2 sm:px-4 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
          >
            {TESTIMONIALS.map((item) => (
              <div
                key={item.id}
                className="w-[85vw] max-w-[340px] sm:w-[370px] md:w-[380px] shrink-0 snap-start flex flex-col"
              >
                <div className="bg-white dark:bg-[#0c1017] rounded-3xl p-5 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-black/70 border border-slate-100 dark:border-white/[0.08] hover:border-slate-200 dark:hover:border-white/[0.16] hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full min-h-[300px]">
                  {/* Top: Avatar + Name + Designation */}
                  <div>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-slate-100 dark:border-white/[0.1] shadow-xs relative">
                        <Image
                          src={item.avatar}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-tight truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium italic mt-1 leading-snug line-clamp-2">
                          {item.designation}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Quote */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {item.quote}
                    </p>
                  </div>

                  {/* Bottom: Company Logo */}
                  <div className="pt-6 mt-6 border-t border-slate-100/90 dark:border-white/[0.08] flex items-center justify-between">
                    <CompanyLogo type={item.companyLogo} />
                    <Quote className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
