import { Launch, Community, Post, SupportLink, LaunchType, PlatformKey } from '@/types/brunch';

export const DAY = 864e5;

export const TYPE: Record<LaunchType, { label: string; plural: string; glyph: string; hue: number }> = {
  game: { label: 'Game', plural: 'Games', glyph: 'gamepad', hue: 280 },
  app:  { label: 'App',  plural: 'Apps',  glyph: 'grid',    hue: 175 },
  tool: { label: 'Tool', plural: 'Tools', glyph: 'hex',     hue: 215 }
};

export const TABS = {
  home: { label: 'Home', icon: 'home', type: '' },
  games: { label: 'Games', icon: 'games', type: 'game' },
  apps: { label: 'Apps', icon: 'apps', type: 'app' },
  tools: { label: 'Tools', icon: 'tools', type: 'tool' },
  community: { label: 'Community', icon: 'users', type: '' }
};

export const TYPE_SUBS: [string, string][] = [['foryou', 'For you'], ['charts', 'Top charts'], ['cats', 'Categories']];
export const SUBS: Record<string, [string, string][]> = {
  home: [['foryou', 'For you'], ['charts', 'Top charts'], ['creators', 'Creators'], ['cats', 'Categories']],
  games: TYPE_SUBS,
  apps: TYPE_SUBS,
  tools: TYPE_SUBS,
  community: [['feed', 'Feed'], ['explore', 'Communities']]
};

export const SUP: Record<string, { label: string; glyph: string; hint: string; id: boolean }> = {
  cash:  { label: 'Cash tip',   glyph: 'wallet', hint: 'Ko-fi, Buy Me a Coffee, PayPal.me, GitHub Sponsors', id: false },
  upi:   { label: 'UPI',        glyph: 'wallet', hint: 'Your UPI ID, like name@bank', id: true },
  ai:    { label: 'AI credits', glyph: 'bolt',   hint: 'A page where people can gift API or compute credits', id: false },
  other: { label: 'Other',      glyph: 'star',   hint: 'Merch, hire me, a wishlist, a thank-you page', id: false }
};

export const PLAT: Record<PlatformKey, string> = { w: 'Web', a: 'Android', i: 'iOS', d: 'Desktop', o: 'Other' };
export const TAGS = ['cozy','puzzle','multiplayer','offline','no signup','open source','jam entry','solo-dev','daily','privacy','design','productivity','music','learning','community','for fun'];
export const GLYPHS = ['gamepad','bolt','rocket','flame','star','dice','music','leaf','droplet','sun','moon','hex','target','pencil','camera','note','chat','globe','coffee','map','grid','book','headphones','shield'];
export const HUES = [5, 25, 45, 95, 130, 160, 185, 205, 225, 255, 285, 320];

export const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const rng = (seed: string | number) => {
  let s = hash(String(seed)) || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
};

export const pick = <T>(r: () => number, a: T[]): T => a[Math.floor(r() * a.length)];

export const MAKERS: Record<string, [string, string]> = {
  mara: ['Mara Okafor', 'Makes small cozy things after work. Mostly boats.'],
  kenji: ['Kenji & Ayo', 'Two friends, one game jam a month.'],
  devon: ['Devon Hale', 'Solo dev. Roguelikes and spreadsheets.'],
  inez: ['Inez Ortega', 'Word nerd. Daily puzzles, no ads.'],
  sam: ['Sam Patel', 'Builds tools for problems he had last week.'],
  noor: ['Noor Haddad', 'Designer who codes on weekends.'],
  lee: ['Lee Tran', 'Maths teacher who makes puzzles.'],
  jo: ['Jo Whitfield', 'Habit nerd. Android and a lot of tea.']
};

export const SAMPLE_REPO: Record<string, string> = {
  lumen: 'https://github.com/example/lumen',
  fieldnotes: 'https://github.com/example/fieldnotes',
  quietchess: 'https://github.com/example/quiet-chess',
  cutout: 'https://github.com/example/cutout'
};

export const SAMPLE_SUPPORT: Record<string, SupportLink[]> = {
  mara: [{ t: 'cash', l: 'Ko-fi', u: 'https://example.com/support/mara' }, { t: 'ai', l: 'Gift compute credits', u: 'https://example.com/support/mara-credits' }],
  devon: [{ t: 'cash', l: 'GitHub Sponsors', u: 'https://example.com/support/devon' }, { t: 'other', l: 'Hire me for a jam', u: 'https://example.com/hire/devon' }],
  noor: [{ t: 'cash', l: 'Buy Me a Coffee', u: 'https://example.com/support/noor' }, { t: 'upi', l: 'UPI', u: 'noor@examplebank' }],
  sam: [{ t: 'ai', l: 'Fund the API bill', u: 'https://example.com/support/sam-credits' }, { t: 'cash', l: 'Open Collective', u: 'https://example.com/support/sam' }],
  inez: [{ t: 'cash', l: 'Ko-fi', u: 'https://example.com/support/inez' }]
};

