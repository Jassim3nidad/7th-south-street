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
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          id: number
          ip_address: unknown
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: number
          ip_address?: unknown
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: number
          ip_address?: unknown
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          customer_id: number
          id: number
          is_default: boolean
          label: string
          postal_code: string | null
          province: string | null
          updated_at: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string
          customer_id: number
          id?: number
          is_default?: boolean
          label?: string
          postal_code?: string | null
          province?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          customer_id?: number
          id?: number
          is_default?: boolean
          label?: string
          postal_code?: string | null
          province?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string
          email_verified_at: string | null
          first_name: string
          id: number
          last_name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          email_verified_at?: string | null
          first_name: string
          id?: number
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          email_verified_at?: string | null
          first_name?: string
          id?: number
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      event_gallery: {
        Row: {
          caption: string | null
          created_at: string
          event_id: number
          id: number
          object_path: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          event_id: number
          id?: number
          object_path: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          event_id?: number
          id?: number
          object_path?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_gallery_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          email: string
          event_id: number
          id: number
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_id: number
          id?: number
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: number
          id?: number
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          event_date: string
          id: number
          is_featured: boolean
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          max_rsvp: number
          poster_object_path: string | null
          rsvp_count: number
          slug: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: number
          is_featured?: boolean
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_rsvp?: number
          poster_object_path?: string | null
          rsvp_count?: number
          slug: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: number
          is_featured?: boolean
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_rsvp?: number
          poster_object_path?: string | null
          rsvp_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          actor_user_id: string | null
          created_at: string
          id: number
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          order_id: number | null
          quantity_delta: number
          reason: string | null
          stock_after: number
          variant_id: number
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          id?: number
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          order_id?: number | null
          quantity_delta: number
          reason?: string | null
          stock_after: number
          variant_id: number
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          id?: number
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"]
          order_id?: number | null
          quantity_delta?: number
          reason?: string | null
          stock_after?: number
          variant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: number
          is_active: boolean
          name: string | null
          source: string
          consent_recorded_at: string
          unsubscribe_token: string
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: number
          is_active?: boolean
          name?: string | null
          source?: string
          consent_recorded_at?: string
          unsubscribe_token?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: number
          is_active?: boolean
          name?: string | null
          source?: string
          consent_recorded_at?: string
          unsubscribe_token?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color_snapshot: string
          created_at: string
          id: number
          line_total: number
          order_id: number
          product_id: number | null
          product_name_snapshot: string
          quantity: number
          size_snapshot: string
          sku_snapshot: string
          unit_price_snapshot: number
          variant_id: number | null
        }
        Insert: {
          color_snapshot?: string
          created_at?: string
          id?: number
          line_total: number
          order_id: number
          product_id?: number | null
          product_name_snapshot: string
          quantity: number
          size_snapshot: string
          sku_snapshot: string
          unit_price_snapshot: number
          variant_id?: number | null
        }
        Update: {
          color_snapshot?: string
          created_at?: string
          id?: number
          line_total?: number
          order_id?: number
          product_id?: number | null
          product_name_snapshot?: string
          quantity?: number
          size_snapshot?: string
          sku_snapshot?: string
          unit_price_snapshot?: number
          variant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: number | null
          customer_user_id: string | null
          delivered_at: string | null
          discount_amount: number
          guest_email: string | null
          id: number
          idempotency_key: string
          notes: string | null
          order_number: string
          payment_method: string
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipped_at: string | null
          shipping_address: string
          shipping_city: string
          shipping_country: string
          shipping_email: string
          shipping_fee: number
          shipping_name: string
          shipping_phone: string
          shipping_postal: string | null
          shipping_province: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: number | null
          customer_user_id?: string | null
          delivered_at?: string | null
          discount_amount?: number
          guest_email?: string | null
          id?: number
          idempotency_key: string
          notes?: string | null
          order_number: string
          payment_method?: string
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipped_at?: string | null
          shipping_address: string
          shipping_city: string
          shipping_country?: string
          shipping_email: string
          shipping_fee?: number
          shipping_name: string
          shipping_phone: string
          shipping_postal?: string | null
          shipping_province?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: number | null
          customer_user_id?: string | null
          delivered_at?: string | null
          discount_amount?: number
          guest_email?: string | null
          id?: number
          idempotency_key?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipped_at?: string | null
          shipping_address?: string
          shipping_city?: string
          shipping_country?: string
          shipping_email?: string
          shipping_fee?: number
          shipping_name?: string
          shipping_phone?: string
          shipping_postal?: string | null
          shipping_province?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: number
          is_primary: boolean
          object_path: string
          product_id: number
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: number
          is_primary?: boolean
          object_path: string
          product_id: number
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: number
          is_primary?: boolean
          object_path?: string
          product_id?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string
          compare_at_price: number | null
          created_at: string
          id: number
          is_active: boolean
          low_stock_threshold: number
          price: number
          product_id: number
          size: string
          sku: string
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          color?: string
          compare_at_price?: number | null
          created_at?: string
          id?: number
          is_active?: boolean
          low_stock_threshold?: number
          price: number
          product_id: number
          size?: string
          sku: string
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          color?: string
          compare_at_price?: number | null
          created_at?: string
          id?: number
          is_active?: boolean
          low_stock_threshold?: number
          price?: number
          product_id?: number
          size?: string
          sku?: string
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: number | null
          created_at: string
          description: string | null
          has_sizes: boolean
          id: number
          is_featured: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          description?: string | null
          has_sizes?: boolean
          id?: number
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          category_id?: number | null
          created_at?: string
          description?: string | null
          has_sizes?: boolean
          id?: number
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      transactional_email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          idempotency_key: string
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key: string
          recipient_email: string
          sent_at?: string | null
          status: string
          subject: string
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          added_at: string
          customer_id: number
          product_id: number
        }
        Insert: {
          added_at?: string
          customer_id: number
          product_id: number
        }
        Update: {
          added_at?: string
          customer_id?: number
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_inventory: {
        Args: {
          p_reason?: string
          p_stock_quantity: number
          p_variant_id: number
        }
        Returns: number
      }
      admin_create_product: { Args: { p_product: Json }; Returns: Json }
      admin_dashboard_stats: { Args: never; Returns: Json }
      admin_delete_product: {
        Args: { p_product_id: number }
        Returns: undefined
      }
      admin_save_product: {
        Args: { p_product: Json; p_product_id: number }
        Returns: Json
      }
      admin_update_order: {
        Args: {
          p_notes?: string
          p_order_id: number
          p_payment_reference?: string
          p_payment_status?: Database["public"]["Enums"]["payment_status"]
          p_status?: Database["public"]["Enums"]["order_status"]
        }
        Returns: undefined
      }
      create_order: {
        Args: {
          p_customer_information: Json
          p_idempotency_key: string
          p_items: Json
          p_notes: string
          p_payment_method: string
          p_shipping_information: Json
        }
        Returns: Json
      }
      is_admin: { Args: { check_user_id?: string }; Returns: boolean }
      rsvp_event: {
        Args: {
          p_email: string
          p_event_id: number
          p_name: string
          p_phone: string
        }
        Returns: Json
      }
      subscribe_newsletter: {
        Args: { p_email: string; p_name: string; p_source: string; p_request_hash: string }
        Returns: Json
      }
      unsubscribe_newsletter: {
        Args: { p_token: string }
        Returns: Json
      }
      log_transactional_email: {
        Args: { p_idempotency_key: string; p_recipient_email: string; p_template_name: string; p_subject: string }
        Returns: Json
      }
      update_transactional_email_status: {
        Args: { p_log_id: string; p_status: string; p_error_message?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "admin"
      event_status: "upcoming" | "ongoing" | "past" | "cancelled"
      inventory_movement_type:
        | "sale"
        | "restock"
        | "adjustment"
        | "cancellation"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_status: "unpaid" | "paid" | "refunded"
      product_status: "available" | "sold_out" | "archived" | "coming_soon"
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
      app_role: ["customer", "admin"],
      event_status: ["upcoming", "ongoing", "past", "cancelled"],
      inventory_movement_type: [
        "sale",
        "restock",
        "adjustment",
        "cancellation",
      ],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_status: ["unpaid", "paid", "refunded"],
      product_status: ["available", "sold_out", "archived", "coming_soon"],
    },
  },
} as const
