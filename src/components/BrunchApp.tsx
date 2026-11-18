'use client';

import React from 'react';
import { useHydrated } from '@/lib/hydration';
import { useBrunch } from '@/context/BrunchContext';
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
import { ExploreView } from '@/components/explore/ExploreView';
import { ChatView } from '@/components/chat/ChatViews';

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
import { Lightbox, ShareModal, CreateMenuSheet } from '@/components/modals/MediaModals';
import { fmtN } from '@/data/seed';
import { Icon } from '@/components/icons/Icons';

function AppContent() {
  const mounted = useHydrated();

  const {
    currentRoute,
    dataStatus,
    dataError,
    retryRemoteData,
    subs,
    allCommunities,
    forumEngagement,
    toggleJoinCommunity,
    go,
    toast,
    lightbox,
    closeLightbox,
    shareLaunch,
    closeShareLaunch,
    createMenuOpen,
    closeCreateMenu,
  } = useBrunch();

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
        if (currentRoute.tab === 'explore') {
          return <ExploreView />;
        }

        if (currentRoute.tab === 'community') {
          if (subs.community === 'messages') {
            return <ChatView />;
          }

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

        const currentSub = (subs as Record<string, string>)[currentRoute.tab];
        if (currentSub === 'foryou') return <FeedView tab={currentRoute.tab} />;
        if (currentSub === 'charts') return <ChartsView tab={currentRoute.tab} />;
        if (currentSub === 'creators') return <CreatorsView />;
        if (currentSub === 'cats') return <CategoriesView tab={currentRoute.tab} />;
        return <FeedView tab={currentRoute.tab} />;
      }

      case 'me':
        return <MakerView makerKey="me" />;
      case 'chat':
        return <ChatView communityId={currentRoute.cid} initialChannel={currentRoute.ch} />;
      case 'launch':
        return <LaunchDetail launchId={currentRoute.id} />;
      case 'dash':
        return (
          <CreatorDashboard
            launchId={currentRoute.id}
            isDemo={currentRoute.demo}
            metric={currentRoute.m}
            days={currentRoute.d}
          />
        );
      case 'maker':
        return <MakerView makerKey={currentRoute.key} />;
      case 'comm': {
        const community = allCommunities.find((item) => item.id === currentRoute.id || item.slug === currentRoute.id);
        return <CommunityDetail communityId={community?.id || currentRoute.id} />;
      }
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

  if (dataStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center" role="status">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          <span className="text-sm text-[var(--fg-2)]">Loading Brunch…</span>
        </div>
      </div>
    );
  }

  if (dataStatus === 'error') {
    return (
      <main className="empty min-h-screen">
        <Icon name="alert" size={44} />
        <h1>Could not connect to Brunch</h1>
        <p>{dataError || 'The cloud database is unavailable. Your local drafts have not been overwritten.'}</p>
        <button className="btn fill" onClick={retryRemoteData}>Try again</button>
      </main>
    );
  }

  return (
    <div id="app" className="min-h-screen">
      <Rail />
      <div className="shell">
        <Header />
        <main className={`page ${currentRoute.t === 'chat' ? 'chatpg' : ''}`} id="main" tabIndex={-1}>

          {renderMain()}
        </main>
      </div>
      <BottomNav />
      <BrunchSheets />
      <AuthModal />
      <Toast />

      {/* Lightbox Modal */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={closeLightbox}
        />
      )}

      {/* Share Card Modal */}
      {shareLaunch && (
        <ShareModal
          launch={shareLaunch}
          onClose={closeShareLaunch}
          onToast={toast}
        />
      )}

      {/* Mobile Create Menu Sheet */}
      {createMenuOpen && (
        <CreateMenuSheet
          onClose={closeCreateMenu}
          onAction={(act) => {
            if (act === 'launch') go({ t: 'submit' });
            else if (act === 'comm') go({ t: 'newcomm' });
            else if (act === 'post') go({ t: 'newpost' });
          }}
        />
      )}
    </div>
  );
}

export default function BrunchApp() {
  return <AppContent />;
}
