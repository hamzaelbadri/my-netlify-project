import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = 'https://mxtcydrpnnqumjvjuxqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dGN5ZHJwbm5xdW1qdmp1eHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMzg1NzYsImV4cCI6MjA1NTkxNDU3Nn0.9N7dA1IcjQtEOs0o0RrdqFZE3aadW19guldz1PV8T-k';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with proper URL validation
function createSupabaseClient() {
  try {
    // Validate URL
    new URL(supabaseUrl);
    
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'facebook_post_manager_auth',
        storage: window.localStorage,
        detectSessionInUrl: true,
        flowType: 'implicit'
      }
    });
  } catch (error) {
    console.error('Invalid Supabase URL:', error);
    throw new Error('Invalid Supabase configuration');
  }
}

export const supabase = createSupabaseClient();

// Helper function to get current timestamp in ISO format
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Helper function to handle Supabase errors
export function handleSupabaseError(error: unknown): string {
  if (!error) return 'An unknown error occurred';
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

// Authentication functions with metadata tracking
export async function signUp(email: string, password: string, metadata: Record<string, any> = {}) {
  try {
    const timestamp = getCurrentTimestamp();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...metadata,
          created_at: timestamp
        }
      }
    });

    if (error) throw error;

    // Create initial metadata record
    if (data.user) {
      await supabase.from('user_metadata').insert({
        user_id: data.user.id,
        created_at: timestamp,
        login_count: 0
      });
    }

    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

// User metadata functions
export async function getUserMetadata(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_metadata')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

// Post management functions with proper error handling
export async function createPost(post: Database['public']['Tables']['posts']['Insert']) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

export async function updatePost(
  id: string,
  updates: Database['public']['Tables']['posts']['Update']
) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

export async function deletePost(id: string) {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

export async function getPost(id: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_pages (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

export async function getPosts(filters?: {
  status?: Database['public']['Enums']['post_status'][];
  fromDate?: string;
  toDate?: string;
  pageId?: string;
}) {
  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        post_pages (*)
      `)
      .order('scheduled_for', { ascending: true });

    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters?.fromDate) {
      query = query.gte('scheduled_for', filters.fromDate);
    }

    if (filters?.toDate) {
      query = query.lte('scheduled_for', filters.toDate);
    }

    if (filters?.pageId) {
      query = query.eq('post_pages.page_id', filters.pageId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

// Post pages management with proper error handling
export async function addPostPages(pages: Database['public']['Tables']['post_pages']['Insert'][]) {
  try {
    const { data, error } = await supabase
      .from('post_pages')
      .insert(pages)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

export async function removePostPages(postId: string, pageIds: string[]) {
  try {
    const { error } = await supabase
      .from('post_pages')
      .delete()
      .eq('post_id', postId)
      .in('page_id', pageIds);

    if (error) throw error;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}