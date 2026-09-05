'use client';

import { useState } from 'react';
import { X, Users, Plus, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { ExtendedEvent } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { useEventTeams } from '@/lib/hooks/use-registration';
import { registerForEventSupabase } from '@/lib/supabase-service';

interface TeamRegistrationModalProps {
  event: ExtendedEvent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TeamRegistrationModal({ event, isOpen, onClose, onSuccess }: TeamRegistrationModalProps) {
  const { user, supabaseUser } = useAuth();
  const { teams, loading: teamsLoading, createTeam, joinTeam, refresh } = useEventTeams(event.id);

  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [college, setCollege] = useState(user?.college || '');
  const [city, setCity] = useState('');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const minTeam = event.minTeamSize || 2;
  const maxTeam = event.maxTeamSize || 4;

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setErrorMsg('Please provide a squad/team name.');
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const userId = supabaseUser?.id || user?.id;
      const userEmail = supabaseUser?.email || user?.email || email;

      if (!userId || !userEmail) {
        setErrorMsg('Please sign in or provide a valid email.');
        setSubmitting(false);
        return;
      }

      // 1. Create team in Supabase
      const teamRes = await createTeam(teamName.trim(), maxTeam, description);
      if (!teamRes.success) {
        setErrorMsg(teamRes.error || 'Failed to create team');
        setSubmitting(false);
        return;
      }

      // 2. Register leader for event
      const regRes = await registerForEventSupabase({
        eventId: event.id,
        userId,
        userEmail,
        userName: fullName || user?.name || 'Squad Lead',
        phone,
        college,
        city,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        isTeam: true,
        teamName: teamName.trim(),
        role: 'Squad Leader',
        status: 'CONFIRMED',
      });

      if (!regRes.success) {
        setErrorMsg(regRes.error || 'Registration failed');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      await refresh();
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Team registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setErrorMsg('Please select a squad to join.');
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const userId = supabaseUser?.id || user?.id;
      const userEmail = supabaseUser?.email || user?.email || email;

      if (!userId || !userEmail) {
        setErrorMsg('Please sign in to join a team.');
        setSubmitting(false);
        return;
      }

      // 1. Join team
      const joinRes = await joinTeam(selectedTeamId, maxTeam);
      if (!joinRes.success) {
        setErrorMsg(joinRes.error || 'Failed to join team');
        setSubmitting(false);
        return;
      }

      const teamObj = teams.find((t) => t.id === selectedTeamId);

      // 2. Register member for event
      await registerForEventSupabase({
        eventId: event.id,
        userId,
        userEmail,
        userName: fullName || user?.name || 'Squad Member',
        phone,
        college,
        city,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        isTeam: true,
        teamName: teamObj?.name || 'Squad Member',
        role: 'Team Member',
        status: 'CONFIRMED',
      });

      setSuccess(true);
      await refresh();
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to join team');
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
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-5 flex items-center justify-between rounded-t-3xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-50 text-[#0099e6] border border-sky-200">
                Team Registration
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {minTeam} - {maxTeam} Members Required
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-1">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">Squad Registered!</h3>
                <p className="text-xs text-slate-600 max-w-sm">
                  You are registered for <span className="font-bold text-[#0099e6]">{event.title}</span>. Teammates can now discover and join your squad.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Tab Switcher */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setTab('create');
                    setErrorMsg(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    tab === 'create'
                      ? 'bg-white text-[#0099e6] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create a Squad</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('join');
                    setErrorMsg(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    tab === 'join'
                      ? 'bg-white text-[#0099e6] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Join Existing Squad ({teams.length})</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* CREATE SQUAD FORM */}
              {tab === 'create' ? (
                <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Squad Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NeuralPulse Autonomous"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Squad Tagline / Mission (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Building AI agents for on-chain verifiable computation"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-3">
                      Leader Details
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                      <input
                        type="tel"
                        placeholder="+91 99887 76655"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">College / Organization</label>
                      <input
                        type="text"
                        placeholder="IIT Delhi"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Your Skills</label>
                    <input
                      type="text"
                      placeholder="e.g. Next.js, PyTorch, Solidity"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                    />
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
                      disabled={submitting}
                      className="flex-[2] py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{submitting ? 'Creating Squad...' : 'Create & Register Squad'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* JOIN EXISTING SQUAD */
                <form onSubmit={handleJoinTeamSubmit} className="space-y-4">
                  {teamsLoading ? (
                    <div className="py-12 text-center text-xs text-slate-400">Loading squads...</div>
                  ) : teams.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No open squads yet for this event</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Be the first to create one!</p>
                      <button
                        type="button"
                        onClick={() => setTab('create')}
                        className="mt-3 px-4 py-1.5 rounded-xl bg-[#0099e6] text-white text-xs font-bold"
                      >
                        Create a Squad
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {teams.map((t) => {
                        const memberCount = (t.team_members?.length || 0) + 1;
                        const isFull = memberCount >= maxTeam;
                        const isSelected = selectedTeamId === t.id;

                        return (
                          <div
                            key={t.id}
                            onClick={() => !isFull && setSelectedTeamId(t.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isFull
                                ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'bg-sky-50/70 border-[#0099e6] shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                                  {memberCount}/{maxTeam} Members
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                Leader: {t.profiles?.name || 'Hacker'} {t.description && `• ${t.description}`}
                              </p>
                            </div>
                            <input
                              type="radio"
                              name="selectedSquad"
                              checked={isSelected}
                              disabled={isFull}
                              onChange={() => setSelectedTeamId(t.id)}
                              className="text-[#0099e6] focus:ring-0 cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Your Email *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                      />
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
                      disabled={submitting || !selectedTeamId}
                      className="flex-[2] py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>{submitting ? 'Joining Squad...' : 'Join Selected Squad'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
