import { clsx, type ClassValue } from 'clsx';
import { EventCategory, EventStatus, EventType } from '@hackers-unity/shared-types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number | null | undefined, currency: 'USD' | 'INR' = 'USD'): string {
  if (amount == null) return 'Perks & Swag';
  if (amount === 0) return 'Free Entry';
  
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string, timeZone?: string | null): string {
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    if (timeZone) {
      options.timeZone = timeZone;
    }
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string, timeZone?: string | null): string {
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    if (timeZone) {
      options.timeZone = timeZone;
    }
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    return dateString;
  }
}

export function formatEventDateTime(dateString?: string | null, timeZone?: string | null): string {
  if (!dateString) return 'TBA';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const hasTime =
      dateString.includes('T') &&
      !dateString.endsWith('T00:00:00Z') &&
      !dateString.endsWith('T00:00:00.000Z') &&
      !dateString.endsWith('T00:00:00+00:00');
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    if (hasTime) {
      options.hour = 'numeric';
      options.minute = '2-digit';
    }
    if (timeZone) {
      options.timeZone = timeZone;
    }
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    return dateString || 'TBA';
  }
}

/**
 * Converts a local date string (YYYY-MM-DD), time string (HH:mm), and IANA timezone into a UTC ISO string.
 * Example: toUTCISO("2026-10-30", "14:00", "Asia/Kolkata") -> "2026-10-30T08:30:00.000Z"
 */
export function toUTCISO(
  dateStr?: string | null,
  timeStr?: string | null,
  timeZone = 'Asia/Kolkata'
): string | null {
  if (!dateStr || !dateStr.trim()) return null;
  const cleanDate = dateStr.trim();
  const time = timeStr && timeStr.trim() ? timeStr.trim() : '00:00';
  const fullTime = time.length === 5 ? `${time}:00` : time;

  if (!timeZone || timeZone === 'UTC') {
    return `${cleanDate}T${fullTime}Z`;
  }

  try {
    const invDate = new Date(`${cleanDate}T${fullTime}Z`);
    if (isNaN(invDate.getTime())) return `${cleanDate}T${fullTime}Z`;

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(invDate);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const tzAsUtc = new Date(
      Date.UTC(
        Number(map.year),
        Number(map.month) - 1,
        Number(map.day),
        Number(map.hour),
        Number(map.minute),
        Number(map.second)
      )
    );
    const offsetMs = tzAsUtc.getTime() - invDate.getTime();
    return new Date(invDate.getTime() - offsetMs).toISOString();
  } catch {
    return `${cleanDate}T${fullTime}Z`;
  }
}

/**
 * Converts a UTC ISO timestamp into { date: 'YYYY-MM-DD', time: 'HH:mm' } in the specified timezone.
 * Example: fromUTCISO("2026-10-30T08:30:00.000Z", "Asia/Kolkata") -> { date: "2026-10-30", time: "14:00" }
 */
export function fromUTCISO(
  isoString?: string | null,
  timeZone = 'Asia/Kolkata'
): { date: string; time: string } {
  if (!isoString) return { date: '', time: '09:00' };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
        return { date: isoString, time: '09:00' };
      }
      return { date: '', time: '09:00' };
    }
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(d);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return {
      date: `${map.year}-${map.month}-${map.day}`,
      time: `${map.hour}:${map.minute}`,
    };
  } catch {
    return { date: '', time: '09:00' };
  }
}

