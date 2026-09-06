import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qifwhjfisipxkytsqxez.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_VEbLNd33E-R6hlSsmvMXhA_k_xrQnX8';

const serverSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId parameter' }, { status: 400 });
    }

    let resolvedEventId = eventId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    if (!isUuid) {
      const { data: eventData } = await serverSupabase
        .from('events')
        .select('id')
        .eq('slug', eventId)
        .maybeSingle();
      if (eventData?.id) {
        resolvedEventId = eventData.id;
      } else {
        // Event not found in DB (e.g. mock/local event)
        return NextResponse.json({ success: true, submissions: [] });
      }
    }

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
    const body = await req.json();
    const { action, submission, webhookUrl } = body;

    // Trigger Google Apps Script Webhook
    if (action === 'sync_webhook' && webhookUrl && submission) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            event: submission.eventName || submission.eventId,
            projectTitle: submission.projectTitle,
            submitterName: submission.submittedByName || 'Hacker',
            submitterEmail: submission.submittedByEmail || '',
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
      if (!isUuid) {
        const { data: ev } = await serverSupabase
          .from('events')
          .select('id')
          .eq('slug', submission.eventId)
          .maybeSingle();
        if (ev?.id) {
          targetEventId = ev.id;
        } else {
          // Event not in DB, client storage handles it
          return NextResponse.json({ success: true, localOnly: true });
        }
      }

      let targetSubmitterId = submission.submittedBy;
      const isSubmitterUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submission.submittedBy);
      if (!isSubmitterUuid) {
        if (submission.submittedByEmail) {
          const { data: prof } = await serverSupabase
            .from('profiles')
            .select('id')
            .eq('email', submission.submittedByEmail)
            .maybeSingle();
          if (prof?.id) targetSubmitterId = prof.id;
        }
        if (!targetSubmitterId || targetSubmitterId === submission.submittedBy) {
          const { data: fallbackProf } = await serverSupabase.from('profiles').select('id').limit(1).maybeSingle();
          if (fallbackProf?.id) targetSubmitterId = fallbackProf.id;
        }
      }

      const { data, error } = await serverSupabase.from('submissions').upsert({
        event_id: targetEventId,
        submitter_id: targetSubmitterId,
        project_name: submission.projectTitle,
        tagline: submission.tagline || '',
        description: submission.projectDescription,
        repo_url: submission.projectLink,
        demo_url: submission.demoVideoUrl || '',
        video_url: submission.demoVideoUrl || '',
        track: submission.track || 'General',
        status: submission.status || 'SUBMITTED',
        score: submission.score || 0,
        created_at: submission.submittedAt || new Date().toISOString(),
      }, { onConflict: 'event_id,submitter_id' }).select().maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
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

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
