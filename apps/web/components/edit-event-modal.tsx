'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trophy, Calendar, MapPin, Tag, Globe, Sparkles } from 'lucide-react';
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
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <span className="text-[10px] font-bold text-[#0099e6] uppercase tracking-wider">Organizer Controls</span>
            <h3 className="text-xl font-black text-slate-900">Edit Hackathon Event</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Hackathon Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6] focus:border-transparent"
              placeholder="e.g. CodeWars Hackathon"
            />
          </div>

          {/* Organizer / Host Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Host / Organizer (College or Organization Name & Lead) *
            </label>
            <input
              type="text"
              required
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6] focus:border-transparent"
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Event Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0099e6] bg-white cursor-pointer"
              >
                <option value={EventStatus.PUBLISHED}>Open for Registration (Live)</option>
                <option value={EventStatus.ONGOING}>Ongoing (Live Now)</option>
                <option value={EventStatus.COMPLETED}>Completed / Past Event</option>
                <option value={EventStatus.REGISTRATION_CLOSED}>Registration Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mode / Format
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0099e6] bg-white cursor-pointer"
              >
                <option value="In-Person">In-Person (Offline)</option>
                <option value="Online">Online / Virtual</option>
                <option value="Offline">Offline</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Prize Pool Display & Numeric Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>Prize Pool Text</span>
              </label>
              <input
                type="text"
                value={prizeDisplay}
                onChange={(e) => setPrizeDisplay(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#ea580c] focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                placeholder="e.g. ₹50,000 or $2100 + Swags"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Approx Total Prize ($ / ₹ Value)
              </label>
              <input
                type="number"
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                placeholder="50000"
              />
            </div>
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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Registered Count Display
            </label>
            <input
              type="text"
              value={participantsDisplay}
              onChange={(e) => setParticipantsDisplay(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
              placeholder="e.g. 500+ or 1,000+"
            />
          </div>

          {/* Registration Link & CTA Text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#0099e6]" />
                <span>Portal / Registration URL</span>
              </label>
              <input
                type="text"
                value={registrationLink}
                onChange={(e) => setRegistrationLink(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                placeholder="https://devfolio.co/... or https://devpost.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                CTA Button Text
              </label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                placeholder="Learn More"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Domain Tags (comma-separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
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
              className="w-4 h-4 text-[#0099e6] rounded border-slate-300 focus:ring-[#0099e6]"
            />
            <label htmlFor="featured-check" className="text-xs font-bold text-slate-800 flex items-center gap-1 cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-[#ea580c]" />
              <span>Feature this Hackathon prominently on Home page</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
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
