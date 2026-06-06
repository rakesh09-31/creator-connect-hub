export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      creator_requests: {
        Row: {
          budget: string | null
          client_id: string
          created_at: string
          creator_id: string
          id: string
          message: string | null
          status: string
          subject: string
        }
        Insert: {
          budget?: string | null
          client_id: string
          created_at?: string
          creator_id: string
          id?: string
          message?: string | null
          status?: string
          subject: string
        }
        Update: {
          budget?: string | null
          client_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          message?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      creator_specialties: {
        Row: {
          created_at: string
          id: string
          specialty: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          specialty: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          specialty?: string
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_id: string | null
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          message: string | null
          portfolio_url: string | null
          resume_url: string | null
          squad_id: string | null
          status: string
        }
        Insert: {
          applicant_id?: string | null
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          message?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          squad_id?: string | null
          status?: string
        }
        Update: {
          applicant_id?: string | null
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          message?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          squad_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          budget: string | null
          category: string | null
          client_id: string
          company_name: string | null
          created_at: string
          deadline: string | null
          description: string
          duration: string | null
          experience_level: string | null
          id: string
          location: string | null
          skills_required: string[] | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget?: string | null
          category?: string | null
          client_id: string
          company_name?: string | null
          created_at?: string
          deadline?: string | null
          description: string
          duration?: string | null
          experience_level?: string | null
          id?: string
          location?: string | null
          skills_required?: string[] | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget?: string | null
          category?: string | null
          client_id?: string
          company_name?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          duration?: string | null
          experience_level?: string | null
          id?: string
          location?: string | null
          skills_required?: string[] | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          created_at: string
          description: string | null
          id: string
          media_type: string
          media_url: string | null
          project_link: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          media_type?: string
          media_url?: string | null
          project_link?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          media_type?: string
          media_url?: string | null
          project_link?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_saves: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string
          caption: string | null
          created_at: string
          id: string
          media_url: string | null
          post_type: string
        }
        Insert: {
          author_id: string
          caption?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          post_type?: string
        }
        Update: {
          author_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          post_type?: string
        }
        Relationships: []
      }
      profile_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          client_field: string | null
          cover_url: string | null
          created_at: string
          full_name: string | null
          id: string
          languages: string[] | null
          location: string | null
          onboarded: boolean
          portfolio_tagline: string | null
          portfolio_template: string | null
          portfolio_theme: string | null
          portfolio_url: string | null
          resume_url: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          services: Json | null
          social_links: Json | null
          testimonials: Json | null
          updated_at: string
          username: string
          verified: boolean
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          client_field?: string | null
          cover_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          languages?: string[] | null
          location?: string | null
          onboarded?: boolean
          portfolio_tagline?: string | null
          portfolio_template?: string | null
          portfolio_theme?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          services?: Json | null
          social_links?: Json | null
          testimonials?: Json | null
          updated_at?: string
          username: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          client_field?: string | null
          cover_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          languages?: string[] | null
          location?: string | null
          onboarded?: boolean
          portfolio_tagline?: string | null
          portfolio_template?: string | null
          portfolio_theme?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          services?: Json | null
          social_links?: Json | null
          testimonials?: Json | null
          updated_at?: string
          username?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      squad_members: {
        Row: {
          created_at: string
          id: string
          role: string
          squad_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          squad_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          squad_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          specialty: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "creator" | "client" | "admin"
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
  public: {
    Enums: {
      app_role: ["creator", "client", "admin"],
    },
  },
} as const
