'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Users,
  Loader2,
  ArrowLeft,
  Sparkles,
  UserPlus,
  Shield,
  Calendar,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useEvent } from '@/lib/hooks/use-events';
import { getInviteByToken, acceptTeamInvite, declineTeamInvite } from '@/lib/supabase-service';
import { AuthModal } from '@/components/auth-modal';
import { formatDate } from '@/lib/utils';

interface InvitePageProps {
  params: Promise<{ slug: string }>;
}

export default function AcceptInvitePage({ params }: InvitePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { user, supabaseUser } = useAuth();
  const { event, loading: eventLoading } = useEvent(resolvedParams.slug);

  const [invite, setInvite] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<'accepted' | 'declined' | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const userId = supabaseUser?.id || user?.id;
  const userEmail = supabaseUser?.email || user?.email;

  // Fetch invite details
  useEffect(() => {
    async function loadInvite() {
      if (!token) {
        setError('No invite token found. Please check your invite link.');
        setLoading(false);
        return;
      }

      try {
        const res = await getInviteByToken(token);
        if (res.error || !res.invite) {
          setError(res.error || 'Invite not found or has expired.');
        } else if (res.invite.status === 'ACCEPTED') {
          setResult('accepted');
          setInvite(res.invite);
        } else if (res.invite.status === 'DECLINED') {
          setResult('declined');
          setInvite(res.invite);
        } else {
          setInvite(res.invite);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load invite details.');
      } finally {
        setLoading(false);
      }
    }

    loadInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!userId) {
      setShowAuthModal(true);
      return;
    }
    if (!token) return;

    setProcessing(true);
    try {
      const res = await acceptTeamInvite(token, userId);
      if (res.success) {
        setResult('accepted');
      } else {
        setError(res.error || 'Failed to accept invite.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;

    setProcessing(true);
    try {
      const res = await declineTeamInvite(token);
      if (res.success) {
        setResult('declined');
      } else {
        setError(res.error || 'Failed to decline invite.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  // Loading state
  if (loading || eventLoading) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50/60 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#0099e6] mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading invite details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !invite) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50/60 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 text-red-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Invalid Invite</h2>
          <p className="text-sm text-slate-600">{error}</p>
          <Link
            href={`/hackathons/${resolvedParams.slug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Hackathon
          </Link>
        </div>
      </div>
    );
  }

  // Team name from invite
  const teamName = invite?.teams?.name || invite?.team_name || 'The Team';
  const invitedByName = invite?.profiles?.name || invite?.invited_by_name || 'A teammate';
  const hackathonName = event?.title || 'Hackathon';

  // Result state — accepted or declined
  if (result) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50/60 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6 animate-in zoom-in-95">
          <div
            className={`w-20 h-20 rounded-full border-2 flex items-center justify-center mx-auto shadow-sm ${
              result === 'accepted'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            {result === 'accepted' ? (
              <CheckCircle2 className="w-10 h-10" />
            ) : (
              <XCircle className="w-10 h-10" />
            )}
          </div>

          <div className="space-y-2">
            <span
              className={`inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                result === 'accepted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {result === 'accepted' ? 'Invite Accepted' : 'Invite Declined'}
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              {result === 'accepted' ? `Welcome to ${teamName}!` : 'Invite Declined'}
            </h2>
            <p className="text-sm text-slate-600">
              {result === 'accepted' ? (
                <>
                  You&apos;ve joined <strong className="text-[#0099e6]">{teamName}</strong> for{' '}
                  <strong>{hackathonName}</strong>. Head to the hackathon page or your dashboard to see your team.
                </>
              ) : (
                <>You&apos;ve declined the invite to join {teamName}. No worries — you can always register independently!</>
              )}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {result === 'accepted' && (
              <Link
                href={`/hackathons/${resolvedParams.slug}/register`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all"
              >
                Complete Registration
              </Link>
            )}
            <Link
              href={`/hackathons/${resolvedParams.slug}`}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              View Hackathon
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main invite page — show invite details + Accept/Decline buttons
  return (
    <div className="flex-1 min-h-screen bg-gradient-to-b from-sky-50/50 via-white to-slate-50/60 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white text-[#0099e6] border border-sky-200 text-xs font-bold shadow-2xs">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Squad Invite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            You&apos;ve Been Invited!
          </h1>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            <strong className="text-slate-900">{invitedByName}</strong> has invited you to join their squad for an upcoming hackathon.
          </p>
        </div>

        {/* Invite Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Team Info Header */}
          <div className="p-6 bg-gradient-to-r from-sky-50 to-white border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0099e6] to-sky-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-sky-500/30">
                {teamName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">{teamName}</h2>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Invited by {invitedByName}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Hackathon Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Trophy className="w-5 h-5 text-[#ea580c] shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">{hackathonName}</p>
                {event && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {formatDate(event.startDate)} – {formatDate(event.endDate)} • {event.location || 'Online'}
                  </p>
                )}
              </div>
            </div>

            {!userId && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                <Shield className="w-4 h-4 shrink-0 text-amber-600" />
                <span>You need to sign in or create an account to accept this invite.</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleAccept}
                disabled={processing}
                className="w-full px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Accept & Join Squad
              </button>
              <button
                onClick={handleDecline}
                disabled={processing}
                className="w-full px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                Decline Invite
              </button>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href={`/hackathons/${resolvedParams.slug}`}
            className="text-xs text-slate-500 hover:text-[#0099e6] font-medium transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to hackathon page
          </Link>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}
