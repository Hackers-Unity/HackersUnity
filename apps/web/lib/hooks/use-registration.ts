'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  checkUserRegistration,
  registerForEventSupabase,
  RegistrationInput,
  fetchEventTeams,
  createTeamSupabase,
  joinTeamSupabase,
} from '@/lib/supabase-service';

/**
 * Hook for event registration state & submission
 */
export function useEventRegistration(eventId: string) {
  const { user, supabaseUser } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!eventId) return;
    const userId = supabaseUser?.id || user?.id;
    const email = supabaseUser?.email || user?.email;

    if (!userId && !email) {
      setIsRegistered(false);
      setLoading(false);
      return;
    }

    try {
      const res = await checkUserRegistration(eventId, userId, email);
      setIsRegistered(res.isRegistered);
      setRegistration(res.registration || null);
    } catch {
      setIsRegistered(false);
    } finally {
      setLoading(false);
    }
  }, [eventId, user?.id, user?.email, supabaseUser?.id, supabaseUser?.email]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const register = async (input: Omit<RegistrationInput, 'eventId' | 'userId' | 'userEmail'>) => {
    const userId = supabaseUser?.id || user?.id;
    const userEmail = supabaseUser?.email || user?.email;

    if (!userEmail) {
      return { success: false, error: 'Please sign in to register.' };
    }

    const res = await registerForEventSupabase({
      ...input,
      eventId,
      userId,
      userEmail,
      userName: input.userName || user?.name || 'Hacker',
    });

    if (res.success) {
      await checkStatus();
    }
    return res;
  };

  return { isRegistered, registration, loading, register, refresh: checkStatus };
}

/**
 * Hook for squads & teams associated with an event
 */
export function useEventTeams(eventId: string) {
  const { user, supabaseUser } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeams = useCallback(async () => {
    if (!eventId) return;
    try {
      const data = await fetchEventTeams(eventId);
      setTeams(data);
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const createTeam = async (teamName: string, maxMembers: number = 4, description?: string) => {
    const userId = supabaseUser?.id || user?.id || 'usr_me';

    const res = await createTeamSupabase(eventId, userId, teamName, maxMembers, description);
    if (res.success) {
      await loadTeams();
    }
    return res;
  };

  const joinTeam = async (teamId: string, maxMembers: number = 4) => {
    const userId = supabaseUser?.id || user?.id || 'usr_me';

    const res = await joinTeamSupabase(teamId, userId, maxMembers);
    if (res.success) {
      await loadTeams();
    }
    return res;
  };

  return { teams, loading, createTeam, joinTeam, refresh: loadTeams };
}
