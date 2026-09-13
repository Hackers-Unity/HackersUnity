'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play,
  X,
  ExternalLink,
  Sparkles,
  Radio,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { FaAmazon, FaMicrosoft, FaYoutube } from 'react-icons/fa6';
import { SiIeee } from 'react-icons/si';

export interface PodcastEpisode {
  id: string;
  name: string;
  designation: string;
  company: string;
  companyType: 'amazon' | 'microsoft' | 'tcs' | 'macys' | 'ieee' | 'mphasis' | 'ssc' | 'ai';
  image: string;
  youtubeUrl: string;
  videoId: string;
  title: string;
  tagline: string;
  tags: string[];
}

const PODCAST_EPISODES: PodcastEpisode[] = [
  {
    id: 'ep-amazon',
    name: 'Mihir Shelar',
    designation: 'Technical Manager',
    company: 'Amazon',
    companyType: 'amazon',
    image: '/podcasts/mihirshelar.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=-A9QjJcd32k&t=315s',
    videoId: '-A9QjJcd32k',
    title: 'Amazon Technical Manager Reveals Industry Secrets',
    tagline: 'Building technology at hyperscale, engineering leadership, and high-impact career growth.',
    tags: ['Cloud & Scale', 'Leadership', 'Amazon Culture'],
  },
  {
    id: 'ep-microsoft',
    name: 'Krishna Kishor Tirupati',
    designation: 'Senior Software Engineer',
    company: 'Microsoft',
    companyType: 'microsoft',
    image: '/podcasts/kirshna.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=cS_8kLIzpHk',
    videoId: 'cS_8kLIzpHk',
    title: 'From Campus to Microsoft: Career Journey & Tech Growth',
    tagline: 'Placement strategies, mastering software engineering craft, and skills that matter in big tech.',
    tags: ['Big Tech', 'Software Engineering', 'Campus Placements'],
  },
  {
    id: 'ep-tcs',
    name: 'Abhijit Roy',
    designation: 'Solution Architect',
    company: 'Tata Consultancy Services',
    companyType: 'tcs',
    image: '/podcasts/abhijitroy.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=pdqg4f1ijYM',
    videoId: 'pdqg4f1ijYM',
    title: 'AI, Innovation & The Future of Technology',
    tagline: 'Artificial Intelligence, cloud transformation, and real-world tech innovation trends.',
    tags: ['Artificial Intelligence', 'Cloud', 'Innovation'],
  },
  {
    id: 'ep-macys',
    name: 'Ankur Bhatnagar',
    designation: 'Staff Software Engineer',
    company: "Macy's Tech (Ex-Accenture)",
    companyType: 'macys',
    image: '/podcasts/ankur.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=3eFj4r4x9AI',
    videoId: '3eFj4r4x9AI',
    title: 'The Truth About Becoming a Staff Software Engineer',
    tagline: 'Demystifying the staff engineer path, technical leadership, and engineering excellence.',
    tags: ['Staff Engineering', 'Tech Leadership', 'Career Growth'],
  },
  {
    id: 'ep-mphasis',
    name: 'Eshaan Jain',
    designation: 'Senior Product Manager',
    company: 'Mphasis Silverline (Ex-Amazon)',
    companyType: 'mphasis',
    image: '/podcasts/eshaan.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=dMZYpdd7XHI',
    videoId: 'dMZYpdd7XHI',
    title: 'No One Talks About This! Product Management Secrets',
    tagline: 'Realities of product management, building with engineering teams, and high-velocity shipping.',
    tags: ['Product Management', 'Ex-Amazon', 'Product Strategy'],
  },
  {
    id: 'ep-ssc',
    name: 'Surya Rao R',
    designation: 'Lead Software Engineer',
    company: 'SS&C Technologies',
    companyType: 'ssc',
    image: '/podcasts/surya_roy.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=KMftFbyMrJc',
    videoId: 'KMftFbyMrJc',
    title: 'Engineering Leadership & Scaling High-Impact Systems',
    tagline: 'Transitioning from contributor to leader, designing resilient architectures, and mentoring.',
    tags: ['Engineering Leadership', 'System Design', 'FinTech'],
  },
  {
    id: 'ep-ieee',
    name: 'Ratna Kumar Bonagiri',
    designation: 'Staff Engineer & IEEE Senior Leader',
    company: "Macy's / IEEE",
    companyType: 'ieee',
    image: '/podcasts/ratnakumar.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=Ka_9ZWvTJjU',
    videoId: 'Ka_9ZWvTJjU',
    title: 'Innovation, Leadership & Community-Driven Tech Growth',
    tagline: 'How community leadership and continuous learning build resilience and long-term career success.',
    tags: ['IEEE Leader', 'Community', 'Tech Innovation'],
  },
  {
    id: 'ep-ai',
    name: 'Ather Husain',
    designation: 'Principal Engineer & Tech Lead',
    company: 'Enterprise Cloud & AI',
    companyType: 'ai',
    image: '/podcasts/arther.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=jm_4cse3wsE',
    videoId: 'jm_4cse3wsE',
    title: 'Agent RAG, LLMs & What Every AI Engineer Must Understand',
    tagline: 'Agentic workflows, RAG architectures, enterprise microservices, and modern generative AI.',
    tags: ['Agentic AI', 'RAG & LLMs', 'Enterprise Cloud'],
  },
];

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
        <span className="text-rose-600 dark:text-rose-400 font-black text-xs leading-none">★</span>
        <span>{name}</span>
      </span>
    );
  }

  if (type === 'mphasis') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 font-bold text-[11px]">
        <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400" />
        <span>{name}</span>
      </span>
    );
  }

  if (type === 'ssc') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
        <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
        <span>{name}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
      <Sparkles className="w-3 h-3 text-[#0099e6] dark:text-[#38bdf8]" />
      <span>{name}</span>
    </span>
  );
}

