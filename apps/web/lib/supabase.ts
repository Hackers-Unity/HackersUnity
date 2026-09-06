import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://qifwhjfisipxkytsqxez.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_VEbLNd33E-R6hlSsmvMXhA_k_xrQnX8';

const LS_COOKIE_PREFIX = 'sb_auth_cookie_';
const COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60; // 400 days

function parseBrowserCookies(): { name: string; value: string }[] {
  if (typeof document === 'undefined') return [];
  const raw = document.cookie;
  if (!raw) return [];
  return raw
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const idx = c.indexOf('=');
      if (idx === -1) return { name: c, value: '' };
      return {
        name: c.substring(0, idx).trim(),
        value: c.substring(idx + 1).trim(),
      };
    });
}

function writeBrowserCookie(name: string, value: string, maxAge = COOKIE_MAX_AGE_SECONDS) {
  if (typeof document === 'undefined') return;
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const expiresDate = new Date(Date.now() + maxAge * 1000).toUTCString();
  const secureFlag = isSecure ? '; Secure' : '';
  document.cookie = `${name}=${value}; Path=/; SameSite=Lax; Max-Age=${maxAge}; Expires=${expiresDate}${secureFlag}`;
}

// Dual-tier persistent browser client:
// Keeps session active in both document.cookie and localStorage so sessions survive
// browser restarts, tab closes, and cookie clearance.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookieOptions: {
    maxAge: COOKIE_MAX_AGE_SECONDS,
    sameSite: 'lax',
    path: '/',
  },
  cookies: {
    getAll() {
      if (typeof window === 'undefined') return [];

      const docCookies = parseBrowserCookies();
      const cookieMap = new Map<string, string>();
      for (const { name, value } of docCookies) {
        cookieMap.set(name, value);
      }

      // Check localStorage for any backed-up auth cookies
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(LS_COOKIE_PREFIX)) {
            const cookieName = key.substring(LS_COOKIE_PREFIX.length);
            const savedValue = localStorage.getItem(key);
            if (savedValue && !cookieMap.has(cookieName)) {
              // Restore missing cookie into document.cookie with long persistence
              writeBrowserCookie(cookieName, savedValue);
              cookieMap.set(cookieName, savedValue);
            }
          }
        }
      } catch (e) {
        console.warn('[Supabase Persistent Auth] LocalStorage read warning:', e);
      }

      return Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value }));
    },
    setAll(cookiesToSet) {
      if (typeof window === 'undefined') return;

      cookiesToSet.forEach(({ name, value, options }) => {
        const isDelete = !value || (options && typeof options.maxAge === 'number' && options.maxAge <= 0);

        if (isDelete) {
          if (typeof document !== 'undefined') {
            document.cookie = `${name}=; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
          try {
            localStorage.removeItem(`${LS_COOKIE_PREFIX}${name}`);
          } catch {}
        } else {
          const maxAge = options?.maxAge && options.maxAge > 0 ? options.maxAge : COOKIE_MAX_AGE_SECONDS;
          writeBrowserCookie(name, value, maxAge);
          try {
            localStorage.setItem(`${LS_COOKIE_PREFIX}${name}`, value);
          } catch (e) {
            console.warn('[Supabase Persistent Auth] LocalStorage backup write warning:', e);
          }
        }
      });
    },
  },
});
