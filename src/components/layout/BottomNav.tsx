'use client';

import React, { useEffect, useState } from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { Icon } from '@/components/icons/Icons';
import { TABS } from '@/data/seed';
import { MainTab } from '@/types/brunch';

export function BottomNav() {
  const { currentRoute, activeTab, setTab, go } = useBrunch();
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const y = window.scrollY;
      setCompact(y > 120 && y > lastY - 2);
      lastY = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isTop = currentRoute.t === 'tab' || currentRoute.t === 'saved';
  const isCommunity = currentRoute.t === 'tab' && currentRoute.tab === 'community';

  return (
    <>
      <nav className="bnav" aria-label="Primary">
        <div className="bnav-in">
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
        </div>
      </nav>

      {isTop && (
        <button
          className={`fab ${compact ? 'compact' : ''}`}
          onClick={() => (isCommunity ? go({ t: 'newpost' }) : go({ t: 'submit' }))}
          aria-label={isCommunity ? 'New post' : 'Launch yours'}
        >
          <Icon name="plus" size={24} />
          <span>{isCommunity ? 'Post' : 'Launch'}</span>
        </button>
      )}
    </>
  );
}

