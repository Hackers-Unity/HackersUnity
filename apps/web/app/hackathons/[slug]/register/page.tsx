'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  User,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Rocket,
  Github,
  Linkedin,
  MapPin,
  Calendar,
  Trophy,
  ArrowRight,
  Sparkles,
  Check,
  Copy,
  Send,
  Mail,
  UserPlus,
  Share2,
  Clock,
  Loader2,
  Trash2,
  Lock,
  UserMinus,
  Search,
} from 'lucide-react';
import { useEvent } from '@/lib/hooks/use-events';
import { useAuth } from '@/lib/auth-context';
import { useEventTeams } from '@/lib/hooks/use-registration';
import {
  registerForEventSupabase,
  fetchTeamWithMembers,
  checkUserRegistration,
  fetchUserTeamForEvent,
  deleteTeamSupabase,
  removeTeamMemberSupabase,
  fetchTeamByInviteCode,
} from '@/lib/supabase-service';
import { formatCurrency, formatDate, formatDateTime, getDaysLeft } from '@/lib/utils';
import { EventStatus } from '@hackers-unity/shared-types';
import { removeRegistrationForEvent } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

interface RegisterPageProps {
  params: Promise<{ slug: string }>;
}

type RegistrationMode = 'CREATE_TEAM' | 'JOIN_TEAM' | 'SOLO';

