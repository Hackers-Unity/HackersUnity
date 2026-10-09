'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Save,
  Loader2,
  Trophy,
  Calendar,
  MapPin,
  Tag,
  Building2,
  Mail,
  Phone,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  Sliders,
  Image as ImageIcon,
  Users,
  FileSpreadsheet,
  Globe,
  Lock,
} from 'lucide-react';

export interface AdminEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  tagline?: string;
  category: string;
  event_type: string;
  location: string;
  organizer_id?: string;
  organizer_name: string;
  organizer_avatar?: string;
  organizer_email?: string;
  organizer_phone?: string;
  host_type?: string;
  institution_name?: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  registration_start?: string;
  total_prize_value: number;
  currency?: string;
  prizes?: any[];
  tracks?: any[];
  stages?: any[];
  faqs?: any[];
  sponsors?: any[];
  tags?: string[];
  min_team_size: number;
  max_team_size: number;
  is_team_event: boolean;
  featured: boolean;
  status: string;
  banner_url?: string;
  logo_url?: string;
  timezone?: string;
  eligibility?: string;
  difficulty?: string;
  rules_text?: string;
  custom_questions?: any[];
  admin_feedback?: string;
  reviewed_at?: string;
  registration_count?: number;
  submission_count?: number;
  registration_link?: string | null;
  allow_external_redirect?: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminEditEventModalProps {
  isOpen: boolean;
  event: AdminEvent | null;
  onClose: () => void;
  onSave: (updatedEvent: AdminEvent) => Promise<boolean>;
}

// Convert ISO date string to YYYY-MM-DDTHH:mm format for datetime-local inputs
function toDateTimeLocal(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  } catch {
    return '';
  }
}

