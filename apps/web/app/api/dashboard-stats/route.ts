import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateRequest,
  createAdminClient,
} from '@/lib/api-auth';

// Active event statuses — excludes DRAFT, ARCHIVED, REJECTED
const ACTIVE_STATUSES = ['PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'ONGOING'];

// Lightweight in-memory cache (60-second TTL) for snappy dashboard responsiveness
interface CacheEntry {
  timestamp: number;
  data: any;
}
const statsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

/**
 * Build 100% REALTIME trajectory from actual database registration timestamps
 */
function buildRealtimeTrajectory(
  allRegistrations: { registered_at: string }[],
  rangeDays: number
): {
  data: { label: string; count: number; cumulative: number; dateIso: string }[];
  currentCount: number;
  prevCount: number;
  growthPercent: number;
} {
  const now = new Date();
  const bucketCount = rangeDays <= 7 ? 7 : 6;
  const bucketDurationMs = (rangeDays * 86400000) / bucketCount;
  const rangeStartMs = now.getTime() - rangeDays * 86400000;
  const prevPeriodStartMs = rangeStartMs - rangeDays * 86400000;

  let labelFn: (d: Date) => string;
  if (rangeDays <= 7) {
    labelFn = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
  } else if (rangeDays <= 30) {
    labelFn = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (rangeDays <= 90) {
    labelFn = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (rangeDays <= 180) {
    labelFn = (d) => d.toLocaleDateString('en-US', { month: 'short' });
  } else {
    labelFn = (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }

  // Pre-sort registrations by timestamp ascending
  const sorted = [...allRegistrations].sort(
    (a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime()
  );

  const buckets: { label: string; count: number; cumulative: number; dateIso: string }[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bStartMs = rangeStartMs + i * bucketDurationMs;
    const bEndMs = rangeStartMs + (i + 1) * bucketDurationMs;
    const bEndDate = new Date(bEndMs);

    // Registrations that occurred during this specific bucket window
    const countInBucket = sorted.filter((r) => {
      const t = new Date(r.registered_at).getTime();
      return t >= bStartMs && t < bEndMs;
    }).length;

    // Cumulative registrations up to the end of this bucket
    const cumulativeUpTo = sorted.filter((r) => {
      const t = new Date(r.registered_at).getTime();
      return t < bEndMs;
    }).length;

    buckets.push({
      label: labelFn(bEndDate),
      count: countInBucket,
      cumulative: cumulativeUpTo,
      dateIso: bEndDate.toISOString(),
    });
  }

  // Calculate real growth compared to previous equivalent period
  const currentPeriodCount = sorted.filter((r) => {
    const t = new Date(r.registered_at).getTime();
    return t >= rangeStartMs && t <= now.getTime();
  }).length;

  const prevPeriodCount = sorted.filter((r) => {
    const t = new Date(r.registered_at).getTime();
    return t >= prevPeriodStartMs && t < rangeStartMs;
  }).length;

  let growthPercent = 0;
  if (prevPeriodCount > 0) {
    growthPercent = Math.round(((currentPeriodCount - prevPeriodCount) / prevPeriodCount) * 100);
  } else if (currentPeriodCount > 0) {
    growthPercent = 100;
  }

  return {
    data: buckets,
    currentCount: currentPeriodCount,
    prevCount: prevPeriodCount,
    growthPercent,
  };
}

/**
 * Cluster real event tags and categories into genuine domain distributions
 */
function buildRealDomainBreakdown(
  events: { tags?: string[] | null; category?: string | null; registration_count?: number | null }[]
): { category: string; count: number; percentage: number }[] {
  const clusters: Record<string, { tags: string[]; count: number }> = {
    'AI & Intelligent Agents': {
      tags: ['ai', 'ml', 'machine learning', 'openai', 'codex', 'agents & automation', 'llm', 'genai', 'autonomous agents', 'multimodal'],
      count: 0,
    },
    'Web3 & Blockchain': {
      tags: ['web3', 'blockchain', 'icp', 'defi', 'zk-proofs', 'decentralized identity', 'web3/blockchain'],
      count: 0,
    },
    'DevOps & Automation': {
      tags: ['devops', 'open source', 'workflow automation', 'cloud'],
      count: 0,
    },
    'Cybersecurity & Systems': {
      tags: ['cybersecurity', 'engineering', 'puzzle'],
      count: 0,
    },
    'Open Innovation & Full-Stack': {
      tags: ['open innovation', 'fintech', 'iot', 'development', 'fullstack', 'next.js', 'innovation', 'open ended', 'gaming', 'sustainability', 'healthtech'],
      count: 0,
    },
  };

  events.forEach((e) => {
    const regCount = Number(e.registration_count) || 0;
    if (regCount <= 0) return;
    const eventTags = (e.tags || []).map((t) => t.toLowerCase());

    let matched = false;
    for (const [, config] of Object.entries(clusters)) {
      if (config.tags.some((t) => eventTags.some((et) => et.includes(t)))) {
        config.count += regCount;
        matched = true;
      }
    }
    if (!matched) {
      clusters['Open Innovation & Full-Stack'].count += regCount;
    }
  });

  const total = Object.values(clusters).reduce((acc, c) => acc + c.count, 0);
  return Object.entries(clusters)
    .map(([category, c]) => ({
      category,
      count: c.count,
      percentage: total > 0 ? Math.round((c.count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function GET(req: NextRequest) {
  try {
    const rangeDaysParam = req.nextUrl.searchParams.get('rangeDays');
    const rangeDays = rangeDaysParam ? parseInt(rangeDaysParam, 10) : 30;

    // Gracefully resolve user ID: first from session cookie, fallback to param
    let effectiveUserId: string | null = null;
    try {
      const auth = await authenticateRequest(req);
      if (auth?.userId) {
        effectiveUserId = auth.userId;
      }
    } catch {
      // Ignore auth cookie errors
    }

    if (!effectiveUserId) {
      const queryUserId = req.nextUrl.searchParams.get('userId');
      if (queryUserId && queryUserId.length > 8 && queryUserId.includes('-')) {
        effectiveUserId = queryUserId;
      }
    }

    // Check in-memory cache
    const cacheKey = `${effectiveUserId || 'guest'}_${rangeDays}`;
    const cached = statsCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=30',
          'X-Cache': 'HIT',
        },
      });
    }

    const serverSupabase = createAdminClient();

    // ═══════════════════════════════════════════════════════════════════
    // PARALLEL EXECUTION: Run all database queries simultaneously
    // ═══════════════════════════════════════════════════════════════════
    const [
      profilesRes,
      eventsRes,
      allRegsRes,
      submissionsRes,
      paymentsRes,
      totalPaymentsRes,
      userRegsRes,
    ] = await Promise.all([
      // 1. Total real profiles count
      serverSupabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }),

      // 2. All events with metadata
      serverSupabase
        .from('events')
        .select('id, title, slug, status, total_prize_value, start_date, end_date, registration_deadline, category, tags, participants_count, registration_count, organizer_id, mode'),

      // 3. All real registrations with timestamps (capped to recent 1500 to protect DB Disk IO Budget)
      serverSupabase
        .from('registrations')
        .select('id, registered_at, event_id, user_id, user_name, status')
        .order('registered_at', { ascending: false })
        .limit(1500),

      // 4. Recent project submissions
      serverSupabase
        .from('submissions')
        .select('id, project_name, created_at, status, event_id, submitter_id')
        .order('created_at', { ascending: false })
        .limit(20),

      // 5. Recent payments
      serverSupabase
        .from('payments')
        .select('id, amount, created_at, status, event_name, event_id, user_id, team_leader_name')
        .order('created_at', { ascending: false })
        .limit(20),

      // 6. Total payments aggregates (capped to protect DB Disk IO Budget)
      serverSupabase
        .from('payments')
        .select('amount, status, event_id', { count: 'exact' })
        .limit(1500),

      // 7. User registrations (if logged in)
      effectiveUserId
        ? serverSupabase
            .from('registrations')
            .select('event_id, events(status, start_date, end_date)')
            .eq('user_id', effectiveUserId)
        : Promise.resolve({ data: null, error: null }),
    ]);

    const eventsList = eventsRes.data || [];
    const allRegistrations = allRegsRes.data || [];
    const allSubmissions = submissionsRes.data || [];
    const allPaymentsList = paymentsRes.data || [];
    const totalPaymentsCount = totalPaymentsRes.count ?? allPaymentsList.length;

    // ─── 1. Real KPI Numbers ──────────────────────────────────────────
    // Total verified builder profiles
    const totalBuilders = profilesRes.count ?? 0;

    // Total actual event registrations across platform
    const totalRegistrations = allRegistrations.length;

    // Live arenas currently open or ongoing
    const liveArenas = eventsList.filter((e) => ACTIVE_STATUSES.includes(e.status)).length;
    const totalArenas = eventsList.length;

    // Total project submissions
    const totalSubmissions = allSubmissions.length;

    // Prize pools in INR
    const activePrizePool = eventsList
      .filter((e) => ACTIVE_STATUSES.includes(e.status))
      .reduce((sum, e) => sum + (Number(e.total_prize_value) || 0), 0);

    const allTimePrizePool = eventsList.reduce(
      (sum, e) => sum + (Number(e.total_prize_value) || 0),
      0
    );

    // Revenue / payments
    const totalRevenue = (totalPaymentsRes.data || []).reduce(
      (sum: number, p: any) => sum + (Number(p.amount) || 0),
      0
    );

    // User's own registered count
    const myRegistered = userRegsRes.data?.length || 0;

    // ─── 2. Realtime Platform Trajectory ──────────────────────────────
    const trajectory = buildRealtimeTrajectory(allRegistrations, rangeDays);

    // ─── 3. Real Category & Domain Breakdown ──────────────────────────
    const domainBreakdown = buildRealDomainBreakdown(eventsList);

    // ─── 4. User Participation Summary ────────────────────────────────
    const participationSummary = {
      total: 0,
      upcoming: 0,
      active: 0,
      completed: 0,
    };

    if (userRegsRes.data) {
      participationSummary.total = userRegsRes.data.length;
      const nowDate = new Date();
      for (const reg of userRegsRes.data) {
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
          (startDate && endDate && nowDate >= startDate && nowDate <= endDate)
        ) {
          participationSummary.active++;
        } else {
          participationSummary.upcoming++;
        }
      }
    }

    // ─── 5. Organizer Statistics (for users managing hackathons) ──────
    let organizerStats = {
      hasHostedEvents: false,
      hostedCount: 0,
      totalAttendees: 0,
      totalSubmissions: 0,
      totalPayments: 0,
      totalRevenue: 0,
      topEventTitle: null as string | null,
    };

    if (effectiveUserId) {
      const userHostedEvents = eventsList.filter((e) => e.organizer_id === effectiveUserId);
      if (userHostedEvents.length > 0) {
        const hostedEventIds = new Set(userHostedEvents.map((e) => e.id));
        const hostedAttendees = allRegistrations.filter((r) => hostedEventIds.has(r.event_id)).length;
        const hostedSubs = allSubmissions.filter((s) => hostedEventIds.has(s.event_id)).length;
        const hostedPayments = (totalPaymentsRes.data || []).filter((p: any) =>
          hostedEventIds.has(p.event_id)
        );
        const hostedRevenue = hostedPayments.reduce(
          (sum: number, p: any) => sum + (Number(p.amount) || 0),
          0
        );

        // Find top event
        const topEvt = [...userHostedEvents].sort(
          (a, b) => (Number(b.registration_count) || 0) - (Number(a.registration_count) || 0)
        )[0];

        organizerStats = {
          hasHostedEvents: true,
          hostedCount: userHostedEvents.length,
          totalAttendees: Math.max(hostedAttendees, Number(topEvt?.registration_count) || 0),
          totalSubmissions: hostedSubs,
          totalPayments: hostedPayments.length,
          totalRevenue: hostedRevenue,
          topEventTitle: topEvt?.title || null,
        };
      }
    }

    // ─── 6. Realtime Activity Feed (Recent Live Pulses) ───────────────
    // Build an authentic timeline stream of recent registrations, submissions, and payments
    const eventMap = new Map(eventsList.map((e) => [e.id, e]));

    const recentActivity: {
      id: string;
      type: 'REGISTRATION' | 'SUBMISSION' | 'PAYMENT';
      title: string;
      subtitle: string;
      timestamp: string;
      amount?: number;
    }[] = [];

    // Add recent registrations
    allRegistrations.slice(0, 5).forEach((r) => {
      const evt = eventMap.get(r.event_id);
      recentActivity.push({
        id: `reg-${r.id}`,
        type: 'REGISTRATION',
        title: `${r.user_name || 'Builder'} registered`,
        subtitle: evt?.title || 'Hackathon Arena',
        timestamp: r.registered_at,
      });
    });

    // Add recent submissions
    allSubmissions.slice(0, 3).forEach((s) => {
      const evt = eventMap.get(s.event_id);
      recentActivity.push({
        id: `sub-${s.id}`,
        type: 'SUBMISSION',
        title: `Project: "${s.project_name}"`,
        subtitle: `Submitted to ${evt?.title || 'Arena'}`,
        timestamp: s.created_at,
      });
    });

    // Add recent payments
    allPaymentsList.slice(0, 3).forEach((p) => {
      recentActivity.push({
        id: `pay-${p.id}`,
        type: 'PAYMENT',
        title: `Payment Received (₹${p.amount})`,
        subtitle: p.event_name || 'Hackathon Pass',
        timestamp: p.created_at,
        amount: p.amount,
      });
    });

    // Sort by timestamp descending
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // ─── 7. Upcoming Hackathon Milestones ─────────────────────────────
    const upcomingEvents = eventsList
      .filter((e) => e.start_date && new Date(e.start_date) > new Date())
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    const nextEvent = upcomingEvents[0] || null;
    let upcomingMilestone = null;
    if (nextEvent) {
      const daysUntil = Math.max(
        0,
        Math.ceil((new Date(nextEvent.start_date).getTime() - Date.now()) / 86400000)
      );
      upcomingMilestone = {
        title: nextEvent.title,
        slug: nextEvent.slug || nextEvent.id,
        startDate: nextEvent.start_date,
        daysUntil,
        mode: (nextEvent as any).mode || 'In-Person',
        prize: Number(nextEvent.total_prize_value) || 0,
      };
    }

    const responsePayload = {
      totalBuilders,
      totalRegistrations,
      liveArenas,
      totalArenas,
      totalSubmissions,
      activePrizePool,
      allTimePrizePool,
      totalPaymentsCount,
      totalRevenue,
      myRegistered,
      trajectory,
      domainBreakdown,
      participationSummary,
      organizerStats,
      recentActivity: recentActivity.slice(0, 6),
      upcomingMilestone,
    };

    // Cache the response
    statsCache.set(cacheKey, { timestamp: now, data: responsePayload });

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=30',
        'X-Cache': 'MISS',
      },
    });
  } catch (err: any) {
    console.error('[dashboard-stats] Server error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
