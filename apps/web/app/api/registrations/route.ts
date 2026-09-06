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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input } = body;

    if (!input || !input.eventId || !input.userEmail) {
      return NextResponse.json({ error: 'Missing required registration fields' }, { status: 400 });
    }

    // Resolve event UUID if slug provided
    let targetEventId = input.eventId;
    const isEventUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.eventId);
    if (!isEventUuid) {
      const { data: eventData } = await serverSupabase
        .from('events')
        .select('id')
        .eq('slug', input.eventId)
        .maybeSingle();
      if (eventData?.id) {
        targetEventId = eventData.id;
      } else {
        // Custom or local event not stored in database
        return NextResponse.json({ success: true, localOnly: true });
      }
    }

    // Ensure user profile exists
    let validUserId = input.userId;
    const isUserUuid = validUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validUserId);
    if (isUserUuid) {
      const { data: existingProf } = await serverSupabase
        .from('profiles')
        .select('id')
        .eq('id', validUserId)
        .maybeSingle();

      if (!existingProf) {
        await serverSupabase.from('profiles').insert({
          id: validUserId,
          name: input.userName || 'Hacker',
          email: input.userEmail,
          phone: input.phone || null,
          college: input.college || null,
          github_url: input.githubUrl || null,
          linkedin_url: input.linkedinUrl || null,
          skills: input.skills || [],
          updated_at: new Date().toISOString(),
        });
      }
    } else {
      validUserId = null;
    }

    // Check if already registered
    if (validUserId) {
      const { data: existingReg } = await serverSupabase
        .from('registrations')
        .select('id')
        .eq('event_id', targetEventId)
        .eq('user_id', validUserId)
        .maybeSingle();
      if (existingReg) {
        return NextResponse.json({ error: 'You are already registered for this event.' }, { status: 400 });
      }
    }

    const { data: existingEmailReg } = await serverSupabase
      .from('registrations')
      .select('id')
      .eq('event_id', targetEventId)
      .eq('user_email', input.userEmail.toLowerCase().trim())
      .maybeSingle();

    if (existingEmailReg) {
      return NextResponse.json({ error: 'This email is already registered for this event.' }, { status: 400 });
    }

    const payload: any = {
      event_id: targetEventId,
      user_id: validUserId,
      user_name: input.userName,
      user_email: input.userEmail.toLowerCase().trim(),
      phone: input.phone || null,
      college: input.college || null,
      city: input.city || null,
      github_url: input.githubUrl || null,
      linkedin_url: input.linkedinUrl || null,
      skills: input.skills || [],
      custom_answers: input.customAnswers || {},
      is_team: Boolean(input.isTeam),
      team_name: input.teamName || null,
      role: input.role || (input.isTeam ? 'Team Leader' : 'Individual Hacker'),
      status: input.status || 'CONFIRMED',
      registered_at: new Date().toISOString(),
    };

    const { error: insertErr } = await serverSupabase
      .from('registrations')
      .insert(payload);

    if (insertErr) {
      console.error('Server Supabase registration error:', insertErr.message);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API /api/registrations error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