export const SAMPLE_FOL: Record<string, number> = {};
Object.keys(MAKERS).forEach(k => {
  SAMPLE_FOL['s:' + k] = 40 + (hash('fol' + k) % 420);
});

type RawSeed = [string, string, string, LaunchType, string, string[], string, string, number, number, number, number, string];

const RAW_SEED: RawSeed[] = [
  ['tidepool','Tidepool','Grow a reef and run a tiny harbour','game','wa',['cozy','solo-dev'],'mara','droplet',195,214,2,610,'Plant coral, trade with the next harbour over and watch the tides change what grows. Built over one winter and still getting small updates.'],
  ['rift','Rift Runner','An endless runner where the level collapses behind you','game','w',['jam entry','daily'],'kenji','bolt',280,168,1,520,'Made in 72 hours for a game jam and kept because people kept asking. One button, no menus, and a ghost of your best run.'],
  ['pocketdungeon','Pocket Dungeon','A roguelike that fits in one coffee break','game','ad',['offline','solo-dev'],'devon','flame',20,131,4,340,'Hand-built rooms, forty relics and a new run every time. Works offline, no ads, no timers.'],
  ['wordorchard','Word Orchard','A daily word grid with no timers and no streak guilt','game','wi',['daily','puzzle'],'inez','leaf',130,189,3,720,'One new grid every morning. Connect letters to grow your orchard. Skip a day and nothing bad happens.'],
  ['lumen','Lumen','Bend light with mirrors until the beam hits the goal','game','w',['puzzle','open source'],'lee','target',55,97,6,260,'Three hundred handmade rooms, from a first mirror to a prism that splits three ways. The source is on GitHub.'],
  ['quietchess','Quiet Chess','Chess against twelve calm opponents, offline','game','wd',['offline','puzzle'],'devon','dice',60,76,9,180,'No ratings and no clocks unless you want one. Daily puzzles and a game review that explains mistakes in plain words.'],
  ['cosmocats','Cosmo Cats','Merge cats until you reach the galaxy cat','game','w',['cozy','for fun'],'kenji','star',310,142,4,500,'Drop, match, merge. There are a hundred and twelve cats and every one has a one-line backstory.'],
  ['noisebox','Noise Box','Ten oddly satisfying sounds on one screen','game','w',['music','for fun'],'lee','headphones',285,49,13,120,'Pop, click, squish, repeat. No goal and no score, just ten sounds and a very small screen.'],
  ['sprout','Sprout','A tiny habit tracker that grows a garden','app','ai',['no signup','productivity'],'jo','leaf',125,143,3,410,'Tick a habit, watch a plant grow. Weekly review and gentle reminders, with nothing to sign into.'],
  ['fieldnotes','Fieldnotes','Plain-text notes that open instantly','app','ad',['open source','offline','productivity'],'sam','note',45,122,7,300,'Notes, checklists and tags in plain files you own. Opens in under a second and exports to anything.'],
  ['lingoloop','Lingo Loop','Ten-minute language drills with voice practice','app','wai',['learning','daily'],'noor','globe',175,88,5,230,'Short lessons with speaking practice and spaced repetition for thirty languages. Free while it is a side project.'],
  ['brewfinder','Brew Finder','Independent coffee near you, added by regulars','app','wa',['community'],'jo','coffee',25,64,11,150,'A map of independent cafes and roasters where every pin was added by someone who drinks there.'],
  ['weathergarden','Weather Garden','A garden that grows from today’s forecast','app','w',['cozy','for fun','design'],'mara','sun',45,71,6,200,'Sunny days bring sunflowers and drizzle brings ferns. Open it each morning to see what grew overnight.'],
  ['palettepal','Palette Pal','Pull a clean colour palette from any photo','tool','w',['design','no signup'],'noor','image',330,201,2,880,'Drop in a photo and get five colours with names and contrast checks. Runs in the browser, nothing is uploaded.'],
  ['quietalerts','Quiet Alerts','Get a ping when a price or page changes','tool','wo',['productivity','privacy'],'sam','bell',10,119,8,310,'Point it at a page and pick what to watch. Alerts arrive as one calm digest instead of a stream of pings.'],
  ['papercalc','Paper Calc','A calculator with a scrolling paper tape','tool','wa',['no signup'],'sam','hex',160,83,12,190,'Big keys, a history tape you can scroll back through and unit conversion that stays out of the way.'],
  ['tick','Tick','Tap-tempo metronome that works with the screen off','tool','a',['music','offline'],'devon','music',265,58,15,140,'Tap a tempo, set odd time signatures and keep practising with the screen off.'],
  ['cutout','Cutout','Remove a photo background without uploading it','tool','w',['privacy','no signup','design'],'noor','camera',335,176,1,640,'Runs entirely in your browser, so photos never leave your device. Export a transparent PNG in two clicks.']
];

