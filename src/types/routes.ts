import type { MainTab, MetricType } from '@/types/brunch';

export type Route =
  | { t: 'tab'; tab: MainTab; sub?: string }
  | { t: 'me'; sub?: 'launches' | 'saved' | 'following' }
  | { t: 'launch'; id: string }
  | { t: 'dash'; id: string; demo?: boolean; m?: MetricType; d?: number }
  | { t: 'maker'; key: string }
  | { t: 'comm'; id: string; ctab?: 'posts' | 'members' }
  | { t: 'post'; id: string }
  | { t: 'saved'; sub: 'saved' | 'mine' | 'following' }
  | { t: 'search'; q: string; f: string }
  | { t: 'submit'; edit?: string }
  | { t: 'newcomm' }
  | { t: 'newpost'; cid?: string }
  | { t: 'coll'; title: string; ids: string[]; rank?: boolean }
  | { t: 'chat'; cid?: string; ch?: string };
