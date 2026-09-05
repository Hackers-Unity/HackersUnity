'use client';

import { useState } from 'react';
import {
  Users,
  Search,
  Trophy,
  Send,
  CheckCircle2,
  X,
} from 'lucide-react';
import { MOCK_HACKERS, ExtendedHacker } from '@/lib/mock-data';

export default function TeammatesPage() {
  const [hackers, setHackers] = useState<ExtendedHacker[]>(MOCK_HACKERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [inviteModalHacker, setInviteModalHacker] = useState<ExtendedHacker | null>(null);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("Hey! We are forming a team for the AI Nexus Global Hackathon on Hacker's Unity. Would love to have your expertise onboard!");

  const roles = [
    { id: 'ALL', label: 'All Builders' },
    { id: 'AI/ML', label: 'AI / ML & Agents' },
    { id: 'Full-Stack', label: 'Full-Stack' },
    { id: 'Smart Contract', label: 'Smart Contract / ZK' },
    { id: 'Robotics', label: 'Robotics & Edge' },
    { id: 'Cloud', label: 'Cloud & Systems' },
  ];

  const filteredHackers = hackers.filter((hacker) => {
    const matchQuery =
      !searchQuery ||
      hacker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hacker.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hacker.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (hacker.college && hacker.college.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchRole =
      selectedRole === 'ALL' || hacker.title.toLowerCase().includes(selectedRole.toLowerCase());

    const matchOpen = !onlyOpen || hacker.openForTeams;

    return matchQuery && matchRole && matchOpen;
  });

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setInviteModalHacker(null);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* ─── Page Header ────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0099e6] text-xs font-bold uppercase tracking-wider mb-2">
          <Users className="w-3.5 h-3.5" />
          <span>Hacker Directory & Matchmaker</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Find Your Hackathon Teammates
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl font-medium">
          Pair with top-tier builders, AI specialists, and designers. Build winning squads for upcoming flagship hackathons.
        </p>
      </div>

      {/* ─── Search and Filters ─────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#0099e6]" />
            <input
              type="text"
              placeholder="Search by skill (PyTorch, Rust, Solidity, Next.js), university, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors font-medium"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-bold">
              <input
                type="checkbox"
                checked={onlyOpen}
                onChange={(e) => setOnlyOpen(e.target.checked)}
                className="rounded border-slate-300 text-[#0099e6] focus:ring-0 cursor-pointer"
              />
              <span>Available for Teams Only</span>
            </label>
          </div>
        </div>

        {/* Role Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-bold mr-1">Domain:</span>
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRole === r.id
                  ? 'bg-[#0099e6] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Hackers Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHackers.map((hacker) => (
          <div
            key={hacker.id}
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#0099e6]/40 flex flex-col justify-between space-y-5 transition-all"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center font-black text-lg text-[#0099e6]">
                    {hacker.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{hacker.name}</h3>
                    <p className="text-xs text-[#0099e6] font-semibold">{hacker.title}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{hacker.college || hacker.organization}</p>
                  </div>
                </div>

                {hacker.openForTeams ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                    ● Available
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
                    In a Team
                  </span>
                )}
              </div>

              {/* Bio */}
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 font-medium">
                {hacker.bio}
              </p>

              {/* Skills */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Tech Stack</div>
                <div className="flex flex-wrap gap-1.5">
                  {hacker.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-700 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Interests */}
              {hacker.interests && hacker.interests.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Target Tracks</div>
                  <div className="flex flex-wrap gap-1">
                    {hacker.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-2 py-0.5 rounded-md bg-orange-50 text-[10px] font-bold text-[#ea580c] border border-orange-200"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom stats & invite */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-[#ea580c] font-black">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{hacker.hackathonsWon} Wins</span>
                </div>
                <div className="text-slate-400 font-mono font-bold">
                  {hacker.rating} Elo
                </div>
              </div>

              <button
                onClick={() => setInviteModalHacker(hacker)}
                disabled={!hacker.openForTeams}
                className="px-3.5 py-1.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              >
                Invite to Squad
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {inviteModalHacker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="relative w-full max-w-md p-6 overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setInviteModalHacker(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {inviteSent ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Invite Sent!</h3>
                <p className="text-xs text-slate-500">
                  We notified <span className="text-[#0099e6] font-bold">{inviteModalHacker.name}</span>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0099e6]">Team Matchmaker</span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Invite {inviteModalHacker.name} to your Squad
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{inviteModalHacker.title}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Hackathon</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]">
                    <option>AI Nexus Global Hackathon 2026 ($65,000)</option>
                    <option>Web3 Zero-Knowledge Sprint ($50,000)</option>
                    <option>CyberShield DEFCON Hackathon ($35,000)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Personal Note</label>
                  <textarea
                    rows={3}
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setInviteModalHacker(null)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Squad Invitation</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
