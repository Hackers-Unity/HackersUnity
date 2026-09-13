'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Rocket,
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  X,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useEvent } from '@/lib/hooks/use-events';
import { useAuth } from '@/lib/auth-context';
import {
  fetchTeamByInviteCode,
  joinTeamSupabase,
  registerForEventSupabase,
  fetchUserTeamForEvent,
} from '@/lib/supabase-service';
import { formatDate } from '@/lib/utils';

interface TeamInvitePageProps {
  params: Promise<{ slug: string; teamCode: string }>;
}

export default function TeamInvitePage({ params }: TeamInvitePageProps) {
  const resolvedParams = use(params);
  const { slug, teamCode } = resolvedParams;
  const router = useRouter();

  const { event, loading: eventLoading } = useEvent(slug);
  const { user, supabaseUser, loading: authLoading } = useAuth();

  const [team, setTeam] = useState<any | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);

  const [joining, setJoining] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [alreadyInSquad, setAlreadyInSquad] = useState(false);
  const [inAnotherSquad, setInAnotherSquad] = useState(false);
  const [declined, setDeclined] = useState(false);

  // Load team details by inviteCode
  useEffect(() => {
    async function loadTeam() {
      if (!teamCode) return;
      setLoadingTeam(true);
      setTeamError(null);
      try {
        const res = await fetchTeamByInviteCode(slug, teamCode);
        if (res.success && res.team) {
          setTeam(res.team);
        } else {
          setTeamError(res.error || 'Invitation link is invalid or squad no longer exists.');
        }
      } catch (err: any) {
        setTeamError(err.message || 'Failed to load squad invitation details');
      } finally {
        setLoadingTeam(false);
      }
    }
    loadTeam();
  }, [slug, teamCode]);

  // Check if current user is already in this team or another team for this event
  useEffect(() => {
    const userId = supabaseUser?.id || user?.id;
    if (!userId || !team || !event) return;

    // Check if user is already a member of this team
    const isMember =
      team.leader_id === userId ||
      team.team_members?.some((m: any) => m.user_id === userId);

    if (isMember) {
      setAlreadyInSquad(true);
      return;
    }

    // Check if user is in another team for this event
    fetchUserTeamForEvent(event.id, userId).then((otherTeam) => {
      if (otherTeam && otherTeam.id !== team.id) {
        setInAnotherSquad(true);
      }
    });
  }, [team, event, supabaseUser?.id, user?.id]);

  const handleAcceptAndJoin = async () => {
    const userId = supabaseUser?.id || user?.id;
    const userEmail = supabaseUser?.email || user?.email;
    const userName =
      user?.name ||
      supabaseUser?.user_metadata?.full_name ||
      supabaseUser?.user_metadata?.name ||
      userEmail?.split('@')[0] ||
      'Squad Member';

    if (!userId) {
      // Redirect to login preserving the return URL
      const returnUrl = encodeURIComponent(`/hackathons/${slug}/register/${teamCode}`);
      router.push(`/login?redirect=${returnUrl}`);
      return;
    }

    if (!team) return;

    setJoining(true);
    setActionError(null);

    try {
      const maxMembers = team.max_members || 4;

      // 1. Join squad in database
      const joinRes = await joinTeamSupabase(team.id, userId, maxMembers, {
        name: userName,
        email: userEmail,
      });

      if (!joinRes.success) {
        setActionError(joinRes.error || 'Failed to join squad.');
        setJoining(false);
        return;
      }

      // 2. Ensure user registration is recorded
      await registerForEventSupabase({
        eventId: event?.id || team.event_id,
        userId,
        userEmail: userEmail || 'hacker@hackersunity.dev',
        userName,
        isTeam: true,
        teamName: team.name,
        role: 'Squad Member',
        status: 'CONFIRMED',
      });

      // 3. Immediately redirect to squad registration view
      router.push(`/hackathons/${slug}/register`);
    } catch (e: any) {
      setActionError(e.message || 'Failed to accept invitation');
      setJoining(false);
    }
  };

  const handleReject = () => {
    setDeclined(true);
  };

  if (eventLoading || loadingTeam || authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] bg-slate-50/60 dark:bg-[#080b11]">
        <div className="w-10 h-10 rounded-full border-3 border-[#0099e6] border-t-transparent animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading squad invitation...</p>
      </div>
    );
  }

  if (teamError || !team) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4 bg-slate-50/60 dark:bg-[#080b11]">
        <div className="max-w-md w-full bg-white dark:bg-[#0c1017] p-8 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Invalid Invitation Link</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {teamError || 'This squad invitation link does not exist or has expired.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            {event && (
              <Link
                href={`/hackathons/${slug}/register`}
                className="px-5 py-2.5 rounded-xl bg-[#0099e6] text-white text-xs font-bold shadow-md shadow-sky-500/20"
              >
                Go to Registration
              </Link>
            )}
            <Link
              href="/hackathons"
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              Explore Hackathons
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const memberList = team.team_members || [];
  const memberCount = memberList.length;
  const maxMembers = team.max_members || 4;
  const isFull = memberCount >= maxMembers;
  const leaderName = team.profiles?.name || 'Squad Leader';

  return (
    <div className="flex-1 pb-20 bg-slate-50/60 dark:bg-[#080b11] min-h-screen">
      {/* ─── Top Header ─── */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-orange-50/60 dark:from-[#0c1017] dark:via-[#080b11] dark:to-[#0c1017] border-b border-slate-200 dark:border-white/[0.08] py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4 font-semibold">
            <Link
              href={`/hackathons/${slug}`}
              className="flex items-center gap-1.5 hover:text-[#0099e6] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {event?.title || 'Hackathon'}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950/60 text-[#0099e6] dark:text-[#38bdf8] border border-sky-200 dark:border-sky-800/40">
              Squad Invitation
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {event?.title}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            You&apos;ve Been Invited to Join <span className="text-[#0099e6]">{team.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            {leaderName} invited you to team up for {event?.title || 'this hackathon'}.
          </p>
        </div>
      </div>

      {/* ─── Main Invite Card ─── */}
      <div className="max-w-xl mx-auto px-4 mt-8">
        {declined ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-xl text-center space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-500 flex items-center justify-center mx-auto">
              <X className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Invitation Declined</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You declined the invitation to join squad &quot;{team.name}&quot;. You can still create your own squad or explore other options.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <Link
                href={`/hackathons/${slug}/register`}
                className="px-5 py-2.5 rounded-xl bg-[#0099e6] text-white text-xs font-bold shadow-sm shadow-sky-500/20"
              >
                Register Individually or New Squad
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1017] border-2 border-sky-200 dark:border-sky-800/40 shadow-xl space-y-6">
            {/* Squad Hero */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0099e6] to-sky-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-sky-500/30 shrink-0">
                {team.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                    {team.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase shrink-0">
                    Squad
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                  Organized by squad lead <strong className="text-slate-700 dark:text-slate-300">{leaderName}</strong>
                </p>
                {team.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                    {team.description}
                  </p>
                )}
              </div>
            </div>

            {/* Capacity & Event Highlights */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#121824] border border-slate-200/80 dark:border-white/[0.08]">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  Squad Capacity
                </div>
                <div className="font-extrabold text-slate-900 dark:text-white mt-1 text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#0099e6]" />
                  <span>
                    {memberCount} / {maxMembers} Members
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#121824] border border-slate-200/80 dark:border-white/[0.08]">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  Remaining Slots
                </div>
                <div className="font-extrabold text-[#ea580c] mt-1 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {Math.max(0, maxMembers - memberCount)} {maxMembers - memberCount === 1 ? 'Slot' : 'Slots'} Left
                  </span>
                </div>
              </div>
            </div>

            {/* Existing Squad Members */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <span>Current Members</span>
                <span>{memberCount} Joined</span>
              </div>
              <div className="space-y-2">
                {memberList.map((m: any) => (
                  <div
                    key={m.id || m.user_id}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200/80 dark:border-white/[0.08] text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-[#0099e6] font-black text-xs flex items-center justify-center">
                        {(m.profiles?.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {m.profiles?.name || 'Teammate'}
                        </div>
                        {m.profiles?.college && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                            {m.profiles.college}
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        m.role === 'LEADER'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : 'bg-slate-200 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {m.role || 'Member'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error banner */}
            {actionError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-xs text-red-700 dark:text-red-300 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Status alerts */}
            {alreadyInSquad ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>You Are Already a Member of This Squad!</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You are officially part of {team.name}. Head to registration to view your ticket and manage your squad.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/hackathons/${slug}/register`}
                    className="inline-block px-5 py-2.5 rounded-xl bg-[#0099e6] text-white text-xs font-bold shadow-md shadow-sky-500/20"
                  >
                    View Your Squad & Pass →
                  </Link>
                </div>
              </div>
            ) : isFull ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>This Squad Has Reached Maximum Capacity</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  All {maxMembers} spots in {team.name} have been taken. You can create your own squad or join another team.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/hackathons/${slug}/register`}
                    className="inline-block px-5 py-2.5 rounded-xl bg-[#0099e6] text-white text-xs font-bold"
                  >
                    Register With Another Squad
                  </Link>
                </div>
              </div>
            ) : inAnotherSquad ? (
              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-sky-800 dark:text-sky-300">
                  <Users className="w-4 h-4 text-[#0099e6]" />
                  <span>You Are Already in Another Squad</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You are already registered with another squad for {event?.title}. You must leave that squad before joining this one.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/hackathons/${slug}/register`}
                    className="inline-block px-5 py-2.5 rounded-xl bg-[#0099e6] text-white text-xs font-bold"
                  >
                    Manage Existing Squad
                  </Link>
                </div>
              </div>
            ) : !user && !supabaseUser ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-center space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Please sign in to accept this invitation and immediately join <strong>{team.name}</strong>.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    type="button"
                    onClick={handleAcceptAndJoin}
                    className="px-6 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Sign In to Accept & Join</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              /* Two primary action buttons: Accept & Join vs Reject */
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleAcceptAndJoin}
                  disabled={joining}
                  className="flex-1 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0099e6] to-sky-600 hover:from-[#0284c7] hover:to-sky-700 text-white text-xs font-extrabold shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {joining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Joining Squad...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      <span>Accept &amp; Join Squad</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  disabled={joining}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-2xl border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
