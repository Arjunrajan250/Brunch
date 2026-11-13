'use client';

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Session, User } from '@supabase/supabase-js';
import type {
  Launch,
  Community,
  Post,
  CommentItem,
  EngagementState,
  ForumEngagementState,
  SupportLink,
  MainTab,
  HomeSubTab,
  TypeSubTab,
  CommunitySubTab,
  ChartKind,
  CreatorRankKind,
  PlatformKey,
} from '@/types/brunch';
import type { Route } from '@/types/routes';
import { SAMPLES, SAMPLE_COMMS, SAMPLE_POSTS } from '@/data/seed';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { routeFromUrl, routeToUrl } from '@/lib/navigation';
import { commentKey } from '@/lib/posts';
import {
  EMPTY_ENGAGEMENT,
  EMPTY_FORUM_ENGAGEMENT,
  parseLocalState,
  readLocalState,
  STORAGE_KEY,
  type PersistedState,
} from '@/lib/storage';
import type { Json } from '@/types/database';

export type { Route } from '@/types/routes';

export type SheetType =
  | null
  | { type: 'profile' }
  | { type: 'editprofile' }
  | { type: 'support'; key: string }
  | { type: 'report'; id: string }
  | { type: 'deleteLaunch'; id: string }
  | { type: 'deletePost'; id: string }
  | { type: 'notif' }
  | { type: 'rankinfo' };

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatar_url: string;
  website: string;
  support_links: SupportLink[];
}

type Subs = {
  home: HomeSubTab;
  games: TypeSubTab;
  apps: TypeSubTab;
  tools: TypeSubTab;
  community: CommunitySubTab;
  explore: '';
};

export type RemoteStatus = 'disabled' | 'loading' | 'ready' | 'error';

interface BrunchContextType {
  navStack: Route[];
  currentRoute: Route;
  go: (route: Route, options?: { replace?: boolean }) => void;
  back: () => void;
  setTab: (tab: MainTab) => void;
  activeTab: MainTab;
  subs: Subs;
  setSubTab: (tab: MainTab, sub: string) => void;
  allLaunches: Launch[];
  myLaunches: Launch[];
  savedLaunches: Launch[];
  allCommunities: Community[];
  allPosts: Post[];
  engagement: EngagementState;
  forumEngagement: ForumEngagementState;
  makerName: string;
  makerBio: string;
  makerLink: string;
  supportLinks: SupportLink[];
  hideSamples: boolean;
  recents: string[];
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isBackendConnected: boolean;
  dataStatus: RemoteStatus;
  dataError: string | null;
  retryRemoteData: () => void;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, pass: string, name: string, handle: string) => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: 'github' | 'google') => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  chartFilter: Record<string, ChartKind>;
  setChartFilter: (tab: string, kind: ChartKind) => void;
  platformFilter: string;
  setPlatformFilter: (plat: string) => void;
  githubOnlyFilter: boolean;
  setGithubOnlyFilter: (val: boolean | ((prev: boolean) => boolean)) => void;
  creatorRankKind: CreatorRankKind;
  setCreatorRankKind: (kind: CreatorRankKind) => void;
  forumSort: 'hot' | 'new' | 'top';
  setForumSort: (sort: 'hot' | 'new' | 'top') => void;
  forumScope: 'all' | 'joined';
  setForumScope: (scope: 'all' | 'joined') => void;
  toggleVote: (id: string) => Promise<void>;
  toggleSave: (id: string) => Promise<void>;
  recordTry: (id: string) => Promise<void>;
  recordView: (id: string) => Promise<void>;
  toggleFollow: (key: string) => Promise<void>;
  toggleJoinCommunity: (id: string) => Promise<void>;
  votePost: (id: string, dir: number) => Promise<void>;
  getComments: (id: string, kind: 'launch' | 'post') => CommentItem[];
  postComment: (id: string, kind: 'launch' | 'post', text: string) => Promise<boolean>;
  saveLaunchItem: (launch: Partial<Launch>, editId?: string) => Promise<string | null>;
  deleteLaunchItem: (id: string) => Promise<boolean>;
  createCommunityItem: (comm: { slug: string; title: string; about: string; glyph: string; hue: number }) => Promise<string | null>;
  createPostItem: (post: { cid: string; title: string; body: string; link?: string }) => Promise<string | null>;
  deletePostItem: (id: string) => Promise<boolean>;
  saveProfileSettings: (name: string, bio: string, link: string, support: SupportLink[], hideSamples: boolean) => Promise<boolean>;
  canManageLaunch: (launch: Launch) => boolean;
  canManagePost: (post: Post) => boolean;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  activeSheet: SheetType;
  openSheet: (sheet: SheetType) => void;
  closeSheet: () => void;
  toastMsg: string | null;
  toast: (msg: string) => void;
  rollRandom: () => void;
  createMenuOpen: boolean;
  openCreateMenu: () => void;
  closeCreateMenu: () => void;
  lightbox: { images: string[]; index: number } | null;
  openLightbox: (images: string[], index?: number) => void;
  closeLightbox: () => void;
  shareLaunch: Launch | null;
  openShareLaunch: (l: Launch) => void;
  closeShareLaunch: () => void;
  unreadNotifs: number;
  openNotifsSheet: () => void;
}

const BrunchContext = createContext<BrunchContextType | null>(null);
const initialSubs: Subs = { home: 'foryou', games: 'foryou', apps: 'foryou', tools: 'foryou', community: 'feed', explore: '' };
type ToastFn = (message: string) => void;

const errorMessage = (error: unknown, fallback: string): string =>
  error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
    ? error.message
    : fallback;

async function checkedWrite(request: PromiseLike<{ error: { message: string } | null }>): Promise<void> {
  const { error } = await request;
  if (error) throw new Error(error.message);
}

