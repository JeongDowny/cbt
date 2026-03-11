export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      certifications: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exams: {
        Row: {
          id: string;
          certification_id: string;
          exam_year: number;
          exam_round: number;
          title: string;
          status: "draft" | "published" | "archived";
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          certification_id: string;
          exam_year: number;
          exam_round: number;
          title?: never;
          status?: "draft" | "published" | "archived";
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          certification_id?: string;
          exam_year?: number;
          exam_round?: number;
          title?: never;
          status?: "draft" | "published" | "archived";
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exams_certification_id_fkey";
            columns: ["certification_id"];
            isOneToOne: false;
            referencedRelation: "certifications";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_subjects: {
        Row: {
          id: string;
          exam_id: string;
          subject_order: number;
          name: string;
          time_limit_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          subject_order: number;
          name: string;
          time_limit_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exam_id?: string;
          subject_order?: number;
          name?: string;
          time_limit_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_subjects_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          exam_subject_id: string;
          question_no: number;
          stem: string;
          choice_1: string;
          choice_2: string;
          choice_3: string;
          choice_4: string;
          correct_answer: number;
          explanation: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exam_subject_id: string;
          question_no: number;
          stem: string;
          choice_1: string;
          choice_2: string;
          choice_3: string;
          choice_4: string;
          correct_answer: number;
          explanation?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exam_subject_id?: string;
          question_no?: number;
          stem?: string;
          choice_1?: string;
          choice_2?: string;
          choice_3?: string;
          choice_4?: string;
          correct_answer?: number;
          explanation?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_exam_subject_id_fkey";
            columns: ["exam_subject_id"];
            isOneToOne: false;
            referencedRelation: "exam_subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      question_images: {
        Row: {
          id: string;
          question_id: string;
          image_order: number;
          image_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          image_order: number;
          image_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          image_order?: number;
          image_path?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_images_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      attempts: {
        Row: {
          id: string;
          exam_id: string;
          user_name: string;
          birth_date: string;
          started_at: string;
          submitted_at: string | null;
          status: "in_progress" | "submitted" | "cancelled";
          total_score: number;
          passed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          user_name: string;
          birth_date: string;
          started_at?: string;
          submitted_at?: string | null;
          status?: "in_progress" | "submitted" | "cancelled";
          total_score?: number;
          passed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exam_id?: string;
          user_name?: string;
          birth_date?: string;
          started_at?: string;
          submitted_at?: string | null;
          status?: "in_progress" | "submitted" | "cancelled";
          total_score?: number;
          passed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attempts_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
        ];
      };
      attempt_subjects: {
        Row: {
          id: string;
          attempt_id: string;
          exam_subject_id: string;
          subject_name_snapshot: string;
          started_at: string | null;
          ended_at: string | null;
          submitted_at: string | null;
          score: number;
          passed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          exam_subject_id: string;
          subject_name_snapshot: string;
          started_at?: string | null;
          ended_at?: string | null;
          submitted_at?: string | null;
          score?: number;
          passed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          exam_subject_id?: string;
          subject_name_snapshot?: string;
          started_at?: string | null;
          ended_at?: string | null;
          submitted_at?: string | null;
          score?: number;
          passed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attempt_subjects_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: false;
            referencedRelation: "attempts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attempt_subjects_exam_subject_id_fkey";
            columns: ["exam_subject_id"];
            isOneToOne: false;
            referencedRelation: "exam_subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      attempt_answers: {
        Row: {
          id: string;
          attempt_subject_id: string;
          question_id: string | null;
          question_no: number;
          subject_name_snapshot: string;
          stem_snapshot: string;
          choice_1_snapshot: string;
          choice_2_snapshot: string;
          choice_3_snapshot: string;
          choice_4_snapshot: string;
          correct_answer_snapshot: number;
          explanation_snapshot: string;
          image_paths_snapshot: Json;
          selected_answer: number | null;
          is_correct: boolean;
          answered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_subject_id: string;
          question_id?: string | null;
          question_no: number;
          subject_name_snapshot: string;
          stem_snapshot: string;
          choice_1_snapshot: string;
          choice_2_snapshot: string;
          choice_3_snapshot: string;
          choice_4_snapshot: string;
          correct_answer_snapshot: number;
          explanation_snapshot?: string;
          image_paths_snapshot?: Json;
          selected_answer?: number | null;
          is_correct?: boolean;
          answered_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          attempt_subject_id?: string;
          question_id?: string | null;
          question_no?: number;
          subject_name_snapshot?: string;
          stem_snapshot?: string;
          choice_1_snapshot?: string;
          choice_2_snapshot?: string;
          choice_3_snapshot?: string;
          choice_4_snapshot?: string;
          correct_answer_snapshot?: number;
          explanation_snapshot?: string;
          image_paths_snapshot?: Json;
          selected_answer?: number | null;
          is_correct?: boolean;
          answered_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_subject_id_fkey";
            columns: ["attempt_subject_id"];
            isOneToOne: false;
            referencedRelation: "attempt_subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      attempt_deletion_logs: {
        Row: {
          id: string;
          attempt_id: string;
          deleted_at: string;
          deleted_by: string | null;
          reason: string | null;
          attempt_snapshot: Json;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          deleted_at?: string;
          deleted_by?: string | null;
          reason?: string | null;
          attempt_snapshot: Json;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          deleted_at?: string;
          deleted_by?: string | null;
          reason?: string | null;
          attempt_snapshot?: Json;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      finalize_attempt: {
        Args: { p_attempt_id: string };
        Returns: undefined;
      };
      clone_exam: {
        Args: { p_exam_id: string; p_new_year: number; p_new_round: number };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
