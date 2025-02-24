export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          content: string
          first_comment: string | null
          image_url: string | null
          scheduled_for: string | null
          status: 'draft' | 'scheduled' | 'published' | 'failed'
          error: string | null
          metadata: Json
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          first_comment?: string | null
          image_url?: string | null
          scheduled_for?: string | null
          status?: 'draft' | 'scheduled' | 'published' | 'failed'
          error?: string | null
          metadata?: Json
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          first_comment?: string | null
          image_url?: string | null
          scheduled_for?: string | null
          status?: 'draft' | 'scheduled' | 'published' | 'failed'
          error?: string | null
          metadata?: Json
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      post_pages: {
        Row: {
          id: string
          post_id: string
          page_id: string
          page_name: string
          page_access_token: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          page_id: string
          page_name: string
          page_access_token: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          page_id?: string
          page_name?: string
          page_access_token?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      post_status: 'draft' | 'scheduled' | 'published' | 'failed'
    }
  }
}