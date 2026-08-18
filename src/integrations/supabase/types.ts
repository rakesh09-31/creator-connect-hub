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

      client_roles: {
        Row: {
          client_id: string
          role_id: string
        }
        Insert: {
          client_id: string
          role_id: string
        }
        Update: {
          client_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_roles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "professional_roles"
            referencedColumns: ["id"]
          }
        ]
      }
      creator_roles: {
        Row: {
          creator_id: string
          role_id: string
        }
        Insert: {
          creator_id: string
          role_id: string
        }
        Update: {
          creator_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_roles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "professional_roles"
            referencedColumns: ["id"]
          }
        ]
      }
      creator_skills: {
        Row: {
          creator_id: string
          skill_id: string
        }
        Insert: {
          creator_id: string
          skill_id: string
        }
        Update: {
          creator_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_skills_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      job_roles: {
        Row: {
          job_id: string
          role_id: string
        }
        Insert: {
          job_id: string
          role_id: string
        }
        Update: {
          job_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_roles_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "professional_roles"
            referencedColumns: ["id"]
          }
        ]
      }
      job_skills: {
        Row: {
          job_id: string
          skill_id: string
        }
        Insert: {
          job_id: string
          skill_id: string
        }
        Update: {
          job_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      professional_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_custom: boolean | null
          name: string
          role_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_custom?: boolean | null
          name: string
          role_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_custom?: boolean | null
          name?: string
          role_type?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_custom: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_custom?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_custom?: boolean | null
          name?: string
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          archived: boolean
          conversation_id: string
          joined_at: string
          last_read_at: string
          muted: boolean
          pinned: boolean
          role: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          conversation_id: string
          joined_at?: string
          last_read_at?: string
          muted?: boolean
          pinned?: boolean
          role?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          conversation_id?: string
          joined_at?: string
          last_read_at?: string
          muted?: boolean
          pinned?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_group: boolean
          last_message_at: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_group?: boolean
          last_message_at?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_group?: boolean
          last_message_at?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
      file_uploads: {
        Row: {
          bucket_name: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          feature: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_public: boolean
          mime_type: string | null
          public_url: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          bucket_name: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          feature: string
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          is_public?: boolean
          mime_type?: string | null
          public_url?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          bucket_name?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          feature?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_public?: boolean
          mime_type?: string | null
          public_url?: string | null
          updated_at?: string
          uploaded_by?: string
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
          reviewed_at: string | null
          reviewed_by: string | null
          squad_id: string | null
          status: string
          updated_at: string
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
          reviewed_at?: string | null
          reviewed_by?: string | null
          squad_id?: string | null
          status?: string
          updated_at?: string
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
          reviewed_at?: string | null
          reviewed_by?: string | null
          squad_id?: string | null
          status?: string
          updated_at?: string
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
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          body: string | null
          conversation_id: string
          created_at: string
          deleted: boolean
          edited: boolean
          id: string
          reply_to: string | null
          sender_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          conversation_id: string
          created_at?: string
          deleted?: boolean
          edited?: boolean
          id?: string
          reply_to?: string | null
          sender_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          conversation_id?: string
          created_at?: string
          deleted?: boolean
          edited?: boolean
          id?: string
          reply_to?: string | null
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
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          data: Json
          entity_id: string | null
          entity_type: string | null
          id: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          data?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          data?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          demo_url: string | null
          description: string | null
          github_url: string | null
          id: string
          media_type: string
          media_url: string | null
          project_link: string | null
          skills: string[]
          tags: string[]
          tech: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          demo_url?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          media_type?: string
          media_url?: string | null
          project_link?: string | null
          skills?: string[]
          tags?: string[]
          tech?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          demo_url?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          media_type?: string
          media_url?: string | null
          project_link?: string | null
          skills?: string[]
          tags?: string[]
          tech?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
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
          thumbnail_url: string | null
        }
        Insert: {
          author_id: string
          caption?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          post_type?: string
          thumbnail_url?: string | null
        }
        Update: {
          author_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          post_type?: string
          thumbnail_url?: string | null
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
          account_type: string | null
          availability: string | null
          experience_level: string | null
          experience_years: number | null
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
          account_type?: string | null
          availability?: string | null
          experience_level?: string | null
          experience_years?: number | null
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
          account_type?: string | null
          availability?: string | null
          experience_level?: string | null
          experience_years?: number | null
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
      squad_invitations: {
        Row: {
          created_at: string
          id: string
          invitee_id: string
          inviter_id: string
          squad_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_id: string
          inviter_id: string
          squad_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          squad_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_invitations_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_join_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          squad_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          squad_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          squad_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_join_requests_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
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
          conversation_id: string | null
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
          conversation_id?: string | null
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
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "squads_conversation_fk"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          media_type: string
          media_url: string
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_type: string
          media_url: string
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_type?: string
          media_url?: string
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string | null
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string | null
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_status: {
        Row: {
          conversation_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_status_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
      skill_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          id: string
          name: string
          category_id: string | null
          category: string | null
          role_id: string | null
          description: string | null
          is_custom: boolean | null
          is_active: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category_id?: string | null
          category?: string | null
          role_id?: string | null
          description?: string | null
          is_custom?: boolean | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category_id?: string | null
          category?: string | null
          role_id?: string | null
          description?: string | null
          is_custom?: boolean | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "professional_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      skill_subskills: {
        Row: {
          id: string
          skill_id: string | null
          name: string
          category: string | null
          is_custom: boolean | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          skill_id?: string | null
          name: string
          category?: string | null
          is_custom?: boolean | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          skill_id?: string | null
          name?: string
          category?: string | null
          is_custom?: boolean | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_subskills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      skill_specialties: {
        Row: {
          id: string
          skill_id: string | null
          name: string
          software: string | null
          is_custom: boolean | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          skill_id?: string | null
          name: string
          software?: string | null
          is_custom?: boolean | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          skill_id?: string | null
          name?: string
          software?: string | null
          is_custom?: boolean | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_specialties_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      creator_learning_skills: {
        Row: {
          id: string
          user_id: string | null
          skill_id: string | null
          desired_level: string | null
          requirements: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          skill_id?: string | null
          desired_level?: string | null
          requirements?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          skill_id?: string | null
          desired_level?: string | null
          requirements?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_learning_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_learning_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      skill_swap_listings: {
        Row: {
          id: string
          user_id: string
          title: string | null
          role: string | null
          role_id: string | null
          description: string | null
          learning_mode: string | null
          availability: string | null
          is_active: boolean | null
          verification_status: string | null
          overall_score: number | null
          theory_score: number | null
          technical_score: number | null
          scenario_score: number | null
          practical_score: number | null
          software_score: number | null
          troubleshooting_score: number | null
          decision_making_score: number | null
          communication_score: number | null
          stage2_score: number | null
          stage3_score: number | null
          knowledge_score: number | null
          problem_solving_score: number | null
          technical_knowledge_score: number | null
          skill_level: string | null
          declared_level: string | null
          demonstrated_level: string | null
          verification_confidence: string | null
          strengths_summary: string | null
          weaknesses_summary: string | null
          recommendations_summary: string | null
          ai_feedback: string | null
          experience_duration: string | null
          ai_verified_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          role?: string | null
          role_id?: string | null
          description?: string | null
          learning_mode?: string | null
          availability?: string | null
          is_active?: boolean | null
          verification_status?: string | null
          overall_score?: number | null
          theory_score?: number | null
          technical_score?: number | null
          scenario_score?: number | null
          practical_score?: number | null
          software_score?: number | null
          troubleshooting_score?: number | null
          decision_making_score?: number | null
          communication_score?: number | null
          stage2_score?: number | null
          stage3_score?: number | null
          knowledge_score?: number | null
          problem_solving_score?: number | null
          technical_knowledge_score?: number | null
          skill_level?: string | null
          declared_level?: string | null
          demonstrated_level?: string | null
          verification_confidence?: string | null
          strengths_summary?: string | null
          weaknesses_summary?: string | null
          recommendations_summary?: string | null
          ai_feedback?: string | null
          experience_duration?: string | null
          ai_verified_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          role?: string | null
          role_id?: string | null
          description?: string | null
          learning_mode?: string | null
          availability?: string | null
          is_active?: boolean | null
          verification_status?: string | null
          overall_score?: number | null
          theory_score?: number | null
          technical_score?: number | null
          scenario_score?: number | null
          practical_score?: number | null
          software_score?: number | null
          troubleshooting_score?: number | null
          decision_making_score?: number | null
          communication_score?: number | null
          stage2_score?: number | null
          stage3_score?: number | null
          knowledge_score?: number | null
          problem_solving_score?: number | null
          technical_knowledge_score?: number | null
          skill_level?: string | null
          declared_level?: string | null
          demonstrated_level?: string | null
          verification_confidence?: string | null
          strengths_summary?: string | null
          weaknesses_summary?: string | null
          recommendations_summary?: string | null
          ai_feedback?: string | null
          experience_duration?: string | null
          ai_verified_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_swap_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      skill_swap_listing_teach_skills: {
        Row: {
          id: string
          listing_id: string
          skill_id: string
          skill_name: string | null
          skill_level: string | null
          sub_skills: string[] | null
          software: string[] | null
          specialties: string[] | null
          verification_status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          listing_id: string
          skill_id: string
          skill_name?: string | null
          skill_level?: string | null
          sub_skills?: string[] | null
          software?: string[] | null
          specialties?: string[] | null
          verification_status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          listing_id?: string
          skill_id?: string
          skill_name?: string | null
          skill_level?: string | null
          sub_skills?: string[] | null
          software?: string[] | null
          specialties?: string[] | null
          verification_status?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_swap_listing_teach_skills_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "skill_swap_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_swap_listing_teach_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      skill_swap_listing_learn_skills: {
        Row: {
          id: string
          listing_id: string
          skill_id: string
          skill_name: string | null
          desired_level: string | null
          requirement: string | null
          requirements: string | null
          sub_skills: string[] | null
          desired_software: string[] | null
          created_at: string | null
        }
        Insert: {
          id?: string
          listing_id: string
          skill_id: string
          skill_name?: string | null
          desired_level?: string | null
          requirement?: string | null
          requirements?: string | null
          sub_skills?: string[] | null
          desired_software?: string[] | null
          created_at?: string | null
        }
        Update: {
          id?: string
          listing_id?: string
          skill_id?: string
          skill_name?: string | null
          desired_level?: string | null
          requirement?: string | null
          requirements?: string | null
          sub_skills?: string[] | null
          desired_software?: string[] | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_swap_listing_learn_skills_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "skill_swap_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_swap_listing_learn_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      skill_swap_specialties: {
        Row: {
          id: string
          listing_id: string
          skill_id: string
          specialty_name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          listing_id: string
          skill_id: string
          specialty_name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          listing_id?: string
          skill_id?: string
          specialty_name?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_swap_specialties_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "skill_swap_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_swap_specialties_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      assessment_question_bank: {
        Row: {
          id: string
          role_name: string
          skill_name: string
          sub_skill: string | null
          specialty: string | null
          software: string | null
          question_type: string
          difficulty: string
          competency: string
          question_text: string
          options: Json | null
          correct_answer: string | null
          acceptable_answers: string[] | null
          expected_concepts: string[]
          evaluation_criteria: string | null
          rubric: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          role_name: string
          skill_name: string
          sub_skill?: string | null
          specialty?: string | null
          software?: string | null
          question_type: string
          difficulty: string
          competency: string
          question_text: string
          options?: Json | null
          correct_answer?: string | null
          acceptable_answers?: string[] | null
          expected_concepts?: string[]
          evaluation_criteria?: string | null
          rubric?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          role_name?: string
          skill_name?: string
          sub_skill?: string | null
          specialty?: string | null
          software?: string | null
          question_type?: string
          difficulty?: string
          competency?: string
          question_text?: string
          options?: Json | null
          correct_answer?: string | null
          acceptable_answers?: string[] | null
          expected_concepts?: string[]
          evaluation_criteria?: string | null
          rubric?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      skill_swap_question_bank: {
        Row: {
          id: string
          role_name: string | null
          skill_name: string | null
          skill_id: string | null
          subskill_id: string | null
          specialty_id: string | null
          sub_skill: string | null
          specialty: string | null
          software: string | null
          question_type: string
          difficulty: string
          competency: string
          question_text: string
          options: Json | null
          correct_answer: string | null
          acceptable_answers: string[] | null
          expected_concepts: string[]
          evaluation_criteria: string | null
          rubric: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          role_name?: string | null
          skill_name?: string | null
          skill_id?: string | null
          subskill_id?: string | null
          specialty_id?: string | null
          sub_skill?: string | null
          specialty?: string | null
          software?: string | null
          question_type: string
          difficulty: string
          competency: string
          question_text: string
          options?: Json | null
          correct_answer?: string | null
          acceptable_answers?: string[] | null
          expected_concepts?: string[]
          evaluation_criteria?: string | null
          rubric?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          role_name?: string | null
          skill_name?: string | null
          skill_id?: string | null
          subskill_id?: string | null
          specialty_id?: string | null
          sub_skill?: string | null
          specialty?: string | null
          software?: string | null
          question_type?: string
          difficulty?: string
          competency?: string
          question_text?: string
          options?: Json | null
          correct_answer?: string | null
          acceptable_answers?: string[] | null
          expected_concepts?: string[]
          evaluation_criteria?: string | null
          rubric?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      skill_swap_assessments: {
        Row: {
          id: string
          listing_id: string | null
          user_id: string | null
          skill_id: string | null
          role_name: string | null
          skill_name: string | null
          declared_level: string | null
          demonstrated_level: string | null
          verification_confidence: string | null
          assessment_type: string | null
          assessment_stage: number | null
          status: string | null
          overall_score: number | null
          technical_score: number | null
          practical_score: number | null
          problem_solving_score: number | null
          knowledge_score: number | null
          communication_score: number | null
          scenario_score: number | null
          software_score: number | null
          troubleshooting_score: number | null
          stage2_score: number | null
          stage3_score: number | null
          strengths: string | null
          weaknesses: string | null
          recommendations: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          listing_id?: string | null
          user_id?: string | null
          skill_id?: string | null
          role_name?: string | null
          skill_name?: string | null
          declared_level?: string | null
          demonstrated_level?: string | null
          verification_confidence?: string | null
          assessment_type?: string | null
          assessment_stage?: number | null
          status?: string | null
          overall_score?: number | null
          technical_score?: number | null
          practical_score?: number | null
          problem_solving_score?: number | null
          knowledge_score?: number | null
          communication_score?: number | null
          scenario_score?: number | null
          software_score?: number | null
          troubleshooting_score?: number | null
          stage2_score?: number | null
          stage3_score?: number | null
          strengths?: string | null
          weaknesses?: string | null
          recommendations?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          listing_id?: string | null
          user_id?: string | null
          skill_id?: string | null
          role_name?: string | null
          skill_name?: string | null
          declared_level?: string | null
          demonstrated_level?: string | null
          verification_confidence?: string | null
          assessment_type?: string | null
          assessment_stage?: number | null
          status?: string | null
          overall_score?: number | null
          technical_score?: number | null
          practical_score?: number | null
          problem_solving_score?: number | null
          knowledge_score?: number | null
          communication_score?: number | null
          scenario_score?: number | null
          software_score?: number | null
          troubleshooting_score?: number | null
          stage2_score?: number | null
          stage3_score?: number | null
          strengths?: string | null
          weaknesses?: string | null
          recommendations?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_swap_assessments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "skill_swap_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_swap_assessments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_swap_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      skill_swap_assessment_questions: {
        Row: {
          id: string
          assessment_id: string | null
          question_number: number | null
          question_text: string
          question_type: string | null
          difficulty: string | null
          topic: string | null
          sub_skill: string | null
          software: string | null
          competency: string | null
          options: Json | null
          correct_answer: string | null
          expected_concepts: string[] | null
          evaluation_criteria: string | null
          assessment_stage: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          assessment_id?: string | null
          question_number?: number | null
          question_text: string
          question_type?: string | null
          difficulty?: string | null
          topic?: string | null
          sub_skill?: string | null
          software?: string | null
          competency?: string | null
          options?: Json | null
          correct_answer?: string | null
          expected_concepts?: string[] | null
          evaluation_criteria?: string | null
          assessment_stage?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          assessment_id?: string | null
          question_number?: number | null
          question_text?: string
          question_type?: string | null
          difficulty?: string | null
          topic?: string | null
          sub_skill?: string | null
          software?: string | null
          competency?: string | null
          options?: Json | null
          correct_answer?: string | null
          expected_concepts?: string[] | null
          evaluation_criteria?: string | null
          assessment_stage?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_swap_assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "skill_swap_assessments"
            referencedColumns: ["id"]
          }
        ]
      }
      skill_swap_assessment_answers: {
        Row: {
          id: string
          assessment_id: string | null
          question_id: string | null
          question_type: string | null
          answer_text: string | null
          answer_transcript: string | null
          is_correct: boolean | null
          score: number | null
          answer_quality: string | null
          competency: string | null
          feedback: string | null
          concepts_matched: string[] | null
          concepts_missed: string[] | null
          created_at: string | null
        }
        Insert: {
          id?: string
          assessment_id?: string | null
          question_id?: string | null
          question_type?: string | null
          answer_text?: string | null
          answer_transcript?: string | null
          is_correct?: boolean | null
          score?: number | null
          answer_quality?: string | null
          competency?: string | null
          feedback?: string | null
          concepts_matched?: string[] | null
          concepts_missed?: string[] | null
          created_at?: string | null
        }
        Update: {
          id?: string
          assessment_id?: string | null
          question_id?: string | null
          question_type?: string | null
          answer_text?: string | null
          answer_transcript?: string | null
          is_correct?: boolean | null
          score?: number | null
          answer_quality?: string | null
          competency?: string | null
          feedback?: string | null
          concepts_matched?: string[] | null
          concepts_missed?: string[] | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_swap_assessment_answers_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "skill_swap_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_swap_assessment_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "skill_swap_assessment_questions"
            referencedColumns: ["id"]
          }
        ]
      }
      skill_swap_assessment_results: {
        Row: {
          id: string
          assessment_id: string | null
          skill_id: string | null
          skill_name: string | null
          declared_level: string | null
          demonstrated_level: string | null
          verification_confidence: string | null
          overall_score: number | null
          stage2_score: number | null
          stage3_score: number | null
          scenario_score: number | null
          software_score: number | null
          technical_score: number | null
          practical_score: number | null
          troubleshooting_score: number | null
          strengths: string | null
          weaknesses: string | null
          recommendations: string | null
          ai_summary: string | null
          verification_status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          assessment_id?: string | null
          skill_id?: string | null
          skill_name?: string | null
          declared_level?: string | null
          demonstrated_level?: string | null
          verification_confidence?: string | null
          overall_score?: number | null
          stage2_score?: number | null
          stage3_score?: number | null
          scenario_score?: number | null
          software_score?: number | null
          technical_score?: number | null
          practical_score?: number | null
          troubleshooting_score?: number | null
          strengths?: string | null
          weaknesses?: string | null
          recommendations?: string | null
          ai_summary?: string | null
          verification_status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          assessment_id?: string | null
          skill_id?: string | null
          skill_name?: string | null
          declared_level?: string | null
          demonstrated_level?: string | null
          verification_confidence?: string | null
          overall_score?: number | null
          stage2_score?: number | null
          stage3_score?: number | null
          scenario_score?: number | null
          software_score?: number | null
          technical_score?: number | null
          practical_score?: number | null
          troubleshooting_score?: number | null
          strengths?: string | null
          weaknesses?: string | null
          recommendations?: string | null
          ai_summary?: string | null
          verification_status?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_swap_assessment_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "skill_swap_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_swap_assessment_results_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      skill_swap_requests: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          sender_listing_id: string
          receiver_listing_id: string
          message: string | null
          match_score: number | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          responded_at: string | null
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          sender_listing_id: string
          receiver_listing_id: string
          message?: string | null
          match_score?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          responded_at?: string | null
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          sender_listing_id?: string
          receiver_listing_id?: string
          message?: string | null
          match_score?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          responded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_swap_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_swap_requests_receiver_listing_id_fkey"
            columns: ["receiver_listing_id"]
            isOneToOne: false
            referencedRelation: "skill_swap_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_swap_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_swap_requests_sender_listing_id_fkey"
            columns: ["sender_listing_id"]
            isOneToOne: false
            referencedRelation: "skill_swap_listings"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_squad_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      reject_squad_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      add_client_to_squad_conversation: {
        Args: { _client_id: string; _squad_id: string }
        Returns: string
      }
      create_notification: {
        Args: {
          _actor_id: string
          _data: Json
          _entity_id: string
          _entity_type: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      decide_job_application: {
        Args: { _application_id: string; _status: string }
        Returns: {
          applicant_id: string | null
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          message: string | null
          portfolio_url: string | null
          resume_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          squad_id: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_or_create_dm: { Args: { _other: string }; Returns: string }
      get_or_create_squad_conversation: {
        Args: { _squad_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { _conv: string; _user: string }
        Returns: boolean
      }
      is_squad_owner_or_admin: {
        Args: { _squad_id: string; _user_id: string }
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
