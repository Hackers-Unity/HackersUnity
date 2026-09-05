'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExtendedEvent } from '@/lib/mock-data';
import {
  fetchPublishedEvents,
  fetchEventBySlug,
  fetchOrganizerEvents,
  subscribeToPublishedEvents,
  subscribeToEventDetails,
} from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';

/**
 * Hook to fetch all published events with realtime subscription
 */
export function usePublishedEvents() {
  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const data = await fetchPublishedEvents();
      setEvents(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();

    // Setup realtime subscription
    const unsubscribe = subscribeToPublishedEvents(() => {
      loadEvents();
    });

    return () => {
      unsubscribe();
    };
  }, [loadEvents]);

  return { events, loading, error, refresh: loadEvents };
}

/**
 * Hook to fetch a single event by slug or id with realtime registration count updates
 */
export function useEvent(slugOrId: string) {
  const [event, setEvent] = useState<ExtendedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!slugOrId) return;
    try {
      const data = await fetchEventBySlug(slugOrId);
      setEvent(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  }, [slugOrId]);

  useEffect(() => {
    loadEvent();

    const unsubscribe = subscribeToEventDetails(slugOrId, () => {
      loadEvent();
    });

    return () => {
      unsubscribe();
    };
  }, [slugOrId, loadEvent]);

  return { event, loading, error, refresh: loadEvent };
}

/**
 * Hook to fetch organizer events (both published & draft)
 */
export function useOrganizerEvents() {
  const { user, supabaseUser } = useAuth();
  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const userId = supabaseUser?.id || user?.id;
    if (!userId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchOrganizerEvents(userId);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabaseUser?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, loading, refresh: load };
}
