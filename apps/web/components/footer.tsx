'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Clock, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import {
  FaInstagram,
  FaXTwitter,
  FaLinkedin,
  FaYoutube,
  FaWhatsapp,
  FaDiscord,
} from 'react-icons/fa6';

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to subscribe. Please try again.');
      }

      setStatusMessage({
        type: 'success',
        text: data.message || "You're on the list! Welcome to Hacker's Unity updates.",
      });
      setEmail('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Something went wrong. Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const socials = [
    { icon: FaInstagram, label: 'Instagram', href: 'https://instagram.com/hackerunity' },
    { icon: FaXTwitter, label: 'Twitter (X)', href: 'https://twitter.com/Hackers_Unity' },
    { icon: FaLinkedin, label: 'LinkedIn', href: 'https://linkedin.com/company/hackerunity' },
    { icon: FaYoutube, label: 'YouTube', href: 'https://youtube.com/@hackerunity' },
    { icon: FaWhatsapp, label: 'WhatsApp', href: 'https://chat.whatsapp.com/JqVKrBiZIdND1n40ffErw3?mode=gi_t' },
    { icon: FaDiscord, label: 'Discord', href: 'https://discord.com/invite/xcNNqdDhce' },
  ];

  return (
    <footer className="border-t border-slate-800/80 bg-[#080c14] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
        {/* ─── Top Row: Brand & Newsletter (Rise In / Modern Style) ─── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="max-w-xl space-y-3.5">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden p-1 shadow-sm group-hover:border-[#0099e6]/40 transition-colors">
                <Image
                  src="/logo-main.png"
                  alt="Hacker's Unity"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                Hacker&apos;s Unity
              </span>
            </Link>

            <div className="text-xs font-bold text-[#f97316] tracking-wider uppercase">
              Unite. Code. Create.
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
              India&apos;s fastest growing developer platform and builder ecosystem. Empowering students and innovators through national hackathons, mentorship, and opportunities.
            </p>

            {/* Social Buttons */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.label}
                    className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#0099e6]/50 hover:bg-slate-850 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Newsletter / Builder Updates Subscription */}
          <div className="w-full lg:max-w-md p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-lg">
            <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <span>Stay in the Builder Loop</span>
            </h4>
            <p className="text-xs text-slate-400 mb-3.5 leading-relaxed">
              Get notified about upcoming hackathons, $350K+ prize pools, and community sprints.
            </p>

            {statusMessage?.type === 'success' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusMessage.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusMessage(null)}
                  className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Subscribe another email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    disabled={isSubmitting}
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#0099e6] disabled:opacity-50 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0099e6] to-[#f97316] hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs shrink-0 shadow-md transition-all cursor-pointer flex items-center justify-center min-w-[90px]"
                  >
                    {isSubmitting ? 'Saving...' : 'Subscribe'}
                  </button>
                </div>
                {statusMessage?.type === 'error' && (
                  <p className="text-[11px] text-rose-400 font-medium pt-0.5">
                    {statusMessage.text}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* ─── Main Links & Office Directory Grid ────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Col 1: Platform & Hackathons (3 cols) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-[#0099e6] pl-2.5 mb-4">
              Hackathons & Platform
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/hackathons" className="text-slate-400 hover:text-white transition-colors">
                  Browse Hackathons
                </Link>
              </li>
              <li>
                <Link href="/podcasts" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span>Podcasts</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#0099e6]/15 text-[#0099e6] border border-[#0099e6]/30">
                    NEW
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span>Blogs &amp; Playbooks</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#f97316]/15 text-[#f97316] border border-[#f97316]/30">
                    HOT
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/host" className="text-slate-400 hover:text-white transition-colors">
                  Host Hackathon Free
                </Link>
              </li>
              <li>
                <Link href="/mentor" className="text-slate-400 hover:text-white transition-colors">
                  Verified Mentors
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                  My Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Community & Ecosystem (3 cols) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-[#f97316] pl-2.5 mb-4">
              Community & Ecosystem
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="https://tally.so/r/q4o22k"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <span>Join Hacker&apos;s Unity Team</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://discord.com/invite/xcNNqdDhce"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Discord Server (50k+ Builders)
                </a>
              </li>
              <li>
                <a
                  href="https://chat.whatsapp.com/JqVKrBiZIdND1n40ffErw3?mode=gi_t"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  WhatsApp Builder Groups
                </a>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition-colors">
                  Community Story & Mission
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
                  Partner with Hacker&apos;s Unity
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Company & Legal (2 cols) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-slate-600 pl-2.5 mb-4">
              Company & Policies
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-slate-400 hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/brand-guidelines" className="text-slate-400 hover:text-white transition-colors">
                  Brand Guidelines
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hackerunity.community@gmail.com?subject=Platform%20Feedback%20-%20Hacker's%20Unity&body=Hi%20Hacker's%20Unity%20Team,%0A%0AMy%20Feedback:"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Send Feedback
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      if (typeof (window as unknown as { openCookieSettings?: () => void }).openCookieSettings === 'function') {
                        (window as unknown as { openCookieSettings: () => void }).openCookieSettings();
                      } else {
                        window.dispatchEvent(new CustomEvent('open_cookie_settings'));
                        window.dispatchEvent(new CustomEvent('open_cookie_consent'));
                      }
                    }
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Corporate Info & Direct Support (4 cols - H2S Style) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-slate-500 pl-2.5 mb-4">
              Office & Contact
            </h4>
            <ul className="space-y-3.5 text-xs">
              {/* Address */}
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-300 block">Registered Headquarters</span>
                  <a
                    href="https://www.google.com/maps/place/Hacker's+Unity/@19.1172167,72.8642732,17z/data=!3m1!4b1!4m15!1m7!3m6!1s0x3be7c97b475f9155:0xe5b912633881889!2sHacker's+Unity!8m2!3d19.1172116!4d72.8668481!16s%2Fg%2F11zxcs0wbc!3m6!1s0x3be7c97b475f9155:0xe5b912633881889!8m2!3d19.1172116!4d72.8668481!15sCg5IYWNrZXIncyBVbml0eZIBGGV2ZW50X21hbmFnZW1lbnRfY29tcGFueeABAA!16s%2Fg%2F11zxcs0wbc?entry=ttu&g_ep=EgoyMDI2MDgzMC4wIKXMDSoASAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white transition-colors leading-relaxed block"
                  >
                    A-41, Vinmar House, 1st Floor, Road no. 2, MIDC, Andheri East, Mumbai - 400093
                  </a>
                </div>
              </li>

              {/* Email */}
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#f97316] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-300 block">General & Partnership Inquiries</span>
                  <a
                    href="mailto:hackerunity.community@gmail.com"
                    className="text-slate-400 hover:text-[#0099e6] transition-colors"
                  >
                    hackerunity.community@gmail.com
                  </a>
                </div>
              </li>

              {/* Phone */}
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-300 block">Phone Support</span>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-400">
                    <a href="tel:+918852924002" className="hover:text-white transition-colors">
                      +91 8852924002
                    </a>
                    <span>•</span>
                    <a href="tel:+919324264950" className="hover:text-white transition-colors">
                      +91 9324264950
                    </a>
                  </div>
                  <span className="text-[11px] text-slate-500 block">Available Mon – Sat (10:00 AM – 7:00 PM IST)</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Legal Disclaimer (Rise In Style) ──────────────────────── */}
        <div className="pt-8 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong className="text-slate-400">Disclaimer:</strong> Hacker&apos;s Unity is an independent developer organization and hackathon enablement platform. All hackathons, workshops, educational challenges, and developer initiatives hosted on or facilitated through hackersunity.com are organized solely for skill-building, innovation, and networking purposes. Hacker&apos;s Unity does not guarantee employment, academic credits, or third-party sponsorship payouts. Prize distributions, evaluations, and challenge problem statements managed by external partner institutions are governed by their respective organizer guidelines. Participants are advised to review relevant event rules and guidelines prior to registration.
          </p>
        </div>

        {/* ─── Bottom Bar ───────────────────────────────────────────── */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>© 2026 Hacker&apos;s Unity. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>India&apos;s Fastest Growing Hackathon Community</span>
            <span>•</span>
            <span className="text-sky-400 font-semibold">50,000+ Builders Strong</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
