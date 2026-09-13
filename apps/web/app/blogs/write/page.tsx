'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  PenTool,
  Sparkles,
  Image as ImageIcon,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Link as LinkIcon,
  Eye,
  Edit3,
  Send,
  CheckCircle2,
  Clock,
  Tag,
  HelpCircle,
  Layers,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const DOMAINS = [
  'Agentic AI',
  'Space Domain',
  'Web3',
  'IoT',
  'Cybersecurity',
  'Cloud',
] as const;

const PRESET_BANNERS = [
  {
    label: 'Agentic AI',
    url: '/blogs/agentic-ai.jpg',
    category: 'Agentic AI',
  },
  {
    label: 'SpaceTech Cosmos',
    url: '/blogs/space-domain.jpg',
    category: 'Space Domain',
  },
  {
    label: 'Web3 & ZK Rollups',
    url: '/blogs/web3.jpg',
    category: 'Web3',
  },
  {
    label: 'Edge IoT Nodes',
    url: '/blogs/iot.jpg',
    category: 'IoT',
  },
  {
    label: 'Zero-Trust Defense',
    url: '/blogs/cybersecurity.jpg',
    category: 'Cybersecurity',
  },
  {
    label: 'Cloud Resilience',
    url: '/blogs/cloud.jpg',
    category: 'Cloud',
  },
];

