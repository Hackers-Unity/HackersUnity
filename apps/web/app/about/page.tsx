import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Trophy,
  Users,
  Sparkles,
  ShieldCheck,
  Target,
  Rocket,
  Globe,
  Award,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: "About Us | Hacker's Unity",
  description:
    "Learn about Hacker's Unity — our mission to empower student talent, connect developers with high-impact hackathons, and bridge builders with world-class opportunities.",
};

export default function AboutPage() {
  const stats = [
    { label: 'Community Builders', value: '50,000+', icon: Users, color: 'text-[#0099e6]' },
    { label: 'Hackathons & Events', value: '120+', icon: Trophy, color: 'text-[#ea580c]' },
    { label: 'Prizes & Grants Won', value: '$350,000+', icon: Award, color: 'text-[#10b981]' },
    { label: 'Partner Institutions', value: '300+', icon: Globe, color: 'text-[#8b5cf6]' },
  ];

  const pillars = [
    {
      icon: Target,
      title: 'Our Mission',
      description:
        'To democratize access to premier tech hackathons and startup incubation, enabling ambitious students from all backgrounds to turn their ideas into world-changing solutions.',
    },
    {
      icon: Users,
      title: 'Vibrant Community',
      description:
        'We connect full-stack engineers, AI researchers, designers, and domain enthusiasts into balanced, multi-disciplinary squads ready to build scalable products.',
    },
    {
      icon: ShieldCheck,
      title: 'Trust & Transparency',
      description:
        'Every competition on Hacker’s Unity features transparent judging guidelines, fair play enforcement, and escrow-guaranteed prize disbursements directly to winners.',
    },
    {
      icon: Rocket,
      title: 'Venture & Career Launchpad',
      description:
        'Winning a hackathon is just the beginning. We connect standout teams with venture capital partners, accelerator programs, and high-growth hiring networks.',
    },
  ];

  return (
    <div className="flex flex-col flex-1 pb-20">
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200/80 bg-grid-pattern">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0099e6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" />
            <span className="font-mono uppercase tracking-wider text-xs">
              Empowering The Next Wave of Innovators
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
            Where Ambition Meets Opportunity, &{' '}
            <span className="text-gradient-brand">Builders Unite</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed font-medium">
            Hacker&apos;s Unity is India&apos;s fastest-growing developer ecosystem. We bring together developers, designers, product managers, and founders to collaborate on live hackathons, discover curated tech events, and build impact-driven technology.
          </p>
        </div>
      </section>

      {/* ─── Stats Grid ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="p-6 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm flex flex-col items-center text-center hover:-translate-y-1 transition-transform"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 shadow-2xs">
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Story & Vision ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-sm space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-[#0099e6] text-xs font-bold uppercase tracking-wider">
            Our Story
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Built by hackers, for hackers.
          </h2>
          <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
            <p>
              Started with a vision to solve the fragmented hackathon experience in India, Hacker&apos;s Unity bridges the gap between raw talent and real industry opportunities. Too often, aspiring builders struggle to find like-minded teammates, encounter opaque prize payouts, or miss out on premier technical challenges.
            </p>
            <p>
              We set out to build an all-in-one platform where developers can discover verified hackathons, organize college and enterprise competitions with automated registration workflows, and collaborate seamlessly across tech stacks including AI, Web3, Cloud, and Systems programming.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Core Pillars ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#ea580c] text-xs font-bold uppercase tracking-wider mb-3">
            What Drives Us
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            The Pillars of Hacker&apos;s Unity
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-[#0099e6]/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0099e6] mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{pillar.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Join Us Banner ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl border border-slate-800">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ready to build something extraordinary?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-medium">
              Explore live hackathons and tech events, or connect with our community organizers to bring Hacker&apos;s Unity to your campus.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/hackathons"
                className="px-6 py-3 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
              >
                <span>Browse Opportunities</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
              >
                <span>Contact Our Team</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
