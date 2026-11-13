import type { MainTab } from '@/types/brunch';
import type { Route } from '@/types/routes';

const HOME: Route = { t: 'tab', tab: 'home' };
const TABS = new Set<MainTab>(['home', 'explore', 'community', 'games', 'apps', 'tools']);
const SEARCH_FILTERS = new Set(['all', 'game', 'app', 'tool']);

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value).slice(0, 500);
  } catch {
    return '';
  }
};

const part = (value: string): string => encodeURIComponent(value);

export function routeToUrl(route: Route): string {
  switch (route.t) {
    case 'tab': {
      const path = route.tab === 'home' ? '/' : `/${route.tab}`;
      return route.sub ? `${path}?sub=${encodeURIComponent(route.sub)}` : path;
    }
    case 'me':
      return `/me${route.sub ? `?sub=${route.sub}` : ''}`;
    case 'launch':
      return `/launch/${part(route.id)}`;
    case 'dash': {
      const query = new URLSearchParams();
      if (route.demo) query.set('demo', '1');
      if (route.m) query.set('metric', route.m);
      if (route.d) query.set('days', String(route.d));
      return `/dashboard/${part(route.id)}${query.size ? `?${query}` : ''}`;
    }
    case 'maker':
      return `/u/${part(route.key)}`;
    case 'comm':
      return `/b/${part(route.id)}`;
    case 'post':
      return `/post/${part(route.id)}`;
    case 'saved':
      return `/saved?sub=${route.sub}`;
    case 'search': {
      const query = new URLSearchParams({ f: SEARCH_FILTERS.has(route.f) ? route.f : 'all' });
      if (route.q) query.set('q', route.q);
      return `/search?${query}`;
    }
    case 'submit':
      return route.edit ? `/submit/${part(route.edit)}` : '/submit';
    case 'newcomm':
      return '/communities/new';
    case 'newpost':
      return `/posts/new${route.cid ? `?community=${part(route.cid)}` : ''}`;
    case 'coll': {
      const query = new URLSearchParams({ title: route.title, ids: route.ids.join(',') });
      if (route.rank) query.set('rank', '1');
      return `/collection?${query}`;
    }
    case 'chat': {
      const query = new URLSearchParams();
      if (route.cid) query.set('community', route.cid);
      if (route.ch) query.set('channel', route.ch);
      return `/chat${query.size ? `?${query}` : ''}`;
    }
  }
}

export function routeFromUrl(input: string): Route {
  let url: URL;
  try {
    url = new URL(input, 'http://brunch.local');
  } catch {
    return HOME;
  }

  const legacyLaunch = url.searchParams.get('launch');
  const legacyPost = url.searchParams.get('post');
  if (legacyLaunch) return { t: 'launch', id: legacyLaunch };
  if (legacyPost) return { t: 'post', id: legacyPost };
  if (url.hash.startsWith('#u/')) {
    const key = safeDecode(url.hash.slice(3));
    if (key) return { t: 'maker', key };
  }

  const segments = url.pathname.split('/').filter(Boolean).map(safeDecode);
  const [head, id] = segments;
  if (!head) return { t: 'tab', tab: 'home', sub: validSub('home', url.searchParams.get('sub')) };

  if (TABS.has(head as MainTab) && segments.length === 1) {
    const tab = head as MainTab;
    return { t: 'tab', tab, sub: validSub(tab, url.searchParams.get('sub')) };
  }
  if (head === 'launch' && id) return { t: 'launch', id };
  if ((head === 'dashboard' || head === 'dash') && id) {
    const days = Number(url.searchParams.get('days'));
    const metric = url.searchParams.get('metric');
    return {
      t: 'dash',
      id,
      demo: url.searchParams.get('demo') === '1',
      m: ['views', 'clicks', 'votes', 'saves'].includes(metric || '') ? metric as 'views' | 'clicks' | 'votes' | 'saves' : undefined,
      d: [7, 30, 90].includes(days) ? days : undefined,
    };
  }
  if ((head === 'u' || head === 'maker') && id) return { t: 'maker', key: id };
  if ((head === 'b' || head === 'comm') && id) return { t: 'comm', id };
  if (head === 'post' && id) return { t: 'post', id };
  if (head === 'me') {
    const sub = url.searchParams.get('sub');
    return { t: 'me', sub: ['launches', 'saved', 'following'].includes(sub || '') ? sub as 'launches' | 'saved' | 'following' : undefined };
  }
  if (head === 'saved') {
    const sub = url.searchParams.get('sub');
    return { t: 'saved', sub: ['saved', 'mine', 'following'].includes(sub || '') ? sub as 'saved' | 'mine' | 'following' : 'saved' };
  }
  if (head === 'search') {
    const filter = url.searchParams.get('f') || 'all';
    return { t: 'search', q: (url.searchParams.get('q') || '').slice(0, 120), f: SEARCH_FILTERS.has(filter) ? filter : 'all' };
  }
  if (head === 'submit') return { t: 'submit', edit: id || undefined };
  if (url.pathname === '/communities/new' || url.pathname === '/new-community') return { t: 'newcomm' };
  if (url.pathname === '/posts/new' || url.pathname === '/new-post') {
    return { t: 'newpost', cid: url.searchParams.get('community') || undefined };
  }
  if (head === 'collection') {
    return {
      t: 'coll',
      title: (url.searchParams.get('title') || 'Collection').slice(0, 100),
      ids: (url.searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 200),
      rank: url.searchParams.get('rank') === '1',
    };
  }
  if (head === 'chat') {
    return { t: 'chat', cid: url.searchParams.get('community') || undefined, ch: url.searchParams.get('channel') || undefined };
  }
  return HOME;
}

function validSub(tab: MainTab, value: string | null): string | undefined {
  const allowed: Record<MainTab, string[]> = {
    home: ['foryou', 'charts', 'creators'],
    explore: [],
    community: ['feed', 'explore', 'messages'],
    games: ['foryou', 'charts', 'cats'],
    apps: ['foryou', 'charts', 'cats'],
    tools: ['foryou', 'charts', 'cats'],
  };
  return value && allowed[tab].includes(value) ? value : undefined;
}
