'use client';

import { useState, useEffect } from 'react';
import { Search, X, Trophy, Users, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePublishedEvents } from '@/lib/hooks/use-events';
import { MOCK_HACKERS } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const { events } = usePublishedEvents();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      e.description.toLowerCase().includes(query.toLowerCase()) ||
      e.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredHackers = MOCK_HACKERS.filter(
    (h) =>
      h.name.toLowerCase().includes(query.toLowerCase()) ||
      h.skills.some((s) => s.toLowerCase().includes(query.toLowerCase())) ||
      h.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-[#0099e6]" />
          <input
            type="text"
            autoFocus
            placeholder="Search hackathons, skills (Python, ZK, Agents), or builders..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-600">ESC</span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
          {/* Quick Filter Tags */}
          {!query && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Trending Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['GenAI', 'Autonomous Agents', 'ZK-Proofs', 'Robotics', 'DeFi', 'Next.js 16', 'PyTorch'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-sky-50 text-xs font-semibold text-slate-700 hover:text-[#0099e6] border border-slate-200 hover:border-[#0099e6]/30 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hackathons results */}
          <div>
            <div className="text-[11px] font-bold text-[#0099e6] uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Hackathons ({filteredEvents.length})
              </span>
              <Link
                href="/hackathons"
                onClick={onClose}
                className="text-[10px] text-slate-500 hover:text-[#0099e6] flex items-center gap-1 font-bold"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {filteredEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No hackathons matching &quot;{query}&quot;</p>
            ) : (
              <div className="space-y-2">
                {filteredEvents.slice(0, 4).map((event) => (
                  <Link
                    key={event.id}
                    href={`/hackathons/${event.slug}`}
                    onClick={onClose}
                    className="block p-3 rounded-2xl bg-slate-50 hover:bg-sky-50/70 border border-slate-100 hover:border-[#0099e6]/30 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0099e6] transition-colors">
                        {event.title}
                      </h4>
                      <span className="text-xs font-black text-[#ea580c]">
                        {formatCurrency(event.totalPrizeValue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>{event.organizerName}</span>
                      <span>•</span>
                      <span>{event.eventType}</span>
                      <span>•</span>
                      <span className="text-[#0099e6] font-semibold">{event.tags.slice(0, 3).join(', ')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Hackers results */}
          <div>
            <div className="text-[11px] font-bold text-[#f97316] uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Teammates & Hackers ({filteredHackers.length})
              </span>
              <Link
                href="/teammates"
                onClick={onClose}
                className="text-[10px] text-slate-500 hover:text-[#f97316] flex items-center gap-1 font-bold"
              >
                Find Teammates <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {filteredHackers.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No builders matching &quot;{query}&quot;</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredHackers.slice(0, 4).map((hacker) => (
                  <Link
                    key={hacker.id}
                    href="/teammates"
                    onClick={onClose}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-orange-50/70 border border-slate-100 hover:border-[#f97316]/30 transition-all flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-orange-100 text-[#ea580c] font-black text-sm flex items-center justify-center">
                      {hacker.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{hacker.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{hacker.title}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Search powered by Hacker&apos;s Unity Engine</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
