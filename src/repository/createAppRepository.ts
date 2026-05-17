import { isSupabaseConfigured } from '../lib/supabase';
import { createMockRepository } from './mockRepository';
import { createSupabaseRepository } from './supabaseRepository';
import type { AppRepository } from './types';

export function createAppRepositories(): { mock: AppRepository; supabase: AppRepository | null } {
  const mock = createMockRepository();
  const supabase = isSupabaseConfigured ? createSupabaseRepository() : null;
  return { mock, supabase };
}
