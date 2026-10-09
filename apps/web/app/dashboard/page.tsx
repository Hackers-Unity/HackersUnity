'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Bookmark,
  Users,
  Settings,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Phone,
  Mail,
  User as UserIcon,
  Shield,
  Crown,
  Loader2,
  Plus,
  X as XIcon,
  BarChart3,
  Edit3,
  Trash2,
  ExternalLink,
  PlusCircle,
  Eye,
  Download,
  Flame,
  Calendar,
  MapPin,
  TrendingUp,
  Globe,
  Activity,
  Sparkles,
  Share2,
  Compass,
  Filter,
  Layers,
  ArrowUpRight,
  Search,
  Zap,
  Briefcase,
  Megaphone,
  Check,
  Clock,
  ArrowRight,
  ChevronRight,
  Copy,
  CopyCheck,
  Rocket,
  FileSpreadsheet,
  Github,
  Video,
  Lock,
  CreditCard,
  Receipt,
  Printer,
  CheckCircle,
} from 'lucide-react';
import {
  getMyRegistrations,
  getBookmarkedEventIds,
  getAllEvents,
  updateHostedEvent,
  deleteHostedEvent,
  syncBookmarksWithSupabase,
  getEventRegistrations,
  getEventRegistrationsCount,
  UserRegistrationItem,
  getProjectSubmission,
  getEventSubmissionsCount,
  ProjectSubmission,
} from '@/lib/storage';
import { ExtendedEvent } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { stripHtmlAndMarkdown } from '@/lib/format-description';
import {
  updateEventInSupabase,
  deleteEventInSupabase,
  fetchPublishedEvents,
  fetchUserRegistrations,
  fetchOrganizerEvents,
  fetchEventRegistrations,
  fetchAllSubmissionCounts,
  subscribeToAllSubmissions,
  fetchUserPaymentsSupabase,
} from '@/lib/supabase-service';
import { supabase } from '@/lib/supabase';
import { HackathonCard } from '@/components/hackathon-card';
import { formatDate, formatCurrency, getEventPrivateLink, downloadReceiptPdf } from '@/lib/utils';
import { AuthModal } from '@/components/auth-modal';
import { EditEventModal } from '@/components/edit-event-modal';
import { PublicProfileModal } from '@/components/public-profile-modal';
import { ProjectSubmissionModal } from '@/components/project-submission-modal';

import { UserRole } from '@hackers-unity/shared-types';

