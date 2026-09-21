/**
 * CareSense Supabase Client Integration
 * Provides secure access to Supabase services (Auth, Database, Realtime, Storage)
 * Includes graceful connection fallback for Demo Mode
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appMode = (import.meta.env.VITE_APP_MODE || 'demo').toLowerCase();

export const isLiveMode = appMode === 'live';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project') &&
  supabaseAnonKey !== 'your-anon-key'
);

let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (err) {
    console.warn('[CareSense] Failed to initialize Supabase client:', err);
    clientInstance = null;
  }
}

export const supabase = clientInstance;

/**
 * Helper to check connection status
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      connected: false,
      message: 'Supabase URL/Key not configured. Running in Demo Mode with realistic clinical simulation.',
    };
  }

  try {
    const { error } = await supabase.from('model_versions').select('count', { count: 'exact', head: true });
    if (error) {
      return {
        connected: false,
        message: `Connected to Supabase endpoint, but table query returned: ${error.message}`,
      };
    }
    return {
      connected: true,
      message: 'Supabase PostgreSQL database connected and authenticated.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Connection error: ${msg}`,
    };
  }
}
