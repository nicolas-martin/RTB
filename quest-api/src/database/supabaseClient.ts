import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function initializeSupabase(url: string, anonKey: string): SupabaseClient {
	if (!url || !anonKey) {
		throw new Error('Supabase URL and anon key are required');
	}

	supabase = createClient(url, anonKey);
	return supabase;
}

export function getSupabaseClient(): SupabaseClient {
	if (!supabase) {
		throw new Error('Supabase client not initialized. Call initializeSupabase first.');
	}
	return supabase;
}
