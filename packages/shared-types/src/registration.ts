// ─── Enums ───────────────────────────────────────────────

export enum RegistrationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLISTED = 'WAITLISTED',
  WITHDRAWN = 'WITHDRAWN',
}

// ─── Types ───────────────────────────────────────────────

export interface Registration {
  id: string;
  eventId: string;
  userId: string | null;
  teamId: string | null;
  status: RegistrationStatus;
  submissionUrl: string | null;
  answers: Record<string, unknown> | null;
  registeredAt: string;
  // Extended registration fields
  userName?: string;
  userEmail?: string;
  phone?: string;
  college?: string;
  city?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: string[];
  customAnswers?: Record<string, unknown>;
}

// ─── DTOs ────────────────────────────────────────────────

export interface RegisterForEventDto {
  eventId: string;
  teamId?: string;
  answers?: Record<string, unknown>;
}

export interface MyRegistrationsParams {
  tab?: 'upcoming' | 'ongoing' | 'past' | 'withdrawn';
  page?: number;
  limit?: number;
}
