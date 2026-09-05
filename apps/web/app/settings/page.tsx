'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  User as UserIcon,
  Shield,
  KeyRound,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Building2,
  Briefcase,
  Code2,
  BookOpen,
  Award,
  Laptop,
  Github,
  Linkedin,
  Globe,
  Plus,
  X as XIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Bell,
  Sliders,
  ExternalLink,
  Sparkles,
  Lock,
  Compass,
  ArrowLeft,
  Smartphone,
  Trash2,
  Eye,
  Share2,
  ChevronDown,
  Search,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AvatarUpload } from '@/components/avatar-upload';
import { BannerUpload } from '@/components/banner-upload';
import { AuthModal } from '@/components/auth-modal';
import { RichTextEditor } from '@/components/rich-text-editor';
import { PublicProfileModal } from '@/components/public-profile-modal';

const POPULAR_DEGREES = [
  'B.Tech / B.E (Engineering)',
  'BCA (Computer Applications)',
  'MCA (Master of Computer Applications)',
  'B.Sc (Computer Science / IT)',
  'M.Sc (Computer Science / IT / AI)',
  'M.Tech / M.E',
  'B.Des / M.Des (Design / UI/UX)',
  'Diploma / Polytechnic',
  'Dual Degree (B.Tech + M.Tech)',
  'PhD / Research Scholar',
  'High School / K-12',
  'Bootcamp / Self-Taught',
  'Other',
];

const POPULAR_BRANCHES = [
  'Computer Science & Engineering (CSE)',
  'Artificial Intelligence & Data Science (AI/DS)',
  'Information Technology (IT)',
  'Electronics & Communication (ECE)',
  'Electrical & Electronics Engineering (EEE)',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical & Biotechnology Engineering',
  'Aerospace & Aeronautical Engineering',
  'Mechatronics & Robotics',
  'Design & Human-Computer Interaction',
  'Mathematics & Computing',
  'Physics & Applied Sciences',
  'Business Administration / Management',
  'Other',
];

const ALL_GRADUATION_YEARS = [
  '2018 or earlier',
  '2019',
  '2020',
  '2021',
  '2022',
  '2023',
  '2024',
  '2025',
  '2026',
  '2027',
  '2028',
  '2029',
  '2030',
  '2031',
  '2032+',
  'Other',
];

const POPULAR_INDUSTRIES = [
  'AI/ML, GenAI & Autonomous Systems',
  'FinTech, Payments & Web3 Blockchain',
  'SaaS, Cloud & Developer Infrastructure',
  'Cybersecurity & Privacy',
  'E-Commerce & Consumer Internet',
  'HealthTech & BioTech',
  'Gaming, AR/VR & Metaverse',
  'EdTech & Learning Platforms',
  'CleanTech, EV & Energy',
  'Other',
];

const POPULAR_FREELANCE_DOMAINS = [
  'Fullstack Web & AI (Next.js, Python, Supabase)',
  'Autonomous AI Agents, RAG & LLM Workflows',
  'Smart Contracts, Solidity & Web3 dApps',
  'Mobile Apps (Flutter, React Native, Swift)',
  'UI/UX Design Systems & Product Strategy',
  'DevOps, Kubernetes & Cloud Architecture',
  'Cybersecurity & Smart Contract Auditing',
  'Data Engineering & MLOps Pipelines',
  'Other',
];

