// ─── Enums ───────────────────────────────────────────────

export enum TeamStatus {
  FORMING = 'FORMING',
  COMPLETE = 'COMPLETE',
  LOCKED = 'LOCKED',
}

export enum TeamMemberStatus {
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

// ─── Types ───────────────────────────────────────────────

export interface Team {
  id: string;
  eventId: string;
  teamName: string;
  leaderId: string;
  status: TeamStatus;
  createdAt: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  status: TeamMemberStatus;
  joinedAt: string | null;
}

// ─── DTOs ────────────────────────────────────────────────

export interface CreateTeamDto {
  eventId: string;
  teamName: string;
}

export interface InviteMemberDto {
  teamId: string;
  email?: string;
  userId?: string;
}
