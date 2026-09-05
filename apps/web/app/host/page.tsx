'use client';

import { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PlusCircle,
  Trophy,
  Sparkles,
  Calendar,
  Rocket,
  Eye,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  X,
  Plus,
  Settings,
  FileText,
  Save,
  Image as ImageIcon,
  Globe,
  Layers,
  HelpCircle,
  GraduationCap,
  Building2,
  User,
  Mail,
  Send,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Lock,
  Phone,
  MapPin,
  Github,
  Linkedin,
  Code2,
  MessageSquare,
  Twitter,
  Shirt,
  Utensils,
  TrendingUp,
  Infinity as InfinityIcon,
  Video,
  Archive,
  Presentation,
  Link2,
  FileCheck,
} from 'lucide-react';
import { EventCategory, EventStatus, EventType, CustomQuestion } from '@hackers-unity/shared-types';
import { ExtendedEvent, MOCK_EVENTS } from '@/lib/mock-data';
import { saveHostedEvent, saveDraftEvent, updateHostedEvent, getCustomEvents } from '@/lib/storage';
import { createEventInSupabase, updateEventInSupabase, fetchEventBySlug, uploadHackathonAsset } from '@/lib/supabase-service';
import { getEventPreviewToken, getEventPrivateLink } from '@/lib/utils';
import { HackathonCard } from '@/components/hackathon-card';
import { RichTextEditor } from '@/components/rich-text-editor';
import { VenuePicker } from '@/components/venue-picker';
import { useAuth } from '@/lib/auth-context';

const TOTAL_STEPS = 7;

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'AED', symbol: 'AED', label: 'AED' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$)' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
];

const MANDATORY_SUBMISSION_FIELDS = [
  {
    id: 'title',
    label: 'Project Title',
    icon: Rocket,
    description: 'Crisp and memorable name of the hackathon prototype',
    badge: 'Required',
  },
  {
    id: 'description',
    label: 'Project Description',
    icon: FileText,
    description: 'Summary of the problem, tech stack, and key features (min 20 chars)',
    badge: 'Required',
  },
  {
    id: 'projectLink',
    label: 'Project Link / GitHub Repository Link',
    icon: Github,
    description: 'Public GitHub / GitLab repository URL or production live demo link',
    badge: 'Required',
  },
];

const OPTIONAL_SUBMISSION_FIELDS = [
  {
    id: 'demoVideo',
    label: 'Project Demo Video',
    icon: Video,
    hint: 'Loom, YouTube, or Google Drive walkthrough link (2-3 mins)',
    badge: 'Optional',
  },
  {
    id: 'zipUpload',
    label: 'ZIP File Upload',
    icon: Archive,
    hint: 'Direct zip archive of source code, build bundle, or offline binaries',
    badge: 'Optional',
  },
  {
    id: 'presentation',
    label: 'Presentation / PPT',
    icon: Presentation,
    hint: 'Pitch deck slides, Google Slides, Canva or PDF presentation',
    badge: 'Optional',
  },
  {
    id: 'additionalResources',
    label: 'Additional Resources or Links',
    icon: Link2,
    hint: 'Figma prototypes, smart contracts, dataset sources, or documentation',
    badge: 'Optional',
  },
];

const TIMEZONES = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
];

