'use client';

import React from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { BrunchLogo, Icon } from '@/components/icons/Icons';

export function Rail() {
  const { currentRoute, activeTab, setTab, go } = useBrunch();

  const isHome = currentRoute.t === 'tab' && activeTab === 'home';
  const isExplore = currentRoute.t === 'tab' && activeTab === 'explore';
  const isCommunity = currentRoute.t === 'tab' && activeTab === 'community';
  const isMe = currentRoute.t === 'me' || (currentRoute.t === 'saved' && currentRoute.sub === 'mine');

  return (
    <aside className="rail" id="rail" aria-label="Primary">
      <button
        className="brand rail-brand"
        onClick={() => setTab('home')}
        aria-label="Brunch home"
      >
        <BrunchLogo size={32} />
        <span>Brunch</span>
      </button>

      {/* Home */}
      <button
        className="ni"
        onClick={() => setTab('home')}
        aria-current={isHome ? 'page' : undefined}
      >
        <span className="pill">
          <Icon name="home" size={22} />
        </span>
        <span>Home</span>
      </button>

      {/* Explore */}
      <button
        className="ni"
        onClick={() => setTab('explore')}
        aria-current={isExplore ? 'page' : undefined}
      >
        <span className="pill">
          <Icon name="compass" size={22} />
        </span>
        <span>Explore</span>
      </button>

      {/* Community */}
      <button
        className="ni"
        onClick={() => setTab('community')}
        aria-current={isCommunity ? 'page' : undefined}
      >
        <span className="pill">
          <Icon name="users" size={22} />
        </span>
        <span>Community</span>
      </button>

      {/* Profile */}
      <button
        className="ni"
        onClick={() => go({ t: 'me', sub: 'launches' })}
        aria-current={isMe ? 'page' : undefined}
      >
        <span className="pill">
          <Icon name="user" size={22} />
        </span>
        <span>Profile</span>
      </button>

      <div className="h-[1px] bg-[var(--line)] self-stretch mx-[14px] my-[10px] shrink-0" />

      {/* Launch Yours Button */}
      <button
        className="btn fill sm rail-launch mx-2"
        onClick={() => go({ t: 'submit' })}
        aria-label="Launch yours"
        title="Launch yours"
      >
        <Icon name="plus" size={16} />
        <span>Launch yours</span>
      </button>
    </aside>
  );
}
