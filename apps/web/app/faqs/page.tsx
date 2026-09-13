'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  HelpCircle,
  Sparkles,
  Users,
  Trophy,
  Code2,
  Headphones,
  Briefcase,
  Mail,
  ArrowRight,
  MessageSquare,
  ExternalLink,
  X,
} from 'lucide-react';
import { FaDiscord, FaWhatsapp, FaYoutube } from 'react-icons/fa6';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
}

const FAQ_CATEGORIES = [
  { id: 'ALL', label: 'All Questions', icon: HelpCircle },
  { id: 'GENERAL', label: 'General & Platform', icon: Sparkles },
  { id: 'HACKATHONS', label: 'Hackathons & Sprints', icon: Code2 },
  { id: 'SQUADS', label: 'Teams & Squads', icon: Users },
  { id: 'PRIZES', label: 'Prizes & Rewards', icon: Trophy },
  { id: 'PODCASTS', label: 'Podcasts & Mentorship', icon: Headphones },
  { id: 'PARTNERSHIPS', label: 'Sponsorship & Partners', icon: Briefcase },
];

const FAQ_ITEMS: FAQItem[] = [
  // General & Platform
  {
    id: 'gen-1',
    category: 'GENERAL',
    question: "What is Hacker's Unity?",
    answer:
      "Hacker's Unity is India's fastest-growing developer platform and builder ecosystem. We bring together developers, designers, product minds, and tech enthusiasts through premier national hackathons, technical podcasts, hands-on workshops, and industry mentorship to help builders transition from idea to scalable products.",
    tags: ['about', 'platform', 'community', 'mission', 'hackers unity'],
  },
  {
    id: 'gen-2',
    category: 'GENERAL',
    question: "Is Hacker's Unity free to join?",
    answer:
      "Yes, 100%! Creating an account, joining the Hacker's Unity community, participating in our open national hackathons, tuning into podcasts, and networking on our Discord & WhatsApp channels is completely free.",
    tags: ['free', 'cost', 'pricing', 'membership', 'fees'],
  },
  {
    id: 'gen-3',
    category: 'GENERAL',
    question: "How do I stay updated with upcoming events and announcements?",
    answer:
      "You can subscribe to our newsletter in the footer, join our official Discord server, follow our Twitter/X (@Hackers_Unity) and Instagram (@hackerunity), or check the notifications bell in your dashboard.",
    tags: ['updates', 'newsletter', 'discord', 'social', 'notifications'],
  },

  // Hackathons & Sprints
  {
    id: 'hack-1',
    category: 'HACKATHONS',
    question: 'How do I participate in a hackathon?',
    answer:
      'Browse our Hackathons page, choose any active or upcoming sprint, and click "Register Now". You can choose to participate as an Individual Hacker or create/join a Squad. Once registered, you will get an instant confirmed digital pass and immediate access to event resources.',
    tags: ['register', 'apply', 'hackathons', 'participate', 'ticket'],
  },
  {
    id: 'hack-2',
    category: 'HACKATHONS',
    question: 'Can beginners participate in hackathons?',
    answer:
      'Absolutely! We design our hackathons to be welcoming for all skill levels. We offer beginner tracks, workshops, starter code repositories, and direct access to industry mentors during the building phase to help first-time hackers succeed.',
    tags: ['beginners', 'students', 'learning', 'first-time', 'skills'],
  },
  {
    id: 'hack-3',
    category: 'HACKATHONS',
    question: 'Are hackathons held online or in person?',
    answer:
      'We host both virtual national hackathons (allowing builders from anywhere across India and abroad to participate remotely) and grand in-person offline hackathons at prominent tech institutions and partner venues. Check the specific event page for format and location details.',
    tags: ['format', 'online', 'offline', 'venue', 'remote'],
  },
  {
    id: 'hack-4',
    category: 'HACKATHONS',
    question: 'Who owns the intellectual property (IP) of the code built during a hackathon?',
    answer:
      'You and your team own 100% of your intellectual property, source code, and design assets. Neither Hacker’s Unity nor event sponsors claim ownership over your original project submissions.',
    tags: ['ip', 'copyright', 'ownership', 'code', 'license'],
  },

  // Teams & Squads
  {
    id: 'squad-1',
    category: 'SQUADS',
    question: 'How do Squads and Team Invitation Links work?',
    answer:
      'When registering as a squad, the Squad Leader creates the team name and instantly receives a unique, shareable invitation link. The leader can copy this link and share it with friends or teammates. When they open the link, they see squad details and can click "Accept & Join Squad" to instantly be added without entering codes.',
    tags: ['teams', 'squads', 'invite link', 'invitation', 'join team'],
  },
  {
    id: 'squad-2',
    category: 'SQUADS',
    question: 'What is the allowed squad size?',
    answer:
      'Standard squad capacity is typically 1 to 4 members per team. Specific hackathons or enterprise bounty challenges may allow up to 5 or 6 members. The exact maximum team size is prominently indicated on the event registration page.',
    tags: ['team size', 'capacity', 'members', 'limit', 'solo'],
  },
  {
    id: 'squad-3',
    category: 'SQUADS',
    question: 'Can the squad leader remove a member or delete a squad?',
    answer:
      'Yes. Squad leaders have full team management permissions. On the "Your Registration & Squad" dashboard, the leader can remove any teammate with a single click or delete the squad if plans change before the registration deadline.',
    tags: ['remove member', 'delete team', 'leave squad', 'manage team'],
  },
  {
    id: 'squad-4',
    category: 'SQUADS',
    question: "What if I don't have a team yet?",
    answer:
      'You can register individually, or connect with fellow builders in our dedicated Discord "#team-formation" channel and WhatsApp community to find squadmates with complementary skills in frontend, backend, AI/ML, or design.',
    tags: ['team formation', 'find teammates', 'solo', 'matchmaking'],
  },

  // Prizes & Rewards
  {
    id: 'prize-1',
    category: 'PRIZES',
    question: 'How and when are cash prizes and bounties distributed?',
    answer:
      'Following the announcement of winners by the judging panel, prize distributions and sponsor bounties are processed and sent directly via bank transfer, UPI, or international wire within 14 to 21 business days after verification.',
    tags: ['cash prizes', 'bounties', 'payout', 'rewards', 'money'],
  },
  {
    id: 'prize-2',
    category: 'PRIZES',
    question: 'Do all participants receive a certificate?',
    answer:
      'Yes! Every participant who registers and submits a working project according to the hackathon submission guidelines receives an official, verifiable Certificate of Participation. Top winning squads receive prestigious Winner Certificates and digital badges.',
    tags: ['certificate', 'participation', 'verification', 'credential'],
  },
  {
    id: 'prize-3',
    category: 'PRIZES',
    question: 'What additional perks do winners and top performers get?',
    answer:
      'Beyond cash rewards, top performers gain direct interview fast-tracks with hiring partners, cloud credits (AWS, Google Cloud, DigitalOcean), free domain vouchers, exclusive Hacker’s Unity swag packs, and invitations to featured podcast interviews.',
    tags: ['perks', 'swag', 'credits', 'interviews', 'hiring'],
  },

  // Podcasts & Mentorship
  {
    id: 'pod-1',
    category: 'PODCASTS',
    question: "What is Hacker's Unity Podcasts (Beyond The Mic)?",
    answer:
      'Our podcast series features in-depth interviews with senior tech executives, staff software engineers, and product leaders from companies like Amazon, Microsoft, TCS, Macy’s Tech, and IEEE. Guests share real-world engineering insights, system design trade-offs, and career acceleration advice.',
    tags: ['podcasts', 'youtube', 'interviews', 'speakers', 'leaders'],
  },
  {
    id: 'pod-2',
    category: 'PODCASTS',
    question: 'Where can I watch or listen to the podcast episodes?',
    answer:
      'You can stream all episodes directly on our official YouTube channel (@hackerunity) or browse our dedicated Podcasts directory (/podcasts) to filter by topic, speaker, and industry domain.',
    tags: ['watch', 'youtube', 'listen', 'episodes', 'streaming'],
  },
  {
    id: 'pod-3',
    category: 'PODCASTS',
    question: 'How can I apply to be a podcast guest or hackathon mentor?',
    answer:
      'We welcome seasoned engineers, founders, and industry leaders! If you would like to share your knowledge as a podcast guest or mentor hackathon participants, please reach out through our Contact Us page or email us at hackerunity.community@gmail.com.',
    tags: ['mentor', 'speaker', 'guest', 'apply', 'teach'],
  },

  // Partnerships & Sponsorships
  {
    id: 'part-1',
    category: 'PARTNERSHIPS',
    question: 'How can my company sponsor a hackathon or post a custom bounty?',
    answer:
      'We collaborate closely with leading tech brands to host sponsored problem tracks, API bounties, recruitment drives, and brand activations. Contact our partnerships team via the Contact Us page or email us to explore custom sponsorship packages.',
    tags: ['sponsor', 'corporate', 'bounty', 'partnerships', 'recruit'],
  },
  {
    id: 'part-2',
    category: 'PARTNERSHIPS',
    question: 'Can our college or student tech club partner with Hacker’s Unity?',
    answer:
      'Yes! We run the Hacker’s Unity Campus Ambassador and Community Partner program, helping student clubs organize high-impact hackathons, gain mentorship access, and secure platform sponsorships for their university events.',
    tags: ['college', 'campus ambassador', 'student club', 'university'],
  },
];

