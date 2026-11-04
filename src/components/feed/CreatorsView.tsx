'use client';

import React from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { CreatorRankKind } from '@/types/brunch';
import { getMakersList, fmtN } from '@/data/seed';
import { MakerAvatar } from '@/components/common/LaunchComponents';
import { Icon } from '@/components/icons/Icons';

const RANKS: [CreatorRankKind, string][] = [
  ['score', 'Overall'],
  ['votes', 'Upvotes'],
  ['fol', 'Followers'],
  ['hot', 'Rising'],
];

export function CreatorsView() {
  const {
    allLaunches,
    engagement,
    creatorRankKind,
    setCreatorRankKind,
    go,
    openSheet,
    toggleFollow,
  } = useBrunch();

  const makers = getMakersList(
    allLaunches,
    engagement.votes,
    engagement.clicks,
    engagement.follows
  );

  const sortedMakers = [...makers].sort((a, b) => {
    const valA = a[creatorRankKind];
    const valB = b[creatorRankKind];
    return valB - valA || b.score - a.score;
  });

  const top3 = sortedMakers.slice(0, 3);
  const rest = sortedMakers.slice(3);

  // Reorder for podium presentation: 2nd place on left, 1st place in center, 3rd place on right
  const podiumOrder = top3.length === 3 ? [1, 0, 2] : top3.map((_, i) => i);

  return (
    <div className="stack" style={{ gap: '16px' }}>
      <div className="sec-h" style={{ margin: 0 }}>
        <div>
          <h2 className="lead">Creator ranking</h2>
          <p className="sub">The people making the best small things on Brunch</p>
        </div>
        <button
          className="btn text sm"
          onClick={() => openSheet({ type: 'rankinfo' })}
        >
          How it works
        </button>
      </div>

      <div className="chips" role="group" aria-label="Rank by">
        {RANKS.map(([key, label]) => (
          <button
            key={key}
            className="chip"
            aria-pressed={creatorRankKind === key}
            onClick={() => setCreatorRankKind(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {top3.length > 0 && (
        <div className="podium">
          {podiumOrder.map((idx) => {
            const maker = top3[idx];
            if (!maker) return null;
            const rankNum = idx + 1;
            const isFirst = rankNum === 1;

            return (
              <button
                key={maker.key}
                className={`pod ${isFirst ? 'p1' : ''} cursor-pointer`}
                onClick={() => go({ t: 'maker', key: maker.key })}
              >
                <span className={`rkb r${rankNum}`}>{rankNum}</span>
                <MakerAvatar
                  name={maker.name}
                  makerKey={maker.key}
                  size={isFirst ? 76 : 56}
                />
                <b>{maker.name}</b>
                {creatorRankKind === 'score' ? (
                  <span className="mt pts">{fmtN(maker.score)} pts</span>
                ) : (
                  <span className="mt">{fmtN(maker.votes)} upvotes</span>
                )}
                <span className="mt">{fmtN(maker.fol)} followers</span>
              </button>
            );
          })}
        </div>
      )}

      {rest.length > 0 ? (
        <div className="grid-list">
          {rest.map((maker, index) => {
            const rank = index + 4;
            const isFollowing = !!engagement.follows[maker.key];

            return (
              <div key={maker.key} className="crow">
                <button
                  className="main cursor-pointer"
                  onClick={() => go({ t: 'maker', key: maker.key })}
                >
                  <span className="rk2">{rank}</span>
                  <MakerAvatar name={maker.name} makerKey={maker.key} size={48} />
                  <span className="tx">
                    <span className="nm">{maker.name}</span>
                    {maker.bio && <span className="tg">{maker.bio}</span>}
                    <span className="mt">
                      {creatorRankKind === 'score' ? (
                        <>
                          <b>{fmtN(maker.score)} pts</b> · {maker.list.length}{' '}
                          {maker.list.length === 1 ? 'launch' : 'launches'} ·{' '}
                          {fmtN(maker.fol)} followers
                        </>
                      ) : (
                        <>
                          {maker.list.length}{' '}
                          {maker.list.length === 1 ? 'launch' : 'launches'} ·{' '}
                          {fmtN(maker.votes)} upvotes · {fmtN(maker.fol)} followers
                        </>
                      )}
                    </span>
                  </span>
                </button>

                <div className="btns">
                  <button
                    className="btn out sm"
                    aria-pressed={isFollowing}
                    onClick={() => toggleFollow(maker.key)}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>

                  {maker.support.length > 0 && (
                    <button
                      className="btn text sm supb"
                      onClick={() => openSheet({ type: 'support', key: maker.key })}
                    >
                      <Icon name="heart" size={16} />
                      <span>Support</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        top3.length === 0 && (
          <div className="empty">
            <Icon name="users" size={44} />
            <b>No creators yet</b>
            <span>Launch something and you will show up here.</span>
            <button className="btn fill" onClick={() => go({ t: 'submit' })}>
              Launch yours
            </button>
          </div>
        )
      )}

      <section className="cta">
        <h2>Want to climb the list?</h2>
        <p>
          Launch something, add your support links and share it. Upvotes, tries and followers all count.
        </p>
        <button className="btn fill lg" onClick={() => go({ t: 'submit' })}>
          <Icon name="plus" size={18} />
          Launch yours
        </button>
      </section>
    </div>
  );
}
