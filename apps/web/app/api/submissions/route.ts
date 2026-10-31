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
    if (isUuid) {
      eventQuery = eventQuery.eq('id', eventId);
    } else if (eventId === 'evt_ai_1791373781895' || eventId.includes('1791373781895') || eventId.toLowerCase().includes('sphinx')) {
      eventQuery = eventQuery.or(`slug.eq.${eventId},slug.eq.sphinx-26`);
    } else {
      eventQuery = eventQuery.eq('slug', eventId);
    }

    let { data: eventData, error: eventError } = await eventQuery.maybeSingle();

    // Fallback: check by Sphinx title / slug if not matched directly
    if (!eventData && (eventId === 'evt_ai_1791373781895' || eventId.includes('1791373781895') || eventId.toLowerCase().includes('sphinx'))) {
      const { data: sphinxEv } = await serverSupabase
        .from('events')
        .select('id, organizer_id')
        .ilike('slug', '%sphinx%')
        .limit(1)
        .maybeSingle();
      if (sphinxEv) {
        eventData = sphinxEv;
        eventError = null;
      }
    }

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

    // ─── Batch Import Project Submissions from Sheet / CSV ──────────
    if (action === 'batch_import' && Array.isArray(body.submissions) && body.submissions.length > 0) {
      const rawEventId = body.eventId || body.submissions[0]?.eventId;
      if (!rawEventId) {
        return NextResponse.json({ error: 'Missing eventId for batch import' }, { status: 400 });
      }

      let targetEventId = rawEventId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawEventId);
      let query = serverSupabase.from('events').select('id, slug, organizer_id');
      if (isUuid) {
        query = query.eq('id', rawEventId);
      } else if (rawEventId === 'evt_ai_1791373781895' || rawEventId.includes('1791373781895') || rawEventId.toLowerCase().includes('sphinx')) {
        query = query.or(`slug.eq.${rawEventId},slug.eq.sphinx-26`);
      } else {
        query = query.eq('slug', rawEventId);
      }
      let { data: ev } = await query.maybeSingle();
      if (!ev && (rawEventId.includes('sphinx') || rawEventId.includes('1791373781895'))) {
        const { data: sphinxEv } = await serverSupabase.from('events').select('id, slug, organizer_id').ilike('slug', '%sphinx%').limit(1).maybeSingle();
        if (sphinxEv) ev = sphinxEv;
      }
      if (ev) {
        targetEventId = ev.id;
      }

      const isOrganizer = ev?.organizer_id === auth.userId;
      const { data: callerProfile } = await serverSupabase.from('profiles').select('role').eq('id', auth.userId).maybeSingle();
      const isAdmin = callerProfile?.role === 'ADMIN' || callerProfile?.role === 'SUPER_ADMIN';

      let isCoHost = false;
      if (!isOrganizer && !isAdmin && ev) {
        const { data: adminRecord } = await serverSupabase
          .from('event_admins')
          .select('id')
          .eq('event_id', targetEventId)
          .eq('user_id', auth.userId)
          .maybeSingle();
        isCoHost = Boolean(adminRecord);
      }

      if (!isOrganizer && !isAdmin && !isCoHost) {
        return NextResponse.json({ error: 'Only event organizers or admins can import sheets.' }, { status: 403 });
      }

      let importedCount = 0;
      const results: any[] = [];

      for (const item of body.submissions) {
        const title = (item.projectTitle || item.projectName || item.title || '').trim();
        if (!title) continue;

        let submitterId = auth.userId;
        const submitterEmail = (item.submittedByEmail || item.email || '').trim().toLowerCase();

        if (submitterEmail) {
          const { data: existingProf } = await serverSupabase
            .from('profiles')
            .select('id')
            .eq('email', submitterEmail)
            .maybeSingle();
          if (existingProf?.id) {
            submitterId = existingProf.id;
          }
        }

        const payload: any = {
          event_id: targetEventId,
          submitter_id: submitterId,
          project_name: title,
          tagline: item.tagline || '',
          description: item.projectDescription || item.description || '',
          repo_url: item.projectLink || item.repoUrl || item.githubUrl || '',
          demo_url: item.demoVideoUrl || item.demoUrl || item.videoUrl || '',
          video_url: item.demoVideoUrl || item.demoUrl || item.videoUrl || '',
          track: item.track || 'General',
          status: item.status || 'SUBMITTED',
          score: typeof item.score === 'number' ? item.score : 0,
          created_at: item.submittedAt || new Date().toISOString(),
        };

        // Check if existing submission matches project_name
        let existingMatch: any = null;
        try {
          const { data: m } = await serverSupabase
            .from('submissions')
            .select('id')
            .eq('event_id', targetEventId)
            .ilike('project_name', title)
            .limit(1)
            .maybeSingle();
          existingMatch = m;
        } catch {}

        if (existingMatch?.id) {
          const { data: updatedRow } = await serverSupabase
            .from('submissions')
            .update(payload)
            .eq('id', existingMatch.id)
            .select()
            .maybeSingle();
          if (updatedRow) results.push(updatedRow);
        } else {
          const { data: insertedRow } = await serverSupabase
            .from('submissions')
            .insert(payload)
            .select()
            .maybeSingle();
          if (insertedRow) results.push(insertedRow);
        }
        importedCount++;
      }

      return NextResponse.json({
        success: true,
        count: importedCount,
        eventId: targetEventId,
        submissions: results,
      });
    }

    // Save or update submission in Supabase
    if (submission) {
      let targetEventId = submission.eventId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submission.eventId);
      
      let query = serverSupabase
        .from('events')
        .select('id, slug, tags, start_date, end_date');

      if (isUuid) {
        query = query.eq('id', submission.eventId);
      } else if (submission.eventId === 'evt_ai_1791373781895' || submission.eventId.includes('1791373781895') || submission.eventId.toLowerCase().includes('sphinx')) {
        query = query.or(`slug.eq.${submission.eventId},slug.eq.sphinx-26`);
      } else {
        query = query.eq('slug', submission.eventId);
      }
      
      let { data: ev } = await query.maybeSingle();

      if (!ev && (submission.eventId === 'evt_ai_1791373781895' || submission.eventId.includes('1791373781895') || submission.eventId.toLowerCase().includes('sphinx') || submission.eventName?.toLowerCase().includes('sphinx'))) {
        const { data: sphinxEv } = await serverSupabase
          .from('events')
          .select('id, slug, tags, start_date, end_date')
          .ilike('slug', '%sphinx%')
          .limit(1)
          .maybeSingle();
        if (sphinxEv) {
          ev = sphinxEv;
        }
      }

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

