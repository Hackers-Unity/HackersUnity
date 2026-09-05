'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  sendTeamInvite,
  fetchTeamInvites,
  fetchPendingInvitesForUser,
  getInviteByToken,
  acceptTeamInvite,
  declineTeamInvite,
  leaveTeam,
  deleteTeamSupabase,
  fetchTeamWithMembers,
  fetchUserTeams,
} from '@/lib/supabase-service';

/**
 * Hook for managing team invites as a Team Leader
 */
export function useTeamInvites(teamId: string, eventId: string) {
  const { user, supabaseUser } = useAuth();
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    if (!teamId) {
      setInvites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchTeamInvites(teamId);
      setInvites(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invites');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const sendInvite = async (email: string) => {
    const userId = supabaseUser?.id || user?.id;
    if (!userId) {
      return { success: false, error: 'You must be logged in to send invites.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please provide a valid email address.' };
    }

    const res = await sendTeamInvite(teamId, eventId, userId, email);
    if (res.success) {
      await loadInvites();
    }
    return res;
  };

  return {
    invites,
    loading,
    error,
    sendInvite,
    refreshInvites: loadInvites,
  };
}

/**
 * Hook for viewing & responding to received invites as a user
 */
export function useMyInvites() {
  const { user, supabaseUser } = useAuth();
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const email = supabaseUser?.email || user?.email;
  const userId = supabaseUser?.id || user?.id;

  const loadMyInvites = useCallback(async () => {
    if (!email) {
      setPendingInvites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPendingInvitesForUser(email);
      setPendingInvites(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending invites');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    loadMyInvites();
  }, [loadMyInvites]);

  const accept = async (token: string) => {
    if (!userId) {
      return { success: false, error: 'Please sign in to accept invitations.' };
    }
    const res = await acceptTeamInvite(token, userId);
    if (res.success) {
      await loadMyInvites();
    }
    return res;
  };

  const decline = async (token: string) => {
    const res = await declineTeamInvite(token);
    if (res.success) {
      await loadMyInvites();
    }
    return res;
  };

  return {
    pendingInvites,
    loading,
    error,
    acceptInvite: accept,
    declineInvite: decline,
    refreshMyInvites: loadMyInvites,
  };
}

/**
 * Hook for fetching full details & members of a team
 */
export function useTeamDetails(teamId: string) {
  const [team, setTeam] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTeam = useCallback(async () => {
    if (!teamId) {
      setTeam(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchTeamWithMembers(teamId);
      setTeam(data);
    } catch {
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  return { team, loading, refreshTeam: loadTeam };
}

/**
 * Hook for fetching all teams a user is in
 */
export function useUserTeams() {
  const { user, supabaseUser } = useAuth();
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = supabaseUser?.id || user?.id;

  const loadUserTeams = useCallback(async () => {
    if (!userId) {
      setUserTeams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchUserTeams(userId);
      setUserTeams(data);
    } catch {
      setUserTeams([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserTeams();
  }, [loadUserTeams]);

  const leave = async (teamId: string) => {
    if (!userId) return { success: false, error: 'Sign in required' };
    const res = await leaveTeam(teamId, userId);
    if (res.success) {
      await loadUserTeams();
    }
    return res;
  };

  const removeTeam = async (teamId: string) => {
    if (!userId) return { success: false, error: 'Sign in required' };
    const res = await deleteTeamSupabase(teamId, userId);
    if (res.success) {
      await loadUserTeams();
    }
    return res;
  };

  return { userTeams, loading, leaveTeam: leave, deleteTeam: removeTeam, refreshUserTeams: loadUserTeams };
}
