import { createClient } from '@supabase/supabase-js';

// environment variables (safe for mobile use)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// create and export the supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
