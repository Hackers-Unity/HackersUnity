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
  const { teams, loading: teamsLoading, createTeam, joinTeam, refresh: refreshTeams } = useEventTeams(event.id);

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
        const teamRes = await createTeam(teamName.trim(), maxTeam, teamDescription);
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

        const joinRes = await joinTeam(selectedTeamId, maxTeam);
        if (!joinRes.success) {
          setErrorMsg(joinRes.error || 'Failed to join squad');
          setSubmitting(false);
          return;
        }

        const teamObj = teams.find((t) => t.id === selectedTeamId);

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
          teamName: teamObj?.name || 'Squad Member',
          role: 'Squad Member',
          status,
        });

        if (!regRes.success) {
          setErrorMsg(regRes.error || 'Registration failed');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            {(event.logoUrl || event.organizerLogo) ? (
              <div className="w-10 h-10 rounded-xl border border-slate-200/90 bg-white p-0.5 shadow-2xs shrink-0 overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.logoUrl || event.organizerLogo}
                  alt={event.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl border border-sky-200/90 bg-gradient-to-br from-sky-50 to-sky-100 shadow-2xs shrink-0 flex items-center justify-center text-base font-black text-[#0099e6]">
                {event.organizerAvatar || '⚡'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-[#0099e6] border border-sky-200">
                  {step === 'mode' ? 'Step 1: Choose Squad Mode' : step === 'details' ? 'Step 2: Builder Details' : 'Confirmed'}
                </span>
                <Link
                  href={`/hackathons/${event.slug}/register`}
                  onClick={onClose}
                  className="text-[11px] font-bold text-slate-500 hover:text-[#0099e6] flex items-center gap-1"
                  title="Open full dedicated page"
                >
                  <span>Full Page</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <h2 className="text-lg font-black text-slate-900 pr-6 leading-tight mt-0.5">{event.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SUCCESS VIEW */}
          {step === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  {event.approvalMode === 'MANUAL' ? 'REGISTRATION SUBMITTED' : 'REGISTRATION CONFIRMED'}
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {event.approvalMode === 'MANUAL' ? 'Application Submitted!' : 'You are in!'}
                </h3>
                <p className="text-sm text-slate-600 max-w-sm">
                  You are officially registered for <span className="text-[#0099e6] font-bold">{event.title}</span>.
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
                        ? 'border-[#0099e6] bg-sky-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0099e6] flex items-center justify-center">
                          <PlusCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Create a New Squad</h4>
                          <p className="text-[11px] text-slate-500">You will be Squad Leader ({minTeam}-{maxTeam} members)</p>
                        </div>
                      </div>
                      <input type="radio" name="modal_mode" checked={mode === 'CREATE_TEAM'} onChange={() => setMode('CREATE_TEAM')} className="text-[#0099e6]" />
                    </div>

                    {mode === 'CREATE_TEAM' && (
                      <div className="mt-3 pt-3 border-t border-sky-200 space-y-2 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                        <label className="block text-xs font-bold text-slate-700">Squad Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. CodeWarriors"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-[#0099e6]"
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
                        ? 'border-[#0099e6] bg-sky-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Join an Existing Squad</h4>
                          <p className="text-[11px] text-slate-500">Join a team formed by other hackers ({teams.length} open)</p>
                        </div>
                      </div>
                      <input type="radio" name="modal_mode" checked={mode === 'JOIN_TEAM'} onChange={() => setMode('JOIN_TEAM')} className="text-[#0099e6]" />
                    </div>

                    {mode === 'JOIN_TEAM' && (
                      <div className="mt-3 pt-3 border-t border-purple-200 space-y-2 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                        <label className="block text-xs font-bold text-slate-700">Select Squad *</label>
                        {teamsLoading ? (
                          <div className="py-3 text-center text-xs text-slate-400">Loading squads...</div>
                        ) : teams.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                            No open squads yet. Please create a new squad.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {teams.map((t) => (
                              <div
                                key={t.id}
                                onClick={() => setSelectedTeamId(t.id)}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer ${
                                  selectedTeamId === t.id ? 'border-[#0099e6] bg-white font-bold' : 'border-slate-200 bg-white'
                                }`}
                              >
                                <span>{t.name}</span>
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
                      ? 'border-slate-200 bg-slate-50/80 opacity-60 cursor-not-allowed select-none'
                      : mode === 'SOLO'
                      ? 'border-[#0099e6] bg-sky-50/60 shadow-xs cursor-pointer'
                      : 'border-slate-200 hover:border-slate-300 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          !isSoloAllowed ? 'bg-slate-200 text-slate-400' : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {!isSoloAllowed ? <Lock className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">Solo Participant</h4>
                          {!isSoloAllowed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 flex items-center gap-0.5 border border-rose-200">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Locked (Min {minTeam})</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                              Solo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
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
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 99887 76655"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City / Country *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore, India"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">College / Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IIT Delhi"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                />
              </div>

              {/* Optional Fields */}
              {(isFieldEnabled('github') || isFieldEnabled('linkedin')) && (
                <div className="grid grid-cols-2 gap-3">
                  {isFieldEnabled('github') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Github className="w-3.5 h-3.5" />
                        <span>GitHub URL</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                      />
                    </div>
                  )}
                  {isFieldEnabled('linkedin') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" />
                        <span>LinkedIn URL</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {isFieldEnabled('skills') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Next.js, Python, TypeScript"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
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
                  className="rounded border-slate-300 text-[#0099e6] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="agree_modal" className="text-xs text-slate-600 cursor-pointer">
                  I agree to the <span className="text-slate-900 underline font-semibold">Code of Conduct</span> and event rules.
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('mode')}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={!agreeRules || submitting}
                  className="flex-[2] py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Rocket className="w-4 h-4" />
                  <span>{submitting ? 'Registering...' : 'Confirm Registration'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
