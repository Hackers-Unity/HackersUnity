import { ExtendedEvent, MOCK_EVENTS } from './mock-data';
import { UserPublic, UserRole } from '@hackers-unity/shared-types';
import { toggleBookmarkInSupabase, fetchUserBookmarks } from './supabase-service';

export interface UserRegistrationItem {
  eventId: string;
  eventName: string;
  registeredAt: string;
  teamName?: string;
  isTeam: boolean;
  role: string;
  status: 'CONFIRMED' | 'SUBMITTED' | 'UNDER_REVIEW';
}

const STORAGE_KEYS = {
  BOOKMARKS: 'hackers_unity_bookmarks',
  REGISTRATIONS: 'hackers_unity_registrations',
  HOSTED_EVENTS: 'hackers_unity_hosted_events',
  USER_PROFILE: 'hackers_unity_user_profile',
  INVITES: 'hackers_unity_invites',
  SUBMISSIONS: 'hackers_unity_project_submissions',
};

export const DEFAULT_USER: UserPublic = {
  id: 'usr_me',
  name: 'Chinmay Bhatt',
  email: 'chinmay@hackersunity.dev',
  phone: '+91 99887 76655',
  role: UserRole.PARTICIPANT,
  college: 'Computer Science & AI Institute',
  organization: 'Hackers Unity Core',
  graduationYear: 2026,
  bio: 'Fullstack builder, AI agent enthusiast, and competitive hackathon winner.',
  avatarUrl: '⚡',
  skills: ['Next.js 16', 'TypeScript', 'Node.js', 'PyTorch', 'TailwindCSS', 'PostgreSQL'],
  resumeUrl: null,
  socialLinks: {
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    portfolio: 'https://hackersunity.dev',
  },
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00Z',
};

// Bookmarks
export function getBookmarkedEventIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleBookmarkEvent(eventId: string, userId?: string): string[] {
  if (typeof window === 'undefined') return [];
  const current = getBookmarkedEventIds();
  const exists = current.includes(eventId);
  const updated = exists ? current.filter((id) => id !== eventId) : [...current, eventId];
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error(e);
  }

  // If user is authenticated, sync with Supabase in background
  const targetUserId = userId || getStoredUser()?.id;
  if (targetUserId && targetUserId.length > 10 && targetUserId.includes('-')) {
    toggleBookmarkInSupabase(targetUserId, eventId).catch((err) => {
      console.warn('Supabase bookmark toggle sync warning:', err);
    });
  }

  return updated;
}

export async function syncBookmarksWithSupabase(userId: string): Promise<string[]> {
  if (typeof window === 'undefined' || !userId) return getBookmarkedEventIds();
  try {
    const remoteIds = await fetchUserBookmarks(userId);
    const localIds = getBookmarkedEventIds();
    const merged = Array.from(new Set([...localIds, ...remoteIds]));
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(merged));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
    return merged;
  } catch {
    return getBookmarkedEventIds();
  }
}

// Registrations
export function getMyRegistrations(): UserRegistrationItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function registerForEventStorage(reg: UserRegistrationItem): void {
  if (typeof window === 'undefined') return;
  const current = getMyRegistrations();
  const filtered = current.filter((item) => item.eventId !== reg.eventId);
  const updated = [reg, ...filtered];
  try {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(updated));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error(e);
  }
}

// Custom Hosted & Managed Events
const STORAGE_KEYS_EVENTS_OVERRIDE = 'hackers_unity_events_overrides';
const STORAGE_KEYS_DELETED_EVENTS = 'hackers_unity_deleted_events';

export function getCustomEvents(): ExtendedEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOSTED_EVENTS);
    if (!raw) return [];
    const parsed: ExtendedEvent[] = JSON.parse(raw);
    return parsed.filter(
      (e) =>
        e &&
        e.title &&
        !e.title.toLowerCase().includes('global autonomous ai sprint') &&
        !e.id?.includes('global-autonomous')
    );
  } catch {
    return [];
  }
}

function sanitizeEventForStorage(event: ExtendedEvent): ExtendedEvent {
  // If bannerUrl or logoUrl is a raw data URL larger than 100KB, create a lightweight version for local storage
  const sanitized = { ...event };
  if (sanitized.bannerUrl && sanitized.bannerUrl.startsWith('data:') && sanitized.bannerUrl.length > 100000) {
    // Keep a fallback representation
    sanitized.image = undefined;
  }
  return sanitized;
}

