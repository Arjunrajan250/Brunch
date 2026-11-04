'use client';

import React from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { TYPE, isGH, votes as calcVotes, getMakersList } from '@/data/seed';
import { LaunchRow, MakerAvatar } from '@/components/common/LaunchComponents';
import { CommunityAvatar } from '@/components/community/CommunityFeed';
import { Icon } from '@/components/icons/Icons';

const TRENDING = ['puzzle', 'no signup', 'cozy', 'offline', 'github', 'daily', 'open source'];

export function SearchView({ query, filter }: { query: string; filter: string }) {
  const {
    allLaunches,
    allCommunities,
    engagement,
    recents,
    addRecentSearch,
    clearRecentSearches,
    go,
  } = useBrunch();

  const trimmedQuery = query.trim().toLowerCase();

  // If no query, show recents and trending tags
  if (!trimmedQuery) {
    return (
      <div className="sr">
        {recents.length > 0 && (
          <section>
            <div className="lh flex items-center justify-between gap-2.5 my-1.5">
              <h2 className="h2">Recent searches</h2>
              <button
                className="btn text sm"
                onClick={clearRecentSearches}
              >
                Clear
              </button>
            </div>
            {recents.map((item) => (
              <button
                key={item}
                className="rec cursor-pointer"
                onClick={() => {
                  go({ t: 'search', q: item, f: filter });
                }}
              >
                <Icon name="clock" size={20} />
                <span>{item}</span>
              </button>
            ))}
          </section>
        )}

        <section>
          <h2 className="h2 mb-3">Try searching for</h2>
          <div className="chips wrap">
            {TRENDING.map((tag) => (
              <button
                key={tag}
                className="chip cursor-pointer"
                onClick={() => {
                  addRecentSearch(tag);
                  go({ t: 'search', q: tag, f: filter });
                }}
              >
                <Icon name="search" size={16} />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Filter launches
  const searchTerms = trimmedQuery.split(/\s+/).filter(Boolean);
  let matchedLaunches = allLaunches
    .map((l) => {
      const name = l.name.toLowerCase();
      let score = 0;
      searchTerms.forEach((w) => {
        if (name.startsWith(w)) score += 3;
        else if (name.includes(w)) score += 2;
        if (l.maker.toLowerCase().includes(w)) score += 1.5;
        if (l.tags.some((t) => t.includes(w))) score += 1.5;
        if (TYPE[l.type]?.label.toLowerCase().startsWith(w)) score += 1;
        if (w.length >= 3 && isGH(l) && 'github'.startsWith(w)) score += 2;
        if ((l.tag + ' ' + l.desc).toLowerCase().includes(w)) score += 0.5;
      });
      return { launch: l, score };
    })
    .filter((x) => x.score > 0);

  if (filter !== 'all') {
    matchedLaunches = matchedLaunches.filter((x) => x.launch.type === filter);
  }

  const sortedLaunches = matchedLaunches
    .sort(
      (x, y) =>
        y.score - x.score ||
        calcVotes(y.launch, engagement.votes) - calcVotes(x.launch, engagement.votes)
    )
    .map((x) => x.launch);

  // Extras: Creators & Communities
  const allMakers = getMakersList(allLaunches, engagement.votes, engagement.clicks, engagement.follows);
  const matchedMakers =
    filter === 'all'
      ? allMakers
          .filter((m) =>
            searchTerms.every((w) =>
              (m.name + ' ' + m.bio).toLowerCase().includes(w)
            )
          )
          .slice(0, 4)
      : [];

  const matchedCommunities =
    filter === 'all'
      ? allCommunities
          .filter((c) =>
            searchTerms.every((w) =>
              (c.slug + ' ' + c.title + ' ' + c.about).toLowerCase().includes(w)
            )
          )
          .slice(0, 4)
      : [];

  const hasNoResults =
    sortedLaunches.length === 0 &&
    matchedMakers.length === 0 &&
    matchedCommunities.length === 0;

  const filterTabs: [string, string][] = [
    ['all', 'All'],
    ['game', 'Games'],
    ['app', 'Apps'],
    ['tool', 'Tools'],
  ];

  return (
    <div className="sr">
      <div className="chips" role="group" aria-label="Filters">
        {filterTabs.map(([fKey, fLabel]) => (
          <button
            key={fKey}
            className="chip cursor-pointer"
            aria-pressed={filter === fKey}
            onClick={() => go({ t: 'search', q: query, f: fKey })}
          >
            {fLabel}
          </button>
        ))}
      </div>

      {sortedLaunches.length > 0 && (
        <section>
          <p className="count mb-2">
            {sortedLaunches.length} launch{sortedLaunches.length > 1 ? 'es' : ''} for “{query}”
          </p>
          <div className="grid-list">
            {sortedLaunches.map((item) => (
              <LaunchRow key={item.id} launch={item} />
            ))}
          </div>
        </section>
      )}

      {matchedMakers.length > 0 && (
        <section>
          <h2 className="h2 mb-2">Creators</h2>
          <div className="grid-list">
            {matchedMakers.map((maker) => (
              <div key={maker.key} className="crow">
                <button
                  className="main cursor-pointer"
                  onClick={() => go({ t: 'maker', key: maker.key })}
                >
                  <MakerAvatar name={maker.name} makerKey={maker.key} size={48} />
                  <span className="tx">
                    <span className="nm">{maker.name}</span>
                    {maker.bio && <span className="tg">{maker.bio}</span>}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {matchedCommunities.length > 0 && (
        <section>
          <h2 className="h2 mb-2">Communities</h2>
          <div className="grid-list">
            {matchedCommunities.map((c) => (
              <div key={c.id} className="lrow2">
                <button
                  className="row cursor-pointer"
                  onClick={() => go({ t: 'comm', id: c.id })}
                >
                  <CommunityAvatar community={c} size={48} />
                  <span className="tx">
                    <span className="nm">b/{c.slug}</span>
                    <span className="tg">{c.about || c.title}</span>
                  </span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasNoResults && (
        <div className="empty">
          <Icon name="search" size={44} />
          <b>No results for “{query}”</b>
          <span>Try a different word, or launch the thing you were hoping to find.</span>
        </div>
      )}
    </div>
  );
}