function readIdentity(userId: string): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}.identity.${userId}`);
    if (raw) return parseLocalState(JSON.parse(raw));
  } catch {
    // Remote data remains authoritative if this device's cache is malformed.
  }
  return {};
}

export function BrunchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const locationUrl = `${pathname}${query ? `?${query}` : ''}`;
  const cloudEnabled = isSupabaseConfigured();
  const [initialLocal] = useState(readLocalState);
  const [navStack, setNavStack] = useState<Route[]>(() => [
    routeFromUrl(typeof window === 'undefined' ? '/' : window.location.href),
  ]);

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dataStatus, setDataStatus] = useState<RemoteStatus>(cloudEnabled ? 'loading' : 'disabled');
  const [dataError, setDataError] = useState<string | null>(null);

  const [cloudLaunches, setCloudLaunches] = useState<Launch[]>([]);
  const [cloudCommunities, setCloudCommunities] = useState<Community[]>([]);
  const [cloudPosts, setCloudPosts] = useState<Post[]>([]);
  const [cloudComments, setCloudComments] = useState<Record<string, CommentItem[]>>({});
  const [localLaunches, setLocalLaunches] = useState<Launch[]>(initialLocal.launches);
  const [localCommunities, setLocalCommunities] = useState<Community[]>(initialLocal.comms);
  const [localPosts, setLocalPosts] = useState<Post[]>(initialLocal.posts);
  const [localComments, setLocalComments] = useState<Record<string, CommentItem[]>>(initialLocal.comments);
  const [engagement, setEngagement] = useState<EngagementState>(initialLocal.mine);
  const [forumEngagement, setForumEngagement] = useState<ForumEngagementState>(initialLocal.forum);
  const [makerName, setMakerName] = useState(initialLocal.makerName);
  const [makerBio, setMakerBio] = useState(initialLocal.makerBio);
  const [makerLink, setMakerLink] = useState(initialLocal.makerLink);
  const [supportLinks, setSupportLinks] = useState<SupportLink[]>(initialLocal.support);
  const [hideSamples, setHideSamples] = useState(initialLocal.hideSamples);
  const [recents, setRecents] = useState<string[]>(initialLocal.recents);

  const [chartFilter, setChartFilterState] = useState<Record<string, ChartKind>>({ home: 'hot', games: 'hot', apps: 'hot', tools: 'hot' });
  const [platformFilter, setPlatformFilter] = useState('all');
  const [githubOnlyFilter, setGithubOnlyFilter] = useState(false);
  const [creatorRankKind, setCreatorRankKind] = useState<CreatorRankKind>('score');
  const [forumSort, setForumSort] = useState<'hot' | 'new' | 'top'>('hot');
  const [forumScope, setForumScope] = useState<'all' | 'joined'>('all');
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [shareLaunch, setShareLaunch] = useState<Launch | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const identityRef = useRef<string | null>(null);
  const persistenceIdentityRef = useRef<string | null | undefined>(cloudEnabled ? undefined : null);
  const engagementRef = useRef(engagement);
  const forumEngagementRef = useRef(forumEngagement);
  const interactionRef = useRef({ tries: new Set(Object.keys(initialLocal.mine.clicks)), views: new Set(Object.keys(initialLocal.mine.views)) });
  const remoteSequence = useRef(0);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    engagementRef.current = engagement;
  }, [engagement]);

  useEffect(() => {
    forumEngagementRef.current = forumEngagement;
  }, [forumEngagement]);

  useEffect(() => () => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
  }, []);

  const toast = useCallback<ToastFn>((msg) => {
    setToastMsg(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  useEffect(() => {
    const report = () => toast('Storage is full. This change is not saved on this device; remove large images and try again.');
    window.addEventListener('brunch:persistence-error', report);
    return () => window.removeEventListener('brunch:persistence-error', report);
  }, [toast]);

  // Read once during state initialization, so persistence never writes a blank
  // startup snapshot before previously saved content has been restored. Cloud
  // accounts must finish selecting their own cache before anything is written.
  useEffect(() => {
    const identity = user?.id || null;
    if (persistenceIdentityRef.current !== identity) return;
    const state: PersistedState = {
      launches: localLaunches, comms: localCommunities, posts: localPosts,
      comments: localComments, mine: engagement, forum: forumEngagement,
      makerName, makerBio, makerLink, support: supportLinks, hideSamples, recents,
    };
    const key = identity ? `${STORAGE_KEY}.identity.${identity}` : STORAGE_KEY;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist local Brunch state', error);
      window.dispatchEvent(new CustomEvent('brunch:persistence-error'));
    }
  }, [user?.id, localLaunches, localCommunities, localPosts, localComments, engagement, forumEngagement, makerName, makerBio, makerLink, supportLinks, hideSamples, recents]);

  const requireCloudUser = useCallback((action: string): boolean => {
    if (!cloudEnabled || user) return true;
    setAuthModalOpen(true);
    toast(`Sign in to ${action} when cloud sync is enabled.`);
    return false;
  }, [cloudEnabled, toast, user]);

  const fetchRemoteData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const sequence = ++remoteSequence.current;
    setDataStatus('loading');
    setDataError(null);
    try {
      const [launches, communities, posts, comments, votes, saves, postVotes, members, follows, profiles] = await Promise.all([
        supabase.from('launches').select('*').order('created_at', { ascending: false }),
        supabase.from('communities').select('*').order('created_at', { ascending: false }),
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('comments').select('*').order('created_at', { ascending: false }),
        supabase.from('votes').select('launch_id, user_id'),
        supabase.from('saves').select('launch_id, user_id'),
        supabase.from('post_votes').select('post_id, direction, user_id'),
        supabase.from('community_members').select('community_id, user_id'),
        supabase.from('follows').select('target_maker, user_id'),
        supabase.from('profiles').select('*'),
      ]);
      const responses = [launches, communities, posts, comments, votes, saves, postVotes, members, follows, profiles];
      const failure = responses.find((response) => response.error);
      if (failure?.error) throw new Error(failure.error.message);
      if (sequence !== remoteSequence.current) return;

      const profileMap = new Map((profiles.data || []).map((row) => [row.id, row]));
      const ownId = identityRef.current;
      const voteCount = (id: string) => (votes.data || []).filter((row) => row.launch_id === id && row.user_id !== ownId).length;
      const saveCount = (id: string) => (saves.data || []).filter((row) => row.launch_id === id && row.user_id !== ownId).length;
      const followerCount = (id: string) => (follows.data || []).filter((row) => row.target_maker === id && row.user_id !== ownId).length;

      setCloudLaunches((launches.data || []).map((row): Launch => {
        const profile = row.maker_id ? profileMap.get(row.maker_id) : null;
        const links = row.links?.length ? row.links : row.repo ? [row.repo] : [];
        return {
          id: row.id, name: row.name, tag: row.tag || '', type: row.type,
          url: row.url, repo: row.repo || '', links, plats: (row.plats || ['w']) as PlatformKey[],
          tags: row.tags || [], desc: row.desc || '', maker: row.maker_name,
          bio: row.maker_bio || profile?.bio || '', social: row.maker_social || profile?.website || '',
          glyph: row.glyph || 'star', hue: row.hue ?? 185, icon: row.icon_url || '', shots: row.screenshots || [],
          uid: row.maker_id || '', ts: new Date(row.created_at).getTime(), sample: row.sample,
          base: voteCount(row.id), tried: Math.max(0, (row.tries_count || 0) - (engagementRef.current.clicks[row.id] ? 1 : 0)),
          viewCount: Math.max(0, (row.views_count || 0) - (engagementRef.current.views[row.id] ? 1 : 0)), saveCount: saveCount(row.id),
          followerCount: row.maker_id ? followerCount(row.maker_id) : 0,
          support: (profile?.support_links as unknown as SupportLink[] | undefined) || [],
        };
      }));
      setCloudCommunities((communities.data || []).map((row): Community => ({
        id: row.id, slug: row.slug, title: row.title, about: row.about || '', glyph: row.glyph || 'bubble',
        hue: row.hue ?? 185, uid: row.creator_id || '', ts: new Date(row.created_at).getTime(), sample: row.sample,
        base: (members.data || []).filter((member) => member.community_id === row.id && member.user_id !== ownId).length,
      })));
      setCloudPosts((posts.data || []).map((row): Post => ({
        id: row.id, cid: row.community_id, title: row.title, body: row.body || '', link: row.link || '',
        author: row.author_name, uid: row.author_id || '', ts: new Date(row.created_at).getTime(), sample: row.sample,
        base: (postVotes.data || []).filter((vote) => vote.post_id === row.id && vote.user_id !== ownId).reduce((sum, vote) => sum + vote.direction, 0),
        cbase: (comments.data || []).filter((comment) => comment.target_type === 'post' && comment.target_id === row.id).length,
      })));
      const grouped: Record<string, CommentItem[]> = {};
      (comments.data || []).forEach((row) => {
        const key = commentKey(row.target_type, row.target_id);
        (grouped[key] ||= []).push({ id: row.id, name: row.author_name, text: row.text, ts: new Date(row.created_at).getTime(), uid: row.author_id || undefined });
      });
      setCloudComments(grouped);
      setDataStatus('ready');
    } catch (error) {
      if (sequence !== remoteSequence.current) return;
      setDataStatus('error');
      setDataError(errorMessage(error, 'Could not load the cloud database.'));
    }
  }, []);

  const loadRemoteIdentity = useCallback(async (nextUser: User | null) => {
    const nextId = nextUser?.id || null;
    if (identityRef.current === nextId) {
      persistenceIdentityRef.current = nextId;
      return;
    }
    identityRef.current = nextId;
    persistenceIdentityRef.current = nextId;
    const cached = nextId ? readIdentity(nextId) : readLocalState();
    const cachedEngagement = cached.mine || { ...EMPTY_ENGAGEMENT, votes: {}, clicks: {}, views: {}, saves: {}, follows: {}, sclicks: {} };
    const cachedForumEngagement = cached.forum || { ...EMPTY_FORUM_ENGAGEMENT, joined: {}, pv: {}, pc: {} };
    engagementRef.current = cachedEngagement;
    forumEngagementRef.current = cachedForumEngagement;
    setEngagement(cachedEngagement);
    setForumEngagement(cachedForumEngagement);
    interactionRef.current = {
      tries: new Set(Object.keys(cached.mine?.clicks || {})),
      views: new Set(Object.keys(cached.mine?.views || {})),
    };
    setUserProfile(null);
    setMakerName(cached.makerName || 'You');
    setMakerBio(cached.makerBio || '');
    setMakerLink(cached.makerLink || '');
    setSupportLinks(cached.support || []);

    if (!nextUser) {
      await fetchRemoteData();
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const [profileResult, votesResult, savesResult, followsResult, membersResult, postVotesResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', nextUser.id).maybeSingle(),
      supabase.from('votes').select('launch_id, created_at').eq('user_id', nextUser.id),
      supabase.from('saves').select('launch_id, created_at').eq('user_id', nextUser.id),
      supabase.from('follows').select('target_maker, created_at').eq('user_id', nextUser.id),
      supabase.from('community_members').select('community_id, created_at').eq('user_id', nextUser.id),
      supabase.from('post_votes').select('post_id, direction').eq('user_id', nextUser.id),
    ]);
    if (identityRef.current !== nextUser.id) return;
    const failure = [profileResult, votesResult, savesResult, followsResult, membersResult, postVotesResult].find((result) => result.error);
    if (failure?.error) {
      toast(`Could not sync your profile: ${failure.error.message}`);
      return;
    }
    if (profileResult.data) {
      const data = profileResult.data;
      const profile: UserProfile = {
        id: data.id, name: data.name || 'Maker', handle: data.handle || '', bio: data.bio || '',
        avatar_url: data.avatar_url || '', website: data.website || '',
        support_links: (data.support_links as unknown as SupportLink[]) || [],
      };
      setUserProfile(profile);
      setMakerName(profile.name);
      setMakerBio(profile.bio);
      setMakerLink(profile.website);
      setSupportLinks(profile.support_links);
    }
    const timestamps = (rows: { created_at: string }[], id: (row: never) => string) => Object.fromEntries(rows.map((row) => [id(row as never), new Date(row.created_at).getTime()]));
    const syncedEngagement = {
      votes: timestamps(votesResult.data || [], (row: { launch_id: string }) => row.launch_id),
      clicks: cached.mine?.clicks || {},
      views: cached.mine?.views || {},
      saves: timestamps(savesResult.data || [], (row: { launch_id: string }) => row.launch_id),
      follows: timestamps(followsResult.data || [], (row: { target_maker: string }) => row.target_maker),
      sclicks: cached.mine?.sclicks || {},
    };
    const syncedForumEngagement = {
      joined: timestamps(membersResult.data || [], (row: { community_id: string }) => row.community_id),
      pv: Object.fromEntries((postVotesResult.data || []).map((row) => [row.post_id, row.direction])),
      pc: cached.forum?.pc || {},
    };
    engagementRef.current = syncedEngagement;
    forumEngagementRef.current = syncedForumEngagement;
    setEngagement(syncedEngagement);
    interactionRef.current = { tries: new Set(Object.keys(cached.mine?.clicks || {})), views: new Set(Object.keys(cached.mine?.views || {})) };
    setForumEngagement(syncedForumEngagement);
    await fetchRemoteData();
  }, [fetchRemoteData, toast]);

  useEffect(() => {
    if (!cloudEnabled) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let active = true;
    const applySession = (next: Session | null) => {
      if (!active) return;
      setSession(next);
      setUser(next?.user ?? null);
      // Run outside Supabase's auth callback to avoid holding its auth lock
      // while profile/engagement calls are made.
      void loadRemoteIdentity(next?.user ?? null);
    };
    void supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setTimeout(() => applySession(next), 0);
    });
    const initialFetch = window.setTimeout(() => void fetchRemoteData(), 0);
    const channel = supabase.channel('public_feed');
    ['launches', 'posts', 'comments', 'communities', 'votes', 'post_votes', 'community_members'].forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => void fetchRemoteData());
    });
    channel.subscribe();
    return () => {
      active = false;
      window.clearTimeout(initialFetch);
      listener.subscription.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [cloudEnabled, fetchRemoteData, loadRemoteIdentity]);

  // The provider lives in the root layout, while these hooks follow both
  // router.push/replace and browser history. Keep an optimistic stack for
  // immediate UI updates, then reconcile it with the committed URL.
  useEffect(() => {
    const task = window.setTimeout(() => {
      const next = routeFromUrl(window.location.hash.startsWith('#u/') ? window.location.href : locationUrl);
      setNavStack((previous) => {
        if (previous.length > 1 && routeToUrl(previous[previous.length - 2]) === routeToUrl(next)) return previous.slice(0, -1);
        if (routeToUrl(previous[previous.length - 1]) === routeToUrl(next)) return previous;
        return [...previous.slice(-49), next];
      });
    }, 0);
    return () => window.clearTimeout(task);
  }, [locationUrl]);

  useEffect(() => {
    if (!window.location.hash.startsWith('#u/')) return;
    const next = routeFromUrl(window.location.href);
    if (next.t === 'maker') router.replace(routeToUrl(next));
  }, [locationUrl, router]);

  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { error: 'Database is in local mode. Add Supabase keys to .env.local to enable cloud auth.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error: error?.message || null };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, pass: string, name: string, handle: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { error: 'Database is in local mode. Add Supabase keys to .env.local to enable cloud auth.' };
    const cleanHandle = handle.trim() || `maker_${Math.random().toString(36).slice(2, 8)}`;
    const { error } = await supabase.auth.signUp({ email, password: pass, options: { data: { full_name: name.trim(), user_name: cleanHandle } } });
    if (error?.message.includes('profiles_handle_key') || error?.message.includes('duplicate key')) return { error: 'That username is already taken. Try another one.' };
    return { error: error?.message || null };
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'github' | 'google') => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { error: 'Database is in local mode. Add Supabase keys to .env.local to enable OAuth.' };
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/` } });
    return { error: error?.message || null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast(`Could not sign out: ${error.message}`);
      return;
    }
    setUser(null);
    setSession(null);
    await loadRemoteIdentity(null);
    toast('Signed out');
  }, [loadRemoteIdentity, toast]);

  // Next.js owns which page is committed. Render that URL rather than an
  // optimistic destination, otherwise an edit form can remount mid-navigation.
  const currentRoute = useMemo(() => routeFromUrl(locationUrl), [locationUrl]);
  const activeTab: MainTab = currentRoute.t === 'tab' ? currentRoute.tab : 'home';
  const subs = useMemo<Subs>(() => {
    const next = { ...initialSubs };
    if (currentRoute.t === 'tab' && currentRoute.sub && currentRoute.tab !== 'explore') {
      return { ...next, [currentRoute.tab]: currentRoute.sub as never };
    }
    return next;
  }, [currentRoute]);

  const go = useCallback((route: Route, options?: { replace?: boolean }) => {
    const url = routeToUrl(route);
    setNavStack((previous) => options?.replace ? [...previous.slice(0, -1), route] : [...previous.slice(-49), route]);
    if (options?.replace) router.replace(url);
    else router.push(url);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [router]);

  const back = useCallback(() => {
    if (navStack.length > 1) {
      window.history.back();
    } else {
      const home: Route = { t: 'tab', tab: 'home' };
      setNavStack([home]);
      router.push('/');
    }
  }, [navStack.length, router]);

  const setTab = useCallback((tab: MainTab) => go({ t: 'tab', tab, sub: initialSubs[tab] }), [go]);
  const setSubTab = useCallback((tab: MainTab, sub: string) => go({ t: 'tab', tab, sub }), [go]);
  const setChartFilter = useCallback((tab: string, kind: ChartKind) => setChartFilterState((previous) => ({ ...previous, [tab]: kind })), []);

  const allLaunches = useMemo(() => {
    const list = cloudEnabled ? cloudLaunches : [...SAMPLES, ...localLaunches];
    return hideSamples ? list.filter((launch) => !launch.sample) : list;
  }, [cloudEnabled, cloudLaunches, hideSamples, localLaunches]);
  const allCommunities = useMemo(() => {
    const list = cloudEnabled ? cloudCommunities : [...SAMPLE_COMMS, ...localCommunities];
    return hideSamples ? list.filter((community) => !community.sample) : list;
  }, [cloudCommunities, cloudEnabled, hideSamples, localCommunities]);
  const allPosts = useMemo(() => {
    const list = cloudEnabled ? cloudPosts : [...SAMPLE_POSTS, ...localPosts];
    return (hideSamples ? list.filter((post) => !post.sample) : list).filter((post) => allCommunities.some((community) => community.id === post.cid));
  }, [allCommunities, cloudEnabled, cloudPosts, hideSamples, localPosts]);
  const myLaunches = useMemo(() => cloudEnabled
    ? allLaunches.filter((launch) => !launch.sample && launch.uid === user?.id)
    : localLaunches.filter((launch) => !launch.sample), [allLaunches, cloudEnabled, localLaunches, user?.id]);
  const savedLaunches = useMemo(() => allLaunches.filter((launch) => Boolean(engagement.saves[launch.id])), [allLaunches, engagement.saves]);

  const canManageLaunch = useCallback((launch: Launch) => !launch.sample && (cloudEnabled ? !!user && launch.uid === user.id : !launch.uid || launch.uid === 'user_local'), [cloudEnabled, user]);
  const canManagePost = useCallback((post: Post) => !post.sample && (cloudEnabled ? !!user && post.uid === user.id : post.uid === 'user_local'), [cloudEnabled, user]);

  const toggleVote = useCallback(async (id: string) => {
    if (!requireCloudUser('upvote')) return;
    const previous = { ...engagementRef.current.votes };
    const next = { ...previous };
    const hasVoted = Boolean(next[id]);
    if (hasVoted) delete next[id]; else next[id] = Date.now();
    if (cloudEnabled) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return;
      try {
        await checkedWrite(hasVoted
          ? supabase.from('votes').delete().eq('launch_id', id).eq('user_id', user.id)
          : supabase.from('votes').insert({ launch_id: id, user_id: user.id }));
      } catch (error) {
        toast(`Vote not saved: ${errorMessage(error, 'Please try again.')}`);
        return;
      }
    }
    engagementRef.current = { ...engagementRef.current, votes: next };
    setEngagement(engagementRef.current);
  }, [cloudEnabled, requireCloudUser, toast, user]);

  const toggleSave = useCallback(async (id: string) => {
    if (!requireCloudUser('save launches')) return;
    const next = { ...engagementRef.current.saves };
    const hasSaved = Boolean(next[id]);
    if (hasSaved) delete next[id]; else next[id] = Date.now();
    if (cloudEnabled) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return;
      try {
        await checkedWrite(hasSaved
          ? supabase.from('saves').delete().eq('launch_id', id).eq('user_id', user.id)
          : supabase.from('saves').insert({ launch_id: id, user_id: user.id }));
      } catch (error) {
        toast(`Save failed: ${errorMessage(error, 'Please try again.')}`);
        return;
      }
    }
    engagementRef.current = { ...engagementRef.current, saves: next };
    setEngagement(engagementRef.current);
    toast(hasSaved ? 'Removed from saved' : 'Saved');
  }, [cloudEnabled, requireCloudUser, toast, user]);

  const recordInteraction = useCallback(async (id: string, kind: 'views' | 'tries') => {
    const bucket = kind === 'views' ? interactionRef.current.views : interactionRef.current.tries;
    if (bucket.has(id)) return;
    bucket.add(id); // Guard before RPC: realtime refetches must not create a loop.
    if (cloudEnabled && user) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { error } = await supabase.rpc('increment_launch_metric', { launch_id: id, metric_type: kind });
      if (error) {
        bucket.delete(id);
        toast(`Could not record ${kind === 'views' ? 'view' : 'launch open'}: ${error.message}`);
        return;
      }
    }
    const field = kind === 'views' ? 'views' : 'clicks';
    engagementRef.current = {
      ...engagementRef.current,
      [field]: { ...engagementRef.current[field], [id]: Date.now() },
    };
    setEngagement(engagementRef.current);
  }, [cloudEnabled, toast, user]);
  const recordTry = useCallback((id: string) => recordInteraction(id, 'tries'), [recordInteraction]);
  const recordView = useCallback((id: string) => recordInteraction(id, 'views'), [recordInteraction]);

  const toggleFollow = useCallback(async (key: string) => {
    if (!requireCloudUser('follow creators')) return;
    const next = { ...engagementRef.current.follows };
    const following = Boolean(next[key]);
    if (following) delete next[key]; else next[key] = Date.now();
    if (cloudEnabled) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return;
      try {
        await checkedWrite(following
          ? supabase.from('follows').delete().eq('target_maker', key).eq('user_id', user.id)
          : supabase.from('follows').insert({ target_maker: key, user_id: user.id }));
      } catch (error) {
        toast(`Follow not saved: ${errorMessage(error, 'Please try again.')}`);
        return;
      }
    }
    engagementRef.current = { ...engagementRef.current, follows: next };
    setEngagement(engagementRef.current);
    toast(following ? 'Unfollowed' : 'Following');
  }, [cloudEnabled, requireCloudUser, toast, user]);

  const toggleJoinCommunity = useCallback(async (id: string) => {
    if (!requireCloudUser('join communities')) return;
    const next = { ...forumEngagementRef.current.joined };
    const joined = Boolean(next[id]);
    if (joined) delete next[id]; else next[id] = Date.now();
    if (cloudEnabled) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return;
      try {
        await checkedWrite(joined
          ? supabase.from('community_members').delete().eq('community_id', id).eq('user_id', user.id)
          : supabase.from('community_members').insert({ community_id: id, user_id: user.id }));
      } catch (error) {
        toast(`Membership not saved: ${errorMessage(error, 'Please try again.')}`);
        return;
      }
    }
    forumEngagementRef.current = { ...forumEngagementRef.current, joined: next };
    setForumEngagement(forumEngagementRef.current);
  }, [cloudEnabled, requireCloudUser, toast, user]);

  const votePost = useCallback(async (id: string, dir: number) => {
    if (dir !== 1 && dir !== -1) return;
    if (!requireCloudUser('vote on posts')) return;
    const next = { ...forumEngagementRef.current.pv };
    const current = next[id] || 0;
    if (current === dir) delete next[id]; else next[id] = dir;
    if (cloudEnabled) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return;
      try {
        await checkedWrite(current === dir
          ? supabase.from('post_votes').delete().eq('post_id', id).eq('user_id', user.id)
          : supabase.from('post_votes').upsert({ post_id: id, user_id: user.id, direction: dir }));
      } catch (error) {
        toast(`Vote not saved: ${errorMessage(error, 'Please try again.')}`);
        return;
      }
    }
    forumEngagementRef.current = { ...forumEngagementRef.current, pv: next };
    setForumEngagement(forumEngagementRef.current);
  }, [cloudEnabled, requireCloudUser, toast, user]);

  const getComments = useCallback((id: string, kind: 'launch' | 'post'): CommentItem[] => {
    const key = commentKey(kind, id);
    if (cloudEnabled) return cloudComments[key] || [];
    return localComments[key] || localComments[id] || [];
  }, [cloudComments, cloudEnabled, localComments]);

  const postComment = useCallback(async (id: string, kind: 'launch' | 'post', rawText: string) => {
    const text = rawText.trim().slice(0, 280);
    if (!text || !requireCloudUser('comment')) return false;
    const comment: CommentItem = {
      id: `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      name: cloudEnabled ? userProfile?.name || makerName || 'Maker' : makerName || 'Maker',
      text, ts: Date.now(), uid: user?.id || 'user_local',
    };
    if (cloudEnabled) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return false;
      const { error } = await supabase.from('comments').insert({
        id: comment.id, target_id: id, target_type: kind, author_id: user.id, author_name: comment.name, text,
      });
      if (error) {
        toast(`Comment not posted: ${error.message}`);
        return false;
      }
      setCloudComments((previous) => ({ ...previous, [commentKey(kind, id)]: [comment, ...(previous[commentKey(kind, id)] || [])] }));
      setCloudPosts((previous) => previous.map((post) => post.id === id && kind === 'post' ? { ...post, cbase: (post.cbase || 0) + 1 } : post));
    } else {
      const key = commentKey(kind, id);
      setLocalComments((previous) => ({ ...previous, [key]: [comment, ...(previous[key] || previous[id] || [])] }));
    }
    if (!cloudEnabled && kind === 'post') setForumEngagement((previous) => ({ ...previous, pc: { ...previous.pc, [id]: (previous.pc[id] || 0) + 1 } }));
    toast('Comment posted');
    return true;
  }, [cloudEnabled, makerName, requireCloudUser, toast, user, userProfile?.name]);

  const saveLaunchItem = useCallback(async (data: Partial<Launch>, editId?: string): Promise<string | null> => {
    if (!requireCloudUser(editId ? 'edit a launch' : 'publish a launch')) return null;
    const id = editId || `l_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const existing = [...localLaunches, ...cloudLaunches].find((launch) => launch.id === editId);
    if (editId && (!existing || !canManageLaunch(existing))) {
      toast('You can only edit your own launch.');
      return null;
    }
    const links = (data.links ?? existing?.links ?? []).filter(Boolean).slice(0, 4);
    const next: Launch = {
      ...(existing || {}),
      id, name: data.name ?? existing?.name ?? 'Untitled', tag: data.tag ?? existing?.tag ?? '',
      type: data.type ?? existing?.type ?? 'game', url: data.url ?? existing?.url ?? '',
      repo: data.repo ?? existing?.repo ?? '', links,
      plats: data.plats ?? existing?.plats ?? ['w'], tags: data.tags ?? existing?.tags ?? [],
      desc: data.desc ?? existing?.desc ?? '', maker: data.maker ?? existing?.maker ?? (cloudEnabled ? userProfile?.name : makerName) ?? 'Maker',
      bio: data.bio ?? existing?.bio ?? (cloudEnabled ? userProfile?.bio : makerBio) ?? '',
      social: data.social ?? existing?.social ?? (cloudEnabled ? userProfile?.website : makerLink) ?? '',
      glyph: data.glyph ?? existing?.glyph ?? 'star', hue: data.hue ?? existing?.hue ?? 185,
      icon: data.icon ?? existing?.icon ?? '', shots: data.shots ?? existing?.shots ?? [],
      uid: existing?.uid || (cloudEnabled ? user?.id || '' : 'user_local'),
      ts: existing?.ts || Date.now(), base: existing?.base || 0, tried: existing?.tried || 0,
      viewCount: existing?.viewCount, saveCount: existing?.saveCount, followerCount: existing?.followerCount,
      support: existing?.support, sample: false,
    };
    if (cloudEnabled) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return null;
      const payload = {
        name: next.name, tag: next.tag, type: next.type, url: next.url, repo: next.repo || '', links,
        plats: next.plats, tags: next.tags, desc: next.desc, maker_id: user.id, maker_name: next.maker,
        maker_bio: next.bio || '', maker_social: next.social || '', glyph: next.glyph, hue: next.hue,
        icon_url: next.icon || '', screenshots: next.shots || [], sample: false,
      };
      const { error } = editId
        ? await supabase.from('launches').update(payload).eq('id', editId).eq('maker_id', user.id).select('id').single()
        : await supabase.from('launches').insert({ ...payload, id }).select('id').single();
      if (error) {
        toast(`Launch not saved: ${error.message}`);
        return null;
      }
      setCloudLaunches((previous) => editId ? previous.map((launch) => launch.id === editId ? next : launch) : [next, ...previous]);
    } else {
      setLocalLaunches((previous) => editId ? previous.map((launch) => launch.id === editId ? next : launch) : [next, ...previous]);
    }
    toast(editId ? 'Changes saved' : 'Launched! Share it with someone.');
    return id;
  }, [canManageLaunch, cloudEnabled, cloudLaunches, localLaunches, makerBio, makerLink, makerName, requireCloudUser, toast, user, userProfile]);

  const deleteLaunchItem = useCallback(async (id: string): Promise<boolean> => {
    const launch = [...localLaunches, ...cloudLaunches].find((item) => item.id === id);
    if (!launch || !canManageLaunch(launch)) {
      toast('You can only delete your own launch.');
      return false;
    }
    if (cloudEnabled) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return false;
      const { data, error } = await supabase.from('launches').delete().eq('id', id).eq('maker_id', user.id).select('id').maybeSingle();
      if (error || !data) {
        toast(`Launch not deleted: ${error?.message || 'The launch no longer exists or you do not have permission.'}`);
        return false;
      }
      setCloudLaunches((previous) => previous.filter((item) => item.id !== id));
    } else {
      setLocalLaunches((previous) => previous.filter((item) => item.id !== id));
      setLocalComments((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => key !== commentKey('launch', id) && key !== id)));
      setLocalPosts((previous) => previous);
    }
    setEngagement((previous) => ({
      ...previous,
      votes: Object.fromEntries(Object.entries(previous.votes).filter(([key]) => key !== id)),
      saves: Object.fromEntries(Object.entries(previous.saves).filter(([key]) => key !== id)),
      views: Object.fromEntries(Object.entries(previous.views).filter(([key]) => key !== id)),
      clicks: Object.fromEntries(Object.entries(previous.clicks).filter(([key]) => key !== id)),
    }));
    toast('Launch deleted');
    return true;
  }, [canManageLaunch, cloudEnabled, cloudLaunches, localLaunches, toast, user]);

  const createCommunityItem = useCallback(async (data: { slug: string; title: string; about: string; glyph: string; hue: number }): Promise<string | null> => {
    if (!requireCloudUser('create a community')) return null;
    const id = `c_${data.slug}`;
    const community: Community = { id, ...data, uid: user?.id || 'user_local', ts: Date.now(), sample: false, base: 0 };
    if (cloudEnabled) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return null;
      const { error } = await supabase.from('communities').insert({
        id, slug: data.slug, title: data.title, about: data.about, glyph: data.glyph, hue: data.hue, creator_id: user.id, sample: false,
      });
      if (error) {
        toast(`Community not created: ${error.message}`);
        return null;
      }
      setCloudCommunities((previous) => [community, ...previous]);
      const { error: memberError } = await supabase.from('community_members').insert({ community_id: id, user_id: user.id }).select('id').single();
      if (memberError) {
        toast(`Community created, but joining failed: ${memberError.message}`);
        return id;
      }
    } else {
      setLocalCommunities((previous) => [community, ...previous]);
    }
    setForumEngagement((previous) => ({ ...previous, joined: { ...previous.joined, [id]: Date.now() } }));
    toast('Community created');
    return id;
  }, [cloudEnabled, requireCloudUser, toast, user]);

  const createPostItem = useCallback(async (data: { cid: string; title: string; body: string; link?: string }): Promise<string | null> => {
    if (!requireCloudUser('publish a post')) return null;
    const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const post: Post = {
      id, ...data, link: data.link || '', author: cloudEnabled ? userProfile?.name || makerName || 'Maker' : makerName || 'Maker',
      uid: user?.id || 'user_local', ts: Date.now(), sample: false, base: 0, cbase: 0,
    };
    if (cloudEnabled) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return null;
      const { error } = await supabase.from('posts').insert({ id, community_id: data.cid, title: data.title, body: data.body, link: data.link || '', author_id: user.id, author_name: post.author, sample: false });
      if (error) {
        toast(`Post not published: ${error.message}`);
        return null;
      }
      const { error: memberError } = await supabase.from('community_members').upsert({ community_id: data.cid, user_id: user.id }, { onConflict: 'user_id,community_id' });
      if (memberError) toast(`Post published, but membership was not synced: ${memberError.message}`);
      setCloudPosts((previous) => [post, ...previous]);
    } else {
      setLocalPosts((previous) => [post, ...previous]);
    }
    setForumEngagement((previous) => ({ ...previous, joined: { ...previous.joined, [data.cid]: Date.now() } }));
    toast('Post published');
    return id;
  }, [cloudEnabled, makerName, requireCloudUser, toast, user, userProfile?.name]);

  const deletePostItem = useCallback(async (id: string): Promise<boolean> => {
    const post = [...localPosts, ...cloudPosts].find((item) => item.id === id);
    if (!post || !canManagePost(post)) {
      toast('You can only delete your own post.');
      return false;
    }
    if (cloudEnabled) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return false;
      const { data, error } = await supabase.from('posts').delete().eq('id', id).eq('author_id', user.id).select('id').maybeSingle();
      if (error || !data) {
        toast(`Post not deleted: ${error?.message || 'The post no longer exists or you do not have permission.'}`);
        return false;
      }
      setCloudPosts((previous) => previous.filter((item) => item.id !== id));
      setCloudComments((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => key !== commentKey('post', id))));
    } else {
      setLocalPosts((previous) => previous.filter((item) => item.id !== id));
      setLocalComments((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => key !== commentKey('post', id) && key !== id)));
      setForumEngagement((previous) => ({
        ...previous,
        pv: Object.fromEntries(Object.entries(previous.pv).filter(([key]) => key !== id)),
        pc: Object.fromEntries(Object.entries(previous.pc).filter(([key]) => key !== id)),
      }));
    }
    toast('Post deleted');
    return true;
  }, [canManagePost, cloudEnabled, cloudPosts, localPosts, toast, user]);

  const saveProfileSettings = useCallback(async (name: string, bio: string, link: string, support: SupportLink[], hide: boolean): Promise<boolean> => {
    if (cloudEnabled) {
      if (!requireCloudUser('edit your profile')) return false;
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !user) return false;
      const { error } = await supabase.from('profiles').update({ name, bio, website: link, support_links: support as unknown as Json }).eq('id', user.id).select('id').single();
      if (error) {
        toast(`Profile not saved: ${error.message}`);
        return false;
      }
      setUserProfile((previous) => previous ? { ...previous, name, bio, website: link, support_links: support } : previous);
    }
    setMakerName(name);
    setMakerBio(bio);
    setMakerLink(link);
    setSupportLinks(support);
    setHideSamples(hide);
    toast('Profile saved');
    return true;
  }, [cloudEnabled, requireCloudUser, toast, user]);

  const addRecentSearch = useCallback((query: string) => {
    const clean = query.trim().slice(0, 120);
    if (!clean) return;
    setRecents((previous) => [clean, ...previous.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 6));
  }, []);
  const clearRecentSearches = useCallback(() => setRecents([]), []);
  const rollRandom = useCallback(() => {
    if (!allLaunches.length) return;
    const launch = allLaunches[Math.floor(Math.random() * allLaunches.length)];
    go({ t: 'launch', id: launch.id });
    toast(`Rolled: ${launch.name}`);
  }, [allLaunches, go, toast]);
  const openLightbox = useCallback((images: string[], index = 0) => setLightbox({ images, index: Math.max(0, Math.min(index, images.length - 1)) }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const openShareLaunch = useCallback((launch: Launch) => setShareLaunch(launch), []);
  const closeShareLaunch = useCallback(() => setShareLaunch(null), []);
  const openNotifsSheet = useCallback(() => { setUnreadNotifs(0); setActiveSheet({ type: 'notif' }); }, []);
  const retryRemoteData = useCallback(() => void fetchRemoteData(), [fetchRemoteData]);

  const value: BrunchContextType = {
    navStack, currentRoute, go, back, setTab, activeTab, subs, setSubTab,
    allLaunches, myLaunches, savedLaunches, allCommunities, allPosts, engagement, forumEngagement,
    makerName, makerBio, makerLink, supportLinks, hideSamples, recents, user, session, userProfile,
    isBackendConnected: cloudEnabled && dataStatus === 'ready', dataStatus, dataError, retryRemoteData,
    authModalOpen, openAuthModal: () => setAuthModalOpen(true), closeAuthModal: () => setAuthModalOpen(false),
    signInWithEmail, signUpWithEmail, signInWithOAuth, signOut,
    chartFilter, setChartFilter, platformFilter, setPlatformFilter, githubOnlyFilter, setGithubOnlyFilter,
    creatorRankKind, setCreatorRankKind, forumSort, setForumSort, forumScope, setForumScope,
    toggleVote, toggleSave, recordTry, recordView, toggleFollow, toggleJoinCommunity, votePost,
    getComments, postComment, saveLaunchItem, deleteLaunchItem, createCommunityItem, createPostItem, deletePostItem,
    saveProfileSettings, canManageLaunch, canManagePost, addRecentSearch, clearRecentSearches,
    activeSheet, openSheet: setActiveSheet, closeSheet: () => setActiveSheet(null), toastMsg, toast, rollRandom,
    createMenuOpen, openCreateMenu: () => setCreateMenuOpen(true), closeCreateMenu: () => setCreateMenuOpen(false),
    lightbox, openLightbox, closeLightbox, shareLaunch, openShareLaunch, closeShareLaunch, unreadNotifs, openNotifsSheet,
  };

  return <BrunchContext.Provider value={value}>{children}</BrunchContext.Provider>;
}

export function useBrunch() {
  const context = React.useContext(BrunchContext);
  if (!context) throw new Error('useBrunch must be used within a BrunchProvider');
  return context;
}
