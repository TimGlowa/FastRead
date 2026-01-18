import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          original_filename: string;
          parsed_content: string;
          sections: Record<string, unknown>;
          citations: Record<string, unknown>;
          word_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          original_filename: string;
          parsed_content: string;
          sections?: Record<string, unknown>;
          citations?: Record<string, unknown>;
          word_count: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          original_filename?: string;
          parsed_content?: string;
          sections?: Record<string, unknown>;
          citations?: Record<string, unknown>;
          word_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      reading_progress: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          word_index: number;
          speed: number;
          device_id: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          word_index: number;
          speed: number;
          device_id?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string;
          word_index?: number;
          speed?: number;
          device_id?: string | null;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          settings: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          settings?: Record<string, unknown>;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          settings?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      saved_citations: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          citation_text: string;
          context: string | null;
          position: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          citation_text: string;
          context?: string | null;
          position?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string;
          citation_text?: string;
          context?: string | null;
          position?: number | null;
          created_at?: string;
        };
      };
    };
  };
};
