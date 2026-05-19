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
      bot_logs: {
        Row: {
          answer: string | null
          created_at: string
          fallback_email: string | null
          id: string
          question: string
          user_id: string | null
        }
        Insert: {
          answer?: string | null
          created_at?: string
          fallback_email?: string | null
          id?: string
          question: string
          user_id?: string | null
        }
        Update: {
          answer?: string | null
          created_at?: string
          fallback_email?: string | null
          id?: string
          question?: string
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          contact_email: string
          contact_phone: string | null
          created_at: string
          id: string
          landlord_reply: string | null
          message: string
          property_id: string
          replied_at: string | null
          seen_at: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          tenant_id: string | null
        }
        Insert: {
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          landlord_reply?: string | null
          message: string
          property_id: string
          replied_at?: string | null
          seen_at?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          tenant_id?: string | null
        }
        Update: {
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          landlord_reply?: string | null
          message?: string
          property_id?: string
          replied_at?: string | null
          seen_at?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          balcony: boolean
          bathrooms: number
          bedrooms: number
          city: string
          created_at: string
          description: string | null
          fenced: boolean
          id: string
          images: string[]
          is_demo: boolean
          landlord_id: string
          location: string
          monthly_rent_kes: number
          parking: boolean
          property_type: Database["public"]["Enums"]["property_type"]
          security: boolean
          status: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at: string
          water: boolean
          wifi: boolean
        }
        Insert: {
          balcony?: boolean
          bathrooms?: number
          bedrooms?: number
          city: string
          created_at?: string
          description?: string | null
          fenced?: boolean
          id?: string
          images?: string[]
          is_demo?: boolean
          landlord_id: string
          location: string
          monthly_rent_kes: number
          parking?: boolean
          property_type: Database["public"]["Enums"]["property_type"]
          security?: boolean
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at?: string
          water?: boolean
          wifi?: boolean
        }
        Update: {
          balcony?: boolean
          bathrooms?: number
          bedrooms?: number
          city?: string
          created_at?: string
          description?: string | null
          fenced?: boolean
          id?: string
          images?: string[]
          is_demo?: boolean
          landlord_id?: string
          location?: string
          monthly_rent_kes?: number
          parking?: boolean
          property_type?: Database["public"]["Enums"]["property_type"]
          security?: boolean
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          updated_at?: string
          water?: boolean
          wifi?: boolean
        }
        Relationships: []
      }
      property_views: {
        Row: {
          created_at: string
          id: string
          property_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["reminder_kind"]
          link: string | null
          related_id: string | null
          remind_at: string
          sent: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["reminder_kind"]
          link?: string | null
          related_id?: string | null
          remind_at: string
          sent?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["reminder_kind"]
          link?: string | null
          related_id?: string | null
          remind_at?: string
          sent?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      rent_payments: {
        Row: {
          amount_kes: number
          created_at: string
          id: string
          landlord_id: string
          paid_at: string | null
          period_month: string
          property_id: string
          status: Database["public"]["Enums"]["payment_status"]
          stripe_session_id: string | null
          tenant_id: string
        }
        Insert: {
          amount_kes: number
          created_at?: string
          id?: string
          landlord_id: string
          paid_at?: string | null
          period_month: string
          property_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_session_id?: string | null
          tenant_id: string
        }
        Update: {
          amount_kes?: number
          created_at?: string
          id?: string
          landlord_id?: string
          paid_at?: string | null
          period_month?: string
          property_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_session_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      wifi_payments: {
        Row: {
          amount_kes: number
          created_at: string
          id: string
          landlord_id: string
          paid_at: string | null
          period_month: string
          property_id: string
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          vendor_id: string | null
          vendor_name: string
        }
        Insert: {
          amount_kes: number
          created_at?: string
          id?: string
          landlord_id: string
          paid_at?: string | null
          period_month: string
          property_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          vendor_id?: string | null
          vendor_name: string
        }
        Update: {
          amount_kes?: number
          created_at?: string
          id?: string
          landlord_id?: string
          paid_at?: string | null
          period_month?: string
          property_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
          vendor_id?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "wifi_payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wifi_payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "wifi_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_vendors: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          landlord_id: string
          monthly_price_kes: number
          name: string
          notes: string | null
          plan_name: string | null
          property_id: string
          speed_mbps: number | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          landlord_id: string
          monthly_price_kes?: number
          name: string
          notes?: string | null
          plan_name?: string | null
          property_id: string
          speed_mbps?: number | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          landlord_id?: string
          monthly_price_kes?: number
          name?: string
          notes?: string | null
          plan_name?: string | null
          property_id?: string
          speed_mbps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wifi_vendors_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      process_reminders: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "tenant" | "landlord"
      inquiry_status: "new" | "seen" | "replied"
      notification_type:
        | "inquiry_new"
        | "inquiry_reply"
        | "payment_received"
        | "payment_confirmed"
        | "system"
        | "reminder"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      property_status: "available" | "rented" | "archived"
      property_type:
        | "single_room"
        | "bedsitter"
        | "one_br"
        | "two_br"
        | "three_br"
        | "four_br_plus"
      reminder_kind: "rent_due" | "wifi_renewal" | "inquiry_followup" | "custom"
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
      app_role: ["tenant", "landlord"],
      inquiry_status: ["new", "seen", "replied"],
      notification_type: [
        "inquiry_new",
        "inquiry_reply",
        "payment_received",
        "payment_confirmed",
        "system",
        "reminder",
      ],
      payment_status: ["pending", "paid", "failed", "refunded"],
      property_status: ["available", "rented", "archived"],
      property_type: [
        "single_room",
        "bedsitter",
        "one_br",
        "two_br",
        "three_br",
        "four_br_plus",
      ],
      reminder_kind: ["rent_due", "wifi_renewal", "inquiry_followup", "custom"],
    },
  },
} as const
