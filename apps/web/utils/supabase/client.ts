import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qbidqpbtivgmsxlitbxx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ESfBQ9lmjlHsSP3eDWJpwg_sOO9QmN5';

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
