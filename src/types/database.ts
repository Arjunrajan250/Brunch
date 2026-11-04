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
      profiles: {
        Row: {
          id: string;
          name: string;
          handle: string;
          bio: string;
          avatar_url: string;
          website: string;
          support_links: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          handle?: string;
          bio?: string;
          avatar_url?: string;
          website?: string;
          support_links?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          handle?: string;
          bio?: string;
          avatar_url?: string;
          website?: string;
          support_links?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      launches: {
        Row: {
          id: string;
          name: string;
          tag: string;
          type: 'game' | 'app' | 'tool';
          url: string;
          repo: string;
          plats: string[];
          tags: string[];
          desc: string;
          maker_id: string | null;
          maker_name: string;
          maker_bio: string;
          maker_social: string;
          glyph: string;
          hue: number;
          icon_url: string;
          screenshots: string[];
          sample: boolean;
          views_count: number;
          tries_count: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          tag?: string;
          type: 'game' | 'app' | 'tool';
          url: string;
          repo?: string;
          plats?: string[];
          tags?: string[];
          desc?: string;
          maker_id?: string | null;
          maker_name: string;
          maker_bio?: string;
          maker_social?: string;
          glyph?: string;
          hue?: number;
          icon_url?: string;
          screenshots?: string[];
          sample?: boolean;
          views_count?: number;
          tries_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          tag?: string;
          type?: 'game' | 'app' | 'tool';
          url?: string;
          repo?: string;
          plats?: string[];
          tags?: string[];
          desc?: string;
          maker_id?: string | null;
          maker_name?: string;
          maker_bio?: string;
          maker_social?: string;
          glyph?: string;
          hue?: number;
          icon_url?: string;
          screenshots?: string[];
          sample?: boolean;
          views_count?: number;
          tries_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      communities: {
        Row: {
          id: string;
          slug: string;
          title: string;
          about: string;
          glyph: string;
          hue: number;
          creator_id: string | null;
          sample: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          title: string;
          about?: string;
          glyph?: string;
          hue?: number;
          creator_id?: string | null;
          sample?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          about?: string;
          glyph?: string;
          hue?: number;
          creator_id?: string | null;
          sample?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          community_id: string;
          title: string;
          body: string;
          link: string;
          author_id: string | null;
          author_name: string;
          sample: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          community_id: string;
          title: string;
          body?: string;
          link?: string;
          author_id?: string | null;
          author_name: string;
          sample?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          title?: string;
          body?: string;
          link?: string;
          author_id?: string | null;
          author_name?: string;
          sample?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          target_id: string;
          target_type: 'launch' | 'post';
          author_id: string | null;
          author_name: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id: string;
          target_id: string;
          target_type: 'launch' | 'post';
          author_id?: string | null;
          author_name: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          target_id?: string;
          target_type?: 'launch' | 'post';
          author_id?: string | null;
          author_name?: string;
          text?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          id: number;
          user_id: string;
          launch_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          launch_id: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          launch_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      saves: {
        Row: {
          id: number;
          user_id: string;
          launch_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          launch_id: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          launch_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      post_votes: {
        Row: {
          id: number;
          user_id: string;
          post_id: string;
          direction: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          post_id: string;
          direction: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          post_id?: string;
          direction?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      community_members: {
        Row: {
          id: number;
          user_id: string;
          community_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          community_id: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          community_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          id: number;
          user_id: string;
          target_maker: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          target_maker: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          target_maker?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_launch_metric: {
        Args: {
          launch_id: string;
          metric_type: string;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
