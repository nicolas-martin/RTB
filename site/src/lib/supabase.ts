import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Comment = {
  id: string;
  project_id: string;
  wallet_address: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Rating = {
  id: string;
  project_id: string;
  wallet_address: string;
  rating: number;
  created_at: string;
  updated_at: string;
};
