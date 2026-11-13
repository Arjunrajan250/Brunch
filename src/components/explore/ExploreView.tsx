'use client';

import React from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { Icon, Glyph } from '@/components/icons/Icons';
import { LaunchIcon, MakerAvatar } from '@/components/common/LaunchComponents';
import {
  TYPE,
  TAGS,
  TAGG,
  CHARTK,
  PAL,
  hash,
  sortTop,
  sortNew,
  sortTried,
  getMakersList,
} from '@/data/seed';
import { hasStore } from '@/data/stores';
import { Launch, LaunchType, ChartKind } from '@/types/brunch';

export function ExploreView() {
  const { allLaunches, go, setTab, setSubTab, setChartFilter } = useBrunch();

  const l = allLaunches;

  if (!l.length) {
    return (
      <div className="empty">
        <Icon name="compass" size={48} />
        <b>Nothing to explore yet</b>
        <p>Be the first to put something here.</p>
        <button className="btn fill" onClick={() => go({ t: 'submit' })}>
          Launch yours
        </button>
      </div>
    );
  }

  const nLaunch = (n: number) => n + (n === 1 ? ' launch' : ' launches');

  // Browse tiles
  const typeTiles = (Object.keys(TYPE) as LaunchType[]).map((t) => {
    const count = l.filter((x) => x.type === t).length;
    const def = TYPE[t];
    return {
      kind: 'type' as const,
      v: t,
      label: def.plural,
      count,
      hue: def.hue,
      glyph: def.glyph,
    };
  });

  const popularTags = TAGS.map((t) => [t, l.filter((x) => x.tags.includes(t)).length] as [string, number])
    .filter((x) => x[1] > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t, count]) => {
      const gStr = TAGG[t] || 'g:star';
      const [k, name] = gStr.split(':');
      return {
        kind: 'tag' as const,
        v: t,
        label: t.charAt(0).toUpperCase() + t.slice(1),
        count,
        hue: hash(t) % 360,
        isIcon: k === 'i',
        name,
      };
    });

  // Collections
  const collections = [
    {
      title: 'Games to lose an hour to',
      eb: 'Games',
      hue: 280,
      glyph: 'gamepad',
      items: sortTop(l.filter((x) => x.type === 'game')),
    },
    {
      title: 'Code you can read on GitHub',
      eb: 'Open source',
      hue: 232,
      isIcon: true,
      name: 'code',
      items: sortTop(l.filter((x) => hasStore(x, 'github'))),
    },
    {
      title: 'Little tools that earn their place',
      eb: 'Tools',
      hue: 192,
      glyph: 'hex',
      items: sortTop(l.filter((x) => x.type === 'tool')),
    },
    {
      title: 'Fresh from makers this week',
      eb: 'Just launched',
      hue: 40,
      glyph: 'rocket',
      items: sortNew(l),
    },
    {
      title: 'Install these on Android',
      eb: 'Google Play',
      hue: 150,
      isIcon: true,
      name: 'play',
      items: sortTop(l.filter((x) => hasStore(x, 'play'))),
    },
    {
      title: 'Made for iPhone and iPad',
      eb: 'App Store',
      hue: 322,
      isIcon: true,
      name: 'bag',
      items: sortTop(l.filter((x) => hasStore(x, 'appstore'))),
    },
    {
      title: 'The ones everyone opened',
      eb: 'Most tried',
      hue: 352,
      glyph: 'flame',
      items: sortTried(l),
    },
    {
      title: 'No wifi, no problem',
      eb: 'Offline',
      hue: 100,
      glyph: 'plane',
      items: sortTop(l.filter((x) => x.tags.includes('offline'))),
    },
  ].filter((c) => c.items.length > 0);

  const topMakers = getMakersList(l).slice(0, 3);

  return (
    <div className="stack xp" style={{ gap: '28px' }}>
      {/* Browse Grid */}
      <section>
        <h2 className="lead" style={{ marginBottom: '12px' }}>Browse</h2>
        <div className="gts">
          {typeTiles.map((tile) => (
            <button
              key={tile.v}
              className="gt hu"
              style={{ '--h': tile.hue } as React.CSSProperties}
              onClick={() => {
                setTab('home');
                setSubTab('home', 'charts');
              }}
            >
              <span className="gi">
                <Glyph name={tile.glyph} size={22} />
              </span>
              <span className="gx">
                <b>{tile.label}</b>
                <span>{nLaunch(tile.count)}</span>
              </span>
            </button>
          ))}

          {popularTags.map((tag) => (
            <button
              key={tag.v}
              className="gt hu"
              style={{ '--h': tag.hue } as React.CSSProperties}
              onClick={() => go({ t: 'search', q: tag.v, f: 'all' })}
            >
              <span className="gi">
                {tag.isIcon ? <Icon name={tag.name} size={22} /> : <Glyph name={tag.name} size={22} />}
              </span>
              <span className="gx">
                <b>{tag.label}</b>
                <span>{nLaunch(tag.count)}</span>
              </span>
            </button>
          ))}

          <button
            className="gt all"
            onClick={() => {
              setTab('home');
              setSubTab('home', 'charts');
            }}
          >
            <span className="gi">
              <Icon name="apps" size={22} />
            </span>
            <span className="gx">
              <b>See all</b>
              <span>Everything</span>
            </span>
          </button>
        </div>
      </section>

      {/* Chart Tiles */}
      <section aria-label="Charts">
        <div className="cts">
          {(['hot', 'new', 'top', 'tried'] as ChartKind[]).map((kind) => {
            const [title, sub, palKey, gStr] = CHARTK[kind];
            const [bg, fg] = PAL[palKey];
            const [k, name] = gStr.split(':');
            return (
              <button
                key={kind}
                className="ctile"
                style={{ '--cbg': bg, '--cfg': fg } as React.CSSProperties}
                onClick={() => {
                  setTab('home');
                  setSubTab('home', 'charts');
                  setChartFilter('home', kind);
                }}
              >
                <span className="ci mb-1">
                  {k === 'i' ? <Icon name={name} size={20} /> : <Glyph name={name} size={20} />}
                </span>
                <b>{title}</b>
                <span className="text-xs opacity-80">{sub}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Collections */}
      <section>
        <h2 className="lead" style={{ marginBottom: '12px' }}>Collections</h2>
        <div className="eds">
          {collections.map((col, idx) => (
            <button
              key={idx}
              className="ed hu cursor-pointer"
              style={{ '--h': col.hue } as React.CSSProperties}
              onClick={() =>
                go({
                  t: 'coll',
                  title: col.title,
                  ids: col.items.map((x: Launch) => x.id),
                })
              }
            >
              <div className="absolute right-0 bottom-0 pointer-events-none opacity-10">
                {col.isIcon ? (
                  <Icon name={col.name!} size={100} />
                ) : (
                  <Glyph name={col.glyph!} size={100} />
                )}
              </div>
              <span className="edt2 flex items-center justify-between w-full">
                <span className="tg2">{col.eb}</span>
                <span className="cnt text-xs font-semibold opacity-70">
                  {nLaunch(col.items.length)}
                </span>
              </span>
              <span className="edb flex items-end justify-between w-full mt-4">
                <span className="edt text-left font-bold text-base max-w-[180px]">
                  {col.title}
                </span>
                <span className="stk flex -space-x-2">
                  {col.items.slice(0, 3).map((item: Launch) => (
                    <LaunchIcon key={item.id} launch={item} size={34} />
                  ))}
                </span>
              </span>
            </button>
          ))}

          {topMakers.length > 0 && (
            <button
              className="ed hu cursor-pointer"
              style={{ '--h': 24 } as React.CSSProperties}
              onClick={() => {
                setTab('home');
                setSubTab('home', 'creators');
              }}
            >
              <div className="absolute right-0 bottom-0 pointer-events-none opacity-10">
                <Glyph name="star" size={100} />
              </div>
              <span className="edt2 flex items-center justify-between w-full">
                <span className="tg2">Creators</span>
                <span className="cnt text-xs font-semibold opacity-70">Ranking</span>
              </span>
              <span className="edb flex items-end justify-between w-full mt-4">
                <span className="edt text-left font-bold text-base max-w-[180px]">
                  Meet the people making these
                </span>
                <span className="stk av flex -space-x-2">
                  {topMakers.map((m) => (
                    <MakerAvatar key={m.key} name={m.name} makerKey={m.key} size={34} />
                  ))}
                </span>
              </span>
            </button>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta p-6 rounded-2xl bg-[var(--surface-2)] border border-[var(--line)] text-center my-4">
        <h2 className="text-xl font-bold font-heading mb-2">
          Built something? Put it where people can find it.
        </h2>
        <p className="text-sm text-[var(--fg-2)] max-w-lg mx-auto mb-4">
          Add a link, a one-line pitch and a way to follow you. It takes about two minutes and it is free.
        </p>
        <button
          className="btn fill lg inline-flex items-center gap-2"
          onClick={() => go({ t: 'submit' })}
        >
          <Icon name="plus" size={18} />
          <span>Launch yours</span>
        </button>
      </section>
    </div>
  );
}
