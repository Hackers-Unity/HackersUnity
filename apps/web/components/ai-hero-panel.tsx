'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Wand2,
  Paperclip,
  X,
  ArrowRight,
  Trophy,
  MapPin,
  Flame,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { usePublishedEvents } from '@/lib/hooks/use-events';
import { formatCurrency } from '@/lib/utils';
import { ExtendedEvent } from '@/lib/mock-data';
import { saveDraftEvent } from '@/lib/storage';
import { EventCategory, EventType } from '@hackers-unity/shared-types';

export function AiHeroPanel() {
  const router = useRouter();
  const { events } = usePublishedEvents();

  // Mode: 'find' (Find Hackathons) or 'build' (Auto-generate & Host)
  const [activeTab, setActiveTab] = useState<'find' | 'build'>('find');

  // --- FIND MODE STATE ---
  const [findQuery, setFindQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedEvents, setMatchedEvents] = useState<ExtendedEvent[]>([]);
  const [aiRationale, setAiRationale] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);

  // --- BUILD MODE STATE ---
  const [buildPrompt, setBuildPrompt] = useState('');
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    content: string;
    isImage?: boolean;
    dataUrl?: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [buildStepMessage, setBuildStepMessage] = useState('');
  const [buildError, setBuildError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Find Tags
  const quickTags = [
    { label: '#Web3', query: 'Web3 and blockchain hackathons' },
    { label: '#AIAgents', query: 'AI agents and LLMs hackathons' },
    { label: '#Bangalore', query: 'Offline hackathons in Bangalore' },
    { label: '#Beginners', query: 'Beginner friendly hackathons' },
    { label: '#HighPrize', query: 'Hackathons with the biggest cash prizes' },
  ];

  // Quick Build Presets
  const buildPresets = [
    {
      label: '🚀 36h Offline AI (Bangalore)',
      prompt:
        'Host "HackAI Bangalore 2026", a 36-hour offline hackathon in Koramangala, Bangalore. Focus on Autonomous AI Agents, Multimodal Apps, and Local LLMs. Total prize pool ₹2,50,000 with 1st prize ₹1,20,000. Team size 2-4 students. Free food, 24/7 internet, swags, and developer mentoring provided.',
    },
    {
      label: '🌐 Global Web3 Sprint',
      prompt:
        'Host "ZeroKnowledge Sprint", a 48-hour global virtual hackathon on DeFi, ZK-Proofs, and Decentralized Identity. $15,000 USD prize pool, completely online. Tracks include Account Abstraction, Privacy-first DeFi, and Cross-chain Bridges. Open for builders globally.',
    },
    {
      label: '🎓 University Innovation Cup',
      prompt:
        'Host "Apex Innovate 2026", a 24-hour inter-college hackathon organized at Tech Campus, Delhi NCR. Tracks: Smart Health, Green Energy, Cyber Defense. ₹1,00,000 prize pool, beginner friendly, teams of 2-4.',
    },
  ];

  // ==========================================
  // 1. FIND MODE: Submit Query to Groq
  // ==========================================
  const handleFindSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = (customQuery ?? findQuery).trim();
    if (!queryToUse) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'find',
          query: queryToUse,
          events: events.map((ev) => ({
            id: ev.id,
            slug: ev.slug,
            title: ev.title,
            description: ev.description,
            tags: ev.tags,
            mode: ev.mode || ev.eventType,
            location: ev.location,
            prize: ev.prize || (ev.totalPrizeValue ? formatCurrency(ev.totalPrizeValue) : ''),
          })),
        }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.matchedEventIds) && data.matchedEventIds.length > 0) {
        const matched = events.filter((ev) =>
          data.matchedEventIds.includes(ev.id) || data.matchedEventIds.includes(ev.slug)
        );
        setMatchedEvents(matched.length > 0 ? matched : events.slice(0, 3));
        setAiRationale(data.rationale || 'Top recommended hackathons tailored to your query.');
      } else {
        const lower = queryToUse.toLowerCase();
        const fallbackMatched = events.filter(
          (ev) =>
            ev.title.toLowerCase().includes(lower) ||
            ev.description.toLowerCase().includes(lower) ||
            ev.tags.some((t) => t.toLowerCase().includes(lower)) ||
            (ev.location && ev.location.toLowerCase().includes(lower))
        );
        setMatchedEvents(fallbackMatched.length > 0 ? fallbackMatched : events.slice(0, 3));
        setAiRationale(
          fallbackMatched.length > 0
            ? `Found ${fallbackMatched.length} matching events for "${queryToUse}".`
            : `Showing top featured hackathons matching your query.`
        );
      }
    } catch (err: any) {
      console.error('Find with AI error:', err);
      const lower = queryToUse.toLowerCase();
      const fallbackMatched = events.filter(
        (ev) =>
          ev.title.toLowerCase().includes(lower) ||
          ev.tags.some((t) => t.toLowerCase().includes(lower))
      );
      setMatchedEvents(fallbackMatched.length > 0 ? fallbackMatched : events.slice(0, 3));
      setAiRationale(`Showing hackathons matching "${queryToUse}".`);
    } finally {
      setIsSearching(false);
    }
  };

  // ==========================================
  // 2. BUILD MODE: File Upload & Reader
  // ==========================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKb = (file.size / 1024).toFixed(1) + ' KB';

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = (event.target?.result as string) || '';
        setAttachedFile({
          name: file.name,
          size: sizeKb,
          content: `[Attached Hackathon Poster / Banner: ${file.name}]`,
          isImage: true,
          dataUrl,
        });
      };
      reader.readAsDataURL(file);
    } else if (
      file.type.includes('text') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.csv')
    ) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setAttachedFile({
          name: file.name,
          size: sizeKb,
          content: text.slice(0, 15000),
          isImage: false,
        });
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const raw = (event.target?.result as string) || '';
        const printableText = raw.replace(/[^\x20-\x7E\t\n\r]/g, ' ').slice(0, 10000);
        setAttachedFile({
          name: file.name,
          size: sizeKb,
          content: printableText.trim()
            ? `[Document: ${file.name} (${sizeKb})]\n\n${printableText}`
            : `[Attached Event Brochure: ${file.name}, File Size: ${sizeKb}]`,
          isImage: false,
        });
      };
      reader.readAsBinaryString(file);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ==========================================
  // 3. BUILD MODE: Generate & Host via Groq
  // ==========================================
  const handleBuildGenerate = async () => {
    if (!buildPrompt.trim() && !attachedFile) {
      setBuildError('Please enter hackathon details or upload a poster/brochure.');
      return;
    }

    setIsGenerating(true);
    setBuildError(null);
    setBuildStepMessage(
      attachedFile?.isImage
        ? 'Scanning hackathon poster with AI OCR...'
        : 'Analyzing hackathon brief...'
    );

    try {
      setTimeout(() => {
        setBuildStepMessage(
          attachedFile?.isImage
            ? 'Extracting poster tracks, prizes & dates via Groq...'
            : 'Architecting tracks & prizes via Groq...'
        );
      }, 900);

      const res = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'build',
          prompt: buildPrompt.trim(),
          sourceText: attachedFile?.content || '',
          imageBase64: attachedFile?.isImage ? attachedFile.dataUrl : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.event) {
        throw new Error(data.error || 'Failed to generate hackathon data');
      }

      setBuildStepMessage('Opening Step 7 Review...');

      const aiEvent = data.event;
      const draftId = `evt_ai_${Date.now()}`;
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const fullDraftEvent: ExtendedEvent = {
        id: draftId,
        slug: draftId,
        title: aiEvent.title || 'AI Generated Hackathon',
        name: aiEvent.title || 'AI Generated Hackathon',
        tagline: aiEvent.tagline || 'Built with Hacker\'s Unity AI Architect',
        organizerId: 'org_ai_host',
        organizerName: aiEvent.institutionName
          ? `${aiEvent.institutionName} • ${aiEvent.organizerLeadName || "Hacker's Unity"}`
          : aiEvent.organizerName || "Hacker's Unity Community",
        organizerAvatar: '⚡',
        organizerLogo: '',
        description: aiEvent.description || 'Complete hackathon guidelines and problem statements.',
        category: (aiEvent.category as EventCategory) || EventCategory.HACKATHON,
        eventType:
          aiEvent.eventType === 'OFFLINE'
            ? EventType.OFFLINE
            : aiEvent.eventType === 'HYBRID'
              ? EventType.HYBRID
              : EventType.ONLINE,
        mode: aiEvent.mode || (aiEvent.eventType === 'OFFLINE' ? 'In-Person' : 'Online'),
        location: aiEvent.location || 'Online / Discord',
        domain: (aiEvent.tags && aiEvent.tags.join(', ')) || 'AI, Web3, Fullstack',
        tags: Array.isArray(aiEvent.tags) && aiEvent.tags.length > 0 ? aiEvent.tags : ['AI', 'Innovation'],
        startDate: aiEvent.startDate ? `${aiEvent.startDate}T09:00:00Z` : nextMonth.toISOString(),
        endDate: aiEvent.endDate
          ? `${aiEvent.endDate}T18:00:00Z`
          : new Date(nextMonth.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        registrationStart: aiEvent.registrationStart
          ? `${aiEvent.registrationStart}T00:00:00Z`
          : now.toISOString(),
        registrationDeadline: aiEvent.registrationDeadline
          ? `${aiEvent.registrationDeadline}T23:59:59Z`
          : new Date(nextMonth.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        prize: aiEvent.prize || '₹1,00,000',
        totalPrizeValue: Number(aiEvent.totalPrizeValue) || 100000,
        currency: aiEvent.currency || 'INR',
        participantsCount: 0,
        participantsDisplay: '0 Builders Registered',
        maxParticipants: 500,
        isTeamEvent: true,
        bannerUrl: attachedFile?.isImage && attachedFile.dataUrl ? attachedFile.dataUrl : '',
        image: attachedFile?.isImage && attachedFile.dataUrl ? attachedFile.dataUrl : (aiEvent.image || ''),
        rulesDocUrl: '',
        registrationLink: '',
        createdAt: now.toISOString(),
        bannerGradient: 'from-blue-600 via-indigo-600 to-sky-500',
        minTeamSize: Number(aiEvent.minTeamSize) || 1,
        maxTeamSize: Number(aiEvent.maxTeamSize) || 4,
        teamSize: `${Number(aiEvent.minTeamSize) || 1}-${Number(aiEvent.maxTeamSize) || 4} Members`,
        eligibilityRules: {
          teamSize: `${Number(aiEvent.minTeamSize) || 1}-${Number(aiEvent.maxTeamSize) || 4} Members`,
          eligibility: aiEvent.eligibility || 'Open to all developers and students worldwide',
        },
        eligibility: aiEvent.eligibility || 'Open to all developers and students worldwide',
        difficulty: aiEvent.difficulty || 'All Levels Welcome',
        rulesText: aiEvent.rulesText || aiEvent.rules || 'Standard hackathon code of conduct applies.',
        prizes: Array.isArray(aiEvent.prizes)
          ? aiEvent.prizes.map((p: any) => ({
            position: p.position || p.title || 'Winner',
            amount: typeof p.amount === 'number' ? p.amount : parseInt(String(p.amount).replace(/\D/g, '')) || 50000,
            description: p.description || '',
          }))
          : [
            { position: '1st Place', amount: 50000, description: 'Grand Prize' },
            { position: '2nd Place', amount: 30000, description: 'Runner Up' },
          ],
        tracks: Array.isArray(aiEvent.tracks)
          ? aiEvent.tracks.map((t: any) => ({
            title: t.title || 'Open Track',
            prize: t.prize || t.prizePool || '₹25,000',
            description: t.description || 'Build innovative solutions',
          }))
          : [{ title: 'Open Innovation', prize: '₹50,000', description: 'Any innovative software prototype' }],
        stages: [
          {
            id: 'stage_1',
            eventId: draftId,
            stageName: 'Registration Phase',
            stageOrder: 1,
            startDate: aiEvent.registrationStart || now.toISOString().split('T')[0],
            endDate: aiEvent.registrationDeadline || nextMonth.toISOString().split('T')[0],
            description: 'Team formation and registration confirmation.',
          },
          {
            id: 'stage_2',
            eventId: draftId,
            stageName: 'Hacking Sprint',
            stageOrder: 2,
            startDate: aiEvent.startDate || nextMonth.toISOString().split('T')[0],
            endDate: aiEvent.endDate || nextMonth.toISOString().split('T')[0],
            description: 'Intense sprint to build and ship the prototype.',
          },
        ],
        faqs: [
          {
            id: 'faq_1',
            eventId: draftId,
            question: 'Who can participate?',
            answer: 'Anyone with a passion for building! College students, self-taught devs, and professionals are welcome.',
            createdAt: now.toISOString(),
          },
          {
            id: 'faq_2',
            eventId: draftId,
            question: 'Is there any registration fee?',
            answer: 'No, participation is completely free.',
            createdAt: now.toISOString(),
          },
          {
            id: 'faq_3',
            eventId: draftId,
            question: 'What is the team size?',
            answer: `Teams can have between ${aiEvent.minTeamSize || 1} to ${aiEvent.maxTeamSize || 4} members.`,
            createdAt: now.toISOString(),
          },
        ],
        sponsors: [],
        status: 'DRAFT' as any,
      };

      sessionStorage.setItem('hackers_unity_edit_event', JSON.stringify(fullDraftEvent));
      saveDraftEvent(fullDraftEvent);
      router.push(`/host?edit=${draftId}&step=7`);
    } catch (err: any) {
      console.error('Error generating event with AI:', err);
      setBuildError(err.message || 'AI generation failed. Please try again.');
      setIsGenerating(false);
    }
  };

  const isExpandedBuild = activeTab === 'build' && buildPrompt.trim().length > 0;

  return (
    <div className="relative w-full max-w-3xl mb-6 z-30">
      {/* ─── COMMAND BAR CONTAINER (CLEAN ROUNDED-2XL CARD, NO BUBBLE/CIRCLE RING) ─── */}
      <div
        className={`relative w-full bg-white dark:bg-[#0c1017]/90 transition-all duration-200 shadow-lg shadow-slate-200/60 dark:shadow-black/70 border border-slate-200/90 dark:border-white/[0.08] rounded-2xl ${isExpandedBuild ? 'p-3.5 sm:p-4' : 'p-2 flex flex-col sm:flex-row sm:items-center gap-2'
          }`}
      >
        {isExpandedBuild ? (
          /* ─── EXPANDED BUILD VIEW (CLEAN RECTANGULAR CARD) ─── */
          <div className="space-y-3">
            {/* Top Bar: Mode Toggle + Clear Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center bg-slate-100 dark:bg-white/[0.06] p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('find');
                    setBuildError(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('build');
                    setHasSearched(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white dark:bg-white/[0.12] text-[#ea580c] shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Build</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setBuildPrompt('')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg cursor-pointer transition-colors"
              >
                <span>Clear</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Expanded Textarea */}
            <textarea
              rows={3}
              value={buildPrompt}
              onChange={(e) => setBuildPrompt(e.target.value)}
              placeholder="Describe your hackathon to auto-create & review (e.g. 36h AI sprint in Bangalore, ₹2L prizes)..."
              className="w-full bg-slate-50/70 dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.06] focus:bg-white dark:focus:bg-white/[0.08] p-3 rounded-xl border border-slate-200 dark:border-white/[0.08] focus:border-slate-400 dark:focus:border-white/[0.2] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-medium resize-none transition-all leading-relaxed shadow-2xs"
            />

            {/* Loading Status Indicator (Doesn't distort the button) */}
            {isGenerating && buildStepMessage && (
              <div className="flex items-center gap-2 px-1 text-xs font-bold text-[#ea580c] animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{buildStepMessage}</span>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/[0.08] flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="brochure-upload"
                  accept=".pdf,.doc,.docx,.txt,.md,.json,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {attachedFile ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-xs text-[#ea580c] font-bold">
                    {attachedFile.isImage && attachedFile.dataUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={attachedFile.dataUrl} alt="Poster" className="w-4 h-4 rounded object-cover shadow-xs" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    <span className="max-w-[150px] truncate">{attachedFile.name}</span>
                    <button
                      type="button"
                      onClick={removeAttachedFile}
                      className="p-0.5 hover:bg-orange-100 rounded text-orange-600 cursor-pointer ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload hackathon poster, banner image, or brochure"
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-600 hover:text-[#ea580c] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-[#ea580c]" />
                    <span>Add Source / Docs</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleBuildGenerate}
                disabled={isGenerating || (!buildPrompt.trim() && !attachedFile)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:opacity-95 disabled:opacity-50 text-white font-black text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ml-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Auto-Hosting...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Auto-Host →</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ─── SLEEK SINGLE LINE COMMAND BAR (CLEAN ROUNDED-2XL) ─── */
          <>
            {/* Mode Selector Pill (Find vs Build) */}
            <div className="flex items-center bg-slate-100 dark:bg-white/[0.06] p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('find');
                  setBuildError(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'find'
                    ? 'bg-white dark:bg-white/[0.12] text-[#0099e6] shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('build');
                  setHasSearched(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'build'
                    ? 'bg-white dark:bg-white/[0.12] text-[#ea580c] shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Build</span>
              </button>
            </div>

            {/* Center: Single Line Input Field */}
            <div className="relative flex-1 min-w-0 flex items-center">
              {activeTab === 'find' ? (
                <form onSubmit={handleFindSubmit} className="w-full flex items-center">
                  <input
                    type="text"
                    value={findQuery}
                    onChange={(e) => setFindQuery(e.target.value)}
                    placeholder='Ask AI: "Best Web3 hackathons", "AI in Bangalore", "#bounties"...'
                    className="w-full bg-transparent px-2.5 py-1 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-medium"
                  />
                  {findQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setFindQuery('');
                        setHasSearched(false);
                        setMatchedEvents([]);
                        setAiRationale('');
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg mr-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>
              ) : (
                <div className="w-full flex items-center">
                  <input
                    type="text"
                    value={buildPrompt}
                    onChange={(e) => setBuildPrompt(e.target.value)}
                    placeholder='Describe hackathon to auto-create (e.g. 36h AI sprint in Bangalore, ₹2L prizes)...'
                    className="w-full bg-transparent px-2.5 py-1 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-medium"
                  />
                </div>
              )}
            </div>

            {/* Right Actions Area */}
            <div className="flex items-center gap-1.5 shrink-0 justify-end">
              {/* Build Mode Right Actions */}
              {activeTab === 'build' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="brochure-upload"
                    accept=".pdf,.doc,.docx,.txt,.md,.json,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {attachedFile ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40 text-[11px] text-[#ea580c] font-bold">
                      {attachedFile.isImage && attachedFile.dataUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={attachedFile.dataUrl} alt="Poster" className="w-3.5 h-3.5 rounded object-cover shadow-xs" />
                      ) : (
                        <FileText className="w-3 h-3" />
                      )}
                      <span className="max-w-[70px] sm:max-w-[100px] truncate">{attachedFile.name}</span>
                      <button
                        type="button"
                        onClick={removeAttachedFile}
                        className="p-0.5 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded text-orange-600 dark:text-orange-400 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload hackathon poster, image, or brochure"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.06] hover:bg-orange-50 dark:hover:bg-orange-950/40 border border-slate-200 dark:border-white/[0.1] hover:border-orange-300 dark:hover:border-orange-700/50 text-slate-600 dark:text-slate-300 hover:text-[#ea580c] dark:hover:text-[#ea580c] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Add Source</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleBuildGenerate}
                    disabled={isGenerating || (!buildPrompt.trim() && !attachedFile)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:opacity-95 disabled:opacity-50 text-white font-black text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Auto-Hosting...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Auto-Host →</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Find Mode Right Action */}
              {activeTab === 'find' && (
                <button
                  type="button"
                  onClick={() => handleFindSubmit()}
                  disabled={isSearching || !findQuery.trim()}
                  className="px-4 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] disabled:opacity-50 text-white font-black text-xs shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Find with AI</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── COMPACT SUB-ROW: SUGGESTIONS / PRESETS ─── */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap mt-2 px-2 text-center">
        {activeTab === 'find' ? (
          <>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Flame className="w-3 h-3 text-[#ea580c]" /> Try:
            </span>
            {quickTags.map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={() => {
                  setFindQuery(tag.query);
                  handleFindSubmit(undefined, tag.query);
                }}
                className="px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-white/[0.06] hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-600 dark:text-slate-300 hover:text-[#0099e6] dark:hover:text-[#0099e6] border border-slate-200/80 dark:border-white/[0.1] hover:border-sky-300 dark:hover:border-sky-700/50 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
              >
                {tag.label}
              </button>
            ))}
          </>
        ) : (
          <>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#ea580c]" /> Ideas:
            </span>
            {buildPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setBuildPrompt(preset.prompt)}
                className="px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-white/[0.06] hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-600 dark:text-slate-300 hover:text-[#ea580c] dark:hover:text-[#ea580c] border border-slate-200/80 dark:border-white/[0.1] hover:border-orange-300 dark:hover:border-orange-700/50 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
              >
                {preset.label}
              </button>
            ))}
          </>
        )}
      </div>

      {/* ─── LOADING STATUS FOR SINGLE LINE MODE ─── */}
      {!isExpandedBuild && isGenerating && buildStepMessage && (
        <div className="mt-2 p-2 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-[#ea580c] flex items-center justify-center gap-2 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{buildStepMessage}</span>
        </div>
      )}

      {/* ─── ERROR TOAST ─── */}
      {buildError && (
        <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{buildError}</span>
          </div>
          <button
            type="button"
            onClick={() => setBuildError(null)}
            className="p-1 hover:bg-rose-100 rounded text-rose-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── FIND RESULTS POPUP / EXPANSION ─── */}
      {hasSearched && (
        <div className="mt-3 bg-white dark:bg-[#0c1017] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-2xl dark:shadow-black/90 p-4 text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-2.5 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
              <Sparkles className="w-4 h-4 text-[#0099e6]" />
              <span>{aiRationale || 'Matching Hackathons'}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setHasSearched(false);
                setMatchedEvents([]);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {matchedEvents.length === 0 ? (
            <div className="py-4 text-center text-slate-400">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No hackathons matched this specific query.</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Try searching with terms like Web3, AI, or Bangalore.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {matchedEvents.map((evt) => {
                const prizeText =
                  evt.prize || (evt.totalPrizeValue ? formatCurrency(evt.totalPrizeValue) : 'Prizes');

                return (
                  <Link
                    key={evt.id}
                    href={`/hackathons/${evt.slug}`}
                    className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.04] hover:bg-sky-50 dark:hover:bg-sky-500/10 border border-slate-100 dark:border-white/[0.06] hover:border-sky-200 dark:hover:border-sky-500/30 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0099e6] to-[#0284c7] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {evt.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />
                        ) : (
                          <Trophy className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-[#0099e6] truncate">
                            {evt.title}
                          </h4>
                          <span className="px-1.5 py-0.2 rounded bg-white dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 text-[9px] font-bold border border-slate-200 dark:border-white/[0.08]">
                            {evt.mode || 'Online'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          <span className="text-[#ea580c] font-bold">{prizeText}</span>
                          <span>•</span>
                          <span className="truncate">{evt.organizerName || "Hacker's Unity"}</span>
                          {evt.location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                {evt.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#0099e6] shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