function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    console.warn(`LocalStorage quota warning on key "${key}":`, e?.message);
    try {
      // Try to free up space by cleaning old heavy items if any
      const rawHosted = localStorage.getItem(STORAGE_KEYS.HOSTED_EVENTS);
      if (rawHosted) {
        const parsed: ExtendedEvent[] = JSON.parse(rawHosted);
        const slimmed = parsed.slice(0, 10).map((evt) => {
          const c = { ...evt };
          if (c.bannerUrl && c.bannerUrl.startsWith('data:') && c.bannerUrl.length > 50000) {
            c.bannerUrl = null;
            c.image = undefined;
          }
          if (c.logoUrl && c.logoUrl.startsWith('data:') && c.logoUrl.length > 50000) {
            c.logoUrl = null;
          }
          return c;
        });
        localStorage.setItem(STORAGE_KEYS.HOSTED_EVENTS, JSON.stringify(slimmed));
      }
      localStorage.setItem(key, value);
      return true;
    } catch {
      console.warn('LocalStorage save failed even after cleanup, continuing in-memory.');
      return false;
    }
  }
}

export function saveHostedEvent(event: ExtendedEvent): void {
  if (typeof window === 'undefined') return;
  const current = getCustomEvents();
  const sanitized = sanitizeEventForStorage(event);
  const updated = [sanitized, ...current.filter((e) => e.id !== sanitized.id)];
  try {
    safeLocalStorageSet(STORAGE_KEYS.HOSTED_EVENTS, JSON.stringify(updated));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error('saveHostedEvent error:', e);
  }
}

export function updateHostedEvent(event: ExtendedEvent): void {
  if (typeof window === 'undefined') return;
  try {
    const sanitized = sanitizeEventForStorage(event);
    const rawOverrides = localStorage.getItem(STORAGE_KEYS_EVENTS_OVERRIDE);
    const overrides: Record<string, ExtendedEvent> = rawOverrides ? JSON.parse(rawOverrides) : {};
    overrides[sanitized.id] = sanitized;
    safeLocalStorageSet(STORAGE_KEYS_EVENTS_OVERRIDE, JSON.stringify(overrides));

    // Also update in hosted events if present
    const custom = getCustomEvents();
    const updatedCustom = custom.map((e) => (e.id === sanitized.id ? sanitized : e));
    safeLocalStorageSet(STORAGE_KEYS.HOSTED_EVENTS, JSON.stringify(updatedCustom));

    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error('updateHostedEvent error:', e);
  }
}

export function deleteHostedEvent(eventId: string, slug?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const rawDeleted = localStorage.getItem(STORAGE_KEYS_DELETED_EVENTS);
    const deleted: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
    if (eventId && !deleted.includes(eventId)) {
      deleted.push(eventId);
    }
    if (slug && !deleted.includes(slug)) {
      deleted.push(slug);
    }
    localStorage.setItem(STORAGE_KEYS_DELETED_EVENTS, JSON.stringify(deleted));

    const custom = getCustomEvents();
    const updatedCustom = custom.filter(
      (e) => e.id !== eventId && e.slug !== eventId && (!slug || (e.id !== slug && e.slug !== slug))
    );
    localStorage.setItem(STORAGE_KEYS.HOSTED_EVENTS, JSON.stringify(updatedCustom));

    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error(e);
  }
}

export function getAllEvents(): ExtendedEvent[] {
  if (typeof window === 'undefined') {
    return MOCK_EVENTS;
  }
  try {
    const rawDeleted = localStorage.getItem(STORAGE_KEYS_DELETED_EVENTS);
    const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];

    const rawOverrides = localStorage.getItem(STORAGE_KEYS_EVENTS_OVERRIDE);
    const overrides: Record<string, ExtendedEvent> = rawOverrides ? JSON.parse(rawOverrides) : {};

    const custom = getCustomEvents();
    const baseMerged = [...custom, ...MOCK_EVENTS];

    return baseMerged
      .filter((e) => !deletedIds.includes(e.id) && !deletedIds.includes(e.slug))
      .map((e) => (overrides[e.id] ? { ...e, ...overrides[e.id] } : e));
  } catch {
    return MOCK_EVENTS;
  }
}

export function getEventBySlug(slug: string): ExtendedEvent | undefined {
  const all = getAllEvents();
  return all.find((e) => e.slug === slug || e.id === slug);
}

// User Profile
export function getStoredUser(): UserPublic | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: UserPublic): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error(e);
  }
}

export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.REGISTRATIONS);
    localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
    localStorage.removeItem(STORAGE_KEYS.HOSTED_EVENTS);
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error(e);
  }
}

// ─── Event Registration Management ──────────────────────────

