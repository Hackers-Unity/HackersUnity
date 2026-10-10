'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  X,
  CheckCircle2,
  Rocket,
  AlertCircle,
  Users,
  User,
  PlusCircle,
  ArrowRight,
  ExternalLink,
  Github,
  Linkedin,
  Lock,
} from 'lucide-react';
import { ExtendedEvent } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useEventTeams } from '@/lib/hooks/use-registration';
import { registerForEventSupabase } from '@/lib/supabase-service';

interface RegistrationModalProps {
  event: ExtendedEvent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ModalStep = 'mode' | 'details' | 'success';
type RegistrationMode = 'CREATE_TEAM' | 'JOIN_TEAM' | 'SOLO';

export function RegistrationModal({ event, isOpen, onClose, onSuccess }: RegistrationModalProps) {
  const { user, supabaseUser } = useAuth();
  const { teams, loading: teamsLoading, createTeam, joinTeam, requestJoinTeam, refresh: refreshTeams } = useEventTeams(event.id);

  const minTeam = event.minTeamSize || 1;
  const maxTeam = event.maxTeamSize || 4;
  const isSoloAllowed = minTeam <= 1 && (!event.isTeamEvent || minTeam === 1);

  const [step, setStep] = useState<ModalStep>('mode');
  const [mode, setMode] = useState<RegistrationMode>(
    !isSoloAllowed ? 'CREATE_TEAM' : 'SOLO'
  );

  // Team state
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Participant details
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [githubUrl, setGithubUrl] = useState(user?.socialLinks?.github || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.socialLinks?.linkedin || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [college, setCollege] = useState(user?.college || user?.organization || '');
  const [city, setCity] = useState('');
  const [skillsInput, setSkillsInput] = useState(user?.skills?.join(', ') || '');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [agreeRules, setAgreeRules] = useState(true);

  const isFieldEnabled = (fieldId: string) => {
    if (!event) return true;
    if (!event.registrationFields || !Array.isArray(event.registrationFields) || event.registrationFields.length === 0) {
      return ['name', 'email', 'phone', 'college', 'city', 'github', 'linkedin', 'skills'].includes(fieldId);
    }
    return event.registrationFields.map((f: string) => f.toLowerCase()).includes(fieldId.toLowerCase());
  };

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'SOLO' && !isSoloAllowed) {
      setErrorMsg(`Solo participation is not allowed. Minimum squad size is ${minTeam} members.`);
      return;
    }
    if (mode === 'CREATE_TEAM' && !teamName.trim()) {
      setErrorMsg('Please provide a squad name.');
      return;
    }
    if (mode === 'JOIN_TEAM' && !selectedTeamId) {
      setErrorMsg('Please select a squad to join.');
      return;
    }

    setStep('details');
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
    if (!college.trim()) {
      setErrorMsg('College / Organization is required.');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('City / Location is required.');
      return;
    }
    if (!agreeRules) {
      setErrorMsg('Please accept the Code of Conduct.');
      return;
    }

    setSubmitting(true);

    try {
      const approvalMode = event.approvalMode || 'AUTO';
      const status = approvalMode === 'AUTO' ? 'CONFIRMED' : 'PENDING';
      const userId = supabaseUser?.id || user?.id || null;
      const userEmail = email.trim();

      if (mode === 'CREATE_TEAM') {
        const teamRes = await createTeam(teamName.trim(), maxTeam, teamDescription, {
          name: fullName.trim(),
          email: userEmail,
          phone,
          college,
          skills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
        });
        if (!teamRes.success) {
          setErrorMsg(teamRes.error || 'Failed to create team');
          setSubmitting(false);
          return;
        }

        const regRes = await registerForEventSupabase({
          eventId: event.id,
          userId,
          userEmail,
          userName: fullName.trim(),
          phone,
          college,
          city,
          githubUrl: githubUrl.trim(),
          linkedinUrl: linkedinUrl.trim(),
          skills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
          customAnswers,
          isTeam: true,
          teamName: teamName.trim(),
          role: 'Squad Leader',
          status,
        });

        if (!regRes.success) {
          setErrorMsg(regRes.error || 'Registration failed');
          setSubmitting(false);
          return;
        }
      } else if (mode === 'JOIN_TEAM') {
        if (!selectedTeamId) {
          setErrorMsg('Please select a squad.');
          setSubmitting(false);
          return;
        }

        const reqRes = await requestJoinTeam(selectedTeamId, {
          name: fullName.trim(),
          email: userEmail,
          phone,
          college,
          city,
          skills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
          githubUrl: githubUrl.trim(),
          linkedinUrl: linkedinUrl.trim(),
          customAnswers,
        });

        if (!reqRes.success) {
          setErrorMsg(reqRes.error || 'Failed to submit join request');
          setSubmitting(false);
          return;
        }
      } else {
        const regRes = await registerForEventSupabase({
          eventId: event.id,
          userId,
          userEmail,
          userName: fullName.trim(),
          phone,
          college,
          city,
          githubUrl: githubUrl.trim(),
          linkedinUrl: linkedinUrl.trim(),
          skills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
          customAnswers,
          isTeam: false,
          role: 'Solo Builder',
          status,
        });

        if (!regRes.success) {
          setErrorMsg(regRes.error || 'Registration failed.');
          setSubmitting(false);
          return;
        }
      }

      await refreshTeams();
      setStep('success');
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0c1017] border-b border-slate-100 dark:border-white/[0.08] p-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            {(event.logoUrl || event.organizerLogo) ? (
              <div className="w-10 h-10 rounded-xl border border-slate-200/90 dark:border-white/[0.1] bg-white dark:bg-[#121824] p-0.5 shadow-2xs shrink-0 overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.logoUrl || event.organizerLogo}
                  alt={event.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl border border-sky-200/90 dark:border-sky-800/40 bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/40 dark:to-sky-900/20 shadow-2xs shrink-0 flex items-center justify-center text-base font-black text-[#0099e6]">
                {event.organizerAvatar || '⚡'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/50 text-[#0099e6] border border-sky-200 dark:border-sky-800/50">
                  {step === 'mode' ? 'Step 1: Choose Squad Mode' : step === 'details' ? 'Step 2: Builder Details' : 'Confirmed'}
                </span>
                <Link
                  href={`/hackathons/${event.slug}/register`}
                  onClick={onClose}
                  className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-[#0099e6] flex items-center gap-1"
                  title="Open full dedicated page"
                >
                  <span>Full Page</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white pr-6 leading-tight mt-0.5">{event.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SUCCESS VIEW */}
          {step === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/40">
                  {mode === 'JOIN_TEAM' ? 'JOIN REQUEST SENT' : event.approvalMode === 'MANUAL' ? 'REGISTRATION SUBMITTED' : 'REGISTRATION CONFIRMED'}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {mode === 'JOIN_TEAM' ? 'Join Request Sent!' : event.approvalMode === 'MANUAL' ? 'Application Submitted!' : 'You are in!'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
                  {mode === 'JOIN_TEAM' ? (
                    <>Your request to join the squad has been submitted to the squad leader. You will be added once approved!</>
                  ) : (
                    <>You are officially registered for <span className="text-[#0099e6] font-bold">{event.title}</span>.</>
                  )}
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* STEP 1: PARTICIPATION MODE */}
          {step === 'mode' && (
            <form onSubmit={handleStep1Next} className="space-y-4">
              <div className="space-y-3">
                {event.isTeamEvent && (
                  <div
                    onClick={() => setMode('CREATE_TEAM')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      mode === 'CREATE_TEAM'
                        ? 'border-[#0099e6] bg-sky-50/60 dark:bg-sky-950/30 shadow-xs'
                        : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-[#0099e6] flex items-center justify-center">
                          <PlusCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Create a New Squad</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">You will be Squad Leader ({minTeam}-{maxTeam} members)</p>
                        </div>
                      </div>
                      <input type="radio" name="modal_mode" checked={mode === 'CREATE_TEAM'} onChange={() => setMode('CREATE_TEAM')} className="text-[#0099e6]" />
                    </div>

                    {mode === 'CREATE_TEAM' && (
                      <div className="mt-3 pt-3 border-t border-sky-200 dark:border-sky-800/40 space-y-2 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Squad Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. CodeWarriors"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#121824] border border-slate-300 dark:border-white/[0.1] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#0099e6]"
                        />
                      </div>
                    )}
                  </div>
                )}

                {event.isTeamEvent && (
                  <div
                    onClick={() => setMode('JOIN_TEAM')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      mode === 'JOIN_TEAM'
                        ? 'border-[#0099e6] bg-sky-50/60 dark:bg-sky-950/30 shadow-xs'
                        : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Join an Existing Squad</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Join a team formed by other hackers ({teams.length} open)</p>
                        </div>
                      </div>
                      <input type="radio" name="modal_mode" checked={mode === 'JOIN_TEAM'} onChange={() => setMode('JOIN_TEAM')} className="text-[#0099e6]" />
                    </div>

                    {mode === 'JOIN_TEAM' && (
                      <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800/40 space-y-2 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Select Squad *</label>
                        {teamsLoading ? (
                          <div className="py-3 text-center text-xs text-slate-400 dark:text-slate-500">Loading squads...</div>
                        ) : teams.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#121824] rounded-xl border border-slate-200 dark:border-white/[0.08]">
                            No open squads yet. Please create a new squad.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {teams.map((t) => (
                              <div
                                key={t.id}
                                onClick={() => setSelectedTeamId(t.id)}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer ${
                                  selectedTeamId === t.id
                                    ? 'border-[#0099e6] bg-white dark:bg-[#121824] text-slate-900 dark:text-white font-bold'
                                    : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121824] text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{t.name}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold border border-amber-200/60 dark:border-amber-800/40">
                                    Approval Required
                                  </span>
                                </div>
                                <input type="radio" name="squad_sel" checked={selectedTeamId === t.id} onChange={() => setSelectedTeamId(t.id)} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div
                  onClick={() => {
                    if (!isSoloAllowed) {
                      setErrorMsg(`Solo participation is locked. Minimum team size is ${minTeam} builders.`);
                      return;
                    }
                    setMode('SOLO');
                    setErrorMsg(null);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all relative ${
                    !isSoloAllowed
                      ? 'border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] opacity-60 cursor-not-allowed select-none'
                      : mode === 'SOLO'
                      ? 'border-[#0099e6] bg-sky-50/60 dark:bg-sky-950/30 shadow-xs cursor-pointer'
                      : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          !isSoloAllowed
                            ? 'bg-slate-200 dark:bg-white/[0.06] text-slate-400 dark:text-slate-500'
                            : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {!isSoloAllowed ? <Lock className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Solo Participant</h4>
                          {!isSoloAllowed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 flex items-center gap-0.5 border border-rose-200 dark:border-rose-800/40">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Locked (Min {minTeam})</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                              Solo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {!isSoloAllowed
                            ? `Squad required (minimum ${minTeam} members)`
                            : 'Participate individually without a squad'}
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="modal_mode"
                      checked={mode === 'SOLO'}
                      disabled={!isSoloAllowed}
                      onChange={() => isSoloAllowed && setMode('SOLO')}
                      className="text-[#0099e6] disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next: Builder Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: BUILDER DETAILS & SOCIALS */}
          {step === 'details' && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              {/* Mandatory Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 99887 76655"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white outline-none"
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
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">College / Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IIT Delhi"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Optional Fields */}
              {(isFieldEnabled('github') || isFieldEnabled('linkedin')) && (
                <div className="grid grid-cols-2 gap-3">
                  {isFieldEnabled('github') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Github className="w-3.5 h-3.5" />
                        <span>GitHub URL</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  )}
                  {isFieldEnabled('linkedin') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" />
                        <span>LinkedIn URL</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {isFieldEnabled('skills') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Next.js, Python, TypeScript"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] focus:border-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agree_modal"
                  checked={agreeRules}
                  onChange={(e) => setAgreeRules(e.target.checked)}
                  required
                  className="rounded border-slate-300 dark:border-white/[0.2] text-[#0099e6] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="agree_modal" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  I agree to the <span className="text-slate-900 dark:text-white underline font-semibold">Code of Conduct</span> and event rules.
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('mode')}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={!agreeRules || submitting}
                  className="flex-[2] py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Rocket className="w-4 h-4" />
                  <span>
                    {submitting
                      ? mode === 'JOIN_TEAM'
                        ? 'Sending Request...'
                        : 'Registering...'
                      : mode === 'JOIN_TEAM'
                      ? 'Send Join Request to Leader'
                      : 'Confirm Registration'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