export function calculateEventDuration(
  startDate?: string | null,
  endDate?: string | null
): string | null {
  if (!startDate || !endDate) return null;
  try {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return null;

    const diffHours = (end - start) / (1000 * 60 * 60);
    if (diffHours < 1) {
      const minutes = Math.round((end - start) / (1000 * 60));
      return `${minutes} Min`;
    }
    if (diffHours < 24) {
      const hours = Math.round(diffHours * 10) / 10;
      return `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
    }
    const days = Math.round((diffHours / 24) * 10) / 10;
    const roundedHours = Math.round(diffHours);
    if (Number.isInteger(days)) {
      return `${roundedHours} Hours (${days} ${days === 1 ? 'Day' : 'Days'})`;
    }
    return `${roundedHours} Hours (~${days} Days)`;
  } catch {
    return null;
  }
}

export function isEventRegistrationClosed(registrationDeadline?: string | null, endDate?: string | null): boolean {
  const deadlineStr = registrationDeadline || endDate;
  if (!deadlineStr) return false;
  try {
    const trimmed = String(deadlineStr).trim();
    if (!trimmed) return false;
    // If date format is YYYY-MM-DD, allow registration through the full day (23:59:59.999)
    const dateToParse = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      ? `${trimmed}T23:59:59.999`
      : trimmed;
    const target = new Date(dateToParse).getTime();
    if (isNaN(target)) return false;
    return target < Date.now();
  } catch {
    return false;
  }
}

export function isEventEnded(endDate?: string | null): boolean {
  if (!endDate) return false;
  try {
    const trimmed = String(endDate).trim();
    if (!trimmed) return false;
    const dateToParse = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      ? `${trimmed}T23:59:59.999`
      : trimmed;
    const target = new Date(dateToParse).getTime();
    if (isNaN(target)) return false;
    return target < Date.now();
  } catch {
    return false;
  }
}

export function isEventRegistrationEnded(event?: {
  status?: EventStatus | string | null;
  registrationDeadline?: string | null;
  registration_deadline?: string | null;
  endDate?: string | null;
  end_date?: string | null;
} | null): boolean {
  if (!event) return false;
  const status = (event.status || '').toUpperCase();
  if (status === 'COMPLETED' || status === 'REGISTRATION_CLOSED') {
    return true;
  }
  const regDeadline = event.registrationDeadline || event.registration_deadline;
  const endDate = event.endDate || event.end_date;
  if (isEventEnded(endDate)) {
    return true;
  }
  if (isEventRegistrationClosed(regDeadline, endDate)) {
    return true;
  }
  return false;
}

export function getEffectiveEventStatus(event?: {
  status?: EventStatus | string | null;
  registrationDeadline?: string | null;
  startDate?: string | null;
  endDate?: string | null;
} | null): EventStatus {
  if (!event) return EventStatus.PUBLISHED;
  const currentStatus = (event.status as EventStatus) || EventStatus.PUBLISHED;

  // Never alter draft, pending approval, or rejected states
  if (
    currentStatus === EventStatus.DRAFT ||
    currentStatus === EventStatus.PENDING_APPROVAL ||
    (currentStatus as string) === 'REJECTED'
  ) {
    return currentStatus;
  }

  // 1. If explicitly set to COMPLETED or the event's overall end date has passed
  if (currentStatus === EventStatus.COMPLETED || isEventEnded(event.endDate)) {
    return EventStatus.COMPLETED;
  }

  // 2. If event has started and not ended yet, it is ONGOING
  if (event.startDate && !isEventEnded(event.endDate)) {
    try {
      const startTarget = new Date(event.startDate).getTime();
      if (!isNaN(startTarget) && startTarget <= Date.now()) {
        return EventStatus.ONGOING;
      }
    } catch {}
  }

  // 3. If registration deadline has passed (but event has NOT ended yet), status is REGISTRATION_CLOSED
  if (
    currentStatus === EventStatus.REGISTRATION_CLOSED ||
    isEventRegistrationClosed(event.registrationDeadline, event.endDate)
  ) {
    return EventStatus.REGISTRATION_CLOSED;
  }

  return currentStatus;
}

export interface SubmissionPortalStatus {
  enabled: boolean;
  isOpen: boolean;
  isUpcoming: boolean;
  isClosed: boolean;
  startIso: string | null;
  endIso: string | null;
  statusLabel: string;
  badgeColor: 'emerald' | 'amber' | 'rose' | 'slate';
  buttonText: string;
  subtext: string;
  formattedStart: string | null;
  formattedEnd: string | null;
}

export function getSubmissionPortalStatus(
  event?: {
    submissionsEnabled?: boolean;
    submissionStartDate?: string | null;
    submissionDeadline?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    timezone?: string | null;
    tags?: string[];
  } | null,
  nowDate: Date = new Date()
): SubmissionPortalStatus {
  if (!event) {
    return {
      enabled: false,
      isOpen: false,
      isUpcoming: false,
      isClosed: true,
      startIso: null,
      endIso: null,
      statusLabel: 'Submissions Closed',
      badgeColor: 'slate',
      buttonText: 'Submissions Closed',
      subtext: 'Event details not available.',
      formattedStart: null,
      formattedEnd: null,
    };
  }

  // 1. Check enabled/disabled
  let enabled = true;
  let parsedSchedule: any = null;

  if (Array.isArray(event.tags)) {
    const sTag = event.tags.find((t: string) => typeof t === 'string' && t.startsWith('hu_sub_schedule:'));
    if (sTag) {
      try {
        parsedSchedule = JSON.parse(sTag.substring('hu_sub_schedule:'.length));
      } catch {}
    }
  }

  // Priority: If explicitly disabled anywhere (object, DB, or tags schedule), it MUST be disabled
  if (event.submissionsEnabled === false || (event as any).submissions_enabled === false) {
    enabled = false;
  } else if (parsedSchedule && typeof parsedSchedule.enabled === 'boolean') {
    enabled = parsedSchedule.enabled;
  } else if (typeof event.submissionsEnabled === 'boolean') {
    enabled = event.submissionsEnabled;
  } else if (typeof (event as any).submissions_enabled === 'boolean') {
    enabled = (event as any).submissions_enabled;
  }

  if (!enabled) {
    return {
      enabled: false,
      isOpen: false,
      isUpcoming: false,
      isClosed: true,
      startIso: null,
      endIso: null,
      statusLabel: 'Submissions Disabled',
      badgeColor: 'rose',
      buttonText: 'Submissions Closed',
      subtext: 'Submissions are currently disabled for this hackathon by the host.',
      formattedStart: null,
      formattedEnd: null,
    };
  }

  // 2. Resolve Start and End Date
  const startIso =
    event.submissionStartDate ||
    (event as any).submission_start_date ||
    parsedSchedule?.startIso ||
    (parsedSchedule?.startDate ? `${parsedSchedule.startDate}T${parsedSchedule.startTime || '09:00'}:00Z` : null) ||
    null;

  const endIso =
    event.submissionDeadline ||
    (event as any).submission_deadline ||
    (event as any).submission_end_date ||
    parsedSchedule?.endIso ||
    (parsedSchedule?.endDate ? `${parsedSchedule.endDate}T${parsedSchedule.endTime || '18:00'}:00Z` : null) ||
    null;

  const nowMs = nowDate.getTime();
  const startMs = startIso ? new Date(startIso).getTime() : null;
  const endMs = endIso ? new Date(endIso).getTime() : null;

  const formattedStart = startIso ? formatDateTime(startIso, event.timezone) : null;
  const formattedEnd = endIso ? formatDateTime(endIso, event.timezone) : null;

  // 3. Check Upcoming
  if (startMs && !isNaN(startMs) && nowMs < startMs) {
    return {
      enabled: true,
      isOpen: false,
      isUpcoming: true,
      isClosed: false,
      startIso,
      endIso,
      statusLabel: `Opens ${formattedStart}`,
      badgeColor: 'amber',
      buttonText: `Submissions Open ${formattedStart}`,
      subtext: `Submissions will open on ${formattedStart}.`,
      formattedStart,
      formattedEnd,
    };
  }

  // 4. Check Closed (Deadline passed)
  if (endMs && !isNaN(endMs) && nowMs > endMs) {
    return {
      enabled: true,
      isOpen: false,
      isUpcoming: false,
      isClosed: true,
      startIso,
      endIso,
      statusLabel: 'Submissions Closed',
      badgeColor: 'rose',
      buttonText: 'Submissions Closed',
      subtext: `The submission deadline ended on ${formattedEnd}.`,
      formattedStart,
      formattedEnd,
    };
  }

  // 5. Open!
  return {
    enabled: true,
    isOpen: true,
    isUpcoming: false,
    isClosed: false,
    startIso,
    endIso,
    statusLabel: 'Submissions Open',
    badgeColor: 'emerald',
    buttonText: 'Submission Portal',
    subtext: formattedEnd ? `Submissions close on ${formattedEnd}.` : 'Submissions are currently open.',
    formattedStart,
    formattedEnd,
  };
}

export function getDaysLeft(dateString?: string | null): { text: string; urgent: boolean; past: boolean } {
  if (!dateString) {
    return { text: 'TBA', urgent: false, past: false };
  }
  try {
    const trimmed = String(dateString).trim();
    if (!trimmed) {
      return { text: 'TBA', urgent: false, past: false };
    }
    const dateToParse = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      ? `${trimmed}T23:59:59.999`
      : trimmed;
    const target = new Date(dateToParse).getTime();
    if (isNaN(target)) {
      return { text: 'TBA', urgent: false, past: false };
    }
    const now = Date.now();

    if (target < now) {
      return { text: 'Closed', urgent: false, past: true };
    }

    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { text: 'Ends today', urgent: true, past: false };
    }
    if (diffDays === 1) {
      return { text: '1 day left', urgent: true, past: false };
    }
    if (diffDays <= 5) {
      return { text: `${diffDays} days left`, urgent: true, past: false };
    }
    return { text: `${diffDays} days left`, urgent: false, past: false };
  } catch {
    return { text: 'TBA', urgent: false, past: false };
  }
}

export function getCategoryBadge(category: EventCategory): { label: string; bg: string; text: string; border: string } {
  switch (category) {
    case EventCategory.HACKATHON:
      return { label: 'Hackathon', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' };
    case EventCategory.COMPETITION:
      return { label: 'Competition', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' };
    case EventCategory.WORKSHOP:
      return { label: 'Workshop', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    case EventCategory.QUIZ:
      return { label: 'Quiz', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
    case EventCategory.WEBINAR:
      return { label: 'Webinar', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
    case EventCategory.CONFERENCE:
      return { label: 'Conference', bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' };
    default:
      return { label: 'Event', bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' };
  }
}

export function getStatusBadge(
  status: EventStatus,
  registrationDeadline?: string | null,
  endDate?: string | null
): { label: string; color: string; dot: string } {
  let resolvedStatus = status;

  if (
    status !== EventStatus.DRAFT &&
    status !== EventStatus.PENDING_APPROVAL &&
    (status as string) !== 'REJECTED'
  ) {
    if (status === EventStatus.COMPLETED || isEventEnded(endDate)) {
      resolvedStatus = EventStatus.COMPLETED;
    } else if (
      status === EventStatus.REGISTRATION_CLOSED ||
      isEventRegistrationClosed(registrationDeadline, endDate)
    ) {
      resolvedStatus = EventStatus.REGISTRATION_CLOSED;
    }
  }

  switch (resolvedStatus) {
    case EventStatus.PENDING_APPROVAL:
      return { label: 'Verification Pending', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' };
    case EventStatus.PUBLISHED:
      return { label: 'Open for Registration', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' };
    case EventStatus.ONGOING:
      return { label: 'Live Now', color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30 animate-pulse', dot: 'bg-cyan-500' };
    case EventStatus.REGISTRATION_CLOSED:
      return { label: 'Registration Closed', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' };
    case EventStatus.COMPLETED:
      return { label: 'Completed', color: 'bg-zinc-500/10 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 border-zinc-400/30 dark:border-zinc-700/60', dot: 'bg-zinc-500 dark:bg-zinc-400' };
    case EventStatus.DRAFT:
      return { label: 'Draft', color: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30', dot: 'bg-slate-400' };
    default:
      return { label: 'Upcoming', color: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30', dot: 'bg-violet-500' };
  }
}

export function getEventTypeBadge(type: EventType): { label: string; icon: string } {
  switch (type) {
    case EventType.ONLINE:
      return { label: 'Virtual / Online', icon: '' };
    case EventType.OFFLINE:
      return { label: 'In-Person', icon: '' };
    case EventType.HYBRID:
      return { label: 'Hybrid', icon: '' };
  }
}

/**
 * Generate or retrieve a secure private preview token for an event
 */
export function getEventPreviewToken(event: { slug?: string; id?: string; previewToken?: string }): string {
  if (event.previewToken) return event.previewToken;
  const seed = (event.slug || event.id || 'hackathon').toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(36) + (seed.length * 9).toString(36);
  return `hu_prv_${hex}`;
}

/**
 * Generate a private, unlisted shareable link for unapproved / draft events
 */
export function getEventPrivateLink(event: { slug?: string; id?: string; previewToken?: string; title?: string }, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://hackersunity.com');
  const token = getEventPreviewToken(event);
  let slug = (event.slug && !event.slug.startsWith('evt_ai_') ? event.slug : null) ||
             (event.id && !event.id.startsWith('evt_ai_') ? event.id : null);
  if (!slug && (event.id === 'evt_ai_1791373781895' || event.title?.toLowerCase().includes('sphinx'))) {
    slug = 'sphinx-26';
  }
  slug = slug || event.slug || event.id || 'preview';
  return `${base}/hackathons/${slug}?preview_key=${token}`;
}

export function formatRegistrationCount(count: number | null | undefined): string {
  const num = typeof count === 'number' && !isNaN(count) ? Math.max(0, Math.floor(count)) : 0;
  if (num === 0) return '0 Registered';
  if (num === 1) return '1 Registered';
  if (num < 100) return `${num} Registered`;
  return `${num.toLocaleString()}+ Registered`;
}

export function formatBuildersCount(count: number | null | undefined): string {
  const num = typeof count === 'number' && !isNaN(count) ? Math.max(0, Math.floor(count)) : 0;
  if (num === 0) return '0 Builders';
  if (num === 1) return '1 Builder';
  if (num < 100) return `${num} Builders`;
  return `${num.toLocaleString()}+ Builders`;
}

export interface ReceiptMember {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  status?: string;
}

export interface ReceiptDownloadData {
  receiptNo: string;
  eventName: string;
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone?: string;
  paymentId?: string;
  bankUtr?: string;
  amount: number | string;
  currency?: string;
  date?: string;
  paymentMethod?: string;
  status?: string;
  members?: ReceiptMember[];
}

export interface BulkReceiptsPdfData {
  eventTitle: string;
  eventSlug?: string;
  organizerName?: string;
  includeSummaryCover?: boolean;
  receipts: ReceiptDownloadData[];
}

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function downloadReceiptPdf(data: ReceiptDownloadData): void {
  if (typeof window === 'undefined') return;

  const receiptNo = data.receiptNo || 'HU-REC-XXXX';
  const eventName = data.eventName || 'Hackathon';
  const teamName = data.teamName || 'Squad';
  const leaderName = data.leaderName || 'Participant';
  const leaderEmail = data.leaderEmail || 'support@hackersunity.com';
  const leaderPhone = data.leaderPhone || '';
  const paymentId = data.paymentId || 'N/A';
  const bankUtr = data.bankUtr || 'N/A';
  const amount = Number(data.amount || 0).toLocaleString('en-IN');
  const dateStr = data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const paymentMethod = (data.paymentMethod || 'UPI').toUpperCase();
  const isPaid = (data.status || 'PAID').toUpperCase() === 'PAID';
  const members = Array.isArray(data.members) ? data.members : [];

  const printWindow = window.open('', '_blank', 'width=800,height=920');

  const membersHtml = members.length > 0 ? `
    <div style="margin-top: 18px; margin-bottom: 22px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px;">
      <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
        Registered Squad Participants (${members.length})
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="border-bottom: 1px solid #cbd5e1; text-align: left; color: #64748b;">
            <th style="padding: 4px 6px;">#</th>
            <th style="padding: 4px 6px;">Participant Name</th>
            <th style="padding: 4px 6px;">Email</th>
            <th style="padding: 4px 6px;">Role</th>
          </tr>
        </thead>
        <tbody>
          ${members.map((m, idx) => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px; color: #94a3b8; font-weight: 700;">${idx + 1}</td>
              <td style="padding: 6px; font-weight: 700; color: #0f172a;">${escapeHtml(m.name || 'Member')}</td>
              <td style="padding: 6px; font-family: ui-monospace, monospace; color: #475569;">${escapeHtml(m.email || '')}</td>
              <td style="padding: 6px; font-weight: 600; color: #0284c7;">${escapeHtml(m.role || 'Member')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt-${escapeHtml(receiptNo)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    body { background-color: #f8fafc; color: #0f172a; padding: 24px; display: flex; flex-direction: column; align-items: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .toolbar { position: sticky; top: 10px; z-index: 100; background: #0f172a; color: white; width: 100%; max-width: 650px; border-radius: 12px; padding: 10px 18px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); }
    .btn { background: #0099e6; color: white; border: none; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: 700; cursor: pointer; }
    .btn:hover { background: #0088cc; }
    .card { background: #ffffff; width: 100%; max-width: 650px; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px dashed #e2e8f0; margin-bottom: 22px; }
    .brand-tag { font-size: 11px; font-weight: 800; color: #0099e6; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
    .title { font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 999px; font-size: 12px; font-weight: 800; }
    .badge-pending { background: #fffbeb; color: #d97706; border-color: #fde68a; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px; margin-bottom: 22px; }
    .label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
    .val { font-size: 13.5px; font-weight: 800; color: #0f172a; word-break: break-word; }
    .val.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .table-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 20px; }
    .table-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 13px; color: #475569; }
    .table-row.total { border-top: 2px solid #cbd5e1; margin-top: 8px; padding-top: 10px; font-size: 15px; font-weight: 900; color: #0f172a; }
    .table-row.total .amt { color: #ea580c; font-size: 20px; font-weight: 900; font-family: ui-monospace, monospace; }
    .footer { text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 11px; color: #94a3b8; line-height: 1.6; }
    .seal { display: inline-block; padding: 4px 10px; border-radius: 6px; background: #eff6ff; color: #0284c7; font-size: 10px; font-weight: 800; margin-top: 6px; }
    @media print {
      body { background: white !important; padding: 0 !important; }
      .toolbar { display: none !important; }
      .card { border: none !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div style="font-size: 12px; font-weight: 700;">Hacker's Unity Official Receipt</div>
    <div style="display: flex; gap: 8px;">
      <button class="btn" onclick="window.print()">Save as PDF / Print</button>
      <button class="btn" style="background: rgba(255,255,255,0.15);" onclick="window.close()">Close</button>
    </div>
  </div>

  <div class="card">
    <div class="header">
      <div>
        <div class="brand-tag">Hacker's Unity Platform</div>
        <h1 class="title">Official Payment Receipt</h1>
      </div>
      <div class="badge ${isPaid ? '' : 'badge-pending'}">
        <span>${isPaid ? '✓ VERIFIED PAID' : '⏳ PAYMENT PENDING'}</span>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="label">Receipt Number</div>
        <div class="val mono">${escapeHtml(receiptNo)}</div>
      </div>
      <div>
        <div class="label">Payment Date</div>
        <div class="val">${escapeHtml(dateStr)}</div>
      </div>
      <div>
        <div class="label">Event Title</div>
        <div class="val">${escapeHtml(eventName)}</div>
      </div>
      <div>
        <div class="label">Squad / Team</div>
        <div class="val">${escapeHtml(teamName)}</div>
      </div>
      <div>
        <div class="label">Team Leader / Builder</div>
        <div class="val">${escapeHtml(leaderName)}</div>
      </div>
      <div>
        <div class="label">Email Address</div>
        <div class="val mono">${escapeHtml(leaderEmail)}</div>
      </div>
      ${leaderPhone ? `
      <div>
        <div class="label">Phone Number</div>
        <div class="val mono">${escapeHtml(leaderPhone)}</div>
      </div>
      ` : ''}
    </div>

    ${membersHtml}

    <div class="table-box">
      <div class="table-row">
        <span>Payment ID (Razorpay)</span>
        <span class="mono" style="font-weight: 700; color: #0f172a;">${escapeHtml(paymentId)}</span>
      </div>
      <div class="table-row">
        <span>Bank UTR / Reference</span>
        <span class="mono" style="font-weight: 700; color: #059669;">${escapeHtml(bankUtr)}</span>
      </div>
      <div class="table-row">
        <span>Payment Method</span>
        <span style="font-weight: 800; color: #0f172a;">${escapeHtml(paymentMethod)}</span>
      </div>
      <div class="table-row total">
        <span>Amount Paid</span>
        <span class="amt">₹${amount}</span>
      </div>
    </div>

    <div class="footer">
      <div>This is an official computer-generated receipt issued by Hacker's Unity (hackersunity.com).</div>
      <div class="seal">AUTHENTIC DIGITAL RECEIPT • HACKER'S UNITY ACCOUNTS</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    window.print();
  }
}

/**
 * Downloads all payment receipts compiled into a single unified multi-page PDF document
 */
export function downloadBulkReceiptsPdf(data: BulkReceiptsPdfData): void {
  if (typeof window === 'undefined') return;
  if (!data.receipts || data.receipts.length === 0) return;

  const eventTitle = data.eventTitle || 'Hackathon';
  const organizerName = data.organizerName || "Hacker's Unity";
  const receipts = data.receipts;
  const includeCover = data.includeSummaryCover !== false;

  const totalReceipts = receipts.length;
  const totalAmount = receipts.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const totalParticipants = receipts.reduce((acc, r) => acc + (r.members && r.members.length > 0 ? r.members.length : 1), 0);
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const generatedTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const printWindow = window.open('', '_blank', 'width=920,height=980');

  // Generate Master Ledger Rows for Cover Sheet
  const ledgerRowsHtml = receipts.map((r, i) => {
    const isPaid = (r.status || 'PAID').toUpperCase() === 'PAID';
    const memberCount = r.members && r.members.length > 0 ? r.members.length : 1;
    return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11.5px; ${i % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        <td style="padding: 7px 8px; color: #64748b; font-weight: 700;">${i + 1}</td>
        <td style="padding: 7px 8px; font-family: ui-monospace, monospace; font-weight: 700; color: #0284c7;">${escapeHtml(r.receiptNo)}</td>
        <td style="padding: 7px 8px; font-weight: 800; color: #0f172a;">${escapeHtml(r.teamName || 'Squad')}</td>
        <td style="padding: 7px 8px; color: #334155;">
          <div style="font-weight: 700;">${escapeHtml(r.leaderName || 'Participant')}</div>
          <div style="font-size: 10px; color: #64748b; font-family: ui-monospace, monospace;">${escapeHtml(r.leaderEmail || '')}</div>
        </td>
        <td style="padding: 7px 8px; font-family: ui-monospace, monospace; font-weight: 700; color: #059669;">${escapeHtml(r.bankUtr || 'N/A')}</td>
        <td style="padding: 7px 8px; text-align: center; font-weight: 700; color: #475569;">${memberCount}</td>
        <td style="padding: 7px 8px; text-align: right; font-family: ui-monospace, monospace; font-weight: 800; color: #ea580c;">₹${Number(r.amount || 0).toLocaleString('en-IN')}</td>
        <td style="padding: 7px 8px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; ${
            isPaid ? 'background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;' : 'background: #fffbeb; color: #d97706; border: 1px solid #fde68a;'
          }">
            ${isPaid ? 'PAID' : 'PENDING'}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  // Generate Individual Receipts HTML
  const receiptsHtml = receipts.map((item, index) => {
    const isPaid = (item.status || 'PAID').toUpperCase() === 'PAID';
    const amountStr = Number(item.amount || 0).toLocaleString('en-IN');
    const itemDate = item.date || generatedDate;
    const members = Array.isArray(item.members) ? item.members : [];

    const squadMembersHtml = members.length > 0 ? `
      <div style="margin-top: 16px; margin-bottom: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-size: 10.5px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">
            Squad Participants Covered (${members.length})
          </div>
          <div style="font-size: 10px; font-weight: 700; color: #0099e6;">
            All Members Included
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
          <thead>
            <tr style="border-bottom: 1px solid #cbd5e1; text-align: left; color: #64748b; font-size: 10px; text-transform: uppercase;">
              <th style="padding: 4px 6px;">#</th>
              <th style="padding: 4px 6px;">Participant Name</th>
              <th style="padding: 4px 6px;">Email Address</th>
              <th style="padding: 4px 6px;">Phone</th>
              <th style="padding: 4px 6px;">Role</th>
            </tr>
          </thead>
          <tbody>
            ${members.map((m, mIdx) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 5px 6px; color: #94a3b8; font-weight: 700;">${mIdx + 1}</td>
                <td style="padding: 5px 6px; font-weight: 800; color: #0f172a;">${escapeHtml(m.name || 'Member')}</td>
                <td style="padding: 5px 6px; font-family: ui-monospace, monospace; color: #475569;">${escapeHtml(m.email || '')}</td>
                <td style="padding: 5px 6px; font-family: ui-monospace, monospace; color: #64748b;">${escapeHtml(m.phone || '—')}</td>
                <td style="padding: 5px 6px; font-weight: 700; color: ${m.role?.toLowerCase().includes('lead') ? '#0284c7' : '#64748b'};">
                  ${escapeHtml(m.role || 'Member')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    return `
      <div class="receipt-card">
        <div class="receipt-header">
          <div>
            <div class="brand-tag">Hacker's Unity Platform • Official Payment Receipt</div>
            <h2 class="receipt-title">Payment Receipt & Confirmation</h2>
            <div class="event-title-badge">${escapeHtml(item.eventName)}</div>
          </div>
          <div style="text-align: right;">
            <div class="receipt-pill">${escapeHtml(item.receiptNo)}</div>
            <div class="badge ${isPaid ? 'badge-paid' : 'badge-pending'}">
              <span>${isPaid ? '✓ VERIFIED PAID' : '⏳ PAYMENT PENDING'}</span>
            </div>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <div class="info-label">Receipt Number</div>
            <div class="info-val mono">${escapeHtml(item.receiptNo)}</div>
          </div>
          <div>
            <div class="info-label">Payment Date</div>
            <div class="info-val">${escapeHtml(itemDate)}</div>
          </div>
          <div>
            <div class="info-label">Squad / Team</div>
            <div class="info-val highlight-val">${escapeHtml(item.teamName)}</div>
          </div>
          <div>
            <div class="info-label">Team Leader / Contact</div>
            <div class="info-val">${escapeHtml(item.leaderName)}</div>
          </div>
          <div>
            <div class="info-label">Registered Email</div>
            <div class="info-val mono">${escapeHtml(item.leaderEmail)}</div>
          </div>
          <div>
            <div class="info-label">Contact Phone</div>
            <div class="info-val mono">${escapeHtml(item.leaderPhone || 'Not Specified')}</div>
          </div>
        </div>

        ${squadMembersHtml}

        <div class="financial-box">
          <div class="financial-row">
            <span>Payment Gateway ID (Razorpay)</span>
            <span class="mono" style="font-weight: 700; color: #0f172a;">${escapeHtml(item.paymentId || 'N/A')}</span>
          </div>
          <div class="financial-row">
            <span>Bank UTR / Transaction Reference</span>
            <span class="mono" style="font-weight: 800; color: #059669; font-size: 13.5px;">${escapeHtml(item.bankUtr || 'N/A')}</span>
          </div>
          <div class="financial-row">
            <span>Payment Mode</span>
            <span style="font-weight: 800; color: #0f172a;">${escapeHtml((item.paymentMethod || 'UPI').toUpperCase())}</span>
          </div>
          <div class="financial-row total-row">
            <span>Total Registration Fee Paid</span>
            <span class="total-amt">₹${amountStr}</span>
          </div>
        </div>

        <div class="receipt-footer">
          <div>This is an official computer-generated receipt issued by Hacker's Unity (hackersunity.com). Valid for official hackathon check-in and institutional reimbursement.</div>
          <div class="receipt-seal">AUTHENTIC DIGITAL RECEIPT • HACKER'S UNITY ACCOUNTS</div>
          <div class="page-counter">Receipt ${index + 1} of ${totalReceipts}</div>
        </div>
      </div>
      ${index < receipts.length - 1 ? '<div class="page-break"></div>' : ''}
    `;
  }).join('');

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(eventTitle)} - Consolidated Payment Receipts (${totalReceipts})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      background-color: #0b0f19;
      color: #0f172a;
      padding: 24px 16px 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .toolbar {
      position: sticky;
      top: 12px;
      z-index: 999;
      background: #111827;
      border: 1px solid rgba(255,255,255,0.12);
      color: white;
      width: 100%;
      max-width: 820px;
      border-radius: 16px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 15px 35px -5px rgba(0,0,0,0.5);
      gap: 12px;
    }
    .toolbar-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .toolbar-title {
      font-size: 13px;
      font-weight: 800;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toolbar-sub {
      font-size: 11px;
      color: #94a3b8;
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-print {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #0099e6;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-print:hover {
      background: #0088cc;
    }
    .btn-close {
      background: rgba(255,255,255,0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-close:hover {
      background: rgba(255,255,255,0.15);
      color: white;
    }
    .cover-card, .receipt-card {
      background: #ffffff;
      width: 100%;
      max-width: 820px;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 36px 40px;
      box-shadow: 0 12px 36px -10px rgba(0,0,0,0.2);
      position: relative;
    }
    .brand-tag {
      font-size: 10.5px;
      font-weight: 800;
      color: #0099e6;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 4px;
    }
    .cover-title {
      font-size: 26px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }
    .cover-subtitle {
      font-size: 13px;
      color: #475569;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin: 24px 0 28px;
    }
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 16px;
    }
    .stat-label {
      font-size: 10.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .stat-val {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
    }
    .stat-val.highlight {
      color: #ea580c;
      font-family: ui-monospace, monospace;
    }
    .stat-val.small {
      font-size: 14px;
      font-weight: 800;
      color: #334155;
    }
    .ledger-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .ledger-table thead tr {
      background: #f1f5f9;
      color: #475569;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
      border-bottom: 2px solid #cbd5e1;
    }
    .ledger-table th {
      padding: 9px 8px;
      text-align: left;
      font-weight: 800;
    }
    .receipt-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 18px;
      border-bottom: 2px dashed #e2e8f0;
      margin-bottom: 22px;
    }
    .receipt-title {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .event-title-badge {
      font-size: 12.5px;
      font-weight: 700;
      color: #0099e6;
      margin-top: 2px;
    }
    .receipt-pill {
      font-size: 11px;
      font-weight: 800;
      font-family: ui-monospace, monospace;
      color: #64748b;
      margin-bottom: 6px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
    }
    .badge-paid {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .badge-pending {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fde68a;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px 20px;
      margin-bottom: 20px;
    }
    .info-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 3px;
    }
    .info-val {
      font-size: 13.5px;
      font-weight: 800;
      color: #0f172a;
      word-break: break-word;
    }
    .info-val.highlight-val {
      color: #0284c7;
    }
    .info-val.mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .financial-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 20px;
    }
    .financial-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 12.5px;
      color: #475569;
    }
    .financial-row.total-row {
      border-top: 2px solid #cbd5e1;
      margin-top: 8px;
      padding-top: 10px;
      font-size: 14.5px;
      font-weight: 900;
      color: #0f172a;
    }
    .financial-row.total-row .total-amt {
      color: #ea580c;
      font-size: 21px;
      font-weight: 900;
      font-family: ui-monospace, monospace;
    }
    .receipt-footer {
      text-align: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
      font-size: 10.5px;
      color: #94a3b8;
      line-height: 1.6;
      position: relative;
    }
    .receipt-seal {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      background: #eff6ff;
      color: #0284c7;
      font-size: 10px;
      font-weight: 800;
      margin-top: 6px;
    }
    .page-counter {
      margin-top: 4px;
      font-size: 10px;
      font-weight: 700;
      color: #cbd5e1;
      font-family: ui-monospace, monospace;
    }
    .page-break {
      page-break-after: always !important;
      break-after: page !important;
      height: 0;
      display: block;
    }
    @media print {
      body {
        background: white !important;
        padding: 0 !important;
        gap: 0 !important;
      }
      .toolbar {
        display: none !important;
      }
      .cover-card, .receipt-card {
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        box-shadow: none !important;
        padding: 24px 28px !important;
        max-width: 100% !important;
        margin-bottom: 0 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        min-height: 270mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .page-break {
        page-break-after: always !important;
        break-after: page !important;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-info">
      <div class="toolbar-title">
        <span>📄</span>
        <span>${escapeHtml(eventTitle)} — Payment Receipts (${totalReceipts})</span>
      </div>
      <div class="toolbar-sub">
        ${totalParticipants} Participants Covered • Total Collections: ₹${totalAmount.toLocaleString('en-IN')}
      </div>
    </div>
    <div class="toolbar-actions">
      <button class="btn-print" onclick="window.print()">Save as PDF / Print All</button>
      <button class="btn-close" onclick="window.close()">Close</button>
    </div>
  </div>

  ${includeCover ? `
    <div class="cover-card">
      <div>
        <div class="brand-tag">Hacker's Unity Official Accounts & Auditing Division</div>
        <h1 class="cover-title">Payment Receipts Master Ledger</h1>
        <div class="cover-subtitle">
          Consolidated Financial Proof & Registration Receipts for <strong>${escapeHtml(eventTitle)}</strong>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Receipts</div>
            <div class="stat-val">${totalReceipts}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Participants Covered</div>
            <div class="stat-val">${totalParticipants}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Verified Collections</div>
            <div class="stat-val highlight">₹${totalAmount.toLocaleString('en-IN')}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Generated Timestamp</div>
            <div class="stat-val small">${escapeHtml(generatedDate)} ${escapeHtml(generatedTime)}</div>
          </div>
        </div>

        <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
          Master Receipts Index
        </div>
        <table class="ledger-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Receipt No</th>
              <th>Squad / Team</th>
              <th>Leader / Contact</th>
              <th>Bank UTR / Ref</th>
              <th style="text-align: center;">Members</th>
              <th style="text-align: right;">Amount</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${ledgerRowsHtml}
          </tbody>
        </table>
      </div>

      <div class="receipt-footer">
        <div>This document is an authentic computerized audit ledger issued by Hacker's Unity Platform (hackersunity.com).</div>
        <div class="receipt-seal">MASTER CONSOLIDATED AUDIT LEDGER • HACKER'S UNITY ACCOUNTS</div>
      </div>
    </div>
    <div class="page-break"></div>
  ` : ''}

  ${receiptsHtml}

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
  } else {
    window.print();
  }
}

/**
 * Filter out system internal metadata tags (e.g. hu_*, allow_external_redirect, PENDING_APPROVAL, raw JSON)
 * so only human-readable user tags are displayed.
 */
export function filterDisplayTags(tags: unknown[] | null | undefined): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter((t): t is string => {
    if (typeof t !== 'string') return false;
    const clean = t.trim();
    if (!clean) return false;
    if (clean.startsWith('hu_') || clean.startsWith('#hu_')) return false;
    if (clean === 'allow_external_redirect' || clean === 'PENDING_APPROVAL') return false;
    if (
      clean.startsWith('{') ||
      clean.startsWith('[') ||
      clean.startsWith('"{') ||
      clean.startsWith('"[') ||
      clean.startsWith('#{') ||
      clean.startsWith('#[')
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Extract external registration link from an event object (checking direct field, snake_case field, and tags)
 */
export function extractRegistrationLink(event: any): string | null {
  if (!event) return null;
  const direct =
    typeof event.registrationLink === 'string'
      ? event.registrationLink.trim()
      : typeof event.registration_link === 'string'
      ? event.registration_link.trim()
      : '';
  if (direct && direct !== '#' && direct !== '/') return direct;

  if (Array.isArray(event.tags)) {
    const linkTag = event.tags.find(
      (t: any) =>
        typeof t === 'string' &&
        (t.startsWith('hu_reg_link:') || t.startsWith('hu_reg_url:'))
    );
    if (linkTag) {
      const val = linkTag.replace(/^hu_reg_(link|url):/, '').trim();
      if (val && val !== '#' && val !== '/') return val;
    }
  }
  return null;
}

/**
 * Determine if an event is allowed to redirect to an external registration portal
 */
export function isExternalRedirectAllowed(event: any): boolean {
  if (!event) return false;
  return Boolean(
    event.allowExternalRedirect === true ||
    event.allow_external_redirect === true ||
    (Array.isArray(event.tags) && event.tags.includes('allow_external_redirect'))
  );
}

/**
 * Returns a normalized, clickable URL if external redirect is allowed and link is present, or null otherwise
 */
export function getExternalRedirectUrl(event: any): string | null {
  if (!isExternalRedirectAllowed(event)) return null;
  const raw = extractRegistrationLink(event);
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '#' || trimmed === '/') return null;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;
}

