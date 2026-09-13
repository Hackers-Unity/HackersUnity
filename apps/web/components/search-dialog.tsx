'use client';

import { useState, useEffect } from 'react';
import { Search, X, Trophy, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePublishedEvents } from '@/lib/hooks/use-events';
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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-2xl dark:shadow-black/90 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.03]">
          <Search className="w-5 h-5 text-[#0099e6]" />
          <input
            type="text"
            autoFocus
            placeholder="Search hackathons, topics (AI, Web3, Python)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.08] dark:hover:bg-white/[0.15] text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
            title="Press ESC or click to close"
          >
            ESC
          </button>
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
                    className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-sky-50 dark:hover:bg-sky-500/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#0099e6] border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6]/30 transition-colors cursor-pointer"
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
                className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-[#0099e6] flex items-center gap-1 font-bold"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {filteredEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No hackathons matching &quot;{query}&quot;</p>
            ) : (
              <div className="space-y-2">
                {filteredEvents.slice(0, 6).map((event) => (
                  <Link
                    key={event.id}
                    href={`/hackathons/${event.slug}`}
                    onClick={onClose}
                    className="block p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] hover:bg-sky-50/70 dark:hover:bg-sky-500/10 border border-slate-100 dark:border-white/[0.06] hover:border-[#0099e6]/30 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#0099e6] transition-colors">
                        {event.title}
                      </h4>
                      <span className="text-xs font-black text-[#ea580c]">
                        {formatCurrency(event.totalPrizeValue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
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
        </div>

        <div className="px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
          <span>Search powered by Hacker&apos;s Unity Engine</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
