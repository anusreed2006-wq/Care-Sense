/**
 * CareSense Authentication Service
 * Interacts with Supabase Auth when configured, with seamless Demo Mode support
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

export const DEMO_USER: UserProfile = {
  id: 'usr-clinician-demo',
  user_id: 'auth-demo-uid',
  full_name: 'Dr. Sarah Lin, MD, FCCM',
  role: 'clinician',
  hospital_id: 'HOSP-METRO-CENTRAL',
  avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
  created_at: '2026-01-10T08:00:00Z',
};

const STORAGE_KEY = 'caresense_user_session';

export const authService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (profile) return profile as UserProfile;

          return {
            id: user.id,
            user_id: user.id,
            full_name: user.email?.split('@')[0] || 'Clinician',
            role: 'clinician',
            hospital_id: 'HOSP-METRO-CENTRAL',
            created_at: new Date().toISOString(),
          };
        }
      } catch (e) {
        console.warn('Supabase auth session error, falling back to local session', e);
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore parse error
      }
    }

    // Default to clinician session in Demo mode
    return DEMO_USER;
  },

  async signInWithEmail(email: string, password: string): Promise<{ user: UserProfile | null; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { user: null, error: error.message };
      if (data.user) {
        const profile = await this.getCurrentUser();
        return { user: profile };
      }
    }

    // Demo Mode Sign In
    const demoUser: UserProfile = {
      ...DEMO_USER,
      full_name: email.split('@')[0] ? `Dr. ${email.split('@')[0].toUpperCase()}` : 'Dr. Sarah Lin',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
    return { user: demoUser };
  },

  async signInAsDemo(role: UserRole = 'clinician'): Promise<UserProfile> {
    const user: UserProfile = {
      ...DEMO_USER,
      role,
      full_name: role === 'admin' ? 'Chief Medical Officer (Admin)' : role === 'researcher' ? 'Lead Biostatistician' : 'Dr. Sarah Lin, MD, FCCM',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY);
  },
};