export function AdminEditEventModal({
  isOpen,
  event,
  onClose,
  onSave,
}: AdminEditEventModalProps) {
  // Form states
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [hostType, setHostType] = useState('COLLEGE');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');
  const [category, setCategory] = useState('HACKATHON');
  const [eventType, setEventType] = useState('ONLINE');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('PUBLISHED');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [totalPrizeValue, setTotalPrizeValue] = useState<number>(0);
  const [currency, setCurrency] = useState('INR');
  const [description, setDescription] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [difficulty, setDifficulty] = useState('OPEN');
  const [minTeamSize, setMinTeamSize] = useState<number>(1);
  const [maxTeamSize, setMaxTeamSize] = useState<number>(4);
  const [isTeamEvent, setIsTeamEvent] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [adminFeedback, setAdminFeedback] = useState('');
  const [allowExternalRedirect, setAllowExternalRedirect] = useState(false);
  const [registrationLink, setRegistrationLink] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setTagline(event.tagline || '');
      setOrganizerName(event.organizer_name || '');
      setInstitutionName(event.institution_name || '');
      setHostType(event.host_type || 'COLLEGE');
      setOrganizerEmail(event.organizer_email || '');
      setOrganizerPhone(event.organizer_phone || '');
      setCategory(event.category || 'HACKATHON');
      setEventType(event.event_type || 'ONLINE');
      setLocation(event.location || 'Online');
      setStatus(event.status || 'PUBLISHED');
      setStartDate(toDateTimeLocal(event.start_date));
      setEndDate(toDateTimeLocal(event.end_date));
      setRegistrationDeadline(toDateTimeLocal(event.registration_deadline));
      setTotalPrizeValue(Number(event.total_prize_value) || 0);
      setCurrency(event.currency || 'INR');
      setDescription(event.description || '');
      setRulesText(event.rules_text || '');
      setEligibility(event.eligibility || '');
      setDifficulty(event.difficulty || 'OPEN');
      setMinTeamSize(event.min_team_size ?? 1);
      setMaxTeamSize(event.max_team_size ?? 4);
      setIsTeamEvent(event.is_team_event ?? true);
      setFeatured(Boolean(event.featured));
      setTagsInput(Array.isArray(event.tags) ? event.tags.join(', ') : '');
      setBannerUrl(event.banner_url || '');
      setLogoUrl(event.logo_url || '');
      setAdminFeedback(event.admin_feedback || '');
      setAllowExternalRedirect(Boolean(event.allow_external_redirect));
      setRegistrationLink(event.registration_link || '');
      setErrorMessage('');
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSaving(true);

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updatedEvent: AdminEvent = {
      ...event,
      title: title.trim() || event.title,
      tagline: tagline.trim(),
      organizer_name: organizerName.trim() || event.organizer_name,
      institution_name: institutionName.trim(),
      host_type: hostType,
      organizer_email: organizerEmail.trim(),
      organizer_phone: organizerPhone.trim(),
      category,
      event_type: eventType,
      location: location.trim() || (eventType === 'ONLINE' ? 'Online' : 'In-Person'),
      status,
      start_date: startDate ? new Date(startDate).toISOString() : event.start_date,
      end_date: endDate ? new Date(endDate).toISOString() : event.end_date,
      registration_deadline: registrationDeadline
        ? new Date(registrationDeadline).toISOString()
        : event.registration_deadline,
      total_prize_value: Number(totalPrizeValue) || 0,
      currency,
      description: description.trim(),
      rules_text: rulesText.trim(),
      eligibility: eligibility.trim(),
      difficulty,
      min_team_size: Number(minTeamSize) || 1,
      max_team_size: Number(maxTeamSize) || 4,
      is_team_event: isTeamEvent,
      featured,
      tags: parsedTags,
      banner_url: bannerUrl.trim() || undefined,
      logo_url: logoUrl.trim() || undefined,
      admin_feedback: adminFeedback.trim() || undefined,
      registration_link: registrationLink.trim() || null,
      allow_external_redirect: allowExternalRedirect,
      updated_at: new Date().toISOString(),
    };

    try {
      const success = await onSave(updatedEvent);
      if (success) {
        onClose();
      } else {
        setErrorMessage('Failed to save changes. Please review fields and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving event.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.1] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/50 text-[#0099e6] dark:text-[#38bdf8] text-[10px] font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Full Access Control
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Slug: <strong className="text-slate-700 dark:text-slate-300">{event.slug}</strong>
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Edit Event: {event.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Administrators have full privilege to modify any event created by any organizer.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <Link
              href={`/dashboard/events/${event.id || event.slug}/registrations`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold transition shadow-2xs whitespace-nowrap"
              title="Open registrations table in new tab"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Registrations ({event.registration_count || 0})</span>
            </Link>

            <Link
              href={`/dashboard/events/${event.id || event.slug}/submissions`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold transition shadow-2xs whitespace-nowrap"
              title="Open submissions spreadsheet in new tab"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Submissions ({event.submission_count || 0})</span>
            </Link>

            <Link
              href={`/host?edit=${encodeURIComponent(event.slug)}`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-bold transition whitespace-nowrap"
              title="Open full studio wizard in new tab"
            >
              <span>Full Studio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={onClose}
              disabled={saving}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* ═══ SECTION 1: Identity & Status ═══ */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0099e6]" />
              Event Identity &amp; Status
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hackathon Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hack in Hills '26"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline / Punchline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Not a Marathon. A Mountain Sprint."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Platform Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                >
                  <option value="PUBLISHED">PUBLISHED (Approved &amp; Live on Website)</option>
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL (Pending Admin Review)</option>
                  <option value="REGISTRATION_OPEN">REGISTRATION_OPEN (Open for Signups)</option>
                  <option value="LIVE">LIVE (Ongoing Hackathon)</option>
                  <option value="COMPLETED">COMPLETED (Concluded Event)</option>
                  <option value="DRAFT">DRAFT (Hidden / Unpublished)</option>
                  <option value="REJECTED">REJECTED (Denied / Hidden)</option>
                  <option value="ARCHIVED">ARCHIVED (Archived)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                >
                  <option value="HACKATHON">HACKATHON</option>
                  <option value="WORKSHOP">WORKSHOP</option>
                  <option value="MEETUP">MEETUP</option>
                  <option value="CONFERENCE">CONFERENCE</option>
                  <option value="BOOTCAMP">BOOTCAMP</option>
                  <option value="WEBINAR">WEBINAR</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="admin-edit-featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-[#0099e6] rounded border-slate-300 dark:border-white/[0.2] focus:ring-[#0099e6]"
                />
                <label
                  htmlFor="admin-edit-featured"
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>Feature on Platform Homepage (Promoted Flagship Badge)</span>
                </label>
              </div>
            </div>
          </div>

          {/* ═══ SECTION 2: Organizer & Host Details ═══ */}
          <div className="p-5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-800/30 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0099e6] dark:text-[#38bdf8] flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Organizer &amp; Host Institution Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Organizer / Host Name *
                </label>
                <input
                  type="text"
                  required
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder="e.g. Nexido • Eren"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Institution / Organization
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. Manipal University or Nexido Tech"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Host Type
                </label>
                <select
                  value={hostType}
                  onChange={(e) => setHostType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                >
                  <option value="COLLEGE">College / University</option>
                  <option value="ORGANIZATION">Company / Organization</option>
                  <option value="COMMUNITY">Developer Community</option>
                  <option value="INDEPENDENT">Independent Builder</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Organizer Contact Email
                </label>
                <input
                  type="email"
                  value={organizerEmail}
                  onChange={(e) => setOrganizerEmail(e.target.value)}
                  placeholder="organizer@college.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Organizer Contact Phone
                </label>
                <input
                  type="text"
                  value={organizerPhone}
                  onChange={(e) => setOrganizerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>
            </div>
          </div>

          {/* ═══ SECTION 3: Format, Venue & Dates ═══ */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0099e6]" />
              Format, Venue &amp; Schedule
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Mode
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                >
                  <option value="OFFLINE">In-Person (Offline)</option>
                  <option value="ONLINE">Online / Virtual</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Venue Address
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Manali, Himachal Pradesh or Discord / Online"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Start Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event End Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registration Deadline
                </label>
                <input
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>
            </div>
          </div>

          {/* ═══ SECTION 4: Prize Pool & Team Constraints ═══ */}
          <div className="p-5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-800/30 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ea580c] dark:text-[#fb923c] flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Prize Pool &amp; Team Size Rules
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Total Prize Value (Number)
                </label>
                <input
                  type="number"
                  value={totalPrizeValue}
                  onChange={(e) => setTotalPrizeValue(Number(e.target.value))}
                  placeholder="50000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                >
                  <option value="OPEN">Open for All</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Min Team Size
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={minTeamSize}
                  onChange={(e) => setMinTeamSize(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Max Team Size
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="admin-is-team-event"
                  checked={isTeamEvent}
                  onChange={(e) => setIsTeamEvent(e.target.checked)}
                  className="w-4 h-4 text-[#0099e6] rounded border-slate-300 dark:border-white/[0.2] focus:ring-[#0099e6]"
                />
                <label
                  htmlFor="admin-is-team-event"
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Allow Team Registrations (Squads)
                </label>
              </div>
            </div>
          </div>

          {/* ═══ SECTION 4B: External Registration Redirection ═══ */}
          <div className="p-5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-800/30 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0099e6] dark:text-[#38bdf8] flex items-center gap-2">
              <Globe className="w-4 h-4" />
              External Registration Redirection Control
            </h4>

            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="admin-allow-external-redirect"
                  checked={allowExternalRedirect}
                  onChange={(e) => setAllowExternalRedirect(e.target.checked)}
                  className="w-4 h-4 text-[#0099e6] rounded border-slate-300 dark:border-white/[0.2] focus:ring-[#0099e6] cursor-pointer"
                />
                <label
                  htmlFor="admin-allow-external-redirect"
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-2"
                >
                  <span>Grant Permission to Redirect Registration Externally</span>
                  {allowExternalRedirect ? (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-white/[0.1] dark:text-slate-300">
                      Locked
                    </span>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  External Registration Link (Admin Override)
                </label>
                <input
                  type="url"
                  value={registrationLink}
                  onChange={(e) => setRegistrationLink(e.target.value)}
                  placeholder="https://unstop.com/... or https://devfolio.co/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  When enabled and provided, clicking &quot;Register&quot; routes hackers to this external link instead of the HackersUnity squad registration flow.
                </p>
              </div>
            </div>
          </div>

          {/* ═══ SECTION 5: Description, Rules & Eligibility ═══ */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0099e6]" />
              Event Description &amp; Problem Statements
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Description / Overview *
              </label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive details about the hackathon tracks, schedule, rules, and offerings..."
                className="w-full p-3.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rules &amp; Code of Conduct
                </label>
                <textarea
                  rows={3}
                  value={rulesText}
                  onChange={(e) => setRulesText(e.target.value)}
                  placeholder="Official participation rules, submission criteria..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Eligibility Criteria
                </label>
                <textarea
                  rows={3}
                  value={eligibility}
                  onChange={(e) => setEligibility(e.target.value)}
                  placeholder="e.g. Open to all college students, developers, and working professionals..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>
            </div>
          </div>

          {/* ═══ SECTION 6: Media, Branding & Tags ═══ */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#0099e6]" />
              Media, Branding &amp; Tags
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Banner Image URL
                </label>
                <input
                  type="text"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Logo Image URL
                </label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <span>Domain Tags (Comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="AI/ML, Web3, Blockchain, Open Source, IoT"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Internal Feedback / Rejection Notes
                </label>
                <textarea
                  rows={2}
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  placeholder="Internal comments or feedback provided during review..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-[#0c1017] py-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving Changes...' : 'Save & Apply Event Updates'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
