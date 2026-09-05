'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Rocket,
  X,
  Github,
  Video,
  Archive,
  Presentation,
  Link2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ExternalLink,
  Sparkles,
  UploadCloud,
  FileCheck,
  Trash2,
  Edit3,
  Layers,
  User,
  Mail,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  ProjectSubmission,
  getProjectSubmission,
} from '@/lib/storage';
import {
  saveSubmissionSupabase,
  deleteSubmissionSupabase,
} from '@/lib/supabase-service';

interface ProjectSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  tracks?: string[];
  onSuccess?: () => void;
  onDelete?: () => void;
}

export function ProjectSubmissionModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  tracks = [],
  onSuccess,
  onDelete,
}: ProjectSubmissionModalProps) {
  const { user, supabaseUser } = useAuth();
  const currentUserId = supabaseUser?.id || user?.id || 'usr_builder';
  const currentUserName = user?.name || supabaseUser?.user_metadata?.name || 'Hacker Builder';
  const currentUserEmail = supabaseUser?.email || user?.email || '';

  // Form Fields State
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [track, setTrack] = useState('');
  const [description, setDescription] = useState('');
  const [projectLink, setProjectLink] = useState('');
  const [demoVideoUrl, setDemoVideoUrl] = useState('');
  const [presentationUrl, setPresentationUrl] = useState('');
  const [additionalResources, setAdditionalResources] = useState('');
  const [submitterName, setSubmitterName] = useState('');

  // File Upload State (Optional ZIP file)
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipFileName, setZipFileName] = useState<string>('');
  const [zipFileSize, setZipFileSize] = useState<string>('');
  const [isDraggingZip, setIsDraggingZip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Validation State
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState<ProjectSubmission | null>(null);

  // Default track options if none passed
  const trackOptions = tracks.length > 0 ? tracks : [
    'Open Innovation & DeepTech',
    'AI Agents & Intelligent Systems',
    'Web3 & Decentralized Primitives',
    'Cloud, DevOps & Systems',
    'FinTech & Consumer Applications',
  ];

  // Load existing submission if already submitted
  useEffect(() => {
    if (!isOpen) return;
    const existing = getProjectSubmission(eventId, currentUserId);
    if (existing) {
      setTitle(existing.projectTitle);
      setTagline(existing.tagline || '');
      setTrack(existing.track || trackOptions[0] || 'General');
      setDescription(existing.projectDescription);
      setProjectLink(existing.projectLink);
      setDemoVideoUrl(existing.demoVideoUrl || '');
      setPresentationUrl(existing.presentationUrl || '');
      setAdditionalResources(existing.additionalResources || '');
      setZipFileName(existing.zipFileName || '');
      setZipFileSize(existing.zipFileSize || '');
      setSubmitterName(existing.submittedByName || currentUserName);
      setSubmissionData(existing);
      setIsSubmitted(true);
    } else {
      setTitle('');
      setTagline('');
      setTrack(trackOptions[0] || 'General');
      setDescription('');
      setProjectLink('');
      setDemoVideoUrl('');
      setPresentationUrl('');
      setAdditionalResources('');
      setZipFileName('');
      setZipFileSize('');
      setSubmitterName(currentUserName);
      setIsSubmitted(false);
      setSubmissionData(null);
    }
    setErrors({});
    setTouched({});
    setShowDeleteConfirm(false);
  }, [isOpen, eventId, currentUserId, currentUserName]);

  // Validation function
  const validate = () => {
    const errs: Record<string, string> = {};

    // 1. Required: Project Title
    if (!title.trim()) {
      errs.title = 'Project Title is required';
    } else if (title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters';
    }

    // 2. Required: Project Description
    if (!description.trim()) {
      errs.description = 'Project Description is required';
    } else if (description.trim().length < 20) {
      errs.description = 'Description should be at least 20 characters explaining your prototype';
    }

    // 3. Required: Project Link / GitHub Repo Link
    if (!projectLink.trim()) {
      errs.projectLink = 'Project link or GitHub repository URL is required';
    } else if (!/^https?:\/\/.+/i.test(projectLink.trim())) {
      errs.projectLink = 'Please enter a valid URL starting with http:// or https://';
    }

    // 4. Optional: Demo Video URL (if provided, must be valid URL)
    if (demoVideoUrl.trim() && !/^https?:\/\/.+/i.test(demoVideoUrl.trim())) {
      errs.demoVideoUrl = 'Please enter a valid video link (e.g. YouTube, Loom, Drive)';
    }

    // 5. Optional: Presentation URL (if provided, must be valid URL)
    if (presentationUrl.trim() && !/^https?:\/\/.+/i.test(presentationUrl.trim())) {
      errs.presentationUrl = 'Please enter a valid presentation or slide deck URL';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  const handleZipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setZipFile(file);
      setZipFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setZipFileSize(`${sizeMb} MB`);
    }
  };

  const handleZipDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingZip(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setZipFile(file);
      setZipFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setZipFileSize(`${sizeMb} MB`);
    }
  };

  const removeZipFile = () => {
    setZipFile(null);
    setZipFileName('');
    setZipFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      title: true,
      description: true,
      projectLink: true,
      demoVideoUrl: true,
      presentationUrl: true,
    });

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const newSubmission: ProjectSubmission = {
        id: submissionData?.id || `sub_${Date.now()}`,
        eventId,
        eventName,
        submittedBy: currentUserId,
        submittedByName: submitterName.trim() || currentUserName,
        submittedByEmail: currentUserEmail,
        submittedAt: submissionData?.submittedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectTitle: title.trim(),
        tagline: tagline.trim() || undefined,
        track: track || trackOptions[0] || 'General',
        projectDescription: description.trim(),
        projectLink: projectLink.trim(),
        demoVideoUrl: demoVideoUrl.trim() || undefined,
        zipFileName: zipFileName || undefined,
        zipFileSize: zipFileSize || undefined,
        presentationUrl: presentationUrl.trim() || undefined,
        additionalResources: additionalResources.trim() || undefined,
        status: submissionData?.status || 'SUBMITTED',
        score: submissionData?.score || 0,
      };

      await saveSubmissionSupabase(newSubmission);
      setSubmissionData(newSubmission);
      setIsSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!submissionData) return;
    setIsDeleting(true);
    try {
      await deleteSubmissionSupabase(submissionData.id, eventId);
      setIsSubmitted(false);
      setSubmissionData(null);
      setTitle('');
      setTagline('');
      setDescription('');
      setProjectLink('');
      setDemoVideoUrl('');
      setPresentationUrl('');
      setAdditionalResources('');
      setZipFileName('');
      setZipFileSize('');
      setShowDeleteConfirm(false);
      if (onDelete) onDelete();
    } catch (err) {
      console.error('Error deleting submission:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-sky-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0099e6] text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Project Submission Portal
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-[#0099e6] uppercase">
                  Live Builder Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-sm sm:max-w-md">
                {eventName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div className="p-6 bg-rose-50 border-b border-rose-200 text-slate-900 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 font-black text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Confirm Project Submission Deletion?</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed font-medium">
              Are you sure you want to withdraw and delete your submission for{' '}
              <strong>&ldquo;{submissionData?.projectTitle}&rdquo;</strong>? This will remove your prototype from the judges review roster.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Yes, Delete Submission</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Informational Guidance Banner */}
        {!isSubmitted && (
          <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-800 font-medium">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Review all deliverables carefully. Red badges indicate mandatory fields.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black uppercase">
                Required *
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                Optional
              </span>
            </div>
          </div>
        )}

        {/* ─── Success / Already Submitted Confirmation View ─────────── */}
        {isSubmitted && submissionData ? (
          <div className="p-6 sm:p-8 space-y-6 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl sm:text-2xl font-black text-slate-900">
                Project Successfully Submitted!
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Your prototype is recorded and ready for organizer evaluation.
              </p>
            </div>

            {/* Submitted Summary Card */}
            <div className="text-left bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Project Title</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{submissionData.projectTitle}</div>
                  {submissionData.tagline && (
                    <p className="text-xs text-[#0099e6] font-semibold mt-0.5">{submissionData.tagline}</p>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                  submissionData.status === 'WINNER'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : submissionData.status === 'ACCEPTED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : submissionData.status === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-sky-100 text-[#0099e6] border-sky-300'
                }`}>
                  STATUS: {submissionData.status || 'SUBMITTED'}
                </span>
              </div>

              {submissionData.track && (
                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                  <Layers className="w-3.5 h-3.5 text-[#0099e6]" />
                  <span className="font-bold">Track:</span>
                  <span className="font-semibold text-slate-900">{submissionData.track}</span>
                </div>
              )}

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Description</div>
                <p className="text-slate-700 font-medium mt-1 line-clamp-3 leading-relaxed whitespace-pre-line">
                  {submissionData.projectDescription}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Repository / Live Link</div>
                  <a
                    href={submissionData.projectLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0099e6] font-bold flex items-center gap-1 hover:underline truncate mt-0.5"
                  >
                    <Github className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{submissionData.projectLink}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                {submissionData.demoVideoUrl && (
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Demo Video</div>
                    <a
                      href={submissionData.demoVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#ea580c] font-bold flex items-center gap-1 hover:underline truncate mt-0.5"
                    >
                      <Video className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{submissionData.demoVideoUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              {(submissionData.zipFileName || submissionData.presentationUrl) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                  {submissionData.zipFileName && (
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold text-slate-700">{submissionData.zipFileName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({submissionData.zipFileSize})</span>
                    </div>
                  )}
                  {submissionData.presentationUrl && (
                    <a
                      href={submissionData.presentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-700 font-bold flex items-center gap-1 hover:underline truncate"
                    >
                      <Presentation className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">Slide Deck / PPT</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#0099e6]" />
                <span>Edit Submission Details</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Submission</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                Close Portal
              </button>
            </div>
          </div>
        ) : (
          /* ─── Active Submission / Edit Form ───────────────────────── */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Section 1: Required Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-[#0099e6]" />
                  <span>Mandatory Project Details</span>
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[10px] font-black border border-rose-200 uppercase">
                  Required
                </span>
              </div>

              {/* 1. Project Title (Required) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Project Title <span className="text-rose-500">*</span>
                  </label>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-black uppercase">
                    Required
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. NeuroSync - Autonomous Multi-Agent Workspace"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) validate();
                  }}
                  onBlur={() => handleBlur('title')}
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 ${
                    touched.title && errors.title
                      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                      : 'border-slate-200 focus:border-[#0099e6] focus:bg-white'
                  }`}
                />
                {touched.title && errors.title && (
                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.title}</span>
                  </p>
                )}
              </div>

              {/* 2. Tagline / Pitch (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" />
                  <span>One-Line Tagline / Elevator Pitch</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zero-latency collaboration engine for high-velocity teams"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0099e6] focus:bg-white text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* 3. Track Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>Competition Track</span>
                </label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0099e6] focus:bg-white text-xs text-slate-900 outline-none transition-all cursor-pointer"
                >
                  {trackOptions.map((t, idx) => (
                    <option key={idx} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Project Description (Required) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Detailed Project Description <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {description.length} chars (min 20)
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Describe the problem, your architecture, tech stack used, challenges faced, and how your prototype solves the issue..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) validate();
                  }}
                  onBlur={() => handleBlur('description')}
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 resize-none leading-relaxed ${
                    touched.description && errors.description
                      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                      : 'border-slate-200 focus:border-[#0099e6] focus:bg-white'
                  }`}
                />
                {touched.description && errors.description && (
                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.description}</span>
                  </p>
                )}
              </div>

              {/* 5. Project Link / GitHub (Required) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-slate-900" />
                    <span>GitHub Repository or Live Production Link <span className="text-rose-500">*</span></span>
                  </label>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-black uppercase">
                    Required
                  </span>
                </div>
                <input
                  type="url"
                  placeholder="https://github.com/username/project-name or https://myproject.vercel.app"
                  value={projectLink}
                  onChange={(e) => {
                    setProjectLink(e.target.value);
                    if (errors.projectLink) validate();
                  }}
                  onBlur={() => handleBlur('projectLink')}
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 ${
                    touched.projectLink && errors.projectLink
                      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                      : 'border-slate-200 focus:border-[#0099e6] focus:bg-white'
                  }`}
                />
                {touched.projectLink && errors.projectLink && (
                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.projectLink}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Section 2: Optional Deliverables */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#ea580c]" />
                  <span>Optional Supporting Deliverables</span>
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                  Optional
                </span>
              </div>

              {/* Submitter Name Override */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Submitter / Team Lead Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0099e6] focus:bg-white text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Demo Video URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>Demo Video Walkthrough (Loom / YouTube / Drive)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or Loom URL"
                  value={demoVideoUrl}
                  onChange={(e) => setDemoVideoUrl(e.target.value)}
                  onBlur={() => handleBlur('demoVideoUrl')}
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 ${
                    touched.demoVideoUrl && errors.demoVideoUrl
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-slate-200 focus:border-[#0099e6] focus:bg-white'
                  }`}
                />
                {touched.demoVideoUrl && errors.demoVideoUrl && (
                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.demoVideoUrl}</span>
                  </p>
                )}
              </div>

              {/* Presentation / PPT URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Presentation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Presentation / Pitch Deck (Google Slides / Canva / Pitch.com)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/presentation/... or Canva link"
                  value={presentationUrl}
                  onChange={(e) => setPresentationUrl(e.target.value)}
                  onBlur={() => handleBlur('presentationUrl')}
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 ${
                    touched.presentationUrl && errors.presentationUrl
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-slate-200 focus:border-[#0099e6] focus:bg-white'
                  }`}
                />
                {touched.presentationUrl && errors.presentationUrl && (
                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.presentationUrl}</span>
                  </p>
                )}
              </div>

              {/* ZIP File Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Archive className="w-3.5 h-3.5 text-sky-600" />
                  <span>Offline Source Code / ZIP Archive</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleZipSelect}
                  accept=".zip,.tar,.gz,.rar,.7z"
                  className="hidden"
                />
                {zipFileName ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Archive className="w-4 h-4 text-[#0099e6] shrink-0" />
                      <span className="font-bold text-slate-900 truncate">{zipFileName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({zipFileSize})</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeZipFile}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingZip(true);
                    }}
                    onDragLeave={() => setIsDraggingZip(false)}
                    onDrop={handleZipDrop}
                    className={`p-4 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer ${
                      isDraggingZip
                        ? 'border-[#0099e6] bg-sky-50/50'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <UploadCloud className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <div className="text-xs font-bold text-slate-700">
                      Click to upload ZIP or drag and drop
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Supports .zip, .tar.gz up to 50MB
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Resources */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Supplemental Notes & Research Links</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Figma prototypes, smart contracts, API docs, dataset sources, or research papers..."
                  value={additionalResources}
                  onChange={(e) => setAdditionalResources(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0099e6] focus:bg-white text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
              {submissionData ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{submissionData ? 'Updating...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      <span>{submissionData ? 'Save Changes' : 'Submit Project Now'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