export interface EventRegistration {
  id: string;
  eventId: string;
  userId?: string;
  userName: string;
  userEmail: string;
  phone?: string;
  college?: string;
  city?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: string[];
  customAnswers?: Record<string, string>;
  isTeam?: boolean;
  teamName?: string;
  role?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONFIRMED';
  registeredAt: string;
}

const EVENT_REGS_PREFIX = 'hackers_unity_event_regs_';

export function getEventRegistrations(eventId: string): EventRegistration[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${EVENT_REGS_PREFIX}${eventId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEventRegistration(reg: EventRegistration): void {
  if (typeof window === 'undefined') return;
  const current = getEventRegistrations(reg.eventId);
  // Prevent duplicate by email
  const filtered = current.filter((r) => r.userEmail !== reg.userEmail);
  const updated = [reg, ...filtered];
  try {
    localStorage.setItem(`${EVENT_REGS_PREFIX}${reg.eventId}`, JSON.stringify(updated));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error(e);
  }
}

export function updateRegistrationStatus(
  eventId: string,
  regId: string,
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONFIRMED'
): void {
  if (typeof window === 'undefined') return;
  const current = getEventRegistrations(eventId);
  const updated = current.map((r) => (r.id === regId ? { ...r, status } : r));
  try {
    localStorage.setItem(`${EVENT_REGS_PREFIX}${eventId}`, JSON.stringify(updated));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error(e);
  }
}

export function getRegistrationStats(eventId: string): {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
} {
  const regs = getEventRegistrations(eventId);
  return {
    total: regs.length,
    approved: regs.filter((r) => r.status === 'APPROVED' || r.status === 'CONFIRMED').length,
    pending: regs.filter((r) => r.status === 'PENDING').length,
    rejected: regs.filter((r) => r.status === 'REJECTED').length,
  };
}

export function saveDraftEvent(event: ExtendedEvent): void {
  if (typeof window === 'undefined') return;
  const draftEvent = { ...event, status: 'DRAFT' as any };
  const current = getCustomEvents();
  const existingIdx = current.findIndex((e) => e.id === draftEvent.id);
  let updated: ExtendedEvent[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = draftEvent;
  } else {
    updated = [draftEvent, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEYS.HOSTED_EVENTS, JSON.stringify(updated));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error(e);
  }
}

// ─── Project Submissions ────────────────────────────────────

export interface ProjectSubmission {
  id: string;
  eventId: string;
  eventName?: string;
  submittedBy: string;
  submittedByName?: string;
  submittedByEmail?: string;
  submittedAt: string;
  updatedAt?: string;
  // Required fields:
  projectTitle: string;
  tagline?: string;
  projectDescription: string;
  projectLink: string; // GitHub repository or live project link
  track?: string;
  // Optional fields:
  demoVideoUrl?: string;
  zipFileName?: string;
  zipFileSize?: string;
  presentationUrl?: string;
  additionalResources?: string;
  score?: number;
  reviewNotes?: string;
  status?: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'WINNER' | 'REJECTED';
}

const GOOGLE_SHEETS_WEBHOOK_PREFIX = 'hackers_unity_gsheet_webhook_';

export function getAllProjectSubmissions(eventId?: string): ProjectSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    const list: ProjectSubmission[] = raw ? JSON.parse(raw) : [];
    if (eventId) {
      return list.filter((s) => s.eventId === eventId);
    }
    return list;
  } catch {
    return [];
  }
}

export function getEventSubmissionsCount(eventId: string): number {
  return getAllProjectSubmissions(eventId).length;
}

export function getProjectSubmission(eventId: string, userId?: string): ProjectSubmission | null {
  const all = getAllProjectSubmissions(eventId);
  if (!all.length) return null;
  if (userId) {
    return all.find((s) => s.submittedBy === userId) || null;
  }
  return all[0] || null;
}

export function saveProjectSubmission(submission: ProjectSubmission): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getAllProjectSubmissions();
    const existingIdx = all.findIndex(
      (s) => s.id === submission.id || (s.eventId === submission.eventId && s.submittedBy === submission.submittedBy)
    );
    let updated: ProjectSubmission[];
    if (existingIdx >= 0) {
      updated = [...all];
      updated[existingIdx] = {
        ...updated[existingIdx],
        ...submission,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updated = [{ ...submission, updatedAt: new Date().toISOString() }, ...all];
    }
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(updated));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));

    // Trigger background webhook if configured
    const webhook = getGoogleSheetsWebhook(submission.eventId);
    if (webhook) {
      fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_webhook', submission, webhookUrl: webhook }),
      }).catch((e) => console.warn('Background Google Sheets webhook sync notice:', e));
    }
  } catch (e) {
    console.error('Error saving project submission:', e);
  }
}