export function PodcastSection() {
  const [activeVideo, setActiveVideo] = useState<PodcastEpisode | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 380;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full overflow-hidden">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Beyond The Mic • Industry Insider</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Learn from Industry Leaders & Tech Insiders
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            Real-world career journeys, engineering leadership, and insider secrets from senior
            engineers and leaders at <strong className="text-slate-900 dark:text-white">Amazon, Microsoft, Macy&apos;s, TCS, and IEEE</strong>.
          </p>
        </div>

        {/* Carousel Controls & View All Podcasts Link */}
        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 flex-wrap">
          <Link
            href="/podcasts"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6] dark:hover:border-[#0099e6] hover:bg-sky-50/60 dark:hover:bg-sky-950/30 text-slate-800 dark:text-slate-200 hover:text-[#0099e6] text-xs font-bold shadow-xs transition-all duration-200 group"
          >
            <span>View All Podcasts</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 text-[#0099e6] transition-transform" />
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Previous podcast"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6] dark:hover:border-[#0099e6]/50 hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:text-[#0099e6] shadow-xs flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Next podcast"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6] dark:hover:border-[#0099e6]/50 hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:text-[#0099e6] shadow-xs flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Single Lane Horizontal Carousel (No Wrap) ──────────── */}
      <div className="relative -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-6 overflow-x-auto pb-6 pt-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
        >
          {PODCAST_EPISODES.map((ep, idx) => (
            <div
              key={ep.id}
              className="w-[310px] sm:w-[350px] shrink-0 snap-start group rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] hover:border-[#0099e6] dark:hover:border-[#0099e6]/50 shadow-xs hover:shadow-2xl hover:shadow-[#0099e6]/10 transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-2"
              style={{
                animationDelay: `${idx * 100}ms`,
              }}
            >
              {/* 16:9 Full YouTube Thumbnail (Fully visible with zero cutoffs) */}
              <div
                onClick={() => setActiveVideo(ep)}
                className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer"
              >
                <Image
                  src={ep.image}
                  alt={ep.name}
                  fill
                  sizes="350px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Subtle Hover Play Overlay */}
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-14 h-14 rounded-full bg-red-500/40 group-hover:animate-ping duration-1000" />
                    <div className="relative w-12 h-12 rounded-full bg-red-600 group-hover:bg-red-500 text-white flex items-center justify-center shadow-xl group-hover:scale-115 transition-all duration-300">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  {/* Company Logo / Badge */}
                  <CompanyBadge type={ep.companyType} name={ep.company} />

                  {/* Speaker Name & Designation */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-[#0099e6] dark:group-hover:text-[#38bdf8] transition-colors">
                      {ep.name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {ep.designation}
                    </p>
                  </div>

                  {/* Episode Topic */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                    {ep.tagline}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {ep.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-white/[0.06] rounded text-[10px] font-semibold text-slate-600 dark:text-slate-300 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveVideo(ep)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0099e6] dark:text-[#38bdf8] hover:text-[#0077b6] cursor-pointer group/btn"
                  >
                    <Play className="w-3 h-3 fill-current group-hover/btn:scale-110 transition-transform" />
                    <span>Play Episode</span>
                  </button>

                  <a
                    href={ep.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Open on YouTube"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Interactive Video Player Modal ────────────────────── */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 truncate">
                <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-700">
                  <Image
                    src={activeVideo.image}
                    alt={activeVideo.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div className="truncate">
                  <h3 className="text-sm font-bold text-white truncate">
                    {activeVideo.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {activeVideo.name} • {activeVideo.designation} at {activeVideo.company}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeVideo.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FaYoutube className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveVideo(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded YouTube Player */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.videoId}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>

            {/* Modal Footer Info */}
            <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="text-slate-300 font-medium">
                  {activeVideo.tagline}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeVideo.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px] font-mono"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