export default function HackathonRegistrationPage({ params }: RegisterPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { event, loading: eventLoading } = useEvent(resolvedParams.slug);
  const { user, supabaseUser } = useAuth();
  const { teams, loading: teamsLoading, createTeam, joinTeam, refresh: refreshTeams } = useEventTeams(event?.id || '');

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<RegistrationMode>('SOLO');

  // Step 1: Team state
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Join by Invitation Link state
  const [joinInviteLink, setJoinInviteLink] = useState('');
  const [resolvingLink, setResolvingLink] = useState(false);
  const [resolvedSquadFromLink, setResolvedSquadFromLink] = useState<any | null>(null);
  const [linkResolveError, setLinkResolveError] = useState<string | null>(null);

  // Step 3: Squad Invitation State
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null);
  const [createdTeamData, setCreatedTeamData] = useState<any | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [inviteErrorMsg, setInviteErrorMsg] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [showDeleteSquadModal, setShowDeleteSquadModal] = useState(false);
  const [deletingSquad, setDeletingSquad] = useState(false);

  // Step 2: Participant details (Pre-filled from auth profile)
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [githubUrl, setGithubUrl] = useState(user?.socialLinks?.github || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.socialLinks?.linkedin || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [college, setCollege] = useState(user?.college || user?.organization || '');
  const [city, setCity] = useState('');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [portfolioUrl, setPortfolioUrl] = useState(user?.socialLinks?.portfolio || '');
  const [resumeUrl, setResumeUrl] = useState('');
  const [discordHandle, setDiscordHandle] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [tshirtSize, setTshirtSize] = useState('L');
  const [dietaryPreference, setDietaryPreference] = useState('Veg');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [agreeRules, setAgreeRules] = useState(true);

  const isFieldEnabled = (fieldId: string) => {
    if (!event) return true;
    if (!event.registrationFields || !Array.isArray(event.registrationFields) || event.registrationFields.length === 0) {
      return ['name', 'email', 'phone', 'college', 'city', 'github', 'linkedin', 'skills'].includes(fieldId);
    }
    return event.registrationFields.map((f: string) => f.toLowerCase()).includes(fieldId.toLowerCase());
  };

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredRole, setRegisteredRole] = useState('');

  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

  // Update profile defaults when user loads
  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.name || '');
      if (!email) setEmail(user.email || '');
      if (!githubUrl) setGithubUrl(user.socialLinks?.github || '');
      if (!linkedinUrl) setLinkedinUrl(user.socialLinks?.linkedin || '');
      if (!phone) setPhone(user.phone || '');
      if (!college) setCollege(user.college || user.organization || '');
      if (!skills && user.skills?.length) setSkills(user.skills.join(', '));
    }
  }, [user]);

  // Check if user is already registered for this event — if so, jump to Step 3 with squad details!
  useEffect(() => {
    if (!event) return;
    const currentEvent = event;
    const userId = supabaseUser?.id || user?.id;
    const userEmail = supabaseUser?.email || user?.email;

    // Reset state for the current event first to prevent previous event state bleed
    setIsAlreadyRegistered(false);
    setCreatedTeamId(null);
    setCreatedTeamData(null);
    setTeamName('');
    setRegisteredRole('');
    setCurrentStep(1);

    if (!userId && !userEmail) return;

    async function checkExisting() {
      try {
        // 1. Check if user already has a squad for this event ID or slug
        const squad =
          (await fetchUserTeamForEvent(currentEvent.id, userId || '')) ||
          (await fetchUserTeamForEvent(currentEvent.slug, userId || ''));

        if (squad) {
          setIsAlreadyRegistered(true);
          setCreatedTeamId(squad.id);
          setCreatedTeamData(squad);
          setTeamName(squad.name);
          setRegisteredRole(
            squad.leader_id === userId ? `Squad Leader (${squad.name})` : `Squad Member (${squad.name})`
          );
          setMode(squad.leader_id === userId ? 'CREATE_TEAM' : 'JOIN_TEAM');
          setCurrentStep(3);
          return;
        }

        // 2. Check registration record
        const reg = await checkUserRegistration(currentEvent.id, userId, userEmail);
        if (reg.isRegistered && reg.registration) {
          // If the registration was marked as a team, but the team no longer exists (squad was deleted):
          if (reg.registration.is_team) {
            // Delete orphaned registration record so it never continues showing deleted team!
            try {
              await supabase.from('registrations').delete().eq('id', reg.registration.id);
            } catch {}
            removeRegistrationForEvent(currentEvent.id);
            setIsAlreadyRegistered(false);
            setCreatedTeamId(null);
            setCreatedTeamData(null);
            setTeamName('');
            setRegisteredRole('');
            setCurrentStep(1);
            return;
          }

          setIsAlreadyRegistered(true);
          if (reg.registration.user_name) setFullName(reg.registration.user_name);
          setRegisteredRole(
            reg.registration.role || 'Individual Hacker'
          );
          setCurrentStep(3);
          return;
        }

        // 3. Not registered & no squad
        setIsAlreadyRegistered(false);
        setCreatedTeamId(null);
        setCreatedTeamData(null);
        setTeamName('');
        setRegisteredRole('');
        setCurrentStep(1);
      } catch (e) {
        console.warn('Error checking existing registration:', e);
      }
    }

    checkExisting();
  }, [event?.id, event?.slug, user?.id, user?.email, supabaseUser?.id, supabaseUser?.email]);

  // Set default mode based on event config
  useEffect(() => {
    if (event && !isAlreadyRegistered) {
      const minTeamSize = event.minTeamSize || 1;
      const isSoloAllowed = minTeamSize <= 1 && (!event.isTeamEvent || minTeamSize === 1);
      if (!isSoloAllowed) {
        setMode('CREATE_TEAM');
      } else {
        setMode('SOLO');
      }
    }
  }, [event, isAlreadyRegistered]);

  if (eventLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-9 h-9 rounded-full border-3 border-[#0099e6] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-black text-slate-900">Event Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The event you are trying to register for does not exist.</p>
        <Link
          href="/hackathons"
          className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#0099e6] text-white text-xs font-bold"
        >
          Explore All Hackathons
        </Link>
      </div>
    );
  }
 
  if (!isAlreadyRegistered && (event.status === EventStatus.COMPLETED || event.status === EventStatus.REGISTRATION_CLOSED)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] flex items-center justify-center mx-auto mb-4 text-slate-500">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Registration Closed</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          {event.status === EventStatus.COMPLETED
            ? 'This hackathon has concluded and registrations are no longer being accepted.'
            : 'Registrations for this hackathon have closed.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href={`/hackathons/${event.slug}`}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
          >
            View Hackathon Overview
          </Link>
          <Link
            href="/hackathons"
            className="px-5 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20"
          >
            Explore Other Hackathons
          </Link>
        </div>
      </div>
    );
  }

  const deadlineInfo = getDaysLeft(event.registrationDeadline);
  const minTeam = event.minTeamSize || 1;
  const maxTeam = event.maxTeamSize || 4;
  const isSoloAllowed = minTeam <= 1 && (!event.isTeamEvent || minTeam === 1);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'SOLO' && !isSoloAllowed) {
      setErrorMsg(`Solo participation is not allowed for this hackathon. Minimum squad size is ${minTeam} members.`);
      return;
    }
    if (mode === 'CREATE_TEAM' && !teamName.trim()) {
      setErrorMsg('Please enter a team name to create your squad.');
      return;
    }
    if (mode === 'JOIN_TEAM' && !selectedTeamId) {
      setErrorMsg('Please select a squad from the list to join.');
      return;
    }

    setCurrentStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Email address is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }
    if (!agreeRules) {
      setErrorMsg('Please agree to the Code of Conduct and event rules.');
      return;
    }

    setSubmitting(true);

    try {
      const userId = supabaseUser?.id || user?.id || null;
      const userEmail = email.trim();
      const approvalMode = event.approvalMode || 'AUTO';
      const status = approvalMode === 'AUTO' ? 'CONFIRMED' : 'PENDING';

      if (mode === 'CREATE_TEAM') {
        // 1. Create team
        const teamRes = await createTeam(teamName.trim(), maxTeam, teamDescription.trim(), {
          name: fullName.trim(),
          email: userEmail,
          phone: phone.trim() || undefined,
          college: college.trim() || undefined,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        });
        if (!teamRes.success) {
          setErrorMsg(teamRes.error || 'Failed to create squad.');
          setSubmitting(false);
          return;
        }

        if (teamRes.team?.id) {
          setCreatedTeamId(teamRes.team.id);
          fetchTeamWithMembers(teamRes.team.id).then((t) => setCreatedTeamData(t));
        }

        // 2. Register leader
        const regRes = await registerForEventSupabase({
          eventId: event.id,
          eventName: event.title,
          userId,
          userEmail,
          userName: fullName.trim(),
          phone: phone.trim() || undefined,
          college: college.trim() || undefined,
          city: city.trim() || undefined,
          githubUrl: githubUrl.trim() || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          customAnswers,
          isTeam: true,
          teamName: teamName.trim(),
          role: 'Squad Leader',
          status,
        } as any);

        if (!regRes.success) {
          setErrorMsg(regRes.error || 'Registration failed.');
          setSubmitting(false);
          return;
        }

        setRegisteredRole(`Squad Leader (${teamName.trim()})`);
      } else if (mode === 'JOIN_TEAM') {
        if (!selectedTeamId) {
          setErrorMsg('Please select a squad.');
          setSubmitting(false);
          return;
        }

        // 1. Join team
        const joinRes = await joinTeam(selectedTeamId, maxTeam, {
          name: fullName.trim(),
          email: userEmail,
        });
        if (!joinRes.success) {
          setErrorMsg(joinRes.error || 'Failed to join squad.');
          setSubmitting(false);
          return;
        }

        const teamObj = teams.find((t) => t.id === selectedTeamId) || resolvedSquadFromLink;
        if (selectedTeamId) {
          setCreatedTeamId(selectedTeamId);
          setCreatedTeamData(teamObj);
        }

        // 2. Register member
        const regRes = await registerForEventSupabase({
          eventId: event.id,
          eventName: event.title,
          userId,
          userEmail,
          userName: fullName.trim(),
          phone: phone.trim() || undefined,
          college: college.trim() || undefined,
          city: city.trim() || undefined,
          githubUrl: githubUrl.trim() || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          customAnswers,
          isTeam: true,
          teamName: teamObj?.name || 'Squad Member',
          role: 'Squad Member',
          status,
        } as any);

        if (!regRes.success) {
          setErrorMsg(regRes.error || 'Registration failed.');
          setSubmitting(false);
          return;
        }

        setRegisteredRole(`Squad Member (${teamObj?.name || 'Squad'})`);
      } else {
        // Solo registration
        const regRes = await registerForEventSupabase({
          eventId: event.id,
          eventName: event.title,
          userId,
          userEmail,
          userName: fullName.trim(),
          phone: phone.trim() || undefined,
          college: college.trim() || undefined,
          city: city.trim() || undefined,
          githubUrl: githubUrl.trim() || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          customAnswers,
          isTeam: false,
          role: 'Solo Builder',
          status,
        } as any);

        if (!regRes.success) {
          setErrorMsg(regRes.error || 'Registration failed.');
          setSubmitting(false);
          return;
        }

        setRegisteredRole('Solo Builder');
      }

      await refreshTeams();
      setCurrentStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const getShareableInviteLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hackersunity.com';
    const teamCode =
      createdTeamData?.invite_token ||
      (createdTeamData?.name || teamName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    return `${origin}/hackathons/${event.slug}/register/${teamCode}/`;
  };

  const handleCopyLink = () => {
    const link = getShareableInviteLink();
    navigator.clipboard.writeText(link);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleDeleteSquad = async () => {
    const userId = supabaseUser?.id || user?.id;
    if (!createdTeamId || !userId) return;
    setDeletingSquad(true);
    try {
      const res = await deleteTeamSupabase(createdTeamId, userId, event.id);
      if (res.success) {
        setCreatedTeamId(null);
        setCreatedTeamData(null);
        setTeamName('');
        setShowDeleteSquadModal(false);
        setIsAlreadyRegistered(false);
        setSelectedTeamId(null);
        setResolvedSquadFromLink(null);
        setJoinInviteLink('');
        setCurrentStep(1);
      } else {
        setInviteErrorMsg(res.error || 'Failed to delete squad');
      }
    } catch (e: any) {
      setInviteErrorMsg(e.message || 'Failed to delete squad');
    } finally {
      setDeletingSquad(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    const userId = supabaseUser?.id || user?.id;
    if (!createdTeamId || !userId || !memberUserId) return;
    if (confirm('Are you sure you want to remove this member from your squad?')) {
      setRemovingMemberId(memberUserId);
      setInviteErrorMsg(null);
      setInviteSuccessMsg(null);
      try {
        const res = await removeTeamMemberSupabase(createdTeamId, memberUserId, userId);
        if (res.success) {
          setInviteSuccessMsg('Member removed successfully.');
          const updatedTeam = await fetchUserTeamForEvent(event.id, userId);
          setCreatedTeamData(updatedTeam);
        } else {
          setInviteErrorMsg(res.error || 'Failed to remove member');
        }
      } catch (err: any) {
        setInviteErrorMsg(err.message || 'Failed to remove member');
      } finally {
        setRemovingMemberId(null);
      }
    }
  };

  const handleResolveInviteLink = async () => {
    if (!joinInviteLink.trim()) {
      setLinkResolveError('Please enter an invitation link or team code.');
      return;
    }
    setResolvingLink(true);
    setLinkResolveError(null);
    setResolvedSquadFromLink(null);
    setSelectedTeamId(null);
    try {
      let code = joinInviteLink.trim();
      try {
        if (code.includes('http://') || code.includes('https://')) {
          const urlObj = new URL(code);
          const parts = urlObj.pathname.split('/').filter(Boolean);
          const regIndex = parts.indexOf('register');
          if (regIndex !== -1 && parts[regIndex + 1]) {
            code = parts[regIndex + 1];
          } else {
            code = parts[parts.length - 1];
          }
        }
      } catch (e) {
        // Not a URL, use raw string
      }
      code = code.replace(/^\/+|\/+$/g, '');

      const res = await fetchTeamByInviteCode(event.slug || event.id, code);
      if (res.success && res.team) {
        setResolvedSquadFromLink(res.team);
        setSelectedTeamId(res.team.id);
      } else {
        setLinkResolveError(res.error || 'Squad not found with this invitation link. Please check and try again.');
      }
    } catch (err: any) {
      setLinkResolveError(err.message || 'Failed to resolve invitation link.');
    } finally {
      setResolvingLink(false);
    }
  };

  return (
    <div className="flex-1 pb-20 bg-slate-50/60 dark:bg-[#080b11] min-h-screen">
      {/* ─── Hero / Header ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-orange-50/60 dark:from-[#0c1017] dark:via-[#080b11] dark:to-[#0c1017] border-b border-slate-200 dark:border-white/[0.08] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4 font-semibold">
            <Link
              href={`/hackathons/${event.slug}`}
              className="flex items-center gap-1.5 hover:text-[#0099e6] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {event.title}</span>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              {(event.logoUrl || event.organizerLogo) ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/[0.1] bg-white dark:bg-[#121824] p-1.5 shadow-xs shrink-0 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.logoUrl || event.organizerLogo}
                    alt={event.title}
                    className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl border border-sky-200/90 dark:border-sky-800/50 bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/40 dark:to-sky-900/20 shadow-xs shrink-0 flex items-center justify-center text-2xl sm:text-3xl font-black text-[#0099e6]">
                  {event.organizerAvatar || '⚡'}
                </div>
              )}

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white dark:bg-[#0c1017] text-[#0099e6] border border-sky-200 dark:border-sky-800/50 text-xs font-bold mb-2 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" />
                  <span>Registration Portal</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Register for {event.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  Organized by <strong className="text-slate-900 dark:text-white">{event.organizerName}</strong> • {event.location || 'Online Arena'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white dark:bg-[#0c1017] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-2xs text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Prize Pool</div>
                <div className="text-lg font-black text-[#ea580c] font-mono">
                  {event.prize || formatCurrency(event.totalPrizeValue)}
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between max-w-xl mx-auto">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  currentStep === 1
                    ? 'bg-[#0099e6] text-white ring-4 ring-sky-100 dark:ring-sky-950'
                    : currentStep > 1
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-white/[0.1] text-slate-600 dark:text-slate-400'
                }`}
              >
                {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className={`text-xs font-bold ${currentStep === 1 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                1. Squad Mode
              </span>
            </div>

            <div className="flex-1 h-0.5 mx-4 bg-slate-200 dark:bg-white/[0.1]">
              <div
                className="h-full bg-[#0099e6] transition-all duration-300"
                style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
              />
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  currentStep === 2
                    ? 'bg-[#0099e6] text-white ring-4 ring-sky-100 dark:ring-sky-950'
                    : currentStep > 2
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-white/[0.1] text-slate-600 dark:text-slate-400'
                }`}
              >
                {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span className={`text-xs font-bold ${currentStep === 2 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                2. Builder Details
              </span>
            </div>

            <div className="flex-1 h-0.5 mx-4 bg-slate-200 dark:bg-white/[0.1]">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: currentStep === 3 ? '100%' : '0%' }}
              />
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  currentStep === 3
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
                    : 'bg-slate-200 dark:bg-white/[0.1] text-slate-600 dark:text-slate-400'
                }`}
              >
                3
              </div>
              <span className={`text-xs font-bold ${currentStep === 3 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                3. Confirmed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Form Container ────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        <div className="bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xl overflow-hidden">
          {errorMsg && (
            <div className="m-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-400 font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ═════════ STEP 1: PARTICIPATION MODE ═════════ */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Next} className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Choose How You Want to Participate</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Select whether you want to create a new squad as a team lead, join an open team, or hack solo.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Option 1: Create a Team */}
                {event.isTeamEvent && (
                  <div
                    onClick={() => {
                      setMode('CREATE_TEAM');
                      setErrorMsg(null);
                    }}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      mode === 'CREATE_TEAM'
                        ? 'border-[#0099e6] bg-sky-50/50 dark:bg-sky-950/30 shadow-md ring-2 ring-[#0099e6]/20'
                        : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] bg-white dark:bg-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/50 border border-sky-200 dark:border-sky-800 text-[#0099e6] flex items-center justify-center shrink-0">
                          <PlusCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create a New Squad</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 dark:bg-sky-950/50 text-[#0099e6]">
                              Team Leader
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            Form your team now. You can invite your friends or let other builders apply to join.
                            (Squad size: {minTeam}-{maxTeam} members).
                          </p>
                        </div>
                      </div>

                      <input
                        type="radio"
                        name="mode"
                        checked={mode === 'CREATE_TEAM'}
                        onChange={() => setMode('CREATE_TEAM')}
                        className="w-4 h-4 text-[#0099e6] mt-1"
                      />
                    </div>

                    {mode === 'CREATE_TEAM' && (
                      <div className="mt-5 pt-4 border-t border-sky-100 dark:border-sky-900/40 space-y-3 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Squad Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. CyberVanguard, NeuralNodes, CodeCrafters"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white dark:bg-[#121824] border border-slate-300 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Squad Tagline / Focus (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Building NextGen Autonomous AI Agents"
                            value={teamDescription}
                            onChange={(e) => setTeamDescription(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-[#121824] border border-slate-300 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Option 2: Join an Existing Team */}
                {event.isTeamEvent && (
                  <div
                    onClick={() => {
                      setMode('JOIN_TEAM');
                      setErrorMsg(null);
                    }}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      mode === 'JOIN_TEAM'
                        ? 'border-[#0099e6] bg-sky-50/50 dark:bg-sky-950/30 shadow-md ring-2 ring-[#0099e6]/20'
                        : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] bg-white dark:bg-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Join an Existing Squad</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                              {teams.length} Open Squads
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            Join an already created squad or connect with builders looking for teammates.
                          </p>
                        </div>
                      </div>

                      <input
                        type="radio"
                        name="mode"
                        checked={mode === 'JOIN_TEAM'}
                        onChange={() => setMode('JOIN_TEAM')}
                        className="w-4 h-4 text-[#0099e6] mt-1"
                      />
                    </div>

                    {mode === 'JOIN_TEAM' && (
                      <div className="mt-5 pt-4 border-t border-purple-100 dark:border-purple-800/30 space-y-4 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Enter Squad Invitation Link or Team Code *
                          </label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={joinInviteLink}
                                onChange={(e) => {
                                  setJoinInviteLink(e.target.value);
                                  setLinkResolveError(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleResolveInviteLink();
                                  }
                                }}
                                placeholder={`https://hackersunity.com/hackathons/${event.slug}/register/... or team-code`}
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#121824] text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 focus:border-purple-500 outline-none transition-all"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleResolveInviteLink}
                              disabled={resolvingLink || !joinInviteLink.trim()}
                              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-purple-500/20 disabled:opacity-50 transition-all cursor-pointer shrink-0"
                            >
                              {resolvingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>Verify Link</span>
                            </button>
                          </div>

                          {linkResolveError && (
                            <p className="mt-2 text-xs text-red-500 flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{linkResolveError}</span>
                            </p>
                          )}

                          {resolvedSquadFromLink && (
                            <div className="mt-3 p-3.5 rounded-xl border-2 border-emerald-500/80 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{resolvedSquadFromLink.name}</h4>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Verified Squad
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 font-semibold">
                                    {((resolvedSquadFromLink.team_members?.length || 0) + 1)}/{maxTeam} Members
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Leader: {resolvedSquadFromLink.profiles?.name || 'Squad Leader'} {resolvedSquadFromLink.description && `• ${resolvedSquadFromLink.description}`}
                                </p>
                              </div>
                              <input
                                type="radio"
                                name="selectedSquad"
                                checked={selectedTeamId === resolvedSquadFromLink.id}
                                onChange={() => setSelectedTeamId(resolvedSquadFromLink.id)}
                                className="text-emerald-600 w-4 h-4"
                              />
                            </div>
                          )}
                        </div>

                        {teams.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              Or choose from open squads:
                            </label>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {teams.map((t) => {
                                const memberCount = (t.team_members?.length || 0) + 1;
                                const isFull = memberCount >= maxTeam;
                                const isSelected = selectedTeamId === t.id;

                                return (
                                  <div
                                    key={t.id}
                                    onClick={() => !isFull && setSelectedTeamId(t.id)}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                      isFull
                                        ? 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] opacity-60 cursor-not-allowed'
                                        : isSelected
                                        ? 'bg-white dark:bg-[#121824] border-[#0099e6] shadow-sm ring-1 ring-[#0099e6]'
                                        : 'bg-white dark:bg-[#121824] border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</h4>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 font-semibold">
                                          {memberCount}/{maxTeam} Members
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Leader: {t.profiles?.name || 'Builder'} {t.description && `• ${t.description}`}
                                      </p>
                                    </div>
                                    <input
                                      type="radio"
                                      name="selectedSquad"
                                      checked={isSelected}
                                      disabled={isFull}
                                      onChange={() => setSelectedTeamId(t.id)}
                                      className="text-[#0099e6]"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Option 3: Solo Participant */}
                <div
                  onClick={() => {
                    if (!isSoloAllowed) {
                      setErrorMsg(
                        `Solo participation is locked. This hackathon requires squads with a minimum of ${minTeam} builders.`
                      );
                      return;
                    }
                    setMode('SOLO');
                    setErrorMsg(null);
                  }}
                  className={`p-5 rounded-2xl border-2 transition-all relative ${
                    !isSoloAllowed
                      ? 'border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] opacity-60 cursor-not-allowed select-none'
                      : mode === 'SOLO'
                      ? 'border-[#0099e6] bg-sky-50/50 dark:bg-sky-950/30 shadow-md ring-2 ring-[#0099e6]/20 cursor-pointer'
                      : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] bg-white dark:bg-transparent cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
                          !isSoloAllowed
                            ? 'bg-slate-200/80 dark:bg-white/[0.06] border-slate-300 dark:border-white/[0.1] text-slate-400 dark:text-slate-500'
                            : 'bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {!isSoloAllowed ? <Lock className="w-6 h-6" /> : <User className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">Solo Participant / Individual Hacker</h3>
                          {!isSoloAllowed ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 flex items-center gap-1 border border-rose-200 dark:border-rose-800/40">
                              <Lock className="w-3 h-3" />
                              <span>Locked (Min {minTeam} Builders)</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                              Solo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {!isSoloAllowed
                            ? `This hackathon requires team participation (minimum ${minTeam} members). Solo submissions are not permitted by the organizer.`
                            : 'Participate on your own. You can build, ship, and submit your project independently.'}
                        </p>
                      </div>
                    </div>

                    <input
                      type="radio"
                      name="mode"
                      checked={mode === 'SOLO'}
                      disabled={!isSoloAllowed}
                      onChange={() => isSoloAllowed && setMode('SOLO')}
                      className="w-4 h-4 text-[#0099e6] mt-1 disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              {/* Next CTA */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
                <Link
                  href={`/hackathons/${event.slug}`}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Builder Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ═════════ STEP 2: PARTICIPANT DETAILS & SOCIALS ═════════ */}
          {currentStep === 2 && (
            <form onSubmit={handleFinalSubmit} className="p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Builder Profile & Required Details</h2>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] border border-sky-200 dark:border-sky-800/50">
                    {mode === 'CREATE_TEAM'
                      ? `Squad Lead: ${teamName}`
                      : mode === 'JOIN_TEAM'
                      ? 'Squad Member'
                      : 'Solo Builder'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Fill in your required profile links and details to confirm your registration for {event.title}.
                </p>
              </div>

                {/* Mandatory Fields Group */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Mandatory Required Fields</span>
                  </div>

                  {/* Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chinmay Bhatt"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-medium transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-medium transition-colors"
                      />
                    </div>
                  </div>

                  {/* Phone & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number (WhatsApp) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 99887 76655"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">City / Country *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bangalore, India"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* College / Organization */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">College / University / Organization *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. IIT Bombay / Freelance Developer"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Optional Organizer-Selected Fields */}
                {(isFieldEnabled('github') ||
                  isFieldEnabled('linkedin') ||
                  isFieldEnabled('skills') ||
                  isFieldEnabled('portfolio') ||
                  isFieldEnabled('resume') ||
                  isFieldEnabled('discord') ||
                  isFieldEnabled('twitter') ||
                  isFieldEnabled('tshirt') ||
                  isFieldEnabled('dietary') ||
                  isFieldEnabled('experience')) && (
                  <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-white/[0.08]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800/50">
                      <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" />
                      <span>Additional Event Requirements</span>
                    </div>

                    {/* GitHub & LinkedIn */}
                    {(isFieldEnabled('github') || isFieldEnabled('linkedin')) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {isFieldEnabled('github') && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                              <Github className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                              <span>GitHub Profile URL</span>
                            </label>
                            <input
                              type="url"
                              placeholder="https://github.com/your-username"
                              value={githubUrl}
                              onChange={(e) => setGithubUrl(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-medium transition-colors"
                            />
                          </div>
                        )}

                        {isFieldEnabled('linkedin') && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                              <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" />
                              <span>LinkedIn Profile URL</span>
                            </label>
                            <input
                              type="url"
                              placeholder="https://linkedin.com/in/your-profile"
                              value={linkedinUrl}
                              onChange={(e) => setLinkedinUrl(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-medium transition-colors"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Portfolio & Resume */}
                    {(isFieldEnabled('portfolio') || isFieldEnabled('resume')) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {isFieldEnabled('portfolio') && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Portfolio / Website URL</label>
                            <input
                              type="url"
                              placeholder="https://yourportfolio.dev"
                              value={portfolioUrl}
                              onChange={(e) => setPortfolioUrl(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                            />
                          </div>
                        )}
                        {isFieldEnabled('resume') && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Resume / CV Link (PDF/Drive)</label>
                            <input
                              type="url"
                              placeholder="https://drive.google.com/..."
                              value={resumeUrl}
                              onChange={(e) => setResumeUrl(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Discord & Twitter */}
                    {(isFieldEnabled('discord') || isFieldEnabled('twitter')) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {isFieldEnabled('discord') && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Discord Username</label>
                            <input
                              type="text"
                              placeholder="e.g. hacker#1234 or hacker_name"
                              value={discordHandle}
                              onChange={(e) => setDiscordHandle(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                            />
                          </div>
                        )}
                        {isFieldEnabled('twitter') && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Twitter / X Profile</label>
                            <input
                              type="text"
                              placeholder="https://x.com/username or @username"
                              value={twitterUrl}
                              onChange={(e) => setTwitterUrl(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* T-Shirt, Dietary, Experience */}
                    {(isFieldEnabled('tshirt') || isFieldEnabled('dietary') || isFieldEnabled('experience')) && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {isFieldEnabled('tshirt') && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">T-Shirt Size</label>
                            <select
                              value={tshirtSize}
                              onChange={(e) => setTshirtSize(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white outline-none"
                            >
                              <option value="S">S (Small)</option>
                              <option value="M">M (Medium)</option>
                              <option value="L">L (Large)</option>
                              <option value="XL">XL (Extra Large)</option>
                              <option value="XXL">XXL</option>
                            </select>
                          </div>
                        )}

                        {isFieldEnabled('dietary') && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dietary Preference</label>
                            <select
                              value={dietaryPreference}
                              onChange={(e) => setDietaryPreference(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white outline-none"
                            >
                              <option value="Veg">Vegetarian</option>
                              <option value="Non-Veg">Non-Vegetarian</option>
                              <option value="Vegan">Vegan</option>
                              <option value="Jain">Jain</option>
                              <option value="Other">Other / None</option>
                            </select>
                          </div>
                        )}

                        {isFieldEnabled('experience') && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Experience Level</label>
                            <select
                              value={experienceLevel}
                              onChange={(e) => setExperienceLevel(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white outline-none"
                            >
                              <option value="Beginner">Beginner / Student</option>
                              <option value="Intermediate">Intermediate Builder</option>
                              <option value="Advanced">Advanced / Professional</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Skills */}
                    {isFieldEnabled('skills') && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Skills & Tech Stack (comma separated)</label>
                        <input
                          type="text"
                          placeholder="Next.js 16, TypeScript, PyTorch, Supabase, Solidity"
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Event Custom Questions */}
                {event.customQuestions && event.customQuestions.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/[0.08]">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Organizer Questions</label>
                    {event.customQuestions.map((q) => (
                      <div key={q.id}>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {q.label} {q.required && '*'}
                        </label>
                        {q.type === 'textarea' ? (
                          <textarea
                            rows={2}
                            required={q.required}
                            value={customAnswers[q.id] || ''}
                            onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white outline-none resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            required={q.required}
                            value={customAnswers[q.id] || ''}
                            onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Code of Conduct Checkbox */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.08]">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agreeRules}
                    onChange={(e) => setAgreeRules(e.target.checked)}
                    required
                    className="w-4 h-4 rounded text-[#0099e6] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="agree" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    I agree to the <span className="text-slate-900 dark:text-white font-bold underline">Code of Conduct</span>, fair play guidelines, and event terms.
                  </label>
                </div>

                {/* Inline Error Display if any */}
                {errorMsg && (
                  <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-400 font-medium flex items-center gap-3 animate-in fade-in">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  ← Back to Mode Selection
                </button>

                <button
                  type="submit"
                  disabled={submitting || !agreeRules}
                  className="px-8 py-3 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-extrabold transition-all shadow-md shadow-sky-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  <span>
                    {submitting
                      ? 'Submitting Registration...'
                      : event.approvalMode === 'MANUAL'
                      ? 'Submit Application for Review'
                      : 'Complete Registration'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* ═════════ STEP 3: REGISTRATION CONFIRMED / TICKET ═════════ */}
          {currentStep === 3 && (
            <div className="p-8 sm:p-12 text-center space-y-6 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                  {isAlreadyRegistered ? 'Already Registered' : 'Registration Confirmed'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {isAlreadyRegistered ? 'Your Registration & Squad' : 'You Are Officially In!'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  {isAlreadyRegistered
                    ? `You are currently registered for ${event.title}. Manage your squad and teammates below.`
                    : `You are registered for ${event.title} as `}
                  {!isAlreadyRegistered && <strong className="text-slate-900 dark:text-white">{registeredRole || 'Participant'}</strong>}
                </p>
              </div>

              {/* Squad Details Card (if part of a squad) */}
              {(createdTeamData || teamName) && (
                <div className="max-w-md mx-auto p-5 rounded-2xl bg-white dark:bg-[#0c1017] border-2 border-sky-200 dark:border-sky-800/50 shadow-sm text-left space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0099e6] to-sky-600 flex items-center justify-center text-white text-base font-black shadow-md shadow-sky-500/25">
                        {(createdTeamData?.name || teamName || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">{createdTeamData?.name || teamName}</h4>
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[9px] font-extrabold uppercase">
                            Squad
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Leader: {createdTeamData?.profiles?.name || (mode === 'CREATE_TEAM' ? fullName : 'Squad Leader')}
                        </p>
                      </div>
                    </div>

                    {/* Delete Squad Button (Leader Only) */}
                    {(mode === 'CREATE_TEAM' || createdTeamData?.leader_id === (supabaseUser?.id || user?.id)) && (
                      <button
                        onClick={() => setShowDeleteSquadModal(true)}
                        className="px-2.5 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Delete Squad"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  {/* Member Roster */}
                  {createdTeamData?.team_members && createdTeamData.team_members.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Squad Members ({createdTeamData.team_members.length})
                      </p>
                      <div className="space-y-1.5">
                        {createdTeamData.team_members.map((m: any) => (
                          <div
                            key={m.id || m.user_id}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200/80 dark:border-white/[0.08] text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/50 text-[#0099e6] font-bold text-[10px] flex items-center justify-center">
                                {(m.profiles?.name || '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{m.profiles?.name || 'Teammate'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                  m.role === 'LEADER' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-slate-200 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {m.role || 'Member'}
                              </span>
                              {(mode === 'CREATE_TEAM' || createdTeamData?.leader_id === (supabaseUser?.id || user?.id)) &&
                                m.role !== 'LEADER' &&
                                (m.user_id || m.id) !== (supabaseUser?.id || user?.id) && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(m.user_id || m.id)}
                                    disabled={removingMemberId === (m.user_id || m.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                    title="Remove from squad"
                                  >
                                    {removingMemberId === (m.user_id || m.id) ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                                    ) : (
                                      <UserMinus className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ticket Card Summary */}
              <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-left space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Participant Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{fullName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Role / Mode</span>
                  <span className="font-bold text-[#0099e6]">{registeredRole}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Hackathon Dates</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatDate(event.startDate)} - {formatDate(event.endDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Status</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                    {event.approvalMode === 'MANUAL' ? 'Pending Approval' : 'Confirmed Entry'}
                  </span>
                </div>
              </div>

              {/* ─── Invite Teammates Section (Team Leaders Only) ─── */}
              {createdTeamId && (mode === 'CREATE_TEAM' || createdTeamData?.leader_id === (supabaseUser?.id || user?.id)) && (
                <div className="max-w-md mx-auto w-full space-y-4 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 text-[#0099e6] flex items-center justify-center">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Squad Invitation Link</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Share this link with your teammates. When they open it, they can review squad details and immediately accept & join.
                      </p>
                    </div>
                  </div>

                  {/* Invitation Link & Actions */}
                  {(() => {
                    const currentInviteUrl = getShareableInviteLink();
                    const whatsappText = encodeURIComponent(
                      `Hey! Join our squad "${createdTeamData?.name || teamName}" for ${event.title} on Hacker's Unity: ${currentInviteUrl}`
                    );

                    return (
                      <div className="space-y-3">
                        {/* Link Input with Quick Copy */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={currentInviteUrl}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#121824] text-xs font-mono text-slate-800 dark:text-slate-200 select-all outline-none cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className="px-4 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-sky-500/20 transition-all cursor-pointer shrink-0"
                          >
                            {copiedInvite ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* WhatsApp Share Button */}
                        <a
                          href={`https://api.whatsapp.com/send?text=${whatsappText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Share on WhatsApp</span>
                        </a>
                      </div>
                    );
                  })()}

                  {/* Status Messages */}
                  {inviteSuccessMsg && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{inviteSuccessMsg}</span>
                    </div>
                  )}
                  {inviteErrorMsg && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-xs text-red-700 dark:text-red-400 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{inviteErrorMsg}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation CTAs */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/hackathons/${event.slug}`}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all"
                >
                  View Hackathon Arena
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                >
                  Go to My Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL: Delete Squad Confirmation ─── */}
      {showDeleteSquadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1017] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/[0.08] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Squad?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                Are you sure you want to delete squad <strong className="text-slate-800 dark:text-slate-200">&quot;{createdTeamData?.name || teamName}&quot;</strong>? This will remove the squad, delete all member associations, and cancel pending invitations.
              </p>
            </div>
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowDeleteSquadModal(false)}
                disabled={deletingSquad}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSquad}
                disabled={deletingSquad}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {deletingSquad ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Yes, Delete Squad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
