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

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatEventDateTime(dateString?: string | null): string {
  if (!dateString) return 'TBA';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const hasTime =
      dateString.includes('T') &&
      !dateString.endsWith('T00:00:00Z') &&
      !dateString.endsWith('T00:00:00.000Z');
    if (hasTime) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString || 'TBA';
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

export function getEffectiveEventStatus(event?: {
  status?: EventStatus | string | null;
  registrationDeadline?: string | null;
  endDate?: string | null;
} | null): EventStatus {
  if (!event) return EventStatus.PUBLISHED;
  const currentStatus = (event.status as EventStatus) || EventStatus.PUBLISHED;

  // Never alter draft or pending approval states
  if (
    currentStatus === EventStatus.DRAFT ||
    currentStatus === EventStatus.PENDING_APPROVAL
  ) {
    return currentStatus;
  }

  // If explicitly completed
  if (currentStatus === EventStatus.COMPLETED) {
    return EventStatus.COMPLETED;
  }

  // If registration deadline has passed, status dynamically becomes COMPLETED
  if (isEventRegistrationClosed(event.registrationDeadline, event.endDate)) {
    return EventStatus.COMPLETED;
  }

  return currentStatus;
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
      return { text: 'Ended', urgent: false, past: true };
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
    isEventRegistrationClosed(registrationDeadline, endDate)
  ) {
    resolvedStatus = EventStatus.COMPLETED;
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
export function getEventPrivateLink(event: { slug?: string; id?: string; previewToken?: string }, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://hackersunity.com');
  const token = getEventPreviewToken(event);
  const slug = event.slug || event.id || 'preview';
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

export interface ReceiptDownloadData {
  receiptNo: string;
  eventName: string;
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  paymentId?: string;
  bankUtr?: string;
  amount: number | string;
  currency?: string;
  date?: string;
  paymentMethod?: string;
}

export function downloadReceiptPdf(data: ReceiptDownloadData): void {
  if (typeof window === 'undefined') return;

  const receiptNo = data.receiptNo || 'HU-REC-XXXX';
  const eventName = data.eventName || 'Hackathon';
  const teamName = data.teamName || 'Squad';
  const leaderName = data.leaderName || 'Participant';
  const leaderEmail = data.leaderEmail || 'support@hackersunity.com';
  const paymentId = data.paymentId || 'N/A';
  const bankUtr = data.bankUtr || 'N/A';
  const amount = Number(data.amount || 0).toLocaleString('en-IN');
  const dateStr = data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const paymentMethod = (data.paymentMethod || 'UPI').toUpperCase();

  const printWindow = window.open('', '_blank', 'width=750,height=900');
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt-${receiptNo}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    body { background-color: #f8fafc; color: #0f172a; padding: 30px; display: flex; justify-content: center; }
    .card { background: #ffffff; width: 100%; max-width: 620px; border: 1px solid #e2e8f0; border-radius: 24px; padding: 36px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px dashed #e2e8f0; margin-bottom: 24px; }
    .brand-tag { font-size: 11px; font-weight: 800; color: #0099e6; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
    .title { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 999px; font-size: 12px; font-weight: 800; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 24px; margin-bottom: 26px; }
    .label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
    .val { font-size: 14px; font-weight: 800; color: #0f172a; word-break: break-word; }
    .val.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .table-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px; }
    .table-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; font-size: 13px; color: #475569; }
    .table-row.total { border-top: 2px solid #cbd5e1; margin-top: 10px; padding-top: 12px; font-size: 15px; font-weight: 900; color: #0f172a; }
    .table-row.total .amt { color: #ea580c; font-size: 22px; font-weight: 900; font-family: ui-monospace, monospace; }
    .footer { text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 11px; color: #94a3b8; line-height: 1.6; }
    .seal { display: inline-block; padding: 4px 10px; border-radius: 6px; background: #eff6ff; color: #0284c7; font-size: 10px; font-weight: 800; margin-top: 8px; }
    @media print {
      body { background: white; padding: 0; }
      .card { border: none; box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="brand-tag">Hacker's Unity Platform</div>
        <h1 class="title">Official Payment Receipt</h1>
      </div>
      <div class="badge">
        <span>✓</span>
        <span>VERIFIED PAID</span>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="label">Receipt Number</div>
        <div class="val mono">${receiptNo}</div>
      </div>
      <div>
        <div class="label">Payment Date</div>
        <div class="val">${dateStr}</div>
      </div>
      <div>
        <div class="label">Event Title</div>
        <div class="val">${eventName}</div>
      </div>
      <div>
        <div class="label">Squad / Team</div>
        <div class="val">${teamName}</div>
      </div>
      <div>
        <div class="label">Team Leader / Builder</div>
        <div class="val">${leaderName}</div>
      </div>
      <div>
        <div class="label">Email Address</div>
        <div class="val mono">${leaderEmail}</div>
      </div>
    </div>

    <div class="table-box">
      <div class="table-row">
        <span>Payment ID (Razorpay)</span>
        <span class="mono" style="font-weight: 700; color: #0f172a;">${paymentId}</span>
      </div>
      <div class="table-row">
        <span>Bank UTR / Reference</span>
        <span class="mono" style="font-weight: 700; color: #059669;">${bankUtr}</span>
      </div>
      <div class="table-row">
        <span>Payment Method</span>
        <span style="font-weight: 800; color: #0f172a;">${paymentMethod}</span>
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
      }, 200);
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
