'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { BrunchLogo, Icon } from '@/components/icons/Icons';
import { SUBS } from '@/data/seed';
import { MainTab } from '@/types/brunch';

export function Header() {
  const {
    currentRoute,
    setTab,
    subs,
    setSubTab,
    go,
    back,
    makerName,
    openSheet,
    allCommunities,
    allPosts,
    user,
    isBackendConnected,
    openAuthModal,
    unreadNotifs,
    openNotifsSheet,
  } = useBrunch();

  const [scrolled, setScrolled] = useState(false);
  const [searchDraft, setSearchDraft] = useState(currentRoute.t === 'search' ? currentRoute.q : '');
  const pendingSearch = useRef<string | null>(null);

  useEffect(() => {
    if (currentRoute.t !== 'search') {
      pendingSearch.current = null;
      return;
    }
    // Ignore older committed URLs while replace() catches up with typing.
    if (pendingSearch.current !== null && currentRoute.q !== pendingSearch.current) return;
    pendingSearch.current = null;
    setSearchDraft(currentRoute.q);
  }, [currentRoute]);

  const updateSearch = (query: string) => {
    if (currentRoute.t !== 'search') return;
    pendingSearch.current = query;
    setSearchDraft(query);
    go({ t: 'search', q: query, f: currentRoute.f }, { replace: true });
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 4);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut '/' to trigger search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        go({ t: 'search', q: '', f: 'all' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [go]);

  const isTop = currentRoute.t === 'tab' || currentRoute.t === 'saved' || currentRoute.t === 'me';
  const initial = (makerName || 'You').trim()[0]?.toUpperCase() || 'Y';
  const isCommunity = currentRoute.t === 'tab' && currentRoute.tab === 'community';

  const getRouteTitle = () => {
    switch (currentRoute.t) {
      case 'dash':
        return 'Dashboard';
      case 'comm': {
        const c = allCommunities.find((x) => x.id === currentRoute.id);
        return c ? `b/${c.slug}` : 'Community';
      }
      case 'post': {
        const p = allPosts.find((x) => x.id === currentRoute.id);
        const c = p ? allCommunities.find((x) => x.id === p.cid) : null;
        return c ? `b/${c.slug}` : 'Post';
      }
      case 'maker':
        return 'Creator';
      case 'me':
        return 'Your Profile';
      case 'submit':
        return currentRoute.edit ? 'Edit your launch' : 'Launch yours';
      case 'newcomm':
        return 'Create a community';
      case 'newpost':
        return 'New post';
      case 'coll':
        return currentRoute.title || 'Collection';
      case 'search':
        return 'Search';
      default:
        return '';
    }
  };

  return (
    <header className={`hdr ${scrolled ? 'scrolled' : ''}`}>
      {isTop ? (
        <>
          <div className="hdr-in">
            <button
              className="brand"
              onClick={() => setTab('home')}
              aria-label="Brunch home"
            >
              <BrunchLogo size={32} />
              <span>Brunch</span>
            </button>

            <div className="sbox">
              <button
                className="searchbar"
                onClick={() => go({ t: 'search', q: '', f: 'all' })}
              >
                <Icon name="search" size={20} />
                <span>Search launches, creators and communities</span>
                <kbd className="kbd" aria-hidden="true">/</kbd>
              </button>
            </div>

            {/* Notification Bell */}
            <button
              className="nb"
              onClick={openNotifsSheet}
              aria-label="Notifications"
            >
              <Icon name="bell" size={20} />
              {unreadNotifs > 0 && (
                <span className="nbd">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>

            {/* Database Status Pill */}
            <button
              onClick={openAuthModal}
              title={isBackendConnected ? 'Supabase Database Active' : 'Local Mode - Click to connect Supabase'}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isBackendConnected
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isBackendConnected ? 'PostgreSQL' : 'Local DB'}</span>
            </button>

            {!user && (
              <button
                className="btn ghost sm signin-btn text-xs font-semibold text-[var(--fg-2)] hover:text-[var(--fg)]"
                onClick={openAuthModal}
              >
                Sign in
              </button>
            )}

            <button
              className="btn fill sm launch-btn"
              onClick={() => (isCommunity ? go({ t: 'newpost' }) : go({ t: 'submit' }))}
            >
              <Icon name="plus" size={16} />
              <span>{isCommunity ? 'New post' : 'Launch yours'}</span>
            </button>

            <button
              className="avatar av-out"
              onClick={() => (user ? openSheet({ type: 'profile' }) : openAuthModal())}
              aria-label="Your profile and settings"
            >
              {initial}
            </button>
          </div>

          {currentRoute.t === 'tab' && SUBS[currentRoute.tab] && SUBS[currentRoute.tab].length > 0 && (
            <div className="tabs" role="tablist">
              {SUBS[currentRoute.tab].map(([key, label]) => {
                const isSelected = (subs as Record<string, string>)[currentRoute.tab] === key;
                return (
                  <button
                    key={key}
                    className="tab"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSubTab(currentRoute.tab as MainTab, key)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : currentRoute.t === 'search' ? (
        <div className="hdr-in">
          <button className="ib" onClick={back} aria-label="Back">
            <Icon name="back" size={20} />
          </button>
          <div className="sinput">
            <Icon name="search" size={20} />
            <input
              id="q"
              type="search"
              autoComplete="off"
              enterKeyHint="search"
              placeholder="Search launches, creators and communities"
              aria-label="Search launches, creators and communities"
              value={searchDraft}
              onChange={(e) => updateSearch(e.target.value)}
              autoFocus
            />
            {searchDraft && (
              <button
                className="ib"
                onClick={() => updateSearch('')}
                aria-label="Clear"
              >
                <Icon name="close" size={20} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="hdr-in">
          <button className="ib" onClick={back} aria-label="Back">
            <Icon name="back" size={20} />
          </button>
          <h1 className="title-h">{getRouteTitle()}</h1>
        </div>
      )}
    </header>
  );
}
