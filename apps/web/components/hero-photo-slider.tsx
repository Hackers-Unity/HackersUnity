'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';

export interface HeroPhoto {
  url: string;
}

const HERO_PHOTOS: HeroPhoto[] = [
  {
    url: 'https://res.cloudinary.com/p6qljeni/image/upload/f_auto,q_auto,w_1000/v1793192595/hackers-unity/gallery-moments/StellarHU2.jpg',
  },
  {
    url: 'https://res.cloudinary.com/p6qljeni/image/upload/f_auto,q_auto,w_1000/v1793192220/hackers-unity/gallery-moments/StellarHU.jpg',
  },
  {
    url: 'https://res.cloudinary.com/p6qljeni/image/upload/f_auto,q_auto,w_1000/v1793191985/hackers-unity/gallery-moments/CodeWars5.jpg',
  },
  {
    url: 'https://res.cloudinary.com/p6qljeni/image/upload/f_auto,q_auto,w_1000/v1793191867/hackers-unity/gallery-moments/hackstorm_hall.jpg',
  },
];

export function HeroPhotoSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [hoverSide, setHoverSide] = useState<'left' | 'right'>('right');

  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Auto-advance slides continuously on loop every 3.8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_PHOTOS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? HERO_PHOTOS.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % HERO_PHOTOS.length);
  };

  // Track mouse coordinates & decide left/right hover state (Devfolio style)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    setIsHovering(true);
    setHoverSide(x < rect.width / 2 ? 'left' : 'right');
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // Click on the left half goes prev; click on the right half goes next
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      goToPrev();
    } else {
      goToNext();
    }
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    touchStartXRef.current = null;
  };

  return (
    <div
      className="relative w-full max-w-md sm:max-w-lg lg:max-w-[490px] xl:max-w-[530px] mx-auto select-none group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Devfolio-Style Playful Doodles / Accents ── */}
      {/* Top-Left Blue Ribbon Arc */}
      <svg
        className="absolute -top-7 -left-7 w-20 h-20 sm:w-24 sm:h-24 text-[#0099e6] pointer-events-none z-10"
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M20 80 C 20 32, 45 18, 88 18"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>

      {/* Bottom-Right (4th Corner) Matching Orange Ribbon Arc */}
      <svg
        className="absolute -bottom-7 -right-7 w-20 h-20 sm:w-24 sm:h-24 text-[#ea580c] rotate-180 pointer-events-none z-10"
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M20 80 C 20 32, 45 18, 88 18"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>

      {/* Bottom-Left Yellow/Gold Crown Doodle */}
      <svg
        className="absolute -bottom-7 -left-6 w-16 h-16 sm:w-18 sm:h-18 text-amber-400 pointer-events-none z-10"
        viewBox="0 0 80 80"
        fill="none"
      >
        <path
          d="M18 52 L 26 26 L 40 44 L 54 22 L 62 52 Z"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx="26" cy="18" r="4" fill="currentColor" />
        <circle cx="54" cy="14" r="4" fill="currentColor" />
      </svg>

      {/* ── Main Sliding Card (Taller, Prominent Size, Clean Framing) ── */}
      <div
        ref={cardRef}
        onClick={handleCardClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative rounded-[32px] sm:rounded-[36px] overflow-hidden bg-slate-100 dark:bg-slate-900 border-2 border-slate-200/90 dark:border-white/[0.12] shadow-2xl shadow-sky-500/10 dark:shadow-black/70 cursor-none"
      >
        {/* Horizontal Track of Sliding Images */}
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {HERO_PHOTOS.map((photo, index) => (
            <div
              key={photo.url}
              className="w-full shrink-0 relative h-[380px] sm:h-[440px] lg:h-[470px] xl:h-[490px] bg-slate-100 dark:bg-slate-950 overflow-hidden"
            >
              {/* Direct CDN Image for 100% reliable loading without proxy failures */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt=""
                loading={index === 0 ? 'eager' : 'lazy'}
                className="w-full h-full object-cover object-center transform transition-transform duration-1000 group-hover:scale-105 select-none pointer-events-none"
              />
            </div>
          ))}
        </div>

        {/* ── Devfolio-Style Dynamic Cursor Follower Arrow ── */}
        <div
          className={`pointer-events-none absolute z-30 flex items-center justify-center w-12 h-12 rounded-full border-2 border-white/70 shadow-2xl transition-transform duration-75 ease-out ${
            isHovering ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          } ${
            hoverSide === 'left'
              ? 'bg-[#0099e6] shadow-[#0099e6]/50'
              : 'bg-gradient-to-r from-[#ea580c] to-[#f97316] shadow-orange-500/50'
          }`}
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {hoverSide === 'left' ? (
            <ChevronLeft className="w-6 h-6 text-white stroke-[3] -ml-0.5" />
          ) : (
            <ChevronRight className="w-6 h-6 text-white stroke-[3] -mr-0.5" />
          )}
        </div>

        {/* ── Subtle Slide Progress Indicators at Bottom ── */}
        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
          {HERO_PHOTOS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-6 bg-white shadow-xs'
                  : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Floating Devfolio-style Stat Pill Overlapping the Card ── */}
      <div className="absolute -top-3.5 sm:-top-4 -right-2 sm:-right-4 px-4 sm:px-4.5 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-teal-500/30 border-2 border-white dark:border-[#0c1017] flex items-center gap-1.5 z-20 pointer-events-none transform hover:scale-105 transition-transform">
        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>50,000+ Builders</span>
      </div>
    </div>
  );
}
