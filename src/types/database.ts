export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      exams: {
        Row: {
          id: string;
          certification_name: string;
          title: string;
          exam_year: number;
          exam_round: number;
          default_time_limit_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          certification_name: string;
          title: string;
          exam_year: number;
          exam_round: number;
          default_time_limit_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          certification_name?: string;
          title?: string;
          exam_year?: number;
          exam_round?: number;
          default_time_limit_minutes?: number | null;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          exam_id: string;
          question_no: number;
          stem: string;
          image_url: string | null;
          choice_count: number;
          correct_choice_id: string;
          explanation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          question_no: number;
          stem: string;
          image_url?: string | null;
          choice_count: number;
          correct_choice_id: string;
          explanation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          question_no?: number;
          stem?: string;
          image_url?: string | null;
          choice_count?: number;
          correct_choice_id?: string;
          explanation?: string | null;
          updated_at?: string;
        };
      };
      choices: {
        Row: {
          id: string;
          question_id: string;
          label: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          label: string;
          text: string;
          created_at?: string;
        };
        Update: {
          label?: string;
          text?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          exam_id: string;
          user_name: string;
          birth_date: string;
          answers: Json;
          score: number;
          total_questions: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          user_name: string;
          birth_date: string;
          answers: Json;
          score: number;
          total_questions: number;
          created_at?: string;
        };
        Update: {
          user_name?: string;
          birth_date?: string;
          answers?: Json;
          score?: number;
          total_questions?: number;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
