'use client';

import { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Github,
  Video,
  Presentation,
  Rocket,
  Sparkles,
  Trophy,
  Crown,
  Medal,
  Award,
  Copy,
  CopyCheck,
  RefreshCw,
  SlidersHorizontal,
  X,
  Layers,
  Archive,
  User,
  Mail,
  Check,
  Globe,
  Trash2,
  Edit3,
  ShieldAlert,
  Cpu,
  Bot,
  FileDown,
  Upload,
} from 'lucide-react';
import { SheetImportModal } from '@/components/sheet-import-modal';
import {
  getAllEvents,
  ProjectSubmission,
  ProductEvaluationReport,
  saveGoogleSheetsWebhook,
  getGoogleSheetsWebhook,
  getSubmissionAiEvaluation,
  saveSubmissionAiEvaluation,
  getCustomEvents,
} from '@/lib/storage';
import {
  fetchEventSubmissions,
  updateSubmissionReviewSupabase,
  deleteSubmissionSupabase,
  deleteAllSubmissionsSupabase,
  subscribeToEventSubmissions,
  mapDbEventToExtended,
  checkIsUserEventAdminOrHost,
} from '@/lib/supabase-service';
import { supabase } from '@/lib/supabase';
import { ExtendedEvent } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { ProductIntelligenceModal } from '@/components/product-intelligence-modal';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@hackers-unity/shared-types';
import { downloadSingleEvaluationPdf, downloadAllEvaluationsPdf } from '@/lib/evaluation-pdf';

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default function EventSubmissionsManagerPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [event, setEvent] = useState<ExtendedEvent | null>(null);
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'WINNER' | 'REJECTED'>('ALL');
  const [trackFilter, setTrackFilter] = useState<string>('ALL');

  // Selected project for detailed inspection dossier modal
  const [selectedSubmission, setSelectedSubmission] = useState<ProjectSubmission | null>(null);
  const [evalStatus, setEvalStatus] = useState<'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'WINNER' | 'REJECTED'>('UNDER_REVIEW');
  const [evalScore, setEvalScore] = useState<number>(85);
  const [evalNotes, setEvalNotes] = useState('');
  const [isSavingEval, setIsSavingEval] = useState(false);

  // AI Product Intelligence Modal State
  const [aiReportSubmission, setAiReportSubmission] = useState<ProjectSubmission | null>(null);
  const [evaluatingSubmissionId, setEvaluatingSubmissionId] = useState<string | null>(null);
  const [currentAiEvaluation, setCurrentAiEvaluation] = useState<ProductEvaluationReport | null>(null);

  // Batch AI Evaluation State
  const [isBatchEvaluating, setIsBatchEvaluating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentTitle?: string } | null>(null);

  // Top Winners Leaderboard Modal State
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [winnersTrackFilter, setWinnersTrackFilter] = useState<string>('ALL');

  // Google Sheets Live Sync Modal State
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showOpenInSheetsModal, setShowOpenInSheetsModal] = useState(false);
  const [showSheetImportModal, setShowSheetImportModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [copiedPasteData, setCopiedPasteData] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copiedFormula, setCopiedFormula] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedWebhookNotice, setSavedWebhookNotice] = useState(false);

  // Auth context for authorization checks
  const { user, supabaseUser, loading: authLoading } = useAuth();
  const currentUserId = supabaseUser?.id || user?.id;

  // Co-host state & async verification
  const [isCoHost, setIsCoHost] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Authorization check: only event host/organizer, co-hosts, and admins can access
  const isEventHost = useMemo(() => {
    if (typeof document !== 'undefined' && document.cookie.includes('is_admin_csap=1')) return true;
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) return true;
    if (isCoHost) return true;
    if (!currentUserId || !event) return false;

    if ((event as any).isCoHost) return true;

    // Check direct organizer match
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

    // Check if event was created locally in hosted events
    const custom = getCustomEvents();
    if (custom.some((ce) => ce.id === event.id || (event.slug && ce.slug === event.slug))) {
      return true;
    }

    // If it's a default template event where organizerId is 'usr_organizer', allow organizers
    if (event.organizerId === 'usr_organizer' && user?.role === UserRole.ORGANIZER) {
      return true;
    }

    return false;
  }, [user?.role, currentUserId, event, user?.id, supabaseUser?.id, isCoHost]);

  // Verify Co-Host and Organizer permissions in real time
  useEffect(() => {
    let isCancelled = false;

    async function verifyAccess() {
      if (typeof document !== 'undefined' && document.cookie.includes('is_admin_csap=1')) {
        setCheckingAccess(false);
        return;
      }
      if (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) {
        setCheckingAccess(false);
        return;
      }

      // Check sessionStorage cache from Dashboard navigation for instant unlock
      if (typeof window !== 'undefined') {
        try {
          const cached = sessionStorage.getItem('hackers_unity_current_event');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && (parsed.id === resolvedParams.eventId || parsed.slug === resolvedParams.eventId)) {
              if (parsed.isCoHost) {
                setIsCoHost(true);
                setCheckingAccess(false);
                return;
              }
            }
          }
        } catch {}
      }

      const uid = currentUserId;
      if (!uid) {
        if (!authLoading) {
          setCheckingAccess(false);
        }
        return;
      }

      if (
        event &&
        (event.organizerId === uid ||
          (event as any).organizer_id === uid ||
          (event as any).created_by === uid ||
          (event as any).isCoHost)
      ) {
        if (!isCancelled) {
          setIsCoHost(true);
          setCheckingAccess(false);
        }
        return;
      }

      const targetParam = event?.id || resolvedParams.eventId;
      if (targetParam && uid) {
        const authorized = await checkIsUserEventAdminOrHost(targetParam, uid, user?.email);
        if (!isCancelled) {
          if (authorized) {
            setIsCoHost(true);
            if (event) (event as any).isCoHost = true;
          }
          setCheckingAccess(false);
        }
      } else {
        if (!isCancelled) setCheckingAccess(false);
      }
    }

    verifyAccess();

    return () => {
      isCancelled = true;
    };
  }, [event?.id, resolvedParams.eventId, currentUserId, authLoading, user?.role, user?.email]);

  // Load event and submissions data
  const loadData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    const all = getAllEvents();
    let found = all.find(
      (e) => e.id === resolvedParams.eventId || e.slug === resolvedParams.eventId ||
             (resolvedParams.eventId === 'evt_ai_1791373781895' && (e.slug === 'sphinx-26' || e.title?.toLowerCase().includes('sphinx')))
    );

    if (!found) {
      try {
        const verifyRes = await fetch(`/api/events?slug=${encodeURIComponent(resolvedParams.eventId)}`, { cache: 'no-store' });
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          if (verifyData?.event) {
            found = mapDbEventToExtended(verifyData.event);
          }
        }
      } catch (apiErr) {
        console.warn('API event query notice in submissions page:', apiErr);
      }
    }

    if (!found) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedParams.eventId);
        let query = supabase.from('events').select('*');
        if (isUuid) {
          query = query.eq('id', resolvedParams.eventId);
        } else if (resolvedParams.eventId === 'evt_ai_1791373781895' || resolvedParams.eventId.includes('1791373781895') || resolvedParams.eventId.toLowerCase().includes('sphinx')) {
          query = query.or(`slug.eq.${resolvedParams.eventId},slug.eq.sphinx-26`);
        } else {
          query = query.eq('slug', resolvedParams.eventId);
        }
        const { data: dbEvt } = await query.maybeSingle();
        if (dbEvt) {
          found = mapDbEventToExtended(dbEvt);
        }
      } catch (err) {
        console.warn('Error fetching event from Supabase:', err);
      }
    }

    const targetEventId = found ? found.id : resolvedParams.eventId;
    if (found) {
      if ((found as any).isCoHost) {
        setIsCoHost(true);
      }
      setEvent(found);
    }

    const subs = await fetchEventSubmissions(targetEventId);
    const enrichedSubs = subs.map((s) => {
      const savedEval = getSubmissionAiEvaluation(s.id);
      return savedEval ? { ...s, aiEvaluation: savedEval, score: s.score || savedEval.finalScore } : s;
    });
    setSubmissions(enrichedSubs);
    const hook = getGoogleSheetsWebhook(targetEventId);
    if (hook) setWebhookUrl(hook);

    if (!silent) {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
    const cleanup = subscribeToEventSubmissions(resolvedParams.eventId, () => {
      loadData(true);
    });
    return () => cleanup();
  }, [resolvedParams.eventId, currentUserId]);

  // Derived unique tracks for filtering
  const availableTracks = Array.from(
    new Set(
      submissions.map((s) => s.track).filter(Boolean) as string[]
    )
  );

  // Filtered submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      sub.projectTitle.toLowerCase().includes(q) ||
      (sub.tagline && sub.tagline.toLowerCase().includes(q)) ||
      (sub.submittedByName && sub.submittedByName.toLowerCase().includes(q)) ||
      (sub.submittedByEmail && sub.submittedByEmail.toLowerCase().includes(q)) ||
      (sub.track && sub.track.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'ALL' || sub.status === statusFilter;

    const matchesTrack =
      trackFilter === 'ALL' || sub.track === trackFilter;

    return matchesSearch && matchesStatus && matchesTrack;
  });

  // Calculate high-level summary metrics
  const stats = {
    total: submissions.length,
    underReview: submissions.filter((s) => s.status === 'UNDER_REVIEW' || !s.status).length,
    accepted: submissions.filter((s) => s.status === 'ACCEPTED').length,
    winners: submissions.filter((s) => s.status === 'WINNER').length,
    rejected: submissions.filter((s) => s.status === 'REJECTED').length,
  };

  // Status badge styling
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'WINNER':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:border-amber-500/50';
      case 'ACCEPTED':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50';
      case 'REJECTED':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:border-rose-500/50';
      case 'UNDER_REVIEW':
        return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 hover:border-sky-500/50';
      default:
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 hover:border-slate-500/50';
    }
  };

  // ─── Automated AI Product Evaluation (Groq API) ─────────────
  const handleEvaluateWithAi = async (sub: ProjectSubmission) => {
    const existing = sub.aiEvaluation || getSubmissionAiEvaluation(sub.id);
    if (existing) {
      setCurrentAiEvaluation(existing);
      setAiReportSubmission(sub);
      return;
    }
    await runGroqEvaluation(sub);
  };

  const runGroqEvaluation = async (sub: ProjectSubmission) => {
    setEvaluatingSubmissionId(sub.id);
    setAiReportSubmission(sub);
    setCurrentAiEvaluation(null);

    try {
      const res = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_product',
          eventTitle: event?.title || 'Hackathon',
          eventDescription: event?.description || '',
          submission: sub,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to evaluate product with Groq AI');
      }

      const data = await res.json();
      const evaluation: ProductEvaluationReport = data.evaluation;

      setCurrentAiEvaluation(evaluation);
      saveSubmissionAiEvaluation(sub.id, evaluation);

      // Also sync score to Supabase & local storage
      const newStatus = sub.status && sub.status !== 'SUBMITTED' ? sub.status : 'UNDER_REVIEW';
      await updateSubmissionReviewSupabase(
        sub.id,
        newStatus,
        evaluation.finalScore,
        evaluation.productSummary,
        event?.id || resolvedParams.eventId
      );

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? { ...s, score: evaluation.finalScore, aiEvaluation: evaluation, status: newStatus }
            : s
        )
      );

      setToastMessage(`⚡ AI evaluation complete for "${sub.projectTitle}"! Score: ${evaluation.finalScore}/100`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.error('Groq AI evaluation error:', err);
      setToastMessage(`❌ AI evaluation error: ${err.message}`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setEvaluatingSubmissionId(null);
    }
  };

  // ─── Batch Evaluate All Submissions with Groq AI ─────────────
  const handleEvaluateAll = async () => {
    if (submissions.length === 0) {
      setToastMessage('No project submissions found to evaluate.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsBatchEvaluating(true);
    let evaluatedCount = 0;

    try {
      for (let i = 0; i < submissions.length; i++) {
        const sub = submissions[i];
        setBatchProgress({
          current: i + 1,
          total: submissions.length,
          currentTitle: sub.projectTitle,
        });

        try {
          const res = await fetch('/api/ai/groq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'evaluate_product',
              eventTitle: event?.title || 'Hackathon',
              eventDescription: event?.description || '',
              submission: sub,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const evaluation: ProductEvaluationReport = data.evaluation;
            saveSubmissionAiEvaluation(sub.id, evaluation);

            const newStatus = sub.status && sub.status !== 'SUBMITTED' ? sub.status : 'UNDER_REVIEW';
            await updateSubmissionReviewSupabase(
              sub.id,
              newStatus,
              evaluation.finalScore,
              evaluation.productSummary,
              event?.id || resolvedParams.eventId
            );

            setSubmissions((prev) =>
              prev.map((s) =>
                s.id === sub.id
                  ? { ...s, score: evaluation.finalScore, aiEvaluation: evaluation, status: newStatus }
                  : s
              )
            );
            evaluatedCount++;
          }
        } catch (itemErr) {
          console.error(`Batch eval error on ${sub.projectTitle}:`, itemErr);
        }
      }

      setToastMessage(`⚡ Batch AI evaluation complete! Successfully evaluated ${evaluatedCount} of ${submissions.length} projects.`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.error('Batch evaluation error:', err);
      setToastMessage(`❌ Batch evaluation error: ${err.message}`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsBatchEvaluating(false);
      setBatchProgress(null);
    }
  };

  // Ranked submissions based on AI / Review Score descending
  const rankedSubmissions = [...submissions].sort((a, b) => {
    const scoreA = a.aiEvaluation?.finalScore ?? a.score ?? 0;
    const scoreB = b.aiEvaluation?.finalScore ?? b.score ?? 0;
    return scoreB - scoreA;
  });

  const uniqueWinnersTracks = Array.from(
    new Set(submissions.map((s) => s.track).filter(Boolean))
  ) as string[];

  const filteredWinners = winnersTrackFilter === 'ALL'
    ? rankedSubmissions
    : rankedSubmissions.filter((s) => s.track === winnersTrackFilter);

  const handleApplyStatusAndScore = async (
    subId: string,
    status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'WINNER' | 'REJECTED',
    score: number
  ) => {
    try {
      await updateSubmissionReviewSupabase(
        subId,
        status,
        score,
        currentAiEvaluation?.productSummary,
        event?.id || resolvedParams.eventId
      );
      setSubmissions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, status, score } : s))
      );
      setToastMessage(`⚡ Applied status "${status}" and AI score (${score}/100) successfully!`);
      setTimeout(() => setToastMessage(null), 4000);
      setAiReportSubmission(null);
      setCurrentAiEvaluation(null);
    } catch (err: any) {
      console.error('Failed to apply AI evaluation score:', err);
      setToastMessage(`❌ Failed to apply score: ${err.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Quick inline status updater
  const handleQuickStatusChange = async (
    subId: string,
    newStatus: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'WINNER' | 'REJECTED'
  ) => {
    // 1. Instant optimistic state update
    setSubmissions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, status: newStatus } : s))
    );
    if (selectedSubmission?.id === subId) {
      setSelectedSubmission((prev) => (prev ? { ...prev, status: newStatus } : null));
      setEvalStatus(newStatus);
    }
    // 2. Persist to server and database
    await updateSubmissionReviewSupabase(subId, newStatus, undefined, undefined, event?.id || resolvedParams.eventId);
    loadData();
  };

  // Save detailed evaluation dossier
  const handleSaveEvaluation = async () => {
    if (!selectedSubmission) return;
    setIsSavingEval(true);
    await updateSubmissionReviewSupabase(
      selectedSubmission.id,
      evalStatus,
      evalScore,
      evalNotes,
      event?.id || resolvedParams.eventId
    );
    setIsSavingEval(false);
    setSelectedSubmission(null);
    loadData();
  };

  // Delete submission
  const handleDeleteSubmission = async (subId: string) => {
    if (!confirm('Are you sure you want to permanently delete this project submission from the roster?')) return;
    await deleteSubmissionSupabase(subId, event?.id || resolvedParams.eventId);
    if (selectedSubmission?.id === subId) setSelectedSubmission(null);
    loadData();
  };

  // Bulk Delete All Submissions for this event
  const handleDeleteAllSubmissions = async () => {
    setIsDeletingAll(true);
    try {
      const targetEventId = event?.id || resolvedParams.eventId;
      const extraAliases = [
        targetEventId,
        resolvedParams.eventId,
        event?.slug,
        'ee511926-1089-4171-9090-684e6d179826',
        'evt_ai_1791373781895',
        'sphinx-26',
      ].filter(Boolean) as string[];

      // 1. Instantly clear client state
      setSubmissions([]);
      setSelectedSubmission(null);

      // 2. Perform DB & Storage purge across all aliases
      await deleteAllSubmissionsSupabase(targetEventId, extraAliases);

      setShowDeleteAllModal(false);
      setToastMessage('🗑️ All project submissions have been deleted successfully.');
      setTimeout(() => setToastMessage(null), 4000);
      await loadData(true);
    } catch (err: any) {
      console.error('Delete all submissions error:', err);
      setToastMessage(`❌ Failed to delete submissions: ${err.message}`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Copy All Submissions in Google Sheets TSV + Styled HTML format
  const copySubmissionsToClipboard = async () => {
    if (submissions.length === 0) {
      setToastMessage('⚠️ No submissions available to copy yet.');
      setTimeout(() => setToastMessage(null), 3000);
      return false;
    }

    const headers = [
      '#',
      'Submitted Date',
      'Project Title',
      'Tagline',
      'Track',
      'Submitter Name',
      'Submitter Email',
      'Repository URL',
      'Demo Video URL',
      'Presentation Deck',
      'Review Status',
      'Score',
      'Description',
    ];

    const rows = submissions.map((sub, idx) => [
      idx + 1,
      sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '',
      sub.projectTitle || '',
      sub.tagline || '',
      sub.track || 'General',
      sub.submittedByName || 'Builder',
      sub.submittedByEmail || '',
      sub.projectLink || '',
      sub.demoVideoUrl || '',
      sub.presentationUrl || '',
      sub.status || 'SUBMITTED',
      sub.score ?? 0,
      (sub.projectDescription || '').replace(/\r?\n|\r/g, ' '),
    ]);

    const tsvText = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');

    const htmlRows = rows
      .map(
        (r) =>
          `<tr>${r.map((c) => `<td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;">${String(c)}</td>`).join('')}</tr>`
      )
      .join('');
    const htmlTable = `<table style="border-collapse:collapse;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;"><thead><tr style="background-color:#0F9D58;color:#ffffff;font-weight:bold;font-size:12px;">${headers.map((h) => `<th style="border:1px solid #0F9D58;padding:10px 12px;text-align:left;">${h}</th>`).join('')}</tr></thead><tbody>${htmlRows}</tbody></table>`;

    try {
      if (typeof window !== 'undefined' && window.ClipboardItem && navigator.clipboard?.write) {
        const tsvBlob = new Blob([tsvText], { type: 'text/plain' });
        const htmlBlob = new Blob([htmlTable], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': tsvBlob,
            'text/html': htmlBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(tsvText);
      }
      setCopiedPasteData(true);
      setTimeout(() => setCopiedPasteData(false), 2500);
      setToastMessage('📋 Submissions copied to clipboard! Ready to paste into Google Sheets.');
      setTimeout(() => setToastMessage(null), 4000);
      return true;
    } catch {
      await navigator.clipboard.writeText(tsvText);
      setCopiedPasteData(true);
      setTimeout(() => setCopiedPasteData(false), 2500);
      setToastMessage('📋 Submissions copied to clipboard! Ready to paste into Google Sheets.');
      setTimeout(() => setToastMessage(null), 4000);
      return true;
    }
  };

  // CSV Export Generator (Works 100% Client-Side for instant download)
  const handleExportCSV = () => {
    if (submissions.length === 0) {
      alert('No submissions available to export yet.');
      return;
    }

    const headers = [
      'Submission ID',
      'Submitted Date',
      'Project Title',
      'Tagline',
      'Track',
      'Submitter Name',
      'Submitter Email',
      'Repository URL',
      'Demo Video URL',
      'Presentation URL',
      'Review Status',
      'Score',
      'Description',
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ');
      return `"${clean}"`;
    };

    const rows = submissions.map((sub, idx) => [
      escapeCsv(sub.id || idx + 1),
      escapeCsv(sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-IN') : ''),
      escapeCsv(sub.projectTitle),
      escapeCsv(sub.tagline || ''),
      escapeCsv(sub.track || 'General'),
      escapeCsv(sub.submittedByName || 'Participant'),
      escapeCsv(sub.submittedByEmail || ''),
      escapeCsv(sub.projectLink || ''),
      escapeCsv(sub.demoVideoUrl || ''),
      escapeCsv(sub.presentationUrl || ''),
      escapeCsv(sub.status || 'SUBMITTED'),
      escapeCsv(sub.score ?? 0),
      escapeCsv(sub.projectDescription || ''),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event?.slug || event?.id || resolvedParams.eventId || 'hackathon'}-submissions.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download All Project Reports in One Consolidated PDF (Project-Wise)
  const handleDownloadAllReportsPdf = () => {
    if (submissions.length === 0) {
      alert('No submissions available to export yet.');
      return;
    }
    downloadAllEvaluationsPdf({
      submissions,
      eventTitle: event?.title || 'Hackathon Event',
    });
  };

  // Download Single Project Evaluation Report as PDF
  const handleDownloadSingleReportPdf = (sub: ProjectSubmission) => {
    const evalData = sub.aiEvaluation || getSubmissionAiEvaluation(sub.id);
    downloadSingleEvaluationPdf({
      submission: sub,
      evaluation: evalData,
      eventTitle: event?.title || 'Hackathon Event',
    });
  };

  // Live Google Sheets IMPORTDATA Formula
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://hackersunity.dev';
  const importFormula = `=IMPORTDATA("${appOrigin}/api/submissions/csv?eventId=${encodeURIComponent(event?.slug || resolvedParams.eventId)}")`;

  const handleCopyFormula = () => {
    navigator.clipboard.writeText(importFormula);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  const handleOpenGoogleSheets = async () => {
    await copySubmissionsToClipboard();
    window.open('https://docs.google.com/spreadsheets/u/0/create', '_blank');
    setShowOpenInSheetsModal(true);
  };

  const handleSheetImportSuccess = (imported: ProjectSubmission[]) => {
    setSubmissions((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const newSubs = imported.filter((s) => !existingIds.has(s.id));
      return [...newSubs, ...prev];
    });
    setToastMessage(`🎉 Successfully imported and organized ${imported.length} project submissions from sheet!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSaveWebhook = () => {
    const targetId = event?.id || resolvedParams.eventId;
    saveGoogleSheetsWebhook(targetId, webhookUrl);
    setSavedWebhookNotice(true);
    setTimeout(() => setSavedWebhookNotice(false), 2500);
  };

  const googleAppsScriptCode = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Add header row if first entry
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", "Project Title", "Submitter Name", "Submitter Email", 
        "Track", "Repository URL", "Demo URL", "Presentation URL", "Status", "Score"
      ]);
      sheet.getRange("A1:J1").setFontWeight("bold").setBackground("#0F9D58").setFontColor("#FFFFFF");
    }
    
    sheet.appendRow([
      data.timestamp || new Date(),
      data.projectTitle,
      data.submitterName,
      data.submitterEmail,
      data.track,
      data.repoUrl,
      data.demoUrl,
      data.presentationUrl,
      data.status,
      data.score || 0
    ]);
    
    return ContentService.createTextOutput("SUCCESS");
  } catch (err) {
    return ContentService.createTextOutput("ERROR: " + err.message);
  }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Show loading spinner while loading event and checking auth
  if (loading || authLoading || checkingAccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-7 h-7 text-[#0099e6] animate-spin" />
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">Loading Submissions Vault...</p>
      </div>
    );
  }

  // Access control guard: strictly for event organizer or platform administrators
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
            You do not have permission to view or manage project submissions for{' '}
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
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
      {/* ─── Breadcrumbs & Header ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0099e6] dark:text-slate-400 dark:hover:text-[#0099e6] font-semibold mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Organizer Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F9D58] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Submissions
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-purple-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  AI Product Intelligence Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {event?.title || 'Hackathon Event'} • Automated Groq AI product evaluation & live podium ranking
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Evaluate All Button (AI Batch Evaluation) */}
          <button
            type="button"
            onClick={handleEvaluateAll}
            disabled={isBatchEvaluating || submissions.length === 0}
            className="px-4 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#0099e6]/25 border border-sky-400/30 disabled:opacity-50"
            title="Automatically evaluate all submissions using Groq AI and Product Intelligence Criteria"
          >
            {isBatchEvaluating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>
                  Evaluating ({batchProgress ? `${batchProgress.current}/${batchProgress.total}` : '...'})
                </span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4 text-cyan-200" />
                <span>Evaluate All ({submissions.length})</span>
              </>
            )}
          </button>

          {/* Top Winners & Ranking Leaderboard Button */}
          <button
            type="button"
            onClick={() => setShowWinnersModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            title="View ranked projects, podium winners, and leaderboard"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Top Winners & Rankings</span>
          </button>

          {/* Download Consolidated PDF Reports (Project-Wise) */}
          <button
            type="button"
            onClick={handleDownloadAllReportsPdf}
            className="px-4 py-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-800 dark:text-purple-300 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            title="Download consolidated PDF evaluation report containing all participants' projects"
          >
            <FileDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Download All Reports (PDF)</span>
          </button>

          {/* Upload / Simple Import Sheet Button */}
          <button
            type="button"
            onClick={() => setShowSheetImportModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            title="Simple 1-click import from Google Sheets or CSV files"
          >
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Simple Import Sheet</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenGoogleSheets}
            className="px-4 py-2.5 rounded-xl bg-[#0F9D58] hover:bg-[#0c8248] text-white text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in Google Sheets</span>
          </button>

          {/* Delete All Submissions Button */}
          {submissions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDeleteAllModal(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              title="Permanently delete all project submissions for this hackathon"
            >
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Delete All</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Batch AI Evaluation Active Banner ───────────────────────── */}
      {isBatchEvaluating && batchProgress && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-sky-600/10 border border-blue-500/25 animate-in fade-in space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Evaluating Project {batchProgress.current} of {batchProgress.total}:
                <span className="font-extrabold text-[#0099e6] dark:text-[#38bdf8] ml-1.5">
                  &ldquo;{batchProgress.currentTitle}&rdquo;
                </span>
              </span>
            </div>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400">
              {Math.round((batchProgress.current / batchProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-white/[0.1] h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ─── Metric Pills Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-xs">
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">Total Submissions</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1017] border border-sky-200 dark:border-sky-800/40 shadow-xs">
          <div className="text-[10px] text-sky-600 dark:text-sky-400 font-extrabold uppercase tracking-wider">Under Review</div>
          <div className="text-2xl font-black text-sky-700 dark:text-sky-400 mt-1">{stats.underReview}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1017] border border-emerald-200 dark:border-emerald-800/40 shadow-xs">
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider">Accepted / Shortlist</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{stats.accepted}</div>
        </div>
        <div
          onClick={() => setShowWinnersModal(true)}
          className="p-4 rounded-2xl bg-white dark:bg-[#0c1017] border border-amber-200 dark:border-amber-800/40 shadow-xs cursor-pointer hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md transition-all group"
          title="Click to view Top Winners & Rankings Leaderboard"
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider">Podium Winners</div>
            <Trophy className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1 flex items-center justify-between">
            <span>{stats.winners}</span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
              <span>View</span> →
            </span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1017] border border-rose-200 dark:border-rose-800/40 shadow-xs">
          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-wider">Disqualified / Rejected</div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1">{stats.rejected}</div>
        </div>
      </div>

      {/* ─── Google Sheets Interactive Table Experience ───────────────── */}
      <div className="bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
        {/* Spreadsheet Top Ribbon (Sheets Toolbar) */}
        <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, tracks, builders..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F9D58] w-64"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1">
              {(['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'WINNER'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === s
                      ? 'bg-[#0F9D58] text-white shadow-2xs'
                      : 'bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  {s === 'ALL' ? 'All Rows' : s.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Track Filter */}
            {availableTracks.length > 0 && (
              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL">All Tracks ({availableTracks.length})</option>
                {availableTracks.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium">
            <button
              onClick={() => loadData(false)}
              className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Sheet</span>
            </button>
            <span>•</span>
            <span className="font-mono">{filteredSubmissions.length} row{filteredSubmissions.length === 1 ? '' : 's'} displayed</span>
            {submissions.length > 0 && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setShowDeleteAllModal(true)}
                  className="flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold transition-colors cursor-pointer hover:underline"
                  title="Delete all project submissions for this event"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All ({submissions.length})</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Formula Bar Simulation */}
        <div className="px-4 py-1.5 bg-slate-100/70 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.08] flex items-center gap-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
          <span className="font-bold text-[#0F9D58] select-none">fx</span>
          <span className="text-slate-400 dark:text-slate-600">|</span>
          <span className="truncate text-slate-700 dark:text-slate-300">
            {selectedSubmission
              ? `Selected: [${selectedSubmission.projectTitle}] by ${selectedSubmission.submittedByName || 'Builder'} (${selectedSubmission.track || 'General'})`
              : 'Continuous Live Sync Connected: New participant submissions auto-refresh in real time'}
          </span>
        </div>

        {/* Spreadsheet Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/[0.08]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-white/[0.04] border-b border-slate-200 dark:border-white/[0.08] text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 border-r border-slate-200 dark:border-white/[0.08] text-center w-12 font-mono text-slate-400 dark:text-slate-500">#</th>
                <th className="py-3 px-4 border-r border-slate-200 dark:border-white/[0.08] font-mono min-w-[130px] whitespace-nowrap">A • Submitted At</th>
                <th className="py-3 px-4 border-r border-slate-200 dark:border-white/[0.08] min-w-[200px]">B • Project Title</th>
                <th className="py-3 px-4 border-r border-slate-200 dark:border-white/[0.08] min-w-[180px]">C • Submitter</th>
                <th className="py-3 px-4 border-r border-slate-200 dark:border-white/[0.08] min-w-[150px]">D • Track</th>
                <th className="py-3 px-3 border-r border-slate-200 dark:border-white/[0.08] text-center w-14 whitespace-nowrap">E • Repo</th>
                <th className="py-3 px-3 border-r border-slate-200 dark:border-white/[0.08] text-center w-14 whitespace-nowrap">F • Demo</th>
                <th className="py-3 px-3 border-r border-slate-200 dark:border-white/[0.08] text-center w-14 whitespace-nowrap">G • Deck</th>
                <th className="py-3 px-4 border-r border-slate-200 dark:border-white/[0.08] min-w-[160px] whitespace-nowrap">H • Review Status</th>
                <th className="py-3 px-3 border-r border-slate-200 dark:border-white/[0.08] text-center w-20 whitespace-nowrap">I • Score</th>
                <th className="py-3 px-4 text-center min-w-[140px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-400 dark:text-slate-500 font-medium">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <Rocket className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white">No Project Submissions Found</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Participants have not submitted any prototypes for this hackathon yet or no projects match your filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub, idx) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors group border-b border-slate-100 dark:border-white/[0.04]"
                  >
                    {/* Row Index */}
                    <td className="py-3 px-3 border-r border-slate-200 dark:border-white/[0.08] text-center font-mono text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-white/[0.02]">
                      {idx + 1}
                    </td>

                    {/* Col A: Submitted At */}
                    <td className="py-3 px-4 border-r border-slate-200 dark:border-white/[0.08] font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(sub.submittedAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Col B: Project Title & Tagline */}
                    <td className="py-3 px-4 border-r border-slate-200 dark:border-white/[0.08] min-w-[200px] max-w-[260px]">
                      <div className="font-extrabold text-slate-900 dark:text-white truncate" title={sub.projectTitle}>
                        {sub.projectTitle}
                      </div>
                      {sub.tagline && (
                        <div className="text-[11px] text-[#0099e6] dark:text-[#38bdf8] font-medium truncate mt-0.5" title={sub.tagline}>
                          {sub.tagline}
                        </div>
                      )}
                    </td>

                    {/* Col C: Submitter */}
                    <td className="py-3 px-4 border-r border-slate-200 dark:border-white/[0.08] min-w-[180px] max-w-[220px]">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={sub.submittedByName}>
                        {sub.submittedByName || 'Hacker Builder'}
                      </div>
                      {sub.submittedByEmail && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate mt-0.5" title={sub.submittedByEmail}>
                          {sub.submittedByEmail}
                        </div>
                      )}
                    </td>

                    {/* Col D: Track */}
                    <td className="py-3 px-4 border-r border-slate-200 dark:border-white/[0.08] min-w-[150px]">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-[11px] font-semibold leading-tight max-w-[170px] truncate" title={sub.track}>
                        {sub.track || 'General'}
                      </span>
                    </td>

                    {/* Col E: Repo Link */}
                    <td className="py-3 px-3 border-r border-slate-200 dark:border-white/[0.08] text-center">
                      <a
                        href={sub.projectLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-[#0099e6] hover:text-white dark:hover:bg-[#0099e6] text-slate-700 dark:text-slate-300 transition-colors"
                        title={sub.projectLink}
                      >
                        <Github className="w-3.5 h-3.5" />
                      </a>
                    </td>

                    {/* Col F: Demo Video */}
                    <td className="py-3 px-3 border-r border-slate-200 dark:border-white/[0.08] text-center">
                      {sub.demoVideoUrl ? (
                        <a
                          href={sub.demoVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 hover:bg-[#ea580c] hover:text-white text-[#ea580c] dark:text-orange-400 transition-colors"
                          title="Watch Demo Video"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 font-mono">—</span>
                      )}
                    </td>

                    {/* Col G: Pitch Deck */}
                    <td className="py-3 px-3 border-r border-slate-200 dark:border-white/[0.08] text-center">
                      {sub.presentationUrl ? (
                        <a
                          href={sub.presentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 transition-colors"
                          title="View Pitch Deck"
                        >
                          <Presentation className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 font-mono">—</span>
                      )}
                    </td>

                    {/* Col H: Status Selector */}
                    <td className="py-3 px-4 border-r border-slate-200 dark:border-white/[0.08] min-w-[160px]">
                      <select
                        value={sub.status || 'SUBMITTED'}
                        onChange={(e) => handleQuickStatusChange(sub.id, e.target.value as any)}
                        className={`w-full max-w-[145px] px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase border outline-none cursor-pointer transition-colors shadow-2xs ${getStatusBadge(sub.status)}`}
                      >
                        <option value="SUBMITTED" className="bg-white dark:bg-[#121824] text-slate-800 dark:text-slate-200">SUBMITTED</option>
                        <option value="UNDER_REVIEW" className="bg-white dark:bg-[#121824] text-sky-700 dark:text-sky-300">UNDER REVIEW</option>
                        <option value="ACCEPTED" className="bg-white dark:bg-[#121824] text-emerald-700 dark:text-emerald-300">ACCEPTED</option>
                        <option value="WINNER" className="bg-white dark:bg-[#121824] text-amber-700 dark:text-amber-300">WINNER 🏆</option>
                        <option value="REJECTED" className="bg-white dark:bg-[#121824] text-rose-700 dark:text-rose-300">REJECTED</option>
                      </select>
                    </td>

                    {/* Col I: Score */}
                    <td className="py-3 px-3 border-r border-slate-200 dark:border-white/[0.08] text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {sub.aiEvaluation ? (
                        <button
                          type="button"
                          onClick={() => handleEvaluateWithAi(sub)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#0099e6]/10 hover:bg-[#0099e6]/20 text-[#0099e6] dark:text-cyan-300 border border-[#0099e6]/25 hover:border-[#0099e6]/60 cursor-pointer transition-all hover:scale-105"
                          title="Click to view full AI Product Intelligence Report"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0099e6] dark:bg-cyan-400 animate-pulse" />
                          <span>{sub.score || sub.aiEvaluation.finalScore}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">{sub.score || 0}</span>
                      )}
                    </td>

                    {/* Col J: Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEvaluateWithAi(sub)}
                          disabled={evaluatingSubmissionId === sub.id}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                            sub.aiEvaluation
                              ? 'bg-slate-100 hover:bg-sky-50 dark:bg-[#0c1322] dark:hover:bg-[#0099e6]/10 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#0099e6]/30 hover:border-[#0099e6]/60 shadow-2xs'
                              : 'bg-[#0099e6] hover:bg-[#0088cc] text-white shadow-xs shadow-[#0099e6]/20 border border-sky-400/20'
                          }`}
                          title={sub.aiEvaluation ? 'View or re-evaluate full AI Product Intelligence Report' : 'Evaluate submission as a real product using Groq AI'}
                        >
                          {evaluatingSubmissionId === sub.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0099e6]" />
                              <span>Evaluating...</span>
                            </>
                          ) : sub.aiEvaluation ? (
                            <>
                              <Cpu className="w-3.5 h-3.5 text-[#0099e6] dark:text-cyan-400" />
                              <span>Evaluate</span>
                              <span className="ml-0.5 px-1.5 py-0.2 rounded font-mono font-black text-[11px] bg-[#0099e6]/15 text-[#0099e6] dark:text-cyan-300 border border-[#0099e6]/30">
                                {sub.aiEvaluation.finalScore}
                              </span>
                            </>
                          ) : (
                            <>
                              <Cpu className="w-3.5 h-3.5 text-white" />
                              <span>Evaluate</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadSingleReportPdf(sub)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-white/[0.08] hover:border-purple-300 transition-colors cursor-pointer"
                          title="Download Participant Evaluation PDF Report"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubmission(sub.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete submission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Sheet Footer Bar */}
        <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Continuous Google Sheets Sync Ready</span>
          </div>
          <div>
            Total Projects in Roster: <strong className="text-slate-800 dark:text-white font-mono">{submissions.length}</strong>
          </div>
        </div>
      </div>

      {/* ─── Modal 1: Project Evaluation Dossier Modal ─────────────────── */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1017] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden my-6">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/[0.08] bg-gradient-to-r from-slate-50 to-emerald-50/40 dark:from-white/[0.02] dark:to-emerald-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0F9D58] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Project Review Dossier
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {selectedSubmission.projectTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
              {/* Deliverable Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Submitter</div>
                  <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">{selectedSubmission.submittedByName || 'Builder'}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Track</div>
                  <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">{selectedSubmission.track || 'General'}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Submitted Date</div>
                  <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">{formatDate(selectedSubmission.submittedAt)}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Current Status</div>
                  <div className="font-black text-[#0F9D58] mt-0.5 uppercase">{selectedSubmission.status || 'Submitted'}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-1.5">
                  Detailed Solution Architecture
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {selectedSubmission.projectDescription}
                </div>
              </div>

              {/* Links Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <a
                  href={selectedSubmission.projectLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-sky-200 dark:border-sky-800/40 bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] font-bold flex items-center justify-between hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Github className="w-4 h-4 shrink-0" />
                    <span className="truncate">GitHub Repository</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>

                {selectedSubmission.demoVideoUrl ? (
                  <a
                    href={selectedSubmission.demoVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-orange-200 dark:border-orange-800/40 bg-orange-50 dark:bg-orange-950/40 text-[#ea580c] dark:text-orange-400 font-bold flex items-center justify-between hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Video className="w-4 h-4 shrink-0" />
                      <span className="truncate">Demo Video</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] text-slate-400 font-medium">
                    No Demo Video
                  </div>
                )}

                {selectedSubmission.presentationUrl ? (
                  <a
                    href={selectedSubmission.presentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-between hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Presentation className="w-4 h-4 shrink-0" />
                      <span className="truncate">Slide Deck</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] text-slate-400 font-medium">
                    No Slide Deck
                  </div>
                )}
              </div>

              {/* Evaluation Controls */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-4">
                <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Organizer & Judge Scoring</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Award Status
                    </label>
                    <select
                      value={evalStatus}
                      onChange={(e) => setEvalStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] font-bold text-xs text-slate-900 dark:text-white outline-none"
                    >
                      <option value="UNDER_REVIEW">UNDER REVIEW</option>
                      <option value="ACCEPTED">ACCEPTED (Shortlisted)</option>
                      <option value="WINNER">WINNER 🏆 (Podium)</option>
                      <option value="REJECTED">REJECTED (Disqualified)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Score: <span className="font-mono text-base font-black text-[#0F9D58] dark:text-emerald-400">{evalScore}</span> / 100
                      </label>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={evalScore}
                      onChange={(e) => setEvalScore(Number(e.target.value))}
                      className="w-full accent-[#0F9D58] cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Judge Evaluation Notes & Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={evalNotes}
                    onChange={(e) => setEvalNotes(e.target.value)}
                    placeholder="Provide feedback on creativity, execution, architecture, and pitch presentation..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedSubmission) {
                    const sub = selectedSubmission;
                    setSelectedSubmission(null);
                    handleEvaluateWithAi(sub);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>⚡ AI Product Intelligence</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedSubmission && (
                  <button
                    type="button"
                    onClick={() => handleDownloadSingleReportPdf(selectedSubmission)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Download this project's evaluation dossier as PDF"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEvaluation}
                  disabled={isSavingEval}
                  className="px-5 py-2 rounded-xl bg-[#0F9D58] hover:bg-[#0c8248] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {isSavingEval ? 'Saving...' : 'Save Evaluation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Google Sheets Live Sync Setup Modal ─────────────── */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1017] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden my-6">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/[0.08] bg-[#0F9D58] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    Google Sheets Continuous Live Sync
                  </h3>
                  <p className="text-xs text-white/80 font-medium">
                    Automatically stream new submissions into your external Google Sheet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="p-2 text-white/70 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* Method 1: Instant Formula (Zero Setup) */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-sm text-emerald-900 dark:text-emerald-300">
                    <span className="w-6 h-6 rounded-full bg-[#0F9D58] text-white flex items-center justify-center text-xs">
                      1
                    </span>
                    <span>Method A: 1-Click Google Sheet Formula (Recommended)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] uppercase">
                    Zero Setup
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Open any Google Sheet and paste this formula into <strong>Cell A1</strong>. Google Sheets will continuously fetch and auto-update your sheet with live project submissions!
                </p>

                <div className="relative p-3 rounded-xl bg-white dark:bg-[#121824] border border-emerald-300 dark:border-emerald-700/50 font-mono text-[11px] text-slate-800 dark:text-slate-200 break-all select-all flex items-center justify-between gap-3">
                  <code>{importFormula}</code>
                  <button
                    type="button"
                    onClick={handleCopyFormula}
                    className="px-3 py-1.5 rounded-lg bg-[#0F9D58] hover:bg-[#0c8248] text-white font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                  >
                    {copiedFormula ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFormula ? 'Copied!' : 'Copy Formula'}</span>
                  </button>
                </div>
              </div>

              {/* Method 2: Google Apps Script Webhook */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                    <span className="w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-xs">
                      2
                    </span>
                    <span>Method B: Instant Push Webhook (Google Apps Script)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase">
                    Realtime Push
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  To append rows the instant a participant clicks submit, create an Apps Script in your Google Sheet (Extensions → Apps Script) and deploy as Web App:
                </p>

                <div className="relative">
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[10px] font-mono overflow-x-auto max-h-36">
                    {googleAppsScriptCode}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="absolute top-2 right-2 px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Paste Deployed Apps Script Webhook URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#0F9D58]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveWebhook}
                      className="px-4 py-2 rounded-xl bg-[#0F9D58] hover:bg-[#0c8248] text-white font-bold text-xs cursor-pointer shadow-2xs shrink-0"
                    >
                      Save Webhook
                    </button>
                  </div>
                  {savedWebhookNotice && (
                    <p className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Webhook URL saved successfully! New submissions will automatically push to your sheet.</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="px-6 py-2 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast Notification ────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-[#121824] text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-slate-700 dark:border-white/[0.1] animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── Modal 3: Open in Google Sheets Quick Paste Modal ──────────── */}
      {showOpenInSheetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#0c1017] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden my-6">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/[0.08] bg-[#0F9D58] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    Google Sheets Opened & Data Copied!
                  </h3>
                  <p className="text-xs text-white/90 font-medium">
                    1-Step paste to display all submissions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOpenInSheetsModal(false)}
                className="p-2 text-white/80 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Success Callout */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#0F9D58] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-emerald-900 dark:text-emerald-300">
                    {submissions.length} Project Submission{submissions.length === 1 ? '' : 's'} Copied to Clipboard!
                  </div>
                  <p className="text-xs text-emerald-800/90 dark:text-emerald-400/90 font-medium mt-0.5 leading-relaxed">
                    Formatted with emerald headers, project links, submitter emails, review statuses, and scores ready for spreadsheet cells.
                  </p>
                </div>
              </div>

              {/* 2-Step Quick Guide */}
              <div className="space-y-3">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  How to view your submissions in Google Sheets:
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
                    <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white dark:text-slate-950 text-white flex items-center justify-center text-xs font-black shrink-0">
                      1
                    </span>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white">Switch to your new Google Sheet tab</div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        A blank Google Sheet tab was opened in your browser.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40">
                    <span className="w-6 h-6 rounded-full bg-[#0099e6] text-white flex items-center justify-center text-xs font-black shrink-0">
                      2
                    </span>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        Click on Cell <span className="font-mono bg-white dark:bg-[#121824] px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800/40 font-black">A1</span> and press{' '}
                        <kbd className="px-2 py-0.5 bg-slate-900 text-white rounded font-mono text-[11px] font-bold">
                          ⌘ + V
                        </kbd>{' '}
                        or{' '}
                        <kbd className="px-2 py-0.5 bg-slate-900 text-white rounded font-mono text-[11px] font-bold">
                          Ctrl + V
                        </kbd>
                      </div>
                      <p className="text-sky-800 dark:text-sky-300 text-[11px] mt-0.5 font-medium">
                        All project rows and columns will immediately fill into the spreadsheet with full styling!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={copySubmissionsToClipboard}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0F9D58] hover:bg-[#0c8248] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  {copiedPasteData ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPasteData ? 'Data Copied!' : 'Copy Data Again'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Download .CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.open('https://docs.google.com/spreadsheets/u/0/create', '_blank')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>Re-open Sheet Tab</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
              <span>Tip: In Google Sheets, you can also use File → Import → Upload to import CSV</span>
              <button
                type="button"
                onClick={() => setShowOpenInSheetsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-white/[0.08] hover:bg-slate-300 dark:hover:bg-white/[0.12] text-slate-800 dark:text-white font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 4: AI Product Intelligence Report Modal ─────────────── */}
      <ProductIntelligenceModal
        submission={aiReportSubmission}
        evaluation={currentAiEvaluation}
        isOpen={Boolean(aiReportSubmission)}
        isEvaluating={evaluatingSubmissionId === aiReportSubmission?.id}
        onClose={() => {
          setAiReportSubmission(null);
          setCurrentAiEvaluation(null);
        }}
        onReevaluate={(sub) => runGroqEvaluation(sub)}
        onApplyStatusAndScore={handleApplyStatusAndScore}
        eventTitle={event?.title}
      />

      {/* ─── Modal 5: Top Winners & Ranking Leaderboard Modal ───────────── */}
      {showWinnersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-white dark:bg-[#0c1017] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden my-6 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/[0.08] bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Hackathon Top Winners & Rankings
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50">
                       AI Product Intelligence
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    Projects dynamically sorted by evaluated product, business, and execution scores (out of 100).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Track Selector */}
                {uniqueWinnersTracks.length > 0 && (
                  <select
                    value={winnersTrackFilter}
                    onChange={(e) => setWinnersTrackFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="ALL">All Tracks ({rankedSubmissions.length})</option>
                    {uniqueWinnersTracks.map((tr) => (
                      <option key={tr} value={tr}>
                        {tr} ({rankedSubmissions.filter((s) => s.track === tr).length})
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={handleDownloadAllReportsPdf}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Download consolidated PDF dossier containing all participant project evaluations"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download Dossier (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowWinnersModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {filteredWinners.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto text-slate-400">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">No submissions found in this track</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Try switching to &ldquo;All Tracks&rdquo; or click &ldquo;Evaluate All&rdquo; to analyze submissions.
                  </p>
                </div>
              ) : (
                <>
                  {/* ─── Top 3 Podium Cards ─────────────────────────────── */}
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span>Podium Winners Showcase</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      {/* 2nd Place (Silver) */}
                      {filteredWinners.length > 1 && (
                        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-100/90 to-slate-200/50 dark:from-slate-800/40 dark:to-slate-900/60 border border-slate-300 dark:border-slate-700/60 shadow-md relative order-2 md:order-1">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700/70 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-black shrink-0">
                              <Medal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>2nd • Silver</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xl font-black font-mono text-slate-800 dark:text-slate-200">
                                {filteredWinners[1].aiEvaluation?.finalScore ?? filteredWinners[1].score ?? 0}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans font-normal ml-0.5">/100</span>
                            </div>
                          </div>

                          <h4 className="font-black text-slate-900 dark:text-white text-base truncate mb-1" title={filteredWinners[1].projectTitle}>
                            {filteredWinners[1].projectTitle}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 min-h-[32px]">
                            {filteredWinners[1].tagline || filteredWinners[1].projectDescription || 'No description'}
                          </p>

                          <div className="pt-2.5 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate min-w-0" title={filteredWinners[1].submittedByName}>
                              By {filteredWinners[1].submittedByName || 'Builder'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-[10px] font-bold shrink-0 max-w-[130px] truncate" title={filteredWinners[1].track}>
                              {filteredWinners[1].track || 'General'}
                            </span>
                          </div>

                          <div className="mt-3.5 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleQuickStatusChange(
                                  filteredWinners[1].id,
                                  filteredWinners[1].status === 'WINNER' ? 'ACCEPTED' : 'WINNER'
                                );
                              }}
                              className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                filteredWinners[1].status === 'WINNER'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-white dark:bg-[#121824] hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-white/[0.1] text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {filteredWinners[1].status === 'WINNER' ? '🏆 Winner Selected' : 'Mark as Winner'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEvaluateWithAi(filteredWinners[1])}
                              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-white/[0.08] hover:bg-slate-300 dark:hover:bg-white/[0.12] text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
                            >
                              Report
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 1st Place (Gold Winner - Elevated) */}
                      {filteredWinners.length > 0 && (
                        <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-amber-500/5 dark:from-amber-500/25 dark:via-yellow-500/10 dark:to-transparent border-2 border-amber-400 dark:border-amber-500/60 shadow-xl shadow-amber-500/10 relative order-1 md:order-2 md:-translate-y-2">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-[11px] font-black shadow-sm shrink-0">
                              <Crown className="w-3.5 h-3.5 shrink-0" />
                              <span>1st • Grand Champion</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                                {filteredWinners[0].aiEvaluation?.finalScore ?? filteredWinners[0].score ?? 0}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans font-normal ml-0.5">/100</span>
                            </div>
                          </div>

                          <h4 className="font-black text-slate-900 dark:text-white text-lg truncate mb-1" title={filteredWinners[0].projectTitle}>
                            {filteredWinners[0].projectTitle}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 font-medium min-h-[32px]">
                            {filteredWinners[0].tagline || filteredWinners[0].projectDescription || 'No description'}
                          </p>

                          <div className="pt-2.5 border-t border-amber-300/40 dark:border-white/[0.1] flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-black text-slate-800 dark:text-slate-200 truncate min-w-0" title={filteredWinners[0].submittedByName}>
                              By {filteredWinners[0].submittedByName || 'Builder'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800/50 shrink-0 max-w-[130px] truncate" title={filteredWinners[0].track}>
                              {filteredWinners[0].track || 'General'}
                            </span>
                          </div>

                          <div className="mt-3.5 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleQuickStatusChange(
                                  filteredWinners[0].id,
                                  filteredWinners[0].status === 'WINNER' ? 'ACCEPTED' : 'WINNER'
                                );
                              }}
                              className={`flex-1 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                                filteredWinners[0].status === 'WINNER'
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md'
                                  : 'bg-white dark:bg-[#121824] hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {filteredWinners[0].status === 'WINNER' ? '🏆 Champion Crowned' : 'Crown as Winner'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEvaluateWithAi(filteredWinners[0])}
                              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs cursor-pointer hover:opacity-90 transition-opacity"
                            >
                              Dossier
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 3rd Place (Bronze) */}
                      {filteredWinners.length > 2 && (
                        <div className="p-5 rounded-2xl bg-gradient-to-b from-orange-100/70 to-amber-100/40 dark:from-amber-950/30 dark:to-orange-950/40 border border-orange-300/70 dark:border-orange-900/50 shadow-md relative order-3">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-200/80 dark:bg-orange-900/60 border border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-200 text-[11px] font-black shrink-0">
                              <Award className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                              <span>3rd • Bronze</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xl font-black font-mono text-orange-700 dark:text-orange-400">
                                {filteredWinners[2].aiEvaluation?.finalScore ?? filteredWinners[2].score ?? 0}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans font-normal ml-0.5">/100</span>
                            </div>
                          </div>

                          <h4 className="font-black text-slate-900 dark:text-white text-base truncate mb-1" title={filteredWinners[2].projectTitle}>
                            {filteredWinners[2].projectTitle}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 min-h-[32px]">
                            {filteredWinners[2].tagline || filteredWinners[2].projectDescription || 'No description'}
                          </p>

                          <div className="pt-2.5 border-t border-orange-200 dark:border-white/[0.08] flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate min-w-0" title={filteredWinners[2].submittedByName}>
                              By {filteredWinners[2].submittedByName || 'Builder'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-white/[0.08] text-orange-800 dark:text-orange-300 text-[10px] font-bold shrink-0 max-w-[130px] truncate" title={filteredWinners[2].track}>
                              {filteredWinners[2].track || 'General'}
                            </span>
                          </div>

                          <div className="mt-3.5 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleQuickStatusChange(
                                  filteredWinners[2].id,
                                  filteredWinners[2].status === 'WINNER' ? 'ACCEPTED' : 'WINNER'
                                );
                              }}
                              className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                filteredWinners[2].status === 'WINNER'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-white dark:bg-[#121824] hover:bg-orange-50 dark:hover:bg-orange-950/30 border border-slate-200 dark:border-white/[0.1] text-orange-600 dark:text-orange-400'
                              }`}
                            >
                              {filteredWinners[2].status === 'WINNER' ? '🏆 Winner Selected' : 'Mark as Winner'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEvaluateWithAi(filteredWinners[2])}
                              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-white/[0.08] hover:bg-slate-300 dark:hover:bg-white/[0.12] text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
                            >
                              Report
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ─── Complete Leaderboard Ranking Table ─────────────── */}
                  <div className="mt-6">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                      Complete Project Standings ({filteredWinners.length} Projects)
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden bg-slate-50/50 dark:bg-white/[0.02]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[720px]">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-white/[0.04] border-b border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px]">
                              <th className="py-3 px-3 text-center w-14">Rank</th>
                              <th className="py-3 px-4 min-w-[220px]">Project & Submitter</th>
                              <th className="py-3 px-3 min-w-[140px]">Track</th>
                              <th className="py-3 px-3 text-center w-24">Score</th>
                              <th className="py-3 px-3 min-w-[110px]">Stage</th>
                              <th className="py-3 px-3 min-w-[140px]">Status</th>
                              <th className="py-3 px-4 text-right min-w-[110px]">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                            {filteredWinners.map((sub, idx) => {
                              const score = sub.aiEvaluation?.finalScore ?? sub.score ?? 0;
                              return (
                                <tr
                                  key={sub.id}
                                  className={`hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors ${
                                    sub.status === 'WINNER' ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''
                                  }`}
                                >
                                  <td className="py-3 px-3 text-center font-black">
                                    {idx === 0 ? (
                                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-900 font-black text-xs shadow-sm">
                                        🥇
                                      </span>
                                    ) : idx === 1 ? (
                                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-black text-xs">
                                        🥈
                                      </span>
                                    ) : idx === 2 ? (
                                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/30 text-amber-800 dark:text-amber-200 font-black text-xs">
                                        🥉
                                      </span>
                                    ) : (
                                      <span className="font-mono text-slate-500 dark:text-slate-400">#{idx + 1}</span>
                                    )}
                                  </td>

                                  <td className="py-3 px-4 min-w-[220px]">
                                    <div className="font-extrabold text-slate-900 dark:text-white truncate max-w-[220px]" title={sub.projectTitle}>
                                      {sub.projectTitle}
                                    </div>
                                    <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[220px] mt-0.5" title={sub.submittedByEmail}>
                                      {sub.submittedByName || 'Builder'} • {sub.submittedByEmail || ''}
                                    </div>
                                  </td>

                                  <td className="py-3 px-3 min-w-[140px]">
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-semibold text-[11px] max-w-[150px] truncate" title={sub.track}>
                                      {sub.track || 'General'}
                                    </span>
                                  </td>

                                  <td className="py-3 px-3 text-center">
                                    <div className="font-mono font-black text-slate-900 dark:text-white text-sm">{score}</div>
                                    <div className="w-16 mx-auto bg-slate-200 dark:bg-white/[0.1] h-1.5 rounded-full overflow-hidden mt-1">
                                      <div
                                        className={`h-full rounded-full ${
                                          score >= 80
                                            ? 'bg-emerald-500'
                                            : score >= 60
                                            ? 'bg-sky-500'
                                            : 'bg-amber-500'
                                        }`}
                                        style={{ width: `${Math.min(100, score)}%` }}
                                      />
                                    </div>
                                  </td>

                                  <td className="py-3 px-3 min-w-[110px]">
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate block max-w-[120px]">
                                      {sub.aiEvaluation?.productStage || 'Evaluated'}
                                    </span>
                                  </td>

                                  <td className="py-3 px-3 min-w-[140px]">
                                    <select
                                      value={sub.status || 'SUBMITTED'}
                                      onChange={(e) => handleQuickStatusChange(sub.id, e.target.value as any)}
                                      className={`w-full max-w-[135px] px-2 py-1 rounded-lg text-[10px] font-black uppercase border outline-none cursor-pointer transition-colors shadow-2xs ${getStatusBadge(
                                        sub.status
                                      )}`}
                                    >
                                      <option value="SUBMITTED" className="bg-white dark:bg-[#121824] text-slate-800 dark:text-slate-200">SUBMITTED</option>
                                      <option value="UNDER_REVIEW" className="bg-white dark:bg-[#121824] text-sky-700 dark:text-sky-300">UNDER REVIEW</option>
                                      <option value="ACCEPTED" className="bg-white dark:bg-[#121824] text-emerald-700 dark:text-emerald-300">ACCEPTED</option>
                                      <option value="WINNER" className="bg-white dark:bg-[#121824] text-amber-700 dark:text-amber-300">WINNER 🏆</option>
                                      <option value="REJECTED" className="bg-white dark:bg-[#121824] text-rose-700 dark:text-rose-300">REJECTED</option>
                                    </select>
                                  </td>

                                  <td className="py-3 px-4 text-right min-w-[110px]">
                                    <button
                                      type="button"
                                      onClick={() => handleEvaluateWithAi(sub)}
                                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                                    >
                                      View Report
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Tip: Marking a project as &ldquo;WINNER&rdquo; updates the official podium stats and Supabase records.
              </span>
              <button
                type="button"
                onClick={() => setShowWinnersModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/[0.08] hover:bg-slate-300 dark:hover:bg-white/[0.12] text-slate-800 dark:text-white font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 6: Upload Sheet & Auto-Organize Submissions ──────────── */}
      <SheetImportModal
        isOpen={showSheetImportModal}
        onClose={() => setShowSheetImportModal(false)}
        eventId={event?.id || resolvedParams.eventId}
        eventName={event?.title || 'Hackathon Arena'}
        availableTracks={
          Array.from(
            new Set([
              ...availableTracks,
              ...((event?.tracks || []).map((t: any) => typeof t === 'string' ? t : t.title).filter(Boolean)),
              'General',
            ])
          )
        }
        onSuccess={handleSheetImportSuccess}
      />

      {/* ─── Modal 7: Delete All Submissions Confirmation ─────────────── */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0d1117] border border-rose-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Delete All Submissions?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete all{' '}
                  <strong className="text-rose-600 dark:text-rose-400 font-black">
                    {submissions.length} project submissions
                  </strong>{' '}
                  for <span className="font-semibold text-slate-800 dark:text-slate-200">&ldquo;{event?.title || 'this event'}&rdquo;</span>?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-xs text-rose-700 dark:text-rose-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>This action is irreversible</span>
              </div>
              <p className="text-[11px] opacity-90 pl-5.5">
                All participant project entries, scores, Groq AI evaluations, and leaderboard positions will be permanently wiped from the database and local storage.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                disabled={isDeletingAll}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAllSubmissions}
                disabled={isDeletingAll}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeletingAll ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-white" />
                    <span>Yes, Delete All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