export default function FAQsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>('gen-1');

  const filteredFAQs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        activeCategory === 'ALL' || item.category === activeCategory;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesQuery =
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, activeCategory]);

  const toggleAccordion = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex-1 bg-[#05070d] text-slate-100 min-h-screen selection:bg-[#0099e6] selection:text-white relative overflow-hidden">
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <div className="relative pt-12 pb-16 lg:pb-24 border-b border-slate-800/80 bg-gradient-to-b from-[#0c1220] via-[#070a13] to-[#05070d]">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0099e6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#f97316]/06 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -left-10 select-none pointer-events-none text-[120px] sm:text-[180px] font-black tracking-tighter text-white/[0.02] uppercase leading-none">
          FAQS
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-bold text-slate-300 backdrop-blur-md mx-auto">
            <HelpCircle className="w-3.5 h-3.5 text-[#0099e6]" />
            <span className="tracking-wider uppercase text-[11px]">Help &amp; Knowledge Base</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-[#0099e6] via-sky-300 to-[#f97316] bg-clip-text text-transparent">
              Questions.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Everything you need to know about Hacker&apos;s Unity hackathons, team formation, cash prizes, podcast episodes, and community guidelines.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto pt-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, e.g., 'prizes', 'squad invite', 'certificate'..."
                className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-[#0099e6] focus:ring-1 focus:ring-[#0099e6] transition-all shadow-xl shadow-black/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {FAQ_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0099e6] text-white shadow-md shadow-sky-500/30 border border-sky-400/40'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/[0.08] pb-3">
          <span>
            Showing <strong className="text-white">{filteredFAQs.length}</strong> questions
            {activeCategory !== 'ALL' && ` in ${FAQ_CATEGORIES.find((c) => c.id === activeCategory)?.label}`}
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('ALL');
              }}
              className="text-[#0099e6] hover:underline font-bold cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* FAQs Accordion List */}
        {filteredFAQs.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white/[0.02] border border-white/[0.08] p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No matching questions found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              We couldn&apos;t find any answer for &quot;{searchQuery}&quot;. Feel free to reach out directly to our support team.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('ALL');
              }}
              className="px-5 py-2 rounded-full bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFAQs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl transition-all duration-200 border overflow-hidden ${
                    isOpen
                      ? 'bg-gradient-to-b from-[#0f172a]/90 to-[#090d16] border-[#0099e6]/40 shadow-lg shadow-[#0099e6]/05'
                      : 'bg-[#090d16]/80 hover:bg-[#0d131f] border-white/[0.08]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full p-5 sm:p-6 flex items-center justify-between text-left gap-4 cursor-pointer group"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm sm:text-base font-bold text-white group-hover:text-[#0099e6] transition-colors">
                      {faq.question}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isOpen
                          ? 'bg-[#0099e6] text-white rotate-180 shadow-md shadow-sky-500/20'
                          : 'bg-white/[0.05] text-slate-400 group-hover:text-white'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal border-t border-white/[0.06] mt-1 space-y-3">
                      <p>{faq.answer}</p>
                      {faq.tags && faq.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                          {faq.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 text-[10px] font-mono"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Bottom Metallic Black Hacker's Unity CTA Banner ────────── */}
        <div className="pt-8">
          <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-b from-[#111827] via-[#0b0f19] to-[#06080f] border border-white/[0.1] shadow-2xl shadow-black/80 text-center space-y-6 relative overflow-hidden group">
            {/* Top Cyan Glowing Line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#0099e6] to-transparent opacity-80" />

            {/* Ambient Glows */}
            <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-[#0099e6]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -right-16 -top-16 w-72 h-72 bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Brand Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-bold text-slate-300 backdrop-blur-md relative z-10">
              <MessageSquare className="w-3.5 h-3.5 text-[#0099e6]" />
              <span>Still Have Questions?</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white max-w-xl mx-auto leading-tight relative z-10">
              We&apos;re here to help you{' '}
              <span className="bg-gradient-to-r from-[#0099e6] via-sky-300 to-[#f97316] bg-clip-text text-transparent">
                build without limits.
              </span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed relative z-10">
              Can&apos;t find what you&apos;re looking for? Reach out to our team directly or join our community of 50K+ developers.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 relative z-10">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#0099e6] hover:bg-[#0088cc] text-white font-bold text-xs sm:text-sm shadow-xl shadow-sky-500/25 hover:scale-105 active:scale-95 transition-all border border-sky-400/30 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Contact Support</span>
              </Link>

              <a
                href="https://discord.gg/wtem5P5e"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold text-xs sm:text-sm border border-white/10 hover:scale-105 active:scale-95 transition-all"
              >
                <FaDiscord className="w-4 h-4 text-[#5865F2]" />
                <span>Join Discord Community</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
