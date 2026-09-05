import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
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
import { FaInstagram, FaXTwitter, FaLinkedin } from 'react-icons/fa6';

export const metadata: Metadata = {
  title: "About Us | Hacker's Unity",
  description:
    "Learn about Hacker's Unity — founded in 2022 by Jha Suraj Kumar and Chinmay Bhatt to empower student talent, connect developers with high-impact hackathons, and bridge builders with world-class opportunities.",
};

export default function AboutPage() {
  const stats = [
    { label: 'Community Builders', value: '50,000+', icon: Users, color: 'text-[#0099e6]' },
    { label: 'Hackathons & Events', value: '120+', icon: Trophy, color: 'text-[#ea580c]' },
    { label: 'Prizes & Grants Won', value: '$350,000+', icon: Award, color: 'text-[#10b981]' },
    { label: 'Partner Institutions', value: '300+', icon: Globe, color: 'text-[#8b5cf6]' },
  ];

  const team = [
    {
      name: 'Jha Suraj Kumar',
      role: 'Founder',
      roleBadge: 'Founder',
      badgeColor: 'bg-orange-50 text-[#ea580c] border-orange-200/80',
      image: '/team/jhasurajkumar.png',
      bio: "Visionary founder who established Hacker's Unity in 2022. Driven by a mission to unite student innovators, scale nationwide hackathons, and bridge the gap between young builders and real-world tech impact.",
      socials: [
        {
          icon: FaLinkedin,
          label: 'LinkedIn',
          href: 'https://in.linkedin.com/in/jha-suraj-kumar-269196252',
          color: 'hover:text-[#0077b5] hover:border-[#0077b5]/40 hover:bg-[#0077b5]/5',
        },
        {
          icon: FaXTwitter,
          label: 'X (Twitter)',
          href: 'https://x.com/Hackers_Unity',
          color: 'hover:text-black hover:border-black/40 hover:bg-black/5',
        },
        {
          icon: FaInstagram,
          label: 'Instagram',
          href: 'https://instagram.com/hackerunity',
          color: 'hover:text-[#e4405f] hover:border-[#e4405f]/40 hover:bg-[#e4405f]/5',
        },
      ],
    },
    {
      name: 'Chinmay Bhatt',
      role: 'Co-Founder',
      roleBadge: 'Co-Founder',
      badgeColor: 'bg-sky-50 text-[#0099e6] border-sky-200/80',
      image: '/team/chinmay.jpg',
      bio: "Co-founder spearheading technical architecture, product design, and platform engineering. Passionate about empowering high-impact squads to turn bold ideas into production-ready software.",
      // handle: '@chinmaybhattt',
      socials: [
        {
          icon: FaLinkedin,
          label: 'LinkedIn',
          href: 'https://linkedin.com/in/chinmaybhattt',
          color: 'hover:text-[#0077b5] hover:border-[#0077b5]/40 hover:bg-[#0077b5]/5',
        },
        {
          icon: FaXTwitter,
          label: 'X (Twitter)',
          href: 'https://x.com/chinmaybhattt',
          color: 'hover:text-black hover:border-black/40 hover:bg-black/5',
        },
        {
          icon: FaInstagram,
          label: 'Instagram',
          href: 'https://instagram.com/chinmaybhattt',
          color: 'hover:text-[#e4405f] hover:border-[#e4405f]/40 hover:bg-[#e4405f]/5',
        },
      ],
    },
    {
      name: 'Pranjal Jain',
      role: 'Chief Marketing Officer',
      roleBadge: 'Chief Marketing Officer',
      badgeColor: 'bg-purple-50 text-purple-600 border-purple-200/80',
      image: '/team/Pranjal.jpeg',
      bio: "Chief Marketing Officer leading strategic brand partnerships, campus ambassador networks, and community operations to make Hacker's Unity India's fastest-growing developer collective.",
      // handle: 'pranjal454',
      socials: [
        {
          icon: FaLinkedin,
          label: 'LinkedIn',
          href: 'https://www.linkedin.com/in/pranjal454/',
          color: 'hover:text-[#0077b5] hover:border-[#0077b5]/40 hover:bg-[#0077b5]/5',
        },
        {
          icon: FaXTwitter,
          label: 'X (Twitter)',
          href: 'https://x.com/Hackers_Unity',
          color: 'hover:text-black hover:border-black/40 hover:bg-black/5',
        },
        {
          icon: FaInstagram,
          label: 'Instagram',
          href: 'https://instagram.com/hackerunity',
          color: 'hover:text-[#e4405f] hover:border-[#e4405f]/40 hover:bg-[#e4405f]/5',
        },
      ],
    },
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
            Hacker&apos;s Unity is India&apos;s fastest-growing developer ecosystem. Founded in 2022 by Jha Suraj Kumar and Chinmay Bhatt, we bring together developers, designers, product managers, and founders to collaborate on live hackathons, discover curated tech events, and build impact-driven technology.
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
            Founded in 2022 by Jha Suraj Kumar & Chinmay Bhatt.
          </h2>
          <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
            <p>
              Hacker&apos;s Unity was founded in 2022 by <strong className="text-slate-900 font-bold">Jha Suraj Kumar</strong> and <strong className="text-slate-900 font-bold">Chinmay Bhatt</strong> with a singular mission: to solve the fragmented hackathon experience in India and bridge the gap between raw student talent and real industry opportunities. Too often, aspiring builders struggle to find like-minded teammates, encounter opaque prize payouts, or miss out on premier technical challenges.
            </p>
            <p>
              We set out to build an all-in-one platform where developers can discover verified hackathons, organize college and enterprise competitions with automated registration workflows, and collaborate seamlessly across tech stacks including AI, Web3, Cloud, and Systems programming.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Founders & Leadership Team ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#ea580c] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Founders & Leadership</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Meet The Minds Behind Hacker&apos;s Unity
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2 font-medium">
            Founded in 2022 by Jha Suraj Kumar and Chinmay Bhatt, led by technologists and community architects dedicated to student builders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member) => (
            <div
              key={member.name}
              className="group relative bg-white rounded-3xl border border-slate-200/90 hover:border-slate-300 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
            >
              {/* Accent Gradient Bar on Hover */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0099e6] via-[#ea580c] to-[#0099e6] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Profile Image with subtle ring */}
              <div className="relative mb-5">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden p-1 bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-[#0099e6]/20 group-hover:to-[#ea580c]/20 transition-colors shadow-sm">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={144}
                    height={144}
                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>

              {/* Role Pill */}
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border mb-3 ${member.badgeColor}`}
              >
                {member.roleBadge}
              </div>

              {/* Name */}
              <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-[#0099e6] transition-colors">
                {member.name}
              </h3>

              {member.handle && (
                <span className="text-xs font-semibold text-slate-400 mt-0.5">
                  {member.handle}
                </span>
              )}

              {/* Bio */}
              <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed font-medium flex-1">
                {member.bio}
              </p>

              {/* Social Links */}
              <div className="flex items-center justify-center gap-2.5 pt-5 mt-5 border-t border-slate-100 w-full">
                {member.socials.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${member.name} on ${social.label}`}
                      className={`w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-500 transition-all cursor-pointer shadow-2xs ${social.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
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
