'use client';

import React from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { Icon } from '@/components/icons/Icons';
import { MainTab } from '@/types/brunch';

export function BottomNav() {
  const { currentRoute, activeTab, setTab, go, openCreateMenu } = useBrunch();

  const isHome = currentRoute.t === 'tab' && activeTab === 'home';
  const isExplore = currentRoute.t === 'tab' && activeTab === 'explore';
  const isCommunity = currentRoute.t === 'tab' && activeTab === 'community';
  const isMe = currentRoute.t === 'me' || (currentRoute.t === 'saved' && currentRoute.sub === 'mine');

  return (
    <nav className="bnav" aria-label="Primary">
      <div className="bnav-in" id="bnav-in">
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

        {/* Raised Add Button */}
        <div className="addw">
          <button
            className="add"
            onClick={openCreateMenu}
            aria-label="Create something new"
            aria-haspopup="dialog"
          >
            <Icon name="plus" size={26} />
          </button>
        </div>

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
      </div>
    </nav>
  );
}
