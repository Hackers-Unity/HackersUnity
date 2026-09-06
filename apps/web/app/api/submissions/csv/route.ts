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
      return new Response('Error: Missing eventId parameter', { status: 400 });
    }

    let resolvedEventId = eventId;
    let eventTitle = 'Hackathon';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    if (!isUuid) {
      const { data: eventData } = await serverSupabase
        .from('events')
        .select('id, title')
        .eq('slug', eventId)
        .maybeSingle();
      if (eventData?.id) {
        resolvedEventId = eventData.id;
        eventTitle = eventData.title || eventTitle;
      } else {
        resolvedEventId = '';
      }
    } else {
      const { data: eventData } = await serverSupabase
        .from('events')
        .select('title')
        .eq('id', eventId)
        .maybeSingle();
      if (eventData?.title) {
        eventTitle = eventData.title;
      }
    }

    let submissions: any[] = [];
    if (resolvedEventId) {
      const { data } = await serverSupabase
        .from('submissions')
        .select(`
          *,
          profiles:submitter_id (
            name,
            email,
            college
          )
        `)
        .eq('event_id', resolvedEventId)
        .order('created_at', { ascending: false });
      submissions = data || [];
    }

    // Standard CSV headers compatible with Google Sheets & Excel
    const headers = [
      'Submission ID',
      'Submitted Date',
      'Project Title',
      'Tagline',
      'Track',
      'Submitter Name',
      'Submitter Email',
      'Submitter College',
      'Repository URL',
      'Demo Video URL',
      'Status',
      'Score',
      'Description',
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ');
      return `"${clean}"`;
    };

    const rows = (submissions || []).map((sub: any) => [
      escapeCsv(sub.id),
      escapeCsv(sub.created_at ? new Date(sub.created_at).toLocaleString() : ''),
      escapeCsv(sub.project_name),
      escapeCsv(sub.tagline || ''),
      escapeCsv(sub.track || 'General'),
      escapeCsv(sub.profiles?.name || 'Participant'),
      escapeCsv(sub.profiles?.email || ''),
      escapeCsv(sub.profiles?.college || ''),
      escapeCsv(sub.repo_url),
      escapeCsv(sub.demo_url || sub.video_url || ''),
      escapeCsv(sub.status || 'SUBMITTED'),
      escapeCsv(sub.score || 0),
      escapeCsv(sub.description || ''),
    ]);

    const csvBody = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    return new Response(csvBody, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${eventId}-submissions.csv"`,
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(`Error generating CSV: ${err.message}`, { status: 500 });
  }
}
