import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/api-auth';

const ADMIN_USER = process.env.ADMIN_CSAP_USER || 'HU';
const ADMIN_PASS = process.env.ADMIN_CSAP_PASS || 'HU269';
const SESSION_COOKIE_NAME = 'admin_csap_session';
const SECRET_SALT = process.env.SUPABASE_SECRET_KEY || 'hackers-unity-admin-csap-secret-salt-2026';

/**
 * Creates a signed token for admin session
 */
function createSessionToken(username: string): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', SECRET_SALT)
    .update(`${username}:${timestamp}`)
    .digest('hex');
  return Buffer.from(JSON.stringify({ u: username, t: timestamp, s: signature })).toString('base64');
}

/**
 * Validates the admin session token
 */
function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const { u, t, s } = JSON.parse(raw);
    if (!u || !t || !s) return false;

    // Check expiration (7 days)
    const ageMs = Date.now() - Number(t);
    if (ageMs > 7 * 24 * 60 * 60 * 1000) return false;

    // Verify HMAC signature
    const expectedSig = crypto
      .createHmac('sha256', SECRET_SALT)
      .update(`${u}:${t}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

/**
 * Verifies admin credentials securely
 */
function checkCredentials(user: string, pass: string): boolean {
  if (typeof user !== 'string' || typeof pass !== 'string') return false;
  const userMatch =
    user.length === ADMIN_USER.length &&
    crypto.timingSafeEqual(Buffer.from(user), Buffer.from(ADMIN_USER));
  const passMatch =
    pass.length === ADMIN_PASS.length &&
    crypto.timingSafeEqual(Buffer.from(pass), Buffer.from(ADMIN_PASS));
  return Boolean(userMatch && passMatch);
}

// ─── GET: Fetch all hackathon or blog submissions & statistics ───────────────
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ authenticated: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get('resource');

  try {
    const supabase = createAdminClient();

    // ── Blogs Moderation Query ──
    if (resource === 'blogs') {
      try {
        const { data: blogs, error } = await supabase
          .from('blogs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          const isTableMissing =
            error.code === '42P01' ||
            error.message?.toLowerCase().includes('relation "blogs" does not exist') ||
            error.message?.toLowerCase().includes('does not exist');

          return NextResponse.json({
            authenticated: true,
            blogs: [],
            stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
            tableReady: !isTableMissing,
            error: error.message,
            message: isTableMissing
              ? 'Blogs table not found. Run apps/web/supabase/blogs-migration.sql in Supabase SQL editor.'
              : error.message,
          });
        }

        const allBlogs = blogs || [];
        const stats = {
          total: allBlogs.length,
          pending: allBlogs.filter((b) => b.status === 'PENDING_APPROVAL').length,
          approved: allBlogs.filter((b) => b.status === 'APPROVED').length,
          rejected: allBlogs.filter((b) => b.status === 'REJECTED').length,
        };

        return NextResponse.json({
          authenticated: true,
          blogs: allBlogs,
          stats,
          tableReady: true,
        });
      } catch (blogErr: any) {
        return NextResponse.json({
          authenticated: true,
          blogs: [],
          stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
          tableReady: true,
          error: blogErr.message,
        });
      }
    }

    // ── Events / Hackathons Query (Default) ──
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allEvents = events || [];

    // Query registration counts
    const { data: regRows } = await supabase
      .from('registrations')
      .select('event_id');

    // Query submission counts
    const { data: subRows } = await supabase
      .from('submissions')
      .select('event_id');

    const regCounts: Record<string, number> = {};
    regRows?.forEach((r: any) => {
      if (r.event_id) {
        regCounts[r.event_id] = (regCounts[r.event_id] || 0) + 1;
      }
    });

    const subCounts: Record<string, number> = {};
    subRows?.forEach((s: any) => {
      if (s.event_id) {
        subCounts[s.event_id] = (subCounts[s.event_id] || 0) + 1;
      }
    });

    let diskOrder: string[] = [];
    try {
      const fs = await import('fs');
      const path = await import('path');
      const orderFile = path.join(process.cwd(), 'data', 'showcase-order.json');
      if (fs.existsSync(orderFile)) {
        const raw = fs.readFileSync(orderFile, 'utf8');
        diskOrder = JSON.parse(raw).orderedEventIds || [];
      }
    } catch {}

    const eventsWithCounts = allEvents.map((evt: any) => {
      const regCount = (regCounts[evt.id] || 0) + (evt.slug ? (regCounts[evt.slug] || 0) : 0);
      const subCount = (subCounts[evt.id] || 0) + (evt.slug ? (subCounts[evt.slug] || 0) : 0);

      let displayOrder: number = 999999;
      if (typeof evt.display_order === 'number' && !isNaN(evt.display_order)) {
        displayOrder = evt.display_order;
      } else if (Array.isArray(evt.tags)) {
        const orderTag = evt.tags.find((t: string) => typeof t === 'string' && t.startsWith('hu_order:'));
        if (orderTag) {
          const parsed = parseInt(orderTag.replace('hu_order:', ''), 10);
          if (!isNaN(parsed)) displayOrder = parsed;
        }
      }

      if (diskOrder.length > 0) {
        const diskIdx = diskOrder.findIndex((id) => id === evt.id || id === evt.slug);
        if (diskIdx !== -1) {
          displayOrder = diskIdx;
        }
      }

      const isRedirectAllowed = Boolean(
        evt.allow_external_redirect === true ||
        (Array.isArray(evt.tags) && evt.tags.includes('allow_external_redirect'))
      );

      const cleanTags = Array.isArray(evt.tags)
        ? evt.tags.filter((t: string) => typeof t === 'string' && !t.startsWith('hu_order:') && t !== 'allow_external_redirect')
        : [];

      return {
        ...evt,
        allow_external_redirect: isRedirectAllowed,
        registration_link: evt.registration_link || null,
        tags: cleanTags,
        display_order: displayOrder,
        registration_count: regCount,
        submission_count: subCount,
      };
    });

    const stats = {
      total: allEvents.length,
      pending: allEvents.filter(
        (e) =>
          e.status === 'PENDING_APPROVAL' ||
          (e.status === 'DRAFT' && Array.isArray(e.tags) && e.tags.includes('PENDING_APPROVAL'))
      ).length,
      approved: allEvents.filter((e) =>
        ['PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED'].includes(
          e.status
        )
      ).length,
      rejected: allEvents.filter((e) => e.status === 'REJECTED').length,
    };

    const res = NextResponse.json({
      authenticated: true,
      events: eventsWithCounts,
      stats,
    });

    res.cookies.set({
      name: 'is_admin_csap',
      value: '1',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// ─── POST: Login, Logout, or Session Check ───────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, username, password } = body;

    // Login Action
    if (action === 'login') {
      if (!checkCredentials(username, password)) {
        return NextResponse.json(
          { success: false, error: 'Invalid username or password' },
          { status: 401 }
        );
      }

      const token = createSessionToken(username);
      const res = NextResponse.json({
        success: true,
        message: 'Admin authenticated successfully',
      });

      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      res.cookies.set({
        name: 'is_admin_csap',
        value: '1',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return res;
    }

    // Logout Action
    if (action === 'logout') {
      const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      res.cookies.set({
        name: 'is_admin_csap',
        value: '',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });

      return res;
    }

    // Verify Session Action
    if (action === 'verify') {
      const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
      const isValid = verifySessionToken(token);
      return NextResponse.json({ authenticated: isValid });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// ─── PATCH: Approve or Reject Hackathon Request ─────────────────────────────
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ authenticated: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, eventId, blogId, feedback } = body;

    const supabase = createAdminClient();

    // ── Blog Approval / Rejection ──
    if (action === 'approve_blog') {
      const targetId = blogId || eventId;
      if (!targetId) return NextResponse.json({ error: 'Missing blogId' }, { status: 400 });

      const { data, error } = await supabase
        .from('blogs')
        .update({
          status: 'APPROVED',
          admin_feedback: null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Blog "${data.title}" approved and published successfully!`,
        blog: data,
      });
    }

    if (action === 'reject_blog') {
      const targetId = blogId || eventId;
      if (!targetId) return NextResponse.json({ error: 'Missing blogId' }, { status: 400 });

      const { data, error } = await supabase
        .from('blogs')
        .update({
          status: 'REJECTED',
          admin_feedback: feedback || 'Article does not meet publishing criteria.',
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Blog "${data.title}" rejected.`,
        blog: data,
      });
    }

    if (action === 'pending_blog' || action === 'reset_blog') {
      const targetId = blogId || eventId;
      if (!targetId) return NextResponse.json({ error: 'Missing blogId' }, { status: 400 });

      const { data, error } = await supabase
        .from('blogs')
        .update({
          status: 'PENDING_APPROVAL',
          admin_feedback: null,
          reviewed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Blog "${data.title}" moved back to Pending Review.`,
        blog: data,
      });
    }

    // ── Reorder Homepage Showcase Hackathons ──
    if (action === 'reorder_showcase' || action === 'reorder_events') {
      const { orderedEventIds } = body;
      if (!Array.isArray(orderedEventIds) || orderedEventIds.length === 0) {
        return NextResponse.json({ error: 'Missing or empty orderedEventIds array' }, { status: 400 });
      }

      // 1. Save ordered list to local data file data/showcase-order.json as reliable backup/cache
      try {
        const fs = await import('fs');
        const path = await import('path');
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(
          path.join(dataDir, 'showcase-order.json'),
          JSON.stringify({ orderedEventIds, updatedAt: new Date().toISOString() }, null, 2)
        );
      } catch (fsErr) {
        console.warn('Could not write data/showcase-order.json:', fsErr);
      }

      // 2. Fetch existing events from Supabase to preserve other tags
      const { data: existingEvents } = await supabase
        .from('events')
        .select('id, slug, tags');

      const eventMap = new Map<string, any>();
      (existingEvents || []).forEach((e: any) => {
        if (e.id) eventMap.set(e.id, e);
        if (e.slug) eventMap.set(e.slug, e);
      });

      // 3. Update each event's display_order and tags with hu_order:<index>
      const updatePromises = orderedEventIds.map(async (idOrSlug: string, index: number) => {
        const existing = eventMap.get(idOrSlug);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

        const currentTags: string[] = Array.isArray(existing?.tags) ? existing.tags : [];
        const cleanTags = currentTags.filter((t: string) => typeof t === 'string' && !t.startsWith('hu_order:'));
        cleanTags.push(`hu_order:${index}`);

        // Try updating display_order first
        let query = supabase.from('events').update({
          display_order: index,
          tags: cleanTags,
          updated_at: new Date().toISOString(),
        });
        query = isUuid ? query.eq('id', idOrSlug) : query.eq('slug', idOrSlug);
        let { error } = await query;

        // If display_order column doesn't exist yet in postgres, fallback to tags only
        if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column'))) {
          let retry = supabase.from('events').update({
            tags: cleanTags,
            updated_at: new Date().toISOString(),
          });
          retry = isUuid ? retry.eq('id', idOrSlug) : retry.eq('slug', idOrSlug);
          await retry;
        }
      });

      await Promise.all(updatePromises);

      // 4. Broadcast realtime event
      try {
        const channel = supabase.channel('public:events_realtime');
        await channel.send({
          type: 'broadcast',
          event: 'event_updated',
          payload: { action: 'showcase_reordered', orderedEventIds },
        });
      } catch (broadcastErr) {
        console.warn('Realtime broadcast error:', broadcastErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Homepage showcase order saved successfully!',
        orderedEventIds,
      });
    }

    // ── Hackathon Approval / Rejection ──
    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);

    // ── Update Hackathon Event by Admin ──
    if (action === 'update_event' || action === 'edit_event') {
      const updates = body.updates || {};
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      const allowedFields = [
        'title',
        'tagline',
        'description',
        'category',
        'event_type',
        'location',
        'organizer_name',
        'organizer_email',
        'organizer_phone',
        'institution_name',
        'host_type',
        'start_date',
        'end_date',
        'registration_deadline',
        'registration_start',
        'total_prize_value',
        'currency',
        'status',
        'min_team_size',
        'max_team_size',
        'is_team_event',
        'featured',
        'banner_url',
        'logo_url',
        'rules_text',
        'eligibility',
        'difficulty',
        'timezone',
        'tags',
        'admin_feedback',
        'prizes',
        'tracks',
        'stages',
        'faqs',
        'sponsors',
        'registration_link',
        'allow_external_redirect',
      ];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      }

      let query = supabase.from('events').update(updateData);
      query = isUuid ? query.eq('id', eventId) : query.eq('slug', eventId);
      let { data, error } = await query.select('*').single();

      // Graceful column fallback if optional columns missing
      if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column'))) {
        delete updateData.reviewed_at;
        delete updateData.admin_feedback;
        delete updateData.allow_external_redirect;
        let retry = supabase.from('events').update(updateData);
        retry = isUuid ? retry.eq('id', eventId) : retry.eq('slug', eventId);
        const result = await retry.select('*').single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Broadcast update to realtime channel
      try {
        const channel = supabase.channel('public:events_realtime');
        await channel.send({
          type: 'broadcast',
          event: 'event_updated',
          payload: { eventId, status: data.status, event: data },
        });
      } catch (broadcastErr) {
        console.warn('Realtime broadcast warning:', broadcastErr);
      }

      return NextResponse.json({
        success: true,
        message: `Event "${data.title}" updated successfully!`,
        event: data,
      });
    }

    // ── Toggle External Registration Redirect Permission ──
    if (action === 'toggle_external_redirect') {
      const allowed = Boolean(body.allowed);

      // 1. Fetch current tags
      let getQuery = supabase.from('events').select('id, tags, title');
      getQuery = isUuid ? getQuery.eq('id', eventId) : getQuery.eq('slug', eventId);
      const { data: currentEvt, error: fetchErr } = await getQuery.single();

      if (fetchErr) {
        return NextResponse.json({ error: fetchErr.message }, { status: 500 });
      }

      let currentTags = Array.isArray(currentEvt?.tags) ? [...currentEvt.tags] : [];
      if (allowed) {
        if (!currentTags.includes('allow_external_redirect')) {
          currentTags.push('allow_external_redirect');
        }
      } else {
        currentTags = currentTags.filter((t: string) => t !== 'allow_external_redirect');
      }

      const updateData: any = {
        tags: currentTags,
        updated_at: new Date().toISOString(),
      };

      // Also set allow_external_redirect column if exists
      updateData.allow_external_redirect = allowed;

      let query = supabase.from('events').update(updateData);
      query = isUuid ? query.eq('id', eventId) : query.eq('slug', eventId);
      let { data, error } = await query.select('*').single();

      // Graceful column fallback if allow_external_redirect column does not exist
      if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column'))) {
        delete updateData.allow_external_redirect;
        let retry = supabase.from('events').update(updateData);
        retry = isUuid ? retry.eq('id', eventId) : retry.eq('slug', eventId);
        const result = await retry.select('*').single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Realtime broadcast update
      try {
        const channel = supabase.channel('public:events_realtime');
        await channel.send({
          type: 'broadcast',
          event: 'event_updated',
          payload: { eventId, event: data },
        });
      } catch (broadcastErr) {
        console.warn('Realtime broadcast warning:', broadcastErr);
      }

      return NextResponse.json({
        success: true,
        message: allowed
          ? `External redirect unlocked for "${data.title}"`
          : `External redirect locked for "${data.title}"`,
        event: {
          ...data,
          allow_external_redirect: allowed,
        },
      });
    }

    if (action === 'approve') {
      // Transition to PUBLISHED so it appears live across website
      const updateData: any = {
        status: 'PUBLISHED',
        updated_at: new Date().toISOString(),
      };

      // Try updating with extra columns if present
      let query = supabase.from('events').update({
        ...updateData,
        reviewed_at: new Date().toISOString(),
      });
      query = isUuid ? query.eq('id', eventId) : query.eq('slug', eventId);
      let { data, error } = await query.select('*').single();

      // If reviewed_at column doesn't exist yet, retry without it
      if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column'))) {
        let retry = supabase.from('events').update(updateData);
        retry = isUuid ? retry.eq('id', eventId) : retry.eq('slug', eventId);
        const result = await retry.select('*').single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Broadcast update to all clients via Supabase Realtime channel
      try {
        const channel = supabase.channel('public:events_realtime');
        await channel.send({
          type: 'broadcast',
          event: 'event_updated',
          payload: { eventId, status: 'PUBLISHED', event: data },
        });
        await channel.send({
          type: 'broadcast',
          event: 'event_created',
          payload: { event: data },
        });
      } catch (broadcastErr) {
        console.warn('Realtime broadcast warning:', broadcastErr);
      }

      return NextResponse.json({
        success: true,
        message: `Hackathon "${data.title}" approved and published successfully!`,
        event: data,
      });
    }

    if (action === 'reject') {
      // Transition to REJECTED (with graceful fallback to DRAFT + rejected tag if constraint pending)
      const updateData: any = {
        status: 'REJECTED',
        updated_at: new Date().toISOString(),
      };

      let query = supabase.from('events').update({
        ...updateData,
        admin_feedback: feedback || 'Submission does not meet guidelines.',
        reviewed_at: new Date().toISOString(),
      });
      query = isUuid ? query.eq('id', eventId) : query.eq('slug', eventId);
      let { data, error } = await query.select('*').single();

      // If columns or status constraint fail, fallback gracefully
      if (error && (error.code === '42703' || error.code === '23514' || error.code === 'PGRST204' || error.message?.includes('column'))) {
        let retry = supabase.from('events').update({
          status: 'DRAFT',
          updated_at: new Date().toISOString(),
        });
        retry = isUuid ? retry.eq('id', eventId) : retry.eq('slug', eventId);
        const result = await retry.select('*').single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Broadcast event update so it is removed from any live listings
      try {
        const channel = supabase.channel('public:events_realtime');
        await channel.send({
          type: 'broadcast',
          event: 'event_updated',
          payload: { eventId, status: 'REJECTED', event: data },
        });
      } catch (broadcastErr) {
        console.warn('Realtime broadcast warning:', broadcastErr);
      }

      return NextResponse.json({
        success: true,
        message: `Hackathon rejected.`,
        event: data,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// ─── DELETE: Delete a hackathon submission ───────────────────────────────────
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ authenticated: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const resource = searchParams.get('resource');
    const eventId = searchParams.get('eventId') || searchParams.get('blogId');

    if (!eventId) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (resource === 'blogs') {
      const { error } = await supabase.from('blogs').delete().eq('id', eventId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Blog deleted successfully' });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);

    let query = supabase.from('events').delete();
    query = isUuid ? query.eq('id', eventId) : query.eq('slug', eventId);
    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Broadcast deletion
    try {
      const channel = supabase.channel('public:events_realtime');
      await channel.send({
        type: 'broadcast',
        event: 'event_deleted',
        payload: { eventId },
      });
    } catch (broadcastErr) {
      console.warn('Broadcast delete error:', broadcastErr);
    }

    return NextResponse.json({ success: true, message: 'Event deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
