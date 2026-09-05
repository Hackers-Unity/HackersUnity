'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { UserPublic, UserRole } from '@hackers-unity/shared-types';
import { getStoredUser, saveStoredUser, clearStoredUser, syncBookmarksWithSupabase } from './storage';
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
  const [user, setUser] = useState<UserPublic | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to build user from metadata
  const buildUserFromMeta = (sbUser: SupabaseUser): UserPublic => {
    const meta = sbUser.user_metadata || {};
    return {
      id: sbUser.id,
      name: meta.name || meta.full_name || sbUser.email?.split('@')[0] || 'Hacker',
      email: sbUser.email || '',
      phone: meta.phone || sbUser.phone || null,
      role: (meta.role as UserRole) || UserRole.PARTICIPANT,
      college: meta.college || 'Developer Guild',
      organization: meta.organization || meta.company || 'Developer Community',
      graduationYear: meta.graduation_year || 2026,
      bio: meta.bio || 'Passionate builder & hackathon enthusiast.',
      avatarUrl: meta.avatar_url || '⚡',
      bannerUrl: meta.banner_url || null,
      skills: meta.skills || ['Next.js', 'TypeScript', 'PostgreSQL'],
      resumeUrl: null,
      socialLinks: {
        github: meta.github_url || '',
        linkedin: meta.linkedin_url || '',
        portfolio: meta.portfolio_url || '',
      },
      professionType: meta.profession_type || 'STUDENT',
      degree: meta.degree || 'B.Tech / B.E (Engineering)',
      branch: meta.branch || 'Computer Science & Engineering (CSE)',
      company: meta.company || meta.organization || '',
      jobTitle: meta.job_title || 'Software Engineer',
      experienceYears: meta.experience_years || '1-3 years',
      industry: meta.industry || 'AI/ML, GenAI & Autonomous Systems',
      emailVerified: !!sbUser.email_confirmed_at,
      createdAt: sbUser.created_at,
    };
  };

  // Load initial session
  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        setSupabaseUser(session.user);
        const tempUser = buildUserFromMeta(session.user);
        setUser(tempUser);
        saveStoredUser(tempUser);
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
        setUser(tempUser);
        saveStoredUser(tempUser);
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .maybeSingle();

      const meta = sbUser.user_metadata || {};
      if (profile) {
        const fullUser: UserPublic = {
          id: profile.id,
          name: profile.name || meta.name || meta.full_name || sbUser.email?.split('@')[0] || 'Hacker',
          email: profile.email || sbUser.email || '',
          phone: profile.phone || meta.phone || sbUser.phone || null,
          role: (profile.role as UserRole) || (meta.role as UserRole) || UserRole.PARTICIPANT,
          college: profile.college || meta.college || 'Developer Guild',
          organization: profile.organization || meta.organization || profile.company || meta.company || 'Developer Community',
          graduationYear: profile.graduation_year || meta.graduation_year || 2026,
          bio: profile.bio || meta.bio || 'Passionate builder & hackathon enthusiast.',
          avatarUrl: profile.avatar_url || meta.avatar_url || '⚡',
          bannerUrl: profile.banner_url || meta.banner_url || null,
          skills: (profile.skills && profile.skills.length > 0) ? profile.skills : (meta.skills || ['Next.js', 'TypeScript', 'PostgreSQL']),
          resumeUrl: null,
          socialLinks: {
            github: profile.github_url || meta.github_url || '',
            linkedin: profile.linkedin_url || meta.linkedin_url || '',
            portfolio: profile.portfolio_url || meta.portfolio_url || '',
          },
          professionType: profile.profession_type || meta.profession_type || 'STUDENT',
          degree: profile.degree || meta.degree || 'B.Tech / B.E (Engineering)',
          branch: profile.branch || meta.branch || 'Computer Science & Engineering (CSE)',
          company: profile.company || meta.company || profile.organization || meta.organization || '',
          jobTitle: profile.job_title || meta.job_title || 'Software Engineer',
          experienceYears: profile.experience_years || meta.experience_years || '1-3 years',
          industry: profile.industry || meta.industry || 'AI/ML, GenAI & Autonomous Systems',
          emailVerified: !!sbUser.email_confirmed_at,
          createdAt: profile.created_at || sbUser.created_at,
        };
        setUser(fullUser);
        saveStoredUser(fullUser);
      } else {
        const initialUser: UserPublic = {
          id: sbUser.id,
          name: meta.name || meta.full_name || sbUser.email?.split('@')[0] || 'Hacker',
          email: sbUser.email || '',
          phone: meta.phone || sbUser.phone || null,
          role: (meta.role as UserRole) || UserRole.PARTICIPANT,
          college: meta.college || 'Developer Community',
          organization: meta.organization || meta.company || 'Hackers Unity',
          graduationYear: meta.graduation_year || 2026,
          bio: meta.bio || 'Building future technologies.',
          avatarUrl: meta.avatar_url || '⚡',
          bannerUrl: meta.banner_url || null,
          skills: meta.skills || ['Next.js', 'TypeScript'],
          resumeUrl: null,
          socialLinks: {
            github: meta.github_url || '',
            linkedin: meta.linkedin_url || '',
            portfolio: meta.portfolio_url || '',
          },
          professionType: meta.profession_type || 'STUDENT',
          degree: meta.degree || 'B.Tech / B.E (Engineering)',
          branch: meta.branch || 'Computer Science & Engineering (CSE)',
          company: meta.company || meta.organization || '',
          jobTitle: meta.job_title || 'Software Engineer',
          experienceYears: meta.experience_years || '1-3 years',
          industry: meta.industry || 'AI/ML, GenAI & Autonomous Systems',
          emailVerified: !!sbUser.email_confirmed_at,
          createdAt: sbUser.created_at,
        };
        setUser(initialUser);
        saveStoredUser(initialUser);

        try {
          await supabase.from('profiles').upsert({
            id: initialUser.id,
            email: initialUser.email,
            name: initialUser.name,
            role: initialUser.role,
          });
        } catch {
          // ignore error
        }
      }

      // Sync bookmarks from Supabase for this user
      syncBookmarksWithSupabase(sbUser.id).catch((e) => {
        console.warn('Bookmarks sync warning on signin:', e);
      });
    } catch (err) {
      console.warn('Error syncing profile:', err);
      const stored = getStoredUser();
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
        const createdUser: UserPublic = {
          id: data.user.id,
          name: name,
          email: cleanEmail,
          phone: phone || null,
          role: role,
          college: 'Developer Community',
          organization: 'Hackers Unity',
          graduationYear: 2026,
          bio: 'Building future technologies.',
          avatarUrl: '⚡',
          skills: ['Next.js', 'TypeScript'],
          resumeUrl: null,
          socialLinks: {},
          emailVerified: !!data.user.email_confirmed_at,
          createdAt: data.user.created_at,
        };

        if (data.session) {
          setSession(data.session);
          setUser(createdUser);
          saveStoredUser(createdUser);
        }

        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: cleanEmail,
            name: name,
            role: role,
            phone: phone || null,
          });
        } catch (e) {
          console.warn('Profile creation warning:', e);
        }

        if (!data.session) {
          return {
            needsEmailConfirmation: true,
            message: 'Account created! Please note: To log in without confirming email, disable "Confirm email" in Supabase Dashboard -> Authentication -> Providers -> Email.',
          };
        }
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Sign up failed' };
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'github' = 'google') => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: origin ? `${origin}/auth/callback?next=/dashboard` : undefined,
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

      // 1. Instant local optimistic update
      setUser(updatedUser);
      saveStoredUser(updatedUser);

      // 2. Fast background cloud sync with Supabase
      if (supabaseUser) {
        Promise.allSettled([
          supabase.auth.updateUser({
            data: {
              name: updatedUser.name,
              full_name: updatedUser.name,
              phone: updatedUser.phone,
              avatar_url: updatedUser.avatarUrl,
              banner_url: updatedUser.bannerUrl,
              profession_type: updatedUser.professionType,
              degree: updatedUser.degree,
              branch: updatedUser.branch,
              college: updatedUser.college,
              company: updatedUser.company,
              job_title: updatedUser.jobTitle,
              experience_years: updatedUser.experienceYears,
              industry: updatedUser.industry,
              graduation_year: updatedUser.graduationYear,
              bio: updatedUser.bio,
              skills: updatedUser.skills,
              github_url: updatedUser.socialLinks?.github,
              linkedin_url: updatedUser.socialLinks?.linkedin,
              portfolio_url: updatedUser.socialLinks?.portfolio,
            },
          }),
          supabase.from('profiles').upsert({
            id: user.id,
            name: updatedUser.name,
            college: updatedUser.college,
            organization: updatedUser.organization,
            graduation_year: updatedUser.graduationYear,
            bio: updatedUser.bio,
            skills: updatedUser.skills,
            avatar_url: updatedUser.avatarUrl,
            banner_url: updatedUser.bannerUrl,
            phone: updatedUser.phone,
            github_url: updatedUser.socialLinks?.github,
            linkedin_url: updatedUser.socialLinks?.linkedin,
            portfolio_url: updatedUser.socialLinks?.portfolio,
            profession_type: updatedUser.professionType,
            degree: updatedUser.degree,
            branch: updatedUser.branch,
            company: updatedUser.company,
            job_title: updatedUser.jobTitle,
            experience_years: updatedUser.experienceYears,
            industry: updatedUser.industry,
            updated_at: new Date().toISOString(),
          }),
        ]).catch((e) => console.warn('Supabase profile sync warning:', e));
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
