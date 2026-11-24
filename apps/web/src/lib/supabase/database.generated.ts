// database.generated.ts — GÉNÉRÉ depuis le schéma de production (Supabase, lecture seule).
// Ne pas modifier à la main : régénérer (voir database.types.ts).

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
      activity_logs: {
        Row: {
          created_at: string
          description: string | null
          entity_id: string | null
          entity_label: string | null
          entity_type: string | null
          event_type: Database["public"]["Enums"]["activity_event_type"]
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string | null
          event_type: Database["public"]["Enums"]["activity_event_type"]
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string | null
          event_type?: Database["public"]["Enums"]["activity_event_type"]
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_preview: string
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_preview: string
          last_used_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_preview?: string
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage: {
        Row: {
          appels: number
          mois: string
          user_id: string
        }
        Insert: {
          appels?: number
          mois: string
          user_id: string
        }
        Update: {
          appels?: number
          mois?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      block_clicks: {
        Row: {
          block_id: string
          click_target: string | null
          clicked_at: string
          id: string
          page_id: string
          qr_source: string | null
        }
        Insert: {
          block_id: string
          click_target?: string | null
          clicked_at?: string
          id?: string
          page_id: string
          qr_source?: string | null
        }
        Update: {
          block_id?: string
          click_target?: string | null
          clicked_at?: string
          id?: string
          page_id?: string
          qr_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "block_clicks_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_clicks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_visible: boolean
          page_id: string
          position: number
          styles: Json
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          page_id: string
          position?: number
          styles?: Json
          type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          page_id?: string
          position?: number
          styles?: Json
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          ip_hash: string | null
          message: string
          name: string
          read: boolean | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          ip_hash?: string | null
          message: string
          name: string
          read?: boolean | null
          subject: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          ip_hash?: string | null
          message?: string
          name?: string
          read?: boolean | null
          subject?: string
        }
        Relationships: []
      }
      conversion_goals: {
        Row: {
          color: string
          created_at: string
          description: string | null
          enabled: boolean
          goal_type: string
          id: string
          name: string
          page_id: string | null
          period_days: number
          target_count: number | null
          target_match: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          goal_type: string
          id?: string
          name: string
          page_id?: string | null
          period_days?: number
          target_count?: number | null
          target_match?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          goal_type?: string
          id?: string
          name?: string
          page_id?: string | null
          period_days?: number
          target_count?: number | null
          target_match?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_goals_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_runs: {
        Row: {
          detail: string | null
          duree_ms: number | null
          id: number
          lance_le: string
          statut: string
          tache: string
        }
        Insert: {
          detail?: string | null
          duree_ms?: number | null
          id?: never
          lance_le?: string
          statut: string
          tache: string
        }
        Update: {
          detail?: string | null
          duree_ms?: number | null
          id?: never
          lance_le?: string
          statut?: string
          tache?: string
        }
        Relationships: []
      }
      domain_redirects: {
        Row: {
          created_at: string
          enabled: boolean
          from_domain: string
          from_path: string
          hit_count: number
          id: string
          label: string | null
          last_hit_at: string | null
          redirect_type: number
          to_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          from_domain: string
          from_path?: string
          hit_count?: number
          id?: string
          label?: string | null
          last_hit_at?: string | null
          redirect_type?: number
          to_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          from_domain?: string
          from_path?: string
          hit_count?: number
          id?: string
          label?: string | null
          last_hit_at?: string | null
          redirect_type?: number
          to_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_redirects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_routes: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          page_id: string
          priority: number
          root_domain: string
          subdomain: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          page_id: string
          priority?: number
          root_domain: string
          subdomain?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          page_id?: string
          priority?: number
          root_domain?: string
          subdomain?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_routes_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_routes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_verifications: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_primary: boolean
          page_id: string
          txt_record: string
          updated_at: string
          user_id: string
          vercel_error: string | null
          vercel_status: string | null
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_primary?: boolean
          page_id: string
          txt_record: string
          updated_at?: string
          user_id: string
          vercel_error?: string | null
          vercel_status?: string | null
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_primary?: boolean
          page_id?: string
          txt_record?: string
          updated_at?: string
          user_id?: string
          vercel_error?: string | null
          vercel_status?: string | null
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_verifications_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_previews: {
        Row: {
          a_completer: string[]
          cree_le: string
          expire_le: string
          faits_utilises: string[]
          id: string
          jeton_hache: string
          modele_source: string
          prospect_id: string
          qa_detail: Json | null
          qa_statut: string
          rendu: Json
          revendique_le: string | null
          revendique_par: string | null
        }
        Insert: {
          a_completer?: string[]
          cree_le?: string
          expire_le: string
          faits_utilises?: string[]
          id?: string
          jeton_hache: string
          modele_source: string
          prospect_id: string
          qa_detail?: Json | null
          qa_statut?: string
          rendu: Json
          revendique_le?: string | null
          revendique_par?: string | null
        }
        Update: {
          a_completer?: string[]
          cree_le?: string
          expire_le?: string
          faits_utilises?: string[]
          id?: string
          jeton_hache?: string
          modele_source?: string
          prospect_id?: string
          qa_detail?: Json | null
          qa_statut?: string
          rendu?: Json
          revendique_le?: string | null
          revendique_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_previews_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "growth_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_prospects: {
        Row: {
          cle: string
          cree_le: string
          id: string
          maj_le: string
          nom: string | null
          profil: Json
        }
        Insert: {
          cle: string
          cree_le?: string
          id?: string
          maj_le?: string
          nom?: string | null
          profil: Json
        }
        Update: {
          cle?: string
          cree_le?: string
          id?: string
          maj_le?: string
          nom?: string | null
          profil?: Json
        }
        Relationships: []
      }
      instant_qrs: {
        Row: {
          created_at: string
          dest_history: Json
          dest_url: string | null
          dynamic: boolean
          expires_at: string | null
          expiry_alert_stage: string | null
          id: string
          inputs: Json
          keep_on_downgrade: boolean
          kind: string
          label: string | null
          last_scan_at: string | null
          password_hash: string | null
          paused_reason: string | null
          payload: string
          short_code: string | null
          status: string
          style: Json
          total_scans: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dest_history?: Json
          dest_url?: string | null
          dynamic?: boolean
          expires_at?: string | null
          expiry_alert_stage?: string | null
          id?: string
          inputs?: Json
          keep_on_downgrade?: boolean
          kind: string
          label?: string | null
          last_scan_at?: string | null
          password_hash?: string | null
          paused_reason?: string | null
          payload: string
          short_code?: string | null
          status?: string
          style?: Json
          total_scans?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dest_history?: Json
          dest_url?: string | null
          dynamic?: boolean
          expires_at?: string | null
          expiry_alert_stage?: string | null
          id?: string
          inputs?: Json
          keep_on_downgrade?: boolean
          kind?: string
          label?: string | null
          last_scan_at?: string | null
          password_hash?: string | null
          paused_reason?: string | null
          payload?: string
          short_code?: string | null
          status?: string
          style?: Json
          total_scans?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instant_qrs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instant_scan_events: {
        Row: {
          country: string | null
          device: string | null
          id: number
          instant_qr_id: string
          referrer: string | null
          scanned_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          device?: string | null
          id?: never
          instant_qr_id: string
          referrer?: string | null
          scanned_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          device?: string | null
          id?: never
          instant_qr_id?: string
          referrer?: string | null
          scanned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instant_scan_events_instant_qr_id_fkey"
            columns: ["instant_qr_id"]
            isOneToOne: false
            referencedRelation: "instant_qrs"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          block_id: string | null
          created_at: string
          data: Json
          email: string | null
          id: string
          is_read: boolean
          message: string | null
          name: string | null
          page_id: string
          phone: string | null
          qr_source: string | null
          status: string
          type: string
          user_id: string | null
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          data?: Json
          email?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          name?: string | null
          page_id: string
          phone?: string | null
          qr_source?: string | null
          status?: string
          type?: string
          user_id?: string | null
        }
        Update: {
          block_id?: string | null
          created_at?: string
          data?: Json
          email?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          name?: string | null
          page_id?: string
          phone?: string | null
          qr_source?: string | null
          status?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          page_id: string
          ref: string
          value: number | null
          x: number | null
          y: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          page_id: string
          ref: string
          value?: number | null
          x?: number | null
          y?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          page_id?: string
          ref?: string
          value?: number | null
          x?: number | null
          y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "page_events_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          country: string | null
          device: Database["public"]["Enums"]["scan_device"]
          id: string
          page_id: string
          qr_source: string | null
          referrer: string | null
          session_id: string | null
          source: string | null
          time_on_page: number | null
          viewed_at: string
        }
        Insert: {
          country?: string | null
          device?: Database["public"]["Enums"]["scan_device"]
          id?: string
          page_id: string
          qr_source?: string | null
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          time_on_page?: number | null
          viewed_at?: string
        }
        Update: {
          country?: string | null
          device?: Database["public"]["Enums"]["scan_device"]
          id?: string
          page_id?: string
          qr_source?: string | null
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          time_on_page?: number | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_views_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string
          custom_domain: string | null
          expires_at: string | null
          id: string
          og_image_url: string | null
          pause_reason: string | null
          paused_at: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["page_status"]
          team_id: string | null
          template_id: string | null
          theme: Json
          title: string
          total_views: number
          unique_views: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          expires_at?: string | null
          id?: string
          og_image_url?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["page_status"]
          team_id?: string | null
          template_id?: string | null
          theme?: Json
          title?: string
          total_views?: number
          unique_views?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          expires_at?: string | null
          id?: string
          og_image_url?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["page_status"]
          team_id?: string | null
          template_id?: string | null
          theme?: Json
          title?: string
          total_views?: number
          unique_views?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_domain_limits: {
        Row: {
          max_domains: number
          plan: string
        }
        Insert: {
          max_domains: number
          plan: string
        }
        Update: {
          max_domains?: number
          plan?: string
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          api: boolean
          badge_qrowg: boolean
          equipe: boolean
          max_domains: number
          max_pages: number
          pause_apres_jours: number | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          qr_dynamique: boolean
          retention_stats_j: number
        }
        Insert: {
          api: boolean
          badge_qrowg: boolean
          equipe: boolean
          max_domains: number
          max_pages: number
          pause_apres_jours?: number | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          qr_dynamique: boolean
          retention_stats_j: number
        }
        Update: {
          api?: boolean
          badge_qrowg?: boolean
          equipe?: boolean
          max_domains?: number
          max_pages?: number
          pause_apres_jours?: number | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          qr_dynamique?: boolean
          retention_stats_j?: number
        }
        Relationships: []
      }
      print_brand_kit: {
        Row: {
          accent: string | null
          accent2: string | null
          logo: string | null
          typo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent?: string | null
          accent2?: string | null
          logo?: string | null
          typo?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          accent?: string | null
          accent2?: string | null
          logo?: string | null
          typo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      print_presets: {
        Row: {
          cfg: Json
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          cfg?: Json
          created_at?: string
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          cfg?: Json
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_config: Json | null
          avatar_svg: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          dyn_cancel_at_end: boolean
          dyn_current_period_end: string | null
          dyn_plan: string
          dyn_status: string | null
          dyn_stripe_subscription_id: string | null
          email: string
          free_published_since: string | null
          full_name: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          plan_before_bonus:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          preferences: Json
          pro_bonus_until: string | null
          quota_alert_month: string | null
          ref_code: string | null
          referred_by: string | null
          stripe_customer_id: string | null
          total_pages: number
          total_scans: number
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_config?: Json | null
          avatar_svg?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          dyn_cancel_at_end?: boolean
          dyn_current_period_end?: string | null
          dyn_plan?: string
          dyn_status?: string | null
          dyn_stripe_subscription_id?: string | null
          email: string
          free_published_since?: string | null
          full_name?: string | null
          id: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_before_bonus?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          preferences?: Json
          pro_bonus_until?: string | null
          quota_alert_month?: string | null
          ref_code?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          total_pages?: number
          total_scans?: number
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_config?: Json | null
          avatar_svg?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          dyn_cancel_at_end?: boolean
          dyn_current_period_end?: string | null
          dyn_plan?: string
          dyn_status?: string | null
          dyn_stripe_subscription_id?: string | null
          email?: string
          free_published_since?: string | null
          full_name?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_before_bonus?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          preferences?: Json
          pro_bonus_until?: string | null
          quota_alert_month?: string | null
          ref_code?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          total_pages?: number
          total_scans?: number
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          archived_at: string | null
          background_color: string
          corner_style: string
          created_at: string
          dest_history: Json
          dest_override: Json | null
          error_correction: string
          expires_at: string | null
          foreground_color: string
          id: string
          keep_on_downgrade: boolean
          label: string | null
          last_scan_at: string | null
          logo_url: string | null
          page_id: string
          pause_message: string | null
          paused_at: string | null
          paused_reason: string | null
          print_design: Json | null
          print_format: string | null
          short_code: string
          status: Database["public"]["Enums"]["qr_status"]
          style_config: Json | null
          total_scans: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          background_color?: string
          corner_style?: string
          created_at?: string
          dest_history?: Json
          dest_override?: Json | null
          error_correction?: string
          expires_at?: string | null
          foreground_color?: string
          id?: string
          keep_on_downgrade?: boolean
          label?: string | null
          last_scan_at?: string | null
          logo_url?: string | null
          page_id: string
          pause_message?: string | null
          paused_at?: string | null
          paused_reason?: string | null
          print_design?: Json | null
          print_format?: string | null
          short_code: string
          status?: Database["public"]["Enums"]["qr_status"]
          style_config?: Json | null
          total_scans?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          background_color?: string
          corner_style?: string
          created_at?: string
          dest_history?: Json
          dest_override?: Json | null
          error_correction?: string
          expires_at?: string | null
          foreground_color?: string
          id?: string
          keep_on_downgrade?: boolean
          label?: string | null
          last_scan_at?: string | null
          logo_url?: string | null
          page_id?: string
          pause_message?: string | null
          paused_at?: string | null
          paused_reason?: string | null
          print_design?: Json | null
          print_format?: string | null
          short_code?: string
          status?: Database["public"]["Enums"]["qr_status"]
          style_config?: Json | null
          total_scans?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          ref_code: string
          referred_id: string | null
          referrer_id: string
          reward_months: number
          status: string
          validated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ref_code: string
          referred_id?: string | null
          referrer_id: string
          reward_months?: number
          status?: string
          validated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ref_code?: string
          referred_id?: string | null
          referrer_id?: string
          reward_months?: number
          status?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_subscriptions: {
        Row: {
          created_at: string
          email: string
          enabled: boolean
          frequency: string
          id: string
          last_sent_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          enabled?: boolean
          frequency: string
          id?: string
          last_sent_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          enabled?: boolean
          frequency?: string
          id?: string
          last_sent_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          device: Database["public"]["Enums"]["scan_device"]
          id: string
          ip_hash: string | null
          os: string | null
          page_id: string
          qr_code_id: string
          referrer: string | null
          scanned_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device?: Database["public"]["Enums"]["scan_device"]
          id?: string
          ip_hash?: string | null
          os?: string | null
          page_id: string
          qr_code_id: string
          referrer?: string | null
          scanned_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device?: Database["public"]["Enums"]["scan_device"]
          id?: string
          ip_hash?: string | null
          os?: string | null
          page_id?: string
          qr_code_id?: string
          referrer?: string | null
          scanned_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scans_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          brand_color: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      policies_trop_larges: {
        Row: {
          commande: string | null
          condition_ecriture: string | null
          condition_lecture: string | null
          policy_: unknown
          roles_: string | null
          schema_: unknown
          table_: unknown
        }
        Relationships: []
      }
    }
    Functions: {
      api_consommer: {
        Args: { p_plafond: number; p_user: string }
        Returns: {
          appels: number
          autorise: boolean
        }[]
      }
      can_read_owner: { Args: { p_owner: string }; Returns: boolean }
      can_write_owner: { Args: { p_owner: string }; Returns: boolean }
      count_user_domains: { Args: { uid: string }; Returns: number }
      definir_domaine_principal: {
        Args: { p_domain: string; p_user: string }
        Returns: boolean
      }
      domaine_verifie_par: {
        Args: { p_hote: string; p_user: string }
        Returns: boolean
      }
      duree_essai_jours: { Args: never; Returns: number }
      essai_expire: { Args: { p_user: string }; Returns: boolean }
      expire_pro_bonuses: { Args: never; Returns: number }
      increment_redirect_hit: { Args: { p_id: string }; Returns: undefined }
      increment_scan_lien: { Args: { p_id: string }; Returns: undefined }
      limite_plan: { Args: { p_plan: string; p_quoi: string }; Returns: number }
      plan_a_securite_lien: { Args: { p_plan: string }; Returns: boolean }
      short_code_libre: { Args: { p_code: string }; Returns: boolean }
      team_role_rank: {
        Args: { r: Database["public"]["Enums"]["team_role"] }
        Returns: number
      }
    }
    Enums: {
      activity_event_type:
        | "page_created"
        | "page_published"
        | "page_updated"
        | "page_deleted"
        | "qr_created"
        | "qr_customized"
        | "qr_downloaded"
        | "qr_scanned"
        | "template_used"
        | "domain_added"
        | "plan_changed"
        | "referral_validated"
        | "profile_updated"
        | "avatar_updated"
        | "api_key_created"
        | "export_done"
      dest_type: "page" | "url" | "file" | "email" | "phone" | "whatsapp"
      page_status: "draft" | "published" | "archived"
      qr_status: "active" | "draft" | "paused" | "archived" | "expired"
      scan_device: "mobile" | "tablet" | "desktop" | "unknown"
      subscription_plan: "free" | "starter" | "pro" | "business"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "paused"
        | "incomplete"
        | "incomplete_expired"
        | "unpaid"
      team_role: "owner" | "editor" | "viewer" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      activity_event_type: [
        "page_created",
        "page_published",
        "page_updated",
        "page_deleted",
        "qr_created",
        "qr_customized",
        "qr_downloaded",
        "qr_scanned",
        "template_used",
        "domain_added",
        "plan_changed",
        "referral_validated",
        "profile_updated",
        "avatar_updated",
        "api_key_created",
        "export_done",
      ],
      dest_type: ["page", "url", "file", "email", "phone", "whatsapp"],
      page_status: ["draft", "published", "archived"],
      qr_status: ["active", "draft", "paused", "archived", "expired"],
      scan_device: ["mobile", "tablet", "desktop", "unknown"],
      subscription_plan: ["free", "starter", "pro", "business"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "paused",
        "incomplete",
        "incomplete_expired",
        "unpaid",
      ],
      team_role: ["owner", "editor", "viewer", "admin"],
    },
  },
} as const
