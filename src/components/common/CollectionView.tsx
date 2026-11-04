'use client';

import React from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { LaunchRow } from './LaunchComponents';

export function CollectionView({
  title,
  launchIds,
  rank = false,
}: {
  title: string;
  launchIds: string[];
  rank?: boolean;
}) {
  const { allLaunches } = useBrunch();
  const launches = launchIds.map((id) => allLaunches.find((l) => l.id === id)).filter(Boolean) as typeof allLaunches;

  return (
    <div className="stack">
      <div className="sec-h">
        <h2 className="lead">{title}</h2>
      </div>

      {launches.length > 0 ? (
        <div className="grid-list">
          {launches.map((item, index) => (
            <LaunchRow key={item.id} launch={item} rank={rank ? index + 1 : undefined} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <b>Nothing here yet</b>
        </div>
      )}
    </div>
  );
}