const POPULAR_SKILLS = [
  // Frontend
  'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'HTML5', 'CSS3', 'Tailwind CSS',
  'TypeScript', 'JavaScript', 'jQuery', 'Bootstrap', 'Material UI', 'Chakra UI',
  'Framer Motion', 'Three.js', 'WebGL', 'SASS/SCSS',
  // Backend
  'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Ruby on Rails',
  'Laravel', 'ASP.NET', 'NestJS', 'Hono', 'Go', 'Rust', 'PHP',
  // Databases
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Supabase', 'Firebase', 'DynamoDB',
  'Prisma', 'Drizzle ORM', 'SQLite', 'Cassandra', 'Neo4j',
  // Cloud & DevOps
  'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
  'Vercel', 'Netlify', 'Cloudflare', 'Linux', 'Nginx', 'GitHub Actions',
  // AI/ML
  'Python', 'TensorFlow', 'PyTorch', 'OpenAI API', 'LangChain', 'Hugging Face',
  'RAG', 'LLM Fine-tuning', 'Computer Vision', 'NLP', 'Scikit-learn', 'Pandas',
  'NumPy', 'Jupyter', 'Stable Diffusion', 'CrewAI',
  // Mobile
  'React Native', 'Flutter', 'Swift', 'SwiftUI', 'Kotlin', 'Dart', 'Expo',
  // Web3 & Blockchain
  'Solidity', 'Ethereum', 'Web3.js', 'Hardhat', 'Foundry', 'IPFS', 'Rust (Solana)',
  // Design & Tools
  'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Blender', 'Canva',
  // Data & Analytics
  'Power BI', 'Tableau', 'Apache Spark', 'Kafka', 'Elasticsearch', 'GraphQL',
  'REST APIs', 'gRPC', 'WebSockets',
  // Programming Languages
  'C', 'C++', 'Java', 'C#', 'Scala', 'Elixir', 'Haskell', 'R', 'MATLAB',
  // Security
  'Cybersecurity', 'Penetration Testing', 'OWASP', 'Burp Suite', 'Wireshark',
  // Other
  'Git', 'Agile/Scrum', 'System Design', 'Data Structures', 'Algorithms',
  'Open Source', 'Technical Writing', 'Competitive Programming',
];