export async function DELETE(req: Request) {
  try {
    const serverSupabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const body = req.headers.get('content-type')?.includes('application/json')
      ? await req.json().catch(() => ({}))
      : {};

    const eventId = searchParams.get('eventId') || body.eventId;
    const submissionId = searchParams.get('submissionId') || body.submissionId;
    const action = searchParams.get('action') || body.action;

    // Bulk deletion: Delete all submissions for an event
    if (action === 'delete_all' || (!submissionId && eventId && searchParams.get('all') === 'true')) {
      if (!eventId) {
        return NextResponse.json({ error: 'Missing eventId parameter' }, { status: 400 });
      }

      let resolvedEventId = eventId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      let eventQuery = serverSupabase.from('events').select('id, organizer_id').limit(1);
      if (isUuid) {
        eventQuery = eventQuery.eq('id', eventId);
      } else if (eventId === 'evt_ai_1791373781895' || eventId.includes('1791373781895') || eventId.toLowerCase().includes('sphinx')) {
        eventQuery = eventQuery.or(`slug.eq.${eventId},slug.eq.sphinx-26`);
      } else {
        eventQuery = eventQuery.eq('slug', eventId);
      }

      const { data: eventData } = await eventQuery.maybeSingle();
      if (eventData?.id) {
        resolvedEventId = eventData.id;
      }

      // Delete from Supabase
      const { error, count } = await serverSupabase
        .from('submissions')
        .delete({ count: 'exact' })
        .eq('event_id', resolvedEventId);

      if (error) {
        console.warn('Supabase bulk delete submissions error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Invalidate count cache
      cachedSubmissionCounts = null;

      // Broadcast event
      try {
        const channel = serverSupabase.channel(`submissions_stream_${eventId}`);
        channel.send({
          type: 'broadcast',
          event: 'submissions_cleared',
          payload: { eventId: resolvedEventId },
        });
      } catch (broadcastErr) {}

      return NextResponse.json({
        success: true,
        deletedCount: count ?? 0,
        message: `Successfully deleted all submissions for event ${eventId}`,
      });
    }

    // Single submission deletion
    if (submissionId) {
      const { error } = await serverSupabase
        .from('submissions')
        .delete()
        .eq('id', submissionId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      cachedSubmissionCounts = null;

      if (eventId) {
        try {
          const channel = serverSupabase.channel(`submissions_stream_${eventId}`);
          channel.send({
            type: 'broadcast',
            event: 'submission_deleted',
            payload: { submissionId },
          });
        } catch (broadcastErr) {}
      }

      return NextResponse.json({ success: true, message: 'Submission deleted' });
    }

    return NextResponse.json({ error: 'Missing required parameters (eventId or submissionId)' }, { status: 400 });
  } catch (err: any) {
    console.error('DELETE /api/submissions error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
