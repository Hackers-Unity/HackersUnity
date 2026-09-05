// ─── Enums ───────────────────────────────────────────────

export enum EventStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  PUBLISHED = 'PUBLISHED',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum EventType {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  HYBRID = 'HYBRID',
}

export enum EventCategory {
  HACKATHON = 'HACKATHON',
  COMPETITION = 'COMPETITION',
  WORKSHOP = 'WORKSHOP',
  QUIZ = 'QUIZ',
  WEBINAR = 'WEBINAR',
  CONFERENCE = 'CONFERENCE',
  OTHER = 'OTHER',
}

// ─── Types ───────────────────────────────────────────────

export interface CustomQuestion {
  id: string;
  label: string;
  type: 'text' | 'select' | 'textarea';
  required: boolean;
  options?: string[]; // for select type
}

export interface EventPublic {
  id: string;
  organizerId: string;
  title: string;
  slug: string;
  description: string;
  category: EventCategory;
  eventType: EventType;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  eligibilityRules: Record<string, unknown> | null;
  prizes: Prize[];
  bannerUrl: string | null;
  rulesDocUrl: string | null;
  status: EventStatus;
  maxParticipants: number | null;
  minTeamSize: number | null;
  maxTeamSize: number | null;
  isTeamEvent: boolean;
  location: string | null;
  createdAt: string;
  // New hosting fields
  tagline?: string;
  logoUrl?: string | null;
  registrationStart?: string;
  timezone?: string;
  eligibility?: string;
  difficulty?: string;
  rulesText?: string;
  registrationType?: 'FREE' | 'PAID';
  entryFee?: number | null;
  currency?: string;
  registrationCapacity?: number | null;
  approvalMode?: 'AUTO' | 'MANUAL';
  customQuestions?: CustomQuestion[];
  registrationFields?: string[];
  previewToken?: string;
}

export interface Prize {
  position: string;
  amount: number | null;
  description: string;
}

export interface EventStage {
  id: string;
  eventId: string;
  stageName: string;
  stageOrder: number;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface EventFaq {
  id: string;
  eventId: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface EventUpdate {
  id: string;
  eventId: string;
  title: string;
  content: string;
  createdAt: string;
}

// ─── DTOs ────────────────────────────────────────────────

export interface CreateEventDto {
  title: string;
  description: string;
  category: EventCategory;
  eventType: EventType;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  eligibilityRules?: Record<string, unknown>;
  prizes?: Prize[];
  maxParticipants?: number;
  minTeamSize?: number;
  maxTeamSize?: number;
  isTeamEvent?: boolean;
  location?: string;
}

export interface EventListParams {
  page?: number;
  limit?: number;
  category?: EventCategory;
  eventType?: EventType;
  status?: EventStatus;
  search?: string;
  sortBy?: 'newest' | 'deadline' | 'popular' | 'prize';
}

export interface EventListResponse {
  events: EventPublic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
