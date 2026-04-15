export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "user" | "editor" | "admin";
          saved_stops: string[];
          visited_stops: string[];
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "user" | "editor" | "admin";
          saved_stops?: string[];
          visited_stops?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "user" | "editor" | "admin";
          saved_stops?: string[];
          visited_stops?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      tour_stops: {
        Row: {
          id: string;
          city: string;
          slug: string;
          title: string;
          lat: number;
          lng: number;
          video_url: string | null;
          description: string;
          images: string[];
          sources: string[];
          published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          city: string;
          slug: string;
          title: string;
          lat: number;
          lng: number;
          video_url?: string | null;
          description: string;
          images?: string[];
          sources?: string[];
          published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          city?: string;
          slug?: string;
          title?: string;
          lat?: number;
          lng?: number;
          video_url?: string | null;
          description?: string;
          images?: string[];
          sources?: string[];
          published?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      cities: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          hero_image: string | null;
          lat: number;
          lng: number;
          zoom: number;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description: string;
          hero_image?: string | null;
          lat: number;
          lng: number;
          zoom?: number;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          hero_image?: string | null;
          lat?: number;
          lng?: number;
          zoom?: number;
        };
        Relationships: [];
      };
      podcasts: {
        Row: {
          id: string;
          title: string;
          description: string;
          embed_url: string | null;
          episode_number: number;
          publish_date: string;
          guests: string[];
          published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          embed_url?: string | null;
          episode_number: number;
          publish_date: string;
          guests?: string[];
          published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          embed_url?: string | null;
          episode_number?: number;
          publish_date?: string;
          guests?: string[];
          published?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      site_content: {
        Row: {
          key: string;
          value: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          type: "volunteer" | "contact";
          name: string;
          email: string;
          message: string | null;
          phone: string | null;
          chapter: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: "volunteer" | "contact";
          name: string;
          email: string;
          message?: string | null;
          phone?: string | null;
          chapter?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: "volunteer" | "contact";
          name?: string;
          email?: string;
          message?: string | null;
          phone?: string | null;
          chapter?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          stop_id: string;
          user_id: string;
          content: string;
          approved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          stop_id: string;
          user_id: string;
          content: string;
          approved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          stop_id?: string;
          user_id?: string;
          content?: string;
          approved?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}

export type TourStop = Database["public"]["Tables"]["tour_stops"]["Row"];
export type City = Database["public"]["Tables"]["cities"]["Row"];
export type Podcast = Database["public"]["Tables"]["podcasts"]["Row"];
export type SiteContent = Database["public"]["Tables"]["site_content"]["Row"];
export type Submission = Database["public"]["Tables"]["submissions"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type UserProfile = Database["public"]["Tables"]["users"]["Row"];

// Policy section types (defined in policy-constants.ts for now,
// will move to Database interface when Supabase schema is applied)
export type { Campaign, Guide, PolicyBrief, ApprovedComment, ReferenceLink } from "@/lib/policy-constants";
