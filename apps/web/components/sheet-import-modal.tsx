'use client';

import { useState, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Github,
  Video,
  Presentation,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  ClipboardPaste,
  RefreshCw,
} from 'lucide-react';
import { ProjectSubmission, saveProjectSubmission } from '@/lib/storage';

interface SheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  availableTracks?: string[];
  onSuccess: (importedSubmissions: ProjectSubmission[]) => void;
}

interface ParsedSubmissionRow {
  projectTitle: string;
  tagline?: string;
  submitterName: string;
  submitterEmail?: string;
  teamName?: string;
  track: string;
  projectLink: string;
  demoVideoUrl?: string;
  presentationUrl?: string;
  projectDescription: string;
  additionalResources?: string;
  valid: boolean;
  error?: string;
}

export function SheetImportModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  availableTracks = ['General', 'AI & Web3', 'Software Development', 'Open Innovation'],
  onSuccess,
}: SheetImportModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [defaultTrack, setDefaultTrack] = useState<string>(availableTracks[0] || 'General');
  const [parsedRows, setParsedRows] = useState<ParsedSubmissionRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Split line respecting double quotes (RFC 4180 standard)
  const parseCSVRow = (text: string, delimiter: string = ','): string[] => {
    const row: string[] = [];
    let inQuotes = false;
    let currentField = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    row.push(currentField.trim());
    return row;
  };

  const parseRawContent = (content: string) => {
    setParseError(null);
    const cleaned = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!cleaned) {
      setParsedRows([]);
      setDetectedHeaders([]);
      return;
    }

    const lines = cleaned.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setParsedRows([]);
      setDetectedHeaders([]);
      return;
    }

    // Detect delimiter: tab (Sheets copy), comma (CSV), semicolon
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ';';

    const rawHeaderRow = parseCSVRow(lines[0], delimiter).map((h) =>
      h.replace(/^["']|["']$/g, '').trim()
    );
    const lowerHeaderRow = rawHeaderRow.map((h) => h.toLowerCase());
    setDetectedHeaders(rawHeaderRow);

    // Helper to find column index by matching aliases
    const findIndex = (aliases: string[]) =>
      lowerHeaderRow.findIndex((h) => aliases.some((a) => h === a || h.includes(a)));

    let titleIdx = findIndex(['project title', 'project name', 'title', 'name of project', 'idea title', 'idea name', 'project', 'topic', 'submission title']);
    let nameIdx = findIndex(['submitter name', 'submitter', 'team leader name', 'team leader', 'leader name', 'full name', 'candidate name', 'participant name', 'student name', 'your name', 'name', 'leader', 'lead']);
    let emailIdx = findIndex(['email address', 'email', 'submitter email', 'leader email', 'participant email', 'student email', 'mail', 'e-mail']);
    let teamIdx = findIndex(['team name', 'squad name', 'team', 'squad', 'group name', 'team id']);
    let trackIdx = findIndex(['track', 'category', 'domain', 'problem statement', 'theme', 'challenge', 'ps', 'topic area']);
    let repoIdx = findIndex(['github repo', 'github repository', 'github url', 'github link', 'github', 'repo link', 'repository link', 'repository', 'repo url', 'code repository', 'source code', 'project link', 'repo', 'code link']);
    let demoIdx = findIndex(['demo video', 'demo video url', 'demo video link', 'youtube video', 'youtube link', 'loom video', 'loom link', 'video link', 'demo url', 'video url', 'demo link', 'prototype link', 'video', 'demo']);
    let deckIdx = findIndex(['pitch deck', 'presentation link', 'presentation url', 'pitch deck link', 'presentation', 'deck link', 'deck url', 'deck', 'slides link', 'slides url', 'slides', 'ppt link', 'ppt', 'canva link', 'google slides']);
    let descIdx = findIndex(['project description', 'description', 'brief description', 'abstract', 'about project', 'summary', 'overview', 'about the project', 'details']);
    let taglineIdx = findIndex(['tagline', 'one liner', 'short description', 'sub-title', 'subtitle', 'catchphrase']);
    let resourcesIdx = findIndex(['drive link', 'google drive', 'drive url', 'drive', 'zip file link', 'zip file', 'additional resources', 'resource link', 'document link', 'resources']);

    // Check if first line was a header or direct data
    const hasHeader = titleIdx !== -1 || nameIdx !== -1 || emailIdx !== -1 || repoIdx !== -1;
    const startIndex = hasHeader ? 1 : 0;

    // Scan sample data rows (up to 15) for heuristic fallback if columns missing
    if (lines.length > startIndex) {
      const sampleValues = lines.slice(startIndex, Math.min(startIndex + 15, lines.length)).map((l) => parseCSVRow(l, delimiter));

      // Check for repo link by scanning values
      if (repoIdx === -1) {
        for (let col = 0; col < rawHeaderRow.length; col++) {
          const matchCount = sampleValues.filter((row) => (row[col] || '').toLowerCase().includes('github.com') || (row[col] || '').toLowerCase().includes('gitlab.com')).length;
          if (matchCount >= 1) {
            repoIdx = col;
            break;
          }
        }
      }

      // Check for demo link (youtube/loom)
      if (demoIdx === -1) {
        for (let col = 0; col < rawHeaderRow.length; col++) {
          const matchCount = sampleValues.filter((row) => {
            const v = (row[col] || '').toLowerCase();
            return v.includes('youtu.be') || v.includes('youtube.com') || v.includes('loom.com') || v.includes('vimeo.com');
          }).length;
          if (matchCount >= 1) {
            demoIdx = col;
            break;
          }
        }
      }

      // Check for email format
      if (emailIdx === -1) {
        for (let col = 0; col < rawHeaderRow.length; col++) {
          const matchCount = sampleValues.filter((row) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((row[col] || '').trim())).length;
          if (matchCount >= 1) {
            emailIdx = col;
            break;
          }
        }
      }

      // Check for deck link (drive/canva/slides)
      if (deckIdx === -1) {
        for (let col = 0; col < rawHeaderRow.length; col++) {
          const matchCount = sampleValues.filter((row) => {
            const v = (row[col] || '').toLowerCase();
            return v.includes('canva.com') || v.includes('docs.google.com/presentation') || (v.includes('drive.google.com') && col !== resourcesIdx);
          }).length;
          if (matchCount >= 1) {
            deckIdx = col;
            break;
          }
        }
      }
    }

    setColumnMapping({
      title: titleIdx,
      submitterName: nameIdx,
      submitterEmail: emailIdx,
      teamName: teamIdx,
      track: trackIdx,
      projectLink: repoIdx,
      demoVideoUrl: demoIdx,
      presentationUrl: deckIdx,
      description: descIdx,
      tagline: taglineIdx,
      resources: resourcesIdx,
    });

    const results: ParsedSubmissionRow[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const values = parseCSVRow(lines[i], delimiter).map((v) =>
        v.replace(/^["']|["']$/g, '').trim()
      );

      if (values.every((v) => !v)) continue;

      let projectTitle = titleIdx !== -1 ? values[titleIdx] || '' : '';
      let submitterName = nameIdx !== -1 ? values[nameIdx] || '' : '';
      let submitterEmail = emailIdx !== -1 ? values[emailIdx] || '' : '';
      let teamName = teamIdx !== -1 ? values[teamIdx] || '' : '';
      let track = trackIdx !== -1 ? values[trackIdx] || '' : '';
      let projectLink = repoIdx !== -1 ? values[repoIdx] || '' : '';
      let demoVideoUrl = demoIdx !== -1 ? values[demoIdx] || '' : '';
      let presentationUrl = deckIdx !== -1 ? values[deckIdx] || '' : '';
      let projectDescription = descIdx !== -1 ? values[descIdx] || '' : '';
      let tagline = taglineIdx !== -1 ? values[taglineIdx] || '' : '';
      let additionalResources = resourcesIdx !== -1 ? values[resourcesIdx] || '' : '';

      // Fallback if positional (no header match)
      if (!hasHeader) {
        projectTitle = values[0] || '';
        submitterName = values[1] || '';
        submitterEmail = values[2] || '';
        track = values[3] || defaultTrack;
        projectLink = values[4] || '';
        demoVideoUrl = values[5] || '';
        presentationUrl = values[6] || '';
        projectDescription = values[7] || '';
      }

      // If project title missing, synthesize from teamName or repo name
      if (!projectTitle && repoIdx !== -1 && projectLink) {
        try {
          const parts = projectLink.replace(/\/$/, '').split('/');
          projectTitle = parts[parts.length - 1] || 'Imported Project';
        } catch {}
      }
      if (!projectTitle && teamName) {
        projectTitle = `${teamName}'s Project`;
      }
      if (!projectTitle && submitterName) {
        projectTitle = `${submitterName}'s Submission`;
      }

      if (!submitterName && submitterEmail) {
        submitterName = submitterEmail.split('@')[0];
      }

      // Normalize track against available tracks if close
      if (!track) {
        track = defaultTrack;
      } else {
        const matchedTrack = availableTracks.find(
          (t) => t.toLowerCase() === track.toLowerCase() || track.toLowerCase().includes(t.toLowerCase())
        );
        if (matchedTrack) track = matchedTrack;
      }

      let isValid = Boolean(projectTitle && projectTitle.trim().length > 0);
      let error = '';
      if (!isValid) {
        error = 'Missing project title';
      }

      results.push({
        projectTitle: projectTitle.trim(),
        tagline: tagline.trim() || undefined,
        submitterName: submitterName.trim() || 'Hacker',
        submitterEmail: submitterEmail.trim() || undefined,
        teamName: teamName.trim() || undefined,
        track: track.trim(),
        projectLink: projectLink.trim(),
        demoVideoUrl: demoVideoUrl.trim() || undefined,
        presentationUrl: presentationUrl.trim() || undefined,
        projectDescription: projectDescription.trim() || `${projectTitle} submission for ${eventName}.`,
        additionalResources: additionalResources.trim() || undefined,
        valid: isValid,
        error: error || undefined,
      });
    }

    if (results.length === 0) {
      setParseError('Could not detect any valid project rows. Please check file format or column layout.');
    }

    setParsedRows(results);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseRawContent(text);
    };
    reader.onerror = () => {
      setParseError('Failed to read file. Please ensure it is a valid text/csv format.');
    };
    reader.readAsText(uploadedFile);
  };

  const handlePastedContent = (text: string) => {
    setPastedText(text);
    parseRawContent(text);
  };

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.filter((r) => !r.valid).length;

  const handleImport = async () => {
    if (validCount === 0) return;

    setIsProcessing(true);
    try {
      const validCandidates = parsedRows.filter((r) => r.valid);
      const generatedSubmissions: ProjectSubmission[] = validCandidates.map((row, idx) => {
        const subId = `sub_import_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
        return {
          id: subId,
          eventId,
          eventName,
          submittedBy: row.submitterEmail || `builder_${idx}`,
          submittedByName: row.submitterName,
          submittedByEmail: row.submitterEmail || '',
          submittedAt: new Date(Date.now() - idx * 60000).toISOString(),
          updatedAt: new Date().toISOString(),
          projectTitle: row.projectTitle,
          tagline: row.tagline,
          track: row.track,
          projectDescription: row.projectDescription,
          projectLink: row.projectLink,
          demoVideoUrl: row.demoVideoUrl,
          presentationUrl: row.presentationUrl,
          additionalResources: row.additionalResources,
          teamName: row.teamName,
          status: 'SUBMITTED',
          score: 0,
        };
      });

      // 1. Instant local persistence for each submission
      generatedSubmissions.forEach((sub) => {
        saveProjectSubmission(sub);
      });

      // 2. Synchronize to server API / Supabase batch endpoint
      try {
        await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'batch_import',
            eventId,
            submissions: generatedSubmissions,
          }),
        });
      } catch (apiErr) {
        console.warn('Backend batch submission sync warning (client saved):', apiErr);
      }

      onSuccess(generatedSubmissions);
      onClose();
    } catch (err: any) {
      setParseError(err.message || 'Import failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0c1017] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Upload &amp; Auto-Organize Sheet
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/25">
                  AI Auto-Parser
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload Google Sheets / Excel CSV to automatically map projects, tracks, and links.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Tabs: Upload File vs Paste Sheet */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Upload CSV / Excel File</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <ClipboardPaste className="w-4 h-4 text-[#0099e6]" />
              <span>Paste from Google Sheets / Excel</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-500/40 dark:border-emerald-500/30 hover:border-emerald-500 dark:hover:border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 rounded-2xl p-7 text-center transition-all cursor-pointer space-y-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-white">
                    {file ? file.name : 'Click to select or drag & drop CSV file here'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Supports Google Sheets exports, Excel CSV, and TSV files
                  </p>
                </div>
                {file && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>File Loaded ({(file.size / 1024).toFixed(1)} KB)</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Paste Input */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Direct Paste from Google Sheets or Excel:</span>
                <span className="text-[11px] text-slate-400 font-mono">Press Ctrl+V / Cmd+V below</span>
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => handlePastedContent(e.target.value)}
                placeholder="Copy rows from your Google Sheet (including the header row) and paste here...&#10;Example:&#10;Project Title&#9;Submitter&#9;Email&#9;Track&#9;GitHub Link&#9;Demo Link"
                rows={6}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0099e6]/40"
              />
            </div>
          )}

          {/* Fallback Track Selector */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
            <div>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                Default Track for Unassigned Rows:
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Applied automatically if a row doesn&apos;t specify a competition track.
              </span>
            </div>
            <select
              value={defaultTrack}
              onChange={(e) => {
                setDefaultTrack(e.target.value);
                if (file || pastedText) {
                  const content = activeTab === 'paste' ? pastedText : '';
                  if (content) parseRawContent(content);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.1] text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              {availableTracks.map((tr) => (
                <option key={tr} value={tr}>
                  {tr}
                </option>
              ))}
            </select>
          </div>

          {/* Parse Errors */}
          {parseError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Detected Summary */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent border border-emerald-500/20">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                    {validCount} Project{validCount === 1 ? '' : 's'} Detected &amp; Ready to Import
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                      {invalidCount} incomplete skipped
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMapping(!showMapping)}
                  className="text-xs font-bold text-[#0099e6] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{showMapping ? 'Hide' : 'Inspect'} Detected Columns</span>
                  {showMapping ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Column Mapping Details */}
              {showMapping && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-2.5 text-xs">
                  <div className="font-extrabold text-slate-700 dark:text-slate-300">
                    Auto-Mapped Columns from your Sheet:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(columnMapping).map(([field, colIdx]) => (
                      <div
                        key={field}
                        className="p-2 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between"
                      >
                        <span className="text-[11px] font-bold text-slate-500 capitalize">
                          {field.replace(/([A-Z])/g, ' $1')}:
                        </span>
                        <span
                          className={`text-[11px] font-mono font-extrabold ${
                            colIdx >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {colIdx >= 0 && detectedHeaders[colIdx] ? detectedHeaders[colIdx] : 'Unset'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Preview Cards (first 3-4 projects) */}
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Data Preview (First {Math.min(4, validCount)} Projects):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {parsedRows.slice(0, 4).map((row, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200/80 dark:border-white/[0.08] space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                            {row.projectTitle}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            By {row.submitterName} {row.submitterEmail ? `(${row.submitterEmail})` : ''}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] text-[10px] font-black shrink-0 border border-sky-100 dark:border-sky-800/40">
                          {row.track}
                        </span>
                      </div>

                      {/* Links row */}
                      <div className="flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-white/[0.06] text-[11px] text-slate-500">
                        {row.projectLink ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <Github className="w-3 h-3" /> Repo
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">No Repo</span>
                        )}
                        {row.demoVideoUrl ? (
                          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold">
                            <Video className="w-3 h-3" /> Demo
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">No Demo</span>
                        )}
                        {row.presentationUrl ? (
                          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
                            <Presentation className="w-3 h-3" /> Deck
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">No Deck</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0c1017]/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={validCount === 0 || isProcessing}
            className={`px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md ${
              validCount > 0 && !isProcessing
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25 cursor-pointer'
                : 'bg-slate-200 dark:bg-white/[0.08] text-slate-400 cursor-not-allowed opacity-75'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Importing &amp; Organizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Import &amp; Organize {validCount > 0 ? `(${validCount} Projects)` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

