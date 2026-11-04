'use client';

import React from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { Launch, MainTab } from '@/types/brunch';
import {
  TABS,
  TYPE,
  hot as calcHot,
  votes as calcVotes,
  tries as calcTries,
  getMakersList,
  fmtN,
  isGH,
} from '@/data/seed';
import {
  Carousel,
  LaunchCard,
  LaunchIcon,
  LaunchRow,
  MakerAvatar,
} from '@/components/common/LaunchComponents';
import { Glyph, Icon } from '@/components/icons/Icons';

export function FeedView({ tab }: { tab: MainTab }) {
  const { allLaunches, allPosts, allCommunities, engagement, go, setSubTab } = useBrunch();
  const targetType = TABS[tab]?.type;

  const launches = allLaunches.filter((x) => !targetType || x.type === targetType);
  const typePlural = targetType ? TYPE[targetType as keyof typeof TYPE]?.plural.toLowerCase() : 'launches';

  const sortHot = (list: Launch[]) => [...list].sort((a, b) => calcHot(b, engagement.votes) - calcHot(a, engagement.votes));
  const sortNew = (list: Launch[]) => [...list].sort((a, b) => b.ts - a.ts);
  const sortTop = (list: Launch[]) => [...list].sort((a, b) => calcVotes(b, engagement.votes) - calcVotes(a, engagement.votes));
  const sortTried = (list: Launch[]) => [...list].sort((a, b) => calcTries(b, engagement.clicks) - calcTries(a, engagement.clicks));

  const hotList = sortHot(launches);
  const topList = sortTop(launches);
  const newList = sortNew(launches);
  const triedList = sortTried(launches);

  const creators = getMakersList(launches, engagement.votes, engagement.clicks, engagement.follows).slice(0, 12);

  if (!launches.length) {
    return (
      <div className="empty">
        <Icon name="apps" size={44} />
        <b>Nothing here yet</b>
        <span>Be the first to put something here.</span>
        <button className="btn fill" onClick={() => go({ t: 'submit' })}>
          Launch yours
        </button>
      </div>
    );
  }

  // Section with 3 rows per column
  const renderColumns = (list: Launch[]) => {
    const cols: React.ReactNode[] = [];
    const items = list.slice(0, 12);
    for (let i = 0; i < items.length; i += 3) {
      cols.push(
        <div key={i} className="col">
          {items.slice(i, i + 3).map((l) => (
            <LaunchRow key={l.id} launch={l} />
          ))}
        </div>
      );
    }
    return cols;
  };

  return (
    <div className="stack">
      {/* Featured / Hero Promo Carousel */}
      <section className="sec">
        <Carousel>
          <div className="promo brandp">
            <Glyph name="rocket" className="bg" />
            <span className="eb">Free for makers</span>
            <h3>Made for fun. Found here.</h3>
            <p>Put your game, app or tool where people can find it.</p>
            <button className="pbtn" onClick={() => go({ t: 'submit' })}>
              <Icon name="plus" size={16} />
              Launch yours
            </button>
          </div>

          {hotList.slice(0, 4).map((item, idx) => {
            const label = idx === 0 ? 'Hot this week' : calcVotes(item, engagement.votes) > 120 ? 'Popular' : 'New to Brunch';
            return (
              <button
                key={item.id}
                className="promo hu text-left cursor-pointer"
                style={{ '--h': item.hue } as React.CSSProperties}
                onClick={() => go({ t: 'launch', id: item.id })}
              >
                <Glyph name={item.glyph} className="bg" />
                <LaunchIcon launch={item} size={52} />
                <span className="eb">{label}</span>
                <h3>{item.name}</h3>
                <p>{item.tag}</p>
              </button>
            );
          })}
        </Carousel>
      </section>

      {/* Suggested for you */}
      <section className="sec">
        <div className="sec-h">
          <div>
            <h2>Suggested for you</h2>
            <p className="sub">Most upvoted {typePlural}</p>
          </div>
          <button
            className="more"
            onClick={() => go({ t: 'coll', title: `Suggested ${typePlural}`, ids: topList.map((x) => x.id) })}
            aria-label="See all suggested"
          >
            <Icon name="chev" size={20} />
          </button>
        </div>
        <Carousel>
          {topList.slice(0, 14).map((l) => (
            <LaunchCard key={l.id} launch={l} />
          ))}
        </Carousel>
      </section>

      {/* Hot this week (3-item columns) */}
      <section className="sec">
        <div className="sec-h">
          <div>
            <h2>Hot this week</h2>
            <p className="sub">Newer launches get a boost</p>
          </div>
          <button
            className="more"
            onClick={() => go({ t: 'coll', title: 'Hot this week', ids: hotList.map((x) => x.id), rank: true })}
            aria-label="See all hot launches"
          >
            <Icon name="chev" size={20} />
          </button>
        </div>
        <Carousel>{renderColumns(hotList)}</Carousel>
      </section>

      {/* New launches */}
      <section className="sec">
        <div className="sec-h">
          <div>
            <h2>New launches</h2>
            <p className="sub">Freshly arrived</p>
          </div>
          <button
            className="more"
            onClick={() => go({ t: 'coll', title: 'New launches', ids: newList.map((x) => x.id) })}
            aria-label="See all new launches"
          >
            <Icon name="chev" size={20} />
          </button>
        </div>
        <Carousel>
          {newList.slice(0, 14).map((l) => (
            <LaunchCard key={l.id} launch={l} />
          ))}
        </Carousel>
      </section>

      {/* Top creators */}
      <section className="sec">
        <div className="sec-h">
          <div>
            <h2>Top creators</h2>
            <p className="sub">Ranked by upvotes, tries and followers</p>
          </div>
          <button
            className="more"
            onClick={() => setSubTab('home', 'creators')}
            aria-label="See the creator ranking"
          >
            <Icon name="chev" size={20} />
          </button>
        </div>
        <Carousel>
          {creators.map((maker, idx) => (
            <button
              key={maker.key}
              className="mk cursor-pointer"
              onClick={() => go({ t: 'maker', key: maker.key })}
            >
              <span className="relative flex justify-center">
                <MakerAvatar name={maker.name} makerKey={maker.key} size={72} />
                <span className={`rkb ${idx < 3 ? `r${idx + 1}` : ''}`}>{idx + 1}</span>
              </span>
              <b>{maker.name}</b>
              <span>{fmtN(maker.fol)} followers</span>
            </button>
          ))}
        </Carousel>
      </section>

      {/* Tab-specific highlights on Home tab */}
      {tab === 'home' ? (
        <>
          {/* Games to lose an hour to */}
          {topList.some((x) => x.type === 'game') && (
            <section className="sec">
              <div className="sec-h">
                <div>
                  <h2>Games to lose an hour to</h2>
                  <p className="sub">Playable right now</p>
                </div>
                <button
                  className="more"
                  onClick={() => go({ t: 'coll', title: 'Games to lose an hour to', ids: topList.filter((x) => x.type === 'game').map((x) => x.id) })}
                  aria-label="See all games"
                >
                  <Icon name="chev" size={20} />
                </button>
              </div>
              <Carousel>{renderColumns(topList.filter((x) => x.type === 'game'))}</Carousel>
            </section>
          )}

          {/* Open source on GitHub */}
          {topList.some(isGH) && (
            <section className="sec">
              <div className="sec-h">
                <div>
                  <h2>Open source on GitHub</h2>
                  <p className="sub">Projects with their code in the open</p>
                </div>
                <button
                  className="more"
                  onClick={() => go({ t: 'coll', title: 'Open source on GitHub', ids: topList.filter(isGH).map((x) => x.id) })}
                  aria-label="See all open source projects"
                >
                  <Icon name="chev" size={20} />
                </button>
              </div>
              <Carousel>
                {topList.filter(isGH).slice(0, 14).map((l) => (
                  <LaunchCard key={l.id} launch={l} />
                ))}
              </Carousel>
            </section>
          )}

          {/* Little tools */}
          {topList.some((x) => x.type === 'tool') && (
            <section className="sec">
              <div className="sec-h">
                <div>
                  <h2>Little tools that earn their place</h2>
                  <p className="sub">Practical and lightweight</p>
                </div>
                <button
                  className="more"
                  onClick={() => go({ t: 'coll', title: 'Little tools that earn their place', ids: topList.filter((x) => x.type === 'tool').map((x) => x.id) })}
                  aria-label="See all tools"
                >
                  <Icon name="chev" size={20} />
                </button>
              </div>
              <Carousel>{renderColumns(topList.filter((x) => x.type === 'tool'))}</Carousel>
            </section>
          )}

          {/* Hot in communities */}
          {allPosts.length > 0 && (
            <section className="sec">
              <div className="sec-h">
                <div>
                  <h2>Hot in communities</h2>
                  <p className="sub">What people are talking about</p>
                </div>
                <button
                  className="more"
                  onClick={() => go({ t: 'tab', tab: 'community' })}
                  aria-label="Open communities"
                >
                  <Icon name="chev" size={20} />
                </button>
              </div>
              <div className="grid-list">
                {allPosts.slice(0, 4).map((post) => {
                  const comm = allCommunities.find((c) => c.id === post.cid);
                  return (
                    <article key={post.id} className="post">
                      <div className="post-meta">
                        {comm && (
                          <button
                            className="cmeta"
                            onClick={() => go({ t: 'comm', id: comm.id })}
                          >
                            <b>b/{comm.slug}</b>
                          </button>
                        )}
                        <span>·</span>
                        <span>{post.author}</span>
                      </div>
                      <button
                        className="post-main cursor-pointer"
                        onClick={() => go({ t: 'post', id: post.id })}
                      >
                        <h3>{post.title}</h3>
                        {post.body && <p className="pv-body">{post.body}</p>}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </>
      ) : (
        /* Most tried section for specific categories */
        <section className="sec">
          <div className="sec-h">
            <div>
              <h2>Tried by the most people</h2>
              <p className="sub">Most tapped {typePlural}</p>
            </div>
            <button
              className="more"
              onClick={() => go({ t: 'coll', title: `Most tried ${typePlural}`, ids: triedList.map((x) => x.id) })}
              aria-label="See all most tried"
            >
              <Icon name="chev" size={20} />
            </button>
          </div>
          <Carousel>
            {triedList.slice(0, 14).map((l) => (
              <LaunchCard key={l.id} launch={l} />
            ))}
          </Carousel>
        </section>
      )}

      {/* Call to action */}
      <section className="cta">
        <h2>Built something? Put it where people can find it.</h2>
        <p>
          Add a link, a one-line pitch and a way to follow you. It takes about two minutes, it is free, and people tap straight through to your own page.
        </p>
        <button className="btn fill lg" onClick={() => go({ t: 'submit' })}>
          <Icon name="plus" size={18} />
          Launch yours
        </button>
      </section>
    </div>
  );
}

