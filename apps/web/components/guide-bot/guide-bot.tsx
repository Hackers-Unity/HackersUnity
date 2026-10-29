'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useAnimationControls, type PanInfo } from 'framer-motion';
import {
  Sparkles,
  X,
  Send,
  Moon,
  ExternalLink,
  Pause,
  Play,
  Compass,
  Paperclip,
  Wand2,
  Trophy,
  MapPin,
  Calendar,
  FileText,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import Unknown, { type AnimationName, type AvatarHandle } from '@/components/avatar';
import {
  TOUR_STEPS,
  resolveBotQuery,
  type TourStep,
  type BotChatMessage,
  type BotChatOption,
  type AttachedFileMeta,
} from './guide-tour-data';
import { createDraftEventFromAi, commitDraftAndLaunch } from '@/lib/ai-event-builder';
import type { ExtendedEvent } from '@/lib/mock-data';

interface Point {
  x: number;
  y: number;
}

export function GuideBot() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [isTourPaused, setIsTourPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tourStepProgress, setTourStepProgress] = useState(0);
  const [isSleeping, setIsSleeping] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationName>('idle');
  const [isHovered, setIsHovered] = useState(false);

  // Floating speech toast message over mascot
  const [mascotSpeech, setMascotSpeech] = useState<string | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pokeCountRef = useRef(0);
  const lastPokeTimeRef = useRef(0);

  const showMascotSpeech = useCallback((text: string, duration = 2800) => {
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    setMascotSpeech(text);
    speechTimeoutRef.current = setTimeout(() => {
      setMascotSpeech(null);
    }, duration);
  }, []);

  const triggerExpression = useCallback(
    (anim: AnimationName, dialogue?: string) => {
      setCurrentAnimation(anim);
      avatarRef.current?.play(anim);
      if (dialogue) {
        showMascotSpeech(dialogue);
      }
    },
    [showMascotSpeech]
  );

  // Chat conversation state
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [buildStepMessage, setBuildStepMessage] = useState<string>('');
  const [attachedFile, setAttachedFile] = useState<AttachedFileMeta | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<BotChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: "Hey! I'm HUe 👋, your AI companion on Hacker's Unity.\n\nAsk me anything — about Hacker's Unity, finding live hackathons, team matching, hosting events, or any coding & tech questions! How can I help you today?",
      timestamp: 'Just now',
    },
  ]);

  // Positions for HUe and thought bubble during tour
  const [botPos, setBotPos] = useState<Point>({ x: 0, y: 0 });
  const [thoughtPos, setThoughtPos] = useState<Point>({ x: 0, y: 0 });

  // User-draggable resting position along borders/corners
  const [restPos, setRestPos] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAngry, setIsAngry] = useState(false);
  const dragOccurredRef = useRef(false);
  const restControls = useAnimationControls();

  const avatarRef = useRef<AvatarHandle>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeSpotlightElRef = useRef<HTMLElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  // Magnetic border/corner snapping logic:
  // Can only rest along the borders of the screen.
  // If user drops in the center, automatically glides to the nearest corner!
  const snapToBorderOrCorner = useCallback((currentX: number, currentY: number): Point => {
    if (typeof window === 'undefined') return { x: currentX, y: currentY };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const avatarSize = 80;
    const minX = 20;
    const maxX = vw - avatarSize - 20;
    const minY = 75; // Stay below top navbar
    const maxY = vh - avatarSize - 20;

    const distLeft = Math.abs(currentX - minX);
    const distRight = Math.abs(maxX - currentX);
    const distTop = Math.abs(currentY - minY);
    const distBottom = Math.abs(maxY - currentY);

    // Border zone threshold: within 110px of any screen border
    const borderZoneThreshold = 110;
    const isNearBorder =
      distLeft <= borderZoneThreshold ||
      distRight <= borderZoneThreshold ||
      distTop <= borderZoneThreshold ||
      distBottom <= borderZoneThreshold;

    // If placed in the center zone, snap to the CLOSEST CORNER!
    if (!isNearBorder) {
      const corners = [
        { x: minX, y: minY }, // Top-Left
        { x: maxX, y: minY }, // Top-Right
        { x: minX, y: maxY }, // Bottom-Left
        { x: maxX, y: maxY }, // Bottom-Right
      ];

      let closestCorner = corners[0];
      let minCornerDist = Infinity;
      for (const corner of corners) {
        const d = Math.hypot(currentX - corner.x, currentY - corner.y);
        if (d < minCornerDist) {
          minCornerDist = d;
          closestCorner = corner;
        }
      }
      return closestCorner;
    }

    // Otherwise snap onto the nearest border
    const minDist = Math.min(distLeft, distRight, distTop, distBottom);
    if (minDist === distLeft) {
      return { x: minX, y: Math.max(minY, Math.min(currentY, maxY)) };
    }
    if (minDist === distRight) {
      return { x: maxX, y: Math.max(minY, Math.min(currentY, maxY)) };
    }
    if (minDist === distTop) {
      return { x: Math.max(minX, Math.min(currentX, maxX)), y: minY };
    }
    // Bottom border
    return { x: Math.max(minX, Math.min(currentX, maxX)), y: maxY };
  }, []);

  // Initialize positions on mount
  useEffect(() => {
    setMounted(true);
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const defaultX = vw - 80 - 24;
    const defaultY = vh - 80 - 24;

    let initialPos = { x: defaultX, y: defaultY };
    try {
      const saved = localStorage.getItem('hue_resting_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          initialPos = snapToBorderOrCorner(parsed.x, parsed.y);
        }
      }
    } catch {
      // Ignore
    }

    setRestPos(initialPos);
    setBotPos(initialPos);
    setThoughtPos({ x: vw - 340, y: vh - 260 });
    restControls.set({ x: initialPos.x, y: initialPos.y, scale: 1 });
  }, [snapToBorderOrCorner, restControls]);

  // Window resize listener to keep HUe within screen bounds
  useEffect(() => {
    const handleResize = () => {
      setRestPos((prev) => {
        const snapped = snapToBorderOrCorner(prev.x, prev.y);
        restControls.set({ x: snapped.x, y: snapped.y, scale: 1 });
        return snapped;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [snapToBorderOrCorner, restControls]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // Autonomous living companion: periodic lively micro-expressions while resting
  useEffect(() => {
    if (!mounted || isSleeping || isTourActive || isChatOpen || isDragging) return;

    const idlePool: Array<{ anim: AnimationName; dialogue?: string }> = [
      { anim: 'wink', dialogue: 'Psst! Need help building? 😉' },
      { anim: 'curious', dialogue: 'Checking out hackathons? 👀' },
      { anim: 'love', dialogue: "Hacker's Unity loves builders! 💖" },
      { anim: 'cool', dialogue: 'Keep building cool stuff. 😎' },
      { anim: 'starstruck', dialogue: '$350K+ in prize money! 🤩' },
      { anim: 'playful', dialogue: 'Boop! Ready when you are! 🚀' },
      { anim: 'giggle', dialogue: 'Hehehe happy coding! 🤭' },
      { anim: 'yawn', dialogue: 'A quick stretch... 🥱' },
      { anim: 'dance', dialogue: 'Builder victory vibes! 🕺' },
      { anim: 'determined', dialogue: 'Time to ship production code! ⚡' },
    ];

    const timer = setInterval(() => {
      // Pick random micro-expression
      const item = idlePool[Math.floor(Math.random() * idlePool.length)];
      setCurrentAnimation(item.anim);
      avatarRef.current?.play(item.anim);
      showMascotSpeech(item.dialogue || '', 2600);

      // Smoothly return to idle after 3.2s
      setTimeout(() => {
        if (!isTourActive && !isChatOpen && !isSleeping && !isDragging) {
          setCurrentAnimation('idle');
          avatarRef.current?.play('idle');
        }
      }, 3400);
    }, 13000 + Math.random() * 5000);

    return () => clearInterval(timer);
  }, [mounted, isSleeping, isTourActive, isChatOpen, isDragging, showMascotSpeech]);

  // Compute DYNAMIC & VARIED positions relative to target element
  const calculatePositionForTarget = useCallback(
    (targetElement: HTMLElement | null) => {
      if (typeof window === 'undefined') return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const avatarSize = 80;
      const thoughtW = Math.min(310, vw - 28);
      const thoughtH = 150;

      if (!isTourActive || !targetElement) {
        setBotPos({ x: restPos.x, y: restPos.y });
        setThoughtPos({
          x: Math.max(16, Math.min(restPos.x - thoughtW + 40, vw - thoughtW - 16)),
          y: Math.max(80, restPos.y - thoughtH - 16),
        });
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      const step = TOUR_STEPS[currentStepIndex];
      const dock = step?.dockPosition || 'right';

      let newBotX = 0;
      let newBotY = 0;
      let newThoughtX = 0;
      let newThoughtY = 0;

      // Apply distinct creative positioning per step so HUe glides across various corners/edges
      switch (dock) {
        case 'top-left':
          newBotX = Math.max(20, rect.left + 16);
          newBotY = rect.top - 42;
          if (newBotY >= thoughtH + 20) {
            newThoughtX = Math.max(16, Math.min(newBotX + avatarSize / 2 - thoughtW / 2, vw - thoughtW - 16));
            newThoughtY = newBotY - thoughtH - 12;
          } else {
            newThoughtX = Math.max(16, Math.min(newBotX + avatarSize + 12, vw - thoughtW - 16));
            newThoughtY = Math.max(80, newBotY);
          }
          break;

        case 'right':
          newBotX = Math.min(vw - avatarSize - 20, rect.right - 20);
          newBotY = rect.top + Math.min(rect.height / 2, 220) - avatarSize / 2;
          newThoughtX = Math.max(16, newBotX - thoughtW - 12);
          newThoughtY = Math.max(80, newBotY - 40);
          break;

        case 'top-center':
          newBotX = rect.left + rect.width / 2 - avatarSize / 2;
          newBotY = rect.top - avatarSize / 2 - 16;
          newThoughtX = Math.max(16, Math.min(newBotX + avatarSize / 2 - thoughtW / 2, vw - thoughtW - 16));
          if (newBotY >= thoughtH + 20) {
            newThoughtY = newBotY - thoughtH - 12;
          } else {
            newThoughtY = newBotY + avatarSize + 16;
          }
          break;

        case 'bottom-left':
          newBotX = Math.max(20, rect.left + 24);
          newBotY = rect.bottom - avatarSize + 20;
          newThoughtX = Math.max(16, Math.min(newBotX + avatarSize + 12, vw - thoughtW - 16));
          newThoughtY = Math.max(80, newBotY - thoughtH + 20);
          break;

        case 'top-right':
          newBotX = Math.min(vw - avatarSize - 20, rect.right - avatarSize - 16);
          newBotY = rect.top - 36;
          newThoughtX = Math.max(16, newBotX - thoughtW - 12);
          newThoughtY = Math.max(80, newBotY - 30);
          break;

        case 'left':
          newBotX = Math.max(20, rect.left + 16);
          newBotY = rect.top + Math.min(rect.height / 2, 220) - avatarSize / 2;
          newThoughtX = Math.min(vw - thoughtW - 16, newBotX + avatarSize + 12);
          newThoughtY = Math.max(80, newBotY - 40);
          break;

        case 'bottom-right':
          newBotX = Math.min(vw - avatarSize - 20, rect.right - avatarSize - 20);
          newBotY = rect.bottom - avatarSize + 20;
          newThoughtX = Math.max(16, newBotX - thoughtW - 12);
          newThoughtY = Math.max(80, newBotY - thoughtH + 20);
          break;

        case 'bottom-center':
          newBotX = rect.left + rect.width / 2 - avatarSize / 2;
          newBotY = rect.bottom - avatarSize / 2;
          newThoughtX = Math.max(16, Math.min(newBotX + avatarSize / 2 - thoughtW / 2, vw - thoughtW - 16));
          newThoughtY = Math.max(80, newBotY - thoughtH - 14);
          break;

        case 'center-right':
        default:
          newBotX = Math.min(vw - avatarSize - 20, rect.right - 24);
          newBotY = rect.top + Math.min(rect.height / 2, 220) - avatarSize / 2;
          newThoughtX = Math.max(16, newBotX - thoughtW - 12);
          newThoughtY = Math.max(80, newBotY - 40);
          break;
      }

      // Safety clamps so neither bot nor thought bubble ever overflows screen bounds
      newBotX = Math.max(16, Math.min(newBotX, vw - avatarSize - 16));
      newBotY = Math.max(75, Math.min(newBotY, vh - avatarSize - 16));
      newThoughtX = Math.max(12, Math.min(newThoughtX, vw - thoughtW - 12));
      newThoughtY = Math.max(75, Math.min(newThoughtY, vh - thoughtH - 16));

      setBotPos({ x: newBotX, y: newBotY });
      setThoughtPos({ x: newThoughtX, y: newThoughtY });
    },
    [isTourActive, currentStepIndex, restPos]
  );

  // Update position continuously on scroll
  const updateCurrentTargetPosition = useCallback(() => {
    if (!isTourActive) return;
    const step = TOUR_STEPS[currentStepIndex];
    if (!step) return;
    const el = document.getElementById(step.targetId);
    calculatePositionForTarget(el);
  }, [isTourActive, currentStepIndex, calculatePositionForTarget]);

  // Scroll listener for continuous smooth tracking
  useEffect(() => {
    if (!mounted || !isTourActive) return;

    const handleScrollOrResize = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        updateCurrentTargetPosition();
      });
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [mounted, isTourActive, updateCurrentTargetPosition]);

  // Clear timers helper
  const clearTourTimers = () => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  // Stop Tour and return to resting mode
  const stopTour = useCallback((openChatAfter = true) => {
    clearTourTimers();
    if (activeSpotlightElRef.current) {
      activeSpotlightElRef.current.classList.remove('hue-card-spotlight');
    }
    setIsTourActive(false);
    setIsTourPaused(false);
    setCurrentAnimation('idle');
    avatarRef.current?.play('idle');
    calculatePositionForTarget(null);
    restControls.set({ x: restPos.x, y: restPos.y, scale: 1 });
    if (openChatAfter) {
      setIsChatOpen(true);
    }
  }, [calculatePositionForTarget, restControls, restPos]);

  // Apply step with AUTO-ADVANCE TIMER (3-5 sec per step)
  const applyStep = useCallback(
    (stepIndex: number) => {
      clearTourTimers();

      if (stepIndex >= TOUR_STEPS.length) {
        if (activeSpotlightElRef.current) {
          activeSpotlightElRef.current.classList.remove('hue-card-spotlight');
        }
        setCurrentAnimation('celebrate');
        avatarRef.current?.play('celebrate');

        setMessages((prev) => [
          ...prev,
          {
            id: `tour-done-${Date.now()}`,
            sender: 'bot',
            text: "🎉 Tour complete! You've seen all major arenas of Hacker's Unity. What would you like to build or explore next?",
            timestamp: 'Just now',
            cta: {
              label: 'Explore Live Hackathons 🏆',
              href: '/hackathons',
            },
          },
        ]);

        setTimeout(() => {
          stopTour(true);
        }, 3000);
        return;
      }

      const step = TOUR_STEPS[stepIndex];
      if (!step) return;

      setCurrentStepIndex(stepIndex);
      setCurrentAnimation(step.animation);
      avatarRef.current?.play(step.animation);
      setTourStepProgress(0);

      if (activeSpotlightElRef.current) {
        activeSpotlightElRef.current.classList.remove('hue-card-spotlight');
      }

      let el = document.getElementById(step.targetId);
      if (!el) {
        if (step.targetId === 'first-hackathon-card') el = document.getElementById('hackathons');
        else if (step.targetId === 'hero-pill') el = document.getElementById('hero');
        else if (step.targetId === 'builder-card-1') el = document.getElementById('builder-standard');
        else if (step.targetId === 'workshop-card') el = document.getElementById('workshops');
        else if (step.targetId === 'host-cta-card') el = document.getElementById('host-hackathon');
      }

      if (el) {
        activeSpotlightElRef.current = el;
        el.classList.add('hue-card-spotlight');
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        let frames = 0;
        const trackScroll = () => {
          calculatePositionForTarget(el);
          frames++;
          if (frames < 75) {
            requestAnimationFrame(trackScroll);
          }
        };
        requestAnimationFrame(trackScroll);
      } else {
        calculatePositionForTarget(null);
      }

      const duration = step.durationMs || 4000;
      const intervalMs = 50;
      let elapsed = 0;

      progressIntervalRef.current = setInterval(() => {
        elapsed += intervalMs;
        const pct = Math.min(100, (elapsed / duration) * 100);
        setTourStepProgress(pct);
      }, intervalMs);

      stepTimerRef.current = setTimeout(() => {
        clearInterval(progressIntervalRef.current!);
        applyStep(stepIndex + 1);
      }, duration);
    },
    [calculatePositionForTarget, stopTour]
  );

  // Start the auto-advancing flying tour
  const startTour = useCallback(() => {
    setIsSleeping(false);
    setIsChatOpen(false);
    setIsTourActive(true);
    setIsTourPaused(false);
    applyStep(0);
  }, [applyStep]);

  // Pause / Resume tour
  const togglePauseTour = () => {
    if (isTourPaused) {
      setIsTourPaused(false);
      applyStep(currentStepIndex);
    } else {
      setIsTourPaused(true);
      clearTourTimers();
    }
  };

  // Mascot starts in calm idle animation; chat remains closed until user clicks
  useEffect(() => {
    if (!mounted) return;
    setCurrentAnimation('idle');
    avatarRef.current?.play('idle');
  }, [mounted]);

  // File Upload handler for Build/Auto-host in HUe chat
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKb = (file.size / 1024).toFixed(1) + ' KB';

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = (event.target?.result as string) || '';
        setAttachedFile({
          name: file.name,
          size: sizeKb,
          content: `[Attached Hackathon Poster / Banner: ${file.name}]`,
          isImage: true,
          dataUrl,
        });
      };
      reader.readAsDataURL(file);
    } else if (
      file.type.includes('text') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.csv')
    ) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setAttachedFile({
          name: file.name,
          size: sizeKb,
          content: text.slice(0, 15000),
          isImage: false,
        });
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const raw = (event.target?.result as string) || '';
        const printableText = raw.replace(/[^\x20-\x7E\t\n\r]/g, ' ').slice(0, 10000);
        setAttachedFile({
          name: file.name,
          size: sizeKb,
          content: printableText.trim()
            ? `[Document: ${file.name} (${sizeKb})]\n\n${printableText}`
            : `[Attached Event Brochure: ${file.name}, File Size: ${sizeKb}]`,
          isImage: false,
        });
      };
      reader.readAsBinaryString(file);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Launch the draft hackathon directly into Step 8 review wizard
  const handleReviewAndHost = (event: ExtendedEvent) => {
    commitDraftAndLaunch(event, router);
    setIsChatOpen(false);
  };

  // Option selection handler
  const handleOptionClick = (option: BotChatOption) => {
    handleSendMessage(option.value);
  };

  // Send a chat message using GROQ AI API with file attachment & auto-build capabilities
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    const currentFile = attachedFile;
    if (!query && !currentFile) return;

    const userMsg: BotChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query || (currentFile ? `Uploaded ${currentFile.name} for hackathon analysis` : ''),
      timestamp: 'Just now',
      attachedFile: currentFile
        ? {
            name: currentFile.name,
            size: currentFile.size,
            isImage: currentFile.isImage,
            dataUrl: currentFile.dataUrl,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsTyping(true);

    const isExplicitBuild =
      Boolean(currentFile) ||
      query.toLowerCase().includes('host') ||
      query.toLowerCase().includes('auto-host') ||
      query.toLowerCase().includes('create event') ||
      query.toLowerCase().includes('create hackathon') ||
      query.toLowerCase().includes('sprint');

    const thinkingAnim: AnimationName = isExplicitBuild ? 'working' : 'thinking';
    setCurrentAnimation(thinkingAnim);
    avatarRef.current?.play(thinkingAnim);

    if (isExplicitBuild) {
      setBuildStepMessage(
        currentFile?.isImage ? 'Scanning poster with AI OCR...' : 'Architecting hackathon with AI...'
      );
    } else {
      setBuildStepMessage('');
    }

    try {
      // Call Groq Bot API with message and attached file
      const res = await fetch('/api/ai/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-5),
          attachedFile: currentFile
            ? {
                name: currentFile.name,
                size: currentFile.size,
                content: currentFile.content,
                isImage: currentFile.isImage,
                dataUrl: currentFile.dataUrl,
              }
            : undefined,
        }),
      });

      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();

      setIsTyping(false);
      setBuildStepMessage('');

      if (data.success && (data.reply || data.event)) {
        const anim = (data.animation as AnimationName) || 'happy';
        setCurrentAnimation(anim);
        avatarRef.current?.play(anim);

        let eventDraft: ExtendedEvent | undefined = undefined;
        if (data.event) {
          eventDraft = createDraftEventFromAi(
            data.event,
            currentFile?.isImage ? currentFile.dataUrl : undefined
          );
        }

        const botMsg: BotChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.reply || "Here's what I prepared for you:",
          timestamp: 'Just now',
          options: data.options,
          eventDraft,
          cta: data.cta,
        };

        setMessages((prev) => [...prev, botMsg]);

        // Auto-start tour if explicitly requested
        if (data.autoStartTour) {
          setTimeout(() => {
            startTour();
          }, 900);
        }
      } else {
        throw new Error('Fallback needed');
      }
    } catch {
      setIsTyping(false);
      setBuildStepMessage('');
      const fallback = resolveBotQuery(query);
      setCurrentAnimation(fallback.animation);
      avatarRef.current?.play(fallback.animation);

      const botMsg: BotChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: fallback.text,
        timestamp: 'Just now',
        options: fallback.options,
        cta: fallback.cta,
      };

      setMessages((prev) => [...prev, botMsg]);

      const qLower = query.toLowerCase();
      const isExplicitTour =
        qLower.includes('tour') ||
        qLower.includes('walkthrough') ||
        qLower.includes('ghumao') ||
        qLower.includes('dikhao');

      if (fallback.cta?.isTourTrigger && isExplicitTour) {
        setTimeout(() => {
          startTour();
        }, 900);
      }
    }
  };

  // Put HUe to sleep
  const handlePutToSleep = () => {
    stopTour(false);
    setIsChatOpen(false);
    setIsSleeping(true);
    setCurrentAnimation('sleeping');
    avatarRef.current?.play('sleeping');
  };

  // Dragging handlers for resting mascot
  const handleDragStart = () => {
    dragOccurredRef.current = true;
    setIsDragging(true);
    setIsAngry(true);
    setIsSleeping(false);
    if (isChatOpen) setIsChatOpen(false);
    setCurrentAnimation('angry');
    avatarRef.current?.play('angry');
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const rawX = restPos.x + info.offset.x;
    const rawY = restPos.y + info.offset.y;
    const snapped = snapToBorderOrCorner(rawX, rawY);

    setRestPos(snapped);
    setBotPos(snapped);
    try {
      localStorage.setItem('hue_resting_pos', JSON.stringify(snapped));
    } catch {
      // Ignore
    }

    // Smoothly spring / glide to the snapped border or corner
    restControls.start({
      x: snapped.x,
      y: snapped.y,
      scale: 1,
      transition: { type: 'spring', damping: 22, stiffness: 280 },
    });

    setIsDragging(false);

    // Return to calm idle cyan state after landing
    setTimeout(() => {
      setIsAngry(false);
      setCurrentAnimation('idle');
      avatarRef.current?.play('idle');
    }, 650);

    // Release drag click suppression shortly after
    setTimeout(() => {
      dragOccurredRef.current = false;
    }, 200);
  };

  // Wake up when sleeping avatar is clicked, or toggle chat
  const handleAvatarClick = () => {
    if (dragOccurredRef.current || isDragging) {
      return;
    }

    if (isTourActive) {
      togglePauseTour();
      return;
    }

    if (isSleeping) {
      setIsSleeping(false);
      setCurrentAnimation('waking');
      avatarRef.current?.play('waking');
      showMascotSpeech("Good morning! Let's build! ☀️", 2200);
      setTimeout(() => {
        setCurrentAnimation('happy');
        avatarRef.current?.play('happy');
        setIsChatOpen(true);
      }, 900);
      return;
    }

    // Check rapid poking
    const now = Date.now();
    if (now - lastPokeTimeRef.current < 650) {
      const pokes = pokeCountRef.current + 1;
      pokeCountRef.current = pokes;
      lastPokeTimeRef.current = now;

      if (pokes === 2) {
        triggerExpression('giggle', 'Hehehe that tickles! 🤭');
        return;
      } else if (pokes === 3) {
        triggerExpression('wink', 'Boop! You poked me 3 times! 😉');
        return;
      } else if (pokes >= 4) {
        triggerExpression('dizzy', 'Whoa spinning! Too many pokes! 😵‍💫');
        pokeCountRef.current = 0;
        return;
      }
    } else {
      pokeCountRef.current = 1;
      lastPokeTimeRef.current = now;
    }

    setIsChatOpen((prev) => !prev);
    if (!isChatOpen) {
      setCurrentAnimation('happy');
      avatarRef.current?.play('happy');
    }
  };

  if (!mounted) return null;

  const currentStep: TourStep | undefined = isTourActive
    ? TOUR_STEPS[currentStepIndex]
    : undefined;

  const isRightSide =
    mounted && typeof window !== 'undefined'
      ? restPos.x > window.innerWidth / 2
      : true;
  const isBottomSide =
    mounted && typeof window !== 'undefined'
      ? restPos.y > window.innerHeight / 2
      : true;

  // Reusable mascot trigger button
  const renderMascotButton = () => (
    <div className="relative flex items-center justify-center">
      {/* Dynamic Ambient Glowing Halo matching expression */}
      <div
        className={`absolute -inset-3 rounded-full blur-xl transition-all duration-500 pointer-events-none ${
          isAngry
            ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 opacity-100 scale-125 animate-pulse'
            : isSleeping
            ? 'bg-slate-500/20 opacity-40'
            : currentAnimation === 'love'
            ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 opacity-90 animate-pulse'
            : currentAnimation === 'starstruck'
            ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-cyan-400 opacity-95 animate-pulse'
            : currentAnimation === 'determined'
            ? 'bg-gradient-to-r from-orange-500 via-red-500 to-cyan-500 opacity-90 animate-pulse'
            : currentAnimation === 'dance' || currentAnimation === 'celebrate'
            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 opacity-95 animate-pulse'
            : 'bg-gradient-to-r from-cyan-400/50 via-sky-500/40 to-orange-500/40 opacity-90 animate-pulse'
        }`}
      />

      {/* Floating Interactive Speech Toast */}
      <AnimatePresence>
        {mascotSpeech && !isDragging && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            className="absolute -top-11 whitespace-nowrap px-3 py-1 rounded-2xl bg-white/95 dark:bg-[#0c1017]/95 border border-cyan-400/50 shadow-xl shadow-cyan-950/20 text-slate-800 dark:text-slate-100 font-bold text-[11px] pointer-events-none select-none z-30 flex items-center gap-1.5"
          >
            <span>{mascotSpeech}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        role="button"
        tabIndex={0}
        onClick={handleAvatarClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAvatarClick();
          }
        }}
        onMouseEnter={() => {
          if (isAngry || isDragging) return;
          setIsHovered(true);
          if (!isSleeping && currentAnimation === 'idle') {
            const hoverPool: Array<{ anim: AnimationName; dialogue?: string }> = [
              { anim: 'curious', dialogue: 'Hey builder! 👀' },
              { anim: 'wink', dialogue: 'Need hackathon advice? 😉' },
              { anim: 'love', dialogue: 'Glad you are here! 💖' },
              { anim: 'cool', dialogue: 'Looking sharp! 😎' },
              { anim: 'starstruck', dialogue: 'Ready to win prizes? 🤩' },
              { anim: 'playful', dialogue: 'Click me to chat! 🚀' },
            ];
            const pick = hoverPool[Math.floor(Math.random() * hoverPool.length)];
            setCurrentAnimation(pick.anim);
            avatarRef.current?.play(pick.anim);
            if (pick.dialogue) showMascotSpeech(pick.dialogue, 2400);
          }
        }}
        onMouseLeave={() => {
          if (isAngry || isDragging) return;
          setIsHovered(false);
          if (!isSleeping && !isTourActive && !isChatOpen) {
            setTimeout(() => {
              if (!isHovered && !isChatOpen && !isTourActive && !isAngry) {
                setCurrentAnimation('idle');
                avatarRef.current?.play('idle');
              }
            }, 1200);
          }
        }}
        aria-label={isSleeping ? 'Wake up HUe' : 'Chat with HUe guide bot'}
        className={`group relative flex items-center justify-center transition-transform focus:outline-none select-none ${
          isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab active:cursor-grabbing hover:scale-110'
        }`}
      >
        {/* Mascot Container */}
        <div
          className={`relative w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center transition-all duration-300 ${
            isAngry ? 'hue-angry-shake' : 'drop-shadow-xl'
          }`}
          style={
            isAngry
              ? {
                  filter:
                    'hue-rotate(168deg) saturate(2.6) brightness(1.05) drop-shadow(0 0 18px rgba(239, 68, 68, 0.95))',
                }
              : undefined
          }
        >
          <Unknown
            ref={avatarRef}
            animation={currentAnimation}
            playing={true}
            loop={true}
            size="100%"
          />

          {/* Angry anime vein popup mark 💢 */}
          {isAngry && (
            <div className="absolute -top-3 -right-2 text-xl select-none animate-bounce drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] z-20">
              💢
            </div>
          )}

          {/* Angry dialogue pill when dragging */}
          {isDragging && (
            <div className="absolute -top-9 whitespace-nowrap px-2.5 py-1 rounded-full bg-red-600/95 text-white font-black text-[10px] tracking-wide border border-red-300 shadow-lg shadow-red-900/50 animate-pulse pointer-events-none select-none">
              Hey! Put me down! 😡
            </div>
          )}

          {/* Sleeping Zzz Badge */}
          {isSleeping && !isAngry && (
            <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-cyan-300 font-bold border border-cyan-400/30 animate-bounce shadow-md">
              zzz
            </div>
          )}

          {/* Expression Accessory Badges */}
          {!isAngry && !isSleeping && (
            <>
              {currentAnimation === 'love' && (
                <div className="absolute -top-2.5 -right-1 text-base select-none animate-bounce drop-shadow-[0_0_8px_rgba(255,42,112,0.8)] z-20">
                  💖
                </div>
              )}
              {currentAnimation === 'starstruck' && (
                <div className="absolute -top-2.5 -right-1 text-base select-none animate-pulse drop-shadow-[0_0_8px_rgba(255,183,3,0.9)] z-20">
                  ✨
                </div>
              )}
              {currentAnimation === 'cool' && (
                <div className="absolute -top-2.5 -right-1 text-base select-none drop-shadow-md z-20">
                  😎
                </div>
              )}
              {currentAnimation === 'determined' && (
                <div className="absolute -top-2.5 -right-1 text-base select-none animate-bounce drop-shadow-[0_0_8px_rgba(255,77,0,0.9)] z-20">
                  ⚡
                </div>
              )}
              {(currentAnimation === 'dance' || currentAnimation === 'celebrate') && (
                <div className="absolute -top-2.5 -right-1 text-base select-none animate-bounce z-20">
                  🎉
                </div>
              )}
              {currentAnimation === 'giggle' && (
                <div className="absolute -top-2.5 -right-1 text-base select-none animate-pulse z-20">
                  🤭
                </div>
              )}
              {currentAnimation === 'dizzy' && (
                <div className="absolute -top-2.5 -right-1 text-base select-none animate-spin z-20">
                  💫
                </div>
              )}
              {currentAnimation === 'wink' && (
                <div className="absolute -top-2.5 -right-1 text-base select-none z-20">
                  😉
                </div>
              )}
            </>
          )}

          {/* Tour playing badge */}
          {isTourActive && !isAngry && (
            <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md border-2 border-white dark:border-[#0c1017] animate-pulse">
              <Compass className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        {/* Hover Tooltip when resting */}
        {!isChatOpen && !isTourActive && !isDragging && !isAngry && !mascotSpeech && (
          <div className="absolute right-full mr-3 whitespace-nowrap px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-[#0c1017]/95 border border-slate-200/90 dark:border-white/[0.1] shadow-xl text-slate-800 dark:text-slate-200 text-xs font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span>{isSleeping ? 'Click to wake HUe 😴' : 'Drag me anywhere or Click to chat 🚀'}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Global CSS for targeted card spotlight glow */}
      <style jsx global>{`
        @keyframes hueCardSpotlightPulse {
          0% {
            outline: 3px solid rgba(0, 199, 252, 0.95);
            box-shadow: 0 0 0 5px rgba(0, 199, 252, 0.25), 0 0 35px rgba(0, 199, 252, 0.45);
          }
          50% {
            outline: 3px solid rgba(255, 106, 0, 0.95);
            box-shadow: 0 0 0 8px rgba(255, 106, 0, 0.25), 0 0 45px rgba(255, 106, 0, 0.4);
          }
          100% {
            outline: 3px solid rgba(0, 199, 252, 0.95);
            box-shadow: 0 0 0 5px rgba(0, 199, 252, 0.25), 0 0 35px rgba(0, 199, 252, 0.45);
          }
        }
        .hue-card-spotlight {
          animation: hueCardSpotlightPulse 2.4s ease-in-out infinite;
          border-radius: 1.5rem !important;
          position: relative;
          z-index: 25 !important;
          scroll-margin-top: 6rem;
        }
        @keyframes hueAngryShake {
          0%, 100% {
            transform: rotate(0deg) translate(0, 0);
          }
          20% {
            transform: rotate(-5deg) translate(-2px, 1px);
          }
          40% {
            transform: rotate(5deg) translate(2px, -1px);
          }
          60% {
            transform: rotate(-4deg) translate(-1px, -1px);
          }
          80% {
            transform: rotate(4deg) translate(1px, 1px);
          }
        }
        .hue-angry-shake {
          animation: hueAngryShake 0.2s ease-in-out infinite;
        }
      `}</style>

      {/* ─── MODE A: AI CHAT WINDOW (RESTING / SUMMONED) ──────────── */}
      <AnimatePresence>
        {isChatOpen && !isTourActive && (
          <motion.div
            initial={{ opacity: 0, y: isBottomSide ? 15 : -15, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isBottomSide ? 12 : -12, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            style={{
              position: 'fixed',
              [isRightSide ? 'right' : 'left']: '16px',
              [isBottomSide ? 'bottom' : 'top']: '96px',
              zIndex: 50,
            }}
            className="w-[calc(100vw-32px)] sm:w-[410px] md:w-[450px] h-[570px] max-h-[85vh] rounded-3xl backdrop-blur-2xl bg-white/95 dark:bg-[#0c1017]/95 border border-slate-200/90 dark:border-white/[0.12] shadow-2xl shadow-cyan-950/25 dark:shadow-black/80 flex flex-col overflow-hidden text-slate-900 dark:text-white"
          >
            {/* Header with Cute HUe Avatar Logo */}
            <div className="p-4 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/60 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                {/* Real HUe Mascot Logo (Cute animated avatar) */}
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-sky-500/10 to-orange-500/20 border border-cyan-400/50 p-1 shadow-md shadow-cyan-500/10 flex items-center justify-center shrink-0 overflow-hidden">
                  <Unknown
                    size={34}
                    playing={true}
                    loop={true}
                    animation={currentAnimation}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                      HUE AI Agent
                    </h3>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Powered by Hacker&apos;s Unity</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePutToSleep}
                  title="Put HUe to sleep"
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <Moon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  title="Close chat"
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[92%] sm:max-w-[88%] ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'bot' && (
                      <div className="w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-400/40 shrink-0 mb-1 overflow-hidden p-0.5 flex items-center justify-center">
                        <svg viewBox="-150 -150 300 300" className="w-full h-full block">
                          <circle cx="-68" cy="-58" r="38" fill="#00c7fc" />
                          <circle cx="0" cy="0" r="120" fill="#00c7fc" />
                          <rect x="-38" y="-12" width="22" height="50" rx="11" fill="#ff6a00" transform="rotate(-6 -27 13)" />
                          <rect x="16" y="-12" width="22" height="50" rx="11" fill="#ff6a00" transform="rotate(6 27 13)" />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 leading-relaxed font-normal shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-br-xs shadow-md'
                          : 'bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-white/[0.08] rounded-bl-xs'
                      }`}
                    >
                      {/* User Attached File Pill */}
                      {msg.attachedFile && (
                        <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg bg-black/15 dark:bg-black/30 border border-white/20 text-[11px] font-semibold text-white">
                          {msg.attachedFile.isImage && msg.attachedFile.dataUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={msg.attachedFile.dataUrl}
                              alt="Attachment"
                              className="w-4 h-4 rounded object-cover shadow-2xs shrink-0"
                            />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                          )}
                          <span className="truncate max-w-[140px]">{msg.attachedFile.name}</span>
                          <span className="opacity-70 text-[9px] shrink-0">({msg.attachedFile.size})</span>
                        </div>
                      )}

                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                      {/* AI Architected Hackathon Draft Card */}
                      {msg.eventDraft && (
                        <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border border-cyan-500/30 shadow-lg shadow-cyan-950/40 space-y-2.5">
                          {/* Top Header Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-cyan-400" />
                              AI Event Architect
                            </span>
                            <span className="text-[11px] font-black text-amber-400 flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              {msg.eventDraft.prize || '₹1,00,000'}
                            </span>
                          </div>

                          {/* Title & Tagline */}
                          <div>
                            <h4 className="font-black text-xs sm:text-sm text-white tracking-tight leading-snug">
                              {msg.eventDraft.title}
                            </h4>
                            {msg.eventDraft.tagline && (
                              <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-2">
                                {msg.eventDraft.tagline}
                              </p>
                            )}
                          </div>

                          {/* Metadata Grid */}
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-200">
                            <div className="flex items-center gap-1.5 bg-white/[0.07] px-2 py-1 rounded-lg">
                              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate">{msg.eventDraft.location || msg.eventDraft.mode || 'Online'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/[0.07] px-2 py-1 rounded-lg">
                              <Calendar className="w-3 h-3 text-orange-400 shrink-0" />
                              <span className="truncate">
                                {msg.eventDraft.startDate ? msg.eventDraft.startDate.split('T')[0] : 'Upcoming'}
                              </span>
                            </div>
                          </div>

                          {/* Tracks Preview */}
                          {Array.isArray(msg.eventDraft.tracks) && msg.eventDraft.tracks.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {msg.eventDraft.tracks.slice(0, 3).map((tr: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-white/[0.08] text-[9px] font-medium text-slate-200 border border-white/[0.06]"
                                >
                                  🎯 {tr.title}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Primary Action Button: Review & Host Now */}
                          <div className="pt-2 border-t border-white/[0.1]">
                            <button
                              type="button"
                              onClick={() => handleReviewAndHost(msg.eventDraft)}
                              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:brightness-110 active:scale-95 text-white font-black text-xs shadow-md shadow-orange-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                              <span>Review & Host Now →</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Interactive Options Choice List */}
                      {(() => {
                        const optionsToRender =
                          msg.options && msg.options.length > 0 ? msg.options : [];

                        if (!optionsToRender || optionsToRender.length === 0) return null;

                        return (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.08] space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                              <Sparkles className="w-3 h-3 text-cyan-500" />
                              <span>Select an option:</span>
                            </p>
                            <div className="grid grid-cols-1 gap-1.5">
                              {optionsToRender.map((opt, idx) => (
                                <button
                                  key={opt.id || idx}
                                  type="button"
                                  onClick={() => handleOptionClick(opt)}
                                  className="w-full text-left p-2 rounded-xl bg-white dark:bg-white/[0.05] hover:bg-cyan-500/10 dark:hover:bg-cyan-500/15 border border-slate-200/80 dark:border-white/[0.1] hover:border-cyan-400 dark:hover:border-cyan-400 text-slate-800 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all flex items-start gap-2 group cursor-pointer shadow-2xs"
                                >
                                  <span className="w-5 h-5 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-[10px] flex items-center justify-center shrink-0 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-[11px] leading-tight text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                                      {opt.label}
                                    </div>
                                    {opt.description && (
                                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                        {opt.description}
                                      </div>
                                    )}
                                  </div>
                                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* CTA Trigger (Tour or Link) */}
                      {msg.cta && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.1]">
                          {msg.cta.isTourTrigger ? (
                            <button
                              type="button"
                              onClick={startTour}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-orange-500 text-white font-extrabold text-[11px] shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{msg.cta.label}</span>
                            </button>
                          ) : (
                            <Link
                              href={msg.cta.href || '#'}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20 font-bold text-[11px] hover:underline"
                            >
                              <span>{msg.cta.label}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-300 max-w-fit">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  {buildStepMessage && (
                    <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 animate-pulse">
                      {buildStepMessage}
                    </span>
                  )}
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Floating Attached File Preview (if present) */}
            {attachedFile && (
              <div className="px-3 pt-2 pb-1 bg-slate-50/70 dark:bg-white/[0.03] border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40 text-[11px] text-[#ea580c] font-bold min-w-0">
                  {attachedFile.isImage && attachedFile.dataUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={attachedFile.dataUrl}
                      alt="Poster"
                      className="w-4 h-4 rounded object-cover shadow-2xs shrink-0"
                    />
                  ) : (
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate max-w-[140px] sm:max-w-[180px]">{attachedFile.name}</span>
                  <span className="text-[10px] opacity-75 shrink-0">({attachedFile.size})</span>
                  <button
                    type="button"
                    onClick={removeAttachedFile}
                    className="p-0.5 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded text-orange-600 dark:text-orange-400 cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage('Please scan this flyer/brochure and auto-create the hackathon draft with prizes, tracks, and timeline.')
                  }
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[10px] flex items-center gap-1 shadow-xs hover:brightness-110 cursor-pointer shrink-0"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Auto-Host</span>
                </button>
              </div>
            )}

            {/* Hidden File Input for Paperclip Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md,.json,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Input Bar Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload event poster, brochure or docs"
                className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  attachedFile
                    ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700 text-[#ea580c]'
                    : 'bg-white dark:bg-white/[0.06] border-slate-200 dark:border-white/[0.1] text-slate-500 dark:text-slate-400 hover:text-[#ea580c] hover:border-orange-300'
                }`}
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputQuery}
                onChange={(e) => {
                  setInputQuery(e.target.value);
                  if (e.target.value.length > 0 && (currentAnimation === 'idle' || currentAnimation === 'happy')) {
                    setCurrentAnimation('listening');
                    avatarRef.current?.play('listening');
                  }
                }}
                placeholder={
                  attachedFile
                    ? "Add details (e.g. '₹2L prize, Bangalore') or tap Auto-Host..."
                    : "Ask HUe, or describe event to auto-host..."
                }
                className="flex-1 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] rounded-2xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
              />

              <button
                type="submit"
                disabled={(!inputQuery.trim() && !attachedFile) || isTyping}
                className={`h-9 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white shrink-0 ${
                  attachedFile || inputQuery.toLowerCase().includes('host')
                    ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] shadow-orange-500/20'
                    : 'bg-gradient-to-r from-cyan-500 to-sky-600 shadow-cyan-500/20'
                }`}
              >
                {isTyping ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : attachedFile || inputQuery.toLowerCase().includes('host') ? (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Auto-Host</span>
                  </>
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODE B: COMPACT THOUGHT BUBBLE OVER HUE'S HEAD (AUTO-TOUR) ── */}
      <AnimatePresence>
        {isTourActive && currentStep && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: thoughtPos.x,
              y: thoughtPos.y,
            }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 240,
              mass: 0.85,
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: 60,
            }}
            className="w-[280px] sm:w-[320px] rounded-2xl p-4 backdrop-blur-2xl bg-white/95 dark:bg-[#0c1017]/95 border border-slate-200/90 dark:border-white/[0.14] shadow-2xl shadow-cyan-950/25 dark:shadow-black/90 text-slate-900 dark:text-white pointer-events-auto"
          >
            {/* Top Bar with Step & Controls */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20 font-bold uppercase tracking-wider text-[9px]">
                {currentStep.badge} • {currentStepIndex + 1}/{TOUR_STEPS.length}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={togglePauseTour}
                  title={isTourPaused ? 'Resume Tour' : 'Pause Tour'}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {isTourPaused ? <Play className="w-3 h-3 text-emerald-500" /> : <Pause className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => stopTour(true)}
                  title="Stop tour & open chat"
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Title & Short Punchy Explanation */}
            <h4 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white mb-1">
              {currentStep.title}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-normal mb-2.5">
              {currentStep.message}
            </p>

            {/* Progress Bar (Auto-advancing 3-5 sec timer indicator) */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-orange-500 h-full rounded-full transition-all duration-75"
                  style={{ width: `${tourStepProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>{isTourPaused ? '⏸ Paused' : 'Auto-gliding...'}</span>
                <span>{Math.round(((currentStep.durationMs || 4000) * (1 - tourStepProgress / 100)) / 1000)}s</span>
              </div>
            </div>

            {/* Small Thought Dots connecting bubble to HUe */}
            <div
              className={`absolute flex flex-col items-center gap-0.5 pointer-events-none ${
                thoughtPos.y < botPos.y
                  ? '-bottom-2.5 right-8'
                  : '-top-2.5 right-8 flex-col-reverse'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.14]" />
              <span className="w-1 h-1 rounded-full bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.14] ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MASCOT: RESTING CORNER / DRAGGABLE (WHEN TOUR IS INACTIVE) ───────── */}
      {!isTourActive && (
        <motion.div
          animate={restControls}
          drag
          dragMomentum={false}
          dragElastic={0}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          initial={{
            x: restPos.x,
            y: restPos.y,
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 60,
          }}
          className="pointer-events-auto select-none touch-none"
        >
          {renderMascotButton()}
        </motion.div>
      )}

      {/* ─── MASCOT: DYNAMIC FLYING (ONLY WHEN TOUR IS ACTIVE) ────── */}
      {isTourActive && (
        <motion.div
          initial={{
            x: typeof window !== 'undefined' ? window.innerWidth - 100 : 1000,
            y: typeof window !== 'undefined' ? window.innerHeight - 100 : 700,
          }}
          animate={{
            x: botPos.x,
            y: botPos.y,
          }}
          transition={{
            type: 'spring',
            damping: 24,
            stiffness: 240,
            mass: 0.85,
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 65,
          }}
          className="pointer-events-auto select-none"
        >
          {renderMascotButton()}
        </motion.div>
      )}
    </>
  );
}

export default GuideBot;
