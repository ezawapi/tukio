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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ad_analytics: {
        Row: {
          ad_id: string
          created_at: string
          event_type: string
          id: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          event_type?: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          event_type?: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_analytics_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_slots: {
        Row: {
          code: string
          created_at: string
          description: string | null
          format: string
          id: string
          is_active: boolean
          name: string
          placement: string
          recommended_height: number | null
          recommended_width: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          format?: string
          id?: string
          is_active?: boolean
          name: string
          placement: string
          recommended_height?: number | null
          recommended_width?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          format?: string
          id?: string
          is_active?: boolean
          name?: string
          placement?: string
          recommended_height?: number | null
          recommended_width?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_read: boolean
          type: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_read?: boolean
          type?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_read?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          bg_color: string | null
          bg_gradient: string | null
          body: string | null
          created_at: string
          created_by: string | null
          cta_label: string | null
          display_order: number
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          slot_id: string
          starts_at: string | null
          target_url: string | null
          text_animation: string | null
          text_color: string | null
          title: string
          updated_at: string
        }
        Insert: {
          bg_color?: string | null
          bg_gradient?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          display_order?: number
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          slot_id: string
          starts_at?: string | null
          target_url?: string | null
          text_animation?: string | null
          text_color?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          bg_color?: string | null
          bg_gradient?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          display_order?: number
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          slot_id?: string
          starts_at?: string | null
          target_url?: string | null
          text_animation?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "ad_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      banner_analytics: {
        Row: {
          banner_id: string
          created_at: string
          event_type: string
          id: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          banner_id: string
          created_at?: string
          event_type?: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          banner_id?: string
          created_at?: string
          event_type?: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banner_analytics_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "promotional_banners"
            referencedColumns: ["id"]
          },
        ]
      }
      banner_history: {
        Row: {
          banner_id: string
          changed_by: string | null
          created_at: string
          id: string
          snapshot: Json
        }
        Insert: {
          banner_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          snapshot: Json
        }
        Update: {
          banner_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "banner_history_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "promotional_banners"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invitations: {
        Row: {
          attendance_status: string
          claimed_at: string | null
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          invited_by: string
          invited_email: string | null
          invited_name: string | null
          invited_user_id: string | null
          last_sent_at: string | null
          max_uses: number | null
          qr_code_token: string
          revoked_at: string | null
          scanned_at: string | null
          scanned_by: string | null
          status: string
          updated_at: string
          uses_count: number
        }
        Insert: {
          attendance_status?: string
          claimed_at?: string | null
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          invited_by: string
          invited_email?: string | null
          invited_name?: string | null
          invited_user_id?: string | null
          last_sent_at?: string | null
          max_uses?: number | null
          qr_code_token: string
          revoked_at?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
          status?: string
          updated_at?: string
          uses_count?: number
        }
        Update: {
          attendance_status?: string
          claimed_at?: string | null
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          invited_email?: string | null
          invited_name?: string | null
          invited_user_id?: string | null
          last_sent_at?: string | null
          max_uses?: number | null
          qr_code_token?: string
          revoked_at?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
          status?: string
          updated_at?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          ad_slot_hint: string | null
          admin_notes: string | null
          attendees_count: number | null
          capacity: number | null
          category_id: string | null
          city: string
          contact_email: string | null
          created_at: string
          currency: string
          date: string
          description: string | null
          end_date: string | null
          external_ticket_url: string | null
          facebook_url: string | null
          id: string
          image_url: string | null
          image_url2: string | null
          instagram_url: string | null
          is_live: boolean | null
          is_published: boolean | null
          last_reviewed_at: string | null
          last_submitted_at: string
          latitude: number | null
          live_url: string | null
          location: string
          longitude: number | null
          organizer_id: string | null
          organizer_name: string | null
          phone1: string | null
          phone2: string | null
          price: string | null
          reservation_cta_label: string
          status: string
          ticketing_mode: string
          tiktok_url: string | null
          title: string
          twitter_url: string | null
          updated_at: string
          updated_by_admin: boolean
          venue_name: string | null
          visibility: string
          website_url: string | null
          whatsapp: string | null
        }
        Insert: {
          ad_slot_hint?: string | null
          admin_notes?: string | null
          attendees_count?: number | null
          capacity?: number | null
          category_id?: string | null
          city?: string
          contact_email?: string | null
          created_at?: string
          currency?: string
          date: string
          description?: string | null
          end_date?: string | null
          external_ticket_url?: string | null
          facebook_url?: string | null
          id?: string
          image_url?: string | null
          image_url2?: string | null
          instagram_url?: string | null
          is_live?: boolean | null
          is_published?: boolean | null
          last_reviewed_at?: string | null
          last_submitted_at?: string
          latitude?: number | null
          live_url?: string | null
          location: string
          longitude?: number | null
          organizer_id?: string | null
          organizer_name?: string | null
          phone1?: string | null
          phone2?: string | null
          price?: string | null
          reservation_cta_label?: string
          status?: string
          ticketing_mode?: string
          tiktok_url?: string | null
          title: string
          twitter_url?: string | null
          updated_at?: string
          updated_by_admin?: boolean
          venue_name?: string | null
          visibility?: string
          website_url?: string | null
          whatsapp?: string | null
        }
        Update: {
          ad_slot_hint?: string | null
          admin_notes?: string | null
          attendees_count?: number | null
          capacity?: number | null
          category_id?: string | null
          city?: string
          contact_email?: string | null
          created_at?: string
          currency?: string
          date?: string
          description?: string | null
          end_date?: string | null
          external_ticket_url?: string | null
          facebook_url?: string | null
          id?: string
          image_url?: string | null
          image_url2?: string | null
          instagram_url?: string | null
          is_live?: boolean | null
          is_published?: boolean | null
          last_reviewed_at?: string | null
          last_submitted_at?: string
          latitude?: number | null
          live_url?: string | null
          location?: string
          longitude?: number | null
          organizer_id?: string | null
          organizer_name?: string | null
          phone1?: string | null
          phone2?: string | null
          price?: string | null
          reservation_cta_label?: string
          status?: string
          ticketing_mode?: string
          tiktok_url?: string | null
          title?: string
          twitter_url?: string | null
          updated_at?: string
          updated_by_admin?: boolean
          venue_name?: string | null
          visibility?: string
          website_url?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          id: string
          organizer_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          id?: string
          organizer_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          id?: string
          organizer_id?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          logo_url: string
          name: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_url: string
          name: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_url?: string
          name?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          display_name: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          is_blocked: boolean
          linkedin_url: string | null
          organization_name: string | null
          organization_role: string | null
          phone_primary: string | null
          phone_secondary: string | null
          physical_address: string | null
          slug: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          video_url: string | null
          visibility_settings: Json
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          facebook_url?: string | null
          id: string
          instagram_url?: string | null
          is_blocked?: boolean
          linkedin_url?: string | null
          organization_name?: string | null
          organization_role?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          physical_address?: string | null
          slug?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          video_url?: string | null
          visibility_settings?: Json
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_blocked?: boolean
          linkedin_url?: string | null
          organization_name?: string | null
          organization_role?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          physical_address?: string | null
          slug?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          video_url?: string | null
          visibility_settings?: Json
          website_url?: string | null
        }
        Relationships: []
      }
      promotional_banners: {
        Row: {
          bg_color: string | null
          bg_gradient: string | null
          body: string | null
          border_color: string | null
          border_width: number | null
          button_label: string | null
          button_url: string | null
          created_at: string
          display_order: number
          height_px: number | null
          id: string
          image_url: string | null
          is_active: boolean
          is_draft: boolean
          subtitle: string | null
          subtitle_font_size: string | null
          text_animation: string | null
          text_color: string | null
          text_lines: Json | null
          title: string
          title_font_size: string | null
          updated_at: string
          width_percent: number | null
        }
        Insert: {
          bg_color?: string | null
          bg_gradient?: string | null
          body?: string | null
          border_color?: string | null
          border_width?: number | null
          button_label?: string | null
          button_url?: string | null
          created_at?: string
          display_order?: number
          height_px?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_draft?: boolean
          subtitle?: string | null
          subtitle_font_size?: string | null
          text_animation?: string | null
          text_color?: string | null
          text_lines?: Json | null
          title?: string
          title_font_size?: string | null
          updated_at?: string
          width_percent?: number | null
        }
        Update: {
          bg_color?: string | null
          bg_gradient?: string | null
          body?: string | null
          border_color?: string | null
          border_width?: number | null
          button_label?: string | null
          button_url?: string | null
          created_at?: string
          display_order?: number
          height_px?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_draft?: boolean
          subtitle?: string | null
          subtitle_font_size?: string | null
          text_animation?: string | null
          text_color?: string | null
          text_lines?: Json | null
          title?: string
          title_font_size?: string | null
          updated_at?: string
          width_percent?: number | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      site_content: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      ticket_orders: {
        Row: {
          attendance_status: string
          buyer_email: string
          buyer_name: string | null
          buyer_user_id: string | null
          created_at: string
          currency: string
          event_id: string
          id: string
          payment_provider: string
          payment_status: string
          qr_code_token: string
          quantity: number
          scanned_at: string | null
          scanned_by: string | null
          stripe_checkout_session_id: string | null
          ticket_type_id: string | null
          total_amount: number
          unit_price_amount: number
          updated_at: string
        }
        Insert: {
          attendance_status?: string
          buyer_email: string
          buyer_name?: string | null
          buyer_user_id?: string | null
          created_at?: string
          currency?: string
          event_id: string
          id?: string
          payment_provider?: string
          payment_status?: string
          qr_code_token: string
          quantity?: number
          scanned_at?: string | null
          scanned_by?: string | null
          stripe_checkout_session_id?: string | null
          ticket_type_id?: string | null
          total_amount?: number
          unit_price_amount?: number
          updated_at?: string
        }
        Update: {
          attendance_status?: string
          buyer_email?: string
          buyer_name?: string | null
          buyer_user_id?: string | null
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          payment_provider?: string
          payment_status?: string
          qr_code_token?: string
          quantity?: number
          scanned_at?: string | null
          scanned_by?: string | null
          stripe_checkout_session_id?: string | null
          ticket_type_id?: string | null
          total_amount?: number
          unit_price_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_orders_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean
          name: string
          price_amount: number
          quantity_available: number | null
          quantity_sold: number
          sales_end_at: string | null
          sales_start_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          name: string
          price_amount?: number
          quantity_available?: number | null
          quantity_sold?: number
          sales_end_at?: string | null
          sales_start_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          name?: string
          price_amount?: number
          quantity_available?: number | null
          quantity_sold?: number
          sales_end_at?: string | null
          sales_start_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_favorite: boolean
          is_read: boolean
          related_event_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          is_read?: boolean
          related_event_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          is_read?: boolean
          related_event_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          facebook_url: string | null
          id: string | null
          instagram_url: string | null
          linkedin_url: string | null
          organization_name: string | null
          organization_role: string | null
          tiktok_url: string | null
          twitter_url: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          facebook_url?: string | null
          id?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          organization_name?: string | null
          organization_role?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          facebook_url?: string | null
          id?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          organization_name?: string | null
          organization_role?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_view_event: { Args: { _event_id: string }; Returns: boolean }
      get_invitation_preview: {
        Args: { _token: string }
        Returns: {
          event_city: string
          event_date: string
          event_end_date: string
          event_id: string
          event_image_url: string
          event_location: string
          event_title: string
          expires_at: string
          invited_email: string
          invited_name: string
          is_expired: boolean
          is_revoked: boolean
          is_used_up: boolean
          organizer_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invitation_token_is_valid: { Args: { _token: string }; Returns: boolean }
      is_event_organizer: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      is_invited_to_event: {
        Args: { _email: string; _event_id: string; _user_id: string }
        Returns: boolean
      }
      mark_invitation_resent: {
        Args: { _invitation_id: string }
        Returns: {
          message: string
          success: boolean
          wait_seconds: number
        }[]
      }
      redeem_invitation: {
        Args: { _token: string }
        Returns: {
          event_id: string
          message: string
          success: boolean
        }[]
      }
      request_new_invitation: {
        Args: { _token: string }
        Returns: {
          message: string
          new_token: string
          success: boolean
        }[]
      }
      slugify: { Args: { _input: string }; Returns: string }
      validate_safe_url: {
        Args: { _field: string; _url: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
