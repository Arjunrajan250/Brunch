export type LaunchType = 'game' | 'app' | 'tool';
export type PlatformKey = 'w' | 'a' | 'i' | 'd' | 'o';

export interface SupportLink {
  t: string; // 'cash' | 'ai' | 'upi' | 'other', etc.
  l: string; // label
  u: string; // url or upi id
}

export interface Launch {
  id: string;
  name: string;
  tag: string;
  type: LaunchType;
  url: string;
  repo?: string;
  plats: PlatformKey[];
  tags: string[];
  desc: string;
  maker: string;
  bio?: string;
  social?: string;
  glyph: string;
  hue: number;
  icon?: string;
  shots?: string[];
  uid?: string;
  ts: number;
  base?: number;
  tried?: number;
  sample?: boolean;
}

export interface Community {
  id: string;
  slug: string;
  title: string;
  about: string;
  glyph: string;
  hue: number;
  uid: string;
  ts: number;
  sample?: boolean;
  base?: number;
}

export interface Post {
  id: string;
  cid: string;
  title: string;
  body: string;
  link?: string;
  author: string;
  uid: string;
  ts: number;
  sample?: boolean;
  base?: number;
  cbase?: number;
}

export interface CommentItem {
  id: string;
  name: string;
  text: string;
  ts: number;
  uid?: string;
}

export interface EngagementState {
  votes: Record<string, number>;
  clicks: Record<string, number>;
  views: Record<string, number>;
  saves: Record<string, number>;
  follows: Record<string, number>;
  sclicks: Record<string, number>;
}

export interface ForumEngagementState {
  joined: Record<string, number>;
  pv: Record<string, number>; // +1 or -1
  pc: Record<string, number>; // comment counts
}

export interface Maker {
  key: string;
  name: string;
  bio: string;
  social: string;
  support: SupportLink[];
  sample: boolean;
  uid?: string;
  list: Launch[];
  votes: number;
  tries: number;
  hot: number;
  fol: number;
  score: number;
}

export type MainTab = 'home' | 'games' | 'apps' | 'tools' | 'community';
export type HomeSubTab = 'foryou' | 'charts' | 'creators' | 'cats';
export type TypeSubTab = 'foryou' | 'charts' | 'cats';
export type CommunitySubTab = 'feed' | 'explore';
export type ChartKind = 'hot' | 'new' | 'top' | 'tried';
export type CreatorRankKind = 'score' | 'votes' | 'fol' | 'hot';
export type MetricType = 'views' | 'clicks' | 'votes' | 'saves';

