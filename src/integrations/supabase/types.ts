export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      book_analytics: {
        Row: {
          book_id: string
          created_at: string | null
          daily_views: number | null
          days_listed: number | null
          id: string
          last_updated: string | null
          popularity_score: number | null
          price_changes: number | null
          total_contacts: number | null
          total_likes: number | null
          total_shares: number | null
          total_views: number | null
          unique_viewers: number | null
          view_to_contact_rate: number | null
          weekly_views: number | null
          wishlist_adds: number | null
        }
        Insert: {
          book_id: string
          created_at?: string | null
          daily_views?: number | null
          days_listed?: number | null
          id?: string
          last_updated?: string | null
          popularity_score?: number | null
          price_changes?: number | null
          total_contacts?: number | null
          total_likes?: number | null
          total_shares?: number | null
          total_views?: number | null
          unique_viewers?: number | null
          view_to_contact_rate?: number | null
          weekly_views?: number | null
          wishlist_adds?: number | null
        }
        Update: {
          book_id?: string
          created_at?: string | null
          daily_views?: number | null
          days_listed?: number | null
          id?: string
          last_updated?: string | null
          popularity_score?: number | null
          price_changes?: number | null
          total_contacts?: number | null
          total_likes?: number | null
          total_shares?: number | null
          total_views?: number | null
          unique_viewers?: number | null
          view_to_contact_rate?: number | null
          weekly_views?: number | null
          wishlist_adds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_analytics_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_analytics_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "popular_books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_category_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "book_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      book_category_mappings: {
        Row: {
          book_id: string
          category_id: string
        }
        Insert: {
          book_id: string
          category_id: string
        }
        Update: {
          book_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_category_mappings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_category_mappings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "popular_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_category_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "book_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      book_interactions: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          interaction_type: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          interaction_type: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          interaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_interactions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_interactions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "popular_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      book_tag_mappings: {
        Row: {
          book_id: string
          tag_id: string
        }
        Insert: {
          book_id: string
          tag_id: string
        }
        Update: {
          book_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_tag_mappings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_tag_mappings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "popular_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_tag_mappings_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "book_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      book_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string
          condition: string
          created_at: string | null
          description: string | null
          genre: string | null
          id: string
          images: string[] | null
          isbn: string | null
          language: string | null
          latitude: number | null
          listing_paid: boolean | null
          listing_payment_id: string | null
          location_address: string | null
          longitude: number | null
          postal_code: string | null
          price_range: number
          publication_year: number | null
          publisher: string | null
          quantity: number | null
          seller_id: string | null
          status: string | null
          title: string
          transfer_type: string
          updated_at: string | null
        }
        Insert: {
          author: string
          condition: string
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          images?: string[] | null
          isbn?: string | null
          language?: string | null
          latitude?: number | null
          listing_paid?: boolean | null
          listing_payment_id?: string | null
          location_address?: string | null
          longitude?: number | null
          postal_code?: string | null
          price_range: number
          publication_year?: number | null
          publisher?: string | null
          quantity?: number | null
          seller_id?: string | null
          status?: string | null
          title: string
          transfer_type: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          condition?: string
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          images?: string[] | null
          isbn?: string | null
          language?: string | null
          latitude?: number | null
          listing_paid?: boolean | null
          listing_payment_id?: string | null
          location_address?: string | null
          longitude?: number | null
          postal_code?: string | null
          price_range?: number
          publication_year?: number | null
          publisher?: string | null
          quantity?: number | null
          seller_id?: string | null
          status?: string | null
          title?: string
          transfer_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          message: string
          message_type: string | null
          purchase_request_id: string | null
          reply_to_message_id: string | null
          sender_id: string | null
        }
        Insert: {
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          message: string
          message_type?: string | null
          purchase_request_id?: string | null
          reply_to_message_id?: string | null
          sender_id?: string | null
        }
        Update: {
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          message?: string
          message_type?: string | null
          purchase_request_id?: string | null
          reply_to_message_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "conversation_summary"
            referencedColumns: ["purchase_request_id"]
          },
          {
            foreignKeyName: "chat_messages_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          id: string
          is_typing: boolean | null
          joined_at: string | null
          last_read_at: string | null
          purchase_request_id: string
          typing_updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_typing?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          purchase_request_id: string
          typing_updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_typing?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          purchase_request_id?: string
          typing_updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "conversation_summary"
            referencedColumns: ["purchase_request_id"]
          },
          {
            foreignKeyName: "conversation_participants_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_confirmations: {
        Row: {
          buyer_confirmed_delivery: boolean | null
          buyer_confirmed_payment: boolean | null
          buyer_id: string | null
          created_at: string | null
          expected_delivery_date: string | null
          final_payout_processed: boolean | null
          id: string
          otp_code: string
          otp_sent_at: string | null
          otp_verified_at: string | null
          payment_method: string | null
          purchase_request_id: string | null
          seller_confirmed_delivery: boolean | null
          seller_confirmed_payment: boolean | null
          seller_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_confirmed_delivery?: boolean | null
          buyer_confirmed_payment?: boolean | null
          buyer_id?: string | null
          created_at?: string | null
          expected_delivery_date?: string | null
          final_payout_processed?: boolean | null
          id?: string
          otp_code: string
          otp_sent_at?: string | null
          otp_verified_at?: string | null
          payment_method?: string | null
          purchase_request_id?: string | null
          seller_confirmed_delivery?: boolean | null
          seller_confirmed_payment?: boolean | null
          seller_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_confirmed_delivery?: boolean | null
          buyer_confirmed_payment?: boolean | null
          buyer_id?: string | null
          created_at?: string | null
          expected_delivery_date?: string | null
          final_payout_processed?: boolean | null
          id?: string
          otp_code?: string
          otp_sent_at?: string | null
          otp_verified_at?: string | null
          payment_method?: string | null
          purchase_request_id?: string | null
          seller_confirmed_delivery?: boolean | null
          seller_confirmed_payment?: boolean | null
          seller_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_confirmations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_confirmations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_confirmations_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "conversation_summary"
            referencedColumns: ["purchase_request_id"]
          },
          {
            foreignKeyName: "delivery_confirmations_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_confirmations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_confirmations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          message_id: string
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          message_id: string
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          message_id?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      message_status: {
        Row: {
          id: string
          message_id: string
          status: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          status?: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          status?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_status_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          priority: string | null
          read: boolean | null
          related_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          read?: boolean | null
          related_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          read?: boolean | null
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_analytics: {
        Row: {
          active_users: number | null
          avg_transaction_value: number | null
          books_sold: number | null
          created_at: string | null
          date: string
          id: string
          new_books_listed: number | null
          new_users: number | null
          popular_categories: string[] | null
          popular_search_terms: string[] | null
          returning_users: number | null
          total_active_listings: number | null
          total_messages: number | null
          total_reviews: number | null
          total_searches: number | null
          total_transaction_value: number | null
          total_transactions: number | null
        }
        Insert: {
          active_users?: number | null
          avg_transaction_value?: number | null
          books_sold?: number | null
          created_at?: string | null
          date: string
          id?: string
          new_books_listed?: number | null
          new_users?: number | null
          popular_categories?: string[] | null
          popular_search_terms?: string[] | null
          returning_users?: number | null
          total_active_listings?: number | null
          total_messages?: number | null
          total_reviews?: number | null
          total_searches?: number | null
          total_transaction_value?: number | null
          total_transactions?: number | null
        }
        Update: {
          active_users?: number | null
          avg_transaction_value?: number | null
          books_sold?: number | null
          created_at?: string | null
          date?: string
          id?: string
          new_books_listed?: number | null
          new_users?: number | null
          popular_categories?: string[] | null
          popular_search_terms?: string[] | null
          returning_users?: number | null
          total_active_listings?: number | null
          total_messages?: number | null
          total_reviews?: number | null
          total_searches?: number | null
          total_transaction_value?: number | null
          total_transactions?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          average_rating: number | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          latitude: number | null
          location_address: string | null
          longitude: number | null
          phone: string | null
          postal_code: string | null
          registration_paid: boolean | null
          registration_payment_id: string | null
          review_count: number | null
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          phone?: string | null
          postal_code?: string | null
          registration_paid?: boolean | null
          registration_payment_id?: string | null
          review_count?: number | null
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          phone?: string | null
          postal_code?: string | null
          registration_paid?: boolean | null
          registration_payment_id?: string | null
          review_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_requests: {
        Row: {
          book_id: string | null
          buyer_id: string | null
          created_at: string | null
          expected_delivery_date: string | null
          id: string
          message: string | null
          offered_price: number
          seller_id: string | null
          status: string | null
          transfer_mode: string
          updated_at: string | null
        }
        Insert: {
          book_id?: string | null
          buyer_id?: string | null
          created_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          message?: string | null
          offered_price: number
          seller_id?: string | null
          status?: string | null
          transfer_mode: string
          updated_at?: string | null
        }
        Update: {
          book_id?: string | null
          buyer_id?: string | null
          created_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          message?: string | null
          offered_price?: number
          seller_id?: string | null
          status?: string | null
          transfer_mode?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "popular_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          book_id: string | null
          created_at: string | null
          id: string
          purchase_request_id: string | null
          rating: number
          review_text: string | null
          review_type: string
          reviewed_user_id: string | null
          reviewer_id: string | null
          updated_at: string | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          purchase_request_id?: string | null
          rating: number
          review_text?: string | null
          review_type: string
          reviewed_user_id?: string | null
          reviewer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          purchase_request_id?: string | null
          rating?: number
          review_text?: string | null
          review_type?: string
          reviewed_user_id?: string | null
          reviewer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "popular_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "conversation_summary"
            referencedColumns: ["purchase_request_id"]
          },
          {
            foreignKeyName: "reviews_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_user_id_fkey"
            columns: ["reviewed_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_user_id_fkey"
            columns: ["reviewed_user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          categories: string[] | null
          condition: string[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_notified_at: string | null
          max_distance_km: number | null
          max_price: number | null
          min_price: number | null
          name: string
          notify_daily_digest: boolean | null
          notify_immediately: boolean | null
          search_query: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          categories?: string[] | null
          condition?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_notified_at?: string | null
          max_distance_km?: number | null
          max_price?: number | null
          min_price?: number | null
          name: string
          notify_daily_digest?: boolean | null
          notify_immediately?: boolean | null
          search_query?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          categories?: string[] | null
          condition?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_notified_at?: string | null
          max_distance_km?: number | null
          max_price?: number | null
          min_price?: number | null
          name?: string
          notify_daily_digest?: boolean | null
          notify_immediately?: boolean | null
          search_query?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      search_analytics: {
        Row: {
          clicked_results: number | null
          created_at: string | null
          id: string
          results_count: number | null
          search_filters: Json | null
          search_location_city: string | null
          search_location_state: string | null
          search_query: string | null
          time_spent_on_results: unknown | null
          user_id: string | null
        }
        Insert: {
          clicked_results?: number | null
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_filters?: Json | null
          search_location_city?: string | null
          search_location_state?: string | null
          search_query?: string | null
          time_spent_on_results?: unknown | null
          user_id?: string | null
        }
        Update: {
          clicked_results?: number | null
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_filters?: Json | null
          search_location_city?: string | null
          search_location_state?: string | null
          search_query?: string | null
          time_spent_on_results?: unknown | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          avg_session_duration: unknown | null
          books_bought: number | null
          books_listed: number | null
          books_sold: number | null
          buyer_rating: number | null
          created_at: string | null
          id: string
          last_login_at: string | null
          last_updated: string | null
          messages_sent: number | null
          response_rate: number | null
          reviews_given: number | null
          searches_performed: number | null
          seller_rating: number | null
          session_count: number | null
          total_logins: number | null
          total_revenue: number | null
          total_spent: number | null
          user_id: string
          wishlists_created: number | null
        }
        Insert: {
          avg_session_duration?: unknown | null
          books_bought?: number | null
          books_listed?: number | null
          books_sold?: number | null
          buyer_rating?: number | null
          created_at?: string | null
          id?: string
          last_login_at?: string | null
          last_updated?: string | null
          messages_sent?: number | null
          response_rate?: number | null
          reviews_given?: number | null
          searches_performed?: number | null
          seller_rating?: number | null
          session_count?: number | null
          total_logins?: number | null
          total_revenue?: number | null
          total_spent?: number | null
          user_id: string
          wishlists_created?: number | null
        }
        Update: {
          avg_session_duration?: unknown | null
          books_bought?: number | null
          books_listed?: number | null
          books_sold?: number | null
          buyer_rating?: number | null
          created_at?: string | null
          id?: string
          last_login_at?: string | null
          last_updated?: string | null
          messages_sent?: number | null
          response_rate?: number | null
          reviews_given?: number | null
          searches_performed?: number | null
          seller_rating?: number | null
          session_count?: number | null
          total_logins?: number | null
          total_revenue?: number | null
          total_spent?: number | null
          user_id?: string
          wishlists_created?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          book_match_alerts: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          max_distance_km: number | null
          new_books_nearby: boolean | null
          preferred_genres: string[] | null
          preferred_languages: string[] | null
          price_drop_alerts: boolean | null
          price_range_max: number | null
          price_range_min: number | null
          push_notifications: boolean | null
          show_location: boolean | null
          show_rating: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_match_alerts?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          max_distance_km?: number | null
          new_books_nearby?: boolean | null
          preferred_genres?: string[] | null
          preferred_languages?: string[] | null
          price_drop_alerts?: boolean | null
          price_range_max?: number | null
          price_range_min?: number | null
          push_notifications?: boolean | null
          show_location?: boolean | null
          show_rating?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_match_alerts?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          max_distance_km?: number | null
          new_books_nearby?: boolean | null
          preferred_genres?: string[] | null
          preferred_languages?: string[] | null
          price_drop_alerts?: boolean | null
          price_range_max?: number | null
          price_range_min?: number | null
          push_notifications?: boolean | null
          show_location?: boolean | null
          show_rating?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          author: string | null
          book_id: string | null
          created_at: string | null
          id: string
          isbn: string | null
          max_price: number | null
          notes: string | null
          preferred_condition: string | null
          priority: number | null
          title: string | null
          wishlist_id: string
        }
        Insert: {
          author?: string | null
          book_id?: string | null
          created_at?: string | null
          id?: string
          isbn?: string | null
          max_price?: number | null
          notes?: string | null
          preferred_condition?: string | null
          priority?: number | null
          title?: string | null
          wishlist_id: string
        }
        Update: {
          author?: string | null
          book_id?: string | null
          created_at?: string | null
          id?: string
          isbn?: string | null
          max_price?: number | null
          notes?: string | null
          preferred_condition?: string | null
          priority?: number | null
          title?: string | null
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "popular_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      conversation_summary: {
        Row: {
          book_title: string | null
          buyer_id: string | null
          buyer_name: string | null
          buyer_unread_count: number | null
          last_message: string | null
          last_message_at: string | null
          last_sender_id: string | null
          purchase_request_id: string | null
          seller_id: string | null
          seller_name: string | null
          seller_unread_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["last_sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["last_sender_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      popular_books: {
        Row: {
          author: string | null
          id: string | null
          popularity_rank: number | null
          popularity_score: number | null
          price_range: number | null
          title: string | null
          total_contacts: number | null
          total_likes: number | null
          total_views: number | null
        }
        Relationships: []
      }
      user_engagement_summary: {
        Row: {
          books_bought: number | null
          books_listed: number | null
          books_sold: number | null
          buyer_rating: number | null
          email: string | null
          full_name: string | null
          id: string | null
          sell_through_rate: number | null
          seller_rating: number | null
          total_logins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      mark_messages_as_read: {
        Args: { p_purchase_request_id: string; p_user_id: string }
        Returns: undefined
      }
      update_book_analytics: {
        Args: { book_uuid: string; interaction_type: string }
        Returns: undefined
      }
      update_typing_status: {
        Args: {
          p_purchase_request_id: string
          p_user_id: string
          p_is_typing: boolean
        }
        Returns: undefined
      }
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
