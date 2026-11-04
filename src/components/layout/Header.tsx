'use client';

import React, { useEffect, useState } from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { BrunchLogo, Icon } from '@/components/icons/Icons';
import { SUBS, TABS } from '@/data/seed';
import { MainTab } from '@/types/brunch';

export function Header() {
  const {
    currentRoute,
    activeTab,
    setTab,
    subs,
    setSubTab,
    go,
    back,
    makerName,
    openSheet,
    allCommunities,
    allPosts,
  } = useBrunch();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 4);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isTop = currentRoute.t === 'tab' || currentRoute.t === 'saved';
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
              </button>
              <button
                className="avatar av-in"
                onClick={() => openSheet({ type: 'profile' })}
                aria-label="Your profile and settings"
              >
                {initial}
              </button>
            </div>

            <button
              className="btn fill sm launch-btn"
              onClick={() => (isCommunity ? go({ t: 'newpost' }) : go({ t: 'submit' }))}
            >
              <Icon name="plus" size={16} />
              <span>{isCommunity ? 'New post' : 'Launch yours'}</span>
            </button>

            <button
              className="avatar av-out"
              onClick={() => openSheet({ type: 'profile' })}
              aria-label="Your profile and settings"
            >
              {initial}
            </button>
          </div>

          {currentRoute.t === 'tab' && SUBS[currentRoute.tab] && (
            <div className="tabs" role="tablist">
              {SUBS[currentRoute.tab].map(([key, label]) => {
                const isSelected = subs[currentRoute.tab] === key;
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
              value={currentRoute.q}
              onChange={(e) => go({ t: 'search', q: e.target.value, f: currentRoute.f })}
              autoFocus
            />
            {currentRoute.q && (
              <button
                className="ib"
                onClick={() => go({ t: 'search', q: '', f: currentRoute.f })}
                aria-label="Clear"
              >
                <Icon name="close" size={20} />
              </button>
            )}
          </div>
        </div>
      ) : currentRoute.t === 'launch' ? (
        <div className="hdr-in">
          <button className="ib" onClick={back} aria-label="Back">
            <Icon name="back" size={20} />
          </button>
          <span className="flex-1" />
          <button
            className="ib"
            onClick={() => go({ t: 'search', q: '', f: 'all' })}
            aria-label="Search"
          >
            <Icon name="search" size={20} />
          </button>
          <button
            className="ib"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            aria-label="Share"
          >
            <Icon name="share" size={20} />
          </button>
        </div>
      ) : (
        <div className="hdr-in">
          <button className="ib" onClick={back} aria-label="Back">
            <Icon name="back" size={20} />
          </button>
          <h1 className="title-h">{getRouteTitle()}</h1>
          <button
            className="ib"
            onClick={() => go({ t: 'search', q: '', f: 'all' })}
            aria-label="Search"
          >
            <Icon name="search" size={20} />
          </button>
        </div>
      )}
    </header>
  );
}
