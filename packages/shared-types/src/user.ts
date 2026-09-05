import { UserRole } from './auth';

// ─── User types ──────────────────────────────────────────

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  college: string | null;
  organization: string | null;
  graduationYear: number | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  skills: string[];
  resumeUrl: string | null;
  socialLinks: SocialLinks | null;
  emailVerified: boolean;
  createdAt: string;
  // Dynamic Profession Fields
  professionType?: 'STUDENT' | 'PROFESSIONAL' | 'FREELANCER' | string;
  degree?: string | null;
  branch?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  experienceYears?: string | null;
  industry?: string | null;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
  twitter?: string;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  college?: string;
  organization?: string;
  graduationYear?: number;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string | null;
  skills?: string[];
  socialLinks?: SocialLinks;
  // Dynamic Profession Fields
  professionType?: 'STUDENT' | 'PROFESSIONAL' | 'FREELANCER' | string;
  degree?: string;
  branch?: string;
  company?: string;
  jobTitle?: string;
  experienceYears?: string;
  industry?: string;
}

// ─── Organizer Profile ───────────────────────────────────

export enum OrganizationType {
  COLLEGE = 'COLLEGE',
  COMPANY = 'COMPANY',
  COMMUNITY = 'COMMUNITY',
}

export interface OrganizerProfile {
  id: string;
  userId: string;
  organizationName: string;
  organizationType: OrganizationType;
  verified: boolean;
  logoUrl: string | null;
  description: string | null;
}
