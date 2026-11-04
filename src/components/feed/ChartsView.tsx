'use client';

import React from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { ChartKind, MainTab, PlatformKey } from '@/types/brunch';
import {
  PLAT,
  TABS,
  hot as calcHot,
  votes as calcVotes,
  tries as calcTries,
  isGH,
} from '@/data/seed';
import { LaunchRow } from '@/components/common/LaunchComponents';
import { Icon } from '@/components/icons/Icons';

const CHARTS: [ChartKind, string][] = [
  ['hot', 'Hot this week'],
  ['new', 'Newest'],
  ['top', 'Most upvoted'],
  ['tried', 'Most tried'],
];

export function ChartsView({ tab }: { tab: MainTab }) {
  const {
    allLaunches,
    engagement,
    chartFilter,
    setChartFilter,
    platformFilter,
    setPlatformFilter,
    githubOnlyFilter,
    setGithubOnlyFilter,
  } = useBrunch();

  const targetType = TABS[tab]?.type;
  let list = allLaunches.filter((x) => !targetType || x.type === targetType);

  if (platformFilter !== 'all') {
    list = list.filter((x) => x.plats.includes(platformFilter as PlatformKey));
  }

  if (githubOnlyFilter) {
    list = list.filter(isGH);
  }

  const currentChart = chartFilter[tab] || 'hot';

  if (currentChart === 'new') {
    list = [...list].sort((a, b) => b.ts - a.ts);
  } else if (currentChart === 'top') {
    list = [...list].sort((a, b) => calcVotes(b, engagement.votes) - calcVotes(a, engagement.votes));
  } else if (currentChart === 'tried') {
    list = [...list].sort((a, b) => calcTries(b, engagement.clicks) - calcTries(a, engagement.clicks));
  } else {
    list = [...list].sort((a, b) => calcHot(b, engagement.votes) - calcHot(a, engagement.votes));
  }

  return (
    <div className="stack" style={{ gap: '16px' }}>
      <div className="flex items-center gap-2">
        <div className="chips" role="group" aria-label="Chart type">
          {CHARTS.map(([key, label]) => (
            <button
              key={key}
              className="chip"
              aria-pressed={currentChart === key}
              onClick={() => setChartFilter(tab, key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <select
          className="sel"
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          aria-label="Platform"
        >
          <option value="all">Any platform</option>
          {Object.entries(PLAT).map(([pKey, pLabel]) => (
            <option key={pKey} value={pKey}>
              {pLabel}
            </option>
          ))}
        </select>

        <button
          className="chip"
          aria-pressed={githubOnlyFilter}
          onClick={() => setGithubOnlyFilter((prev) => !prev)}
        >
          <Icon name="branch" size={16} />
          <span>GitHub only</span>
        </button>
      </div>

      {list.length > 0 ? (
        <div className="grid-list">
          {list.map((item, index) => (
            <LaunchRow key={item.id} launch={item} rank={index + 1} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Icon name="search" size={44} />
          <b>Nothing matches</b>
          <span>Try another platform or turn off the GitHub filter.</span>
        </div>
      )}
    </div>
  );
}

