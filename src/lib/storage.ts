import type { CommentItem, Community, EngagementState, ForumEngagementState, Launch, Post, SupportLink } from '@/types/brunch';

export const STORAGE_KEY = 'kiosk.board.v3';

export interface PersistedState {
  launches: Launch[];
  comms: Community[];
  posts: Post[];
  comments: Record<string, CommentItem[]>;
  mine: EngagementState;
  forum: ForumEngagementState;
  makerName: string;
  makerBio: string;
  makerLink: string;
  support: SupportLink[];
  hideSamples: boolean;
  recents: string[];
}

export const EMPTY_ENGAGEMENT: EngagementState = {
  votes: {}, clicks: {}, views: {}, saves: {}, follows: {}, sclicks: {},
};

export const EMPTY_FORUM_ENGAGEMENT: ForumEngagementState = {
  joined: {}, pv: {}, pc: {},
};

export const DEFAULT_LOCAL_STATE: PersistedState = {
  launches: [], comms: [], posts: [], comments: {},
  mine: EMPTY_ENGAGEMENT, forum: EMPTY_FORUM_ENGAGEMENT,
  makerName: 'You', makerBio: '', makerLink: '', support: [], hideSamples: false, recents: [],
};

const record = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1])));
};

const text = (value: unknown, fallback = '', max = 200): string => typeof value === 'string' ? value.slice(0, max) : fallback;
const strings = (value: unknown, max = 50): string[] => Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string').slice(0, max) : [];
const support = (value: unknown): SupportLink[] => Array.isArray(value)
  ? value.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const link = item as Partial<SupportLink>;
      if (typeof link.t !== 'string' || typeof link.u !== 'string') return [];
      return [{ t: link.t.slice(0, 30), l: text(link.l, '', 60), u: link.u.slice(0, 2048) }];
    }).slice(0, 4)
  : [];

function normalizeLaunch(value: unknown): Launch | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<Launch>;
  if (typeof item.id !== 'string' || !item.id || typeof item.name !== 'string' || typeof item.url !== 'string') return null;
  return {
    id: item.id.slice(0, 160), name: item.name.slice(0, 80), tag: text(item.tag, '', 160),
    type: item.type === 'game' || item.type === 'tool' ? item.type : 'app', url: item.url.slice(0, 2048),
    repo: text(item.repo, '', 2048), links: strings(item.links, 4), plats: Array.isArray(item.plats) ? item.plats.filter((x): x is NonNullable<typeof x> => ['w', 'a', 'i', 'd', 'o'].includes(x)) : ['w'],
    tags: strings(item.tags, 3), desc: text(item.desc, '', 2000), maker: text(item.maker, 'Maker', 80),
    bio: text(item.bio, '', 200), social: text(item.social, '', 2048), glyph: text(item.glyph, 'star', 40),
    hue: typeof item.hue === 'number' && Number.isFinite(item.hue) ? item.hue : 185, icon: text(item.icon, '', 2_000_000),
    shots: strings(item.shots, 3), uid: text(item.uid), ts: typeof item.ts === 'number' && Number.isFinite(item.ts) ? item.ts : 0,
    base: typeof item.base === 'number' ? item.base : 0, tried: typeof item.tried === 'number' ? item.tried : 0,
    viewCount: typeof item.viewCount === 'number' && Number.isFinite(item.viewCount) ? Math.max(0, item.viewCount) : undefined,
    saveCount: typeof item.saveCount === 'number' && Number.isFinite(item.saveCount) ? Math.max(0, item.saveCount) : undefined,
    followerCount: typeof item.followerCount === 'number' && Number.isFinite(item.followerCount) ? Math.max(0, item.followerCount) : undefined,
    support: support(item.support),
    sample: false,
  };
}