export default function SettingsPage() {
  const { user, updateUserProfile, updateUserPassword, signOut, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  // Settings Tabs
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'socials' | 'notifications' | 'danger'>('profile');
  const [showPublicPreview, setShowPublicPreview] = useState(false);

  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [college, setCollege] = useState('');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [skillsDropdownOpen, setSkillsDropdownOpen] = useState(false);
  const skillsDropdownRef = useRef<HTMLDivElement>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  // Dynamic Profession & Background States
  const [professionType, setProfessionType] = useState<'STUDENT' | 'PROFESSIONAL' | 'FREELANCER'>('STUDENT');

  // Student-specific fields
  const [degree, setDegree] = useState('B.Tech / B.E (Engineering)');
  const [customDegree, setCustomDegree] = useState('');
  const [branch, setBranch] = useState('Computer Science & Engineering (CSE)');
  const [customBranch, setCustomBranch] = useState('');
  const [customGradYear, setCustomGradYear] = useState('');
  const [studentId, setStudentId] = useState('');

  // Working Professional-specific fields
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [experienceYears, setExperienceYears] = useState('1-3 years');
  const [industry, setIndustry] = useState('AI/ML, GenAI & Autonomous Systems');
  const [customIndustry, setCustomIndustry] = useState('');

  // Freelancer-specific fields
  const [freelanceTitle, setFreelanceTitle] = useState('Full Stack AI Builder');
  const [freelanceLevel, setFreelanceLevel] = useState('Intermediate Builder');
  const [freelanceDomain, setFreelanceDomain] = useState('Fullstack Web & AI (Next.js, Python, Supabase)');
  const [customDomain, setCustomDomain] = useState('');

  // Social Links
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');

  // Password / Security States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Notification Preferences
  const [notifyHackathons, setNotifyHackathons] = useState(true);
  const [notifyInvites, setNotifyInvites] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);

  // Status & Feedback
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setCollege(user.college || '');

      const userGradYear = user.graduationYear ? String(user.graduationYear) : '2026';
      if (ALL_GRADUATION_YEARS.includes(userGradYear)) {
        setGraduationYear(userGradYear);
      } else {
        setGraduationYear('Other');
        setCustomGradYear(userGradYear);
      }

      setSkills(user.skills && user.skills.length > 0 ? user.skills : ['Next.js 16', 'TypeScript', 'PostgreSQL']);
      setAvatar(user.avatarUrl || null);
      setBanner(user.bannerUrl || null);
      setGithub(user.socialLinks?.github || '');
      setLinkedin(user.socialLinks?.linkedin || '');
      setPortfolio(user.socialLinks?.portfolio || '');

      // Load dynamic profession fields
      if (user.professionType === 'PROFESSIONAL' || user.professionType === 'FREELANCER' || user.professionType === 'STUDENT') {
        setProfessionType(user.professionType);
      } else if (user.organization && !user.college) {
        setProfessionType('PROFESSIONAL');
      } else {
        setProfessionType('STUDENT');
      }

      const userDegree = user.degree || 'B.Tech / B.E (Engineering)';
      if (POPULAR_DEGREES.includes(userDegree)) {
        setDegree(userDegree);
      } else {
        setDegree('Other');
        setCustomDegree(userDegree);
      }

      const userBranch = user.branch || 'Computer Science & Engineering (CSE)';
      if (POPULAR_BRANCHES.includes(userBranch)) {
        setBranch(userBranch);
      } else {
        setBranch('Other');
        setCustomBranch(userBranch);
      }

      setCompany(user.company || user.organization || '');
      setJobTitle(user.jobTitle || '');
      setExperienceYears(user.experienceYears || '1-3 years');

      const userIndustry = user.industry || 'AI/ML, GenAI & Autonomous Systems';
      if (POPULAR_INDUSTRIES.includes(userIndustry)) {
        setIndustry(userIndustry);
      } else {
        setIndustry('Other');
        setCustomIndustry(userIndustry);
      }
    }
  }, [user]);

  // Close skills dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (skillsDropdownRef.current && !skillsDropdownRef.current.contains(event.target as Node)) {
        setSkillsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddSkill = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleSelectSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      setSkills((prev) => [...prev, skill]);
    }
    setNewSkillInput('');
    setSkillsDropdownOpen(false);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);

    const finalDegree = degree === 'Other' ? (customDegree.trim() || 'Other') : degree;
    const finalBranch = branch === 'Other' ? (customBranch.trim() || 'Other') : branch;
    const finalGradYear = graduationYear === 'Other' ? (Number(customGradYear) || 2026) : (Number(graduationYear.replace(/\D/g, '')) || 2026);
    const finalIndustry = industry === 'Other' ? (customIndustry.trim() || 'Other') : industry;
    const finalDomain = freelanceDomain === 'Other' ? (customDomain.trim() || 'Other') : freelanceDomain;

    const cleanUrl = (input: string, prefixDomain: string) => {
      const val = input.trim();
      if (!val) return '';
      if (val.startsWith('http://') || val.startsWith('https://')) return val;
      if (val.includes('.') || val.includes('/')) return `https://${val}`;
      if (prefixDomain) return `https://${prefixDomain}/${val.replace(/^@/, '')}`;
      return `https://${val}`;
    };

    const finalGithub = cleanUrl(github, 'github.com');
    const finalLinkedin = cleanUrl(linkedin, 'linkedin.com/in');
    const finalPortfolio = cleanUrl(portfolio, '');

    setGithub(finalGithub);
    setLinkedin(finalLinkedin);
    setPortfolio(finalPortfolio);

    const res = await updateUserProfile({
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
      professionType: professionType,
      college: professionType === 'STUDENT' ? college.trim() || undefined : undefined,
      organization: professionType === 'PROFESSIONAL' ? company.trim() || undefined : professionType === 'STUDENT' ? college.trim() || undefined : 'Independent',
      graduationYear: professionType === 'STUDENT' ? finalGradYear : undefined,
      degree: professionType === 'STUDENT' ? finalDegree : undefined,
      branch: professionType === 'STUDENT' ? finalBranch : undefined,
      company: professionType === 'PROFESSIONAL' ? company.trim() || undefined : undefined,
      jobTitle: professionType === 'PROFESSIONAL' ? jobTitle.trim() || undefined : professionType === 'FREELANCER' ? freelanceTitle.trim() || undefined : undefined,
      experienceYears: professionType === 'PROFESSIONAL' ? experienceYears : professionType === 'FREELANCER' ? freelanceLevel : undefined,
      industry: professionType === 'PROFESSIONAL' ? finalIndustry : professionType === 'FREELANCER' ? finalDomain : undefined,
      skills: skills,
      avatarUrl: avatar || undefined,
      bannerUrl: banner || null,
      socialLinks: {
        github: finalGithub,
        linkedin: finalLinkedin,
        portfolio: finalPortfolio,
      },
    });

    setIsSavingProfile(false);
    if (res.error) {
      setProfileError(res.error);
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    const res = await updateUserPassword(newPassword);
    setIsUpdatingPassword(false);

    if (res.error) {
      setPasswordMsg({ type: 'error', text: res.error });
    } else {
      setPasswordMsg({ type: 'success', text: 'Password successfully updated in your account!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 3000);
    }
  };

  // If user is not logged in
  if (!loading && !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0099e6] mb-6 shadow-sm">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account & Settings</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          Sign in or create an account to manage your profile, security settings, social handles, and preferences.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={() => setAuthOpen(true)}
            className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            Sign In / Register
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Back to Home
          </Link>
        </div>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Toast Notification */}
      {profileSaved && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-950 text-white text-xs font-bold shadow-2xl border border-sky-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 backdrop-blur-xl">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-white">Profile Synchronized in Realtime!</div>
            <div className="text-[11px] text-slate-400 font-normal">All updates saved to Supabase cloud.</div>
          </div>
          <button
            onClick={() => setShowPublicPreview(true)}
            className="ml-2 px-3.5 py-1.5 rounded-xl bg-[#0099e6] hover:bg-sky-500 text-white text-[11px] font-black transition-all cursor-pointer whitespace-nowrap"
          >
            View Public Card
          </button>
        </div>
      )}

      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#0099e6] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Account & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage your personal profile, credentials, public socials, avatar, and security preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPublicPreview(true)}
            className="px-4 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-[#0099e6] border border-sky-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Public Profile</span>
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Compass className="w-4 h-4 text-[#0099e6]" />
            <span>Go to Analytics Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
            {/* User Mini Profile Badge */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-sky-50/70 border border-sky-100 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0099e6] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0 overflow-hidden">
                {avatar && avatar.startsWith('http') ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span>{name.charAt(0) || 'H'}</span>
                )}
              </div>
              <div className="overflow-hidden">
                <div className="font-extrabold text-sm text-slate-900 truncate">{name || 'Hacker'}</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">{email}</div>
              </div>
            </div>

            {/* Nav Tabs */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'profile'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Profile Information</div>
                <div className={`text-[10px] font-normal ${activeTab === 'profile' ? 'text-white/80' : 'text-slate-400'}`}>
                  Avatar, bio, college & skills
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('socials')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'socials'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Socials & Portfolio</div>
                <div className={`text-[10px] font-normal ${activeTab === 'socials' ? 'text-white/80' : 'text-slate-400'}`}>
                  GitHub, LinkedIn, Website
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'security'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Security & Password</div>
                <div className={`text-[10px] font-normal ${activeTab === 'security' ? 'text-white/80' : 'text-slate-400'}`}>
                  Password & 2FA credentials
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'notifications'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Notification Alerts</div>
                <div className={`text-[10px] font-normal ${activeTab === 'notifications' ? 'text-white/80' : 'text-slate-400'}`}>
                  Email & team invite updates
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('danger')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'danger'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 hover:bg-rose-50'
                }`}
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Account Management</div>
                <div className={`text-[10px] font-normal ${activeTab === 'danger' ? 'text-white/80' : 'text-rose-400'}`}>
                  Sign out & account actions
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Right Content Area (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Tab: Profile Information */}
          {activeTab === 'profile' && (
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#0099e6]" />
                  <span>Public Profile Information</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  This info is displayed to organizers and teammates when you register or form squads.
                </p>
              </div>

              {profileError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Profile Cover Banner */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Profile Cover Banner & Theme
                  </label>
                  <BannerUpload
                    currentBanner={banner}
                    onBannerChange={(newBanner) => setBanner(newBanner)}
                    onBannerRemove={() => setBanner(null)}
                  />
                </div>

                {/* Avatar Uploader */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Profile Photo / Logo
                  </label>
                  <AvatarUpload
                    currentAvatar={avatar}
                    onAvatarChange={(newUrl) => setAvatar(newUrl)}
                    onAvatarRemove={() => setAvatar(null)}
                  />
                </div>

                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g. Chinmay Bhatt"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                      />
                    </div>
                  </div>
                </div>

                {/* Email (Readonly) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Primary login email address cannot be modified directly.</span>
                </div>

                {/* Bio / Summary with Rich Text Toolbar */}
                <RichTextEditor
                  label="Short Bio & Specialties"
                  value={bio}
                  onChange={(val) => setBio(val)}
                  rows={4}
                  placeholder="Tell hackathon organizers and squads what you love building (supports **bold**, *italic*, bullets, headings)..."
                  helperText="Use toolbar or markdown syntax for formatting"
                />

                {/* ═══ Dynamic Profession Selector ═══ */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Current Occupation / Status *
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Select your current role so squads and hackathon organizers can discover your background.
                    </span>
                  </div>

                  {/* 3 Profession Toggle Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Student Card */}
                    <button
                      type="button"
                      onClick={() => setProfessionType('STUDENT')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${professionType === 'STUDENT'
                          ? 'border-[#0099e6] bg-sky-50/60 shadow-xs ring-2 ring-[#0099e6]/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl ${professionType === 'STUDENT' ? 'bg-[#0099e6] text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        {professionType === 'STUDENT' && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0099e6] text-white text-[9px] font-extrabold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">Student / Learner</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                          College / School student, fresher & campus builder
                        </div>
                      </div>
                    </button>

                    {/* Working Professional Card */}
                    <button
                      type="button"
                      onClick={() => setProfessionType('PROFESSIONAL')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${professionType === 'PROFESSIONAL'
                          ? 'border-[#0099e6] bg-sky-50/60 shadow-xs ring-2 ring-[#0099e6]/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl ${professionType === 'PROFESSIONAL' ? 'bg-[#0099e6] text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Briefcase className="w-4 h-4" />
                        </div>
                        {professionType === 'PROFESSIONAL' && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0099e6] text-white text-[9px] font-extrabold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">Working Professional</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                          Employed at startup, MNC, enterprise or tech lab
                        </div>
                      </div>
                    </button>

                    {/* Independent / Freelancer Card */}
                    <button
                      type="button"
                      onClick={() => setProfessionType('FREELANCER')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${professionType === 'FREELANCER'
                          ? 'border-[#0099e6] bg-sky-50/60 shadow-xs ring-2 ring-[#0099e6]/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl ${professionType === 'FREELANCER' ? 'bg-[#0099e6] text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Code2 className="w-4 h-4" />
                        </div>
                        {professionType === 'FREELANCER' && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0099e6] text-white text-[9px] font-extrabold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">Independent Hacker</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                          Full-time builder, freelancer, or solo founder
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* ═══ Conditional Fields based on Profession ═══ */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 animate-in fade-in duration-200">
                  {/* IF STUDENT */}
                  {professionType === 'STUDENT' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <BookOpen className="w-4 h-4 text-[#0099e6]" />
                        <span>Academic & College Details</span>
                      </div>

                      {/* College Name & Passout Year */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">College / University Name *</label>
                          <div className="relative">
                            <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={college}
                              onChange={(e) => setCollege(e.target.value)}
                              placeholder="e.g. IIT Delhi / BITS Pilani / Stanford"
                              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Passout / Graduation Year *</label>
                          <select
                            value={graduationYear}
                            onChange={(e) => setGraduationYear(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                          >
                            {ALL_GRADUATION_YEARS.map((yr) => (
                              <option key={yr} value={yr}>
                                {yr === '2026' ? '2026 (Pre-Final Year)' : yr === '2025' ? '2025 (Final Year)' : yr === 'Other' ? 'Other (Enter custom year)' : yr}
                              </option>
                            ))}
                          </select>
                          {graduationYear === 'Other' && (
                            <input
                              type="number"
                              placeholder="Type graduation year (e.g. 2017, 2033)"
                              value={customGradYear}
                              onChange={(e) => setCustomGradYear(e.target.value)}
                              className="mt-2 w-full px-4 py-2 rounded-xl bg-white border border-[#0099e6] text-xs font-semibold text-slate-900 focus:outline-none ring-2 ring-sky-100"
                            />
                          )}
                        </div>
                      </div>

                      {/* Degree & Branch */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Degree / Program</label>
                          <select
                            value={degree}
                            onChange={(e) => setDegree(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                          >
                            {POPULAR_DEGREES.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                          {degree === 'Other' && (
                            <input
                              type="text"
                              placeholder="Specify your Degree / Course (e.g. B.Voc, B.F.A)..."
                              value={customDegree}
                              onChange={(e) => setCustomDegree(e.target.value)}
                              className="mt-2 w-full px-4 py-2 rounded-xl bg-white border border-[#0099e6] text-xs font-semibold text-slate-900 focus:outline-none ring-2 ring-sky-100"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Branch / Department</label>
                          <select
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                          >
                            {POPULAR_BRANCHES.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                          {branch === 'Other' && (
                            <input
                              type="text"
                              placeholder="Specify your Branch (e.g. Cyber Forensics, Marine, Petroleum)..."
                              value={customBranch}
                              onChange={(e) => setCustomBranch(e.target.value)}
                              className="mt-2 w-full px-4 py-2 rounded-xl bg-white border border-[#0099e6] text-xs font-semibold text-slate-900 focus:outline-none ring-2 ring-sky-100 animate-in fade-in"
                            />
                          )}
                        </div>
                      </div>

                      {/* Optional Student Roll / ID */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Student ID / Roll No (Optional)</label>
                        <input
                          type="text"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          placeholder="e.g. 21BCE10482 (Optional for campus verification)"
                          className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                        />
                      </div>
                    </div>
                  )}

                  {/* IF WORKING PROFESSIONAL */}
                  {professionType === 'PROFESSIONAL' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Building2 className="w-4 h-4 text-[#0099e6]" />
                        <span>Workplace & Professional Details</span>
                      </div>

                      {/* Company Name & Role / Designation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Company / Organization Name *</label>
                          <div className="relative">
                            <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={company}
                              onChange={(e) => setCompany(e.target.value)}
                              placeholder="e.g. Google / Microsoft / Amazon / Startup"
                              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Role / Designation *</label>
                          <div className="relative">
                            <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={jobTitle}
                              onChange={(e) => setJobTitle(e.target.value)}
                              placeholder="e.g. Senior Frontend Engineer / AI Architect"
                              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Experience & Industry */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Experience</label>
                          <select
                            value={experienceYears}
                            onChange={(e) => setExperienceYears(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                          >
                            <option value="Fresher (< 1 year)">Fresher (&lt; 1 year)</option>
                            <option value="1-2 years">1 - 2 years (Associate / Junior)</option>
                            <option value="3-5 years">3 - 5 years (Mid-Level / Senior)</option>
                            <option value="5-8 years">5 - 8 years (Staff / Lead)</option>
                            <option value="8+ years">8+ years (Principal / Architect / Director)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Industry / Domain</label>
                          <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                          >
                            {POPULAR_INDUSTRIES.map((ind) => (
                              <option key={ind} value={ind}>{ind}</option>
                            ))}
                          </select>
                          {industry === 'Other' && (
                            <input
                              type="text"
                              placeholder="Specify your Industry / Sector..."
                              value={customIndustry}
                              onChange={(e) => setCustomIndustry(e.target.value)}
                              className="mt-2 w-full px-4 py-2 rounded-xl bg-white border border-[#0099e6] text-xs font-semibold text-slate-900 focus:outline-none ring-2 ring-sky-100"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IF FREELANCER / INDEPENDENT */}
                  {professionType === 'FREELANCER' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Code2 className="w-4 h-4 text-[#0099e6]" />
                        <span>Independent Builder & Specialty</span>
                      </div>

                      {/* Title & Level */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Title / Specialty *</label>
                          <input
                            type="text"
                            value={freelanceTitle}
                            onChange={(e) => setFreelanceTitle(e.target.value)}
                            placeholder="e.g. Full-Stack Web3 Builder / AI Consultant"
                            className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Experience Level</label>
                          <select
                            value={freelanceLevel}
                            onChange={(e) => setFreelanceLevel(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                          >
                            <option value="Early Stage Builder">Early Stage Builder (&lt; 2 yrs)</option>
                            <option value="Intermediate Builder">Intermediate Builder (2-4 yrs)</option>
                            <option value="Senior Architect / Lead">Senior Architect / Lead (5+ yrs)</option>
                          </select>
                        </div>
                      </div>

                      {/* Tech Domain */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Focus Domain</label>
                        <select
                          value={freelanceDomain}
                          onChange={(e) => setFreelanceDomain(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                        >
                          {POPULAR_FREELANCE_DOMAINS.map((dom) => (
                            <option key={dom} value={dom}>{dom}</option>
                          ))}
                        </select>
                        {freelanceDomain === 'Other' && (
                          <input
                            type="text"
                            placeholder="Specify your Focus Domain / Tech Stack..."
                            value={customDomain}
                            onChange={(e) => setCustomDomain(e.target.value)}
                            className="mt-2 w-full px-4 py-2 rounded-xl bg-white border border-[#0099e6] text-xs font-semibold text-slate-900 focus:outline-none ring-2 ring-sky-100"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Skills Tag Management */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Skills & Tech Stacks</label>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-[#0099e6] border border-sky-200 text-xs font-bold"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative" ref={skillsDropdownRef}>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={newSkillInput}
                          onChange={(e) => {
                            setNewSkillInput(e.target.value);
                            setSkillsDropdownOpen(true);
                          }}
                          onFocus={() => setSkillsDropdownOpen(true)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkill();
                            }
                            if (e.key === 'Escape') {
                              setSkillsDropdownOpen(false);
                            }
                          }}
                          placeholder="Search or type a skill (e.g. Next.js, Rust, Docker)"
                          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] focus:border-[#0099e6] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setSkillsDropdownOpen(!skillsDropdownOpen)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${skillsDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        disabled={!newSkillInput.trim()}
                        className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>

                    {/* Skills Dropdown */}
                    {skillsDropdownOpen && (() => {
                      const query = newSkillInput.toLowerCase().trim();
                      const filtered = POPULAR_SKILLS.filter(
                        (s) => !skills.includes(s) && (query === '' || s.toLowerCase().includes(query))
                      );
                      const showCustom = query && !POPULAR_SKILLS.some((s) => s.toLowerCase() === query) && !skills.includes(newSkillInput.trim());

                      if (filtered.length === 0 && !showCustom) return null;

                      return (
                        <div className="absolute z-40 left-0 right-0 mt-1.5 max-h-56 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-1 duration-150">
                          {showCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                handleAddSkill();
                                setSkillsDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-sky-50 transition-colors cursor-pointer border-b border-slate-100"
                            >
                              <div className="w-6 h-6 rounded-lg bg-[#0099e6] text-white flex items-center justify-center shrink-0">
                                <Plus className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-slate-900">Add &quot;{newSkillInput.trim()}&quot;</span>
                                <span className="text-[10px] text-slate-400 ml-1.5">custom skill</span>
                              </div>
                            </button>
                          )}
                          {filtered.slice(0, 30).map((skill) => (
                            <button
                              type="button"
                              key={skill}
                              onClick={() => handleSelectSkill(skill)}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-sky-50 transition-colors cursor-pointer group"
                            >
                              <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-sky-100 text-slate-500 group-hover:text-[#0099e6] flex items-center justify-center shrink-0 transition-colors">
                                <Code2 className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">{skill}</span>
                            </button>
                          ))}
                          {filtered.length > 30 && (
                            <div className="px-4 py-2 text-[10px] text-slate-400 font-medium text-center border-t border-slate-100">
                              Type to filter — {filtered.length - 30} more skills available
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
                    ⚡ Saves to Supabase and broadcasts to squads in real-time
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. Tab: Socials & Portfolio */}
          {activeTab === 'socials' && (
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#0099e6]" />
                  <span>Social Handles & Proof of Work</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Connect your GitHub repositories, LinkedIn, and personal portfolio links.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">GitHub Profile URL or Handle</label>
                  <div className="relative">
                    <Github className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="github.com/your-username or username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">LinkedIn Profile URL or Handle</label>
                  <div className="relative">
                    <Linkedin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="linkedin.com/in/your-profile or username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Personal Portfolio or Website</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="yourportfolio.dev or https://..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save Social Links</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. Tab: Security & Password */}
          {activeTab === 'security' && (
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span>Security & Credentials</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Update your authentication credentials and manage session security.
                </p>
              </div>

              {passwordMsg && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${passwordMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                    }`}
                >
                  {passwordMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter your new password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Authenticated with Supabase Auth</span>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isUpdatingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>

              {/* Two-Factor Info */}
              <div className="pt-6 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0099e6] flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Phone Authentication & SMS OTP</div>
                      <div className="text-[11px] text-slate-500">Log in securely with one-time SMS codes.</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Tab: Notification Alerts */}
          {activeTab === 'notifications' && (
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#ea580c]" />
                  <span>Notification Preferences</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Control the communications and alerts you receive from Hacker’s Unity.
                </p>
              </div>

              <div className="space-y-4">
                <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">Hackathon Deadlines & Milestones</div>
                    <div className="text-[11px] text-slate-500">Get reminders before registration and submission deadlines end.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyHackathons}
                    onChange={(e) => setNotifyHackathons(e.target.checked)}
                    className="w-4 h-4 text-[#0099e6] rounded border-slate-300 focus:ring-[#0099e6]"
                  />
                </label>

                <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">Team Invites & Squad Requests</div>
                    <div className="text-[11px] text-slate-500">Receive alerts when builders invite you to form hackathon squads.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyInvites}
                    onChange={(e) => setNotifyInvites(e.target.checked)}
                    className="w-4 h-4 text-[#0099e6] rounded border-slate-300 focus:ring-[#0099e6]"
                  />
                </label>

                <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">Weekly Builder Digest</div>
                    <div className="text-[11px] text-slate-500">A weekly summary of top upcoming hackathons, prizes, and leaderboards.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyDigest}
                    onChange={(e) => setNotifyDigest(e.target.checked)}
                    className="w-4 h-4 text-[#0099e6] rounded border-slate-300 focus:ring-[#0099e6]"
                  />
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setProfileSaved(true);
                    setTimeout(() => setProfileSaved(false), 3000);
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                >
                  Save Notification Preferences
                </button>
              </div>
            </div>
          )}

          {/* 5. Tab: Danger / Account Management */}
          {activeTab === 'danger' && (
            <div className="p-7 rounded-3xl bg-white border border-rose-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-rose-100 pb-4">
                <h2 className="text-xl font-black text-rose-600 tracking-tight flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                  <span>Account Session & Actions</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage active login session or sign out of your account on this device.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-3">
                <div className="text-xs font-bold text-rose-900">Sign Out of Hacker&apos;s Unity</div>
                <p className="text-[11px] text-rose-700">
                  This will securely end your current Supabase authenticated session on this browser.
                </p>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Public Profile Preview Modal */}
      <PublicProfileModal
        isOpen={showPublicPreview}
        onClose={() => setShowPublicPreview(false)}
        user={user}
        livePreviewData={{
          name,
          bio,
          avatarUrl: avatar,
          bannerUrl: banner,
          professionType,
          college,
          graduationYear: graduationYear === 'Other' ? customGradYear : graduationYear,
          degree: degree === 'Other' ? customDegree : degree,
          branch: branch === 'Other' ? customBranch : branch,
          company,
          jobTitle,
          experienceYears,
          industry: industry === 'Other' ? customIndustry : industry,
          freelanceTitle,
          freelanceLevel,
          freelanceDomain: freelanceDomain === 'Other' ? customDomain : freelanceDomain,
          skills,
          socialLinks: {
            github,
            linkedin,
            portfolio,
          },
        }}
      />
    </div>
  );
}