export default function WriteBlogPage() {
  const router = useRouter();
  const { user, supabaseUser } = useAuth();

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<string>('Agentic AI');
  const [bannerUrl, setBannerUrl] = useState(PRESET_BANNERS[0].url);
  const [content, setContent] = useState(
    '### Introduction\n\nShare what problem this tech playbook solves, why it matters in production, and key architectural decisions.\n\n### Core Architecture & Implementation\n\nExplain your design patterns, multi-agent flows, or system benchmarks.\n\n- **Pillar 1**: Deterministic tool calling & state graphs.\n- **Pillar 2**: Real-time error handling and graceful fallbacks.\n\n```typescript\n// Example Code snippet\nexport async function runAgentWorkflow(task: string) {\n  console.log("Executing goal:", task);\n}\n```\n\n### Key Takeaways\n\nSummarize the crucial lessons for engineers and builders.'
  );
  const [tagsInput, setTagsInput] = useState('Agentic AI, Architecture, OpenSource');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');

  // UI states
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedBlog, setSubmittedBlog] = useState<any>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-fill author details if logged in
  useEffect(() => {
    if (user) {
      if (!authorEmail && user.email) setAuthorEmail(user.email);
      if (!authorName) {
        const name =
          user.name ||
          (user as any).full_name ||
          supabaseUser?.user_metadata?.full_name ||
          supabaseUser?.user_metadata?.name ||
          user.email?.split('@')[0];
        if (name) setAuthorName(name);
      }
    }
  }, [user, supabaseUser]);

  // Calculate estimated read time
  const readTime = useMemo(() => {
    const words = `${title} ${subtitle} ${content}`.trim().split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.ceil(words / 200));
    return `${mins} min read`;
  }, [title, subtitle, content]);

  // Insert markdown tag at cursor
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousText = textarea.value;
    const selected = previousText.substring(start, end) || 'text';

    const replacement = `${prefix}${selected}${suffix}`;
    const newContent =
      previousText.substring(0, start) + replacement + previousText.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter a headline for your blog.');
      return;
    }

    if (!content.trim()) {
      setErrorMsg('Please write some content for your blog.');
      return;
    }

    if (!authorName.trim()) {
      setErrorMsg('Please enter your author name.');
      return;
    }

    setIsSubmitting(true);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        category,
        image: bannerUrl.trim() || PRESET_BANNERS[0].url,
        rawMarkdown: content.trim(),
        tags,
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim(),
      };

      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit blog');
      }

      setSubmittedBlog(data.blog || payload);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/70 dark:bg-[#05070d] text-slate-900 dark:text-slate-100 selection:bg-[#0099e6] selection:text-white py-10 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[#0099e6]/08 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[450px] h-[450px] bg-[#f97316]/06 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-[#0099e6] dark:hover:text-[#0099e6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Domain Blogs</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0099e6]/10 text-[#0099e6] border border-[#0099e6]/20">
              Community Writer Portal
            </span>
          </div>
        </div>

        {/* Successful Submission View */}
        {submittedBlog ? (
          <div className="rounded-3xl bg-white/90 dark:bg-[#090e17]/90 border border-slate-200/90 dark:border-white/[0.1] backdrop-blur-2xl p-8 sm:p-12 text-center shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Blog Submitted for Moderation!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Thank you for contributing to Hacker’s Unity! Your playbook &quot;
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {submittedBlog.title}
                </span>
                &quot; has been sent to our Super Admin portal (
                <code className="text-xs bg-slate-100 dark:bg-white/[0.08] px-1.5 py-0.5 rounded font-mono text-[#0099e6]">
                  /admin-csap
                </code>
                ) for quality and domain review.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/80 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 max-w-md mx-auto text-xs text-sky-800 dark:text-sky-300 space-y-1">
              <div className="font-bold flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#0099e6]" />
                <span>What happens next?</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Once approved by an admin, your article will immediately be published live on{' '}
                <strong className="text-slate-800 dark:text-slate-200">hackersunity.com/blogs</strong>{' '}
                and accessible worldwide.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/blogs"
                className="px-6 py-2.5 rounded-full bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
              >
                Browse Other Blogs
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedBlog(null);
                  setTitle('');
                  setSubtitle('');
                }}
                className="px-6 py-2.5 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold border border-slate-200 dark:border-white/[0.08] transition-all cursor-pointer"
              >
                Write Another Blog
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Title Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#090e17]/80 border border-slate-200/90 dark:border-white/[0.08] backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                    <PenTool className="w-7 h-7 text-[#0099e6]" />
                    <span>Author a Frontier Tech Playbook</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Publish your engineering insights across AI, Space, Web3, IoT, and Cloud.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-xs font-semibold text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-[#0099e6]" />
                    <span>{readTime}</span>
                  </div>
                </div>
              </div>

              {/* Error banner */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Blog Headline <span className="text-[#ea580c]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Autonomous Agentic AI: Building Beyond Single-Prompt Wrappers"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-lg font-bold outline-none focus:border-[#0099e6] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Subtitle / Executive Summary
                  </label>
                  <input
                    type="text"
                    placeholder="Brief 1-2 sentence hook explaining the architectural takeaway..."
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm outline-none focus:border-[#0099e6] transition-colors"
                  />
                </div>
              </div>

              {/* Category & Cover Banner Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                {/* Domain Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#0099e6]" />
                    <span>Domain Category</span> <span className="text-[#ea580c]">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DOMAINS.map((dom) => (
                      <button
                        key={dom}
                        type="button"
                        onClick={() => {
                          setCategory(dom);
                          const matched = PRESET_BANNERS.find((p) => p.category === dom);
                          if (matched) setBannerUrl(matched.url);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                          category === dom
                            ? 'bg-[#0099e6] text-white border-[#0099e6] shadow-md shadow-sky-500/20'
                            : 'bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.2]'
                        }`}
                      >
                        {dom}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner Cover Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#f97316]" />
                    <span>Banner Cover Image</span>
                  </label>

                  <div className="space-y-3">
                    <input
                      type="url"
                      placeholder="Paste image URL (https://...) or choose a preset below"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#0099e6] transition-colors"
                    />

                    {/* Presets */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {PRESET_BANNERS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setBannerUrl(preset.url)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg shrink-0 font-medium border cursor-pointer transition-colors ${
                            bannerUrl === preset.url
                              ? 'bg-sky-50 dark:bg-sky-500/15 border-[#0099e6] text-[#0099e6] font-bold'
                              : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner Visual Preview */}
              {bannerUrl && (
                <div className="relative h-44 sm:h-52 w-full rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] bg-slate-950">
                  <Image
                    src={bannerUrl}
                    alt="Banner preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#0099e6] text-white">
                      {category}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1 line-clamp-1">
                      {title || 'Your headline will look like this'}
                    </h3>
                  </div>
                </div>
              )}
            </div>

            {/* Content Editor Card with Formatting Toolbar & Live Preview */}
            <div className="rounded-3xl bg-white/80 dark:bg-[#090e17]/80 border border-slate-200/90 dark:border-white/[0.08] backdrop-blur-xl shadow-xl overflow-hidden">
              {/* Tab Switcher & Formatting Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/[0.08]">
                {/* Editor / Preview Mode Tabs */}
                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-white/[0.06] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('write')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'write'
                        ? 'bg-white dark:bg-[#0c1017] text-[#0099e6] shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Write</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-white dark:bg-[#0c1017] text-[#0099e6] shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                </div>

                {/* Markdown Quick Formatting Toolbar (Enabled in Write mode) */}
                {activeTab === 'write' && (
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertFormatting('**', '**')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Bold (**text**)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Italic (*text*)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/[0.1] mx-0.5" />
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n### ')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Heading 3 (### Heading)"
                    >
                      <Heading3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n## ')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Heading 2 (## Heading)"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/[0.1] mx-0.5" />
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n- ')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Bullet List (- item)"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n1. ')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Numbered List (1. item)"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n```typescript\n', '\n```')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Code block"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n> ')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Quote (> quote)"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('[', '](https://example.com)')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Link [text](url)"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Editor Workspace */}
              <div className="p-4 sm:p-6 min-h-[380px]">
                {activeTab === 'write' ? (
                  <textarea
                    ref={textareaRef}
                    required
                    rows={16}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your tech playbook using markdown headings, bullets, code blocks..."
                    className="w-full h-full min-h-[360px] bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 font-mono outline-none resize-y leading-relaxed"
                  />
                ) : (
                  <div className="space-y-4 max-w-none text-slate-800 dark:text-slate-200 font-sans text-sm sm:text-base leading-relaxed">
                    {content ? (
                      content.split(/\n\n+/).map((para, idx) => {
                        const trimmed = para.trim();
                        if (trimmed.startsWith('### ')) {
                          return (
                            <h3 key={idx} className="text-lg sm:text-xl font-black text-slate-900 dark:text-white pt-2">
                              {trimmed.replace(/^###\s+/, '')}
                            </h3>
                          );
                        }
                        if (trimmed.startsWith('## ')) {
                          return (
                            <h2 key={idx} className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-3">
                              {trimmed.replace(/^##\s+/, '')}
                            </h2>
                          );
                        }
                        if (trimmed.startsWith('```')) {
                          return (
                            <pre key={idx} className="p-4 rounded-2xl bg-slate-900 text-sky-300 text-xs font-mono overflow-x-auto my-2 border border-slate-800">
                              <code>{trimmed.replace(/```[a-z]*\n?/gi, '')}</code>
                            </pre>
                          );
                        }
                        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                          return (
                            <ul key={idx} className="list-disc list-inside space-y-1 my-2 text-slate-700 dark:text-slate-300">
                              {trimmed.split('\n').map((line, lIdx) => (
                                <li key={lIdx}>{line.replace(/^[-*]\s+/, '')}</li>
                              ))}
                            </ul>
                          );
                        }
                        if (trimmed.startsWith('> ')) {
                          return (
                            <blockquote key={idx} className="border-l-4 border-[#0099e6] pl-4 py-1 italic text-slate-600 dark:text-slate-400">
                              {trimmed.replace(/^>\s+/, '')}
                            </blockquote>
                          );
                        }
                        return <p key={idx}>{trimmed}</p>;
                      })
                    ) : (
                      <p className="text-slate-400 italic">No content yet. Write something in the Write tab!</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Author & Tags Details */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#090e17]/80 border border-slate-200/90 dark:border-white/[0.08] backdrop-blur-xl shadow-xl space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#0099e6]" />
                <span>Author Details & Tags</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Author Name <span className="text-[#ea580c]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name / Handle"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#0099e6] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Contact Email (for approval notification)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#0099e6] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Agentic AI, LangGraph, Architecture, Production"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#0099e6] transition-colors"
                />
              </div>

              {/* Moderation Notice & Submit Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <HelpCircle className="w-4 h-4 text-[#0099e6] shrink-0" />
                  <span>Submissions are reviewed by Hacker’s Unity admins before appearing live.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-7 py-3 rounded-full bg-gradient-to-r from-[#0099e6] to-sky-500 hover:from-[#0088cc] hover:to-sky-600 text-white font-bold text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting for Review...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Publish & Submit for Review</span>
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
