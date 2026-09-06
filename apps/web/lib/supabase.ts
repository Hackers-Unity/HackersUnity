import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://qifwhjfisipxkytsqxez.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_VEbLNd33E-R6hlSsmvMXhA_k_xrQnX8';

// Use createBrowserClient from @supabase/ssr so that PKCE code verifiers
// and session tokens are stored in Cookies, ensuring cross-navigation reliability.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
