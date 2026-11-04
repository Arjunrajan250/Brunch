'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
} from '@/types/brunch';
import {
  SAMPLES,
  SAMPLE_COMMS,
  SAMPLE_POSTS,
  MAKERS,
  SAMPLE_SUPPORT,
  SAMPLE_FOL,
  DAY,
  hash,
  votes as calcVotes,
  tries as calcTries,
  views as calcViews,
  saves as calcSaves,
  followers as calcFollowers,
} from '@/data/seed';

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

  // Load from localStorage on mount
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
      console.error('Failed to load persisted Brunch state', e);
    }
  }, []);

  // Save to localStorage
  const persist = useCallback(() => {
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
      console.error('Failed to persist Brunch state', e);
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

  useEffect(() => {
    persist();
  }, [persist]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 2800);
  }, []);

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

  // Combined data sets
  const allLaunches = [
    ...(hideSamples ? [] : SAMPLES),
    ...localLaunches,
  ];

  const myLaunches = localLaunches.filter((l) => !l.sample);
  const savedLaunches = allLaunches.filter((l) => !!engagement.saves[l.id]);

  const allCommunities = [
    ...(hideSamples ? [] : SAMPLE_COMMS),
    ...localCommunities,
  ];

  const allPosts = [
    ...(hideSamples ? [] : SAMPLE_POSTS),
    ...localPosts,
  ].filter((p) => allCommunities.some((c) => c.id === p.cid));

  // Engagement Actions
  const toggleVote = useCallback((id: string) => {
    setEngagement((prev) => {
      const votes = { ...prev.votes };
      const hasVoted = !!votes[id];
      if (hasVoted) delete votes[id];
      else votes[id] = Date.now();
      return { ...prev, votes };
    });
  }, []);

  const toggleSave = useCallback((id: string) => {
    setEngagement((prev) => {
      const saves = { ...prev.saves };
      const hasSaved = !!saves[id];
      if (hasSaved) {
        delete saves[id];
        toast('Removed from saved');
      } else {
        saves[id] = Date.now();
        toast('Saved');
      }
      return { ...prev, saves };
    });
  }, [toast]);

  const recordTry = useCallback((id: string) => {
    setEngagement((prev) => {
      if (prev.clicks[id]) return prev;
      return {
        ...prev,
        clicks: { ...prev.clicks, [id]: Date.now() },
      };
    });
  }, []);

  const recordView = useCallback((id: string) => {
    setEngagement((prev) => {
      if (prev.views[id]) return prev;
      return {
        ...prev,
        views: { ...prev.views, [id]: Date.now() },
      };
    });
  }, []);

  const toggleFollow = useCallback((key: string) => {
    setEngagement((prev) => {
      const follows = { ...prev.follows };
      const isFollowing = !!follows[key];
      if (isFollowing) {
        delete follows[key];
        toast('Unfollowed');
      } else {
        follows[key] = Date.now();
        toast('Following');
      }
      return { ...prev, follows };
    });
  }, [toast]);

  const toggleJoinCommunity = useCallback((id: string) => {
    setForumEngagement((prev) => {
      const joined = { ...prev.joined };
      const hasJoined = !!joined[id];
      if (hasJoined) delete joined[id];
      else joined[id] = Date.now();
      return { ...prev, joined };
    });
  }, []);

  const votePost = useCallback((id: string, dir: number) => {
    setForumEngagement((prev) => {
      const pv = { ...prev.pv };
      const current = pv[id] || 0;
      if (current === dir) delete pv[id];
      else pv[id] = dir;
      return { ...prev, pv };
    });
  }, []);

  // Comments
  const getComments = useCallback((id: string, kind: 'launch' | 'post'): CommentItem[] => {
    return localComments[id] || [];
  }, [localComments]);

  const postComment = useCallback((id: string, kind: 'launch' | 'post', text: string) => {
    const newComment: CommentItem = {
      id: 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      name: makerName || 'Guest',
      text,
      ts: Date.now(),
    };
    setLocalComments((prev) => ({
      ...prev,
      [id]: [newComment, ...(prev[id] || [])],
    }));
    if (kind === 'post') {
      setForumEngagement((prev) => ({
        ...prev,
        pc: { ...prev.pc, [id]: (prev.pc[id] || 0) + 1 },
      }));
    }
    toast('Posted');
  }, [makerName, toast]);

  // Launches CRUD
  const saveLaunchItem = useCallback((data: Partial<Launch>, editId?: string) => {
    const id = editId || 'l_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
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
      maker: data.maker || makerName,
      bio: data.bio || makerBio,
      social: data.social || makerLink,
      glyph: data.glyph || 'star',
      hue: data.hue ?? 185,
      icon: data.icon || '',
      shots: data.shots || [],
      ts: editId ? (localLaunches.find((l) => l.id === editId)?.ts || Date.now()) : Date.now(),
      sample: false,
    };

    setLocalLaunches((prev) => {
      if (editId) return prev.map((l) => (l.id === editId ? newLaunch : l));
      return [newLaunch, ...prev];
    });

    toast(editId ? 'Changes saved' : 'Launched. Share it with someone.');
    return id;
  }, [localLaunches, makerName, makerBio, makerLink, toast]);

  const deleteLaunchItem = useCallback((id: string) => {
    setLocalLaunches((prev) => prev.filter((l) => l.id !== id));
    setEngagement((prev) => {
      const saves = { ...prev.saves };
      delete saves[id];
      return { ...prev, saves };
    });
    toast('Deleted');
  }, [toast]);

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
      uid: 'user_local',
      ts: Date.now(),
      sample: false,
      base: 1,
    };
    setLocalCommunities((prev) => [newComm, ...prev]);
    setForumEngagement((prev) => ({
      ...prev,
      joined: { ...prev.joined, [id]: Date.now() },
    }));
    toast('Community created');
    return id;
  }, [toast]);

  // Posts CRUD
  const createPostItem = useCallback((data: { cid: string; title: string; body: string; link?: string }) => {
    const id = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const newPost: Post = {
      id,
      cid: data.cid,
      title: data.title,
      body: data.body,
      link: data.link || '',
      author: makerName || 'Guest',
      uid: 'user_local',
      ts: Date.now(),
      sample: false,
      base: 1,
      cbase: 0,
    };
    setLocalPosts((prev) => [newPost, ...prev]);
    setForumEngagement((prev) => ({
      ...prev,
      joined: { ...prev.joined, [data.cid]: Date.now() },
    }));
    toast('Posted');
    return id;
  }, [makerName, toast]);

  const deletePostItem = useCallback((id: string) => {
    setLocalPosts((prev) => prev.filter((p) => p.id !== id));
    toast('Post deleted');
  }, [toast]);

  const saveProfileSettings = useCallback((name: string, bio: string, link: string, support: SupportLink[], hide: boolean) => {
    setMakerName(name);
    setMakerBio(bio);
    setMakerLink(link);
    setSupportLinks(support);
    setHideSamples(hide);
    toast('Profile saved');
  }, [toast]);

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
