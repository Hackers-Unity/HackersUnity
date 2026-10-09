'use client';

import { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  ArrowLeft,
  Check,
  X,
  ExternalLink,
  FileSpreadsheet,
  Upload,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Eye,
} from 'lucide-react';
import {
  getEventRegistrations,
  updateRegistrationStatus,
  getRegistrationStats,
  EventRegistration,
  getAllEvents,
  deleteEventRegistration,
  deleteBulkEventRegistrations,
  clearAllEventRegistrations,
  getCustomEvents,
} from '@/lib/storage';
import { ExtendedEvent } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { BulkRegistrationModal } from '@/components/bulk-registration-modal';
import { fetchEventBySlug } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@hackers-unity/shared-types';

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default function EventRegistrationsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [event, setEvent] = useState<ExtendedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Auth context for authorization checks
  const { user, supabaseUser, loading: authLoading } = useAuth();
  const currentUserId = supabaseUser?.id || user?.id;

  // Authorization check: only event host/organizer and admins can access
  const isEventHost = useMemo(() => {
    if (typeof document !== 'undefined' && document.cookie.includes('is_admin_csap=1')) return true;
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) return true;
    if (!currentUserId || !event) return false;

    if (
      event.organizerId &&
      event.organizerId !== 'usr_organizer' &&
      (event.organizerId === currentUserId || event.organizerId === user?.id || event.organizerId === supabaseUser?.id)
    ) {
      return true;
    }

    if (
      (event as any).organizer_id &&
      ((event as any).organizer_id === currentUserId || (event as any).organizer_id === user?.id || (event as any).organizer_id === supabaseUser?.id)
    ) {
      return true;
    }

    if (
      (event as any).created_by &&
      ((event as any).created_by === currentUserId || (event as any).created_by === user?.id || (event as any).created_by === supabaseUser?.id)
    ) {
      return true;
    }

    const custom = getCustomEvents();
    if (custom.some((ce) => ce.id === event.id || (event.slug && ce.slug === event.slug))) {
      return true;
    }

    if (event.organizerId === 'usr_organizer' && user?.role === UserRole.ORGANIZER) {
      return true;
    }

    return false;
  }, [user?.role, currentUserId, event, user?.id, supabaseUser?.id]);

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewingApplicant, setViewingApplicant] = useState<any | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const loadData = async () => {
    let found = getAllEvents().find((e) => e.id === resolvedParams.eventId || e.slug === resolvedParams.eventId);
    if (!found) {
      found = (await fetchEventBySlug(resolvedParams.eventId)) || undefined;
    }
    if (found) {
      setEvent(found);

      // 1. Fetch live participant registrations from database via API
      let dbRegistrations: any[] = [];
      try {
        const res = await fetch(`/api/registrations?eventId=${encodeURIComponent(resolvedParams.eventId)}&list=true`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.registrations)) {
            dbRegistrations = json.registrations;
          }
        }
      } catch (apiErr) {
        console.warn('Could not fetch DB registrations, using local storage fallback:', apiErr);
      }

      // 2. Also read localStorage for any locally saved or uploaded applicants
      const localById = getEventRegistrations(found.id);
      const localBySlug = found.slug && found.slug !== found.id ? getEventRegistrations(found.slug) : [];

      // 3. Merge: Database registrations take priority, then local entries
      const map = new Map<string, any>();
      dbRegistrations.forEach((r) => {
        const key = (r.userEmail || r.id || '').toLowerCase().trim();
        if (key) map.set(key, r);
      });

      [...localById, ...localBySlug].forEach((r: any) => {
        const key = (r.userEmail || r.user_email || r.id || '').toLowerCase().trim();
        if (key && !map.has(key)) {
          map.set(key, r);
        }
      });

      const combined = Array.from(map.values());
      setRegistrations(combined);
      setStats({
        total: combined.length,
        approved: combined.filter((r) => r.status === 'APPROVED' || r.status === 'CONFIRMED').length,
        pending: combined.filter((r) => r.status === 'PENDING').length,
        rejected: combined.filter((r) => r.status === 'REJECTED').length,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => {
      loadData();
    };
    window.addEventListener('hackers_unity_storage_change', handleStorage);
    return () => window.removeEventListener('hackers_unity_storage_change', handleStorage);
  }, [resolvedParams.eventId]);

  // Status changes
  const handleStatusChange = async (regId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    if (!event) return;
    updateRegistrationStatus(event.id, regId, newStatus);
    setRegistrations((prev) =>
      prev.map((r) => (r.id === regId ? { ...r, status: newStatus } : r))
    );

    try {
      await fetch('/api/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          id: regId,
          status: newStatus,
          eventId: event.id,
        }),
      });
    } catch (err) {
      console.warn('Failed to sync status to DB:', err);
    }
    loadData();
  };

  // Single delete
  const handleDeleteSingle = async (regId: string, name: string) => {
    if (!event) return;
    deleteEventRegistration(event.id, regId);
    setSelectedIds((prev) => prev.filter((id) => id !== regId));
    setRegistrations((prev) => prev.filter((r) => r.id !== regId));

    try {
      await fetch(`/api/registrations?id=${encodeURIComponent(regId)}&eventId=${encodeURIComponent(event.id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to delete from DB:', err);
    }

    loadData();
    setNotification({
      text: `Deleted registration for ${name}.`,
      type: 'info',
    });
    setTimeout(() => {
      setNotification((curr) => (curr?.type === 'info' ? null : curr));
    }, 4000);
  };

  // Bulk status update
  const handleBulkStatusChange = async (status: 'APPROVED' | 'REJECTED') => {
    if (!event || selectedIds.length === 0) return;
    selectedIds.forEach((id) => updateRegistrationStatus(event.id, id, status));
    setRegistrations((prev) =>
      prev.map((r) => (selectedIds.includes(r.id) ? { ...r, status } : r))
    );

    try {
      await fetch('/api/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_status',
          ids: selectedIds,
          status,
          eventId: event.id,
        }),
      });
    } catch (err) {
      console.warn('Failed to bulk sync status to DB:', err);
    }

    loadData();
    setNotification({
      text: `Updated ${selectedIds.length} applicants to ${status}.`,
      type: 'success',
    });
    setSelectedIds([]);
    setTimeout(() => {
      setNotification((curr) => (curr?.type === 'success' ? null : curr));
    }, 4000);
  };

  // Bulk delete selected
  const handleBulkDeleteSelected = async () => {
    if (!event || selectedIds.length === 0) return;
    const count = deleteBulkEventRegistrations(event.id, selectedIds);
    const toDeleteIds = [...selectedIds];
    setSelectedIds([]);
    setRegistrations((prev) => prev.filter((r) => !toDeleteIds.includes(r.id)));

    try {
      await fetch('/api/registrations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_bulk',
          ids: toDeleteIds,
          eventId: event.id,
        }),
      });
    } catch (err) {
      console.warn('Failed to bulk delete from DB:', err);
    }

    loadData();
    setNotification({
      text: `Successfully deleted ${count} registrations.`,
      type: 'success',
    });
    setTimeout(() => {
      setNotification((curr) => (curr?.type === 'success' ? null : curr));
    }, 5000);
  };

  // Clear all registrations
  const handleClearAll = async () => {
    if (!event) return;
    const count = clearAllEventRegistrations(event.id);
    setShowClearModal(false);
    setSelectedIds([]);
    setRegistrations([]);

    try {
      await fetch('/api/registrations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear_all',
          eventId: event.id,
        }),
      });
    } catch (err) {
      console.warn('Failed to clear registrations from DB:', err);
    }

    loadData();
    setNotification({
      text: `Cleared all ${count} registrations successfully.`,
      type: 'success',
    });
    setTimeout(() => {
      setNotification((curr) => (curr?.type === 'success' ? null : curr));
    }, 6000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!event) return;
    const headers = [
      'Name',
      'Email',
      'Phone',
      'College',
      'City',
      'GitHub',
      'LinkedIn',
      'Skills',
      'Portfolio',
      'Resume',
      'Discord',
      'Twitter',
      'T-Shirt Size',
      'Dietary Preference',
      'Experience Level',
      'Custom Answers',
      'Status',
      'Registered At',
    ];
    const rows = filteredRegistrations.map((r) => [
      `"${(r.userName || '').replace(/"/g, '""')}"`,
      `"${(r.userEmail || '').replace(/"/g, '""')}"`,
      `"${(r.phone || '').replace(/"/g, '""')}"`,
      `"${(r.college || '').replace(/"/g, '""')}"`,
      `"${(r.city || '').replace(/"/g, '""')}"`,
      `"${(r.githubUrl || '').replace(/"/g, '""')}"`,
      `"${(r.linkedinUrl || '').replace(/"/g, '""')}"`,
      `"${(r.skills || []).join('; ').replace(/"/g, '""')}"`,
      `"${((r as any).portfolioUrl || r.customAnswers?.portfolio_url || r.customAnswers?.portfolioUrl || '').replace(/"/g, '""')}"`,
      `"${((r as any).resumeUrl || r.customAnswers?.resume_url || r.customAnswers?.resumeUrl || '').replace(/"/g, '""')}"`,
      `"${((r as any).discordHandle || r.customAnswers?.discord_handle || r.customAnswers?.discordHandle || '').replace(/"/g, '""')}"`,
      `"${((r as any).twitterUrl || r.customAnswers?.twitter_url || r.customAnswers?.twitterUrl || '').replace(/"/g, '""')}"`,
      `"${((r as any).tshirtSize || r.customAnswers?.tshirt_size || r.customAnswers?.tshirtSize || '').replace(/"/g, '""')}"`,
      `"${((r as any).dietaryPreference || r.customAnswers?.dietary_preference || r.customAnswers?.dietaryPreference || '').replace(/"/g, '""')}"`,
      `"${((r as any).experienceLevel || r.customAnswers?.experience_level || r.customAnswers?.experienceLevel || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(r.customAnswers || {}).replace(/"/g, '""')}"`,
      `"${r.status}"`,
      `"${r.registeredAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${event.slug}-registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        (r.college && r.college.toLowerCase().includes(q)) ||
        (r.city && r.city.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'APPROVED' && (r.status === 'APPROVED' || r.status === 'CONFIRMED')) ||
        r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [registrations, searchQuery, statusFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / pageSize));
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, currentPage, pageSize]);

  // Selection handlers
  const isAllPageSelected =
    paginatedRegistrations.length > 0 &&
    paginatedRegistrations.every((r) => selectedIds.includes(r.id));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIds = new Set(paginatedRegistrations.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...paginatedRegistrations.map((r) => r.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 border-2 border-[#0099e6] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">Loading Registrations...</p>
      </div>
    );
  }

  if (!isEventHost) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0d121d] border border-rose-500/20 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-5 text-rose-400 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Organizer Access Only</h1>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            You do not have permission to view or manage participant registrations for{' '}
            <span className="text-white font-medium">{event?.title || 'this event'}</span>.
            This dashboard is strictly reserved for the event organizer and platform administrators.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={event?.slug ? `/hackathons/${event.slug}` : `/hackathons/${resolvedParams.eventId}`}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0099e6] hover:bg-[#0088cc] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#0099e6]/20"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Hackathon Overview
            </Link>
            <Link
              href="/dashboard"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors flex items-center justify-center"
            >
              Back to My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-[#0099e6] dark:hover:text-[#0099e6] font-semibold mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Organizer Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Manage Registrations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            {event ? (
              <>
                Showing hacker applicants for <strong className="text-slate-900 dark:text-white">{event.title}</strong>
              </>
            ) : (
              'Loading hackathon data...'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-linear-to-r from-[#0099e6] to-[#0077b6] hover:from-[#0088cc] hover:to-[#00669e] text-white text-xs font-bold transition-all shadow-xs hover:shadow flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={registrations.length === 0}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowClearModal(true)}
            disabled={registrations.length === 0}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-700 dark:text-red-400 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete all registration data"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>Delete All</span>
          </button>
        </div>
      </div>

      {/* ─── Success / Info Alert Notification ──────────────────── */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            notification.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200'
              : notification.type === 'info'
              ? 'bg-blue-50 dark:bg-sky-950/30 border-blue-200 dark:border-sky-850/40 text-blue-800 dark:text-sky-200'
              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-850/40 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            ) : notification.type === 'info' ? (
              <Users className="w-5 h-5 text-[#0099e6] shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <span className="font-semibold">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Stats Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Applicants</span>
            <Users className="w-4 h-4 text-[#0099e6]" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.total}</div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono">{stats.approved}</div>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-900 dark:text-amber-200 font-mono">{stats.pending}</div>
        </div>

        <div className="p-5 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 dark:text-red-400">Rejected</span>
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-900 dark:text-red-200 font-mono">{stats.rejected}</div>
        </div>
      </div>

      {/* ─── Filter & Search Bar ────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0c1017] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by hacker name, email, college, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#0099e6] dark:focus:border-[#0099e6]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === filter
                  ? 'bg-[#0099e6] text-white shadow-2xs'
                  : 'bg-slate-50 dark:bg-[#121824] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]'
              }`}
            >
              {filter === 'ALL' ? 'All Applicants' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Bulk Action Bar (When rows are selected) ─────────────── */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-full bg-[#0099e6] text-white text-[11px] font-black font-mono">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold">applicants selected</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBulkStatusChange('APPROVED')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve Selected</span>
            </button>

            <button
              onClick={() => handleBulkStatusChange('REJECTED')}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject Selected</span>
            </button>

            <button
              onClick={handleBulkDeleteSelected}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* ─── Registrations Table ────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
        {filteredRegistrations.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">No applicants found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'Registrations will appear here in real-time as builders apply or when uploaded.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={toggleSelectAllPage}
                      className="rounded border-slate-300 dark:border-white/20 text-[#0099e6] focus:ring-[#0099e6] cursor-pointer"
                      title="Select all on this page"
                    />
                  </th>
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">College / City</th>
                  <th className="py-3.5 px-4">Profiles & Skills</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-slate-700 dark:text-slate-300">
                {paginatedRegistrations.map((reg) => {
                  const isSelected = selectedIds.includes(reg.id);
                  return (
                    <tr
                      key={reg.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-blue-50/40 dark:bg-sky-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(reg.id)}
                          className="rounded border-slate-300 dark:border-white/20 text-[#0099e6] focus:ring-[#0099e6] cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{reg.userName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{reg.userEmail}</div>
                        {reg.phone && <div className="text-[10px] text-slate-400 dark:text-slate-500">{reg.phone}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{reg.college || '—'}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{reg.city || '—'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          {reg.githubUrl && (
                            <a
                              href={reg.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0099e6] hover:underline text-[11px] font-semibold inline-flex items-center gap-0.5"
                            >
                              GitHub <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {reg.linkedinUrl && (
                            <a
                              href={reg.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0099e6] hover:underline text-[11px] font-semibold inline-flex items-center gap-0.5"
                            >
                              LinkedIn <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(reg.skills || []).slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/[0.06] rounded text-[10px] text-slate-600 dark:text-slate-300 font-mono"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDate(reg.registeredAt)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {reg.status === 'APPROVED' || reg.status === 'CONFIRMED' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                            Approved
                          </span>
                        ) : reg.status === 'REJECTED' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40">
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                            Pending Review
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => setViewingApplicant(reg)}
                            title="View Full Details & Answers"
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-[#0099e6] transition-colors cursor-pointer border border-sky-200 dark:border-sky-800/40"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(reg.id, 'APPROVED')}
                            title="Approve Applicant"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800/40"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(reg.id, 'REJECTED')}
                            title="Reject Applicant"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer border border-amber-200 dark:border-amber-800/40"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSingle(reg.id, reg.userName)}
                            title="Delete Applicant"
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300 transition-colors cursor-pointer border border-red-200 dark:border-red-800/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pagination Footer ──────────────────────────────────── */}
        {filteredRegistrations.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
              <span>
                Showing{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  {(currentPage - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  {Math.min(currentPage * pageSize, filteredRegistrations.length)}
                </strong>{' '}
                of{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  {filteredRegistrations.length.toLocaleString()}
                </strong>{' '}
                applicants
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 dark:text-slate-500">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121824] hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="text-slate-600 dark:text-slate-300 font-bold font-mono px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121824] hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Clear All Registrations Confirmation Modal ─────────── */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Delete All Registrations?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Are you sure you want to permanently delete all{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  {registrations.length.toLocaleString()}
                </strong>{' '}
                registrations for <strong className="text-slate-800 dark:text-slate-200">{event?.title}</strong>? This
                action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121824] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bulk Registration Modal ────────────────────────────── */}
      {event && (
        <BulkRegistrationModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          eventId={event.id}
          eventName={event.title}
          onSuccess={({ added, updated, total }) => {
            loadData();
            setNotification({
              text: `Successfully imported registrations! Added ${added} new applicants, updated ${updated} existing. Total now: ${total.toLocaleString()}.`,
              type: 'success',
            });
            setTimeout(() => {
              setNotification((curr) => (curr?.type === 'success' ? null : curr));
            }, 8000);
          }}
        />
      )}

      {/* ─── Applicant Details Modal ───────────────────────────── */}
      {viewingApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {viewingApplicant.userName}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                    {viewingApplicant.role || 'Participant'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  {viewingApplicant.userEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingApplicant(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Phone Number</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingApplicant.phone || '—'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">College / Institute</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingApplicant.college || '—'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">City / Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingApplicant.city || '—'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Registered At</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{formatDate(viewingApplicant.registeredAt)}</span>
              </div>
            </div>

            {/* Profiles & Links */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Profiles & Links
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {viewingApplicant.githubUrl && (
                  <a
                    href={viewingApplicant.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6] flex items-center justify-between text-[#0099e6] font-semibold transition-colors"
                  >
                    <span>GitHub Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {viewingApplicant.linkedinUrl && (
                  <a
                    href={viewingApplicant.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6] flex items-center justify-between text-[#0099e6] font-semibold transition-colors"
                  >
                    <span>LinkedIn Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {(viewingApplicant.portfolioUrl || viewingApplicant.customAnswers?.portfolio_url || viewingApplicant.customAnswers?.portfolioUrl) && (
                  <a
                    href={viewingApplicant.portfolioUrl || viewingApplicant.customAnswers?.portfolio_url || viewingApplicant.customAnswers?.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6] flex items-center justify-between text-[#0099e6] font-semibold transition-colors"
                  >
                    <span>Portfolio Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {(viewingApplicant.resumeUrl || viewingApplicant.customAnswers?.resume_url || viewingApplicant.customAnswers?.resumeUrl) && (
                  <a
                    href={viewingApplicant.resumeUrl || viewingApplicant.customAnswers?.resume_url || viewingApplicant.customAnswers?.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6] flex items-center justify-between text-[#0099e6] font-semibold transition-colors"
                  >
                    <span>Resume / CV</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {(viewingApplicant.discordHandle || viewingApplicant.customAnswers?.discord_handle || viewingApplicant.customAnswers?.discordHandle) && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
                    <span className="text-slate-500">Discord:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {viewingApplicant.discordHandle || viewingApplicant.customAnswers?.discord_handle || viewingApplicant.customAnswers?.discordHandle}
                    </span>
                  </div>
                )}
                {(viewingApplicant.twitterUrl || viewingApplicant.customAnswers?.twitter_url || viewingApplicant.customAnswers?.twitterUrl) && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
                    <span className="text-slate-500">Twitter / X:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {viewingApplicant.twitterUrl || viewingApplicant.customAnswers?.twitter_url || viewingApplicant.customAnswers?.twitterUrl}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Fields & Swag */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Preferences & Swag
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block font-bold">T-Shirt Size</span>
                  <span className="font-black text-slate-900 dark:text-white mt-0.5 block">
                    {viewingApplicant.tshirtSize || viewingApplicant.customAnswers?.tshirt_size || viewingApplicant.customAnswers?.tshirtSize || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block font-bold">Dietary</span>
                  <span className="font-black text-slate-900 dark:text-white mt-0.5 block">
                    {viewingApplicant.dietaryPreference || viewingApplicant.customAnswers?.dietary_preference || viewingApplicant.customAnswers?.dietaryPreference || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block font-bold">Experience</span>
                  <span className="font-black text-slate-900 dark:text-white mt-0.5 block">
                    {viewingApplicant.experienceLevel || viewingApplicant.customAnswers?.experience_level || viewingApplicant.customAnswers?.experienceLevel || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Skills */}
            {Array.isArray(viewingApplicant.skills) && viewingApplicant.skills.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Skills & Tech Stack
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingApplicant.skills.map((s: string) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-white/[0.06] rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Questions & Answers */}
            {viewingApplicant.customAnswers && Object.keys(viewingApplicant.customAnswers).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Custom Questions & Answers
                </h4>
                <div className="space-y-2">
                  {Object.entries(viewingApplicant.customAnswers)
                    .filter(([key]) => !['portfolio_url', 'portfolioUrl', 'resume_url', 'resumeUrl', 'discord_handle', 'discordHandle', 'twitter_url', 'twitterUrl', 'tshirt_size', 'tshirtSize', 'dietary_preference', 'dietaryPreference', 'experience_level', 'experienceLevel'].includes(key))
                    .map(([key, val]) => {
                      const questionObj = (event?.customQuestions || []).find((q) => q.id === key);
                      const questionLabel = questionObj ? questionObj.label : key;
                      return (
                        <div
                          key={key}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] space-y-1"
                        >
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                            {questionLabel}
                          </span>
                          <p className="text-xs text-slate-900 dark:text-white font-medium whitespace-pre-wrap">
                            {String(val) || '—'}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleStatusChange(viewingApplicant.id, 'APPROVED');
                    setViewingApplicant((prev: any) => (prev ? { ...prev, status: 'APPROVED' } : null));
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" /> <span>Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleStatusChange(viewingApplicant.id, 'REJECTED');
                    setViewingApplicant((prev: any) => (prev ? { ...prev, status: 'REJECTED' } : null));
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <X className="w-3.5 h-3.5" /> <span>Reject</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setViewingApplicant(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
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


