import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const browser = typeof window !== 'undefined';

export const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
  auth: {
    persistSession: browser,
    autoRefreshToken: browser,
    detectSessionInUrl: browser,
  },
  global: {
    headers: { 'X-Client-Info': 'aduni-plus-angular' },
  },
});
