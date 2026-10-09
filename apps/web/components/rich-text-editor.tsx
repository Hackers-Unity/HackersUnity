'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Eraser,
  Sparkles,
  X,
  Check,
} from 'lucide-react';
import { renderDescriptionToHtml } from '@/lib/format-description';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  className?: string;
  helperText?: string;
}

// Convert text with markdown or bullets into clean semantic HTML
function convertTextOrMarkdownToHtml(rawText: string): string {
  return renderDescriptionToHtml(rawText);
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write here...',
  rows = 4,
  label,
  className = '',
  helperText,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const savedSelectionRef = useRef<Range | null>(null);
  const lastEmittedValueRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);

  // Link Dialog Modal State
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Active formats state for toolbar highlights
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    h1: false,
    h2: false,
    ul: false,
    ol: false,
    quote: false,
  });

  // Ensure default paragraph separator is <p> on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      try {
        document.execCommand('defaultParagraphSeparator', false, 'p');
      } catch {}
    }
  }, []);

  // Save current selection range inside editor
  const saveSelection = useCallback(() => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;

    try {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer) || editorRef.current === range.commonAncestorContainer) {
        savedSelectionRef.current = range.cloneRange();
      }
    } catch {}
  }, []);

  // Restore saved selection range if needed
  const restoreSelection = useCallback(() => {
    if (typeof window === 'undefined' || !savedSelectionRef.current || !editorRef.current) return;
    const sel = window.getSelection();
    if (!sel) return;

    // If selection is already active inside this editor, don't disturb it
    try {
      if (
        sel.rangeCount > 0 &&
        (editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer) ||
          editorRef.current === sel.getRangeAt(0).commonAncestorContainer)
      ) {
        return;
      }
    } catch {}

    try {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    } catch {}
  }, []);

  // Ensure editor is focused and selection is valid before running commands
  const ensureEditorFocus = useCallback(() => {
    if (typeof document === 'undefined' || !editorRef.current) return;
    if (document.activeElement !== editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
    }
  }, [restoreSelection]);

  // Check which formatting states are currently active
  const checkActiveFormats = useCallback(() => {
    if (typeof document === 'undefined' || !editorRef.current) return;
    try {
      const sel = window.getSelection();

      // If selection is not inside this editor, turn off all highlights
      if (
        !sel ||
        !sel.anchorNode ||
        (!editorRef.current.contains(sel.anchorNode) && editorRef.current !== sel.anchorNode)
      ) {
        setActiveFormats({
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          h1: false,
          h2: false,
          ul: false,
          ol: false,
          quote: false,
        });
        return;
      }

      let bold = false;
      let italic = false;
      let underline = false;
      let strikethrough = false;
      let ul = false;
      let ol = false;
      let h1 = false;
      let h2 = false;
      let quote = false;

      try { bold = document.queryCommandState('bold'); } catch {}
      try { italic = document.queryCommandState('italic'); } catch {}
      try { underline = document.queryCommandState('underline'); } catch {}
      try { strikethrough = document.queryCommandState('strikeThrough'); } catch {}
      try { ul = document.queryCommandState('insertUnorderedList'); } catch {}
      try { ol = document.queryCommandState('insertOrderedList'); } catch {}

      // Strictly bounded DOM ancestor traversal within editorRef.current
      let el: Node | null = sel.anchorNode;
      while (el && el !== editorRef.current) {
        if (el.nodeType === Node.ELEMENT_NODE) {
          const tag = (el as HTMLElement).tagName.toUpperCase();
          if (tag === 'H1') h1 = true;
          if (tag === 'H2') h2 = true;
          if (tag === 'H3' || tag === 'H4') h2 = true;
          if (tag === 'BLOCKQUOTE') quote = true;
          if (tag === 'UL') ul = true;
          if (tag === 'OL') ol = true;
          if (tag === 'B' || tag === 'STRONG') bold = true;
          if (tag === 'I' || tag === 'EM') italic = true;
          if (tag === 'U') underline = true;
          if (tag === 'STRIKE' || tag === 'S' || tag === 'DEL') strikethrough = true;
        }
        el = el.parentNode;
      }

      setActiveFormats({ bold, italic, underline, strikethrough, h1, h2, ul, ol, quote });
    } catch {
      // ignore
    }
  }, []);

  // Sync initial and external changes safely
  useEffect(() => {
    if (editorRef.current) {
      const isFocused =
        typeof document !== 'undefined' &&
        (document.activeElement === editorRef.current || editorRef.current.contains(document.activeElement));

      // If internal change by typing or focused, do not overwrite DOM
      if (!isInitialMountRef.current) {
        if (
          value === lastEmittedValueRef.current ||
          editorRef.current.innerHTML === value ||
          (value === '' && (lastEmittedValueRef.current === '' || lastEmittedValueRef.current === null))
        ) {
          return;
        }
        if (isFocused) {
          return;
        }
      }

      isInitialMountRef.current = false;
      const htmlValue = convertTextOrMarkdownToHtml(value || '');
      editorRef.current.innerHTML = htmlValue;
      lastEmittedValueRef.current = value || '';
      const text = editorRef.current.innerText.trim();
      setIsEmpty(!text && !htmlValue.includes('<img') && !htmlValue.includes('<li>'));
    }
  }, [value]);

  // Listen to document selectionchange to update toolbar state continuously
  useEffect(() => {
    const handleSelectionChange = () => {
      if (typeof window !== 'undefined' && editorRef.current) {
        const sel = window.getSelection();
        if (sel && sel.anchorNode && (editorRef.current.contains(sel.anchorNode) || editorRef.current === sel.anchorNode)) {
          saveSelection();
          checkActiveFormats();
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [checkActiveFormats, saveSelection]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText.trim();
      const empty =
        !text &&
        !html.includes('<img') &&
        !html.includes('<li>') &&
        html !== '<p><br></p>' &&
        html !== '<div><br></div>' &&
        html !== '<br>';
      setIsEmpty(empty);
      const emittedValue = empty ? '' : html;
      lastEmittedValueRef.current = emittedValue;
      onChange(emittedValue);
      checkActiveFormats();
    }
  }, [onChange, checkActiveFormats]);

  // Execute standard formatting commands (Bold, Italic, Underline, Strikethrough)
  const executeCommand = (command: string, arg?: string) => {
    if (typeof document !== 'undefined' && editorRef.current) {
      ensureEditorFocus();

      try {
        document.execCommand(command, false, arg);
      } catch (e) {
        console.warn('execCommand error:', e);
      }

      saveSelection();
      checkActiveFormats();
      handleInput();
    }
  };

  // Cross-browser formatBlock helper
  const applyFormatBlock = (tagName: string) => {
    const upper = `<${tagName.toUpperCase()}>`;
    const lower = `<${tagName.toLowerCase()}>`;
    try {
      if (document.execCommand('formatBlock', false, upper)) return true;
    } catch {}
    try {
      if (document.execCommand('formatBlock', false, lower)) return true;
    } catch {}
    try {
      if (document.execCommand('formatBlock', false, tagName)) return true;
    } catch {}
    return false;
  };

  // Toggle heading on and off (h1, h2, normal paragraph)
  const toggleHeading = (level: 'H1' | 'H2' | 'P') => {
    if (typeof document === 'undefined' || !editorRef.current) return;
    ensureEditorFocus();

    let targetTag = 'p';
    if (level === 'H1') {
      targetTag = activeFormats.h1 ? 'p' : 'h1';
    } else if (level === 'H2') {
      targetTag = activeFormats.h2 ? 'p' : 'h2';
    } else {
      targetTag = 'p';
    }

    applyFormatBlock(targetTag);
    saveSelection();
    checkActiveFormats();
    handleInput();
  };

  // Toggle quote block on and off
  const toggleQuote = () => {
    if (typeof document === 'undefined' || !editorRef.current) return;
    ensureEditorFocus();

    const targetTag = activeFormats.quote ? 'p' : 'blockquote';
    applyFormatBlock(targetTag);
    saveSelection();
    checkActiveFormats();
    handleInput();
  };

  // Toggle List (Bullet or Numbered)
  const toggleList = (type: 'ul' | 'ol') => {
    if (typeof document === 'undefined' || !editorRef.current) return;
    ensureEditorFocus();

    const command = type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList';
    try {
      document.execCommand(command, false);
    } catch (err) {
      console.warn('toggleList error:', err);
    }

    saveSelection();
    checkActiveFormats();
    handleInput();
  };

  // Handle Smart Paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const htmlData = e.clipboardData.getData('text/html');
    const plainText = e.clipboardData.getData('text/plain');

    const cleanHtml = convertTextOrMarkdownToHtml(plainText || htmlData);

    if (cleanHtml) {
      try {
        document.execCommand('insertHTML', false, cleanHtml);
      } catch {
        document.execCommand('insertText', false, plainText);
      }
      handleInput();
      checkActiveFormats();
    }
  };

  // Open Link Dialog
  const openLinkDialog = () => {
    saveSelection();
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString() : '';
    setLinkText(selectedText);
    setLinkUrl('');
    setShowLinkDialog(true);
  };

  // Apply Link
  const applyLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    let finalUrl = linkUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('mailto:')) {
      finalUrl = `https://${finalUrl}`;
    }

    setShowLinkDialog(false);
    if (editorRef.current) {
      ensureEditorFocus();

      if (linkText.trim()) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const a = document.createElement('a');
          a.href = finalUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = linkText;
          a.className = 'text-[#0099e6] underline font-semibold cursor-pointer';
          range.insertNode(a);
        }
      } else {
        document.execCommand('createLink', false, finalUrl);
      }

      handleInput();
      checkActiveFormats();
    }
  };

  // Keyboard shortcut handlers (Ctrl+B, Ctrl+I, Ctrl+U, Tab)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    if (modKey && !e.shiftKey && !e.altKey) {
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        executeCommand('bold');
        return;
      }
      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        executeCommand('italic');
        return;
      }
      if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        executeCommand('underline');
        return;
      }
    }

    // Support indent with tab
    if (e.key === 'Tab') {
      e.preventDefault();
      executeCommand('insertText', '    ');
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Scoped CSS for visual WYSIWYG tags */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .wysiwyg-surface ul {
              list-style-type: disc !important;
              padding-left: 1.5rem !important;
              margin: 0.5rem 0 !important;
            }
            .wysiwyg-surface ol {
              list-style-type: decimal !important;
              padding-left: 1.5rem !important;
              margin: 0.5rem 0 !important;
            }
            .wysiwyg-surface li {
              display: list-item !important;
              margin: 0.25rem 0 !important;
              list-style-position: outside !important;
            }
            .wysiwyg-surface h1 {
              font-size: 1.35rem !important;
              font-weight: 900 !important;
              color: #0f172a !important;
              margin: 0.75rem 0 0.35rem 0 !important;
              line-height: 1.3 !important;
              display: block !important;
            }
            .wysiwyg-surface h2 {
              font-size: 1.2rem !important;
              font-weight: 800 !important;
              color: #1e293b !important;
              margin: 0.6rem 0 0.25rem 0 !important;
              line-height: 1.3 !important;
              display: block !important;
            }
            .wysiwyg-surface h3,
            .wysiwyg-surface h4 {
              font-size: 1.05rem !important;
              font-weight: 700 !important;
              color: #1e293b !important;
              margin: 0.5rem 0 0.2rem 0 !important;
              line-height: 1.3 !important;
              display: block !important;
            }
            .wysiwyg-surface p {
              margin: 0.25rem 0 !important;
            }
            .wysiwyg-surface blockquote {
              border-left: 4px solid #0099e6 !important;
              padding: 0.4rem 0.75rem !important;
              margin: 0.5rem 0 !important;
              font-style: italic !important;
              background-color: rgba(0, 153, 230, 0.08) !important;
              border-radius: 0 0.5rem 0.5rem 0 !important;
              color: #334155 !important;
            }
            .wysiwyg-surface a {
              color: #0099e6 !important;
              text-decoration: underline !important;
              font-weight: 600 !important;
            }
            .wysiwyg-surface b,
            .wysiwyg-surface strong {
              font-weight: 800 !important;
            }
            .wysiwyg-surface i,
            .wysiwyg-surface em {
              font-style: italic !important;
            }
            .wysiwyg-surface u {
              text-decoration: underline !important;
            }
            .wysiwyg-surface strike,
            .wysiwyg-surface s,
            .wysiwyg-surface del {
              text-decoration: line-through !important;
            }
            .dark .wysiwyg-surface h1 {
              color: #f8fafc !important;
            }
            .dark .wysiwyg-surface h2 {
              color: #f1f5f9 !important;
            }
            .dark .wysiwyg-surface h3,
            .dark .wysiwyg-surface h4 {
              color: #e2e8f0 !important;
            }
            .dark .wysiwyg-surface blockquote {
              color: #cbd5e1 !important;
              background-color: rgba(0, 153, 230, 0.15) !important;
            }
          `,
        }}
      />

      {label && <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>}

      <div className="rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-[#0099e6] focus-within:border-transparent transition-all">
        {/* WYSIWYG Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-[#0c1017] border-b border-slate-200/90 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 select-none">
          {/* Bold */}
          <button
            type="button"
            title="Bold (Ctrl+B)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              executeCommand('bold');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeFormats.bold
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300'
            }`}
          >
            <Bold className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Italic */}
          <button
            type="button"
            title="Italic (Ctrl+I)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              executeCommand('italic');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeFormats.italic
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300'
            }`}
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* Underline */}
          <button
            type="button"
            title="Underline (Ctrl+U)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              executeCommand('underline');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeFormats.underline
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300'
            }`}
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            title="Strikethrough"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              executeCommand('strikeThrough');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeFormats.strikethrough
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300'
            }`}
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-300 dark:bg-white/10 mx-1" />

          {/* H1 Heading */}
          <button
            type="button"
            title="Heading 1"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              toggleHeading('H1');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeFormats.h1
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200'
            }`}
          >
            H1
          </button>

          {/* H2 Heading */}
          <button
            type="button"
            title="Heading 2"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              toggleHeading('H2');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFormats.h2
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200'
            }`}
          >
            H2
          </button>

          {/* Normal Paragraph */}
          <button
            type="button"
            title="Normal Body Text"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              toggleHeading('P');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              !activeFormats.h1 && !activeFormats.h2 && !activeFormats.quote
                ? 'bg-slate-200/80 dark:bg-white/[0.15] text-slate-900 dark:text-white font-bold'
                : 'hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400'
            }`}
          >
            Normal
          </button>

          <div className="h-5 w-px bg-slate-300 dark:bg-white/10 mx-1" />

          {/* Bullet List */}
          <button
            type="button"
            title="Bullet Points List"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              toggleList('ul');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeFormats.ul
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300'
            }`}
          >
            <List className="w-4 h-4" />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            title="Numbered List"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              toggleList('ol');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeFormats.ol
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          {/* Quote Block */}
          <button
            type="button"
            title="Quote Block"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              toggleQuote();
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeFormats.quote
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300'
            }`}
          >
            <Quote className="w-4 h-4" />
          </button>

          {/* Link */}
          <button
            type="button"
            title="Insert Website Link"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              openLinkDialog();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          {/* Clear formatting */}
          <button
            type="button"
            title="Clear Formatting"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              executeCommand('removeFormat');
              toggleHeading('P');
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer ml-auto"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Link Insertion Modal / Inline Popover */}
        {showLinkDialog && (
          <div className="p-3 bg-sky-50 dark:bg-sky-950/60 border-b border-sky-200 dark:border-sky-800/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in slide-in-from-top-2">
            <input
              type="text"
              placeholder="Display text (optional)"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-[#0099e6]"
            />
            <input
              type="url"
              autoFocus
              required
              placeholder="Paste URL (e.g. https://github.com/...)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-[#0099e6]"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={applyLink}
                className="px-3 py-1.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Insert Link</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLinkDialog(false)}
                className="p-1.5 rounded-xl bg-white dark:bg-[#121824] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-white/10 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Live Visual ContentEditable Area */}
        <div className="relative">
          {isEmpty && (
            <div className="absolute top-3.5 left-4 pointer-events-none text-xs text-slate-400 dark:text-slate-500 select-none">
              {placeholder}
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onKeyUp={() => {
              saveSelection();
              checkActiveFormats();
            }}
            onMouseUp={() => {
              saveSelection();
              checkActiveFormats();
            }}
            onSelect={() => {
              saveSelection();
              checkActiveFormats();
            }}
            style={{ minHeight: `${rows * 2}rem` }}
            className="wysiwyg-surface p-4 text-xs text-slate-900 dark:text-slate-100 outline-none leading-relaxed font-sans"
          />
        </div>

        {/* Footer info bar */}
        <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-[#0c1017] border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#0099e6] dark:text-[#38bdf8]" />
            <span>WYSIWYG Direct Editor • Formatting applies instantly</span>
          </span>
          <span className="font-semibold text-slate-500 dark:text-slate-400">Live Visual Format</span>
        </div>
      </div>

      {helperText && <p className="text-[10px] text-slate-400 dark:text-slate-500">{helperText}</p>}
    </div>
  );
}
