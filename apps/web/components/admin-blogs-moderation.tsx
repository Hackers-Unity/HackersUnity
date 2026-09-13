'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Check,
  X,
  Eye,
  Trash2,
  RefreshCw,
  Sparkles,
  User,
  Tag,
  Calendar,
  ExternalLink,
  AlertTriangle,
  Loader2,
  PenTool,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface AdminBlog {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  category: string;
  image: string;
  cover_gradient?: string;
  content: string[] | string;
  raw_markdown?: string;
  tags?: string[];
  read_time?: string;
  author_id?: string;
  author_name: string;
  author_email?: string;
  author_avatar?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DRAFT';
  admin_feedback?: string;
  featured?: boolean;
  views_count?: number;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
}

interface AdminBlogsModerationProps {
  onNotification: (msg: { type: 'success' | 'error'; text: string }) => void;
}

export function AdminBlogsModeration({ onNotification }: AdminBlogsModerationProps) {
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedBlog, setSelectedBlog] = useState<AdminBlog | null>(null);
  const [rejectModalBlog, setRejectModalBlog] = useState<AdminBlog | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [tableReady, setTableReady] = useState(true);
  const [dismissedNotice, setDismissedNotice] = useState(false);

  // Fetch blogs from API
  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-csap?resource=blogs');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setBlogs(data.blogs || []);
          setTableReady(data.tableReady !== false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin blogs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('public:admin_csap_blogs_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blogs' },
        () => {
          fetchBlogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBlogs]);

  // Approve blog
  const handleApprove = async (blog: AdminBlog) => {
    setActionLoadingId(blog.id);
    try {
      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_blog', blogId: blog.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onNotification({
          type: 'success',
          text: `✅ Blog "${blog.title}" has been APPROVED and is now live on /blogs!`,
        });
        setBlogs((prev) =>
          prev.map((b) =>
            b.id === blog.id
              ? { ...b, status: 'APPROVED', admin_feedback: undefined, reviewed_at: new Date().toISOString() }
              : b
          )
        );
        if (selectedBlog?.id === blog.id) {
          setSelectedBlog((prev) => (prev ? { ...prev, status: 'APPROVED', admin_feedback: undefined } : null));
        }
      } else {
        onNotification({
          type: 'error',
          text: data.error || 'Failed to approve blog',
        });
      }
    } catch (err: any) {
      onNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Move back to Pending Review
  const handleResetToPending = async (blog: AdminBlog) => {
    setActionLoadingId(blog.id);
    try {
      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pending_blog', blogId: blog.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onNotification({
          type: 'success',
          text: `↩ Blog "${blog.title}" moved back to Pending Review!`,
        });
        setBlogs((prev) =>
          prev.map((b) =>
            b.id === blog.id
              ? { ...b, status: 'PENDING_APPROVAL', admin_feedback: undefined, reviewed_at: undefined }
              : b
          )
        );
        if (selectedBlog?.id === blog.id) {
          setSelectedBlog((prev) => (prev ? { ...prev, status: 'PENDING_APPROVAL', admin_feedback: undefined } : null));
        }
      } else {
        onNotification({
          type: 'error',
          text: data.error || 'Failed to move blog to pending',
        });
      }
    } catch (err: any) {
      onNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject blog
  const handleRejectConfirm = async () => {
    if (!rejectModalBlog) return;
    setActionLoadingId(rejectModalBlog.id);
    try {
      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_blog',
          blogId: rejectModalBlog.id,
          feedback: rejectFeedback,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onNotification({
          type: 'success',
          text: `❌ Blog "${rejectModalBlog.title}" has been rejected.`,
        });
        setBlogs((prev) =>
          prev.map((b) =>
            b.id === rejectModalBlog.id
              ? { ...b, status: 'REJECTED', admin_feedback: rejectFeedback }
              : b
          )
        );
        setRejectModalBlog(null);
        setRejectFeedback('');
        if (selectedBlog?.id === rejectModalBlog.id) {
          setSelectedBlog((prev) =>
            prev ? { ...prev, status: 'REJECTED', admin_feedback: rejectFeedback } : null
          );
        }
      } else {
        onNotification({
          type: 'error',
          text: data.error || 'Failed to reject blog',
        });
      }
    } catch (err: any) {
      onNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete blog
  const handleDelete = async (blogId: string) => {
    if (!confirm('Are you sure you want to permanently delete this blog submission?')) return;
    setActionLoadingId(blogId);
    try {
      const res = await fetch(`/api/admin-csap?resource=blogs&blogId=${blogId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotification({ type: 'success', text: 'Blog deleted successfully.' });
        setBlogs((prev) => prev.filter((b) => b.id !== blogId));
        if (selectedBlog?.id === blogId) setSelectedBlog(null);
      } else {
        onNotification({ type: 'error', text: data.error || 'Failed to delete blog' });
      }
    } catch (err: any) {
      onNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: blogs.length,
      pending: blogs.filter((b) => b.status === 'PENDING_APPROVAL').length,
      approved: blogs.filter((b) => b.status === 'APPROVED').length,
      rejected: blogs.filter((b) => b.status === 'REJECTED').length,
    };
  }, [blogs]);

  // Filtered blogs list
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      // Status filter
      if (statusFilter === 'PENDING' && b.status !== 'PENDING_APPROVAL') return false;
      if (statusFilter === 'APPROVED' && b.status !== 'APPROVED') return false;
      if (statusFilter === 'REJECTED' && b.status !== 'REJECTED') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = b.title.toLowerCase().includes(q);
        const matchesAuthor = b.author_name.toLowerCase().includes(q) || (b.author_email || '').toLowerCase().includes(q);
        const matchesCat = b.category.toLowerCase().includes(q);
        const matchesTags = Array.isArray(b.tags) && b.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesAuthor && !matchesCat && !matchesTags) return false;
      }

      return true;
    });
  }, [blogs, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ─── Migration Notice (If table not created yet) ─────────── */}
      {!loading && !tableReady && blogs.length === 0 && !dismissedNotice && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Supabase `blogs` Table Setup Required</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please run the provided script{' '}
              <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono text-amber-700 dark:text-amber-300">
                apps/web/supabase/blogs-migration.sql
              </code>{' '}
              in your Supabase SQL Editor to enable full database persistence for community blogs.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchBlogs}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition cursor-pointer"
            >
              Check Again
            </button>
            <button
              type="button"
              onClick={() => setDismissedNotice(true)}
              className="p-1.5 rounded-xl hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition cursor-pointer"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Metric Cards (Matching Hackathon Stats Styling) ─────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Pending Review */}
        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer select-none ${
            statusFilter === 'PENDING'
              ? 'bg-amber-50/90 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'bg-white dark:bg-[#0c1017] border-slate-200/80 dark:border-white/[0.08] hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="w-8 h-8 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {stats.pending}
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Needs Action
            </span>
          </div>
        </div>

        {/* Live on Website (Approved) */}
        <div
          onClick={() => setStatusFilter('APPROVED')}
          className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer select-none ${
            statusFilter === 'APPROVED'
              ? 'bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'bg-white dark:bg-[#0c1017] border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              Live on Website
            </span>
            <div className="w-8 h-8 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {stats.approved}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Public
            </span>
          </div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer select-none ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-50/90 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/40 shadow-lg shadow-rose-500/10'
              : 'bg-white dark:bg-[#0c1017] border-slate-200/80 dark:border-white/[0.08] hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">
              Rejected
            </span>
            <div className="w-8 h-8 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {stats.rejected}
            </span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Hidden
            </span>
          </div>
        </div>

        {/* Total Applications */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer select-none ${
            statusFilter === 'ALL'
              ? 'bg-sky-50/90 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40 shadow-lg shadow-sky-500/10'
              : 'bg-white dark:bg-[#0c1017] border-slate-200/80 dark:border-white/[0.08] hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-sky-800 dark:text-sky-400 uppercase tracking-wider">
              Total Articles
            </span>
            <div className="w-8 h-8 rounded-2xl bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {stats.total}
            </span>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
              All Time
            </span>
          </div>
        </div>
      </div>

      {/* ─── Filter Tabs & Search Bar (Exact Style from Screenshot) ─────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              statusFilter === 'PENDING'
                ? 'bg-[#0099e6] text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <span>Pending Review</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {stats.pending}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              statusFilter === 'APPROVED'
                ? 'bg-[#0099e6] text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <span>Approved &amp; Live</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {stats.approved}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              statusFilter === 'REJECTED'
                ? 'bg-[#0099e6] text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <span>Rejected</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {stats.rejected}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-[#0099e6] text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <span>All Submissions</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {stats.total}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[280px] sm:min-w-[340px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, domain..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0099e6] transition-colors"
          />
        </div>
      </div>

      {/* ─── Blog Submissions List ──────────────────────────────────────── */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <Loader2 className="w-8 h-8 text-[#0099e6] animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading community blog submissions...</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/80 dark:border-white/[0.08] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-slate-400 mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No articles found in this view
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No blogs matching "${searchQuery}". Try clearing search.`
              : `There are currently no blogs matching the selected filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBlogs.map((blog) => {
            const isPending = blog.status === 'PENDING_APPROVAL';
            const isApproved = blog.status === 'APPROVED';
            const isRejected = blog.status === 'REJECTED';
            const isActionLoading = actionLoadingId === blog.id;

            return (
              <div
                key={blog.id}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Header tags: Status, Category, Submission Date */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.04] pb-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Pill */}
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        <span>Pending Approval</span>
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Live on Website</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-[11px] font-bold uppercase tracking-wider">
                        <XCircle className="w-3 h-3" />
                        <span>Rejected</span>
                      </span>
                    )}

                    {/* Domain category */}
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-[#0099e6] text-[11px] font-black uppercase tracking-wider">
                      {blog.category}
                    </span>

                    {blog.read_time && (
                      <span className="text-slate-400 text-xs font-mono">
                        • {blog.read_time}
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 font-medium">
                    Submitted{' '}
                    {blog.created_at
                      ? new Date(blog.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Recent'}
                  </span>
                </div>

                {/* Main Content Info */}
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  {/* Thumbnail */}
                  <div className="relative w-full sm:w-36 h-24 rounded-2xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 dark:border-white/10">
                    <Image
                      src={blog.image || '/blogs/agentic-ai.jpg'}
                      alt={blog.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>

                  {/* Title & Excerpt */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight line-clamp-1">
                      {blog.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {blog.subtitle || blog.excerpt}
                    </p>

                    {/* Author info */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-[#0099e6]" />
                        <span>Author: {blog.author_name}</span>
                      </div>
                      {blog.author_email && (
                        <span>({blog.author_email})</span>
                      )}
                      {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {blog.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Feedback note if rejected */}
                {blog.admin_feedback && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">
                    <strong>Admin Feedback:</strong> {blog.admin_feedback}
                  </div>
                )}

                {/* Actions Footer */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    {/* Review Details Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedBlog(blog)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Details</span>
                    </button>

                    {/* View Live (if approved) */}
                    {isApproved && (
                      <Link
                        href={`/blogs/${blog.slug}`}
                        target="_blank"
                        className="px-3 py-2 rounded-xl text-xs font-bold text-[#0099e6] hover:bg-sky-50 dark:hover:bg-sky-500/10 transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Live</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  {/* Approve / Reject Controls */}
                  <div className="flex items-center gap-2">
                    {/* Move to Pending (if rejected or approved) */}
                    {blog.status !== 'PENDING_APPROVAL' && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleResetToPending(blog)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        title="Move back to Pending Review"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Move to Pending</span>
                      </button>
                    )}

                    {/* Reject */}
                    {blog.status !== 'REJECTED' && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => {
                          setRejectModalBlog(blog);
                          setRejectFeedback('');
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}

                    {/* Approve */}
                    {blog.status !== 'APPROVED' && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleApprove(blog)}
                        className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs font-bold shadow-md shadow-sky-500/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Approve</span>
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleDelete(blog.id)}
                      title="Permanently Delete Blog"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
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

      {/* ─── Review Details Modal ────────────────────────────────────────── */}
      {selectedBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div
            className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Cover */}
            <div className="relative h-52 sm:h-64 w-full bg-slate-900">
              <Image
                src={selectedBlog.image || '/blogs/agentic-ai.jpg'}
                alt={selectedBlog.title}
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1017] via-black/40 to-transparent" />

              <button
                type="button"
                onClick={() => setSelectedBlog(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 space-y-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0099e6] text-white">
                  {selectedBlog.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {selectedBlog.title}
                </h2>
              </div>
            </div>

            {/* Author info & Metadata */}
            <div className="px-6 sm:px-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-b border-slate-100 dark:border-white/[0.06] pb-4">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Author: {selectedBlog.author_name}
                  </p>
                  {selectedBlog.author_email && (
                    <p className="text-slate-400">{selectedBlog.author_email}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-slate-100 dark:bg-white/[0.04]">
                    Status: {selectedBlog.status}
                  </span>
                </div>
              </div>

              {selectedBlog.subtitle && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  💡 {selectedBlog.subtitle}
                </div>
              )}

              {/* Full Content Body */}
              <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans py-2">
                {Array.isArray(selectedBlog.content) ? (
                  selectedBlog.content.map((p, i) => {
                    const str = typeof p === 'string' ? p : JSON.stringify(p);
                    if (str.startsWith('### ')) {
                      return (
                        <h4 key={i} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pt-2">
                          {str.replace('### ', '')}
                        </h4>
                      );
                    }
                    if (str.startsWith('## ')) {
                      return (
                        <h3 key={i} className="text-lg sm:text-xl font-black text-slate-900 dark:text-white pt-3">
                          {str.replace('## ', '')}
                        </h3>
                      );
                    }
                    if (str.startsWith('```')) {
                      return (
                        <pre key={i} className="p-4 rounded-2xl bg-slate-950 text-sky-300 text-xs font-mono overflow-x-auto border border-slate-800">
                          <code>{str.replace(/```[a-z]*\n?/gi, '')}</code>
                        </pre>
                      );
                    }
                    return <p key={i}>{str}</p>;
                  })
                ) : (
                  <p>{selectedBlog.content}</p>
                )}
              </div>

              {/* Tags */}
              {Array.isArray(selectedBlog.tags) && selectedBlog.tags.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  {selectedBlog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] text-[11px] font-mono text-slate-500"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 p-4 sm:p-6 bg-white/95 dark:bg-[#0c1017]/95 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedBlog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2">
                {selectedBlog.status !== 'PENDING_APPROVAL' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleResetToPending(selectedBlog);
                      setSelectedBlog(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Move to Pending</span>
                  </button>
                )}
                {selectedBlog.status !== 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRejectModalBlog(selectedBlog);
                      setSelectedBlog(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
                  >
                    Reject Article
                  </button>
                )}
                {selectedBlog.status !== 'APPROVED' && (
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedBlog)}
                    className="px-6 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs font-bold shadow-md shadow-sky-500/20 transition cursor-pointer"
                  >
                    Approve &amp; Publish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject Feedback Modal ──────────────────────────────────────── */}
      {rejectModalBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div
            className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Reject Blog Article</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalBlog(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Provide feedback for &quot;
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {rejectModalBlog.title}
              </span>
              &quot;.
            </p>

            <textarea
              rows={4}
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              placeholder="e.g. Please format code snippets, add architectural diagrams, or avoid promotional tone..."
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalBlog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
