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
  if (!rawText || !rawText.trim()) return '';

  // If HTML is already provided
  if (
    rawText.includes('<p>') ||
    rawText.includes('<ul>') ||
    rawText.includes('<ol>') ||
    rawText.includes('<li>') ||
    rawText.includes('<b>') ||
    rawText.includes('<strong>') ||
    rawText.includes('<div>')
  ) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawText, 'text/html');
      doc.body.querySelectorAll('*').forEach((el) => {
        el.removeAttribute('style');
        el.removeAttribute('face');
        el.removeAttribute('color');
        el.removeAttribute('size');
        if (el.tagName === 'SPAN' && el.attributes.length === 0) {
          el.replaceWith(...Array.from(el.childNodes));
        }
      });
      return doc.body.innerHTML;
    } catch {
      // fallback to plain text parsing
    }
  }

  const formatInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/__(.*?)__/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/_(.*?)_/g, '<i>$1</i>')
      .replace(/~~(.*?)~~/g, '<strike>$1</strike>')
      .replace(/\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  };

  const lines = rawText.split(/\r?\n/);
  let html = '';
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      continue;
    }

    // Bullet detection (•, -, *, ◦, ⁃)
    const bulletMatch = line.match(/^([•\-\*◦⁃]|\u2022)\s*(.*)$/);
    // Numbered list detection
    const olMatch = line.match(/^(\d+)[\.\)]\s*(.*)$/);
    // Headings
    const h1Match = line.match(/^#\s+(.*)$/);
    const h2Match = line.match(/^##\s+(.*)$/);

    if (h1Match) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<h2>${formatInline(h1Match[1])}</h2>`;
    } else if (h2Match) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<h3>${formatInline(h2Match[1])}</h3>`;
    } else if (bulletMatch) {
      if (inOl) { html += '</ol>'; inOl = false; }
      if (!inUl) { html += '<ul>'; inUl = true; }
      html += `<li>${formatInline(bulletMatch[2] || '')}</li>`;
    } else if (olMatch) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (!inOl) { html += '<ol>'; inOl = true; }
      html += `<li>${formatInline(olMatch[2] || '')}</li>`;
    } else {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<p>${formatInline(line)}</p>`;
    }
  }

  if (inUl) html += '</ul>';
  if (inOl) html += '</ol>';

  return html || `<p>${formatInline(rawText)}</p>`;
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

  // Save current selection range inside editor
  const saveSelection = () => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current && sel.anchorNode && editorRef.current.contains(sel.anchorNode)) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Restore saved selection range
  const restoreSelection = () => {
    if (typeof window === 'undefined' || !savedSelectionRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  // Check which formatting states are currently active
  const checkActiveFormats = useCallback(() => {
    if (typeof document === 'undefined' || !editorRef.current) return;
    try {
      const sel = window.getSelection();

      // If selection is not inside this editor, turn off all highlights
      if (!sel || !sel.anchorNode || !editorRef.current.contains(sel.anchorNode)) {
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

      let bold = document.queryCommandState('bold');
      let italic = document.queryCommandState('italic');
      let underline = document.queryCommandState('underline');
      let strikethrough = document.queryCommandState('strikeThrough');
      let ul = document.queryCommandState('insertUnorderedList');
      let ol = document.queryCommandState('insertOrderedList');
      let h1 = false;
      let h2 = false;
      let quote = false;

      // Strictly bounded DOM ancestor traversal within editorRef.current
      let el: Node | null = sel.anchorNode;
      while (el && el !== editorRef.current) {
        if (el.nodeType === Node.ELEMENT_NODE) {
          const tag = (el as HTMLElement).tagName.toUpperCase();
          if (tag === 'H1' || tag === 'H2') h1 = true;
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
      const isFocused = typeof document !== 'undefined' && document.activeElement === editorRef.current;

      // If internal change by typing or focused, do not overwrite DOM
      if (!isInitialMountRef.current) {
        if (value === lastEmittedValueRef.current || (value === '' && (lastEmittedValueRef.current === '' || lastEmittedValueRef.current === null))) {
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
        if (sel && sel.anchorNode && editorRef.current.contains(sel.anchorNode)) {
          saveSelection();
          checkActiveFormats();
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [checkActiveFormats]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText.trim();
      const empty = !text && !html.includes('<img') && !html.includes('<li>') && html !== '<p><br></p>' && html !== '<div><br></div>' && html !== '<br>';
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
      editorRef.current.focus();
      restoreSelection();

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

  // Toggle heading on and off
  const toggleHeading = (level: 'H1' | 'H2' | 'P') => {
    if (typeof document === 'undefined' || !editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();

    let targetTag = 'p';
    if (level === 'H1') {
      targetTag = activeFormats.h1 ? 'p' : 'h2';
    } else if (level === 'H2') {
      targetTag = activeFormats.h2 ? 'p' : 'h3';
    } else {
      targetTag = 'p';
    }

    try {
      const success = document.execCommand('formatBlock', false, targetTag);
      if (!success) {
        document.execCommand('formatBlock', false, `<${targetTag}>`);
      }
    } catch {
      try {
        document.execCommand('formatBlock', false, `<${targetTag}>`);
      } catch (err) {
        console.warn('formatBlock error:', err);
      }
    }

    saveSelection();
    checkActiveFormats();
    handleInput();
  };

  // Toggle quote block on and off
  const toggleQuote = () => {
    if (typeof document === 'undefined' || !editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();

    const targetTag = activeFormats.quote ? 'p' : 'blockquote';

    try {
      const success = document.execCommand('formatBlock', false, targetTag);
      if (!success) {
        document.execCommand('formatBlock', false, `<${targetTag}>`);
      }
    } catch {
      try {
        document.execCommand('formatBlock', false, `<${targetTag}>`);
      } catch (err) {
        console.warn('toggleQuote error:', err);
      }
    }

    saveSelection();
    checkActiveFormats();
    handleInput();
  };

  // Toggle List (Bullet or Numbered)
  const toggleList = (type: 'ul' | 'ol') => {
    if (typeof document === 'undefined' || !editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();

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
      editorRef.current.focus();
      restoreSelection();

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
            .wysiwyg-surface h1,
            .wysiwyg-surface h2 {
              font-size: 1.25rem !important;
              font-weight: 900 !important;
              color: #0f172a !important;
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
            .wysiwyg-surface s {
              text-decoration: line-through !important;
            }
          `,
        }}
      />

      {label && <label className="block text-xs font-bold text-slate-700">{label}</label>}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-[#0099e6] focus-within:border-transparent transition-all">
        {/* WYSIWYG Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200/90 text-slate-700 select-none">
          {/* Bold */}
          <button
            type="button"
            title="Bold (Ctrl+B)"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('bold');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeFormats.bold
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Bold className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Italic */}
          <button
            type="button"
            title="Italic (Ctrl+I)"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('italic');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeFormats.italic
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* Underline */}
          <button
            type="button"
            title="Underline (Ctrl+U)"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('underline');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeFormats.underline
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            title="Strikethrough"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('strikeThrough');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeFormats.strikethrough
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-300 mx-1" />

          {/* H1 Heading */}
          <button
            type="button"
            title="Large Heading (H1)"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleHeading('H1');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeFormats.h1
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-800'
            }`}
          >
            H1
          </button>

          {/* H2 Heading */}
          <button
            type="button"
            title="Medium Heading (H2)"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleHeading('H2');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFormats.h2
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-800'
            }`}
          >
            H2
          </button>

          {/* Normal Paragraph */}
          <button
            type="button"
            title="Normal Body Text"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleHeading('P');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              !activeFormats.h1 && !activeFormats.h2 && !activeFormats.quote
                ? 'bg-slate-200/80 text-slate-900 font-bold'
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            Normal
          </button>

          <div className="h-5 w-px bg-slate-300 mx-1" />

          {/* Bullet List */}
          <button
            type="button"
            title="Bullet Points List"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleList('ul');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFormats.ul
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <List className="w-4 h-4" />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            title="Numbered List"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleList('ol');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFormats.ol
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          {/* Quote Block */}
          <button
            type="button"
            title="Quote Block"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleQuote();
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFormats.quote
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Quote className="w-4 h-4" />
          </button>

          {/* Link */}
          <button
            type="button"
            title="Insert Website Link"
            onMouseDown={(e) => {
              e.preventDefault();
              openLinkDialog();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          {/* Clear formatting */}
          <button
            type="button"
            title="Clear Formatting"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('removeFormat');
              toggleHeading('P');
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer ml-auto"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Link Insertion Modal / Inline Popover */}
        {showLinkDialog && (
          <div className="p-3 bg-sky-50 border-b border-sky-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in slide-in-from-top-2">
            <input
              type="text"
              placeholder="Display text (optional)"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
            />
            <input
              type="url"
              autoFocus
              required
              placeholder="Paste URL (e.g. https://github.com/...)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
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
                className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Live Visual ContentEditable Area */}
        <div className="relative">
          {isEmpty && (
            <div className="absolute top-3.5 left-4 pointer-events-none text-xs text-slate-400 select-none">
              {placeholder}
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            onPaste={handlePaste}
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
            className="wysiwyg-surface p-4 text-xs text-slate-900 outline-none leading-relaxed font-sans"
          />
        </div>

        {/* Footer info bar */}
        <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#0099e6]" />
            <span>WYSIWYG Direct Editor • Formatting applies instantly</span>
          </span>
          <span className="font-semibold text-slate-500">Live Visual Format</span>
        </div>
      </div>

      {helperText && <p className="text-[10px] text-slate-400">{helperText}</p>}
    </div>
  );
}
