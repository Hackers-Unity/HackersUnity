'use client';

import React from 'react';
import {
  X,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  GraduationCap,
  Briefcase,
  Code2,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  Terminal,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { UserPublic } from '@hackers-unity/shared-types';

interface PublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserPublic | null;
  livePreviewData?: {
    name?: string;
    bio?: string;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    professionType?: 'STUDENT' | 'PROFESSIONAL' | 'FREELANCER';
    college?: string;
    graduationYear?: string | number;
    degree?: string;
    branch?: string;
    company?: string;
    jobTitle?: string;
    experienceYears?: string;
    industry?: string;
    freelanceTitle?: string;
    freelanceLevel?: string;
    freelanceDomain?: string;
    skills?: string[];
    socialLinks?: {
      github?: string;
      linkedin?: string;
      portfolio?: string;
    };
  };
}

export function PublicProfileModal({
  isOpen,
  onClose,
  user,
  livePreviewData,
}: PublicProfileModalProps) {
  if (!isOpen) return null;

  // Merge live preview data with stored user data
  const name = livePreviewData?.name || user?.name || 'Chinmay Bhatt';
  const bio = livePreviewData?.bio !== undefined ? livePreviewData.bio : user?.bio || '';
  const avatarUrl = livePreviewData?.avatarUrl !== undefined ? livePreviewData.avatarUrl : user?.avatarUrl;
  const bannerUrl = livePreviewData?.bannerUrl !== undefined ? livePreviewData.bannerUrl : user?.bannerUrl;
  const isCustomBanner = Boolean(
    bannerUrl &&
    (bannerUrl.startsWith('data:image') || bannerUrl.startsWith('http://') || bannerUrl.startsWith('https://') || bannerUrl.startsWith('/'))
  );

  const professionType = livePreviewData?.professionType || user?.professionType || (user?.college ? 'STUDENT' : 'STUDENT');

  const college = livePreviewData?.college || user?.college || 'Developer Guild';
  const graduationYear = livePreviewData?.graduationYear || user?.graduationYear || '2026';
  const degree = livePreviewData?.degree || user?.degree || 'B.Tech / B.E (Engineering)';
  const branch = livePreviewData?.branch || user?.branch || 'Computer Science & Engineering (CSE)';

  const company = livePreviewData?.company || user?.company || user?.organization || 'Developer Community';
  const jobTitle = livePreviewData?.jobTitle || user?.jobTitle || 'Software Engineer';
  const experienceYears = livePreviewData?.experienceYears || user?.experienceYears || '1-3 years';
  const industry = livePreviewData?.industry || user?.industry || 'AI/ML, GenAI & Autonomous Systems';

  const freelanceTitle = livePreviewData?.freelanceTitle || 'Full Stack AI Builder';
  const freelanceLevel = livePreviewData?.freelanceLevel || 'Intermediate Builder';
  const freelanceDomain = livePreviewData?.freelanceDomain || 'Fullstack Web & AI';

  const skills = livePreviewData?.skills || user?.skills || ['Next.js 16', 'TypeScript', 'PostgreSQL', 'Python'];

  const rawGithub = livePreviewData?.socialLinks?.github !== undefined ? livePreviewData.socialLinks.github : user?.socialLinks?.github;
  const rawLinkedin = livePreviewData?.socialLinks?.linkedin !== undefined ? livePreviewData.socialLinks.linkedin : user?.socialLinks?.linkedin;
  const rawPortfolio = livePreviewData?.socialLinks?.portfolio !== undefined ? livePreviewData.socialLinks.portfolio : user?.socialLinks?.portfolio;

  const sanitizeUrl = (url?: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const github = sanitizeUrl(rawGithub);
  const linkedin = sanitizeUrl(rawLinkedin);
  const portfolio = sanitizeUrl(rawPortfolio);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      {/* Scoped CSS for Rich Text formatting inside Bio */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .public-bio-content ul {
              list-style-type: disc !important;
              padding-left: 1.25rem !important;
              margin: 0.35rem 0 !important;
            }
            .public-bio-content ol {
              list-style-type: decimal !important;
              padding-left: 1.25rem !important;
              margin: 0.35rem 0 !important;
            }
            .public-bio-content li {
              display: list-item !important;
              margin: 0.2rem 0 !important;
            }
            .public-bio-content h1,
            .public-bio-content h2 {
              font-size: 1.05rem !important;
              font-weight: 800 !important;
              color: #0f172a !important;
              margin: 0.4rem 0 0.2rem 0 !important;
            }
            .public-bio-content blockquote {
              border-left: 3px solid #0099e6 !important;
              padding: 0.25rem 0.6rem !important;
              margin: 0.35rem 0 !important;
              font-style: italic !important;
              background-color: rgba(0, 153, 230, 0.06) !important;
              border-radius: 0 0.375rem 0.375rem 0 !important;
              color: #334155 !important;
            }
            .public-bio-content a {
              color: #0099e6 !important;
              text-decoration: underline !important;
              font-weight: 600 !important;
            }
            .public-bio-content b,
            .public-bio-content strong {
              font-weight: 800 !important;
            }
          `,
        }}
      />

      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-3 animate-in zoom-in-95 duration-200">
        {/* Top Minimal Header Bar */}
        <div className="bg-slate-950 px-4 py-2 text-white flex items-center justify-between text-[11px] font-semibold">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-100">Public Builder Profile</span>
            <span className="hidden sm:inline text-slate-400 font-normal">• Live preview for squads & organizers</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="max-h-[82vh] overflow-y-auto">
          {/* 1. Header Cover Banner */}
          <div
            className="h-28 sm:h-32 w-full relative overflow-hidden bg-slate-950"
            style={{
              backgroundImage: isCustomBanner
                ? `url(${bannerUrl})`
                : (bannerUrl && bannerUrl.includes('gradient'))
                  ? bannerUrl
                  : 'linear-gradient(135deg, #020617 0%, #0369a1 50%, #1e1b4b 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:14px_14px]" />
            <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-[#0099e6]/25 blur-2xl pointer-events-none" />
          </div>

          {/* 2. Main Profile Content Area */}
          <div className="px-6 pb-6 space-y-5">
            {/* Avatar Row (ONLY the avatar overlaps the banner, name is completely on white below!) */}
            <div className="flex items-end justify-between -mt-12 sm:-mt-14 mb-3">
              {/* Avatar with ring and pinned green status dot */}
              <div className="relative">
                <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-2xl ring-4 ring-white overflow-hidden">
                  {avatarUrl && (avatarUrl.startsWith('data:') || avatarUrl.startsWith('http')) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[#0099e6] to-sky-400 flex items-center justify-center text-2xl font-black text-white shadow-inner">
                      {avatarUrl || (name ? name.charAt(0).toUpperCase() : '⚡')}
                    </div>
                  )}
                </div>
                {/* Pinned Green Dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </span>
              </div>

              {/* Status Badge */}
              <div className="pb-1">
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center gap-1.5 shadow-2xs">
                  <Flame className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Open for Squads</span>
                </span>
              </div>
            </div>

            {/* User Identity Details (100% on clean white surface with clear contrast & breathing room) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {name}
                </h1>
                <span className="p-1 rounded-full bg-sky-100 text-[#0099e6]" title="Verified Builder Identity">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>

              {professionType === 'STUDENT' && (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <GraduationCap className="w-4 h-4 text-[#0099e6] shrink-0" />
                  <span>{degree.split('(')[0].trim()} in {branch.split('(')[0].trim()}</span>
                </div>
              )}

              {professionType === 'PROFESSIONAL' && (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Briefcase className="w-4 h-4 text-[#0099e6] shrink-0" />
                  <span>{jobTitle} {company ? `at ${company}` : ''}</span>
                </div>
              )}

              {professionType === 'FREELANCER' && (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Code2 className="w-4 h-4 text-[#0099e6] shrink-0" />
                  <span>{freelanceTitle}</span>
                </div>
              )}
            </div>

            {/* 3. Credentials Bento Strip (Clean 3-column cards with fixed height and balanced spacing) */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
              {professionType === 'STUDENT' && (
                <>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/60 shadow-2xs flex flex-col justify-between min-h-[64px]" title={college}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-[#0099e6]" />
                      <span>Institution</span>
                    </span>
                    <div className="text-xs font-black text-slate-900 line-clamp-2 leading-tight mt-1">
                      {college}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/60 shadow-2xs flex flex-col justify-between min-h-[64px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[#0099e6]" />
                      <span>Passout Year</span>
                    </span>
                    <div className="text-xs font-black text-slate-900 mt-1">
                      Class of {graduationYear}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/60 shadow-2xs flex flex-col justify-between min-h-[64px]" title={branch}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-[#0099e6]" />
                      <span>Branch</span>
                    </span>
                    <div className="text-xs font-black text-slate-900 line-clamp-2 leading-tight mt-1">
                      {branch}
                    </div>
                  </div>
                </>
              )}

              {professionType === 'PROFESSIONAL' && (
                <>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/60 shadow-2xs flex flex-col justify-between min-h-[64px]" title={company}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-[#0099e6]" />
                      <span>Company / Org</span>
                    </span>
                    <div className="text-xs font-black text-slate-900 line-clamp-2 leading-tight mt-1">
                      {company}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/60 shadow-2xs flex flex-col justify-between min-h-[64px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[#0099e6]" />
                      <span>Experience</span>
                    </span>
                    <div className="text-xs font-black text-slate-900 mt-1">
                      {experienceYears}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/60 shadow-2xs flex flex-col justify-between min-h-[64px]" title={industry}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-[#0099e6]" />
                      <span>Industry</span>
                    </span>
                    <div className="text-xs font-black text-slate-900 line-clamp-2 leading-tight mt-1">
                      {industry}
                    </div>
                  </div>
                </>
              )}

              {professionType === 'FREELANCER' && (
                <>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/60 shadow-2xs flex flex-col justify-between min-h-[64px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Code2 className="w-3 h-3 text-[#0099e6]" />
                      <span>Track</span>
                    </span>
                    <div className="text-xs font-black text-slate-900 mt-1">
                      Independent Hacker
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/60 shadow-2xs flex flex-col justify-between min-h-[64px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[#0099e6]" />
                      <span>Builder Level</span>
                    </span>
                    <div className="text-xs font-black text-slate-900 mt-1">
                      {freelanceLevel}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/60 shadow-2xs flex flex-col justify-between min-h-[64px]" title={freelanceDomain}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-[#0099e6]" />
                      <span>Focus Domain</span>
                    </span>
                    <div className="text-xs font-black text-slate-900 line-clamp-2 leading-tight mt-1">
                      {freelanceDomain}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 4. About & Specialties Section */}
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" />
                <span>About & Specialties</span>
              </h3>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-sans shadow-2xs">
                {bio ? (
                  <div
                    className="public-bio-content"
                    dangerouslySetInnerHTML={{
                      __html: bio.startsWith('<') ? bio : bio.replace(/\n/g, '<br>'),
                    }}
                  />
                ) : (
                  <p className="text-slate-400 italic">No bio provided yet.</p>
                )}
              </div>
            </div>

            {/* 5. Skills & Tech Stacks */}
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#0099e6]" />
                <span>Skills & Tech Stacks</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-xl bg-sky-50 text-[#0099e6] border border-sky-200/80 text-xs font-bold shadow-2xs"
                  >
                    #{skill}
                  </span>
                ))}
              </div>
            </div>

            {/* 6. Verified Social Links (Clean 3-column unified buttons with pixel-aligned icons) */}
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#0099e6]" />
                <span>Verified Socials & Profiles</span>
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                {/* GitHub */}
                {github ? (
                  <a
                    href={github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-between transition-all group shadow-2xs min-h-[46px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Github className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="truncate">GitHub</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                  </a>
                ) : (
                  <div className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 text-xs font-medium flex items-center justify-between border border-slate-200/70 min-h-[46px]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-200/60 flex items-center justify-center shrink-0">
                        <Github className="w-3.5 h-3.5 opacity-40 shrink-0" />
                      </div>
                      <span>GitHub</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Unlinked</span>
                  </div>
                )}

                {/* LinkedIn */}
                {linkedin ? (
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-between transition-all group shadow-2xs min-h-[46px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-[#0077b5] flex items-center justify-center shrink-0">
                        <Linkedin className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="truncate">LinkedIn</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                  </a>
                ) : (
                  <div className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 text-xs font-medium flex items-center justify-between border border-slate-200/70 min-h-[46px]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-200/60 flex items-center justify-center shrink-0">
                        <Linkedin className="w-3.5 h-3.5 opacity-40 shrink-0" />
                      </div>
                      <span>LinkedIn</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Unlinked</span>
                  </div>
                )}

                {/* Portfolio */}
                {portfolio ? (
                  <a
                    href={portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-between transition-all group shadow-2xs min-h-[46px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-[#0099e6] flex items-center justify-center shrink-0">
                        <Globe className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="truncate">Portfolio</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                  </a>
                ) : (
                  <div className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 text-xs font-medium flex items-center justify-between border border-slate-200/70 min-h-[46px]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-200/60 flex items-center justify-center shrink-0">
                        <Globe className="w-3.5 h-3.5 opacity-40 shrink-0" />
                      </div>
                      <span>Portfolio</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Unlinked</span>
                  </div>
                )}
              </div>
            </div>

            {/* 7. Proof of Work Stats */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hackathons</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">4</div>
                <div className="text-[10px] text-slate-500 font-medium">Participated</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Squads</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">3</div>
                <div className="text-[10px] text-slate-500 font-medium">Formed / Joined</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Podiums</div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">2</div>
                <div className="text-[10px] text-slate-500 font-medium">Track Wins</div>
              </div>
            </div>
          </div>
        </div>

        {/* 8. Minimalist Clean Footer */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Private credentials (email, phone) protected.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
