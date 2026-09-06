'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { UserPublic, UserRole } from '@hackers-unity/shared-types';
import {
  getStoredUser,
  saveStoredUser,
  clearStoredUser,
  getPermanentProfile,
  syncBookmarksWithSupabase,
} from './storage';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { formatAndValidatePhone, isValidE164Phone } from './phone-utils';

interface AuthContextType {
  user: UserPublic | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string,
    phone?: string,
    role?: UserRole
  ) => Promise<{ error?: string; needsEmailConfirmation?: boolean; message?: string }>;
  signInWithOAuth: (provider?: 'google' | 'github') => Promise<{ error?: string }>;
  signInWithPhone: (phone: string) => Promise<{ error?: string }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error?: string }>;
  updateUserProfile: (updates: Partial<UserPublic>) => Promise<{ error?: string }>;
  updateUserPassword: (newPass: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Synchronously initialize user from storage to eliminate page load login flicker
  const [user, setUser] = useState<UserPublic | null>(() => getStoredUser());
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to build user from metadata and permanent storage
  const buildUserFromMeta = (sbUser: SupabaseUser): UserPublic => {
    const meta = sbUser.user_metadata || {};
    const saved = getPermanentProfile(sbUser.id) || (sbUser.email ? getPermanentProfile(sbUser.email) : null);
    return {
      id: sbUser.id,
      name: meta.name || meta.full_name || saved?.name || sbUser.email?.split('@')[0] || 'Hacker',
      email: sbUser.email || saved?.email || '',
      phone: meta.phone || sbUser.phone || saved?.phone || null,
      role: (meta.role as UserRole) || saved?.role || UserRole.PARTICIPANT,
      college: meta.college || saved?.college || '',
      organization: meta.organization || meta.company || saved?.organization || '',
      graduationYear: meta.graduation_year || saved?.graduationYear || 2026,
      bio: meta.bio || saved?.bio || '',
      avatarUrl: meta.avatar_url || saved?.avatarUrl || '⚡',
      bannerUrl: meta.banner_url || saved?.bannerUrl || null,
      skills: (meta.skills && meta.skills.length > 0)
        ? meta.skills
        : (saved?.skills && saved.skills.length > 0)
        ? saved.skills
        : ['Next.js', 'TypeScript', 'PostgreSQL'],
      resumeUrl: saved?.resumeUrl || null,
      socialLinks: {
        github: meta.github_url || saved?.socialLinks?.github || '',
        linkedin: meta.linkedin_url || saved?.socialLinks?.linkedin || '',
        portfolio: meta.portfolio_url || saved?.socialLinks?.portfolio || '',
      },
      professionType: meta.profession_type || saved?.professionType || 'STUDENT',
      degree: meta.degree || saved?.degree || 'B.Tech / B.E (Engineering)',
      branch: meta.branch || saved?.branch || 'Computer Science & Engineering (CSE)',
      company: meta.company || meta.organization || saved?.company || '',
      jobTitle: meta.job_title || saved?.jobTitle || 'Software Engineer',
      experienceYears: meta.experience_years || saved?.experienceYears || '1-3 years',
      industry: meta.industry || saved?.industry || 'AI/ML, GenAI & Autonomous Systems',
      emailVerified: !!sbUser.email_confirmed_at,
      createdAt: sbUser.created_at || saved?.createdAt || new Date().toISOString(),
    };
  };

  // Load initial session
  useEffect(() => {
    async function initAuth() {
      // Catch OAuth code if redirected to root path by Supabase fallback
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code && !window.location.pathname.startsWith('/auth/callback')) {
          const next = urlParams.get('next') || '/dashboard';
          window.location.replace(`/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        setSupabaseUser(session.user);
        const tempUser = buildUserFromMeta(session.user);
        setUser((prev) => prev || tempUser);
        await syncProfileFromSupabaseUser(session.user);
      } else {
        const stored = getStoredUser();
        if (stored) {
          setUser(stored);
        }
      }
      setLoading(false);
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        setSupabaseUser(session.user);
        const tempUser = buildUserFromMeta(session.user);
        setUser((prev) => prev || tempUser);
        await syncProfileFromSupabaseUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setSupabaseUser(null);
        setUser(null);
        clearStoredUser();
      }
      setLoading(false);
    });

    const handleStorageChange = () => {
      const stored = getStoredUser();
      if (!supabaseUser && stored) {
        setUser(stored);
      }
    };
    window.addEventListener('hackers_unity_storage_change', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hackers_unity_storage_change', handleStorageChange);
    };
  }, []);

  const syncProfileFromSupabaseUser = async (sbUser: SupabaseUser) => {
    try {
      const saved = getPermanentProfile(sbUser.id) || (sbUser.email ? getPermanentProfile(sbUser.email) : null);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .maybeSingle();

      const meta = sbUser.user_metadata || {};
      const fullUser: UserPublic = {
        id: sbUser.id,
        name: profile?.name || meta.name || meta.full_name || saved?.name || sbUser.email?.split('@')[0] || 'Hacker',
        email: profile?.email || sbUser.email || saved?.email || '',
        phone: meta.phone || sbUser.phone || saved?.phone || null,
        role: (profile?.role as UserRole) || (meta.role as UserRole) || saved?.role || UserRole.PARTICIPANT,
        college: profile?.college || meta.college || saved?.college || '',
        organization: profile?.organization || meta.organization || meta.company || saved?.organization || '',
        graduationYear: meta.graduation_year || saved?.graduationYear || 2026,
        bio: profile?.bio || meta.bio || saved?.bio || '',
        avatarUrl: profile?.avatar_url || meta.avatar_url || saved?.avatarUrl || '⚡',
        bannerUrl: meta.banner_url || saved?.bannerUrl || null,
        skills: (profile?.skills && profile.skills.length > 0)
          ? profile.skills
          : (meta.skills && meta.skills.length > 0)
          ? meta.skills
          : (saved?.skills && saved.skills.length > 0)
          ? saved.skills
          : ['Next.js', 'TypeScript', 'PostgreSQL'],
        resumeUrl: saved?.resumeUrl || null,
        socialLinks: {
          github: profile?.github_url || meta.github_url || saved?.socialLinks?.github || '',
          linkedin: profile?.linkedin_url || meta.linkedin_url || saved?.socialLinks?.linkedin || '',
          portfolio: profile?.portfolio_url || meta.portfolio_url || saved?.socialLinks?.portfolio || '',
        },
        professionType: meta.profession_type || saved?.professionType || 'STUDENT',
        degree: meta.degree || saved?.degree || 'B.Tech / B.E (Engineering)',
        branch: meta.branch || saved?.branch || 'Computer Science & Engineering (CSE)',
        company: meta.company || meta.organization || profile?.organization || saved?.company || '',
        jobTitle: meta.job_title || saved?.jobTitle || 'Software Engineer',
        experienceYears: meta.experience_years || saved?.experienceYears || '1-3 years',
        industry: meta.industry || saved?.industry || 'AI/ML, GenAI & Autonomous Systems',
        emailVerified: !!sbUser.email_confirmed_at,
        createdAt: profile?.created_at || sbUser.created_at || saved?.createdAt || new Date().toISOString(),
      };

      setUser(fullUser);
      saveStoredUser(fullUser);
      // Sync bookmarks from Supabase for this user
      syncBookmarksWithSupabase(sbUser.id).catch((e) => {
        console.warn('Bookmarks sync warning on signin:', e);
      });
    } catch (err) {
      console.warn('Error syncing profile:', err);
      const stored = getStoredUser() || getPermanentProfile(sbUser.id);
      if (stored) setUser(stored);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return {
            error: 'Email confirmation is pending. To disable confirmation emails, turn off "Confirm email" in Supabase Dashboard -> Authentication -> Providers -> Email.',
          };
        }
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          return {
            error: 'Invalid email or password. Please check your credentials or ensure email is confirmed in Supabase.',
          };
        }
        return { error: error.message };
      }

      if (data.user) {
        setSupabaseUser(data.user);
        if (data.session) {
          setSession(data.session);
        }
        await syncProfileFromSupabaseUser(data.user);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    phone?: string,
    role: UserRole = UserRole.PARTICIPANT
  ) => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Call server API to create user with email_confirm = true (instant zero-email verification)
      try {
        const apiRes = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password: pass,
            name: name.trim(),
            phone: phone || '',
            role,
          }),
        });

        const apiData = await apiRes.json();
        if (!apiRes.ok) {
          return { error: apiData.error || 'Failed to create account.' };
        }

        // 2. Immediately sign in with the new credentials
        const loginRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass,
        });

        if (loginRes.error) {
          return { error: loginRes.error.message };
        }

        if (loginRes.data.user) {
          setSupabaseUser(loginRes.data.user);
          if (loginRes.data.session) {
            setSession(loginRes.data.session);
          }
          const createdUser = buildUserFromMeta(loginRes.data.user);
          setUser(createdUser);
          saveStoredUser(createdUser);
          await syncProfileFromSupabaseUser(loginRes.data.user);
        }

        return {};
      } catch (apiErr: any) {
        console.warn('Direct signup API unavailable, falling back to client SDK:', apiErr);

        // Fallback to client SDK
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pass,
          options: {
            data: {
              name,
              full_name: name,
              phone: phone || '',
              role,
            },
          },
        });

        if (error) return { error: error.message };

        if (data.user) {
          setSupabaseUser(data.user);
          const createdUser = buildUserFromMeta(data.user);
          if (data.session) {
            setSession(data.session);
            setUser(createdUser);
            saveStoredUser(createdUser);
          }
          await syncProfileFromSupabaseUser(data.user);

          if (!data.session) {
            return {
              needsEmailConfirmation: true,
              message: 'Account created! Please check your email to confirm or sign in.',
            };
          }
        }
        return {};
      }
    } catch (err: any) {
      return { error: err.message || 'Sign up failed' };
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'github' = 'google') => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hackersunity.com';
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'OAuth error' };
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      let e164Phone = phone.trim();

      // If not already in valid E.164 format (+XXXXXXXXX), validate and format it
      if (!isValidE164Phone(e164Phone)) {
        const validation = formatAndValidatePhone(e164Phone);
        if (!validation.isValid || !validation.formattedPhone) {
          return { error: validation.error || 'Please enter a valid mobile phone number.' };
        }
        e164Phone = validation.formattedPhone;
      }

      console.log('[Supabase Phone Auth] 📲 Sending SMS OTP to E.164 phone number:', e164Phone);

      const { error } = await supabase.auth.signInWithOtp({
        phone: e164Phone,
      });

      if (error) {
        console.warn('[Supabase Phone Auth] signInWithOtp message:', error.message);
        if (error.message?.toLowerCase().includes('unsupported phone provider')) {
          return {
            error:
              'SMS Phone Verification is not configured on this Supabase project. Please sign up or sign in using Email or Google.',
          };
        }
        return { error: error.message };
      }

      console.log('[Supabase Phone Auth] ✅ SMS OTP successfully requested for:', e164Phone);
      return {};
    } catch (err: any) {
      console.warn('[Supabase Phone Auth] signInWithPhone exception:', err?.message || err);
      return { error: err?.message || 'Phone sign in error' };
    }
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    try {
      let e164Phone = phone.trim();

      if (!isValidE164Phone(e164Phone)) {
        const validation = formatAndValidatePhone(e164Phone);
        if (!validation.isValid || !validation.formattedPhone) {
          return { error: validation.error || 'Please enter a valid mobile phone number.' };
        }
        e164Phone = validation.formattedPhone;
      }

      const cleanToken = token.trim();
      if (!cleanToken || cleanToken.length < 6) {
        return { error: 'Please enter a valid 6-digit OTP code.' };
      }

      console.log('[Supabase Phone Auth] 🔐 Verifying OTP for E.164 phone number:', e164Phone, 'Code:', cleanToken);

      const { data, error } = await supabase.auth.verifyOtp({
        phone: e164Phone,
        token: cleanToken,
        type: 'sms',
      });

      if (error) {
        console.warn('[Supabase Phone Auth] verifyOtp error:', error.message);
        return { error: error.message };
      }

      console.log('[Supabase Phone Auth] ✅ OTP verification successful for:', e164Phone, 'User:', data.user?.id);
      if (data.user) {
        await syncProfileFromSupabaseUser(data.user);
      }
      return {};
    } catch (err: any) {
      console.warn('[Supabase Phone Auth] verifyPhoneOtp exception:', err?.message || err);
      return { error: err?.message || 'OTP verification failed' };
    }
  };

  const updateUserProfile = async (updates: Partial<UserPublic>) => {
    try {
      if (!user) return { error: 'Not authenticated' };
      const updatedUser: UserPublic = {
        ...user,
        ...updates,
        socialLinks: {
          github: updates.socialLinks?.github !== undefined ? updates.socialLinks.github : user.socialLinks?.github || '',
          linkedin: updates.socialLinks?.linkedin !== undefined ? updates.socialLinks.linkedin : user.socialLinks?.linkedin || '',
          portfolio: updates.socialLinks?.portfolio !== undefined ? updates.socialLinks.portfolio : user.socialLinks?.portfolio || '',
        },
      };

      // 1. Instant local optimistic update & permanent storage
      setUser(updatedUser);
      saveStoredUser(updatedUser);

      // 2. Client-side session metadata sync on Supabase Auth
      try {
        await supabase.auth.updateUser({
          data: {
            name: updatedUser.name,
            full_name: updatedUser.name,
            phone: updatedUser.phone,
            bio: updatedUser.bio,
            college: updatedUser.college,
            organization: updatedUser.organization,
            company: updatedUser.company,
            graduation_year: updatedUser.graduationYear,
            degree: updatedUser.degree,
            branch: updatedUser.branch,
            profession_type: updatedUser.professionType,
            job_title: updatedUser.jobTitle,
            experience_years: updatedUser.experienceYears,
            industry: updatedUser.industry,
            skills: updatedUser.skills,
            avatar_url: updatedUser.avatarUrl,
            banner_url: updatedUser.bannerUrl,
            github_url: updatedUser.socialLinks?.github,
            linkedin_url: updatedUser.socialLinks?.linkedin,
            portfolio_url: updatedUser.socialLinks?.portfolio,
          },
        });
      } catch (clientMetaErr) {
        console.warn('[Profile Update] Client auth metadata sync notice:', clientMetaErr);
      }

      // 3. Cloud sync with Supabase PostgreSQL database via server API
      try {
        const res = await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            name: updatedUser.name,
            phone: updatedUser.phone,
            bio: updatedUser.bio,
            college: updatedUser.college,
            organization: updatedUser.organization,
            company: updatedUser.company,
            graduationYear: updatedUser.graduationYear,
            degree: updatedUser.degree,
            branch: updatedUser.branch,
            professionType: updatedUser.professionType,
            jobTitle: updatedUser.jobTitle,
            experienceYears: updatedUser.experienceYears,
            industry: updatedUser.industry,
            skills: updatedUser.skills,
            avatarUrl: updatedUser.avatarUrl,
            bannerUrl: updatedUser.bannerUrl,
            socialLinks: updatedUser.socialLinks,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          // If public URLs were generated for avatar/banner, update state with clean URLs
          if (data.avatarUrl || data.bannerUrl) {
            const finalUser: UserPublic = {
              ...updatedUser,
              avatarUrl: data.avatarUrl || updatedUser.avatarUrl,
              bannerUrl: data.bannerUrl !== undefined ? data.bannerUrl : updatedUser.bannerUrl,
            };
            setUser(finalUser);
            saveStoredUser(finalUser);
          }
        } else {
          console.warn('[Profile Sync] Server API error:', data.error);
        }
      } catch (cloudErr) {
        console.warn('[Profile Sync] Background cloud sync warning:', cloudErr);
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Profile update failed' };
    }
  };

  const updateUserPassword = async (newPass: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPass,
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Password update failed' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
    clearStoredUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signInWithPhone,
        verifyPhoneOtp,
        updateUserProfile,
        updateUserPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
