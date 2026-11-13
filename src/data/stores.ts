import { StoreKey, PlatformKey, Launch } from '@/types/brunch';
import { parseUrl } from './seed';

const GHN = /^[A-Za-z0-9_.-]{1,100}$/;
const GH_RESERVED = new Set([
  'orgs', 'sponsors', 'topics', 'settings', 'marketplace', 'features',
  'about', 'pricing', 'login', 'join', 'explore', 'collections',
  'trending', 'notifications', 'search', 'apps', 'users'
]);

const repoSeg = (s: string[]) => s.length >= 2 && !GH_RESERVED.has(s[0].toLowerCase()) && GHN.test(s[0]) && GHN.test(s[1]);
const repoCanon = (host: string, s: string[]) => 'https://' + host + '/' + s[0] + '/' + s[1].replace(/\.git$/, '');

export interface StoreConfig {
  label: string;
  cta: string;
  sec?: string;
  ic: string;
  col: string;
  plat?: PlatformKey;
  test: (h: string, s: string[]) => boolean;
  canon?: (h: string, s: string[]) => string;
}

export const STORES: Record<StoreKey, StoreConfig> = {
  github: {
    label: 'GitHub',
    cta: 'Open on GitHub',
    sec: 'View source on GitHub',
    ic: 'branch',
    col: '#0a1f44',
    test: (h, s) => h === 'github.com' && repoSeg(s),
    canon: repoCanon,
  },
  gitlab: {
    label: 'GitLab',
    cta: 'Open on GitLab',
    sec: 'View source on GitLab',
    ic: 'code',
    col: '#a8400c',
    test: (h, s) => h === 'gitlab.com' && repoSeg(s),
    canon: repoCanon,
  },
  play: {
    label: 'Google Play',
    cta: 'Get it on Google Play',
    ic: 'play',
    col: '#0b7a54',
    plat: 'a',
    test: (h, s) => h === 'play.google.com' && (((s[0] === 'store' && (s[1] === 'apps' || s[1] === 'games')) || (s[0] === 'apps' && s[1] === 'testing'))),
  },
  appstore: {
    label: 'App Store',
    cta: 'Get it on the App Store',
    ic: 'bag',
    col: '#0a5cc2',
    plat: 'i',
    test: (h, s) => (h === 'apps.apple.com' || h === 'itunes.apple.com') && s.includes('app'),
  },
  testflight: {
    label: 'TestFlight',
    cta: 'Join the TestFlight beta',
    ic: 'bag',
    col: '#1d4f91',
    plat: 'i',
    test: (h, s) => h === 'testflight.apple.com' && s[0] === 'join',
  },
  msstore: {
    label: 'Microsoft Store',
    cta: 'Get it from Microsoft Store',
    ic: 'bag',
    col: '#005a9e',
    plat: 'd',
    test: (h, s) => h === 'apps.microsoft.com' || (h === 'microsoft.com' && /\/(store|p)\//.test('/' + s.join('/') + '/')),
  },
  steam: {
    label: 'Steam',
    cta: 'Open on Steam',
    ic: 'games',
    col: '#1b2838',
    plat: 'd',
    test: (h, s) => h === 'store.steampowered.com' && s[0] === 'app',
  },
  epic: {
    label: 'Epic Games',
    cta: 'Open on Epic Games',
    ic: 'games',
    col: '#2b2b2b',
    plat: 'd',
    test: (h, s) => h === 'store.epicgames.com' && s.includes('p'),
  },
  itch: {
    label: 'itch.io',
    cta: 'Play on itch.io',
    ic: 'games',
    col: '#b3263f',
    test: (h, s) => h.endsWith('.itch.io') && s.length >= 1,
  },
  chrome: {
    label: 'Chrome Web Store',
    cta: 'Add on Chrome Web Store',
    ic: 'puzzle',
    col: '#a14a00',
    plat: 'w',
    test: (h, s) => (h === 'chromewebstore.google.com' && s[0] === 'detail') || (h === 'chrome.google.com' && s[0] === 'webstore'),
  },
  firefox: {
    label: 'Firefox Add-ons',
    cta: 'Add on Firefox',
    ic: 'puzzle',
    col: '#b0390d',
    plat: 'w',
    test: (h, s) => h === 'addons.mozilla.org' && s.includes('addon'),
  },
  fdroid: {
    label: 'F-Droid',
    cta: 'Get it on F-Droid',
    ic: 'play',
    col: '#1360a8',
    plat: 'a',
    test: (h, s) => h === 'f-droid.org' && s.includes('packages'),
  },
  hf: {
    label: 'Hugging Face',
    cta: 'Open on Hugging Face',
    ic: 'code',
    col: '#8a5a00',
    plat: 'w',
    test: (h, s) => h === 'huggingface.co' && s[0] === 'spaces' && s.length >= 3,
  },
  npm: {
    label: 'npm',
    cta: 'View on npm',
    ic: 'code',
    col: '#b3261e',
    test: (h, s) => h === 'npmjs.com' && s[0] === 'package',
  },
  pypi: {
    label: 'PyPI',
    cta: 'View on PyPI',
    ic: 'code',
    col: '#2a5d9f',
    test: (h, s) => h === 'pypi.org' && s[0] === 'project',
  },
};

export const ST_ORDER = Object.keys(STORES) as StoreKey[];

export function detectLink(raw: string): { k: StoreKey; host: string; href: string } | null {
  const p = parseUrl(raw);
  if (!p.ok || !p.host) return null;
  const s = (p.path || '').split('/').filter(Boolean);
  for (const k of ST_ORDER) {
    if (STORES[k].test(p.host, s)) {
      return {
        k,
        host: p.host,
        href: STORES[k].canon ? STORES[k].canon!(p.host, s) : p.href || raw,
      };
    }
  }
  return null;
}

export function linksOf(l: Partial<Launch>): { href: string; host: string; k: StoreKey | '' }[] {
  const seen = new Set<string>();
  const v: { href: string; host: string; k: StoreKey | '' }[] = [];
  const rawList = [l.url, l.repo, ...(l.links || [])].filter(Boolean) as string[];

  rawList.forEach((raw) => {
    const p = parseUrl(raw);
    if (!p.ok || !p.host) return;
    const st = detectLink(p.href || raw);
    const href = st ? st.href : p.href || raw;
    if (seen.has(href)) return;
    seen.add(href);
    v.push({ href, host: p.host, k: st ? st.k : '' });
  });

  return v;
}

export function storesOf(l: Partial<Launch>): { href: string; host: string; k: StoreKey }[] {
  const seen = new Set<StoreKey>();
  const out: { href: string; host: string; k: StoreKey }[] = [];

  linksOf(l).forEach((x) => {
    if (x.k && !seen.has(x.k)) {
      seen.add(x.k);
      out.push({ href: x.href, host: x.host, k: x.k });
    }
  });

  return out.sort((a, b) => ST_ORDER.indexOf(a.k) - ST_ORDER.indexOf(b.k));
}

export function hasStore(l: Partial<Launch>, k: StoreKey): boolean {
  return storesOf(l).some((x) => x.k === k);
}

