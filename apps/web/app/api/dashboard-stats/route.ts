import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qbidqpbtivgmsxlitbxx.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ESfBQ9lmjlHsSP3eDWJpwg_sOO9QmN5';

const serverSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Active event statuses — excludes DRAFT, PENDING_APPROVAL, ARCHIVED
const ACTIVE_STATUSES = ['PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'ONGOING'];

/**
 * Helper: get ISO date string for N days ago
 */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/**
 * Helper: aggregate registrations into time-series buckets
 */
function bucketRegistrations(
  rows: { registered_at: string }[],
  rangeDays: number
): { label: string; count: number }[] {
  const now = new Date();
  // Decide bucket size based on range
  let bucketCount: number;
  let labelFn: (d: Date) => string;

  if (rangeDays <= 7) {
    bucketCount = 7;
    labelFn = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
  } else if (rangeDays <= 30) {
    bucketCount = 6; // ~5-day buckets
    labelFn = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (rangeDays <= 90) {
    bucketCount = 6; // ~15-day buckets
    labelFn = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (rangeDays <= 180) {
    bucketCount = 6; // ~30-day buckets (monthly)
    labelFn = (d) => d.toLocaleDateString('en-US', { month: 'short' });
  } else {
    bucketCount = 6; // ~60-day buckets (bi-monthly)
    labelFn = (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }

  const bucketDuration = rangeDays / bucketCount;
  const buckets: { label: string; start: Date; end: Date; count: number }[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const end = new Date(now.getTime() - i * bucketDuration * 86400000);
    const start = new Date(now.getTime() - (i + 1) * bucketDuration * 86400000);
    buckets.unshift({
      label: labelFn(end),
      start,
      end,
      count: 0,
    });
  }

  // Count registrations into buckets
  for (const row of rows) {
    const t = new Date(row.registered_at).getTime();
    for (const bucket of buckets) {
      if (t >= bucket.start.getTime() && t < bucket.end.getTime()) {
        bucket.count++;
        break;
      }
    }
  }

  // Make cumulative for trajectory-style chart
  let cumulative = 0;
  return buckets.map((b) => {
    cumulative += b.count;
    return { label: b.label, count: cumulative };
  });
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const rangeDaysParam = req.nextUrl.searchParams.get('rangeDays');
    const rangeDays = rangeDaysParam ? parseInt(rangeDaysParam, 10) : 30;

    // ═══════════════════════════════════════════════════════════════════
    // 1. KPI CARDS (same as before)
    // ═══════════════════════════════════════════════════════════════════

    const { count: totalBuilders, error: buildersErr } = await serverSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: liveArenas, error: arenasErr } = await serverSupabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .in('status', ACTIVE_STATUSES);

    let myRegistered = 0;
    if (userId) {
      const { count, error: regErr } = await serverSupabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (!regErr && count !== null) {
        myRegistered = count;
      }
    }

    let totalPrizePool = 0;
    const { data: prizeData, error: prizeErr } = await serverSupabase
      .from('events')
      .select('total_prize_value')
      .in('status', ACTIVE_STATUSES);

    if (!prizeErr && prizeData) {
      totalPrizePool = prizeData.reduce(
        (sum: number, row: any) => sum + (Number(row.total_prize_value) || 0),
        0
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. TRAJECTORY CHART — registrations over time with growth %
    // ═══════════════════════════════════════════════════════════════════

    const currentStart = daysAgo(rangeDays);
    const previousStart = daysAgo(rangeDays * 2);

    // Current period registrations (with timestamps for bucketing)
    const { data: currentRegs } = await serverSupabase
      .from('registrations')
      .select('registered_at')
      .gte('registered_at', currentStart)
      .order('registered_at', { ascending: true });

    // Previous period count (just need the count for growth comparison)
    const { count: prevCount } = await serverSupabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .gte('registered_at', previousStart)
      .lt('registered_at', currentStart);

    const currentCount = currentRegs?.length ?? 0;
    const prevPeriodCount = prevCount ?? 0;

    // Calculate growth percentage
    let growthPercent: number | null = null;
    if (prevPeriodCount > 0) {
      growthPercent = Math.round(((currentCount - prevPeriodCount) / prevPeriodCount) * 100);
    } else if (currentCount > 0) {
      growthPercent = null; // Not enough historical data
    }

    // Build chart data points
    const trajectoryData = currentRegs && currentRegs.length > 0
      ? bucketRegistrations(currentRegs, rangeDays)
      : [];

    // ═══════════════════════════════════════════════════════════════════
    // 3. DOMAIN BREAKDOWN — event category distribution by registrations
    // ═══════════════════════════════════════════════════════════════════

    // Get all active events with their categories and registration counts
    const { data: categoryData } = await serverSupabase
      .from('events')
      .select('category, registration_count')
      .in('status', [...ACTIVE_STATUSES, 'COMPLETED']);

    const categoryMap = new Map<string, number>();
    let totalCategoryRegs = 0;

    if (categoryData) {
      for (const row of categoryData) {
        const cat = row.category || 'OTHER';
        const count = Number(row.registration_count) || 0;
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + count);
        totalCategoryRegs += count;
      }
    }

    // If registration_count is all zero, fall back to counting events per category
    if (totalCategoryRegs === 0 && categoryData && categoryData.length > 0) {
      categoryMap.clear();
      for (const row of categoryData) {
        const cat = row.category || 'OTHER';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        totalCategoryRegs++;
      }
    }

    const domainBreakdown = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: totalCategoryRegs > 0 ? Math.round((count / totalCategoryRegs) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ═══════════════════════════════════════════════════════════════════
    // 4. USER PARTICIPATION SUMMARY (for the authenticated user)
    // ═══════════════════════════════════════════════════════════════════

    let participationSummary = {
      total: 0,
      upcoming: 0,
      active: 0,
      completed: 0,
    };

    if (userId) {
      // Get user's registrations with joined event status
      const { data: userRegs } = await serverSupabase
        .from('registrations')
        .select('event_id, events(status, start_date, end_date)')
        .eq('user_id', userId);

      if (userRegs) {
        participationSummary.total = userRegs.length;
        const now = new Date();
        for (const reg of userRegs) {
          const evt = (reg as any).events;
          if (!evt) continue;
          const status = evt.status;
          const startDate = evt.start_date ? new Date(evt.start_date) : null;
          const endDate = evt.end_date ? new Date(evt.end_date) : null;

          if (status === 'COMPLETED' || status === 'ARCHIVED') {
            participationSummary.completed++;
          } else if (
            status === 'LIVE' ||
            status === 'ONGOING' ||
            status === 'JUDGING' ||
            (startDate && endDate && now >= startDate && now <= endDate)
          ) {
            participationSummary.active++;
          } else {
            participationSummary.upcoming++;
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // RESPONSE
    // ═══════════════════════════════════════════════════════════════════

    if (buildersErr) console.warn('[dashboard-stats] profiles count error:', buildersErr.message);
    if (arenasErr) console.warn('[dashboard-stats] events count error:', arenasErr.message);
    if (prizeErr) console.warn('[dashboard-stats] prize sum error:', prizeErr.message);

    return NextResponse.json({
      // KPI cards
      totalBuilders: totalBuilders ?? 0,
      liveArenas: liveArenas ?? 0,
      myRegistered,
      totalPrizePool,

      // Trajectory chart
      trajectory: {
        data: trajectoryData,
        currentCount,
        prevCount: prevPeriodCount,
        growthPercent,
        rangeDays,
      },

      // Domain breakdown
      domainBreakdown,

      // Participation summary
      participationSummary,
    });
  } catch (err: any) {
    console.error('[dashboard-stats] Server error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