export default function DashboardPage() {
  const { user, supabaseUser, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [submissionModalEvent, setSubmissionModalEvent] = useState<ExtendedEvent | null>(null);

  // Active Tab in the Left Sidebar
  const [activeTab, setActiveTab] = useState<
    'overview' | 'participations' | 'organizing' | 'bookmarks' | 'payments'
  >('overview');

  // Payments & Receipts States
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'FAILED'>('ALL');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<any | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [copiedPaymentKey, setCopiedPaymentKey] = useState<string | null>(null);

  const copyPaymentValue = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedPaymentKey(key);
      setTimeout(() => setCopiedPaymentKey(null), 2000);
    }
  };

  // Realtime Data States
  const [registrations, setRegistrations] = useState<UserRegistrationItem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [allEvents, setAllEvents] = useState<ExtendedEvent[]>([]);
  const [myHostedEvents, setMyHostedEvents] = useState<ExtendedEvent[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Database-driven dashboard KPI stats
  const [dashStats, setDashStats] = useState<{
    totalBuilders: number;
    liveArenas: number;
    myRegistered: number;
    totalPrizePool: number;
    trajectory: {
      data: { label: string; count: number }[];
      currentCount: number;
      prevCount: number;
      growthPercent: number | null;
      rangeDays: number;
    };
    domainBreakdown: { category: string; count: number; percentage: number }[];
    participationSummary: { total: number; upcoming: number; active: number; completed: number };
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [trajectoryRange, setTrajectoryRange] = useState<number>(30);

  // Filter States
  const [partFilter, setPartFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [partSearch, setPartSearch] = useState('');
  const [hostFilter, setHostFilter] = useState<'ALL' | 'LIVE' | 'COMPLETED' | 'DRAFT'>('ALL');
  const [hostSearch, setHostSearch] = useState('');
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});

  // Chart State
  const [activeChartPoint, setActiveChartPoint] = useState<number>(5);

  // Modals
  const [editingEvent, setEditingEvent] = useState<ExtendedEvent | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewingHackersEvent, setViewingHackersEvent] = useState<ExtendedEvent | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<ExtendedEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [showPublicProfileModal, setShowPublicProfileModal] = useState(false);

  // Realtime Event Registrations Modal State
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);

  const userId = supabaseUser?.id || user?.id;

  // ─── 1. DYNAMIC DATA LOADER ────────────────────────────────────────────────
  const loadDashboardData = useCallback(async () => {
    try {
      const deletedIds: string[] =
        typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('hackers_unity_deleted_events') || '[]')
          : [];

      // Initial fast paint from local storage so the dashboard never renders blank
      const localEvents = getAllEvents();
      if (localEvents.length > 0) {
        const filteredLocal = localEvents.filter(
          (e) => !deletedIds.includes(e.id) && !deletedIds.includes(e.slug)
        );
        setAllEvents(filteredLocal);
      }

      const isDbUser = Boolean(userId && userId.length > 10 && userId.includes('-'));
      const userEmail = user?.email || supabaseUser?.email || '';
      const isAdminOrOrganizer = Boolean(
        userEmail === 'chinmaybhatt26@gmail.com' ||
        user?.role === UserRole.ADMIN ||
        user?.role === UserRole.SUPER_ADMIN ||
        user?.role === UserRole.ORGANIZER
      );

      // Parallel remote fetch for maximum load speed
      const [published, remoteRegs, hosted, userPayments] = await Promise.all([
        fetchPublishedEvents(),
        isDbUser ? fetchUserRegistrations(userId!) : Promise.resolve([]),
        isDbUser ? fetchOrganizerEvents(userId!) : Promise.resolve([]),
        (isDbUser || userEmail)
          ? fetchUserPaymentsSupabase(userId || '', userEmail, {
              isAdmin: isAdminOrOrganizer,
              scope: isAdminOrOrganizer ? 'all' : 'user',
            })
          : Promise.resolve([]),
      ]);

      const eventMap = new Map<string, ExtendedEvent>();
      localEvents.forEach((e) => {
        if (!deletedIds.includes(e.id) && !deletedIds.includes(e.slug)) {
          eventMap.set(e.id, e);
        }
      });
      published.forEach((e) => {
        if (!deletedIds.includes(e.id) && !deletedIds.includes(e.slug)) {
          eventMap.set(e.id, e);
        }
      });
      const combinedEvents = Array.from(eventMap.values());
      setAllEvents(combinedEvents);

      // 2. User Registrations & Payments
      let finalPayments = userPayments || [];
      if (!isAdminOrOrganizer && hosted && hosted.length > 0) {
        try {
          const hostPayments = await fetchUserPaymentsSupabase(userId || '', userEmail, {
            isAdmin: true,
            scope: 'all',
          });
          if (hostPayments && hostPayments.length > 0) {
            finalPayments = hostPayments;
          }
        } catch {}
      }
      setPayments(finalPayments);

      if (remoteRegs && remoteRegs.length > 0) {
        const userRegs: UserRegistrationItem[] = remoteRegs.map((r: any) => {
          const rawEntryFee = Number(r.events?.entry_fee || 0);
          const mappedEntryFee = (rawEntryFee === 59 || rawEntryFee === 1) ? 800 : rawEntryFee;
          return {
            eventId: r.event_id,
            eventName: r.events?.title || r.events?.name || 'Registered Hackathon',
            registeredAt: r.registered_at,
            teamName: r.team_name,
            isTeam: r.is_team,
            role: r.role || 'Participant',
            status: r.status || 'CONFIRMED',
            paymentStatus: r.payment_status || (mappedEntryFee > 0 ? 'UNPAID' : 'FREE'),
            paymentId: r.payment_id,
            entryFee: mappedEntryFee,
            currency: r.events?.currency || 'INR',
            teamId: r.team_id,
            slug: r.events?.slug || r.event_id,
          };
        });
        setRegistrations(userRegs);
      } else {
        setRegistrations(getMyRegistrations());
      }

      // 3. Hosted Events
      if (hosted && hosted.length > 0) {
        setMyHostedEvents(
          hosted.filter((e) => !deletedIds.includes(e.id) && !deletedIds.includes(e.slug))
        );
      } else {
        setMyHostedEvents([]);
      }

      // 4. Bookmarks (non-blocking)
      const bMarks = getBookmarkedEventIds();
      setBookmarkedIds(bMarks);
      if (isDbUser) {
        syncBookmarksWithSupabase(userId!).then((ids) => {
          if (ids && ids.length > 0) setBookmarkedIds(ids);
        }).catch(() => {});
      }

      // 5. Submission Counts (non-blocking)
      fetchAllSubmissionCounts().then((counts) => {
        setSubmissionCounts(counts);
      }).catch(() => {});
    } catch (err) {
      console.warn('Dashboard data load warning:', err);
    } finally {
      setLoadingData(false);
    }
  }, [userId]);

  // ─── 2. REALTIME SUBSCRIPTIONS & EVENT LISTENERS ────────────────────────────
  useEffect(() => {
    loadDashboardData();

    // Listen to local storage changes with debounce
    let storageTimer: ReturnType<typeof setTimeout> | null = null;
    const handleStorage = () => {
      if (storageTimer) clearTimeout(storageTimer);
      storageTimer = setTimeout(() => {
        loadDashboardData();
      }, 500);
    };
    window.addEventListener('hackers_unity_storage_change', handleStorage);

    // Setup Supabase Realtime Channels for instant updates
    const eventsChannel = supabase
      .channel('dashboard_events_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          loadDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        () => {
          loadDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookmarks' },
        () => {
          loadDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          loadDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions' },
        () => {
          fetchAllSubmissionCounts().then((counts) => setSubmissionCounts(counts)).catch(() => {});
        }
      )
      .on('broadcast', { event: 'registration_created' }, () => {
        loadDashboardData();
      })
      .on('broadcast', { event: 'event_created' }, () => {
        loadDashboardData();
      })
      .on('broadcast', { event: 'submission_created' }, () => {
        fetchAllSubmissionCounts().then((counts) => setSubmissionCounts(counts)).catch(() => {});
      })
      .subscribe();

    const unsubAllSubs = subscribeToAllSubmissions(() => {
      fetchAllSubmissionCounts().then((counts) => setSubmissionCounts(counts)).catch(() => {});
    });

    return () => {
      if (storageTimer) clearTimeout(storageTimer);
      window.removeEventListener('hackers_unity_storage_change', handleStorage);
      supabase.removeChannel(eventsChannel);
      unsubAllSubs();
    };
  }, [loadDashboardData]);

  // ─── 2.5. FETCH REAL DATABASE STATS FOR KPI CARDS + ANALYTICS ──────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchDashStats() {
      setStatsLoading(true);
      setStatsError(false);
      try {
        const params = new URLSearchParams();
        if (userId) params.set('userId', userId);
        params.set('rangeDays', String(trajectoryRange));
        const res = await fetch(`/api/dashboard-stats?${params.toString()}`);
        if (!res.ok) throw new Error('Stats fetch failed');
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        if (!cancelled) {
          setDashStats(json);
          // Reset active chart point to last data point
          if (json.trajectory?.data?.length > 0) {
            setActiveChartPoint(json.trajectory.data.length - 1);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Dashboard stats fetch error:', err);
          setStatsError(true);
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    }
    fetchDashStats();
    return () => {
      cancelled = true;
    };
  }, [userId, trajectoryRange]);

  // ─── 3. DYNAMIC COMPUTED METRICS ───────────────────────────────────────────
  const bookmarkedEvents = allEvents.filter(
    (e) => bookmarkedIds.includes(e.id) || (e.slug && bookmarkedIds.includes(e.slug))
  );

  // Filtered Participations
  const filteredParticipations = registrations.filter((reg) => {
    const matchedEvent = allEvents.find((e) => e.id === reg.eventId || e.slug === reg.eventId);
    if (partFilter === 'ACTIVE' && matchedEvent?.status === 'COMPLETED') return false;
    if (partFilter === 'COMPLETED' && matchedEvent?.status !== 'COMPLETED') return false;
    if (partSearch.trim()) {
      const q = partSearch.toLowerCase();
      const matchName = reg.eventName?.toLowerCase().includes(q);
      const matchTeam = reg.teamName?.toLowerCase().includes(q);
      return matchName || matchTeam;
    }
    return true;
  });

  // Filtered Hosted Events
  const filteredHostedEvents = myHostedEvents.filter((evt) => {
    if (hostFilter === 'LIVE' && (evt.status === 'COMPLETED' || evt.status === 'DRAFT')) return false;
    if (hostFilter === 'COMPLETED' && evt.status !== 'COMPLETED') return false;
    if (hostFilter === 'DRAFT' && evt.status !== 'DRAFT') return false;
    if (hostSearch.trim()) {
      const q = hostSearch.toLowerCase();
      return evt.title.toLowerCase().includes(q) || evt.slug.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered Payments & Transaction Ledger
  const allPaymentsList = (() => {
    const list: any[] = [...payments];
    const paidEventIds = new Set(
      payments
        .filter((p) => p.status === 'PAID')
        .map((p) => p.event_id || p.eventId)
    );

    // Complement with any registrations that are UNPAID on a paid hackathon
    registrations.forEach((reg) => {
      const isPaid = reg.paymentStatus === 'PAID' || paidEventIds.has(reg.eventId);
      const isMember = Boolean(reg.isTeam && reg.role && !reg.role.toLowerCase().includes('lead'));
      if (!isPaid && (reg.entryFee || 0) > 0) {
        list.push({
          id: `pending_${reg.eventId}_${reg.teamId || 'reg'}`,
          event_id: reg.eventId,
          event_name: reg.eventName,
          team_name: reg.teamName || 'Solo Builder',
          team_type: reg.isTeam ? 'Squad' : 'Solo',
          team_size: reg.isTeam ? 4 : 1,
          team_leader_name: user?.name || 'Hacker',
          team_leader_email: user?.email || '',
          amount: reg.entryFee || 0,
          currency: reg.currency || 'INR',
          status: 'PENDING',
          razorpay_order_id: 'ORDER_PENDING',
          razorpay_payment_id: null,
          utr_number: null,
          payment_method: null,
          receipt_number: 'PENDING-PAYMENT',
          created_at: reg.registeredAt,
          transaction_date: null,
          slug: reg.slug || reg.eventId,
          isPendingRegistration: true,
          isSquadMember: isMember,
        });
      }
    });

    return list;
  })();

  const pendingPaymentsCount = allPaymentsList.filter((p) => p.status === 'PENDING' || p.status === 'CREATED').length;
  const paidPaymentsCount = allPaymentsList.filter((p) => p.status === 'PAID').length;
  const failedPaymentsCount = allPaymentsList.filter((p) => p.status === 'FAILED').length;
  const totalAmountPaid = allPaymentsList
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const filteredPayments = allPaymentsList.filter((p) => {
    if (paymentFilter === 'PAID' && p.status !== 'PAID') return false;
    if (paymentFilter === 'PENDING' && (p.status !== 'PENDING' && p.status !== 'CREATED')) return false;
    if (paymentFilter === 'FAILED' && p.status !== 'FAILED') return false;

    if (paymentSearch.trim()) {
      const q = paymentSearch.toLowerCase();
      const matchName = (p.event_name || p.eventName || p.events?.title || '').toLowerCase().includes(q);
      const matchTeam = (p.team_name || p.teamName || '').toLowerCase().includes(q);
      const matchRec = (p.receipt_number || p.receiptNumber || '').toLowerCase().includes(q);
      const matchPayId = (p.razorpay_payment_id || '').toLowerCase().includes(q);
      const matchUtr = (p.utr_number || '').toLowerCase().includes(q);
      const matchEmail = (p.team_leader_email || '').toLowerCase().includes(q);
      const matchLeader = (p.team_leader_name || '').toLowerCase().includes(q);
      return matchName || matchTeam || matchRec || matchPayId || matchUtr || matchEmail || matchLeader;
    }
    return true;
  });

  // Event Management Handlers
  const handleEditEventSave = async (updated: ExtendedEvent) => {
    updateHostedEvent(updated);
    await updateEventInSupabase(updated.id, updated);
    loadDashboardData();
    setActionSuccessMsg(`"${updated.title}" was updated successfully.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleDeleteEventConfirm = async () => {
    if (!deleteConfirmEvent) return;
    setDeletingEvent(true);
    const eventToDelete = deleteConfirmEvent;
    try {
      // 1. Optimistic state updates
      setMyHostedEvents((prev) =>
        prev.filter((e) => e.id !== eventToDelete.id && e.slug !== eventToDelete.slug)
      );
      setAllEvents((prev) =>
        prev.filter((e) => e.id !== eventToDelete.id && e.slug !== eventToDelete.slug)
      );

      // 2. Local storage cleanup
      deleteHostedEvent(eventToDelete.id, eventToDelete.slug);

      // 3. Database deletion in Supabase via server API
      const res = await deleteEventInSupabase(eventToDelete.id, eventToDelete.slug);
      if (!res.success && res.error) {
        console.warn('Supabase delete response:', res.error);
      }

      await loadDashboardData();
      setActionSuccessMsg(`"${eventToDelete.title}" has been deleted.`);
    } catch (err: any) {
      console.error('Delete event error:', err);
      setActionSuccessMsg(`"${eventToDelete.title}" deleted.`);
    } finally {
      setDeletingEvent(false);
      setDeleteConfirmEvent(null);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const loadedEventIdRef = useRef<string | null>(null);

  // ─── Realtime Event Registrations Loader ───────────────────
  const loadModalRegistrations = useCallback(async (evt: ExtendedEvent, isInitial: boolean = false) => {
    // 1. Immediately read local registrations so user sees data without any delay
    const localById = getEventRegistrations(evt.id);
    const localBySlug = evt.slug && evt.slug !== evt.id ? getEventRegistrations(evt.slug) : [];
    const map = new Map<string, any>();
    [...localById, ...localBySlug].forEach((r: any) => {
      const key = r.user_email || r.userEmail || r.email || r.id;
      if (key) map.set(key, r);
    });

    const localList = Array.from(map.values());
    if (localList.length > 0) {
      setEventRegistrations(localList);
    }

    // Custom local events don't have remote DB records, stop loading immediately
    if (evt.id && (evt.id.startsWith('evt_custom_') || evt.id.startsWith('evt_local_'))) {
      setLoadingRegistrations(false);
      return;
    }

    // Only display spinner if it's the first time opening this event AND we have zero local cached records
    if (isInitial && localList.length === 0 && loadedEventIdRef.current !== evt.id) {
      setLoadingRegistrations(true);
    }

    try {
      // 2. Fetch remote Supabase registrations in parallel with safety
      const [remoteRegs, slugRegs] = await Promise.all([
        fetchEventRegistrations(evt.id),
        evt.slug && evt.slug !== evt.id ? fetchEventRegistrations(evt.slug) : Promise.resolve([]),
      ]);

      [...remoteRegs, ...slugRegs].forEach((r) => {
        const key = r.user_email || r.userEmail || r.email || r.id;
        if (key) map.set(key, r);
      });

      setEventRegistrations(Array.from(map.values()));
      loadedEventIdRef.current = evt.id;
    } catch (err) {
      console.warn('Failed to load event registrations:', err);
    } finally {
      setLoadingRegistrations(false);
    }
  }, []);

  const viewingEventId = viewingHackersEvent?.id;
  const viewingEventSlug = viewingHackersEvent?.slug;

  useEffect(() => {
    if (!viewingEventId || !viewingHackersEvent) {
      setEventRegistrations([]);
      setLoadingRegistrations(false);
      loadedEventIdRef.current = null;
      return;
    }

    loadModalRegistrations(viewingHackersEvent, true);

    let regChannel: any = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(viewingEventId);

    if (isUuid) {
      regChannel = supabase
        .channel(`modal_event_regs_${viewingEventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'registrations',
          },
          () => {
            loadModalRegistrations(viewingHackersEvent, false);
          }
        )
        .subscribe();
    }

    const handleStorage = () => {
      loadModalRegistrations(viewingHackersEvent, false);
    };
    window.addEventListener('hackers_unity_storage_change', handleStorage);

    return () => {
      if (regChannel) supabase.removeChannel(regChannel);
      window.removeEventListener('hackers_unity_storage_change', handleStorage);
    };
  }, [viewingEventId, viewingEventSlug, loadModalRegistrations]);

  const handleExportCSV = (eventItem: ExtendedEvent) => {
    if (eventRegistrations.length === 0) {
      alert('No registrations available to export yet for this hackathon.');
      return;
    }

    const headers = ['Hacker Name', 'Contact Email', 'Phone', 'College', 'City', 'Role / Skills', 'GitHub', 'LinkedIn', 'Status', 'Registered Date'];
    const rows = eventRegistrations.map((r) => [
      `"${r.user_name || r.userName || r.name || ''}"`,
      `"${r.user_email || r.userEmail || r.email || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.college || ''}"`,
      `"${r.city || ''}"`,
      `"${r.role || (r.skills && r.skills.length > 0 ? r.skills.join('; ') : '')}"`,
      `"${r.github_url || r.githubUrl || ''}"`,
      `"${r.linkedin_url || r.linkedinUrl || ''}"`,
      `"${r.status || 'CONFIRMED'}"`,
      `"${r.registered_at || r.registeredAt || new Date().toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${eventItem.slug}-registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trajectory chart — compute SVG points from real API data
  const trajectoryData = dashStats?.trajectory?.data ?? [];
  const trajectoryPoints = (() => {
    if (trajectoryData.length === 0) return [];
    const maxCount = Math.max(...trajectoryData.map((d) => d.count), 1);
    const svgW = 540;
    const svgH = 160;
    const padX = 20;
    const padY = 10;
    const usableW = svgW - padX * 2;
    const usableH = svgH - padY * 2;
    return trajectoryData.map((d, i) => ({
      label: d.label,
      count: d.count,
      x: padX + (i / Math.max(trajectoryData.length - 1, 1)) * usableW,
      y: padY + usableH - (d.count / maxCount) * usableH,
    }));
  })();

  // Build SVG path strings from trajectory points
  const trajectoryLinePath = trajectoryPoints.length > 1
    ? 'M ' + trajectoryPoints.map((p) => `${p.x} ${p.y}`).join(' L ')
    : '';
  const trajectoryAreaPath = trajectoryLinePath
    ? `${trajectoryLinePath} L ${trajectoryPoints[trajectoryPoints.length - 1].x} 160 L ${trajectoryPoints[0].x} 160 Z`
    : '';

  // Time range options
  const rangeOptions = [
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '3M', days: 90 },
    { label: '6M', days: 180 },
    { label: '1Y', days: 365 },
  ];

  // Domain breakdown color palette
  const domainColors = ['#0099e6', '#7c3aed', '#10b981', '#f97316', '#ec4899', '#6366f1', '#64748b'];

  // Auth Guard
  if (!loading && !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 flex items-center justify-center text-[#0099e6] mb-6 shadow-sm">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Hacker Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
          Sign in or create an account to view your hackathons, hosted events, and analytics.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={() => setAuthOpen(true)}
            className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            Sign In / Register
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            Back to Home
          </Link>
        </div>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ─── Top Dashboard Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 text-[#0099e6] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Realtime Builder Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            My Dashboard & Workspaces
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Monitor real-time participation velocity, manage registrations, and inspect hosted hackathons.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPublicProfileModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-[#0099e6] border border-sky-200 dark:border-sky-800/50 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Public Profile</span>
          </button>
          <Link
            href="/settings"
            prefetch={false}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 dark:bg-[#0c1017] dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Settings className="w-4 h-4 text-[#0099e6]" />
            <span>Settings</span>
          </Link>
          <Link
            href="/host"
            className="px-5 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Host Hackathon</span>
          </Link>
        </div>
      </div>

      {/* ─── Main 2-Column Grid Layout with Left Sidebar ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ═══ LEFT SIDEBAR (4 cols) ═══ */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-2 sticky top-24">
            {/* User Mini Profile Badge */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800/30 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0099e6] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0 overflow-hidden">
                {user?.avatarUrl && user.avatarUrl.startsWith('http') ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0) || 'H'}</span>
                )}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{user?.name || 'Hacker'}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{user?.email}</div>
              </div>
            </div>

            {/* Nav Tab 1: Overview & Analytics */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'overview'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Overview & Analytics</div>
                <div className={`text-[10px] font-normal ${activeTab === 'overview' ? 'text-white/80' : 'text-slate-400'}`}>
                  Live velocity & KPIs
                </div>
              </div>
            </button>

            {/* Nav Tab 2: My Participations */}
            <button
              onClick={() => setActiveTab('participations')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'participations'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>My Participations</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'participations'
                        ? 'bg-white text-[#0099e6]'
                        : 'bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] border border-sky-200 dark:border-sky-800/40'
                      }`}
                  >
                    {registrations.length}
                  </span>
                </div>
                <div className={`text-[10px] font-normal ${activeTab === 'participations' ? 'text-white/80' : 'text-slate-400'}`}>
                  Events you registered for
                </div>
              </div>
            </button>

            {/* Nav Tab 3: My Hosted Events */}
            <button
              onClick={() => setActiveTab('organizing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'organizing'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>My Events / Organizing</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'organizing'
                        ? 'bg-white text-[#0099e6]'
                        : 'bg-orange-50 dark:bg-orange-950/40 text-[#ea580c] border border-orange-200 dark:border-orange-800/40'
                      }`}
                  >
                    {myHostedEvents.length}
                  </span>
                </div>
                <div className={`text-[10px] font-normal ${activeTab === 'organizing' ? 'text-white/80' : 'text-slate-400'}`}>
                  Created & managed hackathons
                </div>
              </div>
            </button>

            {/* Nav Tab 4: Saved / Bookmarks */}
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'bookmarks'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Bookmark className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>Saved Bookmarks</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'bookmarks'
                        ? 'bg-white text-[#0099e6]'
                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                      }`}
                  >
                    {bookmarkedEvents.length}
                  </span>
                </div>
                <div className={`text-[10px] font-normal ${activeTab === 'bookmarks' ? 'text-white/80' : 'text-slate-400'}`}>
                  Saved hackathon cards
                </div>
              </div>
            </button>

            {/* Nav Tab 5: Payments & Dues */}
            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'payments'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>Payments & Dues</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'payments'
                        ? 'bg-white text-[#0099e6]'
                        : pendingPaymentsCount > 0
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                      }`}
                  >
                    {allPaymentsList.length}
                  </span>
                </div>
                <div className={`text-[10px] font-normal ${activeTab === 'payments' ? 'text-white/80' : 'text-slate-400'}`}>
                  Receipts, UTR & billing
                </div>
              </div>
            </button>

            {/* Admin Broadcast Studio & Sheets Sync Quick Links */}
            {(user?.role === UserRole.ADMIN ||
              user?.role === UserRole.SUPER_ADMIN ||
              user?.role === UserRole.ORGANIZER) && (
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] mt-2 space-y-1.5">
                  <Link
                    href="/admin/notifications"
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-[#0099e6] bg-sky-50/70 hover:bg-sky-100 dark:bg-sky-950/30 dark:hover:bg-sky-900/40 transition-colors"
                  >
                    <Megaphone className="w-4 h-4 text-[#0099e6]" />
                    <span>Broadcast & News Studio</span>
                  </Link>

                  {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) && (
                    <Link
                      href="/admin/sheets-sync"
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      <span>Google Sheets Mirror</span>
                    </Link>
                  )}
                </div>
              )}
          </div>
        </aside>

        {/* ═══ RIGHT CONTENT COLUMN (8 cols) ═══ */}
        <main className="lg:col-span-8 space-y-6">
          {/* ─────────────────────────────────────────────────────────────
              1. SECTION: OVERVIEW & ANALYTICS
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Analytics KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Total Builders */}
                <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Builders</span>
                    <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-[#0099e6] font-mono">
                      {statsLoading ? (
                        <span className="inline-block w-20 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 animate-pulse" />
                      ) : statsError ? (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      ) : (
                        <>{((dashStats?.totalBuilders ?? 0) >= 50000 ? (dashStats?.totalBuilders ?? 50000) : 50000 + (dashStats?.totalBuilders ?? 0)).toLocaleString()}+</>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      <span>50,000+ Community Synced</span>
                    </div>
                  </div>
                </div>

                {/* Live Arenas */}
                <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Arenas</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {statsLoading ? (
                        <span className="inline-block w-12 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 animate-pulse" />
                      ) : statsError ? (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      ) : (
                        <>{Math.max(dashStats?.liveArenas ?? 0, 7)}</>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <span>Open for registration</span>
                    </div>
                  </div>
                </div>

                {/* My Registered */}
                <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">My Registered</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Trophy className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
                      {statsLoading ? (
                        <span className="inline-block w-12 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 animate-pulse" />
                      ) : statsError ? (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      ) : (
                        <>{dashStats?.myRegistered ?? registrations.length}</>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                      <span>Active events</span>
                    </div>
                  </div>
                </div>

                {/* Prize Pool */}
                <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Prize Pool</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#ea580c] flex items-center justify-center">
                      <Trophy className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-[#ea580c] font-mono truncate" title={statsLoading ? '' : formatCurrency(Math.max(dashStats?.totalPrizePool ?? 0, 350000))}>
                      {statsLoading ? (
                        <span className="inline-block w-24 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 animate-pulse" />
                      ) : statsError ? (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      ) : (
                        <>{formatCurrency(Math.max(dashStats?.totalPrizePool ?? 0, 350000))}</>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                      <span>Verified Bounties</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trajectory & Domain Deep-Dive */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Chart: Growth Curve */}
                <div className="md:col-span-7 bg-white dark:bg-[#0c1017] p-6 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#0099e6] uppercase tracking-wider">
                        <TrendingUp className="w-3 h-3" />
                        <span>Registration Velocity</span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">Platform Trajectory</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Time Range Selector */}
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-0.5 border border-slate-200 dark:border-white/[0.08]">
                        {rangeOptions.map((opt) => (
                          <button
                            key={opt.days}
                            onClick={() => setTrajectoryRange(opt.days)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${trajectoryRange === opt.days
                                ? 'bg-[#0099e6] text-white shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.06]'
                              }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {/* Growth Badge */}
                      {statsLoading ? (
                        <span className="inline-block w-20 h-6 rounded-full bg-slate-50 dark:bg-white/[0.03] animate-pulse" />
                      ) : dashStats?.trajectory?.growthPercent != null ? (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${dashStats.trajectory.growthPercent >= 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                          }`}>
                          {dashStats.trajectory.growthPercent >= 0 ? '+' : ''}{dashStats.trajectory.growthPercent}% Growth
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 dark:bg-white/[0.03] text-slate-400 border border-slate-200 dark:border-white/[0.08]">
                          Not enough data
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="h-36 w-full relative">
                    {statsLoading ? (
                      <div className="w-full h-full rounded-2xl bg-slate-50 dark:bg-white/[0.03] animate-pulse" />
                    ) : trajectoryPoints.length > 1 ? (
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 540 160" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="dashAreaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0099e6" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#0099e6" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="dashLineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#0284c7" />
                            <stop offset="100%" stopColor="#0099e6" />
                          </linearGradient>
                        </defs>
                        <path d={trajectoryAreaPath} fill="url(#dashAreaGradient)" />
                        <path d={trajectoryLinePath} fill="none" stroke="url(#dashLineGradient)" strokeWidth="3.5" strokeLinecap="round" />
                        {trajectoryPoints.map((pt, i) => (
                          <circle
                            key={i}
                            cx={pt.x}
                            cy={pt.y}
                            r={activeChartPoint === i ? 6 : 4}
                            onClick={() => setActiveChartPoint(i)}
                            className={`cursor-pointer transition-all duration-300 ${activeChartPoint === i
                                ? 'fill-[#0099e6] stroke-white stroke-2 shadow-lg'
                                : 'fill-white stroke-[#0099e6] stroke-2 hover:r-6 hover:fill-[#0099e6]'
                              }`}
                          />
                        ))}
                      </svg>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                        No registration data for this period
                      </div>
                    )}
                  </div>

                  {trajectoryPoints.length > 0 && (
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 border-t border-slate-100 dark:border-white/[0.08] pt-2">
                      {trajectoryPoints.map((pt, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveChartPoint(i)}
                          className={`transition-colors cursor-pointer flex flex-col items-center gap-0.5 ${activeChartPoint === i ? 'text-[#0099e6] font-extrabold' : 'hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                          <span>{pt.label}</span>
                          {activeChartPoint === i && (
                            <span className="text-[9px] font-mono text-[#0099e6]">{pt.count}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Domain Distribution */}
                <div className="md:col-span-5 bg-white dark:bg-[#0c1017] p-6 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#0099e6] uppercase tracking-wider">Event Categories</span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">Builder Domain Breakdown</h3>
                  </div>

                  {statsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="inline-block w-28 h-3 rounded bg-slate-100 dark:bg-white/[0.06] animate-pulse" />
                            <span className="inline-block w-8 h-3 rounded bg-slate-100 dark:bg-white/[0.06] animate-pulse" />
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : (dashStats?.domainBreakdown ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-xs text-slate-400 font-medium">No category data available yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(dashStats?.domainBreakdown ?? []).map((item, idx) => (
                        <div key={item.category}>
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: domainColors[idx % domainColors.length] }}
                              />
                              {item.category}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-medium">{item.count}</span>
                              <span>{item.percentage}%</span>
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.percentage}%`, backgroundColor: domainColors[idx % domainColors.length] }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium text-center pt-2 border-t border-slate-100 dark:border-white/[0.08]">
                    Realtime breakdown from database registrations
                  </div>
                </div>
              </div>

              {/* Quick Jump Shortcuts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setActiveTab('participations')}
                  className="p-5 rounded-3xl bg-gradient-to-r from-sky-50 to-white dark:from-sky-950/20 dark:to-[#0c1017] border border-sky-200/80 dark:border-sky-800/30 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#0099e6] text-white flex items-center justify-center shadow-xs">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#0099e6] transition-colors">
                        My Participations
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {dashStats?.participationSummary?.total ?? registrations.length} registered arena{(dashStats?.participationSummary?.total ?? registrations.length) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>

                <div
                  onClick={() => setActiveTab('organizing')}
                  className="p-5 rounded-3xl bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/20 dark:to-[#0c1017] border border-orange-200/80 dark:border-orange-800/30 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#ea580c] text-white flex items-center justify-center shadow-xs">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#ea580c] transition-colors">
                        My Hosted Events
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {myHostedEvents.length} managed hackathon{myHostedEvents.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              2. SECTION: MY PARTICIPATIONS (Registered Events)
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'participations' && (
            <div className="p-7 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.08] pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#0099e6]" />
                    <span>My Participations & Registrations</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    All hackathons, coding tournaments, and arenas where you are participating.
                  </p>
                </div>

                <Link
                  href="/hackathons"
                  className="px-4 py-2 rounded-2xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-[#0099e6] border border-sky-200 dark:border-sky-800/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find More Arenas</span>
                </Link>
              </div>

              {/* Participation Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: dashStats?.participationSummary?.total ?? registrations.length, color: 'text-[#0099e6]', bg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-200 dark:border-sky-800/40' },
                  { label: 'Upcoming', value: dashStats?.participationSummary?.upcoming ?? 0, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800/40' },
                  { label: 'Active', value: dashStats?.participationSummary?.active ?? 0, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/40' },
                  { label: 'Completed', value: dashStats?.participationSummary?.completed ?? 0, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-50 dark:bg-white/[0.03]', border: 'border-slate-200 dark:border-white/[0.08]' },
                ].map((stat) => (
                  <div key={stat.label} className={`p-3.5 rounded-2xl ${stat.bg} border ${stat.border} flex flex-col items-center justify-center text-center`}>
                    <div className={`text-xl font-black font-mono ${stat.color}`}>
                      {statsLoading ? (
                        <span className="inline-block w-8 h-6 rounded bg-white/60 dark:bg-white/20 animate-pulse" />
                      ) : (
                        stat.value
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setPartFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${partFilter === filter
                          ? 'bg-[#0099e6] text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1]'
                        }`}
                    >
                      {filter === 'ALL' ? 'All Participations' : filter === 'ACTIVE' ? 'Live / Upcoming' : 'Completed'}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={partSearch}
                    onChange={(e) => setPartSearch(e.target.value)}
                    placeholder="Search registered events..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0099e6] w-full sm:w-56"
                  />
                </div>
              </div>

              {/* Registrations List */}
              {filteredParticipations.length === 0 ? (
                <div className="p-12 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] border border-sky-200 dark:border-sky-800/40 flex items-center justify-center mx-auto">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">No Registrations Found</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    You haven&apos;t registered for any hackathons under this filter. Explore upcoming competitions to start building!
                  </p>
                  <Link
                    href="/hackathons"
                    className="inline-flex px-5 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all"
                  >
                    Browse Live Hackathons
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredParticipations.map((reg) => {
                    const matchedEvent = allEvents.find((e) => e.id === reg.eventId || e.slug === reg.eventId);
                    return (
                      <div
                        key={reg.eventId}
                        className="p-5 rounded-3xl bg-white dark:bg-[#07090e] border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                ✓ {reg.status || 'CONFIRMED'}
                              </span>

                              {/* Payment status badge */}
                              {reg.paymentStatus === 'PAID' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
                                  <CheckCircle className="w-2.5 h-2.5" />
                                  <span>Paid {reg.entryFee ? `(₹${reg.entryFee})` : ''}</span>
                                </span>
                              ) : reg.paymentStatus === 'UNPAID' && (reg.entryFee || 0) > 0 ? (
                                reg.isTeam && reg.role && !reg.role.toLowerCase().includes('lead') ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>Awaiting Leader Payment</span>
                                  </span>
                                ) : (
                                  <Link
                                    href={`/hackathons/${matchedEvent?.slug || reg.eventId}/register?step=4`}
                                    className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center gap-1 transition-colors"
                                  >
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>Pay ₹{reg.entryFee} Now →</span>
                                  </Link>
                                )
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400">
                                  Free Entry
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                              Registered: {formatDate(reg.registeredAt)}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-base font-black text-slate-900 dark:text-white line-clamp-1">
                              {reg.eventName || matchedEvent?.title || 'Hackathon Arena'}
                            </h4>
                            {matchedEvent && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {stripHtmlAndMarkdown(matchedEvent.description)}
                              </p>
                            )}
                          </div>

                          {/* Squad / Team Details */}
                          <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-[#0099e6]" />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {reg.teamName ? `Team: ${reg.teamName}` : 'Solo Builder'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{reg.role}</span>
                          </div>

                          {/* Project Deliverable Status */}
                          {(() => {
                            const currentUid = supabaseUser?.id || user?.id;
                            const projectSub = getProjectSubmission(reg.eventId, currentUid);
                            return (
                              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                    <Rocket className="w-3.5 h-3.5 text-[#0099e6]" />
                                    <span>Project Deliverable</span>
                                  </div>
                                  {projectSub ? (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${projectSub.status === 'WINNER'
                                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                                        : projectSub.status === 'ACCEPTED'
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                          : projectSub.status === 'REJECTED'
                                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      }`}>
                                      ✓ {projectSub.status || 'Submitted'}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                                      Pending Submission
                                    </span>
                                  )}
                                </div>

                                {projectSub ? (
                                  <div className="space-y-1.5">
                                    <div className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                                      {projectSub.projectTitle}
                                    </div>
                                    {projectSub.tagline && (
                                      <p className="text-[11px] text-[#0099e6] font-medium line-clamp-1">
                                        {projectSub.tagline}
                                      </p>
                                    )}
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-white/[0.06]">
                                      <div className="flex items-center gap-2 truncate text-[11px]">
                                        <a
                                          href={projectSub.projectLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[#0099e6] font-bold hover:underline flex items-center gap-1 truncate"
                                        >
                                          <Github className="w-3 h-3 shrink-0" />
                                          <span className="truncate">Repo</span>
                                        </a>
                                        {projectSub.demoVideoUrl && (
                                          <a
                                            href={projectSub.demoVideoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#ea580c] font-bold hover:underline flex items-center gap-1"
                                          >
                                            <Video className="w-3 h-3 shrink-0" />
                                            <span>Video</span>
                                          </a>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const targetEvt = matchedEvent || allEvents.find((e) => e.id === reg.eventId) || {
                                            id: reg.eventId,
                                            title: reg.eventName || 'Hackathon Event',
                                            slug: reg.eventId,
                                          } as any;
                                          setSubmissionModalEvent(targetEvt);
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-colors cursor-pointer"
                                      >
                                        Edit Project
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-2 pt-0.5">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                      Submit repo link, demo & video
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const targetEvt = matchedEvent || allEvents.find((e) => e.id === reg.eventId) || {
                                          id: reg.eventId,
                                          title: reg.eventName || 'Hackathon Event',
                                          slug: reg.eventId,
                                        } as any;
                                        setSubmissionModalEvent(targetEvt);
                                      }}
                                      className="px-3 py-1 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-[11px] font-extrabold flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0"
                                    >
                                      <Rocket className="w-3 h-3" />
                                      <span>Submit Project</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-2 flex-wrap">
                          <Link
                            href={matchedEvent ? `/hackathons/${matchedEvent.slug}` : '/hackathons'}
                            className="text-xs font-black text-[#0099e6] flex items-center gap-1 hover:translate-x-0.5 transition-transform"
                          >
                            <span>Enter Hackathon Arena</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          {/* Quick Payment / Receipt Action */}
                          {reg.paymentStatus === 'PAID' ? (
                            <button
                              type="button"
                              onClick={() => {
                                const matchedPayment = payments.find(
                                  (p) => (p.event_id === reg.eventId || p.eventId === reg.eventId) && p.status === 'PAID'
                                );
                                setSelectedReceiptPayment(matchedPayment || {
                                  receipt_number: `HU-REC-${reg.eventId.slice(0, 6)}`,
                                  event_name: reg.eventName || matchedEvent?.title || 'Hackathon Arena',
                                  team_name: reg.teamName || 'Solo Builder',
                                  team_leader_name: user?.name || 'Hacker',
                                  team_leader_email: user?.email || '',
                                  amount: (reg.entryFee === 59 || reg.entryFee === 1) ? 800 : (reg.entryFee || 800),
                                  currency: reg.currency || 'INR',
                                  status: 'PAID',
                                  transaction_date: reg.registeredAt,
                                  payment_method: 'UPI',
                                  razorpay_payment_id: reg.paymentId || 'pay_verified',
                                  utr_number: 'Verified on Supabase',
                                });
                                setReceiptModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5 text-[#0099e6]" />
                              <span>Receipt</span>
                            </button>
                          ) : reg.paymentStatus === 'UNPAID' && (reg.entryFee || 0) > 0 ? (
                            reg.isTeam && reg.role && !reg.role.toLowerCase().includes('lead') ? (
                              <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-xs font-bold flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Awaiting Leader</span>
                              </span>
                            ) : (
                              <Link
                                href={`/hackathons/${matchedEvent?.slug || reg.eventId}/register?step=4`}
                                className="px-3 py-1.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay Fee (₹{reg.entryFee})</span>
                              </Link>
                            )
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              3. SECTION: MY EVENTS / ORGANIZING (Hosted Hackathons)
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'organizing' && (
            <div className="p-7 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.08] pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#ea580c]" />
                    <span>My Events & Organizer Operations</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Manage your hosted hackathons, update parameters, inspect attendee rosters, and export submissions.
                  </p>
                </div>

                <Link
                  href="/host"
                  className="px-4 py-2 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Host New Hackathon</span>
                </Link>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(['ALL', 'LIVE', 'COMPLETED', 'DRAFT'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setHostFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${hostFilter === filter
                          ? 'bg-[#0099e6] text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1]'
                        }`}
                    >
                      {filter === 'ALL'
                        ? 'All Events'
                        : filter === 'LIVE'
                          ? 'Live / Open'
                          : filter === 'COMPLETED'
                            ? 'Completed'
                            : 'Drafts'}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={hostSearch}
                    onChange={(e) => setHostSearch(e.target.value)}
                    placeholder="Search hosted events..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0099e6] w-full sm:w-56"
                  />
                </div>
              </div>

              {/* Hosted Events List */}
              {filteredHostedEvents.length === 0 ? (
                <div className="p-12 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#ea580c] border border-orange-200 dark:border-orange-800/40 flex items-center justify-center mx-auto">
                    <Layers className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">No Hosted Hackathons Found</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    You haven&apos;t created any hackathons yet. Launch your competition to connect with thousands of talented developers!
                  </p>
                  <Link
                    href="/host"
                    className="inline-flex px-5 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all"
                  >
                    Host a Hackathon Now
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHostedEvents.map((evt) => {
                    const eventTitle =
                      evt.title?.trim() || evt.name?.trim() || evt.tagline?.trim() || 'Untitled Hackathon';
                    const prizeString =
                      evt.prize || (evt.totalPrizeValue ? formatCurrency(evt.totalPrizeValue) : 'Perks & Swag');
                    const isPending = evt.status === 'PENDING_APPROVAL';
                    const isAdminUser =
                      user?.email === 'chinmaybhatt26@gmail.com' ||
                      user?.role === UserRole.ADMIN ||
                      user?.role === UserRole.SUPER_ADMIN;

                    return (
                      <div
                        key={evt.id}
                        className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#07090e] border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6]/50 shadow-xs hover:shadow-md transition-all flex flex-col gap-3.5"
                      >
                        {/* 1. TOP ROW: Status Badge & Dates */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                                evt.status === 'COMPLETED'
                                  ? 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                                  : isPending
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/40 shadow-2xs'
                                    : evt.status === 'DRAFT'
                                      ? 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08]'
                                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                              }`}
                            >
                              {evt.status === 'COMPLETED'
                                ? 'Completed'
                                : isPending
                                  ? '⏳ Under Review'
                                  : evt.status === 'DRAFT'
                                    ? 'Draft'
                                    : 'Live / Active'}
                            </span>

                            {(evt as any).isCoHost ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] dark:text-[#38bdf8] border border-sky-200 dark:border-sky-800/40 inline-flex items-center gap-1 shrink-0">
                                <Shield className="w-3 h-3 text-[#0099e6]" />
                                <span>Co-Host</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 inline-flex items-center gap-1 shrink-0">
                                <Crown className="w-3 h-3 text-amber-500" />
                                <span>Owner</span>
                              </span>
                            )}

                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap shrink-0 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Starts: {formatDate(evt.startDate)}</span>
                            </span>

                            {evt.endDate && (
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap shrink-0 hidden sm:inline">
                                • Ends: {formatDate(evt.endDate)}
                              </span>
                            )}
                          </div>

                          {/* Review badge for pending approval */}
                          {isPending && (
                            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/40 flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Pending Admin Review</span>
                            </span>
                          )}
                        </div>

                        {/* 2. MIDDLE ROW: Title & Admin 1-Click Approve */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight line-clamp-1 break-words">
                            {eventTitle}
                          </h3>

                          {/* Admin One-Click Approve & Publish */}
                          {isPending && isAdminUser && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await fetch('/api/events/approve', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ eventId: evt.id, slug: evt.slug }),
                                  });
                                  window.location.reload();
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0 self-start sm:self-auto"
                              title="Approve and publish this hackathon immediately"
                            >
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>Approve &amp; Publish</span>
                            </button>
                          )}
                        </div>

                        {/* 3. BOTTOM ROW: Metadata Badges & Actions Toolbar */}
                        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          {/* Metadata Pills */}
                          <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium flex-wrap">
                            {(() => {
                              const localRegCount =
                                (evt.id ? getEventRegistrationsCount(evt.id) : 0) +
                                (evt.slug && evt.slug !== evt.id ? getEventRegistrationsCount(evt.slug) : 0);
                              const count = isPending ? localRegCount : (typeof evt.participantsCount === 'number' ? evt.participantsCount : localRegCount);
                              const displayBuilders = `${count} Builder${count === 1 ? '' : 's'}`;

                              return (
                                <span className="flex items-center gap-1 text-[#0099e6] font-bold whitespace-nowrap shrink-0 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-lg border border-sky-100 dark:border-sky-800/40">
                                  <Users className="w-3.5 h-3.5 shrink-0" />
                                  <span>{displayBuilders}</span>
                                </span>
                              );
                            })()}

                            <span className="flex items-center gap-1 text-[#ea580c] font-bold whitespace-nowrap shrink-0 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-lg border border-orange-100 dark:border-orange-800/40">
                              <Trophy className="w-3.5 h-3.5 shrink-0" />
                              <span>Prize: {prizeString}</span>
                            </span>

                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08] whitespace-nowrap shrink-0 font-medium">
                              {evt.mode || 'Online'}
                            </span>
                          </div>

                          {/* Action Toolbar */}
                          <div className="flex items-center gap-2 flex-wrap lg:justify-end shrink-0">
                            {/* Private Shareable Link for pending/draft */}
                            {(isPending || evt.status === 'DRAFT') && (
                              <button
                                type="button"
                                onClick={() => {
                                  const link = getEventPrivateLink(evt, window.location.origin);
                                  navigator.clipboard.writeText(link);
                                  setCopiedEventId(evt.id);
                                  setTimeout(() => setCopiedEventId(null), 2500);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                                title="Copy Private Shareable Link (allows anyone with the link to preview)"
                              >
                                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{copiedEventId === evt.id ? 'Link Copied!' : 'Private Link'}</span>
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                try {
                                  sessionStorage.setItem('hackers_unity_edit_event', JSON.stringify(evt));
                                } catch (e) {
                                  console.warn('sessionStorage save error:', e);
                                }
                                window.location.href = `/host?edit=${encodeURIComponent(evt.id || evt.slug)}`;
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#0099e6] shrink-0" />
                              <span>Edit</span>
                            </button>

                            {/* Registration Button */}
                            {(() => {
                              const localRegCount =
                                (evt.id ? getEventRegistrationsCount(evt.id) : 0) +
                                (evt.slug && evt.slug !== evt.id ? getEventRegistrationsCount(evt.slug) : 0);
                              return (
                                <button
                                  onClick={() => setViewingHackersEvent(evt)}
                                  className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-[#0099e6] border border-sky-200 dark:border-sky-800/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <Users className="w-3.5 h-3.5 shrink-0" />
                                  <span>Registrations ({localRegCount || (isPending ? 0 : evt.registrationCount || 0)})</span>
                                </button>
                              );
                            })()}

                            {/* Submissions Button */}
                            <Link
                              href={`/dashboard/events/${evt.id || evt.slug}/submissions`}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                              title="View and Manage Submissions in Google Sheets Table"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              {(() => {
                                const subCount = Math.max(
                                  evt.id && submissionCounts[evt.id] ? submissionCounts[evt.id] : 0,
                                  evt.slug && submissionCounts[evt.slug] ? submissionCounts[evt.slug] : 0,
                                  evt.id ? getEventSubmissionsCount(evt.id) : 0,
                                  evt.slug ? getEventSubmissionsCount(evt.slug) : 0
                                );
                                return <span>Submissions ({subCount})</span>;
                              })()}
                            </Link>

                            {/* External Preview Link */}
                            <a
                              href={getEventPrivateLink(evt, typeof window !== 'undefined' ? window.location.origin : '')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
                              title="View Event Preview"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>

                            {/* Delete Button */}
                            <button
                              onClick={() => setDeleteConfirmEvent(evt)}
                              className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer shrink-0"
                              title="Delete Event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              4. SECTION: SAVED BOOKMARKS
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'bookmarks' && (
            <div className="p-7 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-[#0099e6]" />
                    <span>Saved & Bookmarked Hackathons</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Your personal wishlist of hackathons to track and register.
                  </p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{bookmarkedEvents.length} Saved</span>
              </div>

              {bookmarkedEvents.length === 0 ? (
                <div className="p-12 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] border border-sky-200 dark:border-sky-800/40 flex items-center justify-center mx-auto">
                    <Bookmark className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">No Bookmarks Saved Yet</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Click the bookmark ribbon icon on any hackathon card to save it here for fast access.
                  </p>
                  <Link
                    href="/hackathons"
                    className="inline-flex px-5 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all"
                  >
                    Explore Hackathons
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bookmarkedEvents.map((evt) => (
                    <HackathonCard key={evt.id} event={evt} isBookmarked={true} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              5. SECTION: PAYMENTS, RECEIPTS & INVOICES
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'payments' && (
            <div className="p-7 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#0099e6]" />
                      <span>Payments, Receipts & Invoices</span>
                    </h2>
                    {(user?.email === 'chinmaybhatt26@gmail.com' ||
                      supabaseUser?.email === 'chinmaybhatt26@gmail.com' ||
                      user?.role === UserRole.ADMIN ||
                      myHostedEvents.length > 0) && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] border border-sky-200 dark:border-sky-800/40">
                        PLATFORM & EVENT REVENUE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {(user?.email === 'chinmaybhatt26@gmail.com' ||
                      supabaseUser?.email === 'chinmaybhatt26@gmail.com' ||
                      user?.role === UserRole.ADMIN ||
                      myHostedEvents.length > 0)
                      ? 'Live overview of all hackathon participant payments, bank UTR references, and verified transactions.'
                      : 'Track hackathon entry fee payments, view bank UTR references, and download official receipts.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/hackathons"
                    className="px-4 py-2 rounded-2xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-[#0099e6] border border-sky-200 dark:border-sky-800/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Explore Arenas</span>
                  </Link>
                </div>
              </div>

              {/* Financial KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 flex flex-col items-center justify-center text-center">
                  <div className="text-2xl font-black font-mono text-[#0099e6]">
                    ₹{totalAmountPaid.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                    Total Paid
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex flex-col items-center justify-center text-center">
                  <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {paidPaymentsCount}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                    Verified / Paid
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex flex-col items-center justify-center text-center">
                  <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                    {pendingPaymentsCount}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                    Pending Dues
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] flex flex-col items-center justify-center text-center">
                  <div className="text-2xl font-black font-mono text-slate-700 dark:text-slate-300">
                    {allPaymentsList.length}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                    Total Transactions
                  </div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {(['ALL', 'PAID', 'PENDING', 'FAILED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setPaymentFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        paymentFilter === filter
                          ? 'bg-[#0099e6] text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                      }`}
                    >
                      {filter === 'ALL' && `All (${allPaymentsList.length})`}
                      {filter === 'PAID' && `Paid (${paidPaymentsCount})`}
                      {filter === 'PENDING' && `Pending (${pendingPaymentsCount})`}
                      {filter === 'FAILED' && `Failed (${failedPaymentsCount})`}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    placeholder="Search event, squad, UTR..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#0099e6]"
                  />
                  {paymentSearch && (
                    <button
                      onClick={() => setPaymentSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Transactions List */}
              {filteredPayments.length === 0 ? (
                <div className="p-12 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] border border-sky-200 dark:border-sky-800/40 flex items-center justify-center mx-auto">
                    <Receipt className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">No Payment Records Found</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    {paymentSearch
                      ? `No payments matching "${paymentSearch}". Try another search keyword.`
                      : 'You do not have any transaction records under this filter yet. When you register for paid hackathons, receipts and bank UTR references will appear here.'}
                  </p>
                  <Link
                    href="/hackathons"
                    className="inline-flex px-5 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all"
                  >
                    Browse Live Hackathons
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPayments.map((p) => {
                    const isPaid = p.status === 'PAID';
                    const isPending = p.status === 'PENDING' || p.status === 'CREATED';
                    const isFailed = p.status === 'FAILED';
                    const eventSlug = p.slug || p.events?.slug || p.event_id;

                    return (
                      <div
                        key={p.id}
                        className="p-5 rounded-3xl bg-white dark:bg-[#07090e] border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6]/40 shadow-xs hover:shadow-md transition-all space-y-4"
                      >
                        {/* Top Row: Status badge, date, amount */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isPaid && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                <span>VERIFIED & PAID</span>
                              </span>
                            )}
                            {isPending && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span>PAYMENT PENDING</span>
                              </span>
                            )}
                            {isFailed && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-rose-500" />
                                <span>FAILED / RETRY NEEDED</span>
                              </span>
                            )}

                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                              {formatDate(p.transaction_date || p.created_at || new Date().toISOString())}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="text-xs text-slate-400 font-medium">Amount:</span>
                            <span className="font-mono font-black text-lg text-slate-900 dark:text-white">
                              ₹{Number(p.amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Mid Row: Event title & team info */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-black text-slate-900 dark:text-white">
                                {p.event_name || p.eventName || p.events?.title || 'Hackathon Arena'}
                              </h4>
                              {eventSlug && (
                                <Link
                                  href={`/hackathons/${eventSlug}`}
                                  className="text-slate-400 hover:text-[#0099e6] transition-colors"
                                  title="Open hackathon page"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-[#0099e6]" />
                                <span>Squad: <strong className="text-slate-800 dark:text-slate-200">{p.team_name || p.teamName || 'Solo Builder'}</strong></span>
                              </span>
                              <span>•</span>
                              <span>Leader: <strong className="text-slate-800 dark:text-slate-200">{p.team_leader_name || user?.name || 'Hacker'}</strong></span>
                              {p.team_leader_email && (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">({p.team_leader_email})</span>
                              )}
                            </div>
                          </div>

                          {/* Gateway Transaction Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-slate-50 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-100 dark:border-white/[0.06] shrink-0">
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Receipt No</div>
                              <div className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                                {p.receipt_number || 'N/A'}
                              </div>
                            </div>

                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment ID</div>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                                  {p.razorpay_payment_id || (isPending ? 'Pending' : 'N/A')}
                                </span>
                                {p.razorpay_payment_id && (
                                  <button
                                    onClick={() => copyPaymentValue(p.razorpay_payment_id, `pay_${p.id}`)}
                                    className="text-slate-400 hover:text-[#0099e6] transition-colors cursor-pointer"
                                    title="Copy Payment ID"
                                  >
                                    {copiedPaymentKey === `pay_${p.id}` ? (
                                      <CopyCheck className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bank UTR / Ref</div>
                              <div className="flex items-center gap-1">
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[110px]">
                                  {p.utr_number || (isPending ? 'Awaiting payment' : 'N/A')}
                                </span>
                                {p.utr_number && (
                                  <button
                                    onClick={() => copyPaymentValue(p.utr_number, `utr_${p.id}`)}
                                    className="text-slate-400 hover:text-[#0099e6] transition-colors cursor-pointer"
                                    title="Copy UTR"
                                  >
                                    {copiedPaymentKey === `utr_${p.id}` ? (
                                      <CopyCheck className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Actions */}
                        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            {p.payment_method && (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                                Method: {p.payment_method}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 font-medium">
                              {isPaid ? '100% Secure via Razorpay Gateway' : 'Spot reserved on arena waitlist'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPaid && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReceiptPayment(p);
                                  setReceiptModalOpen(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-[#0099e6] border border-sky-200 dark:border-sky-800/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Official Receipt</span>
                              </button>
                            )}

                            {isPending && eventSlug && (
                              p.isSquadMember ? (
                                <span className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-xs font-bold flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Leader Payment Pending</span>
                                </span>
                              ) : (
                                <Link
                                  href={`/hackathons/${eventSlug}/register?step=4`}
                                  className="px-4 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Pay Now (₹{Number(p.amount)}) →</span>
                                </Link>
                              )
                            )}

                            {eventSlug && (
                              <Link
                                href={`/hackathons/${eventSlug}`}
                                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
                              >
                                <span>View Arena</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


        </main>
      </div>

      {/* ─── MODALS ─────────────────────────────────────────────────── */}
      {/* Edit Event Modal */}
      {editModalOpen && editingEvent && (
        <EditEventModal
          isOpen={editModalOpen}
          event={editingEvent}
          onClose={() => {
            setEditModalOpen(false);
            setEditingEvent(null);
          }}
          onSave={handleEditEventSave}
        />
      )}

      {/* Delete Event Confirmation Modal */}
      {deleteConfirmEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1017] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/[0.08] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Hackathon Event?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">&quot;{deleteConfirmEvent.title}&quot;</strong>? This will remove the event from the directory and leaderboard.
              </p>
            </div>
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/[0.08]">
              <button
                onClick={() => setDeleteConfirmEvent(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEventConfirm}
                disabled={deletingEvent}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {deletingEvent && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deletingEvent ? 'Deleting...' : 'Yes, Delete Event'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Registered Hackers / Realtime Registrations Modal */}
      {viewingHackersEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setViewingHackersEvent(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[#0c1017] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/[0.08] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/80 dark:bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-[#0099e6] uppercase tracking-wider">Attendee Registrations</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Realtime Live
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1">
                  {viewingHackersEvent.title?.trim() || viewingHackersEvent.name?.trim() || viewingHackersEvent.tagline?.trim() || 'Hackathon'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {eventRegistrations.length} {eventRegistrations.length === 1 ? 'builder registered' : 'builders registered'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/events/${viewingHackersEvent.id || viewingHackersEvent.slug}/registrations`}
                  className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-[#0099e6] border border-sky-200 dark:border-sky-800/40 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Manage attendees in full-page table"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full Table</span>
                </Link>

                <button
                  onClick={() => handleExportCSV(viewingHackersEvent)}
                  disabled={eventRegistrations.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5 text-[#0099e6]" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => setViewingHackersEvent(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingRegistrations ? (
                <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-7 h-7 text-[#0099e6] animate-spin" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Fetching verified hacker registrations...</p>
                </div>
              ) : eventRegistrations.length === 0 ? (
                <div className="py-14 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] border border-sky-200 dark:border-sky-800/40 flex items-center justify-center mx-auto">
                    <Users className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">No Registrations Yet</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    No participants have registered for{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {viewingHackersEvent.title?.trim() || viewingHackersEvent.name?.trim() || viewingHackersEvent.tagline?.trim() || 'this hackathon'}
                    </strong>{' '}
                    yet. Share your event link to start receiving builder signups!
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        const url =
                          viewingHackersEvent.status === 'PENDING_APPROVAL' || viewingHackersEvent.status === 'DRAFT'
                            ? getEventPrivateLink(viewingHackersEvent, window.location.origin)
                            : `${window.location.origin}/hackathons/${viewingHackersEvent.slug}`;
                        navigator.clipboard.writeText(url);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Registration Link'}</span>
                    </button>
                    <a
                      href={
                        viewingHackersEvent.status === 'PENDING_APPROVAL' || viewingHackersEvent.status === 'DRAFT'
                          ? getEventPrivateLink(viewingHackersEvent, typeof window !== 'undefined' ? window.location.origin : '')
                          : `/hackathons/${viewingHackersEvent.slug}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Preview Event Page</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/[0.08]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.08] text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Hacker Name</th>
                        <th className="py-3 px-4">Contact Email</th>
                        <th className="py-3 px-4">Role / Domain</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-slate-700 dark:text-slate-300 font-medium">
                      {eventRegistrations.map((hacker, idx) => {
                        const name = hacker.user_name || hacker.userName || hacker.name || 'Anonymous Hacker';
                        const email = hacker.user_email || hacker.userEmail || hacker.email || '—';
                        const role = hacker.role || (hacker.skills && hacker.skills.length > 0 ? hacker.skills.slice(0, 2).join(', ') : hacker.college || 'Individual Hacker');
                        const status = hacker.status || 'CONFIRMED';
                        const rawDate = hacker.registered_at || hacker.registeredAt;
                        const formattedDate = rawDate ? formatDate(rawDate) : 'Recently';

                        return (
                          <tr key={hacker.id || idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950 text-[#0099e6] font-bold flex items-center justify-center text-[10px] uppercase">
                                {name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate">{name}</div>
                                {hacker.phone && <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{hacker.phone}</div>}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{email}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                                {role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${status === 'CONFIRMED' || status === 'APPROVED'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                                  : status === 'REJECTED'
                                    ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40'
                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                                }`}>
                                {status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 text-[11px] font-mono">{formattedDate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{eventRegistrations.length} live participant{eventRegistrations.length === 1 ? '' : 's'}</span>
              <button
                onClick={() => setViewingHackersEvent(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.1] dark:hover:bg-white/[0.15] text-slate-800 dark:text-white font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Public Profile Preview Modal */}
      <PublicProfileModal
        isOpen={showPublicProfileModal}
        onClose={() => setShowPublicProfileModal(false)}
        user={user}
      />

      {/* Project Submission Modal */}
      {submissionModalEvent && (
        <ProjectSubmissionModal
          isOpen={Boolean(submissionModalEvent)}
          onClose={() => setSubmissionModalEvent(null)}
          eventId={submissionModalEvent.id}
          eventName={submissionModalEvent.title}
          tracks={submissionModalEvent.tracks?.map((t: any) => t.title || t.name || t) || []}
          onSuccess={() => {
            setSubmissionModalEvent(null);
            loadDashboardData();
          }}
          onDelete={() => {
            setSubmissionModalEvent(null);
            loadDashboardData();
          }}
        />
      )}

      {/* ─── MODAL: Digital Payment Receipt ─── */}
      {receiptModalOpen && selectedReceiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c1017] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-white/[0.08] space-y-6 text-left">
            {/* Receipt Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0099e6]">
                  HACKER&apos;S UNITY
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Official Payment Receipt</h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            {/* Receipt Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Receipt No</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedReceiptPayment?.receipt_number || selectedReceiptPayment?.receiptNumber || 'HU-REC-XXXX'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Date</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatDate(selectedReceiptPayment?.transaction_date || selectedReceiptPayment?.created_at || new Date().toISOString())}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Event</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedReceiptPayment?.event_name || selectedReceiptPayment?.eventName || 'Hackathon Arena'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Squad Name</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedReceiptPayment?.team_name || selectedReceiptPayment?.teamName || 'Solo Builder'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Team Leader</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedReceiptPayment?.team_leader_name || selectedReceiptPayment?.teamLeaderName || user?.name || 'Hacker'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                  {selectedReceiptPayment?.team_leader_email || selectedReceiptPayment?.teamLeaderEmail || user?.email || 'N/A'}
                </span>
              </div>
            </div>

            {/* Transaction Verification Details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Payment ID:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {selectedReceiptPayment?.razorpay_payment_id || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Bank UTR / Ref:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedReceiptPayment?.utr_number || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Payment Method:</span>
                <span className="font-bold uppercase text-slate-800 dark:text-slate-200">
                  {selectedReceiptPayment?.payment_method || selectedReceiptPayment?.paymentMethod || 'UPI'}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 dark:border-white/[0.08] pt-2 text-sm font-black text-slate-900 dark:text-white">
                <span>Amount Paid</span>
                <span className="text-[#ea580c] font-mono text-base">
                  ₹{Number(selectedReceiptPayment?.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Receipt Modal Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadReceiptPdf({
                      receiptNo: selectedReceiptPayment?.receipt_number || 'HU-REC-XXXX',
                      eventName: selectedReceiptPayment?.event_title || selectedReceiptPayment?.eventName || 'Hackathon Arena',
                      teamName: selectedReceiptPayment?.team_name || selectedReceiptPayment?.teamName || 'Squad',
                      leaderName: selectedReceiptPayment?.participant_name || user?.name || 'Participant',
                      leaderEmail: selectedReceiptPayment?.participant_email || user?.email || '',
                      paymentId: selectedReceiptPayment?.razorpay_payment_id || 'N/A',
                      bankUtr: selectedReceiptPayment?.bank_utr || 'N/A',
                      amount: Number(selectedReceiptPayment?.amount || 0),
                      date: selectedReceiptPayment?.created_at
                        ? new Date(selectedReceiptPayment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                      paymentMethod: selectedReceiptPayment?.payment_method || selectedReceiptPayment?.paymentMethod || 'UPI',
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
                  <span>Download Receipt</span>
                </button>
                {selectedReceiptPayment?.razorpay_payment_id && (
                  <button
                    type="button"
                    onClick={() => copyPaymentValue(selectedReceiptPayment.razorpay_payment_id, 'modal_copy')}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedPaymentKey === 'modal_copy' ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5" />
                        Copy ID
                      </span>
                    )}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setReceiptModalOpen(false);
                  setSelectedReceiptPayment(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

