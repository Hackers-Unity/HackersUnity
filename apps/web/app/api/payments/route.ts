import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, authenticateRequest } from '@/lib/api-auth';
import { UserRole } from '@hackers-unity/shared-types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const eventId = searchParams.get('eventId');
    const scope = searchParams.get('scope');
    const isAdminParam = searchParams.get('isAdmin') === 'true';

    const auth = await authenticateRequest(req);
    const serverSupabase = createAdminClient();

    const isPlatformAdmin = Boolean(
      isAdminParam ||
      scope === 'all' ||
      auth?.email === 'chinmaybhatt26@gmail.com' ||
      email === 'chinmaybhatt26@gmail.com' ||
      (auth?.user?.user_metadata?.role === UserRole.ADMIN || auth?.user?.user_metadata?.role === UserRole.SUPER_ADMIN)
    );

    let query = serverSupabase
      .from('payments')
      .select('*, events(slug, title, banner_url)')
      .order('created_at', { ascending: false });

    // If specific event requested
    if (eventId) {
      query = query.eq('event_id', eventId);
    } else if (!isPlatformAdmin) {
      // Normal participant: show only their own payments
      const targetUserId = userId || auth?.userId;
      const targetEmail = email || auth?.email;

      if (targetUserId && targetEmail) {
        query = query.or(`user_id.eq.${targetUserId},team_leader_email.eq.${targetEmail}`);
      } else if (targetUserId) {
        query = query.eq('user_id', targetUserId);
      } else if (targetEmail) {
        query = query.eq('team_leader_email', targetEmail);
      } else {
        return NextResponse.json({ success: true, count: 0, payments: [] });
      }
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[Payments API] Query error, trying fallback without join:', error.message);
      let fallbackQuery = serverSupabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventId) {
        fallbackQuery = fallbackQuery.eq('event_id', eventId);
      } else if (!isPlatformAdmin) {
        const targetUserId = userId || auth?.userId;
        const targetEmail = email || auth?.email;
        if (targetUserId && targetEmail) {
          fallbackQuery = fallbackQuery.or(`user_id.eq.${targetUserId},team_leader_email.eq.${targetEmail}`);
        } else if (targetUserId) {
          fallbackQuery = fallbackQuery.eq('user_id', targetUserId);
        } else if (targetEmail) {
          fallbackQuery = fallbackQuery.eq('team_leader_email', targetEmail);
        }
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        count: fallbackData?.length || 0,
        payments: fallbackData || [],
      });
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      payments: data || [],
    });
  } catch (err: any) {
    console.error('[Payments API] Exception:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
