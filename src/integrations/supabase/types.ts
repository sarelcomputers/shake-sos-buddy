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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      device_registrations: {
        Row: {
          device_id: string
          device_model: string | null
          id: string
          registered_at: string | null
          user_id: string
        }
        Insert: {
          device_id: string
          device_model?: string | null
          id?: string
          registered_at?: string | null
          user_id: string
        }
        Update: {
          device_id?: string
          device_model?: string | null
          id?: string
          registered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_emails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_telegram: {
        Row: {
          chat_id: string
          created_at: string | null
          id: string
          is_group: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          id?: string
          is_group?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          id?: string
          is_group?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_telegram_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_whatsapp: {
        Row: {
          created_at: string | null
          id: string
          is_group: boolean | null
          name: string
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_group?: boolean | null
          name: string
          phone: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_group?: boolean | null
          name?: string
          phone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_whatsapp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      location_tracking: {
        Row: {
          accuracy: number | null
          altitude: number | null
          created_at: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          sos_history_id: string
          speed: number | null
          timestamp: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          sos_history_id: string
          speed?: number | null
          timestamp?: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          sos_history_id?: string
          speed?: number | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_tracking_sos_history_id_fkey"
            columns: ["sos_history_id"]
            isOneToOne: false
            referencedRelation: "sos_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_info: {
        Row: {
          age: number | null
          blood_type: string | null
          created_at: string | null
          friend_contact: string | null
          friend_name: string | null
          friend_surname: string | null
          gender: string | null
          home_address: string | null
          id: string
          id_number: string | null
          medical_aid_name: string | null
          medical_aid_number: string | null
          name: string | null
          photo_url: string | null
          spouse_contact: string | null
          spouse_name: string | null
          surname: string | null
          updated_at: string | null
          user_id: string
          vehicle_brand: string | null
          vehicle_color: string | null
          vehicle_registration: string | null
        }
        Insert: {
          age?: number | null
          blood_type?: string | null
          created_at?: string | null
          friend_contact?: string | null
          friend_name?: string | null
          friend_surname?: string | null
          gender?: string | null
          home_address?: string | null
          id?: string
          id_number?: string | null
          medical_aid_name?: string | null
          medical_aid_number?: string | null
          name?: string | null
          photo_url?: string | null
          spouse_contact?: string | null
          spouse_name?: string | null
          surname?: string | null
          updated_at?: string | null
          user_id: string
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_registration?: string | null
        }
        Update: {
          age?: number | null
          blood_type?: string | null
          created_at?: string | null
          friend_contact?: string | null
          friend_name?: string | null
          friend_surname?: string | null
          gender?: string | null
          home_address?: string | null
          id?: string
          id_number?: string | null
          medical_aid_name?: string | null
          medical_aid_number?: string | null
          name?: string | null
          photo_url?: string | null
          spouse_contact?: string | null
          spouse_name?: string | null
          surname?: string | null
          updated_at?: string | null
          user_id?: string
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_registration?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          consent_date: string | null
          consent_given: boolean | null
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          consent_date?: string | null
          consent_given?: boolean | null
          created_at?: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          consent_date?: string | null
          consent_given?: boolean | null
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sos_history: {
        Row: {
          audio_duration_seconds: number | null
          audio_transcript: string | null
          contacted_recipients: Json
          contacts_count: number
          device_model: string | null
          device_serial: string | null
          id: string
          ip_address: string | null
          latitude: number
          longitude: number
          message: string
          network_isp: string | null
          personal_info: Json | null
          triggered_at: string
          user_id: string
          wifi_info: Json | null
        }
        Insert: {
          audio_duration_seconds?: number | null
          audio_transcript?: string | null
          contacted_recipients?: Json
          contacts_count: number
          device_model?: string | null
          device_serial?: string | null
          id?: string
          ip_address?: string | null
          latitude: number
          longitude: number
          message: string
          network_isp?: string | null
          personal_info?: Json | null
          triggered_at?: string
          user_id: string
          wifi_info?: Json | null
        }
        Update: {
          audio_duration_seconds?: number | null
          audio_transcript?: string | null
          contacted_recipients?: Json
          contacts_count?: number
          device_model?: string | null
          device_serial?: string | null
          id?: string
          ip_address?: string | null
          latitude?: number
          longitude?: number
          message?: string
          network_isp?: string | null
          personal_info?: Json | null
          triggered_at?: string
          user_id?: string
          wifi_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sos_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_settings: {
        Row: {
          cooldown_period: number
          email_message: string
          enabled: boolean
          id: string
          message: string
          shake_count: number
          shake_sensitivity: string
          sms_trigger_enabled: boolean
          telegram_message: string | null
          test_email_message: string
          test_message: string
          test_telegram_message: string | null
          test_whatsapp_message: string | null
          updated_at: string
          user_id: string
          voice_alert_enabled: boolean
          voice_password: string | null
        }
        Insert: {
          cooldown_period?: number
          email_message?: string
          enabled?: boolean
          id?: string
          message?: string
          shake_count?: number
          shake_sensitivity?: string
          sms_trigger_enabled?: boolean
          telegram_message?: string | null
          test_email_message?: string
          test_message?: string
          test_telegram_message?: string | null
          test_whatsapp_message?: string | null
          updated_at?: string
          user_id: string
          voice_alert_enabled?: boolean
          voice_password?: string | null
        }
        Update: {
          cooldown_period?: number
          email_message?: string
          enabled?: boolean
          id?: string
          message?: string
          shake_count?: number
          shake_sensitivity?: string
          sms_trigger_enabled?: boolean
          telegram_message?: string | null
          test_email_message?: string
          test_message?: string
          test_telegram_message?: string | null
          test_whatsapp_message?: string | null
          updated_at?: string
          user_id?: string
          voice_alert_enabled?: boolean
          voice_password?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sos_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_cents: number
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          payfast_token: string | null
          status: string
          trial_ends_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payfast_token?: string | null
          status?: string
          trial_ends_at?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payfast_token?: string | null
          status?: string
          trial_ends_at?: string
          updated_at?: string | null
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_own_subscription: { Args: never; Returns: undefined }
      extend_trial: {
        Args: { _days: number; _user_id: string }
        Returns: undefined
      }
      get_admin_stats: { Args: never; Returns: Json }
      grant_free_access: {
        Args: { _days: number; _user_id: string }
        Returns: undefined
      }
      has_active_subscription: { Args: { user_uuid: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_subscription_status: {
        Args: { _status: string; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
