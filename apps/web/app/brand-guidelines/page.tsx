import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Brand Guidelines — Hacker\'s Unity',
  description: 'Official brand guidelines for Hacker\'s Unity. Logo usage, clearspace rules, color palette, and approved variants.',
};

export default function BrandGuidelinesPage() {
  return (
    <main className="min-h-screen bg-[#d6d0c4]">
      {/* Back Navigation */}
      <div className="max-w-[960px] mx-auto px-4 pt-6 pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#666] hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Platform
        </Link>
      </div>

      {/* ═══════════════════════════════════════════════════
          PAGE 1 — LOGO CLEARSPACE & USAGE
         ═══════════════════════════════════════════════════ */}
      <div className="max-w-[960px] mx-auto px-4 pb-8">
        <div className="bg-[#f5f0e8] shadow-xl">
          {/* Section Header */}
          <div className="px-10 sm:px-16 pt-12 pb-2">
            <h1 className="text-xs font-mono uppercase tracking-[0.25em]">
              <span className="font-black text-black">Logo</span>
              <span className="font-normal text-[#888]">Clearspace &amp; Usage</span>
            </h1>
          </div>

          {/* Rules */}
          <div className="px-10 sm:px-16 py-8 space-y-8">
            <div>
              <h2 className="text-[11px] font-mono font-black uppercase tracking-[0.15em] text-black mb-2">
                01 — Placement
              </h2>
              <p className="text-[13px] font-mono text-[#333] leading-relaxed max-w-[680px]">
                The Hacker&apos;s Unity mark is always placed dead-center within its frame or canvas. It is never anchored to a corner or edge, and never crowded by other elements.
              </p>
            </div>

            <div>
              <h2 className="text-[11px] font-mono font-black uppercase tracking-[0.15em] text-black mb-2">
                02 — Clearspace
              </h2>
              <p className="text-[13px] font-mono text-[#333] leading-relaxed max-w-[680px]">
                A minimum clearspace of 5–6px is maintained on every side of the logo at small scale. Nothing – text, imagery, or edge – may enter this zone.
              </p>
            </div>

            <div>
              <h2 className="text-[11px] font-mono font-black uppercase tracking-[0.15em] text-black mb-2">
                03 — Approved Variants
              </h2>
              <p className="text-[13px] font-mono text-[#333] leading-relaxed max-w-[680px]">
                Only two variants exist: the black mark for light surfaces, and the white/cream mark for dark surfaces. There is no color, gradient, or monochrome-alt version.
              </p>
            </div>

            <div>
              <h2 className="text-[11px] font-mono font-black uppercase tracking-[0.15em] text-black mb-2">
                04 — No Modification
              </h2>
              <p className="text-[13px] font-mono text-[#333] leading-relaxed max-w-[680px]">
                Do not recolor, distort, stretch, rotate, outline, add effects to, or otherwise alter the mark in any way. Scale proportionally only.
              </p>
            </div>
          </div>

          {/* ── Black Variant — Light Surface ────────── */}
          <div className="bg-[#eae4d8] relative">
            <div className="flex items-center justify-center py-16 sm:py-20">
              {/* Left clearspace marker */}
              <div className="absolute left-[calc(50%-100px)] sm:left-[calc(50%-120px)] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-[#999] -rotate-90 whitespace-nowrap">5–6px</span>
              </div>
              {/* Logo */}
              <div className="relative">
                <Image
                  src="/logo-black.png"
                  alt="Hacker's Unity — Black Variant"
                  width={180}
                  height={180}
                  className="w-36 sm:w-44 h-auto object-contain"
                  unoptimized
                />
                {/* Clearspace visual border (dashed) */}
                <div className="absolute -inset-4 sm:-inset-5 border border-dashed border-[#bbb]/50 rounded-sm pointer-events-none" />
              </div>
              {/* Right clearspace marker */}
              <div className="absolute right-[calc(50%-100px)] sm:right-[calc(50%-120px)] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-[#999] rotate-90 whitespace-nowrap">5–6px</span>
              </div>
            </div>
            <div className="px-10 sm:px-16 pb-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#888]">
                Black Variant — On Light Surfaces
              </p>
            </div>
          </div>

          {/* ── White Variant — Dark Surface ────────── */}
          <div className="bg-[#111111] relative">
            <div className="flex items-center justify-center py-16 sm:py-20">
              {/* Left clearspace marker */}
              <div className="absolute left-[calc(50%-100px)] sm:left-[calc(50%-120px)] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-[#666] -rotate-90 whitespace-nowrap">5–6px</span>
              </div>
              {/* Logo */}
              <div className="relative">
                <Image
                  src="/logo-main.png"
                  alt="Hacker's Unity — White/Cream Variant"
                  width={180}
                  height={180}
                  className="w-36 sm:w-44 h-auto object-contain"
                  unoptimized
                />
                {/* Clearspace visual border (dashed) */}
                <div className="absolute -inset-4 sm:-inset-5 border border-dashed border-[#444]/50 rounded-sm pointer-events-none" />
              </div>
              {/* Right clearspace marker */}
              <div className="absolute right-[calc(50%-100px)] sm:right-[calc(50%-120px)] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-[#666] rotate-90 whitespace-nowrap">5–6px</span>
              </div>
            </div>
            <div className="px-10 sm:px-16 pb-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#777]">
                White Variant — On Dark Surfaces
              </p>
            </div>
          </div>

          {/* Page Footer Bar */}
          <div className="flex items-center justify-between px-10 sm:px-16 py-3 bg-[#222] text-[9px] font-mono uppercase tracking-[0.2em] text-[#888]">
            <span>Brand Guidelines</span>
            <span>Hacker&apos;s Unity</span>
            <span>01</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          PAGE 2 — COLOR PALETTE OVERVIEW
         ═══════════════════════════════════════════════════ */}
      <div className="max-w-[960px] mx-auto px-4 pb-12">
        <div className="bg-[#f5f0e8] shadow-xl">
          {/* Section Header */}
          <div className="px-10 sm:px-16 pt-12 pb-2">
            <h2 className="text-xs font-mono uppercase tracking-[0.25em]">
              <span className="font-black text-black">Color Palette</span>
              <span className="font-normal text-[#888]">Overview</span>
            </h2>
          </div>

          {/* Color Rules */}
          <div className="px-10 sm:px-16 py-8 space-y-8">
            <div>
              <h3 className="text-[11px] font-mono font-black uppercase tracking-[0.15em] text-black mb-2">
                Core
              </h3>
              <p className="text-[13px] font-mono text-[#333] leading-relaxed max-w-[680px]">
                Black is the core identity color, carried by the icon and used for primary text and UI surfaces.
              </p>
            </div>

            <div>
              <h3 className="text-[11px] font-mono font-black uppercase tracking-[0.15em] text-black mb-2">
                Accent Duo
              </h3>
              <p className="text-[13px] font-mono text-[#333] leading-relaxed max-w-[680px]">
                Sky Blue and Signal Orange are reserved for the wordmark – &quot;Hacker&apos;s&quot; in blue, &quot;Unity&quot; in orange. They are never swapped or blended into one solid color.
              </p>
            </div>

            <div>
              <h3 className="text-[11px] font-mono font-black uppercase tracking-[0.15em] text-black mb-2">
                Neutrals
              </h3>
              <p className="text-[13px] font-mono text-[#333] leading-relaxed max-w-[680px]">
                Cream and White support the palette as background and reversed-mark tones. Cream pairs with the dark mark; White is the default page background.
              </p>
            </div>

            <div>
              <h3 className="text-[11px] font-mono font-black uppercase tracking-[0.15em] text-black mb-2">
                Usage
              </h3>
              <p className="text-[13px] font-mono text-[#333] leading-relaxed max-w-[680px]">
                No tints, gradients, or off-palette colors are introduced. Every surface in the system draws from these five values only.
              </p>
            </div>
          </div>

          {/* ── Color Swatches ────────────────────────── */}

          {/* BLACK */}
          <div className="bg-black text-white px-10 sm:px-16 py-6 space-y-1">
            <h4 className="text-[12px] font-mono font-black uppercase tracking-[0.15em]">Black</h4>
            <p className="text-[11px] font-mono text-[#aaa]">RGB&ensp;0, 0, 0</p>
            <p className="text-[11px] font-mono text-[#aaa]">HEX&ensp;#000000</p>
            <p className="text-[11px] font-mono text-[#aaa]">CMYK&ensp;0, 0, 0, 100</p>
          </div>

          {/* SKY BLUE */}
          <div className="bg-[#00A6DA] text-black px-10 sm:px-16 py-6 space-y-1">
            <h4 className="text-[12px] font-mono font-black uppercase tracking-[0.15em]">Sky Blue</h4>
            <p className="text-[11px] font-mono text-black/70">RGB&ensp;0, 168, 218</p>
            <p className="text-[11px] font-mono text-black/70">HEX&ensp;#00A6DA</p>
            <p className="text-[11px] font-mono text-black/70">CMYK*&ensp;100, 24, 0, 15</p>
          </div>

          {/* SIGNAL ORANGE */}
          <div className="bg-[#FF8500] text-black px-10 sm:px-16 py-6 space-y-1">
            <h4 className="text-[12px] font-mono font-black uppercase tracking-[0.15em]">Signal Orange</h4>
            <p className="text-[11px] font-mono text-black/70">RGB&ensp;255, 133, 0</p>
            <p className="text-[11px] font-mono text-black/70">HEX&ensp;#FF8500</p>
            <p className="text-[11px] font-mono text-black/70">CMYK*&ensp;0, 48, 100, 0</p>
          </div>

          {/* CREAM */}
          <div className="bg-[#EEE5D4] text-black px-10 sm:px-16 py-6 space-y-1">
            <h4 className="text-[12px] font-mono font-black uppercase tracking-[0.15em]">Cream</h4>
            <p className="text-[11px] font-mono text-[#555]">RGB&ensp;238, 229, 212</p>
            <p className="text-[11px] font-mono text-[#555]">HEX&ensp;#EEE5D4</p>
            <p className="text-[11px] font-mono text-[#555]">CMYK*&ensp;0, 4, 11, 7</p>
          </div>

          {/* WHITE */}
          <div className="bg-white text-black px-10 sm:px-16 py-6 space-y-1 border-t border-[#e5e0d4]">
            <h4 className="text-[12px] font-mono font-black uppercase tracking-[0.15em]">White</h4>
            <p className="text-[11px] font-mono text-[#555]">RGB&ensp;255, 255, 255</p>
            <p className="text-[11px] font-mono text-[#555]">HEX&ensp;#FFFFFF</p>
            <p className="text-[11px] font-mono text-[#555]">CMYK&ensp;0, 0, 0, 0</p>
          </div>

          {/* Page Footer Bar */}
          <div className="flex items-center justify-between px-10 sm:px-16 py-3 bg-[#222] text-[9px] font-mono uppercase tracking-[0.2em] text-[#888]">
            <span>Brand Guidelines</span>
            <span>Hacker&apos;s Unity</span>
            <span>02</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          PAGE 3 — TYPOGRAPHY & WORDMARK
         ═══════════════════════════════════════════════════ */}
      <div className="max-w-[960px] mx-auto px-4 pb-12">
        <div className="bg-[#f5f0e8] shadow-xl">
          {/* Section Header */}
          <div className="px-10 sm:px-16 pt-12 pb-2">
            <h2 className="text-xs font-mono uppercase tracking-[0.25em]">
              <span className="font-black text-black">Typography</span>
              <span className="font-normal text-[#888]">&amp; Wordmark</span>
            </h2>
          </div>

          <div className="px-10 sm:px-16 py-8 space-y-8">
            <div>
              <h3 className="text-[11px] font-mono font-black uppercase tracking-[0.15em] text-black mb-2">
                Wordmark Construction
              </h3>
              <p className="text-[13px] font-mono text-[#333] leading-relaxed max-w-[680px]">
                The wordmark is always set in bold italic. &quot;Hacker&apos;s&quot; renders in Sky Blue (#00A6DA), &quot;Unity&quot; renders in Signal Orange (#FF8500). The two words are never merged, recolored, or displayed in a single hue.
              </p>
            </div>

            <div>
              <h3 className="text-[11px] font-mono font-black uppercase tracking-[0.15em] text-black mb-2">
                Lockup
              </h3>
              <p className="text-[13px] font-mono text-[#333] leading-relaxed max-w-[680px]">
                The icon and wordmark always appear together as a vertical lockup. The wordmark sits directly below the icon with consistent spacing. Horizontal lockups are not approved.
              </p>
            </div>

            <div>
              <h3 className="text-[11px] font-mono font-black uppercase tracking-[0.15em] text-black mb-2">
                Minimum Size
              </h3>
              <p className="text-[13px] font-mono text-[#333] leading-relaxed max-w-[680px]">
                The full lockup (icon + wordmark) must not be rendered smaller than 48px in height on screen, or 12mm in print. Below this threshold, legibility of the wordmark degrades.
              </p>
            </div>
          </div>

          {/* Wordmark Demo */}
          <div className="bg-white px-10 sm:px-16 py-12 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-3xl sm:text-4xl font-black italic tracking-tight select-none">
              <span className="text-[#00A6DA]">Hacker&apos;s</span>
              <span className="text-[#FF8500]">Unity</span>
            </div>
            <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#aaa] mt-2">
              Official Wordmark — Always Two Colors
            </p>
          </div>

          {/* Page Footer Bar */}
          <div className="flex items-center justify-between px-10 sm:px-16 py-3 bg-[#222] text-[9px] font-mono uppercase tracking-[0.2em] text-[#888]">
            <span>Brand Guidelines</span>
            <span>Hacker&apos;s Unity</span>
            <span>03</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          PAGE 4 — DOWNLOADS
         ═══════════════════════════════════════════════════ */}
      <div className="max-w-[960px] mx-auto px-4 pb-16">
        <div className="bg-[#f5f0e8] shadow-xl">
          {/* Section Header */}
          <div className="px-10 sm:px-16 pt-12 pb-2">
            <h2 className="text-xs font-mono uppercase tracking-[0.25em]">
              <span className="font-black text-black">Downloads</span>
              <span className="font-normal text-[#888]">&amp; Assets</span>
            </h2>
          </div>

          <div className="px-10 sm:px-16 py-8 space-y-4">
            <p className="text-[13px] font-mono text-[#333] leading-relaxed max-w-[680px]">
              Use only the official assets below. Do not recreate, trace, or approximate the mark.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {/* Black Logo Download */}
              <a
                href="/logo-black.png"
                download="hackers-unity-logo-black.png"
                className="group flex items-center gap-4 p-5 rounded-xl bg-white border border-[#ddd] hover:border-[#00A6DA] transition-colors"
              >
                <div className="w-14 h-14 rounded-lg bg-[#f5f0e8] flex items-center justify-center shrink-0 p-2">
                  <Image src="/logo-black.png" alt="Black Logo" width={48} height={48} className="w-full h-full object-contain" unoptimized />
                </div>
                <div>
                  <p className="text-[11px] font-mono font-black uppercase tracking-[0.1em] text-black group-hover:text-[#00A6DA] transition-colors">Black Variant</p>
                  <p className="text-[10px] font-mono text-[#888]">PNG — For light backgrounds</p>
                </div>
              </a>

              {/* White/Cream Logo Download */}
              <a
                href="/logo-main.png"
                download="hackers-unity-logo-white.png"
                className="group flex items-center gap-4 p-5 rounded-xl bg-[#111] border border-[#333] hover:border-[#FF8500] transition-colors"
              >
                <div className="w-14 h-14 rounded-lg bg-[#222] flex items-center justify-center shrink-0 p-2">
                  <Image src="/logo-main.png" alt="White Logo" width={48} height={48} className="w-full h-full object-contain" unoptimized />
                </div>
                <div>
                  <p className="text-[11px] font-mono font-black uppercase tracking-[0.1em] text-white group-hover:text-[#FF8500] transition-colors">White Variant</p>
                  <p className="text-[10px] font-mono text-[#666]">PNG — For dark backgrounds</p>
                </div>
              </a>
            </div>
          </div>

          {/* Page Footer Bar */}
          <div className="flex items-center justify-between px-10 sm:px-16 py-3 bg-[#222] text-[9px] font-mono uppercase tracking-[0.2em] text-[#888]">
            <span>Brand Guidelines</span>
            <span>Hacker&apos;s Unity</span>
            <span>04</span>
          </div>
        </div>
      </div>
    </main>
  );
}
