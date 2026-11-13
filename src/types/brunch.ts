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
  links?: string[]; // multiple store/external links
  plats: PlatformKey[];
  tags: string[];
  desc: string;
  maker: string;
  bio?: string;
  social?: string;
  cid?: string; // linked community ID
  glyph: string;
  hue: number;
  icon?: string;
  shots?: string[];
  uid?: string;
  ts: number;
  base?: number;
  tried?: number;
  viewCount?: number;
  saveCount?: number;
  followerCount?: number;
  support?: SupportLink[];
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
  rules?: string[];
  pin?: string;
  banned?: Record<string, number>;
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

export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  ts: number;
  uid: string;
  sample?: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'vote' | 'try' | 'post' | 'comment' | 'follow';
  text: string;
  ts: number;
  read: boolean;
  targetId?: string;
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
  socials?: string[];
  pic?: string;
  ban?: string;
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

export type MainTab = 'home' | 'explore' | 'community' | 'games' | 'apps' | 'tools';
export type HomeSubTab = 'foryou' | 'charts' | 'creators';
export type TypeSubTab = 'foryou' | 'charts';
export type CommunitySubTab = 'feed' | 'explore' | 'messages';
export type ChartKind = 'hot' | 'new' | 'top' | 'tried';
export type CreatorRankKind = 'score' | 'votes' | 'fol' | 'hot';
export type MetricType = 'views' | 'clicks' | 'votes' | 'saves';

export type StoreKey =
  | 'github'
  | 'gitlab'
  | 'play'
  | 'appstore'
  | 'testflight'
  | 'msstore'
  | 'steam'
  | 'epic'
  | 'itch'
  | 'chrome'
  | 'firefox'
  | 'fdroid'
  | 'hf'
  | 'npm'
  | 'pypi';

export interface StoreDef {
  label: string;
  cta: string;
  sec?: string;
  ic: string;
  col: string;
  plat?: PlatformKey;
}
