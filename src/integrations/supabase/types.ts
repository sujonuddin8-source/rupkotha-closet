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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      coupon_redemptions: {
        Row: {
          amount: number
          coupon_id: string
          created_at: string
          id: string
          order_id: string
          phone: string
          user_id: string | null
        }
        Insert: {
          amount: number
          coupon_id: string
          created_at?: string
          id?: string
          order_id: string
          phone: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          coupon_id?: string
          created_at?: string
          id?: string
          order_id?: string
          phone?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          ends_at: string | null
          id: string
          max_discount: number | null
          min_order: number
          per_customer_limit: number | null
          starts_at: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type?: string
          ends_at?: string | null
          id?: string
          max_discount?: number | null
          min_order?: number
          per_customer_limit?: number | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          ends_at?: string | null
          id?: string
          max_discount?: number | null
          min_order?: number
          per_customer_limit?: number | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color: string
          created_at: string
          id: string
          image: string
          name: string
          order_id: string
          price: number
          product_id: string | null
          quantity: number
          size: string
          variant_id: string | null
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          image?: string
          name: string
          order_id: string
          price: number
          product_id?: string | null
          quantity: number
          size: string
          variant_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          image?: string
          name?: string
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          size?: string
          variant_id?: string | null
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
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_events: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          address_detail: string | null
          area: string
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          coupon_code: string | null
          created_at: string
          customer_name: string
          delivery_fee: number
          discount: number
          district: string | null
          id: string
          note: string | null
          order_code: string
          payment_method: string
          payment_status: string
          phone: string
          refund_status: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          upazila: string | null
          updated_at: string
          user_id: string | null
          village: string | null
        }
        Insert: {
          address: string
          address_detail?: string | null
          area: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_name: string
          delivery_fee: number
          discount?: number
          district?: string | null
          id?: string
          note?: string | null
          order_code: string
          payment_method?: string
          payment_status?: string
          phone: string
          refund_status?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          upazila?: string | null
          updated_at?: string
          user_id?: string | null
          village?: string | null
        }
        Update: {
          address?: string
          address_detail?: string | null
          area?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_name?: string
          delivery_fee?: number
          discount?: number
          district?: string | null
          id?: string
          note?: string | null
          order_code?: string
          payment_method?: string
          payment_status?: string
          phone?: string
          refund_status?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          upazila?: string | null
          updated_at?: string
          user_id?: string | null
          village?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          color: string
          created_at: string
          id: string
          product_id: string
          size: string
          stock: number
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          product_id: string
          size: string
          stock?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          product_id?: string
          size?: string
          stock?: number
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
          active: boolean
          category: string
          colors: string[]
          created_at: string
          description: string
          featured: boolean
          id: string
          image: string
          images: string[]
          name: string
          old_price: number | null
          price: number
          primary_image: string | null
          rating: number
          sizes: string[]
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          colors?: string[]
          created_at?: string
          description?: string
          featured?: boolean
          id: string
          image?: string
          images?: string[]
          name: string
          old_price?: number | null
          price: number
          primary_image?: string | null
          rating?: number
          sizes?: string[]
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          colors?: string[]
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          image?: string
          images?: string[]
          name?: string
          old_price?: number | null
          price?: number
          primary_image?: string | null
          rating?: number
          sizes?: string[]
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          delivery_inside: number
          delivery_outside: number
          free_delivery_threshold: number | null
          id: boolean
          updated_at: string
        }
        Insert: {
          delivery_inside?: number
          delivery_outside?: number
          free_delivery_threshold?: number | null
          id?: boolean
          updated_at?: string
        }
        Update: {
          delivery_inside?: number
          delivery_outside?: number
          free_delivery_threshold?: number | null
          id?: boolean
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
      get_order_public: { Args: { _order_code: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      place_order: {
        Args: {
          _address: string
          _area: string
          _customer_name: string
          _items: Json
          _note: string
          _phone: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status:
        | "pending"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "processing"
        | "out_for_delivery"
        | "cancelled"
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
      order_status: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "processing",
        "out_for_delivery",
        "cancelled",
      ],
    },
  },
} as const
