'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import {
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
  MetricType,
  PlatformKey,
} from '@/types/brunch';
import {
  SAMPLES,
  SAMPLE_COMMS,
  SAMPLE_POSTS,
} from '@/data/seed';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Json } from '@/types/database';

const STORAGE_KEY = 'kiosk.board.v3';

export type Route =
  | { t: 'tab'; tab: MainTab }
  | { t: 'launch'; id: string }
  | { t: 'dash'; id: string; demo?: boolean; m?: MetricType; d?: number }
  | { t: 'maker'; key: string }
  | { t: 'comm'; id: string }
  | { t: 'post'; id: string }
  | { t: 'saved'; sub: 'saved' | 'mine' | 'following' }
  | { t: 'search'; q: string; f: string }
  | { t: 'submit'; edit?: string }
  | { t: 'newcomm' }
  | { t: 'newpost'; cid?: string }
  | { t: 'coll'; title: string; ids: string[]; rank?: boolean };

export type SheetType =
  | null
  | { type: 'profile' }
  | { type: 'editprofile' }
  | { type: 'support'; key: string }
  | { type: 'report'; id: string }
  | { type: 'deleteLaunch'; id: string }
  | { type: 'deletePost'; id: string }
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

interface BrunchContextType {
  // Navigation
  navStack: Route[];
  currentRoute: Route;
  go: (route: Route) => void;
  back: () => void;
  setTab: (tab: MainTab) => void;
  activeTab: MainTab;
  subs: {
    home: HomeSubTab;
    games: TypeSubTab;
    apps: TypeSubTab;
    tools: TypeSubTab;
    community: CommunitySubTab;
  };
  setSubTab: (tab: MainTab, sub: string) => void;
  
  // Data
  allLaunches: Launch[];
  myLaunches: Launch[];
  savedLaunches: Launch[];
  allCommunities: Community[];
  allPosts: Post[];
  
  // Engagement
  engagement: EngagementState;
  forumEngagement: ForumEngagementState;
  
  // Profile
  makerName: string;
  makerBio: string;
  makerLink: string;
  supportLinks: SupportLink[];
  hideSamples: boolean;
  recents: string[];

  // Authentication & Supabase
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isBackendConnected: boolean;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, pass: string, name: string, handle: string) => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: 'github' | 'google') => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  
  // Filters & Sorting
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
  
  // Actions
  toggleVote: (id: string) => void;
  toggleSave: (id: string) => void;
  recordTry: (id: string) => void;
  recordView: (id: string) => void;
  toggleFollow: (key: string) => void;
  toggleJoinCommunity: (id: string) => void;
  votePost: (id: string, dir: number) => void;
  getComments: (id: string, kind: 'launch' | 'post') => CommentItem[];
  postComment: (id: string, kind: 'launch' | 'post', text: string) => void;
  saveLaunchItem: (launch: Partial<Launch>, editId?: string) => string;
  deleteLaunchItem: (id: string) => void;
  createCommunityItem: (comm: { slug: string; title: string; about: string; glyph: string; hue: number }) => string;
  createPostItem: (post: { cid: string; title: string; body: string; link?: string }) => string;
  deletePostItem: (id: string) => void;
  saveProfileSettings: (name: string, bio: string, link: string, support: SupportLink[], hideSamples: boolean) => void;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  
  // Modals & Toasts
  activeSheet: SheetType;
  openSheet: (sheet: SheetType) => void;
  closeSheet: () => void;
  toastMsg: string | null;
  toast: (msg: string) => void;
}

const BrunchContext = createContext<BrunchContextType | null>(null);