export function updateProjectSubmissionStatus(
  submissionId: string,
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'WINNER' | 'REJECTED',
  score?: number,
  reviewNotes?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getAllProjectSubmissions();
    const idx = all.findIndex((s) => s.id === submissionId);
    if (idx >= 0) {
      all[idx].status = status;
      if (score !== undefined) all[idx].score = score;
      if (reviewNotes !== undefined) all[idx].reviewNotes = reviewNotes;
      all[idx].updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(all));
      window.dispatchEvent(new Event('hackers_unity_storage_change'));
    }
  } catch (e) {
    console.error('Error updating submission status:', e);
  }
}

export function deleteProjectSubmission(submissionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getAllProjectSubmissions();
    const updated = all.filter((s) => s.id !== submissionId);
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(updated));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error('Error deleting project submission:', e);
  }
}

export function saveGoogleSheetsWebhook(eventId: string, webhookUrl: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${GOOGLE_SHEETS_WEBHOOK_PREFIX}${eventId}`, webhookUrl.trim());
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error('Error saving Google Sheets webhook:', e);
  }
}

export function getGoogleSheetsWebhook(eventId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(`${GOOGLE_SHEETS_WEBHOOK_PREFIX}${eventId}`) || null;
  } catch {
    return null;
  }
}

// ─── Local Teams Management (For Custom Events & Offline Fallbacks) ─────────────
const LOCAL_TEAMS_PREFIX = 'hackers_unity_teams_';
const LOCAL_INVITES_PREFIX = 'hackers_unity_invites_';

export function getLocalEventTeams(eventId: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_TEAMS_PREFIX}${eventId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalEventTeam(eventId: string, team: any): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalEventTeams(eventId);
    const filtered = current.filter((t) => t.id !== team.id);
    const updated = [team, ...filtered];
    localStorage.setItem(`${LOCAL_TEAMS_PREFIX}${eventId}`, JSON.stringify(updated));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error('Error saving local team:', e);
  }
}

export function getLocalTeamWithMembers(teamId: string): any | null {
  if (typeof window === 'undefined') return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_TEAMS_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list: any[] = JSON.parse(raw);
          const found = list.find((t) => t.id === teamId);
          if (found) return found;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function deleteLocalTeam(teamId: string): void {
  if (typeof window === 'undefined') return;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_TEAMS_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list: any[] = JSON.parse(raw);
          const filtered = list.filter((t) => t.id !== teamId);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    }
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error('Error deleting local team:', e);
  }
}

export function joinLocalEventTeam(eventId: string, teamId: string, member: any): boolean {
  if (typeof window === 'undefined') return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_TEAMS_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const teams: any[] = JSON.parse(raw);
          const teamIdx = teams.findIndex((t) => t.id === teamId);
          if (teamIdx !== -1) {
            const team = teams[teamIdx];
            const members = team.team_members || [];
            if (members.length >= (team.max_members || 4)) return false;
            team.team_members = [...members, member];
            teams[teamIdx] = team;
            localStorage.setItem(key, JSON.stringify(teams));
            window.dispatchEvent(new Event('hackers_unity_storage_change'));
            return true;
          }
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function getLocalTeamInvites(teamId: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_INVITES_PREFIX}${teamId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalTeamInvite(teamId: string, invite: any): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalTeamInvites(teamId);
    const filtered = current.filter((inv) => inv.invited_email !== invite.invited_email);
    const updated = [invite, ...filtered];
    localStorage.setItem(`${LOCAL_INVITES_PREFIX}${teamId}`, JSON.stringify(updated));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error('Error saving local team invite:', e);
  }
}

export function getLocalInviteByToken(token: string): any | null {
  if (typeof window === 'undefined') return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_INVITES_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const invites: any[] = JSON.parse(raw);
          const found = invites.find((inv) => inv.invite_token === token);
          if (found) {
            const team = getLocalTeamWithMembers(found.team_id);
            return {
              ...found,
              teams: team,
              events: {
                id: found.event_id,
                slug: found.event_id,
                title: team?.name ? `${team.name}'s Hackathon` : 'Hackathon Arena',
              },
            };
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function updateLocalInviteStatus(token: string, status: 'ACCEPTED' | 'DECLINED'): boolean {
  if (typeof window === 'undefined') return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_INVITES_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const invites: any[] = JSON.parse(raw);
          const idx = invites.findIndex((inv) => inv.invite_token === token);
          if (idx !== -1) {
            invites[idx].status = status;
            localStorage.setItem(key, JSON.stringify(invites));
            window.dispatchEvent(new Event('hackers_unity_storage_change'));
            return true;
          }
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}