const BASE_NOW = 1730700000000;

export const SAMPLES: Launch[] = RAW_SEED.map(([id, name, tag, type, p, tags, mk, glyph, hue, base, days, tried, desc]) => ({
  id: 's_' + id,
  name,
  tag,
  type,
  plats: p.split('') as PlatformKey[],
  tags,
  maker: MAKERS[mk][0],
  bio: MAKERS[mk][1],
  glyph,
  hue,
  icon: '',
  shots: [],
  repo: SAMPLE_REPO[id] || '',
  base,
  tried,
  desc,
  url: 'https://example.com/' + id,
  social: '',
  uid: '',
  ts: BASE_NOW - days * DAY - (hash(id) % 20) * 36e5,
  sample: true
}));

const CSEED: [string, string, string, string, number, number][] = [
  ['gamedev', 'Game makers', 'Builds, jam results and the thing that broke at 2am.', 'gamepad', 280, 1240],
  ['cozygames', 'Cozy corner', 'Gentle games, soft music and no timers.', 'leaf', 130, 980],
  ['tinytools', 'Tiny tools', 'Small utilities that people actually keep using.', 'hex', 215, 720],
  ['feedbackswap', 'Feedback swap', 'Try mine and I will try yours.', 'chat', 25, 1560],
  ['opensource', 'Open source for fun', 'Repos, patches and weekend forks.', 'rocket', 205, 640]
];

export const SAMPLE_COMMS: Community[] = CSEED.map(([slug, title, about, glyph, hue, base]) => ({
  id: 's_' + slug,
  slug,
  title,
  about,
  glyph,
  hue,
  uid: '',
  ts: BASE_NOW - (20 + (hash(slug) % 60)) * DAY,
  sample: true,
  base
}));

const PSEED: [string, string, string, string, number, number, number][] = [
  ['gamedev', 'What did you cut from your jam game at the last minute?', 'I cut the second boss and a whole settings menu. Nobody noticed. What did you cut, and do you miss it?', 'Priya S.', 1, 86, 6],
  ['gamedev', 'Weekly thread: show us what you are working on', 'Screenshots, links, half-finished ideas. All welcome. Say what kind of feedback you want and people will aim for that.', 'Marcus L.', 3, 142, 7],
  ['cozygames', 'Games that feel like a quiet evening?', 'Looking for things with no timers, no streaks and no pressure. Browser or mobile is fine.', 'Aiko T.', 2, 64, 5],
  ['cozygames', 'Is a daily puzzle better with or without a streak?', 'I built one without streaks and retention is fine, but I wonder if I am missing something.', 'Inez Ortega', 6, 51, 4],
  ['tinytools', 'Small utilities you use every single day', 'Mine is a tape calculator. What is the humblest tool you would hate to lose?', 'Daniel O.', 4, 73, 7],
  ['tinytools', 'Offline-first: worth the extra work?', 'Thinking about making my notes tool work fully offline. Is it worth it for a free side project?', 'Sam Patel', 9, 38, 3],
  ['feedbackswap', 'Try my reef game, I will try yours', 'It is a small cozy harbour sim. Looking for honest first impressions from the first five minutes.', 'Mara Okafor', 1, 29, 4],
  ['feedbackswap', 'What makes you click through to a launch?', 'Genuinely curious: the icon, the one-liner, the screenshots or the maker? What gets you to tap Try it?', 'Fatima R.', 5, 95, 7],
  ['opensource', 'Showing a repo next to a live demo: yes or no?', 'I link both. The demo is for people who just want to play and the repo is for people who want to poke around.', 'Devon Hale', 2, 57, 5],
  ['opensource', 'Good first issues for a puzzle engine', 'Tagged ten small issues in my mirror puzzle repo. Happy to review pull requests from first-timers.', 'Lee Tran', 7, 44, 3]
];

export const SAMPLE_POSTS: Post[] = PSEED.map(([c, title, body, author, days, score, cm], i) => ({
  id: 'sp_' + i,
  cid: 's_' + c,
  title,
  body,
  link: '',
  author,
  uid: '',
  ts: BASE_NOW - days * DAY - (hash(title) % 12) * 36e5,
  sample: true,
  base: score,
  cbase: cm
}));

export type ParsedUrlResult =
  | { ok: true; href: string; host: string; path: string; err?: string }
  | { ok: false; err: string; href?: string; host?: string; path?: string };

