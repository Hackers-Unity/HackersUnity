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

export function getDaysLeft(dateString: string): { text: string; urgent: boolean; past: boolean } {
  try {
    const target = new Date(dateString).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Ended', urgent: false, past: true };
    }
    if (diffDays === 0) {
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

export function getStatusBadge(status: EventStatus): { label: string; color: string; dot: string } {
  switch (status) {
    case EventStatus.PENDING_APPROVAL:
      return { label: 'Verification Pending', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30', dot: 'bg-amber-500' };
    case EventStatus.PUBLISHED:
      return { label: 'Open for Registration', color: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30', dot: 'bg-emerald-500' };
    case EventStatus.ONGOING:
      return { label: 'Live Now', color: 'bg-cyan-500/15 text-cyan-700 border-cyan-500/30 animate-pulse', dot: 'bg-cyan-500' };
    case EventStatus.REGISTRATION_CLOSED:
      return { label: 'Registration Closed', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30', dot: 'bg-amber-500' };
    case EventStatus.COMPLETED:
      return { label: 'Completed', color: 'bg-zinc-700/15 text-zinc-600 border-zinc-700/30', dot: 'bg-zinc-500' };
    case EventStatus.DRAFT:
      return { label: 'Draft', color: 'bg-slate-500/15 text-slate-600 border-slate-500/30', dot: 'bg-slate-400' };
    default:
      return { label: 'Upcoming', color: 'bg-violet-500/15 text-violet-700 border-violet-500/30', dot: 'bg-violet-500' };
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
