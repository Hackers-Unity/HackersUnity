'use client';

import Link from 'next/link';
import {
  FileText,
  Gavel,
  AlertTriangle,
  UserCog,
  Award,
  BookOpen,
  ShieldAlert,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const SECTIONS = [
  { id: 'acceptance', label: '1. Acceptance of Terms', icon: FileText },
  { id: 'platform-usage', label: '2. Platform Usage & Scope', icon: BookOpen },
  { id: 'user-responsibilities', label: '3. User Responsibilities', icon: UserCog },
  { id: 'event-participation', label: '4. Event Participation', icon: Award },
  { id: 'organizer-responsibilities', label: '5. Organizer Obligations', icon: Gavel },
  { id: 'content-ip', label: '6. Content & IP Rights', icon: FileText },
  { id: 'termination', label: '7. Account Termination', icon: AlertTriangle },
  { id: 'disclaimers', label: '8. Disclaimers & Liability', icon: ShieldAlert },
  { id: 'updates', label: '9. Updates & Contact', icon: RefreshCw },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('acceptance');

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
            <Gavel className="w-3.5 h-3.5 text-zinc-300" />
            <span>Terms of Service</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Terms of Service
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 mt-3 max-w-2xl mx-auto leading-relaxed font-normal">
            Please review these terms carefully before accessing or using Hacker&apos;s Unity. They govern your participation in hackathons.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 text-xs text-zinc-400">
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
              Enforceable Terms
            </span>
            <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              Effective: August 2026
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
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold px-3 py-2 border-b border-zinc-800 mb-1">
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
                  href="/privacy"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-300 font-semibold hover:text-white"
                >
                  <span>Privacy Policy</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </aside>

          {/* ─── Main Terms Sections ─── */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* 1. Acceptance */}
            <ClassicDarkCard id="acceptance" icon={FileText} title="1. Acceptance of Terms">
              <p className="text-sm text-zinc-300 leading-relaxed">
                By accessing, browsing, registering for, or using the <strong className="text-white">Hacker&apos;s Unity</strong> platform (&ldquo;Platform&rdquo;), you (&ldquo;User,&rdquo; &ldquo;Participant,&rdquo; or &ldquo;Organizer&rdquo;) agree to be legally bound by these Terms of Service (&ldquo;Terms&rdquo;) and our <Link href="/privacy" className="text-zinc-100 font-semibold underline">Privacy Policy</Link>.
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed mt-3">
                If you are entering into these Terms on behalf of a company, college club, or legal entity, you represent and warrant that you possess the full legal authority to bind that entity. If you do not agree to these Terms in their entirety, you must not use our Platform.
              </p>
              <div className="mt-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium leading-relaxed">
                <strong className="text-white">Age Requirement:</strong> You must be at least 13 years of age (or older if required by your local jurisdiction) to participate in competitions on Hacker&apos;s Unity.
              </div>
            </ClassicDarkCard>

            {/* 2. Platform Usage */}
            <ClassicDarkCard id="platform-usage" icon={BookOpen} title="2. Platform Usage & Scope">
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Hacker&apos;s Unity is a developer community hub and hackathon infrastructure network that provides:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: 'Discovery & Registration', desc: 'Browse verified hackathons across AI, Web3, Mobile, and DeepTech tracks and register with 1-click.' },
                  { title: 'Event Management', desc: 'Allow organizers to publish agendas, manage applicants, broadcast announcements, and publish results.' },
                  { title: 'Submission Portals', desc: 'Submit project artifacts, code repositories, video demos, and presentations for judging.' },
                  { title: 'Public Portfolios', desc: 'Showcase verified competition history, Elo ratings, badges, and project archives.' },
                ].map((item) => (
                  <div key={item.title} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <h5 className="text-xs font-bold text-white mb-1">{item.title}</h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </ClassicDarkCard>

            {/* 3. User Responsibilities */}
            <ClassicDarkCard id="user-responsibilities" icon={UserCog} title="3. User Responsibilities & Conduct">
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                All users must uphold developer integrity standards. You explicitly agree not to:
              </p>
              <div className="space-y-3">
                {[
                  { title: 'No Fraudulent Identity', desc: 'Do not impersonate other developers, organizations, judges, or Hacker’s Unity personnel.' },
                  { title: 'No Harassment or Hate Speech', desc: 'Treat all peers, organizers, and mentors with dignity. Discrimination and abuse result in immediate expulsion.' },
                  { title: 'No Unauthorized Scraping or Probing', desc: 'Do not reverse engineer, scrape, flood, or exploit API vulnerabilities in the platform infrastructure.' },
                  { title: 'Accurate Information', desc: 'Maintain truthful profile details, genuine skill tags, and valid contact numbers.' },
                ].map((item) => (
                  <div key={item.title} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-white">{item.title}</h5>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ClassicDarkCard>

            {/* 4. Event Participation */}
            <ClassicDarkCard id="event-participation" icon={Award} title="4. Event Participation & Submissions">
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                When participating in any event or hackathon hosted via Hacker&apos;s Unity:
              </p>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <h5 className="text-xs font-bold text-white mb-1">Originality of Submissions</h5>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    All prototypes and projects submitted must be created during the official hackathon duration unless explicit exceptions are declared in event rules. Plagiarism is grounds for disqualification.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <h5 className="text-xs font-bold text-white mb-1">Prize Pools & Fulfillment</h5>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Prize amounts, eligibility, tax withholdings, and disbursement schedules are determined and fulfilled directly by event organizers or sponsors. Hacker&apos;s Unity acts as a facilitator.
                  </p>
                </div>
              </div>
            </ClassicDarkCard>

            {/* 5. Organizer Responsibilities */}
            <ClassicDarkCard id="organizer-responsibilities" icon={Gavel} title="5. Organizer Obligations">
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Organizers hosting hackathons or workshops on Hacker&apos;s Unity agree to:
              </p>
              <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                <li className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Accurate Event Listings:</strong> State genuine prize totals, dates, venues, judging criteria, and sponsor lists without deception.</span>
                </li>
                <li className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Fair Judging:</strong> Evaluate all qualifying project submissions fairly according to the published rubric.</span>
                </li>
                <li className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Timely Prize Distribution:</strong> Disburse declared prizes to verified winners within reasonable commercial timeframes.</span>
                </li>
                <li className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Data Protection:</strong> Treat applicant contact lists strictly for event purposes and maintain participant privacy.</span>
                </li>
              </ul>
            </ClassicDarkCard>

            {/* 6. Content & IP Rights */}
            <ClassicDarkCard id="content-ip" icon={FileText} title="6. Intellectual Property Rights">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <h5 className="text-xs font-bold text-white mb-1">Your IP Remains 100% Yours</h5>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    You retain full intellectual property ownership of your projects, repository code, UI designs, and business models. Submitting to a hackathon does not surrender your copyright.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <h5 className="text-xs font-bold text-white mb-1">Platform Showcase License</h5>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    You grant Hacker&apos;s Unity a non-exclusive license to display project names, thumbnails, descriptions, and winning banners for promotional and community leaderboard purposes.
                  </p>
                </div>
              </div>
            </ClassicDarkCard>

            {/* 7. Account Termination */}
            <ClassicDarkCard id="termination" icon={AlertTriangle} title="7. Account Suspension & Termination">
              <p className="text-sm text-zinc-300 leading-relaxed mb-3">
                We reserve the right to suspend or terminate accounts that breach platform safety or legal boundaries, including:
              </p>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs text-zinc-300 font-medium">
                <p>• Cheating, code plagiarism, or submission fraud during prize-bearing hackathons.</p>
                <p>• Toxic behavior, doxxing, harassment, or abuse toward developers or staff.</p>
                <p>• Unauthorized attempts to disrupt platform infrastructure or inject malicious code.</p>
              </div>
            </ClassicDarkCard>

            {/* 8. Disclaimers & Liability */}
            <ClassicDarkCard id="disclaimers" icon={ShieldAlert} title="8. Disclaimers & Limitation of Liability">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium leading-relaxed mb-3">
                <strong className="text-white">&ldquo;AS IS&rdquo; DISCLAIMER:</strong> Hacker&apos;s Unity provides all platform tools and event matchmaking features on an &ldquo;as is&rdquo; basis without warranties of any kind.
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                To the maximum extent permitted by applicable law, Hacker&apos;s Unity shall not be liable for any indirect or consequential damages resulting from platform downtime or disputes between participants and organizers.
              </p>
            </ClassicDarkCard>

            {/* 9. Updates & Contact */}
            <ClassicDarkCard id="updates" icon={RefreshCw} title="9. Updates & Contact">
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                We may revise these Terms as our platform evolves. Significant updates will be highlighted on the platform or sent via registered email.
              </p>
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-white">Legal & Compliance Office</h4>
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
                  <p><strong className="text-zinc-300">Headquarters:</strong> A-41, Vinmar House, Ground Floor, Road no. 2, MIDC, Andheri East, Mumbai - 400093</p>
                  <p><strong className="text-zinc-300">Support Helpline:</strong> +91 8852924002 / +91 9324264950</p>
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
