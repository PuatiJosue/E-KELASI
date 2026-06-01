export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          actor: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          severity: Database["public"]["Enums"]["log_severity"]
          source: string
        }
        Insert: {
          actor: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          severity?: Database["public"]["Enums"]["log_severity"]
          source: string
        }
        Update: {
          actor?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          severity?: Database["public"]["Enums"]["log_severity"]
          source?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          school_id: string
          subject: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          school_id: string
          subject: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          school_id?: string
          subject?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          archived_at: string | null
          coefficient: number
          comment: string | null
          created_at: string
          graded_at: string
          id: string
          kind: string
          max_score: number
          score: number
          student_id: string
          subject_id: string
          teacher_id: string | null
        }
        Insert: {
          archived_at?: string | null
          coefficient?: number
          comment?: string | null
          created_at?: string
          graded_at?: string
          id?: string
          kind: string
          max_score?: number
          score: number
          student_id: string
          subject_id: string
          teacher_id?: string | null
        }
        Update: {
          archived_at?: string | null
          coefficient?: number
          comment?: string | null
          created_at?: string
          graded_at?: string
          id?: string
          kind?: string
          max_score?: number
          score?: number
          student_id?: string
          subject_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          archived_at: string | null
          class_name: string
          created_at: string
          description: string | null
          due_at: string
          id: string
          status: Database["public"]["Enums"]["homework_status"]
          subject_id: string
          teacher_id: string | null
          title: string
        }
        Insert: {
          archived_at?: string | null
          class_name: string
          created_at?: string
          description?: string | null
          due_at: string
          id?: string
          status?: Database["public"]["Enums"]["homework_status"]
          subject_id: string
          teacher_id?: string | null
          title: string
        }
        Update: {
          archived_at?: string | null
          class_name?: string
          created_at?: string
          description?: string | null
          due_at?: string
          id?: string
          status?: Database["public"]["Enums"]["homework_status"]
          subject_id?: string
          teacher_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      library_books: {
        Row: {
          added_by: string
          author: string
          cover_url: string | null
          created_at: string
          description: string | null
          grade_level: string | null
          id: string
          isbn: string | null
          published_year: number | null
          school_id: string
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          added_by: string
          author: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          grade_level?: string | null
          id?: string
          isbn?: string | null
          published_year?: number | null
          school_id: string
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          added_by?: string
          author?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          grade_level?: string | null
          id?: string
          isbn?: string | null
          published_year?: number | null
          school_id?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_books_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_books_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_books_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_money_payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          parent_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider: Database["public"]["Enums"]["mm_provider"]
          reference: string
          rejection_reason: string | null
          screenshot_url: string | null
          sender_phone: string
          status: Database["public"]["Enums"]["mm_status"]
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          parent_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider: Database["public"]["Enums"]["mm_provider"]
          reference: string
          rejection_reason?: string | null
          screenshot_url?: string | null
          sender_phone: string
          status?: Database["public"]["Enums"]["mm_status"]
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          parent_id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          provider?: Database["public"]["Enums"]["mm_provider"]
          reference?: string
          rejection_reason?: string | null
          screenshot_url?: string | null
          sender_phone?: string
          status?: Database["public"]["Enums"]["mm_status"]
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mobile_money_payments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobile_money_payments_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          payload: Json | null
          read_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          payload?: Json | null
          read_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          payload?: Json | null
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_links: {
        Row: {
          is_primary: boolean
          parent_id: string
          relation: string
          student_id: string
        }
        Insert: {
          is_primary?: boolean
          parent_id: string
          relation?: string
          student_id: string
        }
        Update: {
          is_primary?: boolean
          parent_id?: string
          relation?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          paid_at: string | null
          parent_id: string
          status: string
          stripe_invoice_id: string | null
          subscription_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          paid_at?: string | null
          parent_id: string
          status: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          paid_at?: string | null
          parent_id?: string
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          locale: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          locale?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          locale?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      school_staff: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_staff_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_prices: {
        Row: {
          plan: Database["public"]["Enums"]["subscription_plan"]
          amount_cents: number
          currency: string
          updated_at: string
        }
        Insert: {
          plan: Database["public"]["Enums"]["subscription_plan"]
          amount_cents: number
          currency?: string
          updated_at?: string
        }
        Update: {
          plan?: Database["public"]["Enums"]["subscription_plan"]
          amount_cents?: number
          currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_access_codes: {
        Row: {
          code: string
          school_id: string
          full_name: string
          address: string | null
          created_by: string | null
          created_at: string
          redeemed_by: string | null
          redeemed_at: string | null
        }
        Insert: {
          code: string
          school_id: string
          full_name: string
          address?: string | null
          created_by?: string | null
          created_at?: string
          redeemed_by?: string | null
          redeemed_at?: string | null
        }
        Update: {
          code?: string
          school_id?: string
          full_name?: string
          address?: string | null
          created_by?: string | null
          created_at?: string
          redeemed_by?: string | null
          redeemed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_access_codes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          device_name: string | null
          expo_token: string
          id: string
          last_seen_at: string
          platform: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          expo_token: string
          id?: string
          last_seen_at?: string
          platform: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          expo_token?: string
          id?: string
          last_seen_at?: string
          platform?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          brand_color: string | null
          city: string
          country_code: string
          created_at: string
          id: string
          joined_at: string
          logo_url: string | null
          name: string
          plan: Database["public"]["Enums"]["school_plan"]
          slug: string
          status: Database["public"]["Enums"]["school_status"]
          updated_at: string
        }
        Insert: {
          brand_color?: string | null
          city: string
          country_code: string
          created_at?: string
          id?: string
          joined_at?: string
          logo_url?: string | null
          name: string
          plan?: Database["public"]["Enums"]["school_plan"]
          slug: string
          status?: Database["public"]["Enums"]["school_status"]
          updated_at?: string
        }
        Update: {
          brand_color?: string | null
          city?: string
          country_code?: string
          created_at?: string
          id?: string
          joined_at?: string
          logo_url?: string | null
          name?: string
          plan?: Database["public"]["Enums"]["school_plan"]
          slug?: string
          status?: Database["public"]["Enums"]["school_status"]
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          class_name: string | null
          created_at: string
          full_name: string
          grade_level: string
          id: string
          school_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          class_name?: string | null
          created_at?: string
          full_name: string
          grade_level: string
          id?: string
          school_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          class_name?: string | null
          created_at?: string
          full_name?: string
          grade_level?: string
          id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string
          id: string
          name: string
          school_id: string
          short_name: string
        }
        Insert: {
          color?: string
          id?: string
          name: string
          school_id: string
          short_name: string
        }
        Update: {
          color?: string
          id?: string
          name?: string
          school_id?: string
          short_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_cents: number
          canceled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          parent_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          school_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          parent_id: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          school_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          parent_id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          school_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assignee_id: string | null
          body: string | null
          created_at: string
          id: string
          message_count: number
          priority: Database["public"]["Enums"]["ticket_priority"]
          reference: string
          reporter_id: string | null
          school_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          tag: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          message_count?: number
          priority?: Database["public"]["Enums"]["ticket_priority"]
          reference: string
          reporter_id?: string | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          tag: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          message_count?: number
          priority?: Database["public"]["Enums"]["ticket_priority"]
          reference?: string
          reporter_id?: string | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          tag?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_role_value: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_super_admin: { Args: never; Returns: boolean }
      archive_year: {
        Args: { cutoff: string }
        Returns: { grades_count: number; homework_count: number }[]
      }
      set_student_avatar: {
        Args: { p_student_id: string; p_avatar_url: string }
        Returns: void
      }
    }
    Enums: {
      homework_status: "todo" | "inprogress" | "done" | "late"
      log_severity: "info" | "warn" | "critical"
      mm_provider: "orange" | "airtel" | "mtn" | "mpesa" | "wave"
      mm_status: "pending" | "validated" | "rejected"
      notification_kind:
        | "grade"
        | "message"
        | "hw"
        | "school"
        | "reminder"
        | "billing"
      school_plan: "standard" | "pro"
      school_status: "onboarding" | "trial" | "active" | "suspended" | "churned"
      subscription_plan: "essentiel" | "famille" | "premium"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
      ticket_priority: "P0" | "P1" | "P2" | "P3"
      ticket_status: "new" | "pending" | "waiting" | "resolved"
      user_role: "super_admin" | "school_admin" | "teacher" | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      homework_status: ["todo", "inprogress", "done", "late"],
      log_severity: ["info", "warn", "critical"],
      mm_provider: ["orange", "airtel", "mtn", "mpesa", "wave"],
      mm_status: ["pending", "validated", "rejected"],
      notification_kind: [
        "grade",
        "message",
        "hw",
        "school",
        "reminder",
        "billing",
      ],
      school_plan: ["standard", "pro"],
      school_status: ["onboarding", "trial", "active", "suspended", "churned"],
      subscription_plan: ["essentiel", "famille", "premium"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
      ],
      ticket_priority: ["P0", "P1", "P2", "P3"],
      ticket_status: ["new", "pending", "waiting", "resolved"],
      user_role: ["super_admin", "school_admin", "teacher", "parent"],
    },
  },
} as const

