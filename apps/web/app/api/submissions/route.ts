import { NextResponse } from 'next/server';
import { isIP } from 'node:net';
import {
  authenticateRequest,
  createAdminClient,
  forbiddenResponse,
  unauthorizedResponse,
} from '@/lib/api-auth';
import { getSubmissionPortalStatus } from '@/lib/utils';

// SELINE: default allowed webhook hosts for Google Apps Script
const DEFAULT_WEBHOOK_HOSTS = new Set([
  'script.google.com',
  'script.googleusercontent.com',
]);

// SELINE: helper func to check if a hostname is private or reserved IP
// used to validate webhook URLs to prevent SSRF attacks
function isPrivateOrReservedIp(hostname: string): boolean {
  const normalizedHostname = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const ipVersion = isIP(normalizedHostname);

  if (ipVersion === 6) {
    return (
      normalizedHostname === '::' ||
      normalizedHostname === '::1' ||
      normalizedHostname.startsWith('fc') ||
      normalizedHostname.startsWith('fd') ||
      normalizedHostname.startsWith('fe8') ||
      normalizedHostname.startsWith('fe9') ||
      normalizedHostname.startsWith('fea') ||
      normalizedHostname.startsWith('feb')
    );
  }

  if (ipVersion !== 4) return false;

  const octets = normalizedHostname.split('.').map(Number);
  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function getAllowedWebhookHosts(): Set<string> {
  const configuredHosts = process.env.ALLOWED_WEBHOOK_HOSTS
    ?.split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  return new Set(configuredHosts?.length ? configuredHosts : DEFAULT_WEBHOOK_HOSTS);
}

function validateWebhookUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      isPrivateOrReservedIp(hostname) ||
      !getAllowedWebhookHosts().has(hostname)
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

// In-memory cache for aggregate submission counts (30-second TTL) to protect DB Disk IO
interface CountsCache {
  timestamp: number;
  counts: Record<string, number>;
}
let cachedSubmissionCounts: CountsCache | null = null;
const SUB_COUNTS_CACHE_TTL_MS = 30_000;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Public aggregate submission counts for badges/dashboards (zero PII)
    if (searchParams.get('allCounts') === 'true') {
      const now = Date.now();
      if (cachedSubmissionCounts && now - cachedSubmissionCounts.timestamp < SUB_COUNTS_CACHE_TTL_MS) {
        return NextResponse.json(
          { success: true, counts: cachedSubmissionCounts.counts },
          { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60', 'X-Cache': 'HIT' } }
        );
      }

      const serverSupabase = createAdminClient();
      const { data: subRows } = await serverSupabase.from('submissions').select('event_id');
      const { data: eventRows } = await serverSupabase.from('events').select('id, slug');
      const counts: Record<string, number> = {};
      const idToSlug = new Map<string, string>();
      eventRows?.forEach((e: any) => {
        if (e.id && e.slug) idToSlug.set(e.id, e.slug);
      });
      subRows?.forEach((row: any) => {
        if (row.event_id) {
          counts[row.event_id] = (counts[row.event_id] || 0) + 1;
          const slug = idToSlug.get(row.event_id);
          if (slug) counts[slug] = (counts[slug] || 0) + 1;
        }
      });

      cachedSubmissionCounts = {
        timestamp: now,
        counts,
      };

      return NextResponse.json(
        { success: true, counts },
        { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
      );
    }

    // SELINE: req without valid session receive unauthorized response
    const auth = await authenticateRequest(req);
    if (!auth) {
      return unauthorizedResponse('You must be signed in to view submissions.');
    }
    const eventId = searchParams.get('eventId');
    const scope = searchParams.get('scope'); // 'mine' | 'user' | 'all'
    const requestedUserId = searchParams.get('userId');

    const serverSupabase = createAdminClient();

    // 1. User-level submissions across all events
    if (scope === 'user' || (!eventId && requestedUserId)) {
      const targetUser = requestedUserId || auth.userId;
      const { data: callerProfile } = await serverSupabase
        .from('profiles')
        .select('role')
        .eq('id', auth.userId)
        .maybeSingle();

      const isAdmin = callerProfile?.role === 'ADMIN' || callerProfile?.role === 'SUPER_ADMIN';
      if (targetUser !== auth.userId && !isAdmin) {
        return forbiddenResponse('You are not authorized to view submissions for other users.');
      }

      const { data: userSubs, error: userSubsErr } = await serverSupabase
        .from('submissions')
        .select(`
          *,
          profiles:submitter_id (
            id,
            name,
            email,
            avatar_url,
            college
          )
        `)
        .eq('submitter_id', targetUser)
        .order('created_at', { ascending: false });

      if (userSubsErr) {
        return NextResponse.json({ error: userSubsErr.message, submissions: [] }, { status: 200 });
      }

      return NextResponse.json({ success: true, submissions: userSubs || [] });
    }

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId parameter' }, { status: 400 });
    }

    let resolvedEventId = eventId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    let eventQuery = serverSupabase.from('events').select('id, organizer_id').limit(1);
    eventQuery = isUuid ? eventQuery.eq('id', eventId) : eventQuery.eq('slug', eventId);

    const { data: eventData, error: eventError } = await eventQuery.maybeSingle();
    if (eventError) {
      return NextResponse.json({ error: 'Failed to load event access details.' }, { status: 500 });
    }

    if (!eventData?.id) {
      // Event not found in DB (e.g. mock/local event)
      return NextResponse.json({ success: true, submissions: [] });
    }

    resolvedEventId = eventData.id;

    const { data: callerProfile, error: profileError } = await serverSupabase
      .from('profiles')
      .select('role')
      .eq('id', auth.userId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: 'Failed to verify submission access.' }, { status: 500 });
    }

    const isOrganizer = eventData.organizer_id === auth.userId;
    const isAdmin = callerProfile?.role === 'ADMIN' || callerProfile?.role === 'SUPER_ADMIN';

    let isCoHost = false;
    if (!isOrganizer && !isAdmin) {
      const { data: adminRecord } = await serverSupabase
        .from('event_admins')
        .select('id')
        .eq('event_id', resolvedEventId)
        .eq('user_id', auth.userId)
        .maybeSingle();
      isCoHost = Boolean(adminRecord);
    }

    // If caller is participant or requesting their own submission:
    if (scope === 'mine' || (!isOrganizer && !isCoHost && !isAdmin)) {
      const { data: mySubmissions, error: mySubmissionsError } = await serverSupabase
        .from('submissions')
        .select(`
          *,
          profiles:submitter_id (
            id,
            name,
            email,
            avatar_url,
            college
          )
        `)
        .eq('event_id', resolvedEventId)
        .eq('submitter_id', auth.userId)
        .order('created_at', { ascending: false });

      if (mySubmissionsError) {
        return NextResponse.json({ error: mySubmissionsError.message, submissions: [] }, { status: 200 });
      }

      return NextResponse.json({ success: true, submissions: mySubmissions || [] });
    }

    // Host, Co-host, or Admin: return all submissions for this event
    const { data, error } = await serverSupabase
      .from('submissions')
      .select(`
        *,
        profiles:submitter_id (
          id,
          name,
          email,
          avatar_url,
          college
        )
      `)
      .eq('event_id', resolvedEventId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message, submissions: [] }, { status: 200 });
    }

    return NextResponse.json({ success: true, submissions: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return unauthorizedResponse('You must be signed in to submit a project.');
    }

    const serverSupabase = createAdminClient();
    const body = await req.json();
    const { action, submission, webhookUrl } = body;

    // Trigger Google Apps Script Webhook
    if (action === 'sync_webhook' && webhookUrl && submission) {
      const validatedWebhookUrl = validateWebhookUrl(webhookUrl);
      if (!validatedWebhookUrl) {
        return NextResponse.json({ error: 'Webhook URL is not allowed.' }, { status: 400 });
      }

      try {
        await fetch(validatedWebhookUrl, {
          method: 'POST',
          redirect: 'error',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            event: submission.eventName || submission.eventId,
            projectTitle: submission.projectTitle,
            submitterName: auth.user.user_metadata?.name || submission.submittedByName || 'Hacker',
            submitterEmail: auth.email || submission.submittedByEmail || '',
            track: submission.track || 'General',
            repoUrl: submission.projectLink,
            demoUrl: submission.demoVideoUrl || '',
            presentationUrl: submission.presentationUrl || '',
            status: submission.status || 'SUBMITTED',
            score: submission.score || 0,
          }),
        });
        return NextResponse.json({ success: true, message: 'Google Sheets webhook triggered' });
      } catch (webhookErr: any) {
        console.warn('Webhook dispatch notice:', webhookErr.message);
        return NextResponse.json({ success: true, warning: 'Webhook dispatched with notice' });
      }
    }

    // Save or update submission in Supabase
    if (submission) {
      let targetEventId = submission.eventId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submission.eventId);
      
      const { data: ev } = await serverSupabase
        .from('events')
        .select('id, slug, tags, start_date, end_date')
        .eq(isUuid ? 'id' : 'slug', submission.eventId)
        .maybeSingle();

      if (ev) {
        targetEventId = ev.id;
        const portalStatus = getSubmissionPortalStatus({
          startDate: ev.start_date,
          endDate: ev.end_date,
          tags: ev.tags,
        });

        if (!portalStatus.isOpen) {
          return NextResponse.json(
            { error: portalStatus.subtext || 'Project submissions are currently closed for this hackathon.' },
            { status: 403 }
          );
        }
      } else if (!isUuid) {
        // Event not in DB, client storage handles it
        return NextResponse.json({ success: true, localOnly: true });
      }

      // Bind submission to authenticated user ID
      const targetSubmitterId = auth.userId;

      // SELINE: check if a submission already exists for this user and event to preserve status and score
      const { data: existingSubmission, error: existingSubmissionError } = await serverSupabase
        .from('submissions')
        .select('status, score')
        .eq('event_id', targetEventId)
        .eq('submitter_id', targetSubmitterId)
        .maybeSingle();

      if (existingSubmissionError) {
        return NextResponse.json(
          { error: 'Failed to verify the existing submission.' },
          { status: 500 }
        );
      }

      const protectedStatus = existingSubmission?.status ?? 'SUBMITTED';
      const protectedScore = existingSubmission?.score ?? 0;

      // Ensure submitter profile exists
      const { data: prof } = await serverSupabase
        .from('profiles')
        .select('id')
        .eq('id', targetSubmitterId)
        .maybeSingle();

      if (!prof) {
        await serverSupabase.from('profiles').insert({
          id: targetSubmitterId,
          name: auth.user.user_metadata?.name || submission.submittedByName || 'Hacker',
          email: auth.email,
          updated_at: new Date().toISOString(),
        });
      }

      const submissionPayload = {
        event_id: targetEventId,
        submitter_id: targetSubmitterId,
        project_name: submission.projectTitle,
        tagline: submission.tagline || '',
        description: submission.projectDescription,
        repo_url: submission.projectLink,
        demo_url: submission.demoVideoUrl || '',
        video_url: submission.demoVideoUrl || '',
        track: submission.track || 'General',
        // SELINE: removed both 0 and submitted as fallback to prevent overwriting existing status with default
        status: protectedStatus,
        score: protectedScore,
        created_at: submission.submittedAt || new Date().toISOString(),
      };

      // Robust upsert without relying on non-existent unique constraints
      const { data: existingSub } = await serverSupabase
        .from('submissions')
        .select('id')
        .eq('event_id', targetEventId)
        .eq('submitter_id', targetSubmitterId)
        .maybeSingle();

      let data: any = null;
      let error: any = null;

      if (existingSub?.id) {
        const updateRes = await serverSupabase
          .from('submissions')
          .update(submissionPayload)
          .eq('id', existingSub.id)
          .select()
          .maybeSingle();
        data = updateRes.data;
        error = updateRes.error;
      } else {
        const insertRes = await serverSupabase
          .from('submissions')
          .insert(submissionPayload)
          .select()
          .maybeSingle();
        data = insertRes.data;
        error = insertRes.error;
      }

      if (error) {
        console.error('Failed to save submission:', error.message);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Notify Event Host / Organizer ONLY about the new project submission
      try {
        const { data: ev } = await serverSupabase
          .from('events')
          .select('id, title, slug, organizer_id')
          .eq('id', targetEventId)
          .maybeSingle();

        if (ev?.organizer_id) {
          const hostUserIds = new Set<string>([ev.organizer_id]);
          try {
            const { data: coHosts } = await serverSupabase
              .from('event_admins')
              .select('user_id')
              .eq('event_id', targetEventId);
            if (coHosts) {
              coHosts.forEach((ch: any) => {
                if (ch.user_id) hostUserIds.add(ch.user_id);
              });
            }
          } catch {}

          const submitterName = auth.user.user_metadata?.name || submission.submittedByName || 'A builder';
          const projectTitle = submission.projectTitle || submissionPayload.project_name || 'Project';
          const notifTitle = `New Project Submitted: ${projectTitle}`;
          const notifMsg = `${submitterName} just submitted "${projectTitle}" for "${ev.title}".`;
          const actionUrl = `/dashboard/events/${ev.slug || targetEventId}/submissions`;

          const { data: notifData } = await serverSupabase
            .from('notifications')
            .insert({
              title: notifTitle,
              message: notifMsg,
              type: 'event',
              icon: 'rocket',
              event_id: targetEventId,
              sender_id: targetSubmitterId || null,
              target_type: 'specific_user',
              action_url: actionUrl,
              metadata: {
                eventId: targetEventId,
                eventTitle: ev.title,
                eventSlug: ev.slug,
                projectTitle,
                submitterName,
                role: 'organizer_alert',
                isSubmission: true,
              },
            })
            .select('id')
            .single();

          if (notifData?.id) {
            const hostRows = Array.from(hostUserIds).map((hostId) => ({
              user_id: hostId,
              notification_id: notifData.id,
              is_read: false,
            }));

            await serverSupabase
              .from('user_notifications')
              .upsert(hostRows, { onConflict: 'user_id,notification_id' });
          }
        }
      } catch (subNotifErr) {
        console.warn('Failed to send submission notification to host:', subNotifErr);
      }

      // Realtime Broadcast across event channel
      try {
        const channel = serverSupabase.channel(`submissions_stream_${targetEventId}`);
        await channel.send({
          type: 'broadcast',
          event: 'submission_created',
          payload: { submission: data || submission },
        });
      } catch (broadcastErr) {}

      cachedSubmissionCounts = null;
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const serverSupabase = createAdminClient();
    const body = await req.json();
    const { submissionId, status, score, reviewNotes, eventId } = body;

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (score !== undefined) updateData.score = score;

    const { data, error } = await serverSupabase
      .from('submissions')
      .update(updateData)
      .eq('id', submissionId)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Admin PATCH update notice:', error.message);
    }

    // Broadcast update across realtime channel
    if (eventId) {
      try {
        const channel = serverSupabase.channel(`submissions_stream_${eventId}`);
        channel.send({
          type: 'broadcast',
          event: 'submission_updated',
          payload: { submissionId, status, score },
        });
      } catch (broadcastErr) {}
    }

    return NextResponse.json({
      success: true,
      data: data || { id: submissionId, status, score },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
