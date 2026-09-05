'use client';

import { useState, useEffect, use } from 'react';
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
} from 'lucide-react';
import {
  getAllEvents,
  ProjectSubmission,
  saveGoogleSheetsWebhook,
  getGoogleSheetsWebhook,
} from '@/lib/storage';
import {
  fetchEventSubmissions,
  updateSubmissionReviewSupabase,
  deleteSubmissionSupabase,
  subscribeToEventSubmissions,
} from '@/lib/supabase-service';
import { ExtendedEvent } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';

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

  // Google Sheets Live Sync Modal State
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showOpenInSheetsModal, setShowOpenInSheetsModal] = useState(false);
  const [copiedPasteData, setCopiedPasteData] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copiedFormula, setCopiedFormula] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedWebhookNotice, setSavedWebhookNotice] = useState(false);

  // Load event and submissions data
  const loadData = async () => {
    setLoading(true);
    const all = getAllEvents();
    const found = all.find(
      (e) => e.id === resolvedParams.eventId || e.slug === resolvedParams.eventId
    );
    if (found) {
      setEvent(found);
      const subs = await fetchEventSubmissions(found.id);
      setSubmissions(subs);
      const hook = getGoogleSheetsWebhook(found.id);
      if (hook) setWebhookUrl(hook);
    } else {
      const subs = await fetchEventSubmissions(resolvedParams.eventId);
      setSubmissions(subs);
      const hook = getGoogleSheetsWebhook(resolvedParams.eventId);
      if (hook) setWebhookUrl(hook);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const cleanup = subscribeToEventSubmissions(resolvedParams.eventId, () => {
      loadData();
    });
    return () => cleanup();
  }, [resolvedParams.eventId]);

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
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'ACCEPTED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'UNDER_REVIEW':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  // Quick inline status updater
  const handleQuickStatusChange = async (
    subId: string,
    newStatus: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'WINNER' | 'REJECTED'
  ) => {
    await updateSubmissionReviewSupabase(subId, newStatus);
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
      evalNotes
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

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
      {/* ─── Breadcrumbs & Header ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0099e6] font-semibold mb-2 transition-colors"
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
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Submissions
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Google Sheets Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {event?.title || 'Hackathon Event'} • Real-time judge review and continuous Google Sheets sync
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowSyncModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Google Sheets Live Sync</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
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
        </div>
      </div>

      {/* ─── Metric Pills Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Submissions</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-sky-200 shadow-xs">
          <div className="text-[10px] text-sky-600 font-extrabold uppercase tracking-wider">Under Review</div>
          <div className="text-2xl font-black text-sky-700 mt-1">{stats.underReview}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs">
          <div className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider">Accepted / Shortlist</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.accepted}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs">
          <div className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">Podium Winners</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{stats.winners}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-xs">
          <div className="text-[10px] text-rose-600 font-extrabold uppercase tracking-wider">Disqualified / Rejected</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{stats.rejected}</div>
        </div>
      </div>

      {/* ─── Google Sheets Interactive Table Experience ───────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Spreadsheet Top Ribbon (Sheets Toolbar) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, tracks, builders..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F9D58] w-64"
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
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
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
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
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

          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Sheet</span>
            </button>
            <span>•</span>
            <span className="font-mono">{filteredSubmissions.length} row{filteredSubmissions.length === 1 ? '' : 's'} displayed</span>
          </div>
        </div>

        {/* Formula Bar Simulation */}
        <div className="px-4 py-1.5 bg-slate-100/70 border-b border-slate-200 flex items-center gap-3 font-mono text-[11px] text-slate-600">
          <span className="font-bold text-[#0F9D58] select-none">fx</span>
          <span className="text-slate-400">|</span>
          <span className="truncate text-slate-700">
            {selectedSubmission
              ? `Selected: [${selectedSubmission.projectTitle}] by ${selectedSubmission.submittedByName || 'Builder'} (${selectedSubmission.track || 'General'})`
              : 'Continuous Live Sync Connected: New participant submissions auto-refresh in real time'}
          </span>
        </div>

        {/* Spreadsheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-10 font-mono text-slate-400">#</th>
                <th className="py-2.5 px-4 border-r border-slate-200 font-mono">A • Submitted At</th>
                <th className="py-2.5 px-4 border-r border-slate-200">B • Project Title</th>
                <th className="py-2.5 px-4 border-r border-slate-200">C • Submitter</th>
                <th className="py-2.5 px-4 border-r border-slate-200">D • Track</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">E • Repo</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">F • Demo</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">G • Deck</th>
                <th className="py-2.5 px-4 border-r border-slate-200">H • Review Status</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">I • Score</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-400 font-medium">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <Rocket className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-800">No Project Submissions Found</div>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Participants have not submitted any prototypes for this hackathon yet or no projects match your filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub, idx) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-emerald-50/40 transition-colors group border-b border-slate-100"
                  >
                    {/* Row Index */}
                    <td className="py-3 px-3 border-r border-slate-200 text-center font-mono text-[11px] text-slate-400 bg-slate-50/50">
                      {idx + 1}
                    </td>

                    {/* Col A: Submitted At */}
                    <td className="py-3 px-4 border-r border-slate-200 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(sub.submittedAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Col B: Project Title & Tagline */}
                    <td className="py-3 px-4 border-r border-slate-200 max-w-xs">
                      <div className="font-extrabold text-slate-900 line-clamp-1">
                        {sub.projectTitle}
                      </div>
                      {sub.tagline && (
                        <div className="text-[11px] text-[#0099e6] font-medium line-clamp-1">
                          {sub.tagline}
                        </div>
                      )}
                    </td>

                    {/* Col C: Submitter */}
                    <td className="py-3 px-4 border-r border-slate-200 whitespace-nowrap">
                      <div className="font-bold text-slate-800">
                        {sub.submittedByName || 'Hacker Builder'}
                      </div>
                      {sub.submittedByEmail && (
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">
                          {sub.submittedByEmail}
                        </div>
                      )}
                    </td>

                    {/* Col D: Track */}
                    <td className="py-3 px-4 border-r border-slate-200">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {sub.track || 'General'}
                      </span>
                    </td>

                    {/* Col E: Repo Link */}
                    <td className="py-3 px-3 border-r border-slate-200 text-center">
                      <a
                        href={sub.projectLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex p-1.5 rounded-lg bg-slate-100 hover:bg-[#0099e6] hover:text-white text-slate-700 transition-colors"
                        title={sub.projectLink}
                      >
                        <Github className="w-3.5 h-3.5" />
                      </a>
                    </td>

                    {/* Col F: Demo Video */}
                    <td className="py-3 px-3 border-r border-slate-200 text-center">
                      {sub.demoVideoUrl ? (
                        <a
                          href={sub.demoVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex p-1.5 rounded-lg bg-orange-50 hover:bg-[#ea580c] hover:text-white text-[#ea580c] transition-colors"
                          title="Watch Demo Video"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-300 font-mono">—</span>
                      )}
                    </td>

                    {/* Col G: Pitch Deck */}
                    <td className="py-3 px-3 border-r border-slate-200 text-center">
                      {sub.presentationUrl ? (
                        <a
                          href={sub.presentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 transition-colors"
                          title="View Pitch Deck"
                        >
                          <Presentation className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-300 font-mono">—</span>
                      )}
                    </td>

                    {/* Col H: Status Selector */}
                    <td className="py-3 px-4 border-r border-slate-200">
                      <select
                        value={sub.status || 'SUBMITTED'}
                        onChange={(e) => handleQuickStatusChange(sub.id, e.target.value as any)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border outline-none cursor-pointer ${getStatusBadge(sub.status)}`}
                      >
                        <option value="SUBMITTED">SUBMITTED</option>
                        <option value="UNDER_REVIEW">UNDER REVIEW</option>
                        <option value="ACCEPTED">ACCEPTED</option>
                        <option value="WINNER">WINNER 🏆</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>

                    {/* Col I: Score */}
                    <td className="py-3 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-800">
                      {sub.score || 0}
                    </td>

                    {/* Col J: Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setEvalStatus(sub.status || 'UNDER_REVIEW');
                            setEvalScore(sub.score || 85);
                            setEvalNotes(sub.reviewNotes || '');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0099e6] font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Evaluate
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubmission(sub.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Continuous Google Sheets Sync Ready</span>
          </div>
          <div>
            Total Projects in Roster: <strong className="text-slate-800 font-mono">{submissions.length}</strong>
          </div>
        </div>
      </div>

      {/* ─── Modal 1: Project Evaluation Dossier Modal ─────────────────── */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0F9D58] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Project Review Dossier
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedSubmission.projectTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
              {/* Deliverable Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Submitter</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">{selectedSubmission.submittedByName || 'Builder'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Track</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">{selectedSubmission.track || 'General'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Submitted Date</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">{formatDate(selectedSubmission.submittedAt)}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Current Status</div>
                  <div className="font-black text-[#0F9D58] mt-0.5 uppercase">{selectedSubmission.status || 'Submitted'}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Detailed Solution Architecture
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedSubmission.projectDescription}
                </div>
              </div>

              {/* Links Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <a
                  href={selectedSubmission.projectLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-sky-200 bg-sky-50 text-[#0099e6] font-bold flex items-center justify-between hover:bg-sky-100 transition-colors"
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
                    className="p-3 rounded-xl border border-orange-200 bg-orange-50 text-[#ea580c] font-bold flex items-center justify-between hover:bg-orange-100 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Video className="w-4 h-4 shrink-0" />
                      <span className="truncate">Demo Video</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-medium">
                    No Demo Video
                  </div>
                )}

                {selectedSubmission.presentationUrl ? (
                  <a
                    href={selectedSubmission.presentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold flex items-center justify-between hover:bg-emerald-100 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Presentation className="w-4 h-4 shrink-0" />
                      <span className="truncate">Slide Deck</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-medium">
                    No Slide Deck
                  </div>
                )}
              </div>

              {/* Evaluation Controls */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-4">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  <span>Organizer & Judge Scoring</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Award Status
                    </label>
                    <select
                      value={evalStatus}
                      onChange={(e) => setEvalStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-xs outline-none"
                    >
                      <option value="UNDER_REVIEW">UNDER REVIEW</option>
                      <option value="ACCEPTED">ACCEPTED (Shortlisted)</option>
                      <option value="WINNER">WINNER 🏆 (Podium)</option>
                      <option value="REJECTED">REJECTED (Disqualified)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Score: <span className="font-mono text-base font-black text-[#0F9D58]">{evalScore}</span> / 100
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Judge Evaluation Notes & Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={evalNotes}
                    onChange={(e) => setEvalNotes(e.target.value)}
                    placeholder="Provide feedback on creativity, execution, architecture, and pitch presentation..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
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
      )}

      {/* ─── Modal 2: Google Sheets Live Sync Setup Modal ─────────────── */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#0F9D58] text-white">
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
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
                    <span className="w-6 h-6 rounded-full bg-[#0F9D58] text-white flex items-center justify-center text-xs">
                      1
                    </span>
                    <span>Method A: 1-Click Google Sheet Formula (Recommended)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase">
                    Zero Setup
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium">
                  Open any Google Sheet and paste this formula into <strong>Cell A1</strong>. Google Sheets will continuously fetch and auto-update your sheet with live project submissions!
                </p>

                <div className="relative p-3 rounded-xl bg-white border border-emerald-300 font-mono text-[11px] text-slate-800 break-all select-all flex items-center justify-between gap-3">
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
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs">
                      2
                    </span>
                    <span>Method B: Instant Push Webhook (Google Apps Script)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] uppercase">
                    Realtime Push
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
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
                  <label className="font-bold text-slate-700 block">
                    Paste Deployed Apps Script Webhook URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs outline-none focus:border-[#0F9D58]"
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
                    <p className="text-emerald-700 font-bold text-[11px] flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Webhook URL saved successfully! New submissions will automatically push to your sheet.</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast Notification ────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── Modal 3: Open in Google Sheets Quick Paste Modal ──────────── */}
      {showOpenInSheetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#0F9D58] text-white">
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
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#0F9D58] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-emerald-900">
                    {submissions.length} Project Submission{submissions.length === 1 ? '' : 's'} Copied to Clipboard!
                  </div>
                  <p className="text-xs text-emerald-800/90 font-medium mt-0.5 leading-relaxed">
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
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                      1
                    </span>
                    <div>
                      <div className="font-extrabold text-slate-900">Switch to your new Google Sheet tab</div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        A blank Google Sheet tab was opened in your browser.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                    <span className="w-6 h-6 rounded-full bg-[#0099e6] text-white flex items-center justify-center text-xs font-black shrink-0">
                      2
                    </span>
                    <div>
                      <div className="font-extrabold text-slate-900">
                        Click on Cell <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200 font-black">A1</span> and press{' '}
                        <kbd className="px-2 py-0.5 bg-slate-900 text-white rounded font-mono text-[11px] font-bold">
                          ⌘ + V
                        </kbd>{' '}
                        or{' '}
                        <kbd className="px-2 py-0.5 bg-slate-900 text-white rounded font-mono text-[11px] font-bold">
                          Ctrl + V
                        </kbd>
                      </div>
                      <p className="text-sky-800 text-[11px] mt-0.5 font-medium">
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
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Download .CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.open('https://docs.google.com/spreadsheets/u/0/create', '_blank')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-slate-600" />
                  <span>Re-open Sheet Tab</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[11px]">
              <span>Tip: In Google Sheets, you can also use File → Import → Upload to import CSV</span>
              <button
                type="button"
                onClick={() => setShowOpenInSheetsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer"
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
