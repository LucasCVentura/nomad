export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      annotations: {
        Row: {
          content_id: string
          created_at: string
          end_offset: number
          id: string
          note: string | null
          paragraph_id: string
          start_offset: number
          text: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          end_offset: number
          id?: string
          note?: string | null
          paragraph_id: string
          start_offset: number
          text: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          end_offset?: number
          id?: string
          note?: string | null
          paragraph_id?: string
          start_offset?: number
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "annotations_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annotations_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "store_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annotations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          body: Json
          category: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          format: string
          id: string
          pages: number | null
          price: number
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: Json
          category: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          format?: string
          id?: string
          pages?: number | null
          price?: number
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: Json
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          format?: string
          id?: string
          pages?: number | null
          price?: number
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          admin_last_read_at: string
          content_id: string
          created_at: string
          id: string
          user_id: string
          user_last_read_at: string
        }
        Insert: {
          admin_last_read_at?: string
          content_id: string
          created_at?: string
          id?: string
          user_id: string
          user_last_read_at?: string
        }
        Update: {
          admin_last_read_at?: string
          content_id?: string
          created_at?: string
          id?: string
          user_id?: string
          user_last_read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "store_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          content_id: string
          id: string
          order_id: string
          price: number
        }
        Insert: {
          content_id: string
          id?: string
          order_id: string
          price: number
        }
        Update: {
          content_id?: string
          id?: string
          order_id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "store_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          asaas_payment_id: string | null
          created_at: string
          id: string
          invoice_url: string | null
          paid_at: string | null
          status: string
          total: number
          user_id: string
        }
        Insert: {
          asaas_payment_id?: string | null
          created_at?: string
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          status?: string
          total: number
          user_id: string
        }
        Update: {
          asaas_payment_id?: string | null
          created_at?: string
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          asaas_customer_id: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          is_admin: boolean
          name: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id: string
          is_admin?: boolean
          name?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_admin?: boolean
          name?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          completed_at: string | null
          content_id: string
          id: string
          progress: number
          purchased_at: string
          rating: number | null
          review: string | null
          updated_seen_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          id?: string
          progress?: number
          purchased_at?: string
          rating?: number | null
          review?: string | null
          updated_seen_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          id?: string
          progress?: number
          purchased_at?: string
          rating?: number | null
          review?: string | null
          updated_seen_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "store_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      platform_stats: {
        Row: {
          avg_rating: number | null
          materials_count: number | null
          professionals_count: number | null
          rating_count: number | null
        }
        Relationships: []
      }
      public_reviews: {
        Row: {
          content_category: string | null
          content_title: string | null
          id: string | null
          purchased_at: string | null
          rating: number | null
          review: string | null
        }
        Relationships: []
      }
      store_contents: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          format: string | null
          id: string | null
          pages: number | null
          price: number | null
          slug: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          format?: string | null
          id?: string | null
          pages?: number | null
          price?: number | null
          slug?: string | null
          title?: string | null
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          format?: string | null
          id?: string | null
          pages?: number | null
          price?: number | null
          slug?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_inbox_rows: {
        Args: never
        Returns: {
          id: string
          student_name: string
          content_title: string
          category: string
          last_message_body: string | null
          last_message_at: string | null
          unread: number
        }[]
      }
      admin_total_revenue: { Args: never; Returns: number }
      admin_unread_total: { Args: never; Returns: number }
      has_content_access: { Args: { cid: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      mark_conversation_read: { Args: { cid: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