function normalizeCommunity(value: unknown): Community | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<Community>;
  if (typeof item.id !== 'string' || !item.id || typeof item.slug !== 'string' || !item.slug || typeof item.title !== 'string') return null;
  return {
    id: item.id.slice(0, 160), slug: item.slug.slice(0, 40), title: item.title.slice(0, 80),
    about: text(item.about, '', 500), glyph: text(item.glyph, 'bubble', 40),
    hue: typeof item.hue === 'number' && Number.isFinite(item.hue) ? item.hue : 185,
    uid: text(item.uid, 'user_local', 200), ts: typeof item.ts === 'number' && Number.isFinite(item.ts) ? item.ts : 0,
    sample: false, base: typeof item.base === 'number' && Number.isFinite(item.base) ? Math.max(0, item.base) : 0,
    rules: strings(item.rules, 20), pin: text(item.pin, '', 160),
  };
}

function normalizePost(value: unknown): Post | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<Post>;
  if (typeof item.id !== 'string' || !item.id || typeof item.cid !== 'string' || typeof item.title !== 'string') return null;
  return {
    id: item.id.slice(0, 160), cid: item.cid.slice(0, 160), title: item.title.slice(0, 160),
    body: text(item.body, '', 4000), link: text(item.link, '', 2048), author: text(item.author, 'Maker', 80),
    uid: text(item.uid, 'user_local', 200), ts: typeof item.ts === 'number' && Number.isFinite(item.ts) ? item.ts : 0,
    sample: false, base: typeof item.base === 'number' && Number.isFinite(item.base) ? item.base : 0,
    cbase: typeof item.cbase === 'number' && Number.isFinite(item.cbase) ? Math.max(0, item.cbase) : 0,
  };
}

export function readLocalState(): PersistedState {
  if (typeof window === 'undefined') return DEFAULT_LOCAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? parseLocalState(JSON.parse(raw)) : DEFAULT_LOCAL_STATE;
  } catch {
    return DEFAULT_LOCAL_STATE;
  }
}

export function parseLocalState(data: unknown): PersistedState {
    if (!data || typeof data !== 'object') return DEFAULT_LOCAL_STATE;
    const value = data as Partial<PersistedState>;
    const mine = value.mine && typeof value.mine === 'object' ? value.mine : EMPTY_ENGAGEMENT;
    const forum = value.forum && typeof value.forum === 'object' ? value.forum : EMPTY_FORUM_ENGAGEMENT;
    const comments: Record<string, CommentItem[]> = {};
    if (value.comments && typeof value.comments === 'object' && !Array.isArray(value.comments)) {
      Object.entries(value.comments).forEach(([key, list]) => {
        if (!Array.isArray(list)) return;
        comments[key.slice(0, 220)] = list.flatMap((comment) => {
          if (!comment || typeof comment !== 'object') return [];
          const c = comment as Partial<CommentItem>;
          if (typeof c.id !== 'string' || typeof c.text !== 'string') return [];
          return [{ id: c.id.slice(0, 160), name: text(c.name, 'Maker', 80), text: c.text.slice(0, 280), ts: typeof c.ts === 'number' ? c.ts : 0, uid: text(c.uid) || undefined }];
        }).slice(0, 500);
      });
    }
    return {
      launches: Array.isArray(value.launches) ? value.launches.map(normalizeLaunch).filter((x): x is Launch => x !== null).slice(0, 500) : [],
      comms: Array.isArray(value.comms) ? value.comms.map(normalizeCommunity).filter((x): x is Community => x !== null).slice(0, 200) : [],
      posts: Array.isArray(value.posts) ? value.posts.map(normalizePost).filter((x): x is Post => x !== null).slice(0, 500) : [],
      comments,
      mine: { votes: record(mine.votes), clicks: record(mine.clicks), views: record(mine.views), saves: record(mine.saves), follows: record(mine.follows), sclicks: record(mine.sclicks) },
      forum: { joined: record(forum.joined), pv: record(forum.pv), pc: record(forum.pc) },
      makerName: text(value.makerName, 'You', 40) || 'You', makerBio: text(value.makerBio, '', 100),
      makerLink: text(value.makerLink, '', 2048), support: support(value.support),
      hideSamples: value.hideSamples === true,
      recents: strings(value.recents, 6).map((x) => x.slice(0, 120)),
    };
}
