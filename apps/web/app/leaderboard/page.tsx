'use client';

import { useState } from 'react';
import {
  Trophy,
  GraduationCap,
  Users,
} from 'lucide-react';
import { MOCK_LEADERBOARD, MOCK_COLLEGES } from '@/lib/mock-data';

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'hackers' | 'colleges'>('hackers');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* ─── Page Header ────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#ea580c] text-xs font-bold uppercase tracking-wider mb-2">
          <Trophy className="w-3.5 h-3.5" />
          <span>Global Arena Rankings</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Hacker&apos;s Unity Leaderboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl font-medium">
          Recognizing the most prolific hackathon builders, algorithmic champions, and university tech chapters worldwide.
        </p>
      </div>

      {/* ─── Top 3 Podium Highlights ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-end">
        {/* Rank 2 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-3 relative order-2 md:order-1">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-300 text-slate-600 font-bold text-sm mx-auto flex items-center justify-center">
            #2
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-200 mx-auto flex items-center justify-center font-bold text-lg text-slate-700">
            A
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Aarav Sharma</h3>
            <p className="text-xs text-[#0099e6] font-semibold">IIT Bombay</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-around text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Wins</div>
              <div className="font-black text-slate-900">6</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Elo Score</div>
              <div className="font-bold text-[#0099e6] font-mono">9,240</div>
            </div>
          </div>
        </div>

        {/* Rank 1 (Champion) */}
        <div className="p-8 rounded-3xl bg-white border-2 border-[#f97316]/40 shadow-xl text-center space-y-4 relative order-1 md:order-2 md:-translate-y-4">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-[#f97316] text-white text-[10px] font-black uppercase tracking-wider shadow-md">
            👑 GLOBAL CHAMPION
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-100 text-[#ea580c] font-black text-base mx-auto flex items-center justify-center">
            #1
          </div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0099e6] to-[#f97316] mx-auto flex items-center justify-center font-black text-2xl text-white shadow-md">
            V
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Vikramaditya Rao</h3>
            <p className="text-xs text-[#ea580c] font-bold">BITS Pilani • Grandmaster</p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-around text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Victories</div>
              <div className="font-black text-slate-900 text-sm">8 Grand Prizes</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Arena Score</div>
              <div className="font-black text-[#ea580c] text-sm font-mono">9,850</div>
            </div>
          </div>
        </div>

        {/* Rank 3 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-3 relative order-3">
          <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-200 text-[#ea580c] font-bold text-sm mx-auto flex items-center justify-center">
            #3
          </div>
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#ea580c] mx-auto flex items-center justify-center font-bold text-lg">
            S
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Sophia Zhang</h3>
            <p className="text-xs text-[#0099e6] font-semibold">UC Berkeley</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-around text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Wins</div>
              <div className="font-black text-slate-900">5</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Elo Score</div>
              <div className="font-bold text-[#0099e6] font-mono">8,900</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Table Switcher ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setTab('hackers')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'hackers'
              ? 'bg-[#0099e6] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Top Hackers</span>
        </button>
        <button
          onClick={() => setTab('colleges')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'colleges'
              ? 'bg-[#0099e6] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>University Rankings</span>
        </button>
      </div>

      {/* ─── Table List ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {tab === 'hackers' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Hacker</th>
                  <th className="py-3.5 px-4">University / Chapter</th>
                  <th className="py-3.5 px-4 text-center">Tier Badge</th>
                  <th className="py-3.5 px-4 text-right">Hackathons Won</th>
                  <th className="py-3.5 px-4 text-right">Arena Elo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {MOCK_LEADERBOARD.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {item.rank === 1 ? '🥇 #1' : item.rank === 2 ? '🥈 #2' : item.rank === 3 ? '🥉 #3' : `#${item.rank}`}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-sky-100 text-[#0099e6] font-black flex items-center justify-center text-[10px]">
                        {item.name.charAt(0)}
                      </div>
                      <span>{item.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{item.university}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-[#ea580c] border border-orange-200">
                        {item.badge}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">{item.won}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0099e6]">
                      {item.score.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">University</th>
                  <th className="py-3.5 px-4">Country</th>
                  <th className="py-3.5 px-4 text-right">Active Builders</th>
                  <th className="py-3.5 px-4 text-right">Victories</th>
                  <th className="py-3.5 px-4 text-right">Guild Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {MOCK_COLLEGES.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">#{item.rank}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#0099e6]" />
                      <span>{item.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{item.country}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 font-bold">{item.builders}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{item.wins}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-[#ea580c]">
                      {item.points.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
