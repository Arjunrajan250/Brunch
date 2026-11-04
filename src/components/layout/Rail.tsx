'use client';

import React from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { BrunchLogo, Icon } from '@/components/icons/Icons';
import { TABS } from '@/data/seed';
import { MainTab } from '@/types/brunch';

export function Rail() {
  const { currentRoute, activeTab, setTab, go } = useBrunch();

  const isSaved = currentRoute.t === 'saved' && currentRoute.sub !== 'mine';
  const isMine = currentRoute.t === 'saved' && currentRoute.sub === 'mine';

  return (
    <aside className="rail" aria-label="Primary">
      <button
        className="brand rail-brand"
        onClick={() => setTab('home')}
        aria-label="Brunch home"
      >
        <BrunchLogo size={32} />
        <span>Brunch</span>
      </button>

      {(Object.keys(TABS) as MainTab[]).map((tabKey) => {
        const tab = TABS[tabKey];
        const isActive = currentRoute.t === 'tab' && activeTab === tabKey;
        return (
          <button
            key={tabKey}
            className="ni"
            onClick={() => setTab(tabKey)}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="pill">
              <Icon name={tab.icon} size={22} />
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}

      <div className="h-[1px] bg-[var(--line)] self-stretch mx-[14px] my-[6px] shrink-0" />

      <button
        className="ni"
        onClick={() => go({ t: 'saved', sub: 'saved' })}
        aria-current={isSaved ? 'page' : undefined}
      >
        <span className="pill">
          <Icon name="bookmark" size={22} />
        </span>
        <span>Saved</span>
      </button>

      <button
        className="ni"
        onClick={() => go({ t: 'saved', sub: 'mine' })}
        aria-current={isMine ? 'page' : undefined}
      >
        <span className="pill">
          <Icon name="chart" size={22} />
        </span>
        <span>Launches</span>
      </button>
    </aside>
  );
}
