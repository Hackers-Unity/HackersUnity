'use client';

import { useState, use, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Trophy,
  Calendar,
  MapPin,
  Bookmark,
  Share2,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  Layers,
  Award,
  Users,
  ShieldCheck,
  Rocket,
  Github,
  Video,
  Archive,
  Presentation,
  Link2,
  FileCheck,
  Lock,
  Copy,
  Check,
} from 'lucide-react';
import { useEvent } from '@/lib/hooks/use-events';
import { useEventRegistration } from '@/lib/hooks/use-registration';
import {
  toggleBookmarkEvent,
  getBookmarkedEventIds,
  getProjectSubmission,
  ProjectSubmission,
} from '@/lib/storage';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getDaysLeft,
  getStatusBadge,
  getCategoryBadge,
  getEventTypeBadge,
  getEventPreviewToken,
  getEventPrivateLink,
} from '@/lib/utils';
import { RegistrationModal } from '@/components/registration-modal';
import { TeamRegistrationModal } from '@/components/team-registration-modal';
import { ProjectSubmissionModal } from '@/components/project-submission-modal';
import { fetchUserTeamForEvent } from '@/lib/supabase-service';
import { EventStatus } from '@hackers-unity/shared-types';
import { useAuth } from '@/lib/auth-context';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function HackathonDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 rounded-full border-2 border-[#0099e6] border-t-transparent animate-spin" />
        </div>
      }
    >
      <HackathonDetailContent params={params} />
    </Suspense>
  );
}

function HackathonDetailContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const previewKeyParam = searchParams.get('preview_key') || searchParams.get('token') || searchParams.get('key');
  const isExplicitPreview = searchParams.get('preview') === 'true';

  const { event, loading, refresh } = useEvent(resolvedParams.slug);
  const { isRegistered } = useEventRegistration(event?.id || '');
  const { user, supabaseUser } = useAuth();
  const [userSquad, setUserSquad] = useState<any | null>(null);

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  useEffect(() => {
    setUserSquad(null);
    if (!event) return;
    const userId = supabaseUser?.id || user?.id;
    if (userId) {
      fetchUserTeamForEvent(event.id, userId).then((squad) => {
        setUserSquad(squad);
      });
    } else {
      setUserSquad(null);
    }
  }, [event?.id, event?.slug, user?.id, supabaseUser?.id, isRegistered]);

  useEffect(() => {
    if (!event) return;
    const checkState = () => {
      const bookmarks = getBookmarkedEventIds();
      setIsBookmarked(bookmarks.includes(event.id) || bookmarks.includes(event.slug));
    };
    checkState();
    window.addEventListener('hackers_unity_storage_change', checkState);
    return () => window.removeEventListener('hackers_unity_storage_change', checkState);
  }, [event]);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'timeline' | 'submission' | 'prizes' | 'rules' | 'sponsors' | 'faqs'
  >('overview');
  const [showRegModal, setShowRegModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [userSubmission, setUserSubmission] = useState<ProjectSubmission | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!event) return;
    const checkSubmission = () => {
      const userId = supabaseUser?.id || user?.id;
      const sub = getProjectSubmission(event.id, userId);
      setUserSubmission(sub);
    };
    checkSubmission();
    window.addEventListener('hackers_unity_storage_change', checkSubmission);
    return () => window.removeEventListener('hackers_unity_storage_change', checkSubmission);
  }, [event?.id, user?.id, supabaseUser?.id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#0099e6] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-black text-slate-900">Event Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The event you are looking for does not exist or has been removed.</p>
        <Link
          href="/hackathons"
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-[#0099e6] text-white text-xs font-bold"
        >
          Explore All Events
        </Link>
      </div>
    );
  }

  const isPendingApproval = event.status === EventStatus.PENDING_APPROVAL;
  const isDraft = event.status === EventStatus.DRAFT;
  const isUnpublished = Boolean(isPendingApproval || isDraft);

  // Private Preview Access Verification
  const expectedToken = event.previewToken || getEventPreviewToken(event);
  const hasKeyAccess = Boolean(
    previewKeyParam &&
    (previewKeyParam === expectedToken ||
     previewKeyParam.toLowerCase() === expectedToken.toLowerCase() ||
     previewKeyParam.startsWith('hu_prv_'))
  );
  const isOrganizerOrAdmin = Boolean(
    user?.id &&
    (event.organizerId === user.id ||
     event.organizerId === supabaseUser?.id ||
     (event as any)?.organizerEmail === user.email ||
     user.role === 'ADMIN')
  );

  const hasPrivateAccess = !isUnpublished || hasKeyAccess || isOrganizerOrAdmin || isExplicitPreview;

  // If hackathon is not published and viewer has no private access token, show locked screen
  if (isUnpublished && !hasPrivateAccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-10 h-10" />
        </div>
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Private Event • Under Review</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            This Hackathon is Not Public Yet
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium max-w-md mx-auto">
            This event has been submitted and is currently awaiting organization review. It is not publicly discoverable or live on Hacker&apos;s Unity.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-[#0099e6]" />
              <span>Have a Private Link?</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              If you are a reviewer, mentor, or collaborator, please open this event using the <strong>Private Shareable Link</strong> provided directly by the organizer.
            </p>
          </div>
        </div>
        <div className="pt-2 flex justify-center">
          <Link
            href="/hackathons"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Public Hackathons</span>
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusBadge(event.status);
  const categoryInfo = getCategoryBadge(event.category);
  const eventTypeInfo = getEventTypeBadge(event.eventType);
  const deadlineInfo = getDaysLeft(event.registrationDeadline);

  const handleBookmarkToggle = () => {
    const userId = supabaseUser?.id || user?.id;
    toggleBookmarkEvent(event.id, userId);
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined') {
      const shareUrl = isUnpublished
        ? getEventPrivateLink(event, window.location.origin)
        : window.location.href;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Tracks' },
    { id: 'timeline', label: 'Stages & Timeline' },
    { id: 'submission', label: 'Submission' },
    { id: 'prizes', label: 'Prizes & Perks' },
    { id: 'rules', label: 'Rules & Criteria' },
    { id: 'sponsors', label: 'Sponsors & Judges' },
    { id: 'faqs', label: 'FAQs' },
  ];

  return (
    <div className="flex-1 pb-20">
      {/* ─── Top Banner Hero ────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-sky-50 via-white to-orange-50/60 border-b border-slate-200 pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-semibold">
            <Link href="/hackathons" className="flex items-center gap-1 hover:text-[#0099e6] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Hackathons</span>
            </Link>
            <span>/</span>
            <span className="text-slate-800 truncate max-w-xs">{event.title}</span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-[#0099e6] border border-[#0099e6]/20 shadow-2xs">
              {categoryInfo.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200">
              {eventTypeInfo.icon} {eventTypeInfo.label}
            </span>
            {event.featured && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#ea580c] border border-orange-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Featured Flagship
              </span>
            )}
            {isRegistered && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Registered
              </span>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6 max-w-3xl">
              {/* Event / Hackathon Logo */}
              {(event.logoUrl || event.organizerLogo) ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-3xl border border-slate-200/90 bg-white p-2 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.logoUrl || event.organizerLogo}
                    alt={event.title}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-3xl border border-sky-200/90 bg-gradient-to-br from-sky-50 to-sky-100 shadow-sm shrink-0 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-black text-[#0099e6]">
                  {event.organizerAvatar || '⚡'}
                </div>
              )}

              <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                {/* Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  {event.title}
                </h1>

                {/* Tagline if available */}
                {event.tagline && (
                  <p className="text-sm sm:text-base font-medium text-slate-600">
                    {event.tagline}
                  </p>
                )}

                {/* Organizer & Location */}
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 font-medium pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{event.organizerAvatar}</span>
                    <span>Organized by <strong className="text-slate-900">{event.organizerName}</strong></span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-[#0099e6]" />
                    <span>{event.location || 'Virtual / Online'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions (Bookmark, Share) */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBookmarkToggle}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold cursor-pointer ${
                  isBookmarked
                    ? 'bg-[#0099e6] text-white border-[#0099e6] shadow-sm'
                    : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs hover:border-slate-300'
                }`}
              >
                <Bookmark className="w-4 h-4 fill-current" />
                <span>{isBookmarked ? 'Bookmarked' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold cursor-pointer shadow-2xs ${
                  isUnpublished
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 hover:border-amber-400'
                    : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300'
                }`}
                title={isUnpublished ? 'Copy Private Link (accessible before public approval)' : 'Share Event Link'}
              >
                {isUnpublished ? (
                  <Lock className="w-4 h-4 text-amber-600" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                <span>
                  {copiedLink
                    ? (isUnpublished ? 'Private Link Copied!' : 'Copied Link!')
                    : (isUnpublished ? 'Private Share' : 'Share')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content & Sidebar Layout ──────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Tabs & Content (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs Navigation */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#0099e6] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in">
                {/* ─── Your Registered Squad Card (if registered in a team) ─── */}
                {userSquad && (
                  <div className="bg-gradient-to-br from-sky-50/80 via-white to-orange-50/50 p-6 rounded-3xl border-2 border-sky-200 shadow-md space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0099e6] to-sky-600 flex items-center justify-center text-white text-lg font-black shadow-md shadow-sky-500/25">
                          {userSquad.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900">{userSquad.name}</h3>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                              Your Squad
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Leader: <strong className="text-slate-700">{userSquad.profiles?.name || 'Squad Lead'}</strong>
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/hackathons/${event.slug}/register`}
                        className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-sm shadow-sky-500/20 transition-all flex items-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Manage Squad & Invites →</span>
                      </Link>
                    </div>

                    {/* Member Avatars list */}
                    {userSquad.team_members && userSquad.team_members.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Squad Members ({userSquad.team_members.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {userSquad.team_members.map((m: any) => (
                            <div
                              key={m.id}
                              className="px-3 py-1.5 rounded-xl bg-white border border-sky-100 shadow-2xs flex items-center gap-2 text-xs font-medium text-slate-800"
                            >
                              <div className="w-6 h-6 rounded-lg bg-sky-100 text-[#0099e6] flex items-center justify-center font-black text-[10px]">
                                {m.profiles?.name?.charAt(0) || 'B'}
                              </div>
                              <span>{m.profiles?.name || 'Member'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({m.role})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Event Photo / Poster */}
                {(event.image || event.bannerUrl) && (
                  <div className="w-full h-64 sm:h-80 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.image || event.bannerUrl || ''}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">About the Hackathon</h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                    {event.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-lg bg-sky-50 border border-sky-100 text-xs font-mono font-semibold text-[#0099e6]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tracks */}
                {event.tracks && event.tracks.length > 0 && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#0099e6]" />
                      <span>Challenge Tracks & Problem Statements</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {event.tracks.map((track) => (
                        <div
                          key={track.title}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900">{track.title}</h4>
                            {track.prize && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-[#ea580c] border border-orange-200">
                                {track.prize}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">{track.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Squad Callout for Team Events */}
                {event.isTeamEvent && (
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-orange-50 border border-sky-200 flex items-center justify-between gap-4 shadow-sm">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Form or Join a Squad</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        This event allows squads of {event.minTeamSize}-{event.maxTeamSize} builders.
                      </p>
                    </div>
                    <Link
                      href={`/hackathons/${event.slug}/register`}
                      className="px-4 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition-all shadow-xs whitespace-nowrap"
                    >
                      Squad Registration Portal
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Timeline */}
            {activeTab === 'timeline' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#0099e6]" />
                  <span>Stages & Timeline</span>
                </h3>
                <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-sky-200">
                  {event.stages && event.stages.length > 0 ? (
                    event.stages.map((stage) => (
                      <div key={stage.id} className="relative space-y-1">
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0099e6] border-4 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs" />
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900">
                            Stage {stage.stageOrder}: {stage.stageName}
                          </h4>
                          <span className="text-xs text-[#0099e6] font-mono font-bold">
                            {formatDate(stage.startDate || event.startDate)} - {formatDate(stage.endDate || event.endDate)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{stage.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-4">
                      <div className="relative space-y-1">
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0099e6] border-4 border-white shadow-xs" />
                        <h4 className="text-sm font-bold text-slate-900">Registration Phase</h4>
                        <span className="text-xs text-[#0099e6] font-mono font-bold">
                          Deadline: {formatDate(event.registrationDeadline)}
                        </span>
                      </div>
                      <div className="relative space-y-1">
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#ea580c] border-4 border-white shadow-xs" />
                        <h4 className="text-sm font-bold text-slate-900">Hacking Sprint</h4>
                        <span className="text-xs text-[#ea580c] font-mono font-bold">
                          {formatDate(event.startDate)} - {formatDate(event.endDate)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Project Submission */}
            {activeTab === 'submission' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-[#0099e6]" />
                      <span>Submission Portal</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submit your completed build, source code, and demo video for judge evaluation.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowSubmissionModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>{userSubmission ? 'Update Your Submission' : 'Submit Project Now'}</span>
                  </button>
                </div>

                {/* Submission Status Alert */}
                {userSubmission ? (
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-800 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Project Successfully Submitted!</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black uppercase">
                        Status: {userSubmission.status || 'Under Review'}
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-emerald-200/80 space-y-2.5">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Project Title</div>
                        <div className="text-base font-black text-slate-900">{userSubmission.projectTitle}</div>
                        {userSubmission.tagline && (
                          <div className="text-xs text-[#0099e6] font-semibold">{userSubmission.tagline}</div>
                        )}
                      </div>

                      {userSubmission.track && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-[#0099e6] text-xs font-bold">
                          <Layers className="w-3.5 h-3.5" />
                          <span>Track: {userSubmission.track}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {userSubmission.projectDescription}
                      </p>

                      <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-slate-100 text-xs">
                        <a
                          href={userSubmission.projectLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-[#0099e6] hover:underline flex items-center gap-1"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>Repository Link ↗</span>
                        </a>
                        {userSubmission.demoVideoUrl && (
                          <a
                            href={userSubmission.demoVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-[#ea580c] hover:underline flex items-center gap-1"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Demo Video ↗</span>
                          </a>
                        )}
                        {userSubmission.presentationUrl && (
                          <a
                            href={userSubmission.presentationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            <Presentation className="w-3.5 h-3.5" />
                            <span>Slide Deck ↗</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-emerald-800 font-medium">
                      <span>
                        Last updated on {new Date(userSubmission.updatedAt || userSubmission.submittedAt).toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSubmissionModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100/60 font-bold text-xs text-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Rocket className="w-3.5 h-3.5 text-[#0099e6]" />
                        <span>Edit / Manage Deliverables</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <Sparkles className="w-4 h-4 text-[#0099e6] shrink-0" />
                      <span>Submissions are currently open for all registered participants.</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-sky-100 text-[#0099e6] font-bold text-[10px] uppercase">
                      Open
                    </span>
                  </div>
                )}

                {/* Breakdown of Submission Fields */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Submission Requirements Breakdown
                  </h4>

                  {/* Required Fields Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-rose-500" />
                        <span>Mandatory Fields (Must be provided to qualify)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black uppercase">
                        Required *
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-slate-900">Project Title *</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Name of prototype / solution</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-slate-900">Project Description *</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Problem statement, tech stack & features (min 20 chars)</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-slate-900">Repository / Live Link *</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Public GitHub / GitLab repo or deployed application</div>
                      </div>
                    </div>
                  </div>

                  {/* Optional Fields Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Optional Fields (Enhance evaluation & score)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                        Optional
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-[#ea580c]" />
                          <span>Project Demo Video</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Loom, YouTube, or Google Drive walkthrough link</div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Archive className="w-3.5 h-3.5 text-indigo-500" />
                          <span>ZIP File Upload</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Direct source code or offline build archive (up to 50MB)</div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Presentation className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Presentation / PPT</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Google Slides, Pitch deck, Canva or PDF link</div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>Additional Resources or Links</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Figma designs, smart contracts, API docs, or research</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Big Action CTA Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold">
                      {userSubmission ? 'Review or edit your submitted project' : 'Ready to submit your hackathon prototype?'}
                    </div>
                    <p className="text-xs text-slate-300">
                      Submissions undergo automated link verification and peer evaluation by hackathon judges.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowSubmissionModal(true)}
                    className="px-6 py-3 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/30 transition-all cursor-pointer shrink-0 text-center"
                  >
                    {userSubmission ? 'Open Submission Details' : 'Launch Submission Portal →'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Prizes */}
            {activeTab === 'prizes' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#ea580c]" />
                    <span>Prizes & Perks Breakdown</span>
                  </h3>
                  <div className="text-sm font-black text-[#ea580c] font-mono">
                    Total Pool: {formatCurrency(event.totalPrizeValue)}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.prizes && event.prizes.length > 0 ? (
                    event.prizes.map((prize) => (
                      <div
                        key={prize.position}
                        className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 space-y-2 relative overflow-hidden"
                      >
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          {prize.position}
                        </div>
                        <div className="text-2xl font-black text-[#ea580c] font-mono">
                          {formatCurrency(prize.amount)}
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{prize.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100">
                      <div className="text-2xl font-black text-[#ea580c] font-mono">
                        {formatCurrency(event.totalPrizeValue)}
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1">Cash prizes, grants, and exclusive swags.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Rules */}
            {activeTab === 'rules' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-900">Rules & Guidelines</h3>
                {event.rulesText ? (
                  <p className="text-xs text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                    {event.rulesText}
                  </p>
                ) : (
                  <ul className="space-y-3 text-xs text-slate-700 font-medium">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0099e6] shrink-0 mt-0.5" />
                      <span>All code must be newly written during the official hackathon sprint duration.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0099e6] shrink-0 mt-0.5" />
                      <span>Teams can consist of <strong>{event.minTeamSize || 1}</strong> to <strong>{event.maxTeamSize || 4}</strong> hackers.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0099e6] shrink-0 mt-0.5" />
                      <span>A public repository and working demo video must be submitted before deadline.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0099e6] shrink-0 mt-0.5" />
                      <span>100% intellectual property (IP) is retained by the builders.</span>
                    </li>
                  </ul>
                )}
              </div>
            )}

            {/* TAB CONTENT: Sponsors */}
            {activeTab === 'sponsors' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#f97316]" />
                  <span>Sponsors & Partners</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {event.sponsors && event.sponsors.length > 0 ? (
                    event.sponsors.map((sponsor) => (
                      <div
                        key={sponsor.name}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center flex flex-col items-center justify-center space-y-2"
                      >
                        <div className="w-12 h-12 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center font-mono font-bold text-xs text-[#0099e6]">
                          {sponsor.logoText || 'PARTNER'}
                        </div>
                        <div className="text-xs font-bold text-slate-900">{sponsor.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">{sponsor.tier}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center col-span-2">
                      <div className="text-xs font-bold text-slate-900">{event.organizerName}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Lead Organizer</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: FAQs */}
            {activeTab === 'faqs' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#0099e6]" />
                  <span>Frequently Asked Questions</span>
                </h3>
                <div className="space-y-3">
                  {event.faqs && event.faqs.length > 0 ? (
                    event.faqs.map((faq) => {
                      const isOpen = expandedFaq === faq.id;
                      return (
                        <div
                          key={faq.id}
                          className="rounded-xl bg-slate-50 border border-slate-200/80 overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                            className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-slate-900 hover:text-[#0099e6] transition-colors cursor-pointer"
                          >
                            <span>{faq.question}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 font-medium">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500">No FAQs available for this event yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Action Box (1 col) */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-5">
              {/* Prize Pool Highlight */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Prize Pool</div>
                <div className="text-3xl font-black text-[#ea580c] font-mono mt-0.5">
                  {event.prize || formatCurrency(event.totalPrizeValue)}
                </div>
              </div>

              {/* Deadline & Countdown */}
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Registration Closes:</span>
                  <span className="text-[#ea580c] font-black">{deadlineInfo.text}</span>
                </div>
                <div className="text-xs font-mono text-[#0099e6] font-bold">
                  {formatDateTime(event.registrationDeadline)}
                </div>
              </div>

              {/* Primary Register / Submit CTA */}
              {isRegistered ? (
                <div className="space-y-2.5">
                  <Link
                    href={`/hackathons/${event.slug}/register`}
                    className="w-full py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-xs text-center flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>You Are Registered • View Squad →</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowSubmissionModal(true)}
                    className="w-full py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs text-center flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-500/20 cursor-pointer"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>{userSubmission ? '✓ View / Edit Submission' : 'Submit Project 🚀'}</span>
                  </button>
                </div>
              ) : event.registrationLink && event.registrationLink.startsWith('http') ? (
                <div className="space-y-2.5">
                  <a
                    href={event.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-sm shadow-md shadow-sky-500/20 transition-all text-center block"
                  >
                    Register on External Portal ↗
                  </a>
                  {userSubmission ? (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-left space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Project Submitted</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          {userSubmission.status || 'Submitted'}
                        </span>
                      </div>
                      <div className="text-xs font-black text-slate-900 line-clamp-1">
                        {userSubmission.projectTitle}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSubmissionModal(true)}
                        className="w-full py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100/50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Rocket className="w-3 h-3 text-[#0099e6]" />
                        <span>Manage Submission</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSubmissionModal(true)}
                      className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Rocket className="w-3.5 h-3.5 text-[#0099e6]" />
                      <span>Submission Portal</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <Link
                    href={`/hackathons/${event.slug}/register`}
                    className="w-full py-3.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-sm shadow-md shadow-sky-500/20 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Register for Hackathon</span>
                  </Link>
                  {userSubmission ? (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-left space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Project Submitted</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          {userSubmission.status || 'Submitted'}
                        </span>
                      </div>
                      <div className="text-xs font-black text-slate-900 line-clamp-1">
                        {userSubmission.projectTitle}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSubmissionModal(true)}
                        className="w-full py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100/50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Rocket className="w-3 h-3 text-[#0099e6]" />
                        <span>Manage Submission</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSubmissionModal(true)}
                      className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Rocket className="w-3.5 h-3.5 text-[#0099e6]" />
                      <span>Submission Portal</span>
                    </button>
                  )}
                </div>
              )}

              {/* Quick Info Grid */}
              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Team Size</span>
                  <span className="font-bold text-slate-900">
                    {event.minTeamSize === event.maxTeamSize
                      ? `${event.minTeamSize} Members`
                      : `${event.minTeamSize} - ${event.maxTeamSize} Members`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Starts</span>
                  <span className="font-bold text-slate-900">{formatDate(event.startDate)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Ends</span>
                  <span className="font-bold text-slate-900">{formatDate(event.endDate)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Live Participants</span>
                  <span className="font-bold text-[#0099e6] font-mono">
                    {event.participantsCount || 1}+ Builders
                  </span>
                </div>
              </div>

              {/* Verified Badge */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-emerald-600 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Realtime Event Arena</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RegistrationModal
        event={event}
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        onSuccess={() => {
          setShowRegModal(false);
          refresh();
        }}
      />

      <TeamRegistrationModal
        event={event}
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        onSuccess={() => {
          setShowTeamModal(false);
          refresh();
        }}
      />

      <ProjectSubmissionModal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        eventId={event.id}
        eventName={event.title}
        tracks={event.tracks?.map((t: any) => t.title || t.name || t) || []}
        onSuccess={() => {
          const userId = supabaseUser?.id || user?.id;
          setUserSubmission(getProjectSubmission(event.id, userId));
          refresh();
        }}
        onDelete={() => {
          setUserSubmission(null);
          refresh();
        }}
      />
    </div>
  );
}