export function parseUrl(raw: string): ParsedUrlResult {
  if (!raw || typeof raw !== 'string') return { ok: false, err: 'Add a link' };
  raw = raw.trim();
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, err: 'That does not look like a link' };
  }
  if (!u.hostname.includes('.')) return { ok: false, err: 'Include a full web address (e.g. site.com)' };
  const h = u.hostname.toLowerCase();
  if (/^(localhost|127\.|0\.|192\.168\.|10\.)/.test(h)) return { ok: false, err: 'Link must be a public website' };
  return { ok: true, href: u.href, host: h.replace(/^www\./, ''), path: u.pathname };
}

const SOC: Record<string, string> = {
  'instagram.com': 'Instagram',
  'x.com': 'X',
  'twitter.com': 'X',
  'github.com': 'GitHub',
  'youtube.com': 'YouTube',
  'tiktok.com': 'TikTok',
  'bsky.app': 'Bluesky',
  'threads.net': 'Threads',
  'itch.io': 'itch.io',
  'ko-fi.com': 'Ko-fi'
};

export function socialInfo(url: string) {
  const p = parseUrl(url);
  if (!p.ok || !p.host) return null;
  const base = p.host.split('.').slice(-2).join('.');
  const label = SOC[p.host] || SOC[base] || p.host;
  const seg = p.path ? p.path.split('/').filter(Boolean)[0] : '';
  const handle = seg && !['in', 'user', 'channel'].includes(seg) ? '@' + seg : '';
  return { label, handle, href: p.href };
}

export const fmtN = (n: number) => {
  if (n >= 10000) return Math.round(n / 1000) + 'K';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};

export const ago = (ts: number) => {
  const s = (Date.now() - ts) / 1000;
  if (s < 90) return 'just now';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' hours ago';
  if (s < 86400 * 14) {
    const d = Math.round(s / 86400);
    return d + (d === 1 ? ' day ago' : ' days ago');
  }
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const votes = (l: Launch, cv: Record<string, number> = {}) => (l.base || 0) + (cv[l.id] || 0);
export const tries = (l: Launch, cc: Record<string, number> = {}) => (l.tried || 0) + (cc[l.id] || 0);
export const views = (l: Launch, cw: Record<string, number> = {}) => cw[l.id] || 0;
export const saves = (l: Launch, cs: Record<string, number> = {}) => cs[l.id] || 0;
export const hot = (l: Launch, cv: Record<string, number> = {}, now?: number) =>
  (votes(l, cv) + 1) / Math.pow(((now ?? (typeof window !== 'undefined' ? Date.now() : BASE_NOW)) - l.ts) / DAY + 2, 1.3);

export const isGH = (l: Launch) => !!(l.repo || (parseUrl(l.url).host === 'github.com'));
export const ghHref = (l: Launch) => l.repo || (parseUrl(l.url).host === 'github.com' ? l.url : '');
export const platText = (l: Launch) => l.plats.map(p => PLAT[p] || p).join(', ');

export const followers = (key: string, cf: Record<string, number> = {}) => (SAMPLE_FOL[key] || 0) + (cf[key] || 0);

export function getMakersList(allLaunches: Launch[], cv: Record<string, number> = {}, cc: Record<string, number> = {}, cf: Record<string, number> = {}) {
  const m = new Map<string, { key: string; name: string; bio: string; social: string; support: SupportLink[]; sample: boolean; uid?: string; list: Launch[]; votes: number; tries: number; hot: number; fol: number; score: number }>();
  allLaunches.forEach(l => {
    const mkKey = l.sample ? 's:' + (Object.keys(MAKERS).find(k => MAKERS[k][0] === l.maker) || l.maker) : (l.uid || 'n:' + l.maker);
    const existing = m.get(mkKey) || {
      key: mkKey,
      name: l.maker,
      bio: l.bio || '',
      social: l.social || '',
      support: (l.sample ? (SAMPLE_SUPPORT[Object.keys(MAKERS).find(k => MAKERS[k][0] === l.maker) || ''] || []) : []),
      sample: !!l.sample,
      uid: l.uid,
      list: [],
      votes: 0,
      tries: 0,
      hot: 0,
      fol: 0,
      score: 0
    };
    existing.list.push(l);
    existing.votes += votes(l, cv);
    existing.tries += tries(l, cc);
    existing.hot += hot(l, cv);
    m.set(mkKey, existing);
  });
  m.forEach(e => {
    e.fol = followers(e.key, cf);
    e.score = Math.round(e.votes + 0.3 * e.tries + 1.5 * e.fol);
  });
  return [...m.values()].sort((a, b) => b.score - a.score || b.votes - a.votes);
}
