'use client';

import Link from 'next/link';
import {
  Shield,
  Database,
  Eye,
  Lock,
  Cookie,
  Globe,
  UserCheck,
  Mail,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const SECTIONS = [
  { id: 'overview', label: '1. Overview', icon: Shield },
  { id: 'data-collection', label: '2. Data We Collect', icon: Database },
  { id: 'data-usage', label: '3. How We Use Data', icon: Eye },
  { id: 'data-security', label: '4. Data Security', icon: Lock },
  { id: 'cookies', label: '5. Cookies & Storage', icon: Cookie },
  { id: 'third-party', label: '6. Third-Party Services', icon: Globe },
  { id: 'user-rights', label: '7. Your Rights', icon: UserCheck },
  { id: 'contact', label: '8. Contact Us', icon: Mail },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      for (const s of [...SECTIONS].reverse()) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 140) {
          setActiveSection(s.id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 selection:bg-zinc-800 selection:text-white">
      {/* ─── Hero Header ──────────────────────────────────────────── */}
      <header className="border-b border-zinc-800/80 bg-[#09090b] pt-16 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Shield className="w-3.5 h-3.5 text-zinc-300" />
            <span>Privacy Policy</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Privacy Policy
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 mt-3 max-w-2xl mx-auto leading-relaxed font-normal">
            We are committed to protecting your personal data and ensuring transparency in how Hacker&apos;s Unity operates.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 text-xs text-zinc-400">
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
              Current & Active Policy
            </span>
            <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              Last Updated: August 2026
            </span>
          </div>
        </div>
      </header>

      {/* ─── Main Content Grid ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── Sticky Sidebar ─── */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-24 p-3.5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold px-3 py-2 border-b border-zinc-850 border-zinc-800/80 mb-1">
                Contents
              </p>

              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-black font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                      <span className="truncate">{s.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                  </a>
                );
              })}

              <div className="pt-3 mt-3 border-t border-zinc-800 px-3">
                <Link
                  href="/terms"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-300 font-semibold hover:text-white"
                >
                  <span>Terms of Service</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </aside>

          {/* ─── Main Policy Sections ─── */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* 1. Overview */}
            <ClassicDarkCard id="overview" icon={Shield} title="1. Overview">
              <p className="text-sm text-zinc-300 leading-relaxed">
                Welcome to <strong className="text-white">Hacker&apos;s Unity</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We operate the hackerunity.com platform, developer communities, and event infrastructure (collectively, the &ldquo;Platform&rdquo;).
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed mt-3">
                This Privacy Policy describes the information we collect, how we process and store it, and the rights you have concerning your personal data. By accessing or using our Platform, you acknowledge that you have read and understood this Privacy Policy.
              </p>
              <div className="mt-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium leading-relaxed">
                <strong className="text-white">Zero Data Selling Guarantee:</strong> We do not sell your personal data, phone numbers, or email addresses to third-party brokers or advertisers. Data is exclusively used to operate hackathons and platform features.
              </div>
            </ClassicDarkCard>

            {/* 2. Data We Collect */}
            <ClassicDarkCard id="data-collection" icon={Database} title="2. Data We Collect">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
                A. Information You Provide Directly
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {[
                  { title: 'Account Credentials', desc: 'Full name, email address, phone number, and avatar provided during registration or Google OAuth sign-in.' },
                  { title: 'Developer Profile', desc: 'Skills, bio, college or organization name, LinkedIn, GitHub, and portfolio URLs you choose to display.' },
                  { title: 'Hackathon Registrations', desc: 'Data submitted when entering hackathons, workshops, coding challenges, and prize arenas.' },
                  { title: 'Project Submissions', desc: 'Source code repositories, pitch decks, demo videos, and project descriptions evaluated during judging.' },
                ].map((item) => (
                  <div key={item.title} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <h5 className="text-xs font-bold text-white mb-1">{item.title}</h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
                B. Information Collected Automatically
              </h4>
              <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                <li className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Device & Log Data:</strong> IP address, browser type, operating system, referral URLs, and access timestamps.</span>
                </li>
                <li className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Platform Interactions:</strong> Pages viewed, hackathon cards clicked, bookmark events, and search queries.</span>
                </li>
                <li className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Coarse Geolocation:</strong> City and country-level location approximated from IP address to surface localized hackathons.</span>
                </li>
              </ul>
            </ClassicDarkCard>

            {/* 3. How We Use Data */}
            <ClassicDarkCard id="data-usage" icon={Eye} title="3. How We Use Data">
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                We use the data we collect strictly for the following operational purposes:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: 'Facilitating Hackathons', desc: 'Processing your participation, connecting you with organizers, and enabling submission evaluations.' },
                  { title: 'Authentication & Security', desc: 'Authenticating your session, verifying OTP codes, and protecting against spam or account takeovers.' },
                  { title: 'Personalized Workspace', desc: 'Displaying tailored hackathon recommendations, dashboard statistics, and bookmarked events.' },
                  { title: 'Service Communications', desc: 'Delivering registration confirmation emails, schedule updates, and winner announcements.' },
                  { title: 'Platform Improvements', desc: 'Evaluating usage metrics to optimize platform responsiveness, eliminate bugs, and enhance features.' },
                  { title: 'Legal & Safety Compliance', desc: 'Enforcing our Terms of Service and preventing fraudulent activity or malicious behavior.' },
                ].map((item) => (
                  <div key={item.title} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <h5 className="text-xs font-bold text-white mb-1">{item.title}</h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </ClassicDarkCard>

            {/* 4. Data Security */}
            <ClassicDarkCard id="data-security" icon={Lock} title="4. Data Security & Storage">
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                We implement robust security standards to safeguard your information:
              </p>
              <div className="space-y-3">
                {[
                  { title: 'End-to-End Encryption', desc: 'All data in transit is encrypted using TLS 1.3. Database records are encrypted at rest using AES-256 standards.' },
                  { title: 'PostgreSQL Row-Level Security (RLS)', desc: 'Granular database access policies ensure authenticated users can only query their own records.' },
                  { title: 'PKCE-Secured OAuth 2.0', desc: 'Google login tokens are exchanged using Proof Key for Code Exchange to prevent token interception.' },
                  { title: 'Strict Session Isolation', desc: 'Local caches, bookmarks, and session tokens are strictly scoped and purged on logout.' },
                ].map((item) => (
                  <div key={item.title} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">{item.title}</h5>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ClassicDarkCard>

            {/* 5. Cookies & Storage */}
            <ClassicDarkCard id="cookies" icon={Cookie} title="5. Cookies & Storage">
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                We use cookies and browser storage mechanisms to maintain session state and performance:
              </p>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-bold text-white">Essential Auth Cookies</h5>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Required
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Maintains your active session, token refresh cycles, and CSRF protection. Without these, authenticated actions cannot function.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-bold text-white">Browser Local Storage</h5>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Performance
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Used to cache your registered events and bookmarks locally for instantaneous dashboard rendering. Automatically cleared when you log out.
                  </p>
                </div>
              </div>
            </ClassicDarkCard>

            {/* 6. Third-Party Services */}
            <ClassicDarkCard id="third-party" icon={Globe} title="6. Third-Party Services">
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                We rely on vetted infrastructure partners to provide platform capabilities:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'Supabase Inc.', role: 'PostgreSQL database hosting, storage, and auth infrastructure.' },
                  { name: 'Google Cloud Platform', role: 'OAuth 2.0 single sign-on authentication service.' },
                  { name: 'Vercel Inc.', role: 'Edge computing network, application hosting, and CDN distribution.' },
                  { name: 'Resend / Nodemailer', role: 'Transactional email delivery for system notices and verifications.' },
                ].map((s) => (
                  <div key={s.name} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <h5 className="text-xs font-bold text-white">{s.name}</h5>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{s.role}</p>
                  </div>
                ))}
              </div>
            </ClassicDarkCard>

            {/* 7. Your Rights */}
            <ClassicDarkCard id="user-rights" icon={UserCheck} title="7. Your Rights & Choices">
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                You retain comprehensive control over your personal data:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: 'Access & Export', desc: 'Request a complete export of your personal profile, event registrations, and submission history.' },
                  { title: 'Rectification', desc: 'Modify your profile information, contact numbers, and public handles at any time via Settings.' },
                  { title: 'Account Deletion', desc: 'Request full erasure of your account and associated private data from our systems.' },
                  { title: 'Communication Preferences', desc: 'Opt out of non-critical announcement emails with one click from any message footer.' },
                ].map((item) => (
                  <div key={item.title} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <h5 className="text-xs font-bold text-white mb-1">{item.title}</h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </ClassicDarkCard>

            {/* 8. Contact Us */}
            <ClassicDarkCard id="contact" icon={Mail} title="8. Contact Us">
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                If you have questions regarding this Privacy Policy or your data rights, please reach out to our team:
              </p>
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-white">Privacy & Legal Desk</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Hacker&apos;s Unity Community</p>
                  </div>
                  <a
                    href="mailto:hackerunity.community@gmail.com"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-black" />
                    <span>hackerunity.community@gmail.com</span>
                  </a>
                </div>
                <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-400 space-y-1">
                  <p><strong className="text-zinc-300">Address:</strong> A-41, Vinmar House, Ground Floor, Road no. 2, MIDC, Andheri East, Mumbai - 400093</p>
                  <p><strong className="text-zinc-300">Helpline:</strong> +91 8852924002 / +91 9324264950</p>
                </div>
              </div>
            </ClassicDarkCard>
          </main>
        </div>
      </div>
    </div>
  );
}

function ClassicDarkCard({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="p-6 sm:p-8 rounded-2xl bg-[#09090b] border border-zinc-800 scroll-mt-24 space-y-4"
    >
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
}