export function BrunchProvider({ children }: { children: ReactNode }) {
  const [navStack, setNavStack] = useState<Route[]>([{ t: 'tab', tab: 'home' }]);
  const [subs, setSubs] = useState<{
    home: HomeSubTab;
    games: TypeSubTab;
    apps: TypeSubTab;
    tools: TypeSubTab;
    community: CommunitySubTab;
  }>({
    home: 'foryou',
    games: 'foryou',
    apps: 'foryou',
    tools: 'foryou',
    community: 'feed',
  });

  // Auth & Cloud State
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const isBackendConnected = isSupabaseConfigured();

  // Data sets
  const [cloudLaunches, setCloudLaunches] = useState<Launch[]>([]);
  const [cloudCommunities, setCloudCommunities] = useState<Community[]>([]);
  const [cloudPosts, setCloudPosts] = useState<Post[]>([]);
  const [cloudComments, setCloudComments] = useState<Record<string, CommentItem[]>>({});

  const [localLaunches, setLocalLaunches] = useState<Launch[]>([]);
  const [localCommunities, setLocalCommunities] = useState<Community[]>([]);
  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const [localComments, setLocalComments] = useState<Record<string, CommentItem[]>>({});
  
  const [engagement, setEngagement] = useState<EngagementState>({
    votes: {},
    clicks: {},
    views: {},
    saves: {},
    follows: {},
    sclicks: {},
  });

  const [forumEngagement, setForumEngagement] = useState<ForumEngagementState>({
    joined: {},
    pv: {},
    pc: {},
  });

  const [makerName, setMakerName] = useState('You');
  const [makerBio, setMakerBio] = useState('');
  const [makerLink, setMakerLink] = useState('');
  const [supportLinks, setSupportLinks] = useState<SupportLink[]>([]);
  const [hideSamples, setHideSamples] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  
  const [chartFilter, setChartFilterState] = useState<Record<string, ChartKind>>({
    home: 'hot',
    games: 'hot',
    apps: 'hot',
    tools: 'hot',
  });
  const [platformFilter, setPlatformFilter] = useState('all');
  const [githubOnlyFilter, setGithubOnlyFilter] = useState(false);
  const [creatorRankKind, setCreatorRankKind] = useState<CreatorRankKind>('score');
  const [forumSort, setForumSort] = useState<'hot' | 'new' | 'top'>('hot');
  const [forumScope, setForumScope] = useState<'all' | 'joined'>('all');

  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 2800);
  }, []);

  // 1. Initial Local Storage Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.launches && Array.isArray(d.launches)) setLocalLaunches(d.launches);
        if (d.comms && Array.isArray(d.comms)) setLocalCommunities(d.comms);
        if (d.posts && Array.isArray(d.posts)) setLocalPosts(d.posts);
        if (d.comments && typeof d.comments === 'object') setLocalComments(d.comments);
        if (d.mine && typeof d.mine === 'object') {
          setEngagement({
            votes: d.mine.votes || {},
            clicks: d.mine.clicks || {},
            views: d.mine.views || {},
            saves: d.mine.saves || {},
            follows: d.mine.follows || {},
            sclicks: d.mine.sclicks || {},
          });
        }
        if (d.forum && typeof d.forum === 'object') {
          setForumEngagement({
            joined: d.forum.joined || {},
            pv: d.forum.pv || {},
            pc: d.forum.pc || {},
          });
        }
        if (d.makerName) setMakerName(d.makerName);
        if (d.makerBio) setMakerBio(d.makerBio);
        if (d.makerLink) setMakerLink(d.makerLink);
        if (d.support && Array.isArray(d.support)) setSupportLinks(d.support);
        if (typeof d.hideSamples === 'boolean') setHideSamples(d.hideSamples);
        if (d.recents && Array.isArray(d.recents)) setRecents(d.recents);
      }
    } catch (e) {
      console.error('Failed to load local Brunch state', e);
    }
  }, []);

  // 2. Persist local state
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          launches: localLaunches,
          comms: localCommunities,
          posts: localPosts,
          comments: localComments,
          mine: engagement,
          forum: forumEngagement,
          makerName,
          makerBio,
          makerLink,
          support: supportLinks,
          hideSamples,
          recents,
        })
      );
    } catch (e) {
      console.error('Failed to persist local state', e);
    }
  }, [
    localLaunches,
    localCommunities,
    localPosts,
    localComments,
    engagement,
    forumEngagement,
    makerName,
    makerBio,
    makerLink,
    supportLinks,
    hideSamples,
    recents,
  ]);

  // 3. Supabase Auth & Remote Data Synchronization
  useEffect(() => {
    if (!isBackendConnected) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    // Check existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
        fetchUserEngagements(currentSession.user.id);
      }
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        fetchUserProfile(newSession.user.id);
        fetchUserEngagements(newSession.user.id);
      } else {
        setUserProfile(null);
      }
    });

    // Fetch remote data
    fetchRemoteData();

    // Subscribe to Supabase Realtime changes
    const channel = supabase
      .channel('public_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'launches' }, () => {
        fetchRemoteLaunches();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchRemotePosts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        fetchRemoteComments();
      })
      .subscribe();

    return () => {
      authListener?.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [isBackendConnected]);

  const fetchUserProfile = async (userId: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setUserProfile({
        id: data.id,
        name: data.name,
        handle: data.handle,
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
        website: data.website || '',
        support_links: (data.support_links as unknown as SupportLink[]) || [],
      });
      if (data.name) setMakerName(data.name);
      if (data.bio) setMakerBio(data.bio);
      if (data.website) setMakerLink(data.website);
      if (data.support_links) setSupportLinks((data.support_links as unknown as SupportLink[]) || []);
    }
  };

  const fetchUserEngagements = async (userId: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const [votesRes, savesRes, followsRes, membersRes, postVotesRes] = await Promise.all([
        supabase.from('votes').select('launch_id, created_at').eq('user_id', userId),
        supabase.from('saves').select('launch_id, created_at').eq('user_id', userId),
        supabase.from('follows').select('target_maker, created_at').eq('user_id', userId),
        supabase.from('community_members').select('community_id, created_at').eq('user_id', userId),
        supabase.from('post_votes').select('post_id, direction').eq('user_id', userId),
      ]);

      if (votesRes.data) {
        const vMap: Record<string, number> = {};
        votesRes.data.forEach((r) => { vMap[r.launch_id] = new Date(r.created_at).getTime(); });
        setEngagement((prev) => ({ ...prev, votes: { ...prev.votes, ...vMap } }));
      }

      if (savesRes.data) {
        const sMap: Record<string, number> = {};
        savesRes.data.forEach((r) => { sMap[r.launch_id] = new Date(r.created_at).getTime(); });
        setEngagement((prev) => ({ ...prev, saves: { ...prev.saves, ...sMap } }));
      }

      if (followsRes.data) {
        const fMap: Record<string, number> = {};
        followsRes.data.forEach((r) => { fMap[r.target_maker] = new Date(r.created_at).getTime(); });
        setEngagement((prev) => ({ ...prev, follows: { ...prev.follows, ...fMap } }));
      }

      if (membersRes.data) {
        const jMap: Record<string, number> = {};
        membersRes.data.forEach((r) => { jMap[r.community_id] = new Date(r.created_at).getTime(); });
        setForumEngagement((prev) => ({ ...prev, joined: { ...prev.joined, ...jMap } }));
      }

      if (postVotesRes.data) {
        const pvMap: Record<string, number> = {};
        postVotesRes.data.forEach((r) => { pvMap[r.post_id] = r.direction; });
        setForumEngagement((prev) => ({ ...prev, pv: { ...prev.pv, ...pvMap } }));
      }
    } catch (err) {
      console.warn('Failed to load user engagements from Supabase', err);
    }
  };

  const fetchRemoteLaunches = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data } = await supabase
      .from('launches')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const parsed: Launch[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        tag: row.tag || '',
        type: row.type as Launch['type'],
        url: row.url,
        repo: row.repo || '',
        plats: (row.plats || ['w']) as PlatformKey[],
        tags: row.tags || [],
        desc: row.desc || '',
        maker: row.maker_name,
        bio: row.maker_bio || '',
        social: row.maker_social || '',
        glyph: row.glyph || 'star',
        hue: row.hue ?? 185,
        icon: row.icon_url || '',
        shots: row.screenshots || [],
        uid: row.maker_id || '',
        ts: new Date(row.created_at).getTime(),
        sample: row.sample,
        base: row.views_count || 0,
        tried: row.tries_count || 0,
      }));
      setCloudLaunches(parsed);
    }
  };

  const fetchRemotePosts = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const parsed: Post[] = data.map((row) => ({
        id: row.id,
        cid: row.community_id,
        title: row.title,
        body: row.body || '',
        link: row.link || '',
        author: row.author_name,
        uid: row.author_id || '',
        ts: new Date(row.created_at).getTime(),
        sample: row.sample,
        base: 1,
        cbase: 0,
      }));
      setCloudPosts(parsed);
    }
  };

  const fetchRemoteComments = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const cMap: Record<string, CommentItem[]> = {};
      data.forEach((row) => {
        if (!cMap[row.target_id]) cMap[row.target_id] = [];
        cMap[row.target_id].push({
          id: row.id,
          name: row.author_name,
          text: row.text,
          ts: new Date(row.created_at).getTime(),
          uid: row.author_id || undefined,
        });
      });
      setCloudComments(cMap);
    }
  };

  const fetchRemoteData = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      await Promise.all([
        fetchRemoteLaunches(),
        fetchRemotePosts(),
        fetchRemoteComments(),
        supabase.from('communities').select('*').then(({ data }) => {
          if (data && data.length > 0) {
            const parsed: Community[] = data.map((row) => ({
              id: row.id,
              slug: row.slug,
              title: row.title,
              about: row.about || '',
              glyph: row.glyph || 'bubble',
              hue: row.hue ?? 185,
              uid: row.creator_id || '',
              ts: new Date(row.created_at).getTime(),
              sample: row.sample,
              base: 1,
            }));
            setCloudCommunities(parsed);
          }
        }),
      ]);
    } catch (e) {
      console.warn('Failed to fetch remote Supabase data', e);
    }
  };

  // Auth Operations
  const signInWithEmail = async (email: string, pass: string): Promise<{ error: string | null }> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { error: 'Database is in local mode. Add Supabase keys to .env.local to enable cloud auth.' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error: error ? error.message : null };
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    handle: string
  ): Promise<{ error: string | null }> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { error: 'Database is in local mode. Add Supabase keys to .env.local to enable cloud auth.' };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name,
          user_name: handle || ('maker_' + Math.random().toString(36).slice(2, 8)),
        },
      },
    });
    return { error: error ? error.message : null };
  };

  const signInWithOAuth = async (provider: 'github' | 'google'): Promise<{ error: string | null }> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { error: 'Database is in local mode. Add Supabase keys to .env.local to enable OAuth.' };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      },
    });
    return { error: error ? error.message : null };
  };

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setUserProfile(null);
    toast('Signed out');
  };

  // Navigation handlers
  const currentRoute = navStack[navStack.length - 1] || { t: 'tab', tab: 'home' };
  const activeTab: MainTab = currentRoute.t === 'tab' ? currentRoute.tab : 'home';

  const go = useCallback((route: Route) => {
    setNavStack((prev) => [...prev, route]);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const back = useCallback(() => {
    setNavStack((prev) => (prev.length > 1 ? prev.slice(0, prev.length - 1) : prev));
  }, []);

  const setTab = useCallback((tab: MainTab) => {
    setNavStack([{ t: 'tab', tab }]);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const setSubTab = useCallback((tab: MainTab, sub: string) => {
    setSubs((prev) => ({ ...prev, [tab]: sub }));
  }, []);

  const setChartFilter = useCallback((tab: string, kind: ChartKind) => {
    setChartFilterState((prev) => ({ ...prev, [tab]: kind }));
  }, []);

  // Combined data sets (Prioritizes cloud database when active, otherwise fallback/local)
  const allLaunches = isBackendConnected && cloudLaunches.length > 0
    ? (hideSamples ? cloudLaunches.filter((l) => !l.sample) : cloudLaunches)
    : [
        ...(hideSamples ? [] : SAMPLES),
        ...localLaunches,
      ];

  const myLaunches = isBackendConnected && user
    ? allLaunches.filter((l) => l.uid === user.id || (!l.sample && l.maker === (userProfile?.name || makerName)))
    : localLaunches.filter((l) => !l.sample);

  const savedLaunches = allLaunches.filter((l) => Boolean(engagement.saves[l.id]));

  const allCommunities = isBackendConnected && cloudCommunities.length > 0
    ? (hideSamples ? cloudCommunities.filter((c) => !c.sample) : cloudCommunities)
    : [
        ...(hideSamples ? [] : SAMPLE_COMMS),
        ...localCommunities,
      ];

  const allPosts = isBackendConnected && cloudPosts.length > 0
    ? (hideSamples ? cloudPosts.filter((p) => !p.sample) : cloudPosts)
    : [
        ...(hideSamples ? [] : SAMPLE_POSTS),
        ...localPosts,
      ].filter((p) => allCommunities.some((c) => c.id === p.cid));

  // Engagement Actions
  const toggleVote = useCallback((id: string) => {
    const hasVoted = Boolean(engagement.votes[id]);
    setEngagement((prev) => {
      const votes = { ...prev.votes };
      if (hasVoted) delete votes[id];
      else votes[id] = Date.now();
      return { ...prev, votes };
    });

    if (isBackendConnected) {
      const supabase = getSupabaseBrowserClient();
      if (supabase && user) {
        if (hasVoted) {
          supabase.from('votes').delete().eq('launch_id', id).eq('user_id', user.id).then();
        } else {
          supabase.from('votes').insert({ launch_id: id, user_id: user.id }).then();
        }
      } else if (!user) {
        toast('Upvoted! Sign in to keep votes synced across devices.');
      }
    }
  }, [engagement.votes, isBackendConnected, user, toast]);

  const toggleSave = useCallback((id: string) => {
    const hasSaved = Boolean(engagement.saves[id]);
    setEngagement((prev) => {
      const saves = { ...prev.saves };
      if (hasSaved) {
        delete saves[id];
        toast('Removed from saved');
      } else {
        saves[id] = Date.now();
        toast('Saved');
      }
      return { ...prev, saves };
    });

    if (isBackendConnected) {
      const supabase = getSupabaseBrowserClient();
      if (supabase && user) {
        if (hasSaved) {
          supabase.from('saves').delete().eq('launch_id', id).eq('user_id', user.id).then();
        } else {
          supabase.from('saves').insert({ launch_id: id, user_id: user.id }).then();
        }
      }
    }
  }, [engagement.saves, isBackendConnected, user, toast]);

  const recordTry = useCallback((id: string) => {
    setEngagement((prev) => {
      if (prev.clicks[id]) return prev;
      return {
        ...prev,
        clicks: { ...prev.clicks, [id]: Date.now() },
      };
    });

    if (isBackendConnected) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase.rpc('increment_launch_metric', { launch_id: id, metric_type: 'tries' }).then();
      }
    }
  }, [isBackendConnected]);

  const recordView = useCallback((id: string) => {
    setEngagement((prev) => {
      if (prev.views[id]) return prev;
      return {
        ...prev,
        views: { ...prev.views, [id]: Date.now() },
      };
    });

    if (isBackendConnected) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase.rpc('increment_launch_metric', { launch_id: id, metric_type: 'views' }).then();
      }
    }
  }, [isBackendConnected]);

  const toggleFollow = useCallback((key: string) => {
    const isFollowing = Boolean(engagement.follows[key]);
    setEngagement((prev) => {
      const follows = { ...prev.follows };
      if (isFollowing) {
        delete follows[key];
        toast('Unfollowed');
      } else {
        follows[key] = Date.now();
        toast('Following');
      }
      return { ...prev, follows };
    });

    if (isBackendConnected) {
      const supabase = getSupabaseBrowserClient();
      if (supabase && user) {
        if (isFollowing) {
          supabase.from('follows').delete().eq('target_maker', key).eq('user_id', user.id).then();
        } else {
          supabase.from('follows').insert({ target_maker: key, user_id: user.id }).then();
        }
      }
    }
  }, [engagement.follows, isBackendConnected, user, toast]);

  const toggleJoinCommunity = useCallback((id: string) => {
    const hasJoined = Boolean(forumEngagement.joined[id]);
    setForumEngagement((prev) => {
      const joined = { ...prev.joined };
      if (hasJoined) delete joined[id];
      else joined[id] = Date.now();
      return { ...prev, joined };
    });

    if (isBackendConnected) {
      const supabase = getSupabaseBrowserClient();
      if (supabase && user) {
        if (hasJoined) {
          supabase.from('community_members').delete().eq('community_id', id).eq('user_id', user.id).then();
        } else {
          supabase.from('community_members').insert({ community_id: id, user_id: user.id }).then();
        }
      }
    }
  }, [forumEngagement.joined, isBackendConnected, user]);

  const votePost = useCallback((id: string, dir: number) => {
    const current = forumEngagement.pv[id] || 0;
    setForumEngagement((prev) => {
      const pv = { ...prev.pv };
      if (current === dir) delete pv[id];
      else pv[id] = dir;
      return { ...prev, pv };
    });

    if (isBackendConnected) {
      const supabase = getSupabaseBrowserClient();
      if (supabase && user) {
        if (current === dir) {
          supabase.from('post_votes').delete().eq('post_id', id).eq('user_id', user.id).then();
        } else {
          supabase.from('post_votes').upsert({ post_id: id, user_id: user.id, direction: dir }).then();
        }
      }
    }
  }, [forumEngagement.pv, isBackendConnected, user]);

  // Comments
  const getComments = useCallback((id: string, _kind: 'launch' | 'post'): CommentItem[] => {
    if (isBackendConnected && cloudComments[id]) {
      return cloudComments[id];
    }
    return localComments[id] || [];
  }, [cloudComments, isBackendConnected, localComments]);

  const postComment = useCallback((id: string, kind: 'launch' | 'post', text: string) => {
    const commentId = 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const authorName = userProfile?.name || makerName || 'Maker';
    const newComment: CommentItem = {
      id: commentId,
      name: authorName,
      text,
      ts: Date.now(),
      uid: user?.id,
    };

    // Optimistic update
    setLocalComments((prev) => ({
      ...prev,
      [id]: [newComment, ...(prev[id] || [])],
    }));
    setCloudComments((prev) => ({
      ...prev,
      [id]: [newComment, ...(prev[id] || [])],
    }));

    if (kind === 'post') {
      setForumEngagement((prev) => ({
        ...prev,
        pc: { ...prev.pc, [id]: (prev.pc[id] || 0) + 1 },
      }));
    }

    if (isBackendConnected) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase.from('comments').insert({
          id: commentId,
          target_id: id,
          target_type: kind,
          author_id: user?.id || null,
          author_name: authorName,
          text,
        }).then(({ error }) => {
          if (error) console.warn('Failed to insert comment in Supabase', error.message);
        });
      }
    }

    toast('Comment posted');
  }, [isBackendConnected, makerName, toast, user, userProfile?.name]);

  // Launches CRUD
  const saveLaunchItem = useCallback((data: Partial<Launch>, editId?: string) => {
    const id = editId || 'l_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const authorName = userProfile?.name || makerName || 'Maker';
    const newLaunch: Launch = {
      id,
      name: data.name || 'Untitled',
      tag: data.tag || '',
      type: data.type || 'game',
      url: data.url || 'https://example.com',
      repo: data.repo || '',
      plats: data.plats || ['w'],
      tags: data.tags || [],
      desc: data.desc || '',
      maker: authorName,
      bio: userProfile?.bio || makerBio,
      social: userProfile?.website || makerLink,
      glyph: data.glyph || 'star',
      hue: data.hue ?? 185,
      icon: data.icon || '',
      shots: data.shots || [],
      uid: user?.id,
      ts: editId ? (localLaunches.find((l) => l.id === editId)?.ts || Date.now()) : Date.now(),
      sample: false,
    };

    // Optimistic local update
    setLocalLaunches((prev) => {
      if (editId) return prev.map((l) => (l.id === editId ? newLaunch : l));
      return [newLaunch, ...prev];
    });
    setCloudLaunches((prev) => {
      if (editId) return prev.map((l) => (l.id === editId ? newLaunch : l));
      return [newLaunch, ...prev];
    });

    // Write to Supabase
    if (isBackendConnected) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const payload = {
          id,
          name: newLaunch.name,
          tag: newLaunch.tag,
          type: newLaunch.type,
          url: newLaunch.url,
          repo: newLaunch.repo || '',
          plats: newLaunch.plats,
          tags: newLaunch.tags,
          desc: newLaunch.desc,
          maker_id: user?.id || null,
          maker_name: newLaunch.maker,
          maker_bio: newLaunch.bio || '',
          maker_social: newLaunch.social || '',
          glyph: newLaunch.glyph,
          hue: newLaunch.hue,
          icon_url: newLaunch.icon || '',
          screenshots: newLaunch.shots || [],
          sample: false,
        };

        if (editId) {
          supabase.from('launches').update(payload).eq('id', editId).then();
        } else {
          supabase.from('launches').insert(payload).then();
        }
      }
    }

    toast(editId ? 'Changes saved' : 'Launched! Share it with someone.');
    return id;
  }, [isBackendConnected, localLaunches, makerBio, makerLink, makerName, toast, user, userProfile?.bio, userProfile?.name, userProfile?.website]);

  const deleteLaunchItem = useCallback((id: string) => {
    setLocalLaunches((prev) => prev.filter((l) => l.id !== id));
    setCloudLaunches((prev) => prev.filter((l) => l.id !== id));
    setEngagement((prev) => {
      const saves = { ...prev.saves };
      delete saves[id];
      return { ...prev, saves };
    });

    if (isBackendConnected) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase.from('launches').delete().eq('id', id).then();
      }
    }
    toast('Deleted');
  }, [isBackendConnected, toast]);

  // Communities CRUD
  const createCommunityItem = useCallback((data: { slug: string; title: string; about: string; glyph: string; hue: number }) => {
    const id = 'c_' + data.slug;
    const newComm: Community = {
      id,
      slug: data.slug,
      title: data.title,
      about: data.about,
      glyph: data.glyph,
      hue: data.hue,
      uid: user?.id || 'user_local',
      ts: Date.now(),
      sample: false,
      base: 1,
    };

    setLocalCommunities((prev) => [newComm, ...prev]);
    setCloudCommunities((prev) => [newComm, ...prev]);
    setForumEngagement((prev) => ({
      ...prev,
      joined: { ...prev.joined, [id]: Date.now() },
    }));

    if (isBackendConnected) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase.from('communities').insert({
          id,
          slug: data.slug,
          title: data.title,
          about: data.about,
          glyph: data.glyph,
          hue: data.hue,
          creator_id: user?.id || null,
          sample: false,
        }).then();
      }
    }

    toast('Community created');
    return id;
  }, [isBackendConnected, toast, user?.id]);

  // Posts CRUD
  const createPostItem = useCallback((data: { cid: string; title: string; body: string; link?: string }) => {
    const id = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const authorName = userProfile?.name || makerName || 'Maker';
    const newPost: Post = {
      id,
      cid: data.cid,
      title: data.title,
      body: data.body,
      link: data.link || '',
      author: authorName,
      uid: user?.id || 'user_local',
      ts: Date.now(),
      sample: false,
      base: 1,
      cbase: 0,
    };

    setLocalPosts((prev) => [newPost, ...prev]);
    setCloudPosts((prev) => [newPost, ...prev]);
    setForumEngagement((prev) => ({
      ...prev,
      joined: { ...prev.joined, [data.cid]: Date.now() },
    }));

    if (isBackendConnected) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase.from('posts').insert({
          id,
          community_id: data.cid,
          title: data.title,
          body: data.body,
          link: data.link || '',
          author_id: user?.id || null,
          author_name: authorName,
          sample: false,
        }).then();
      }
    }

    toast('Post published');
    return id;
  }, [isBackendConnected, makerName, toast, user?.id, userProfile?.name]);

  const deletePostItem = useCallback((id: string) => {
    setLocalPosts((prev) => prev.filter((p) => p.id !== id));
    setCloudPosts((prev) => prev.filter((p) => p.id !== id));

    if (isBackendConnected) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase.from('posts').delete().eq('id', id).then();
      }
    }
    toast('Post deleted');
  }, [isBackendConnected, toast]);

  const saveProfileSettings = useCallback((name: string, bio: string, link: string, support: SupportLink[], hide: boolean) => {
    setMakerName(name);
    setMakerBio(bio);
    setMakerLink(link);
    setSupportLinks(support);
    setHideSamples(hide);

    if (isBackendConnected && user) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase.from('profiles').update({
          name,
          bio,
          website: link,
          support_links: support as unknown as Json,
        }).eq('id', user.id).then();
      }
    }

    toast('Profile saved');
  }, [isBackendConnected, toast, user]);

  const addRecentSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setRecents((prev) => [q.trim(), ...prev.filter((x) => x.toLowerCase() !== q.trim().toLowerCase())].slice(0, 6));
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecents([]);
  }, []);

  return (
    <BrunchContext.Provider
      value={{
        navStack,
        currentRoute,
        go,
        back,
        setTab,
        activeTab,
        subs,
        setSubTab,
        allLaunches,
        myLaunches,
        savedLaunches,
        allCommunities,
        allPosts,
        engagement,
        forumEngagement,
        makerName,
        makerBio,
        makerLink,
        supportLinks,
        hideSamples,
        recents,
        user,
        session,
        userProfile,
        isBackendConnected,
        authModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signOut,
        chartFilter,
        setChartFilter,
        platformFilter,
        setPlatformFilter,
        githubOnlyFilter,
        setGithubOnlyFilter,
        creatorRankKind,
        setCreatorRankKind,
        forumSort,
        setForumSort,
        forumScope,
        setForumScope,
        toggleVote,
        toggleSave,
        recordTry,
        recordView,
        toggleFollow,
        toggleJoinCommunity,
        votePost,
        getComments,
        postComment,
        saveLaunchItem,
        deleteLaunchItem,
        createCommunityItem,
        createPostItem,
        deletePostItem,
        saveProfileSettings,
        addRecentSearch,
        clearRecentSearches,
        activeSheet,
        openSheet: setActiveSheet,
        closeSheet: () => setActiveSheet(null),
        toastMsg,
        toast,
      }}
    >
      {children}
    </BrunchContext.Provider>
  );
}

export function useBrunch() {
  const context = useContext(BrunchContext);
  if (!context) throw new Error('useBrunch must be used within a BrunchProvider');
  return context;
}
