import React from 'react';

export interface PartnerLogoItem {
  name: string;
  url?: string;
  svg: React.ReactNode;
}

export const PARTNER_LOGOS: PartnerLogoItem[] = [
  {
    name: 'Trainzex AI',
    url: 'https://trainzexai.in',
    svg: (
      <div className="flex items-center gap-2">
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#0099e6" />
          <path d="M7 10h18M16 10v14M11 24h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="23" cy="11" r="2.5" fill="#bae6fd" />
        </svg>
        <div className="flex items-baseline gap-1">
          <span className="font-extrabold text-slate-900 text-lg tracking-tight">Trainzex</span>
          <span className="font-black text-[#0099e6] text-xs px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200">AI</span>
        </div>
      </div>
    ),
  },
  {
    name: 'OpenAI',
    svg: (
      <div className="flex items-center gap-2 text-slate-800 font-bold text-lg tracking-tight">
        <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"
            fill="currentColor"
          />
        </svg>
        <span className="font-extrabold text-lg tracking-tight">OpenAI</span>
      </div>
    ),
  },
  {
    name: 'Google',
    svg: (
      <div className="flex items-center gap-2">
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span className="font-bold text-slate-800 text-lg tracking-tight font-sans">Google</span>
      </div>
    ),
  },
  {
    name: 'Microsoft',
    svg: (
      <div className="flex items-center gap-2.5">
        <svg className="w-6 h-6 shrink-0" viewBox="0 0 23 23">
          <path fill="#F25022" d="M1 1h10v10H1z" />
          <path fill="#7FBA00" d="M12 1h10v10H12z" />
          <path fill="#00A4EF" d="M1 12h10v10H1z" />
          <path fill="#FFB900" d="M12 12h10v10H12z" />
        </svg>
        <span className="font-semibold text-slate-800 text-lg tracking-tight">Microsoft</span>
      </div>
    ),
  },
  {
    name: 'Amazon',
    svg: (
      <div className="flex items-center">
        <svg className="h-7 w-auto" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M66.4 20.3c0 4.1-1.7 6.4-5.2 6.4-2.8 0-4.6-1.9-4.6-5.3 0-4 2.2-5.7 5.7-5.7 1.3 0 2.8.3 4.1.8v3.8zm5.5 7.9c-.3-.4-.5-1.2-.5-1.9-1.6 1.8-3.7 2.4-5.9 2.4-4.8 0-8.5-3.1-8.5-8.8 0-5.3 3.6-8.7 9.2-8.7 2.1 0 3.9.4 5.2 1.2V11c0-3.3-2.1-4.9-6-4.9-2.6 0-5.3.7-7.2 1.8l-1.3-3.8C59.5 2.6 63 1.7 66.8 1.7c7.4 0 10.7 3.6 10.7 10.4v12.2c0 1.5.3 2.8.7 3.9H71.9zm-29.2.1V13.8c0-3.6-1.8-5.3-5-5.3-2.7 0-4.7 1.6-5.7 3.8v16.1h-5.6V1.7h5.6v11.4c1.7-2.5 4.3-4 7.6-4 5.8 0 8.7 3.5 8.7 9.3v9.9h-5.6zM13.7 20.3c0 4.1-1.7 6.4-5.2 6.4-2.8 0-4.6-1.9-4.6-5.3 0-4 2.2-5.7 5.7-5.7 1.3 0 2.8.3 4.1.8v3.8zm5.5 7.9c-.3-.4-.5-1.2-.5-1.9-1.6 1.8-3.7 2.4-5.9 2.4-4.8 0-8.5-3.1-8.5-8.8 0-5.3 3.6-8.7 9.2-8.7 2.1 0 3.9.4 5.2 1.2V11C19.2 7.7 17.1 6.1 13.2 6.1c-2.6 0-5.3.7-7.2 1.8L4.7 4.1C7.3 2.6 10.8 1.7 14.6 1.7c7.4 0 10.7 3.6 10.7 10.4v12.2c0 1.5.3 2.8.7 3.9H19.2zm80.2-14.4c0-3.6-1.8-5.3-5-5.3-2.7 0-4.7 1.6-5.7 3.8v16.1h-5.6V9.4h5.4v2.7c1.7-2.3 4.2-3.4 7.2-3.4 6 0 9.3 3.6 9.3 9.4v10.2h-5.6V13.8z"
            fill="#131921"
          />
          <path
            d="M4.5 33.5c18.5 7.5 45.2 7.8 74.2-2.3 1.2-.4 2.4.6 1.6 1.7-18.7 13.8-51.2 13.5-76.9-.6-1-.6-.2-2.2 1.1-1.8z"
            fill="#FF9900"
          />
          <path
            d="M81.2 28.5c2.4 2.4 6.7 6.4 8.7 10.2.3.6-.1 1.4-.8 1.3-3.6-.8-9.4-4.2-11.8-6.6-.7-.7-.3-1.6.6-1.6 1.1-.1 2.3-.2 3.3-3.3z"
            fill="#FF9900"
          />
        </svg>
      </div>
    ),
  },
  {
    name: 'n8n',
    svg: (
      <div className="flex items-center gap-2">
        <svg className="w-8 h-8 shrink-0" viewBox="0 0 100 100" fill="none">
          <circle cx="30" cy="50" r="16" fill="#FF6D5A" />
          <circle cx="70" cy="30" r="14" fill="#FF6D5A" />
          <circle cx="70" cy="70" r="14" fill="#FF6D5A" />
          <path d="M30 50H70M30 50L70 30M30 50L70 70" stroke="#FF6D5A" strokeWidth="8" strokeLinecap="round" />
        </svg>
        <span className="font-black text-slate-900 text-2xl tracking-tighter">n8n</span>
      </div>
    ),
  },
  {
    name: 'ElevenLabs',
    svg: (
      <div className="flex items-center gap-2.5">
        <svg className="h-6 w-auto shrink-0" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="3" width="4" height="18" rx="2" fill="#000000" />
          <rect x="15" y="3" width="4" height="18" rx="2" fill="#000000" />
        </svg>
        <span className="font-black text-slate-900 text-lg tracking-tight font-sans">ElevenLabs</span>
      </div>
    ),
  },
  {
    name: 'Oracle',
    svg: (
      <div className="flex items-center gap-2">
        <svg className="h-5 w-auto" viewBox="0 0 100 24" fill="none">
          <path
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10h10c5.523 0 10-4.477 10-10S27.523 2 22 2H12zm0 4h10c3.314 0 6 2.686 6 6s-2.686 6-6 6H12c-3.314 0-6-2.686-6-6s2.686-6 6-6z"
            fill="#F80000"
          />
        </svg>
        <span className="font-black text-slate-900 text-lg tracking-wider font-mono">ORACLE</span>
      </div>
    ),
  },
  {
    name: 'Meta',
    svg: (
      <div className="flex items-center gap-2">
        <svg className="w-8 h-8 shrink-0" viewBox="0 0 40 40" fill="none">
          <path
            d="M20.2 12.3c-2.4 0-4.4 1.3-6.2 3.4-2.8-3.4-6-4.6-9.1-4.6C1.9 11.1 0 13.9 0 18.2c0 5.4 3.7 10.7 9 10.7 3.5 0 6.6-2.1 8.9-5.7 1.5 2.4 3.4 4.3 5.7 5.2 1 .4 2.1.5 3.1.5 5.5 0 9.3-4.5 9.3-10.7 0-4.4-2-7.1-5.1-7.1-3 0-6.1 1.2-8.9 4.6-1.8-2.1-3.8-3.4-6.2-3.4zm-9.3 12.8c-3.1 0-5.1-3.3-5.1-6.9 0-2.4 1-4.3 2.7-4.3 1.9 0 4.1 1.6 6 5.6-1.3 3.6-2.6 5.6-3.6 5.6zm15 0c-1 0-2.3-2-3.6-5.6 1.9-4 4.1-5.6 6-5.6 1.7 0 2.7 1.9 2.7 4.3 0 3.6-2 6.9-5.1 6.9z"
            fill="url(#meta-grad)"
          />
          <defs>
            <linearGradient id="meta-grad" x1="0" y1="20" x2="36" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0064e0" />
              <stop offset="0.5" stopColor="#0082fb" />
              <stop offset="1" stopColor="#0064e0" />
            </linearGradient>
          </defs>
        </svg>
        <span className="font-extrabold text-slate-900 text-lg tracking-tight">Meta</span>
      </div>
    ),
  },
  {
    name: 'GitHub',
    svg: (
      <div className="flex items-center gap-2">
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
        <span className="font-bold text-slate-900 text-lg tracking-tight">GitHub</span>
      </div>
    ),
  },
];
