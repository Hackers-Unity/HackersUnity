'use client';

import { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { Logo } from './logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  useEffect(() => {
    if (isOpen && initialMode) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successText, setSuccessText] = useState("Welcome to Hacker's Unity!");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    // Email Sign In
    if (mode === 'login') {
      const res = await signInWithEmail(email, password);
      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
        return;
      }
      setSuccessText('Welcome back to Hacker\'s Unity!');
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsLoading(false);
        onSuccess?.();
        onClose();
      }, 1000);
    } else {
      // 3. Email Sign Up
      const res = await signUpWithEmail(email, password, name, phoneNumber);
      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
        return;
      }

      if (res.needsEmailConfirmation) {
        setInfoMessage(res.message || 'Account created! Please check your email to verify your account or sign in.');
        setIsLoading(false);
        return;
      }

      setSuccessText('Account created & signed in successfully!');
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsLoading(false);
        onSuccess?.();
        onClose();
      }, 1200);
    }
  };

  const handleOAuth = async (provider: 'google' = 'google') => {
    setIsLoading(true);
    setErrorMessage(null);
    const res = await signInWithOAuth(provider);
    if (res.error) {
      setErrorMessage(res.error);
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        className="relative w-full max-w-md p-6 sm:p-7 overflow-hidden rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-2xl animate-in zoom-in-95 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{successText}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your session is authenticated with Supabase.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-5 flex flex-col items-center">
              <Logo size={52} showText={false} className="mb-2" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {mode === 'login' ? 'Sign In to Hacker\'s Unity' : 'Create Builder Account'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Join 50,000+ developers competing in premier hackathons.
              </p>
            </div>

            {/* Mode Switcher: Sign In vs Sign Up */}
            <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-white/[0.04] rounded-2xl mb-4 border border-slate-200 dark:border-white/[0.08] text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-white dark:bg-white/10 text-[#0099e6] dark:text-[#38bdf8] shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-white dark:bg-white/10 text-[#0099e6] dark:text-[#38bdf8] shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Info / Email Confirmation Alert */}
            {infoMessage && (
              <div className="mb-4 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-sky-800 dark:text-sky-300 text-xs flex items-start gap-2 animate-in fade-in">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#0099e6] dark:text-[#38bdf8]" />
                <span>{infoMessage}</span>
              </div>
            )}

            {/* Social OAuth Button: Google */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-3">
              <div className="border-t border-slate-100 dark:border-white/[0.08] w-full" />
              <span className="bg-white dark:bg-[#0c1017] px-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">or continue with email</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-left">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-left text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Satoshi Nakamoto"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-left text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number (Optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-left text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="builder@hackersunity.dev"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-left text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs transition-all shadow-sm shadow-sky-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Supabase...</span>
                  </>
                ) : (
                  <span>
                    {mode === 'login'
                      ? 'Sign In to Arena'
                      : 'Create Builder Account'}
                  </span>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
