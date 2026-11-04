'use client';

import React from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { fmtN, votes as calcVotes, tries as calcTries, views as calcViews, getMakersList } from '@/data/seed';
import { LaunchRow, MakerAvatar } from '@/components/common/LaunchComponents';
import { Icon } from '@/components/icons/Icons';

export function SavedView({ sub }: { sub: 'saved' | 'mine' | 'following' }) {
  const {
    allLaunches,
    myLaunches,
    savedLaunches,
    engagement,
    go,
    openSheet,
    toggleFollow,
  } = useBrunch();

  const allMakers = getMakersList(allLaunches, engagement.votes, engagement.clicks, engagement.follows);
  const followingMakers = allMakers.filter((m) => !!engagement.follows[m.key]);

  const sections: [string, string, number][] = [
    ['saved', 'Saved', savedLaunches.length],
    ['mine', 'Your launches', myLaunches.length],
    ['following', 'Following', followingMakers.length],
  ];

  return (
    <div className="stack" style={{ gap: '14px' }}>
      <div className="chips" role="group" aria-label="Sections">
        {sections.map(([key, label, count]) => (
          <button
            key={key}
            className="chip cursor-pointer"
            aria-pressed={sub === key}
            onClick={() => go({ t: 'saved', sub: key as 'saved' | 'mine' | 'following' })}
          >
            {label}
            {count > 0 && <span> · {count}</span>}
          </button>
        ))}
      </div>

      {sub === 'saved' && (
        savedLaunches.length > 0 ? (
          <div className="grid-list">
            {savedLaunches.map((item) => (
              <LaunchRow key={item.id} launch={item} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <Icon name="bookmark" size={44} />
            <b>Nothing saved yet</b>
            <span>Tap “Save for later” on any launch to keep it here.</span>
            <button className="btn out" onClick={() => go({ t: 'tab', tab: 'home' })}>
              Find something
            </button>
          </div>
        )
      )}

      {sub === 'following' && (
        followingMakers.length > 0 ? (
          <div className="grid-list">
            {followingMakers.map((maker) => (
              <div key={maker.key} className="crow">
                <button
                  className="main cursor-pointer"
                  onClick={() => go({ t: 'maker', key: maker.key })}
                >
                  <MakerAvatar name={maker.name} makerKey={maker.key} size={48} />
                  <span className="tx">
                    <span className="nm">{maker.name}</span>
                    {maker.bio && <span className="tg">{maker.bio}</span>}
                    <span className="mt">
                      {maker.list.length} {maker.list.length === 1 ? 'launch' : 'launches'} ·{' '}
                      {fmtN(maker.votes)} upvotes
                    </span>
                  </span>
                </button>

                <div className="btns">
                  <button
                    className="btn out sm"
                    onClick={() => toggleFollow(maker.key)}
                  >
                    Following
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <Icon name="users" size={44} />
            <b>You are not following anyone yet</b>
            <span>Follow creators to keep track of what they make.</span>
            <button
              className="btn out"
              onClick={() => go({ t: 'tab', tab: 'home' })}
            >
              See the creator ranking
            </button>
          </div>
        )
      )}

      {sub === 'mine' && (
        myLaunches.length > 0 ? (
          <div>
            {myLaunches.map((item) => {
              const vCount = calcViews(item, engagement.views);
              const tCount = calcTries(item, engagement.clicks);
              const uCount = calcVotes(item, engagement.votes);

              return (
                <div key={item.id} className="border-b border-[var(--line)] pb-3 mb-2">
                  <LaunchRow launch={item} />
                  <div className="owner-acts flex items-center gap-2 pl-14 pt-1 flex-wrap">
                    <span className="count mr-auto">
                      {fmtN(vCount)} viewers · {fmtN(tCount)} tried it · {fmtN(uCount)} upvotes
                    </span>
                    <button
                      className="btn fill sm"
                      onClick={() => go({ t: 'dash', id: item.id })}
                    >
                      <Icon name="chart" size={16} />
                      <span>Dashboard</span>
                    </button>
                    <button
                      className="btn out sm"
                      onClick={() => go({ t: 'submit', edit: item.id })}
                    >
                      Edit
                    </button>
                    <button
                      className="btn text sm danger"
                      onClick={() => openSheet({ type: 'deleteLaunch', id: item.id })}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty">
            <Icon name="plus" size={44} />
            <b>You have not launched anything</b>
            <span>
              Put your game, app or tool where people can find it. Every launch gets its own dashboard.
            </span>
            <button className="btn fill" onClick={() => go({ t: 'submit' })}>
              Launch yours
            </button>
            <button
              className="btn text"
              onClick={() => {
                const sampleLaunch = allLaunches[0];
                if (sampleLaunch) {
                  go({ t: 'dash', id: sampleLaunch.id, demo: true });
                }
              }}
            >
              <Icon name="chart" size={18} />
              <span>See a sample dashboard</span>
            </button>
          </div>
        )
      )}
    </div>
  );
}
