'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trophy, Calendar, MapPin, Tag, Globe, Sparkles, CreditCard } from 'lucide-react';
import { ExtendedEvent } from '@/lib/mock-data';
import { EventStatus, EventType } from '@hackers-unity/shared-types';
import { RichTextEditor } from '@/components/rich-text-editor';
import { VenuePicker } from '@/components/venue-picker';

interface EditEventModalProps {
  isOpen: boolean;
  event: ExtendedEvent | null;
  onClose: () => void;
  onSave: (updatedEvent: ExtendedEvent) => void;
}

export function EditEventModal({ isOpen, event, onClose, onSave }: EditEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prizeDisplay, setPrizeDisplay] = useState('');
  const [prizeAmount, setPrizeAmount] = useState<number>(0);
  const [mode, setMode] = useState('In-Person');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<EventStatus>(EventStatus.PUBLISHED);
  const [registrationLink, setRegistrationLink] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [participantsDisplay, setParticipantsDisplay] = useState('');
  const [ctaText, setCtaText] = useState('Learn More');
  const [featured, setFeatured] = useState(true);
  const [organizerName, setOrganizerName] = useState('');
  const [registrationType, setRegistrationType] = useState<'FREE' | 'PAID'>('FREE');
  const [entryFee, setEntryFee] = useState<number | string>(0);

  useEffect(() => {
    if (event) {
      setTitle(event.title || event.name || '');
      setDescription(event.description || '');
      setOrganizerName(event.organizerName || '');
      setPrizeDisplay(event.prize || (event.totalPrizeValue ? `$${event.totalPrizeValue.toLocaleString()}` : ''));
      setPrizeAmount(event.totalPrizeValue || 0);
      setMode(event.mode || (event.eventType === EventType.ONLINE ? 'Online' : 'In-Person'));
      setLocation(event.location || '');
      setStatus(event.status || EventStatus.PUBLISHED);
      setRegistrationLink(event.registrationLink || '');
      setTagsInput(event.tags ? event.tags.join(', ') : '');
      setParticipantsDisplay(event.participantsDisplay || `${event.participantsCount || 500}+`);
      setCtaText(event.ctaText || 'Learn More');
      setFeatured(!!event.featured);
      setRegistrationType(event.registrationType === 'PAID' || Number(event.entryFee) > 0 ? 'PAID' : 'FREE');
      const rawFee = Number(event.entryFee);
      const mappedFee = (rawFee === 59 || rawFee === 1) ? 800 : (event.entryFee !== undefined && event.entryFee !== null ? event.entryFee : 0);
      setEntryFee(mappedFee);
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updated: ExtendedEvent = {
      ...event,
      title: title.trim() || event.title,
      name: title.trim() || event.title,
      organizerName: organizerName.trim() || event.organizerName,
      description: description.trim() || event.description,
      prize: prizeDisplay.trim() || event.prize,
      totalPrizeValue: Number(prizeAmount) || event.totalPrizeValue,
      mode: mode,
      eventType: mode === 'Online' ? EventType.ONLINE : EventType.OFFLINE,
      location: location.trim(),
      status: status,
      registrationLink: registrationLink.trim() || event.registrationLink,
      tags: parsedTags.length > 0 ? parsedTags : event.tags,
      participantsDisplay: participantsDisplay.trim() || event.participantsDisplay,
      ctaText: ctaText.trim() || 'Learn More',
      featured: featured,
      registrationType: registrationType,
      entryFee: registrationType === 'PAID' ? (Number(entryFee) || 800) : 0,
      currency: event.currency || 'INR',
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0c1017] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-white/[0.02]">
          <div>
            <span className="text-[10px] font-bold text-[#0099e6] uppercase tracking-wider">Organizer Controls</span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Edit Hackathon Event</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Hackathon Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6] focus:border-transparent"
              placeholder="e.g. CodeWars Hackathon"
            />
          </div>

          {/* Organizer / Host Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Host / Organizer (College or Organization Name & Lead) *
            </label>
            <input
              type="text"
              required
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6] focus:border-transparent"
              placeholder="e.g. Hacker's Unity"
            />
          </div>

          {/* Description with Rich Text Toolbar */}
          <div>
            <RichTextEditor
              label="Description & Problem Statement *"
              rows={4}
              value={description}
              onChange={(val) => setDescription(val)}
              placeholder="Detailed overview of the event (supports bold, lists, headings)..."
            />
          </div>

          {/* Status & Mode Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Event Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
              >
                <option value={EventStatus.PUBLISHED} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">Open for Registration (Live)</option>
                <option value={EventStatus.ONGOING} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">Ongoing (Live Now)</option>
                <option value={EventStatus.COMPLETED} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">Completed / Past Event</option>
                <option value={EventStatus.REGISTRATION_CLOSED} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">Registration Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Mode / Format
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
              >
                <option value="In-Person" className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">In-Person (Offline)</option>
                <option value="Online" className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">Online / Virtual</option>
                <option value="Offline" className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">Offline</option>
                <option value="Hybrid" className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Prize Pool Display & Numeric Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>Prize Pool Text</span>
              </label>
              <input
                type="text"
                value={prizeDisplay}
                onChange={(e) => setPrizeDisplay(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs font-bold text-[#ea580c] focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                placeholder="e.g. ₹50,000 or $2100 + Swags"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Approx Total Prize ($ / ₹ Value)
              </label>
              <input
                type="number"
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                placeholder="50000"
              />
            </div>
          </div>

          {/* Registration Fee Model */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#0099e6]" />
                <span>Registration Fee Model</span>
              </label>
              <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-white/[0.08] p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setRegistrationType('FREE')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    registrationType === 'FREE'
                      ? 'bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Free Entry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationType('PAID');
                    if (!entryFee || Number(entryFee) === 0) setEntryFee(800);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    registrationType === 'PAID'
                      ? 'bg-[#0099e6] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Paid Entry (₹)
                </button>
              </div>
            </div>

            {registrationType === 'PAID' && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-3 animate-in fade-in">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span>Entry fee collected per squad via Razorpay</span>
                </div>
                <div className="flex items-center gap-1.5 w-36">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                    placeholder="800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location / Venue with Autosuggest & Maps */}
          <div>
            <VenuePicker
              value={location}
              onChange={(val) => setLocation(val)}
              label="Location / In-Person Venue"
              placeholder="Search college, landmark, venue or city..."
              required={false}
            />
          </div>

          {/* Registered Hackers Display */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Registered Count Display
            </label>
            <input
              type="text"
              value={participantsDisplay}
              onChange={(e) => setParticipantsDisplay(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
              placeholder="e.g. 500+ or 1,000+"
            />
          </div>

          {/* Registration Link & CTA Text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#0099e6]" />
                <span>Portal / Registration URL</span>
              </label>
              <input
                type="text"
                value={registrationLink}
                onChange={(e) => setRegistrationLink(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs font-mono text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                placeholder="https://devfolio.co/... or https://devpost.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                CTA Button Text
              </label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                placeholder="Learn More"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Domain Tags (comma-separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
              placeholder="AI/ML, Web3, Blockchain, IoT"
            />
          </div>

          {/* Featured Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="featured-check"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 text-[#0099e6] rounded border-slate-300 dark:border-white/20 bg-white dark:bg-white/[0.05] focus:ring-[#0099e6]"
            />
            <label htmlFor="featured-check" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-[#ea580c]" />
              <span>Feature this Hackathon prominently on Home page</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