const DIFFICULTY_LEVELS = [
  { value: 'OPEN', label: 'Open to All' },
  { value: 'BEGINNER', label: 'Beginner Friendly' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

const MANDATORY_REGISTRATION_FIELDS = [
  { id: 'name', label: 'Full Name', icon: User, description: 'Builder full name' },
  { id: 'email', label: 'Email Address', icon: Mail, description: 'Communication & alerts' },
  { id: 'phone', label: 'Phone Number', icon: Phone, description: 'Contact & WhatsApp' },
  { id: 'college', label: 'College / Institute', icon: GraduationCap, description: 'University or organization' },
  { id: 'city', label: 'City / Location', icon: MapPin, description: 'Current city & region' },
];

const AVAILABLE_OPTIONAL_FIELDS = [
  { id: 'github', label: 'GitHub Profile', icon: Github, hint: 'GitHub repository URL' },
  { id: 'linkedin', label: 'LinkedIn Profile', icon: Linkedin, hint: 'Professional profile URL' },
  { id: 'skills', label: 'Skills & Tech Stack', icon: Code2, hint: 'Technologies & frameworks' },
  { id: 'portfolio', label: 'Portfolio Website', icon: Globe, hint: 'Personal portfolio / website' },
  { id: 'resume', label: 'Resume / CV Link', icon: FileText, hint: 'Drive or PDF resume URL' },
  { id: 'discord', label: 'Discord Handle', icon: MessageSquare, hint: 'Discord username & handle' },
  { id: 'twitter', label: 'Twitter / X Profile', icon: Twitter, hint: 'Twitter profile handle' },
  { id: 'tshirt', label: 'T-Shirt Size', icon: Shirt, hint: 'Swag & merch sizing' },
  { id: 'dietary', label: 'Dietary Preference', icon: Utensils, hint: 'Catering requirements' },
  { id: 'experience', label: 'Experience Level', icon: TrendingUp, hint: 'Builder seniority level' },
];

function HostHackathonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams?.get('edit') || searchParams?.get('id') || searchParams?.get('slug');

  const { user, supabaseUser } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEvent, setSubmittedEvent] = useState<ExtendedEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [originalEventSlug, setOriginalEventSlug] = useState<string | null>(null);
  const [isLoadingEditData, setIsLoadingEditData] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [hostType, setHostType] = useState<'COLLEGE' | 'ORGANIZATION'>('COLLEGE');
  const [institutionName, setInstitutionName] = useState('');
  const [organizerLeadName, setOrganizerLeadName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>(EventCategory.HACKATHON);
  const [eventType, setEventType] = useState<EventType>(EventType.ONLINE);
  const [location, setLocation] = useState('Online / Discord');

  // Combined organizer string
  const organizerName = useMemo(() => {
    const org = institutionName.trim();
    const lead = organizerLeadName.trim();
    if (org && lead) {
      return `${org} • ${lead}`;
    }
    return org || lead || '';
  }, [institutionName, organizerLeadName]);

  // Step 2: Dates & Schedule
  const [registrationStart, setRegistrationStart] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Step 3: Hackathon Details
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [eligibility, setEligibility] = useState('Open to all students, developers, and builders worldwide.');
  const [difficulty, setDifficulty] = useState('OPEN');
  const [tagsInput, setTagsInput] = useState('GenAI, Next.js, Cloud');
  const [rulesText, setRulesText] = useState('');

  // Step 4: Prizes & Tracks
  const [prizes, setPrizes] = useState([
    { position: '🥇 1st Prize', amount: 100000, description: 'Grand prize + accelerator interview' },
    { position: '🥈 2nd Prize', amount: 50000, description: 'Runner up grant' },
    { position: '🥉 3rd Prize', amount: 25000, description: 'Third place grant' },
  ]);
  const [tracks, setTracks] = useState([
    { title: 'Core Innovation Track', prize: '₹1,75,000 Pool', description: 'Build the most innovative end-to-end working system solving real user workflows.' },
  ]);

  // Currency Setting
  const [currency, setCurrency] = useState('INR');
  const currencySymbol = useMemo(() => {
    return CURRENCIES.find((c) => c.code === currency)?.symbol || '₹';
  }, [currency]);

  // Step 5: Registration Settings
  const [registrationType, setRegistrationType] = useState<'FREE' | 'PAID'>('FREE');
  const [entryFee, setEntryFee] = useState<number | string>(0);
  const [registrationCapacity, setRegistrationCapacity] = useState<number | null>(null);
  const [isUnlimitedCapacity, setIsUnlimitedCapacity] = useState(true);
  const [approvalMode, setApprovalMode] = useState<'AUTO' | 'MANUAL'>('MANUAL');
  const [selectedOptionalFields, setSelectedOptionalFields] = useState<string[]>([
    'github',
    'linkedin',
    'skills',
  ]);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [newQuestionLabel, setNewQuestionLabel] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'text' | 'select' | 'textarea'>('text');

  // Step 6: Project Submission Settings
  const [submissionGuidelines, setSubmissionGuidelines] = useState(
    'Ensure all GitHub repositories are set to public during the judging window. Demo videos should be 2-3 minutes highlighting key user workflows.'
  );
  const [enabledSubmissionFields, setEnabledSubmissionFields] = useState<string[]>([]);

  const toggleSubmissionField = (fieldId: string) => {
    setEnabledSubmissionFields((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  const slug = useMemo(() => {
    return title
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : 'my-custom-hackathon-2026';
  }, [title]);

  const totalPrize = useMemo(() => {
    return prizes.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [prizes]);

  // Email Draft & Sending State
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState<string | null>(null);
  const [copiedDetails, setCopiedDetails] = useState(false);

  // Private Preview Link State
  const [previewToken, setPreviewToken] = useState<string>(() => {
    const rand = Math.random().toString(36).substring(2, 10);
    return `hu_prv_${rand}`;
  });
  const [copiedPrivateLink, setCopiedPrivateLink] = useState(false);

  // ─── LOAD EVENT FOR EDIT MODE ────────────────────────────
  useEffect(() => {
    if (!editParam) return;

    let isMounted = true;
    setIsLoadingEditData(true);

    async function loadEventToEdit() {
      try {
        let found: ExtendedEvent | null = null;

        // 0. Try sessionStorage first (set by Dashboard Edit button — most reliable)
        try {
          const cached = sessionStorage.getItem('hackers_unity_edit_event');
          if (cached) {
            const parsed = JSON.parse(cached) as ExtendedEvent;
            if (parsed && (parsed.id === editParam || parsed.slug === editParam)) {
              found = parsed;
              sessionStorage.removeItem('hackers_unity_edit_event');
            }
          }
        } catch {
          // ignore parse errors
        }

        // 1. Try remote fetch from Supabase
        if (!found) {
          found = await fetchEventBySlug(editParam!);
        }

        // 2. Try local storage
        if (!found) {
          const custom = getCustomEvents();
          found = custom.find((e) => e.id === editParam || e.slug === editParam) || null;
        }

        // 3. Try mock data
        if (!found) {
          found = MOCK_EVENTS.find((e) => e.id === editParam || e.slug === editParam) || null;
        }

        if (found && isMounted) {
          setIsEditMode(true);
          setEditingEventId(found.id);
          setOriginalEventSlug(found.slug);

          setTitle(found.title || found.name || '');
          setTagline(found.tagline || '');
          setLogoPreview(found.logoUrl || found.organizerLogo || null);
          setBannerPreview(found.bannerUrl || found.image || null);
          setDescription(found.description || '');
          setCategory(found.category || EventCategory.HACKATHON);
          setEventType(found.eventType || (found.mode === 'Online' ? EventType.ONLINE : EventType.OFFLINE));
          setLocation(found.location || 'Online');

          if (found.organizerName) {
            if (found.organizerName.includes('•')) {
              const parts = found.organizerName.split('•').map((s) => s.trim());
              setInstitutionName(parts[0] || '');
              setOrganizerLeadName(parts[1] || '');
            } else {
              setInstitutionName(found.organizerName);
            }
          }

          if (found.startDate) {
            setStartDate(found.startDate.split('T')[0] || '');
          }
          if (found.endDate) {
            setEndDate(found.endDate.split('T')[0] || '');
          }
          if (found.registrationDeadline) {
            setRegistrationDeadline(found.registrationDeadline.split('T')[0] || '');
          }
          if (found.registrationStart) {
            setRegistrationStart(found.registrationStart.split('T')[0] || '');
          }
          if (found.timezone) {
            setTimezone(found.timezone);
          }
          if (found.minTeamSize) {
            setMinTeamSize(found.minTeamSize);
          }
          if (found.maxTeamSize) {
            setMaxTeamSize(found.maxTeamSize);
          }
          if (found.eligibility) {
            setEligibility(found.eligibility);
          }
          if (found.difficulty) {
            setDifficulty(found.difficulty);
          }
          if (found.tags && found.tags.length > 0) {
            setTagsInput(found.tags.join(', '));
          }
          if (found.rulesText) {
            setRulesText(found.rulesText);
          }
          if (found.prizes && found.prizes.length > 0) {
            setPrizes(
              found.prizes.map((p) => ({
                position: p.position,
                amount: Number(p.amount || 0),
                description: p.description || '',
              }))
            );
          }
          if (found.tracks && found.tracks.length > 0) {
            setTracks(found.tracks);
          }
          if (found.currency) {
            setCurrency(found.currency);
          }
          if (found.previewToken) {
            setPreviewToken(found.previewToken);
          }
          if (found.registrationType) {
            setRegistrationType(found.registrationType as 'FREE' | 'PAID');
          }
          if (found.entryFee !== undefined && found.entryFee !== null) {
            setEntryFee(found.entryFee);
          }
          if (found.registrationCapacity) {
            setRegistrationCapacity(found.registrationCapacity);
            setIsUnlimitedCapacity(false);
          } else {
            setRegistrationCapacity(null);
            setIsUnlimitedCapacity(true);
          }
          if (found.approvalMode) {
            setApprovalMode(found.approvalMode as 'AUTO' | 'MANUAL');
          } else {
            setApprovalMode('MANUAL');
          }
          if (found.registrationFields && Array.isArray(found.registrationFields)) {
            const optionalInEvent = found.registrationFields.filter(
              (f: string) => !['name', 'email', 'phone', 'college', 'city'].includes(f.toLowerCase())
            );
            setSelectedOptionalFields(optionalInEvent);
          }
          if (found.customQuestions && found.customQuestions.length > 0) {
            setCustomQuestions(found.customQuestions);
          }
        }
      } catch (err) {
        console.warn('Failed to load event to edit:', err);
      } finally {
        if (isMounted) setIsLoadingEditData(false);
      }
    }

    loadEventToEdit();

    return () => {
      isMounted = false;
    };
  }, [editParam]);

  // ─── Pure Date Validation Calculation ────────────────────
  const dateErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    const regStart = registrationStart ? new Date(registrationStart) : null;
    const regEnd = registrationDeadline ? new Date(registrationDeadline) : null;
    const hackStart = startDate ? new Date(startDate) : null;
    const hackEnd = endDate ? new Date(endDate) : null;

    if (regStart && regEnd && regStart >= regEnd) {
      errors.registrationDeadline = 'Registration deadline must be after registration start';
    }
    if (regEnd && hackStart && regEnd > hackStart) {
      errors.startDate = 'Hackathon start must be after registration deadline';
    }
    if (hackStart && hackEnd && hackStart >= hackEnd) {
      errors.endDate = 'Hackathon end must be after hackathon start';
    }
    return errors;
  }, [registrationStart, registrationDeadline, startDate, endDate]);

  const isDatesValid = Object.keys(dateErrors).length === 0;

  // ─── File Handlers with Client Compression ──────────────
  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target?.result as string);
      };
      reader.onerror = () => resolve('');
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 400, 0.85);
      if (compressed) {
        setLogoPreview(compressed);
      }

      // Async upload to Supabase storage
      try {
        const { url } = await uploadHackathonAsset(file, 'logos');
        if (url) {
          setLogoPreview(url);
        }
      } catch (err) {
        console.warn('Storage upload error:', err);
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 1200, 0.78);
      if (compressed) {
        setBannerPreview(compressed);
      }

      // Async upload to Supabase storage
      try {
        const { url } = await uploadHackathonAsset(file, 'banners');
        if (url) {
          setBannerPreview(url);
        }
      } catch (err) {
        console.warn('Storage upload error:', err);
      }
    }
  };

  // ─── Prize & Track Management ───────────────────────────
  const addPrize = () => {
    setPrizes((prev) => [...prev, { position: `${prev.length + 1}th Prize`, amount: 0, description: '' }]);
  };
  const removePrize = (idx: number) => {
    if (prizes.length > 1) setPrizes((prev) => prev.filter((_, i) => i !== idx));
  };
  const updatePrize = (idx: number, field: string, value: string | number) => {
    setPrizes((prev) => {
      const updated = [...prev];
      (updated[idx] as any)[field] = value;
      return updated;
    });
  };

  const addTrack = () => {
    setTracks((prev) => [...prev, { title: '', prize: '', description: '' }]);
  };
  const removeTrack = (idx: number) => {
    if (tracks.length > 1) setTracks((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateTrack = (idx: number, field: string, value: string) => {
    setTracks((prev) => {
      const updated = [...prev];
      (updated[idx] as any)[field] = value;
      return updated;
    });
  };

  // ─── Custom Questions ───────────────────────────────────
  const addCustomQuestion = () => {
    if (!newQuestionLabel.trim()) return;
    setCustomQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}`,
        label: newQuestionLabel.trim(),
        type: newQuestionType,
        required: false,
      },
    ]);
    setNewQuestionLabel('');
  };
  const removeCustomQuestion = (id: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // ─── Build Preview Event ────────────────────────────────
  const previewEvent = useMemo<ExtendedEvent>(() => {
    return {
      id: isEditMode && editingEventId ? editingEventId : `evt_custom_${Date.now()}`,
      organizerId: user?.id || 'usr_me',
      organizerName,
      organizerAvatar: hostType === 'COLLEGE' ? '🎓' : '⚡',
      title: title || 'Untitled Hackathon',
      slug: isEditMode && originalEventSlug ? originalEventSlug : slug,
      tagline: tagline || '',
      description: description || 'Join this hackathon to innovate, build real-world solutions, and compete for prizes.',
      category,
      eventType,
      startDate: startDate ? `${startDate}T00:00:00Z` : new Date(Date.now() + 30 * 86400000).toISOString(),
      endDate: endDate ? `${endDate}T23:59:59Z` : new Date(Date.now() + 45 * 86400000).toISOString(),
      registrationDeadline: registrationDeadline ? `${registrationDeadline}T23:59:59Z` : new Date(Date.now() + 28 * 86400000).toISOString(),
      registrationStart: registrationStart ? `${registrationStart}T00:00:00Z` : undefined,
      timezone,
      eligibilityRules: { openGlobally: true, eligibility },
      eligibility,
      difficulty,
      rulesText,
      prizes: prizes.map((p) => ({ ...p, amount: Number(p.amount) })),
      totalPrizeValue: totalPrize,
      bannerUrl: bannerPreview,
      logoUrl: logoPreview,
      image: bannerPreview || undefined,
      rulesDocUrl: null,
      status: isEditMode ? EventStatus.PUBLISHED : EventStatus.PENDING_APPROVAL,
      maxParticipants: isUnlimitedCapacity || !registrationCapacity ? null : registrationCapacity,
      minTeamSize: Number(minTeamSize),
      maxTeamSize: Number(maxTeamSize),
      isTeamEvent: true,
      location,
      createdAt: new Date().toISOString(),
      participantsCount: 1,
      featured: true,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      bannerGradient: 'from-sky-50 via-white to-orange-50/60',
      tracks,
      currency,
      previewToken: previewToken || getEventPreviewToken({ slug, id: editingEventId || undefined }),
      prize: `${currencySymbol}${totalPrize.toLocaleString('en-IN')}`,
      registrationType,
      entryFee: registrationType === 'PAID' ? Number(entryFee) || 0 : null,
      registrationCapacity: isUnlimitedCapacity ? null : registrationCapacity,
      approvalMode,
      registrationFields: [
        'name',
        'email',
        'phone',
        'college',
        'city',
        ...selectedOptionalFields,
      ],
      customQuestions,
      stages: [
        {
          id: 'stg_c1',
          eventId: 'preview',
          stageName: 'Registration',
          stageOrder: 1,
          startDate: registrationStart ? `${registrationStart}T00:00:00Z` : null,
          endDate: registrationDeadline ? `${registrationDeadline}T23:59:59Z` : null,
          description: 'Squad formation and track selection',
        },
        {
          id: 'stg_c2',
          eventId: 'preview',
          stageName: 'Hacking Sprint & Submissions',
          stageOrder: 2,
          startDate: startDate ? `${startDate}T00:00:00Z` : null,
          endDate: endDate ? `${endDate}T23:59:59Z` : null,
          description: 'Ship working code, repos, and demo videos',
        },
      ],
      faqs: [
        {
          id: 'faq_c1',
          eventId: 'preview',
          question: 'Who can participate?',
          answer: eligibility || 'Anyone! All builders, students, and engineers globally are eligible.',
          createdAt: new Date().toISOString(),
        },
      ],
      sponsors: [{ name: institutionName || organizerName || 'Host Guild', tier: 'Organizer', logoText: hostType === 'COLLEGE' ? 'CAMPUS' : 'HOST' }],
    };
  }, [
    isEditMode,
    editingEventId,
    originalEventSlug,
    user?.id,
    organizerName,
    hostType,
    institutionName,
    title,
    slug,
    tagline,
    description,
    category,
    eventType,
    startDate,
    endDate,
    registrationDeadline,
    registrationStart,
    timezone,
    eligibility,
    difficulty,
    rulesText,
    prizes,
    totalPrize,
    bannerPreview,
    logoPreview,
    registrationCapacity,
    isUnlimitedCapacity,
    minTeamSize,
    maxTeamSize,
    location,
    tagsInput,
    tracks,
    currency,
    currencySymbol,
    previewToken,
    registrationType,
    entryFee,
    approvalMode,
    customQuestions,
  ]);

  // ─── PRIVATE LINK & PREVIEW ACCESS ─────────────────────
  const privateLink = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hackersunity.com';
    const token = previewEvent.previewToken || previewToken || getEventPreviewToken(previewEvent);
    return `${origin}/hackathons/${previewEvent.slug}?preview_key=${token}`;
  }, [previewEvent.slug, previewEvent.previewToken, previewToken]);

  const handleCopyPrivateLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(privateLink);
      setCopiedPrivateLink(true);
      setTimeout(() => setCopiedPrivateLink(false), 2500);
    }
  };

  // ─── EMAIL DRAFT & NOTIFICATION GENERATORS ──────────────
  const emailSubject = useMemo(() => {
    return `[Hackathon Approval Request] "${title || previewEvent.title}" hosted by ${organizerName || 'Organizer'}`;
  }, [title, previewEvent.title, organizerName]);

  const emailBodyText = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hackersunity.com';
    const feeText =
      registrationType === 'PAID'
        ? `${currencySymbol}${Number(entryFee || 0).toLocaleString('en-IN')} ${currency} (Paid Entry)`
        : 'Free Entry (No Fee)';

    return `Dear Hacker's Unity Operations Team,

A new hackathon submission request has been submitted on Hacker's Unity and is awaiting your review & approval:

========================================
📋 HACKATHON SPECIFICATIONS
========================================
• Event Title: ${title || previewEvent.title}
• Tagline: ${tagline || 'N/A'}
• Organizer / Guild: ${organizerName || 'Host'}
• Organizer Contact: ${user?.email || 'N/A'}${user?.phone ? ` (${user?.phone})` : ''}
• Host Entity: ${institutionName || 'Independent'} (${hostType === 'COLLEGE' ? 'College' : 'Organization'})
• Format & Venue: ${eventType} • ${location || 'Virtual'}
• Total Prize Pool: ${currencySymbol}${totalPrize.toLocaleString('en-IN')} (${currency})
• Registration Type: ${feeText}
• Registration Capacity: ${isUnlimitedCapacity || !registrationCapacity ? 'Unlimited' : `${registrationCapacity} Hackers`}
• Team Size: ${minTeamSize} to ${maxTeamSize} Members
• Tech Tags / Domains: ${tagsInput || 'N/A'}

========================================
📅 SCHEDULE & DATES
========================================
• Registration Opens: ${registrationStart || 'Immediate'}
• Registration Deadline: ${registrationDeadline || 'TBD'}
• Hackathon Sprint Starts: ${startDate || 'TBD'}
• Hackathon Sprint Ends: ${endDate || 'TBD'}
• Timezone: ${timezone}

========================================
🏆 PRIZE DISTRIBUTION
========================================
${prizes.map((p) => `• ${p.position}: ${currencySymbol}${Number(p.amount || 0).toLocaleString('en-IN')} - ${p.description || 'Prize'}`).join('\n')}

========================================
🎯 TRACKS
========================================
${tracks.map((t) => `• ${t.title} [Prize: ${t.prize}]: ${t.description}`).join('\n')}

========================================
📝 DESCRIPTION & RULES
========================================
Description:
${description || 'N/A'}

Eligibility:
${eligibility || 'Open to all builders'}

Rules & Guidelines:
${rulesText || 'Standard platform hackathon rules apply'}

========================================
🔗 DIRECT PRIVATE PREVIEW LINK
========================================
${privateLink}
(Anyone with this private link can view full event details even before public approval)

Please review the specifications and approve this hackathon to publish it live on the platform.

Best regards,
${organizerName || 'Organizer'}`;
  }, [
    title,
    previewEvent.title,
    privateLink,
    tagline,
    organizerName,
    user?.email,
    user?.phone,
    institutionName,
    hostType,
    eventType,
    location,
    currencySymbol,
    totalPrize,
    currency,
    registrationType,
    entryFee,
    isUnlimitedCapacity,
    registrationCapacity,
    minTeamSize,
    maxTeamSize,
    tagsInput,
    registrationStart,
    registrationDeadline,
    startDate,
    endDate,
    timezone,
    prizes,
    tracks,
    description,
    eligibility,
    rulesText,
  ]);

  const gmailDraftUrl = useMemo(() => {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=hackerunity.community@gmail.com&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyText)}`;
  }, [emailSubject, emailBodyText]);

  const mailtoUrl = useMemo(() => {
    return `mailto:hackerunity.community@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyText)}`;
  }, [emailSubject, emailBodyText]);

  const handleTriggerResend = async () => {
    setIsSendingEmail(true);
    setEmailSentSuccess(null);
    try {
      const res = await fetch('/api/host-approval-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: previewEvent,
          organizerName: organizerName || user?.name || 'Organizer',
          organizerEmail: user?.email || '',
          organizerPhone: user?.phone || '',
          hostType,
          institutionName,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        if (data.sentTo) {
          setEmailSentSuccess(`✅ Approval notification dispatched via Resend to ${data.sentTo}!`);
        } else {
          setEmailSentSuccess(`✅ Approval notification dispatched successfully!`);
        }
      } else {
        setEmailSentSuccess(`⚠️ Resend: ${data.message || data.error || 'Check Resend domain setup'}. Use the "Open in Gmail Draft" button below.`);
      }
    } catch (err: any) {
      setEmailSentSuccess(`⚠️ Resend request error: ${err.message}. Please use the "Open in Gmail Draft" button.`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCopyAllInfo = () => {
    navigator.clipboard.writeText(emailBodyText);
    setCopiedDetails(true);
    setTimeout(() => setCopiedDetails(false), 2500);
  };

  // ─── Publish & Draft Handlers ───────────────────────────
  const handlePublish = async () => {
    setIsSaving(true);
    const targetStatus = isEditMode ? EventStatus.PUBLISHED : EventStatus.PENDING_APPROVAL;
    const event: ExtendedEvent = { ...previewEvent, status: targetStatus };
    const organizerId = supabaseUser?.id || user?.id;

    if (isEditMode && editingEventId) {
      // 1. Update in local storage
      updateHostedEvent(event);

      // 2. Update in Supabase / Server API
      await updateEventInSupabase(editingEventId, event);
      setIsSaving(false);
      setSubmittedEvent(event);
      setIsSuccess(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      return;
    }

    // 1. Persist to local storage immediately
    saveHostedEvent(event);

    // 2. Persist to Supabase / Server API
    const res = await createEventInSupabase(event, organizerId);

    // 3. Dispatch approval request email to hackerunity.community@gmail.com
    try {
      fetch('/api/host-approval-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          organizerName: organizerName || user?.name || 'Organizer',
          organizerEmail: user?.email || '',
          organizerPhone: user?.phone || '',
          hostType,
          institutionName,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.sentTo) {
            setEmailSentSuccess(`✅ Approval notification dispatched via Resend to ${data.sentTo}`);
          }
        })
        .catch((err) => {
          console.warn('Failed to send approval email notification:', err);
        });
    } catch (err) {
      console.warn('Approval email trigger error:', err);
    }

    setIsSaving(false);
    const finalEvent = (res.success && res.data) ? res.data : event;
    setSubmittedEvent(finalEvent);
    setIsSuccess(true);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    const event = { ...previewEvent, status: EventStatus.DRAFT };
    const organizerId = supabaseUser?.id || user?.id;
    if (isEditMode && editingEventId) {
      updateHostedEvent(event);
      await updateEventInSupabase(editingEventId, event);
    } else {
      saveDraftEvent(event);
      await createEventInSupabase(event, organizerId);
    }
    setIsSaving(false);
    alert('Draft saved successfully! You can find it anytime in your Organizer Dashboard.');
  };

  const handlePreview = () => {
    window.open(`/hackathons/${previewEvent.slug}`, '_blank');
  };

  // ─── Step Navigation ────────────────────────────────────
  const canGoNext = (): boolean => {
    switch (step) {
      case 1:
        return !!title.trim() && !!organizerName.trim() && !!description.trim();
      case 2:
        return !!startDate && !!endDate && !!registrationDeadline && isDatesValid;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (step === 2 && !isDatesValid) return;
    if (step < TOTAL_STEPS) setStep((prev) => prev + 1);
  };
  const goBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const stepLabels = [
    { num: 1, label: 'Basic Info', icon: Sparkles },
    { num: 2, label: 'Dates', icon: Calendar },
    { num: 3, label: 'Details', icon: FileText },
    { num: 4, label: 'Prizes', icon: Trophy },
    { num: 5, label: 'Registration', icon: Settings },
    { num: 6, label: 'Submission', icon: Rocket },
    { num: 7, label: 'Review', icon: Eye },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* ─── Page Header ────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
              isEditMode
                ? 'bg-amber-50 border border-amber-200 text-amber-700'
                : 'bg-orange-50 border border-orange-200 text-[#ea580c]'
            }`}
          >
            {isEditMode ? <Sparkles className="w-3.5 h-3.5 text-amber-600" /> : <PlusCircle className="w-3.5 h-3.5" />}
            <span>{isEditMode ? 'Editing Hackathon Studio' : 'Organizer Studio'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {isEditMode ? `Edit Hackathon: ${title || 'Hackathon'}` : "Host a Hackathon on Hacker's Unity"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl font-medium">
            {isEditMode
              ? 'Update dates, prize pools, parameters, registration rules, and custom questions for your hackathon.'
              : 'Launch your hackathon in minutes. Tap into our 50,000+ developer ecosystem, automated submission portals, and instant registration workflows.'}
          </p>
        </div>

        {isEditMode && (
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-2 shadow-2xs self-start md:self-auto cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Dashboard</span>
          </button>
        )}
      </div>

      {isLoadingEditData ? (
        <div className="py-24 bg-white rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#0099e6] animate-spin" />
          <p className="text-xs font-bold text-slate-600">Loading hackathon parameters for editing...</p>
        </div>
      ) : isSuccess ? (
        <div className="py-16 px-6 bg-white rounded-3xl border border-sky-200 shadow-xl text-center flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-50 to-orange-50 border-2 border-[#0099e6]/30 flex items-center justify-center text-[#0099e6] shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-[#0099e6]" />
          </div>
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{isEditMode ? 'Updated' : 'Request Submitted • Pending Review'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isEditMode ? 'Hackathon Updated Successfully!' : 'Hackathon Submission Request Received!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed font-medium">
              {isEditMode ? (
                <>Changes for <strong className="text-slate-900">{submittedEvent?.title || previewEvent.title}</strong> have been saved successfully.</>
              ) : (
                <>Your hackathon <strong className="text-slate-900">&quot;{submittedEvent?.title || previewEvent.title}&quot;</strong> has been submitted for review. An approval request has been sent to <strong className="text-[#0099e6]">hackerunity.community@gmail.com</strong>. Once approved by the team, it will go live globally across the platform.</>
              )}
            </p>
          </div>

          {/* ═══ PRIVATE SHAREABLE LINK CARD ═══════════════════ */}
          <div className="w-full p-5 rounded-3xl bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/90 border-2 border-amber-300/80 text-left space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-[#ea580c] flex items-center justify-center text-white shadow-xs">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>Private Shareable Link</span>
                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-300">
                      Private Access
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Anyone with this link can view the event specifications right now
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              This hackathon is not publicly listed on the platform yet. However, <strong>anyone you share this private link with</strong> can open and preview all event details, prizes, timeline, and rules without restrictions:
            </p>

            {/* Input & Copy Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2 rounded-2xl border border-amber-200 shadow-2xs">
              <div className="flex-1 flex items-center gap-2 px-2 overflow-hidden">
                <Link2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={privateLink}
                  className="w-full bg-transparent text-xs font-mono font-bold text-slate-800 outline-none truncate select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyPrivateLink}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  {copiedPrivateLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrivateLink ? 'Copied Link!' : 'Copy Private Link'}</span>
                </button>
                <a
                  href={privateLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Preview</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            </div>
          </div>

          {/* Email Dispatch & Gmail Draft Action Box */}
          {!isEditMode && (
            <div className="w-full p-5 rounded-2xl bg-sky-50/80 border border-sky-200 text-left space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0099e6] flex items-center justify-center text-white shadow-xs">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Send Details to hackerunity.community@gmail.com
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      One-click draft creation with full hackathon specifications
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#0099e6] bg-white px-3 py-1 rounded-full border border-sky-200 shadow-2xs">
                  hackerunity.community@gmail.com
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Click <strong className="text-slate-900">&quot;Open in Gmail Draft&quot;</strong> below to instantly open Gmail with a pre-filled draft containing all event specifications (prizes, dates, venue, rules, links) addressed to <strong className="text-slate-900">hackerunity.community@gmail.com</strong>:
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {/* Gmail Draft Button */}
                <a
                  href={gmailDraftUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Open in Gmail Draft</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>

                {/* Direct Resend Dispatch */}
                <button
                  type="button"
                  onClick={handleTriggerResend}
                  disabled={isSendingEmail}
                  className="px-4 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{isSendingEmail ? 'Dispatching...' : 'Send via Resend API'}</span>
                </button>

                {/* Default Mail Client */}
                <a
                  href={mailtoUrl}
                  className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Default Mail App</span>
                </a>

                {/* Copy Information Button */}
                <button
                  type="button"
                  onClick={handleCopyAllInfo}
                  className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  {copiedDetails ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedDetails ? 'Details Copied!' : 'Copy All Details'}</span>
                </button>
              </div>

              {emailSentSuccess && (
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 animate-in fade-in flex items-center gap-2">
                  <span>{emailSentSuccess}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Details Card */}
          <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>Event Title:</span>
              <strong className="text-slate-900 font-bold">{submittedEvent?.title || previewEvent.title}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>Format &amp; Mode:</span>
              <span className="text-slate-800 font-semibold">{previewEvent.eventType} • {previewEvent.location}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>Entry Fee:</span>
              <span className="text-slate-800 font-semibold">{previewEvent.registrationType === 'PAID' ? `${currencySymbol}${Number(previewEvent.entryFee || 0).toLocaleString('en-IN')} (${currency})` : 'Free Entry'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>Review Status:</span>
              <span className="text-amber-700 font-bold bg-amber-100 px-2.5 py-0.5 rounded-full text-[10px] border border-amber-200">
                {isEditMode ? 'Saved' : '⏳ Pending Review'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center pt-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Go to Organizer Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                setStep(1);
                setTitle('');
                setDescription('');
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <span>Host Another Hackathon</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step Wizard indicator */}
            <div className="flex items-center gap-1 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs font-bold overflow-x-auto scrollbar-none">
              {stepLabels.map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setStep(s.num)}
                  className={`flex-1 py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    step === s.num
                      ? 'bg-[#0099e6] text-white shadow-2xs'
                      : s.num < step
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {s.num < step ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <s.icon className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.num}</span>
                </button>
              ))}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              {/* ═══ STEP 1: Basic Info ═══════════════════════════════ */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0099e6]" />
                    <span>General Information</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hackathon Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NextGen Autonomous Agents Hackathon 2026"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Short Tagline</label>
                    <input
                      type="text"
                      placeholder="e.g. Build the future of AI in 48 hours"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      maxLength={100}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5 text-right">{tagline.length}/100</p>
                  </div>

                  {/* Logo & Banner Upload */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hackathon Logo</label>
                      <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="w-full h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#0099e6] bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-[#0099e6] transition-all cursor-pointer overflow-hidden"
                      >
                        {logoPreview ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            <span className="text-[10px] font-bold">Upload Logo</span>
                          </>
                        )}
                      </button>
                      {logoPreview && (
                        <button onClick={() => setLogoPreview(null)} className="text-[10px] text-red-500 mt-1 cursor-pointer hover:underline">Remove</button>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Banner / Cover Image</label>
                      <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="w-full h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#0099e6] bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-[#0099e6] transition-all cursor-pointer overflow-hidden"
                      >
                        {bannerPreview ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-[10px] font-bold">Upload Banner</span>
                          </>
                        )}
                      </button>
                      {bannerPreview && (
                        <button onClick={() => setBannerPreview(null)} className="text-[10px] text-red-500 mt-1 cursor-pointer hover:underline">Remove</button>
                      )}
                    </div>
                  </div>

                  {/* Organizing Entity Type: College vs Organization/Community */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Who is organizing this hackathon? *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setHostType('COLLEGE')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          hostType === 'COLLEGE'
                            ? 'bg-sky-50/90 border-[#0099e6] text-[#0099e6] shadow-xs ring-2 ring-[#0099e6]/20'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl ${hostType === 'COLLEGE' ? 'bg-[#0099e6] text-white shadow-2xs' : 'bg-white text-slate-500 border border-slate-200'}`}>
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">College / University</div>
                          <div className="text-[10px] text-slate-500">Student club, campus chapter, department</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHostType('ORGANIZATION')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          hostType === 'ORGANIZATION'
                            ? 'bg-orange-50/90 border-[#f97316] text-[#ea580c] shadow-xs ring-2 ring-[#f97316]/20'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl ${hostType === 'ORGANIZATION' ? 'bg-[#f97316] text-white shadow-2xs' : 'bg-white text-slate-500 border border-slate-200'}`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Organization / Community</div>
                          <div className="text-[10px] text-slate-500">Tech community, startup, enterprise, DAO</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* College / Organization Name & Organizer Lead Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {hostType === 'COLLEGE' ? 'College / University / Club Name *' : 'Organization / Community Name *'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder={hostType === 'COLLEGE' ? 'e.g. University / Campus Club' : 'e.g. Organization / Community Name'}
                          value={institutionName}
                          onChange={(e) => setInstitutionName(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                        />
                        <div className="absolute left-3 top-3 pointer-events-none">
                          {hostType === 'COLLEGE' ? (
                            <GraduationCap className="w-4 h-4 text-[#0099e6]" />
                          ) : (
                            <Building2 className="w-4 h-4 text-[#ea580c]" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Organizer / Lead Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Organizer / Lead Name"
                          value={organizerLeadName}
                          onChange={(e) => setOrganizerLeadName(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                        />
                        <div className="absolute left-3 top-3 pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>


                  <div>
                    <RichTextEditor
                      label="Description & Mission *"
                      rows={5}
                      placeholder="What are hackers building? What tools, problem statements, and judging criteria are in scope? (supports bold, lists, headings, links)..."
                      value={description}
                      onChange={(val) => setDescription(val)}
                      helperText="Rich formatting enabled (Bold, Lists, Headings, Code, Links)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Event Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as EventCategory)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                      >
                        <option value={EventCategory.HACKATHON}>Hackathon</option>
                        <option value={EventCategory.COMPETITION}>Competition</option>
                        <option value={EventCategory.WORKSHOP}>Workshop / Sprint</option>
                        <option value={EventCategory.QUIZ}>Speed Contest</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Format</label>
                      <select
                        value={eventType}
                        onChange={(e) => {
                          const val = e.target.value as EventType;
                          setEventType(val);
                          if (val === EventType.ONLINE) setLocation('Online / Discord');
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                      >
                        <option value={EventType.ONLINE}>Virtual / Online</option>
                        <option value={EventType.OFFLINE}>In-Person</option>
                        <option value={EventType.HYBRID}>Hybrid</option>
                      </select>
                    </div>
                  </div>

                  {(eventType === EventType.OFFLINE || eventType === EventType.HYBRID) && (
                    <VenuePicker
                      value={location}
                      onChange={(val) => setLocation(val)}
                      label="Location / In-Person Venue *"
                      placeholder="Search campus, landmark, building, or city..."
                    />
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!canGoNext()}
                      className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Continue to Dates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 2: Dates & Schedule ═══════════════════════ */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0099e6]" />
                    <span>Dates & Schedule</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Registration Opens</label>
                      <input
                        type="date"
                        value={registrationStart}
                        onChange={(e) => setRegistrationStart(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Registration Deadline *</label>
                      <input
                        type="date"
                        required
                        value={registrationDeadline}
                        onChange={(e) => setRegistrationDeadline(e.target.value)}
                        className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6] ${dateErrors.registrationDeadline ? 'border-red-400' : 'border-slate-200'}`}
                      />
                      {dateErrors.registrationDeadline && (
                        <p className="text-[10px] text-red-500 mt-0.5">{dateErrors.registrationDeadline}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hackathon Start *</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6] ${dateErrors.startDate ? 'border-red-400' : 'border-slate-200'}`}
                      />
                      {dateErrors.startDate && (
                        <p className="text-[10px] text-red-500 mt-0.5">{dateErrors.startDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hackathon End *</label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6] ${dateErrors.endDate ? 'border-red-400' : 'border-slate-200'}`}
                      />
                      {dateErrors.endDate && (
                        <p className="text-[10px] text-red-500 mt-0.5">{dateErrors.endDate}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button type="button" onClick={goBack} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" /> <span>Back</span>
                    </button>
                    <button type="button" onClick={goNext} disabled={!canGoNext()} className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed">
                      <span>Continue to Details</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 3: Hackathon Details ═══════════════════════ */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0099e6]" />
                    <span>Hackathon Details</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Min Team Size</label>
                      <input type="number" min={1} max={10} value={minTeamSize} onChange={(e) => setMinTeamSize(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Max Team Size</label>
                      <input type="number" min={1} max={10} value={maxTeamSize} onChange={(e) => setMaxTeamSize(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Eligibility</label>
                    <textarea rows={2} placeholder="e.g. Open to all college students and independent builders across India" value={eligibility} onChange={(e) => setEligibility(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none resize-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty Level</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]">
                      {DIFFICULTY_LEVELS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Domains / Tech Tags (comma separated)</label>
                    <input type="text" placeholder="GenAI, Python, Agents, Next.js" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none" />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tagsInput.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-100 text-[10px] font-mono font-semibold text-[#0099e6]">#{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <RichTextEditor
                      label="Rules & Guidelines"
                      rows={4}
                      placeholder="Enter the rules, submission criteria, judging parameters, and code of conduct..."
                      value={rulesText}
                      onChange={(val) => setRulesText(val)}
                      helperText="Use bullet points, numbered lists, or bold highlights"
                    />
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button type="button" onClick={goBack} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" /> <span>Back</span>
                    </button>
                    <button type="button" onClick={goNext} className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
                      <span>Continue to Prizes</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 4: Prizes & Tracks ═══════════════════════ */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#ea580c]" />
                    <span>Prizes & Tracks</span>
                  </h3>

                  {/* Prizes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-bold text-slate-700">Prize Distribution</label>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[11px] font-bold text-slate-500">Currency:</span>
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-[#0099e6] cursor-pointer"
                          >
                            {CURRENCIES.map((c) => (
                              <option key={c.code} value={c.code}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <button type="button" onClick={addPrize} className="text-xs text-[#0099e6] font-bold flex items-center gap-1 cursor-pointer hover:underline">
                          <Plus className="w-3 h-3" /> Add Prize
                        </button>
                      </div>
                    </div>
                    {prizes.map((prize, idx) => (
                      <div key={idx} className="flex gap-2 items-start p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex-1 space-y-2">
                          <input type="text" placeholder="e.g. 🥇 1st Prize" value={prize.position} onChange={(e) => updatePrize(idx, 'position', e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                          <div className="grid grid-cols-2 gap-2">
                            <input type="number" placeholder={`Amount (${currencySymbol})`} value={prize.amount} onChange={(e) => updatePrize(idx, 'amount', Number(e.target.value))} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-[#0099e6] font-mono" />
                            <input type="text" placeholder="Description" value={prize.description} onChange={(e) => updatePrize(idx, 'description', e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                          </div>
                        </div>
                        {prizes.length > 1 && (
                          <button type="button" onClick={() => removePrize(idx)} className="p-1 text-slate-400 hover:text-red-500 cursor-pointer mt-1">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-[#ea580c] flex items-center justify-between font-mono font-black">
                    <span>Total Prize Pool:</span>
                    <span className="text-base font-extrabold">{currencySymbol}{totalPrize.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Tracks */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#0099e6]" /> Hackathon Tracks
                      </label>
                      <button type="button" onClick={addTrack} className="text-xs text-[#0099e6] font-bold flex items-center gap-1 cursor-pointer hover:underline">
                        <Plus className="w-3 h-3" /> Add Track
                      </button>
                    </div>
                    {tracks.map((track, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex gap-2">
                          <input type="text" placeholder="Track Name" value={track.title} onChange={(e) => updateTrack(idx, 'title', e.target.value)} className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                          <input type="text" placeholder={`Prize (e.g. ${currencySymbol}50,000)`} value={track.prize} onChange={(e) => updateTrack(idx, 'prize', e.target.value)} className="w-32 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                          {tracks.length > 1 && (
                            <button type="button" onClick={() => removeTrack(idx)} className="p-1 text-slate-400 hover:text-red-500 cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <input type="text" placeholder="Track description" value={track.description} onChange={(e) => updateTrack(idx, 'description', e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button type="button" onClick={goBack} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" /> <span>Back</span>
                    </button>
                    <button type="button" onClick={goNext} className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
                      <span>Continue to Registration</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 5: Registration Settings ═══════════════════ */}
              {step === 5 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#0099e6]" />
                    <span>Registration Settings</span>
                  </h3>

                  {/* Free/Paid toggle */}
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setRegistrationType('FREE')} className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${registrationType === 'FREE' ? 'bg-emerald-50/80 border-emerald-400 shadow-xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                      <Globe className="w-5 h-5 mb-1.5 text-emerald-600" />
                      <div className="text-sm font-bold text-slate-900">Free Entry</div>
                      <div className="text-[11px] text-slate-500">No registration fee</div>
                    </button>
                    <button type="button" onClick={() => setRegistrationType('PAID')} className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${registrationType === 'PAID' ? 'bg-orange-50/80 border-[#f97316] shadow-xs ring-2 ring-[#f97316]/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                      <Trophy className="w-5 h-5 mb-1.5 text-[#f97316]" />
                      <div className="text-sm font-bold text-slate-900">Paid Entry</div>
                      <div className="text-[11px] text-slate-500">Charge a registration fee</div>
                    </button>
                  </div>

                  {/* Amount Input Box when Paid Entry is chosen */}
                  {registrationType === 'PAID' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/70 border border-orange-200 shadow-xs space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800">
                          Registration Fee / Entry Amount *
                        </label>
                        <span className="text-[10px] font-extrabold text-[#ea580c] bg-orange-100 px-2.5 py-0.5 rounded-full uppercase border border-orange-200">
                          Paid Hackathon
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Currency
                          </label>
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#f97316] cursor-pointer"
                          >
                            {CURRENCIES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Fee Amount ({currencySymbol})
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">
                              {currencySymbol}
                            </span>
                            <input
                              type="number"
                              min="1"
                              value={entryFee === 0 || entryFee === '0' ? '' : entryFee}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                                setEntryFee(val);
                              }}
                              placeholder="e.g. 250"
                              required={registrationType === 'PAID'}
                              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                            />
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium">
                        Participants will pay {currencySymbol}{Number(entryFee || 0).toLocaleString('en-IN')} as entry fee when registering for this hackathon.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">Registration Capacity</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUnlimitedCapacity(!isUnlimitedCapacity);
                            if (!isUnlimitedCapacity) {
                              setRegistrationCapacity(null);
                            } else {
                              setRegistrationCapacity(500);
                            }
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                            isUnlimitedCapacity
                              ? 'bg-sky-100 text-[#0099e6]'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isUnlimitedCapacity ? 'Unlimited Capacity' : 'Set to Unlimited'}
                        </button>
                      </div>

                      {isUnlimitedCapacity ? (
                        <div className="w-full px-3.5 py-2.5 bg-sky-50/80 border border-sky-200 rounded-xl text-xs font-bold text-[#0099e6] flex items-center justify-between animate-in fade-in">
                          <span className="flex items-center gap-2">
                            <InfinityIcon className="w-4 h-4 text-[#0099e6]" />
                            <span>Unlimited Registrations (Default)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsUnlimitedCapacity(false);
                              setRegistrationCapacity(500);
                            }}
                            className="text-[10px] text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
                          >
                            Set capacity limit
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="number"
                            min={10}
                            placeholder="e.g. 500"
                            value={registrationCapacity ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : Number(e.target.value);
                              setRegistrationCapacity(val);
                            }}
                            className="w-full pr-16 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsUnlimitedCapacity(true);
                              setRegistrationCapacity(null);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#0099e6] hover:underline cursor-pointer"
                          >
                            Unlimited
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Registration Fields Selection */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div>
                          <label className="text-xs font-bold text-slate-800 block">
                            Registration Form Fields Setup
                          </label>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Mandatory fields are locked by default. Choose which optional fields hackers must provide.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedOptionalFields(AVAILABLE_OPTIONAL_FIELDS.map((f) => f.id))}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-50 text-[#0099e6] hover:bg-sky-100 border border-sky-200 cursor-pointer transition-colors"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOptionalFields([])}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white text-slate-500 hover:text-slate-800 border border-slate-200 cursor-pointer transition-colors"
                          >
                            Clear Optional
                          </button>
                        </div>
                      </div>

                      {/* 1. Mandatory Fields (Locked) */}
                      <div className="space-y-2 mb-5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                          <Lock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mandatory Core Fields (Always Required)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
                          {MANDATORY_REGISTRATION_FIELDS.map((field) => {
                            const IconComponent = field.icon;
                            return (
                              <div
                                key={field.id}
                                className="p-3 rounded-2xl bg-white border border-emerald-200/90 shadow-2xs flex items-center justify-between gap-2.5 select-none"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-slate-800 block truncate">{field.label}</span>
                                    <span className="text-[10px] text-slate-400 font-medium block truncate">{field.description}</span>
                                  </div>
                                </div>
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase shrink-0">
                                  Req *
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Optional Fields (Toggleable) */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" />
                          <span>Optional Additional Fields (Click to Enable / Disable)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {AVAILABLE_OPTIONAL_FIELDS.map((field) => {
                            const isSelected = selectedOptionalFields.includes(field.id);
                            const IconComponent = field.icon;
                            return (
                              <button
                                key={field.id}
                                type="button"
                                onClick={() => {
                                  setSelectedOptionalFields((prev) =>
                                    prev.includes(field.id)
                                      ? prev.filter((id) => id !== field.id)
                                      : [...prev, field.id]
                                  );
                                }}
                                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                  isSelected
                                    ? 'bg-sky-50/70 border-[#0099e6] shadow-2xs ring-1 ring-[#0099e6]/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                                      isSelected
                                        ? 'bg-sky-100 text-[#0099e6] border-sky-200'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}
                                  >
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-900 truncate">
                                      {field.label}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">{field.hint}</div>
                                  </div>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                    isSelected
                                      ? 'bg-[#0099e6] border-[#0099e6] text-white shadow-2xs'
                                      : 'border-slate-300 bg-slate-50'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Custom Questions */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#0099e6]" /> Custom Questions (Optional)
                    </label>

                    {customQuestions.map((q) => (
                      <div key={q.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="flex-1 text-xs text-slate-700 font-medium">{q.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{q.type}</span>
                        <button type="button" onClick={() => removeCustomQuestion(q.id)} className="p-1 text-slate-400 hover:text-red-500 cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <input type="text" placeholder="Question label" value={newQuestionLabel} onChange={(e) => setNewQuestionLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomQuestion())} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                      <select value={newQuestionType} onChange={(e) => setNewQuestionType(e.target.value as any)} className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none">
                        <option value="text">Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="select">Select</option>
                      </select>
                      <button type="button" onClick={addCustomQuestion} className="px-3 py-2 rounded-xl bg-[#0099e6] text-white text-xs font-bold cursor-pointer hover:bg-[#0284c7]">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button type="button" onClick={goBack} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" /> <span>Back</span>
                    </button>
                    <button type="button" onClick={goNext} className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
                      <span>Continue to Submission</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 6: Submission Settings ══════════ */}
              {step === 6 && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-[#0099e6]" />
                      <span>Submission Setup</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure the project submission portal where participants will submit their final builds.
                    </p>
                  </div>

                  {/* Section 1: Required Submission Fields (Locked) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-800">
                            Mandatory Submission Fields
                          </label>
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black uppercase">
                            Required *
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          These fields are strictly mandatory for all submitting builders and squads.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                        3 Fields Locked
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {MANDATORY_SUBMISSION_FIELDS.map((field) => {
                        const Icon = field.icon;
                        return (
                          <div
                            key={field.id}
                            className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-2 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[9px] font-black uppercase border border-rose-200">
                                Required *
                              </span>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{field.label}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{field.description}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 2: Optional Submission Fields (Customizable) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-800">
                            Optional Submission Fields
                          </label>
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                            Optional
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Toggle which optional materials participants can submit to support their projects.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEnabledSubmissionFields(OPTIONAL_SUBMISSION_FIELDS.map((f) => f.id))}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-50 text-[#0099e6] hover:bg-sky-100 border border-sky-200 cursor-pointer"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setEnabledSubmissionFields([])}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {OPTIONAL_SUBMISSION_FIELDS.map((field) => {
                        const Icon = field.icon;
                        const isEnabled = enabledSubmissionFields.includes(field.id);
                        return (
                          <button
                            key={field.id}
                            type="button"
                            onClick={() => toggleSubmissionField(field.id)}
                            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isEnabled
                                ? 'bg-white border-[#0099e6] shadow-xs ring-1 ring-[#0099e6]/20'
                                : 'bg-slate-100/60 border-slate-200 hover:border-slate-300 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isEnabled ? 'bg-sky-50 text-[#0099e6]' : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900 truncate">{field.label}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold uppercase border border-slate-200">
                                    Optional
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">{field.hint}</div>
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                isEnabled
                                  ? 'bg-[#0099e6] border-[#0099e6] text-white shadow-2xs'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isEnabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Submission Guidelines */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#0099e6]" />
                      <span>Submission Guidelines & Judging Criteria for Participants</span>
                    </label>
                    <textarea
                      rows={3}
                      value={submissionGuidelines}
                      onChange={(e) => setSubmissionGuidelines(e.target.value)}
                      placeholder="e.g. Ensure all GitHub repositories are public during judging. Video walkthroughs must be within 3 minutes..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none resize-none leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-400">
                      These instructions will be displayed at the top of the participant project submission modal.
                    </p>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={goBack}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <span>Continue to Review</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 7: Review & Publish ═══════════════════════ */}
              {step === 7 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#0099e6]" />
                    <span>Review & Publish</span>
                  </h3>

                  {/* Summary Sections */}
                  <div className="space-y-3">
                    {/* Basic Info Summary */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Basic Info</span>
                        <button type="button" onClick={() => setStep(1)} className="text-[10px] text-[#0099e6] font-bold cursor-pointer hover:underline">Edit</button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-slate-500">Name:</span> <span className="font-semibold text-slate-900">{title || '—'}</span></div>
                        <div><span className="text-slate-500">Organizer:</span> <span className="font-semibold text-slate-900">{hostType === 'COLLEGE' ? '🎓 ' : '🏢 '}{organizerName || '—'}</span></div>
                        <div><span className="text-slate-500">Format:</span> <span className="font-semibold text-slate-900">{eventType}</span></div>
                        <div><span className="text-slate-500">Category:</span> <span className="font-semibold text-slate-900">{category}</span></div>
                        {tagline && <div className="col-span-2"><span className="text-slate-500">Tagline:</span> <span className="font-semibold text-slate-900">{tagline}</span></div>}
                      </div>
                    </div>

                    {/* Dates Summary */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Dates & Schedule</span>
                        <button type="button" onClick={() => setStep(2)} className="text-[10px] text-[#0099e6] font-bold cursor-pointer hover:underline">Edit</button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-slate-500">Reg. Opens:</span> <span className="font-semibold text-slate-900">{registrationStart || '—'}</span></div>
                        <div><span className="text-slate-500">Reg. Deadline:</span> <span className="font-semibold text-slate-900">{registrationDeadline || '—'}</span></div>
                        <div><span className="text-slate-500">Hack Start:</span> <span className="font-semibold text-slate-900">{startDate || '—'}</span></div>
                        <div><span className="text-slate-500">Hack End:</span> <span className="font-semibold text-slate-900">{endDate || '—'}</span></div>
                        <div><span className="text-slate-500">Timezone:</span> <span className="font-semibold text-slate-900">{timezone}</span></div>
                      </div>
                    </div>

                    {/* Details Summary */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Details</span>
                        <button type="button" onClick={() => setStep(3)} className="text-[10px] text-[#0099e6] font-bold cursor-pointer hover:underline">Edit</button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-slate-500">Team Size:</span> <span className="font-semibold text-slate-900">{minTeamSize}–{maxTeamSize}</span></div>
                        <div><span className="text-slate-500">Difficulty:</span> <span className="font-semibold text-slate-900">{DIFFICULTY_LEVELS.find((d) => d.value === difficulty)?.label || difficulty}</span></div>
                        <div className="col-span-2"><span className="text-slate-500">Tags:</span> <span className="font-semibold text-slate-900">{tagsInput || '—'}</span></div>
                      </div>
                    </div>

                    {/* Prizes Summary */}
                    <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#ea580c]">Prizes — {currencySymbol}{totalPrize.toLocaleString('en-IN')} Total ({currency})</span>
                        <button type="button" onClick={() => setStep(4)} className="text-[10px] text-[#0099e6] font-bold cursor-pointer hover:underline">Edit</button>
                      </div>
                      <div className="space-y-1">
                        {prizes.map((p, i) => (
                          <div key={i} className="text-xs flex justify-between">
                            <span className="text-slate-700 font-medium">{p.position}</span>
                            <span className="font-mono font-bold text-[#ea580c]">{currencySymbol}{Number(p.amount).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Registration Settings Summary */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Registration Settings</span>
                        <button type="button" onClick={() => setStep(5)} className="text-[10px] text-[#0099e6] font-bold cursor-pointer hover:underline">Edit</button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-slate-500">Type:</span> <span className={`font-semibold ${registrationType === 'PAID' ? 'text-[#ea580c]' : 'text-slate-900'}`}>{registrationType === 'PAID' ? `Paid Entry (${currencySymbol}${Number(entryFee || 0).toLocaleString('en-IN')} ${currency})` : 'Free Entry'}</span></div>
                        <div><span className="text-slate-500">Capacity:</span> <span className="font-semibold text-slate-900">{isUnlimitedCapacity || !registrationCapacity ? '♾️ Unlimited' : `${registrationCapacity} Participants`}</span></div>
                        <div><span className="text-slate-500">Approval:</span> <span className="font-semibold text-slate-900">🔒 Manual (Default)</span></div>
                        <div><span className="text-slate-500">Custom Q&apos;s:</span> <span className="font-semibold text-slate-900">{customQuestions.length}</span></div>
                      </div>
                    </div>

                    {/* Project Submission Requirements Summary */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Rocket className="w-3.5 h-3.5 text-[#0099e6]" />
                          <span>Submission Requirements</span>
                        </span>
                        <button type="button" onClick={() => setStep(6)} className="text-[10px] text-[#0099e6] font-bold cursor-pointer hover:underline">Edit</button>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Required:</span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-600 font-bold text-[10px]">Project Title *</span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-600 font-bold text-[10px]">Project Description *</span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-600 font-bold text-[10px]">Project / GitHub Link *</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Optional:</span>
                          {enabledSubmissionFields.length > 0 ? (
                            enabledSubmissionFields.map((fId) => {
                              const field = OPTIONAL_SUBMISSION_FIELDS.find((f) => f.id === fId);
                              return field ? (
                                <span key={fId} className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px]">
                                  {field.label}
                                </span>
                              ) : null;
                            })
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">None enabled</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval Notice & Email Draft Preview */}
                  {!isEditMode && (
                    <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Mail className="w-4 h-4 text-[#0099e6] shrink-0" />
                        <span className="font-medium">
                          On submit, an approval request is dispatched to <strong className="text-slate-900">hackerunity.community@gmail.com</strong>
                        </span>
                      </div>
                      <a
                        href={gmailDraftUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white border border-sky-200 hover:bg-sky-50 text-[#0099e6] text-[11px] font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-red-600" />
                        <span>Preview Gmail Draft</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={goBack} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" /> <span>Back</span>
                    </button>
                    <button type="button" onClick={handleSaveDraft} className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs">
                      <Save className="w-3.5 h-3.5" /> <span>Save Draft</span>
                    </button>
                    <button type="button" onClick={handlePreview} className="px-4 py-2.5 rounded-xl bg-white border border-[#0099e6] hover:bg-sky-50 text-[#0099e6] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs">
                      <Eye className="w-3.5 h-3.5" /> <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={isSaving || !title.trim()}
                      className="flex-1 sm:flex-none px-7 py-2.5 rounded-xl text-white font-bold text-xs shadow-md shadow-sky-500/20 bg-[#0099e6] hover:bg-[#0284c7] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isEditMode ? (
                        <Save className="w-4 h-4" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>
                        {isSaving
                          ? isEditMode
                            ? 'Saving Changes...'
                            : 'Submitting Request...'
                          : isEditMode
                          ? 'Save & Update Hackathon'
                          : 'Submit Request'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Live Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-[#0099e6]" />
              <span>Live Card Preview</span>
            </div>

            <HackathonCard event={previewEvent} />
            <p className="text-[11px] text-slate-400 text-center font-medium">
              This is how your hackathon will appear to 50,000+ builders worldwide.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HostHackathonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-9 h-9 text-[#0099e6] animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading Organizer Studio...</p>
        </div>
      }
    >
      <HostHackathonContent />
    </Suspense>
  );
}

