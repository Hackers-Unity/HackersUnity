import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qbidqpbtivgmsxlitbxx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ESfBQ9lmjlHsSP3eDWJpwg_sOO9QmN5';

// Use createBrowserClient from @supabase/ssr so that PKCE code verifiers
// and session tokens are stored in Cookies, ensuring cross-navigation reliability.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
