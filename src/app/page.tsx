'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { BrunchProvider, useBrunch } from '@/context/BrunchContext';
import { Header } from '@/components/layout/Header';
import { Rail } from '@/components/layout/Rail';
import { BottomNav } from '@/components/layout/BottomNav';
import { Toast } from '@/components/ui/Toast';
import { BrunchSheets } from '@/components/modals/BrunchSheets';
import { AuthModal } from '@/components/auth/AuthModal';

import { FeedView } from '@/components/feed/FeedView';
import { ChartsView } from '@/components/feed/ChartsView';
import { CategoriesView } from '@/components/feed/CategoriesView';
import { CreatorsView } from '@/components/feed/CreatorsView';

import { LaunchDetail } from '@/components/launch/LaunchDetail';
import { LaunchForm } from '@/components/launch/LaunchForm';
import { CreatorDashboard } from '@/components/dashboard/CreatorDashboard';

import { CommunityFeed } from '@/components/community/CommunityFeed';
import {
  CommunityDetail,
  PostDetail,
  NewCommunityForm,
  NewPostForm,
} from '@/components/community/CommunityViews';

import { SearchView } from '@/components/search/SearchView';
import { SavedView } from '@/components/saved/SavedView';
import { MakerView } from '@/components/creator/MakerView';
import { CollectionView } from '@/components/common/CollectionView';
import { CommunityAvatar } from '@/components/community/CommunityFeed';
import { fmtN } from '@/data/seed';
import { Icon } from '@/components/icons/Icons';

function AppContent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { currentRoute, subs, allCommunities, forumEngagement, toggleJoinCommunity, go } = useBrunch();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const renderMain = () => {
    switch (currentRoute.t) {
      case 'tab': {
        if (currentRoute.tab === 'community') {
          if (subs.community === 'explore') {
            const list = [...allCommunities].sort(
              (a, b) =>
                (b.base || 0) + (forumEngagement.joined[b.id] ? 1 : 0) -
                ((a.base || 0) + (forumEngagement.joined[a.id] ? 1 : 0))
            );

            return (
              <div className="stack" style={{ gap: '16px' }}>
                <div className="sec-h" style={{ margin: 0 }}>
                  <div>
                    <h2 className="lead">Communities</h2>
                    <p className="sub">Find your people, or start a new one</p>
                  </div>
                  <button className="btn fill sm" onClick={() => go({ t: 'newcomm' })}>
                    <Icon name="plus" size={16} />
                    <span>Create</span>
                  </button>
                </div>

                <div className="grid-list">
                  {list.map((c) => {
                    const isJoined = !!forumEngagement.joined[c.id];
                    return (
                      <div key={c.id} className="lrow2">
                        <button
                          className="row cursor-pointer"
                          onClick={() => go({ t: 'comm', id: c.id })}
                        >
                          <CommunityAvatar community={c} size={52} />
                          <span className="tx">
                            <span className="nm">b/{c.slug}</span>
                            <span className="tg">{c.about || c.title}</span>
                            <span className="mt">
                              {fmtN((c.base || 0) + (isJoined ? 1 : 0))} members
                            </span>
                          </span>
                        </button>
                        <button
                          className="btn out sm"
                          aria-pressed={isJoined}
                          onClick={() => toggleJoinCommunity(c.id)}
                        >
                          {isJoined ? 'Joined' : 'Join'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          return <CommunityFeed />;
        }

        const currentSub = subs[currentRoute.tab];
        if (currentSub === 'foryou') return <FeedView tab={currentRoute.tab} />;
        if (currentSub === 'charts') return <ChartsView tab={currentRoute.tab} />;
        if (currentSub === 'creators') return <CreatorsView />;
        if (currentSub === 'cats') return <CategoriesView tab={currentRoute.tab} />;
        return <FeedView tab={currentRoute.tab} />;
      }

      case 'launch':
        return <LaunchDetail launchId={currentRoute.id} />;
      case 'dash':
        return <CreatorDashboard launchId={currentRoute.id} isDemo={currentRoute.demo} />;
      case 'maker':
        return <MakerView makerKey={currentRoute.key} />;
      case 'comm':
        return <CommunityDetail communityId={currentRoute.id} />;
      case 'post':
        return <PostDetail postId={currentRoute.id} />;
      case 'saved':
        return <SavedView sub={currentRoute.sub} />;
      case 'search':
        return <SearchView query={currentRoute.q} filter={currentRoute.f} />;
      case 'submit':
        return <LaunchForm editId={currentRoute.edit} />;
      case 'newcomm':
        return <NewCommunityForm />;
      case 'newpost':
        return <NewPostForm initialCommunityId={currentRoute.cid} />;
      case 'coll':
        return (
          <CollectionView
            title={currentRoute.title}
            launchIds={currentRoute.ids}
            rank={currentRoute.rank}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div id="app" className="min-h-screen">
      <Rail />
      <div className="shell">
        <Header />
        <main className="page" id="main" tabIndex={-1}>
          {renderMain()}
        </main>
      </div>
      <BottomNav />
      <BrunchSheets />
      <AuthModal />
      <Toast />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" />}>
      <BrunchProvider>
        <AppContent />
      </BrunchProvider>
    </Suspense>
  );
}
