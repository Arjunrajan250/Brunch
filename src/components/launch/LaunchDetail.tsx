'use client';

import React, { useEffect, useState } from 'react';
import { useBrunch } from '@/context/BrunchContext';
import {
  TYPE,
  PLAT,
  SUP,
  fmtN,
  ago,
  isGH,
  ghHref,
  platText,
  parseUrl,
  socialInfo,
  votes as calcVotes,
  tries as calcTries,
  followers as calcFollowers,
  rng,
} from '@/data/seed';
import {
  Carousel,
  GitHubBadge,
  LaunchCard,
  LaunchIcon,
  LaunchRow,
  MakerAvatar,
  VoteButton,
} from '@/components/common/LaunchComponents';
import { Glyph, Icon } from '@/components/icons/Icons';
import { Launch } from '@/types/brunch';

export function LaunchDetail({ launchId }: { launchId: string }) {
  const {
    allLaunches,
    engagement,
    go,
    toggleSave,
    recordTry,
    recordView,
    toggleFollow,
    openSheet,
    getComments,
    postComment,
    toast,
  } = useBrunch();

  const [commentText, setCommentText] = useState('');

  const launch = allLaunches.find((x) => x.id === launchId);

  useEffect(() => {
    if (launch) {
      recordView(launch.id);
    }
  }, [launch, recordView]);

  if (!launch) {
    return (
      <div className="empty">
        <Icon name="search" size={44} />
        <b>This launch is gone</b>
        <span>It may have been removed by its maker.</span>
        <button className="btn out" onClick={() => go({ t: 'tab', tab: 'home' })}>
          Back to Home
        </button>
      </div>
    );
  }

  const isSaved = !!engagement.saves[launch.id];
  const isOwner = !launch.sample; // In local prototype / dev mode
  const makerKey = launch.sample
    ? 's:' + launch.maker.toLowerCase().split(' ')[0]
    : launch.uid || 'n:' + launch.maker;

  const isFollowing = !!engagement.follows[makerKey];
  const followerCount = calcFollowers(makerKey, engagement.follows);

  const typeInfo = TYPE[launch.type] || { label: 'App', plural: 'Apps', glyph: 'grid', hue: 175 };
  const parsedLaunchUrl = parseUrl(launch.url);
  const isGhMain = parsedLaunchUrl.ok && parsedLaunchUrl.host === 'github.com';
  const hasRepo = launch.repo && launch.repo !== (parsedLaunchUrl.ok ? parsedLaunchUrl.href : '');
  const soc = socialInfo(launch.social || '');

  const comments = getComments(launch.id, 'launch');

  // Similar launches: same type or overlapping tags
  const similar = allLaunches
    .filter((x) => x.id !== launch.id)
    .map((x) => ({
      launch: x,
      score: (x.type === launch.type ? 2 : 0) + x.tags.filter((t) => launch.tags.includes(t)).length,
    }))
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score || calcVotes(b.launch, engagement.votes) - calcVotes(a.launch, engagement.votes))
    .slice(0, 10)
    .map((o) => o.launch);

  const moreFromMaker = allLaunches.filter((x) => x.id !== launch.id && x.maker === launch.maker).slice(0, 10);

  // Procedural mock screenshot generator if no uploaded screenshots
  const renderSampleShot = (i: number) => {
    const caps =
      launch.type === 'game'
        ? ['Jump into the action', 'Build your collection', 'Play with friends', 'New levels weekly']
        : ['Everything in one place', 'Made around your day', 'Fast, simple, private', 'Works offline too'];
    const r = rng(launch.id + i);
    const variant = i % 4;

    return (
      <div
        key={i}
        className="shot hu shrink-0"
        style={{ '--h': (launch.hue + i * 14) % 360 } as React.CSSProperties}
        role="img"
        aria-label={`Screenshot ${i + 1}`}
      >
        <span className="cap">{caps[i % 4]}</span>
        {variant === 0 && (
          <span className="blob">
            <Glyph name={launch.glyph} size={36} />
          </span>
        )}
        {variant === 1 && (
          <div className="flex flex-col gap-2 mt-1.5">
            {[0, 1, 2, 3].map((idx) => (
              <span key={idx} className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                <i className="w-5 h-5 rounded-full bg-white/30 shrink-0" />
                <b className="h-2 rounded bg-white/50" style={{ width: `${55 + Math.floor(r() * 35)}%` }} />
              </span>
            ))}
          </div>
        )}
        {variant === 2 && (
          <div className="flex-1 flex items-end gap-1.5 pt-2">
            {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
              <i
                key={idx}
                className={`flex-1 rounded-t ${idx % 3 === 0 ? 'bg-white/80' : 'bg-white/40'}`}
                style={{ height: `${25 + Math.floor(r() * 70)}%` }}
              />
            ))}
          </div>
        )}
        {variant === 3 && (
          <div className="flex-1 grid grid-cols-2 gap-2">
            <i className="rounded-xl bg-white/15" />
            <i className="rounded-xl bg-white/30" />
            <i className="rounded-xl bg-white/30" />
            <i className="rounded-xl bg-white/15" />
          </div>
        )}
      </div>
    );
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    postComment(launch.id, 'launch', commentText.trim().slice(0, 280));
    setCommentText('');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${launch.name}: ${launch.tag} (${window.location.href})`);
      toast('Copied to clipboard');
    }
  };

  return (
    <div className="d">
      <div className="d-main">
        {/* Header */}
        <section className="d-head">
          <LaunchIcon launch={launch} size={110} />
          <div className="min-w-0">
            <h1>{launch.name}</h1>
            <button
              className="byline cursor-pointer"
              onClick={() => go({ t: 'maker', key: makerKey })}
            >
              {launch.maker}
            </button>
            <span className="flags">
              {isGH(launch) && <GitHubBadge />}{' '}
              <span>{launch.tag}</span>
            </span>
          </div>
        </section>

        {/* Stats */}
        <section className="stats" aria-label="Launch facts">
          <div className="st">
            <b>{fmtN(calcVotes(launch, engagement.votes))}</b>
            <span>Upvotes</span>
          </div>
          <div className="st">
            <b>{fmtN(calcTries(launch, engagement.clicks))}</b>
            <span>Tried it</span>
          </div>
          <div className="st">
            <b>{typeInfo.label}</b>
            <span>Type</span>
          </div>
          <div className="st">
            <b>{launch.plats.length > 1 ? `${PLAT[launch.plats[0]]} +${launch.plats.length - 1}` : PLAT[launch.plats[0]]}</b>
            <span>Works on</span>
          </div>
        </section>

        {launch.sample && (
          <div className="notice">
            <Icon name="info" size={18} />
            <span>Sample listing. The link goes to a placeholder page, not a real project.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="acts">
          <div className="r1">
            {parsedLaunchUrl.ok ? (
              <a
                className="btn fill lg wide cursor-pointer"
                href={parsedLaunchUrl.href}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                onClick={() => recordTry(launch.id)}
              >
                <span>{isGhMain ? 'Open on GitHub' : 'Try it'}</span>
                <Icon name="external" size={18} />
              </a>
            ) : (
              <span className="btn out lg wide" aria-disabled="true">
                Link unavailable
              </span>
            )}
            <VoteButton launch={launch} lg />
          </div>

          {hasRepo && (
            <a
              className="btn out lg cursor-pointer"
              href={launch.repo}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
            >
              <Icon name="branch" size={18} />
              <span>View source on GitHub</span>
            </a>
          )}

          {parsedLaunchUrl.ok && (
            <p className="fine">
              Opens <b>{parsedLaunchUrl.host}</b> in a new tab. Brunch does not host this or check what is there.
            </p>
          )}

          <div className="r2">
            <button
              className="btn text"
              onClick={() => toggleSave(launch.id)}
              aria-pressed={isSaved}
            >
              <Icon name="bookmark" size={18} />
              <span>{isSaved ? 'Saved' : 'Save for later'}</span>
            </button>

            <button className="btn text" onClick={handleShare}>
              <Icon name="share" size={18} />
              <span>Share</span>
            </button>

            <button
              className="btn text"
              onClick={() => openSheet({ type: 'report', id: launch.id })}
            >
              <Icon name="flag" size={18} />
              <span>Report</span>
            </button>

            {isOwner && (
              <>
                <button
                  className="btn text"
                  onClick={() => go({ t: 'dash', id: launch.id })}
                >
                  <Icon name="chart" size={18} />
                  <span>Dashboard</span>
                </button>
                <button
                  className="btn text"
                  onClick={() => go({ t: 'submit', edit: launch.id })}
                >
                  <span>Edit</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Screenshots gallery */}
        <section>
          <div className="shots">
            {launch.shots && launch.shots.length > 0
              ? launch.shots.map((img, i) => (
                  <img
                    key={i}
                    className="shotimg"
                    src={img}
                    alt={`Screenshot ${i + 1} of ${launch.name}`}
                  />
                ))
              : [0, 1, 2, 3].map((i) => renderSampleShot(i))}
          </div>
        </section>

        {/* About */}
        <section>
          <div className="sec-h">
            <h2 className="h2">About this {typeInfo.label.toLowerCase()}</h2>
          </div>
          <div className="about">
            {launch.desc
              ? launch.desc.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)
              : <p>The maker has not added a description yet.</p>}
          </div>
          <div className="tags">
            {launch.tags.map((t) => (
              <button
                key={t}
                className="tag cursor-pointer"
                onClick={() =>
                  go({
                    t: 'coll',
                    title: `#${t}`,
                    ids: allLaunches.filter((x) => x.tags.includes(t)).map((x) => x.id),
                  })
                }
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Made By Maker Box */}
        <section>
          <div className="sec-h">
            <h2 className="h2">Made by</h2>
          </div>
          <div className="box">
            <div className="mcard">
              <MakerAvatar name={launch.maker} makerKey={makerKey} size={52} />
              <div className="min-w-0">
                <b>{launch.maker}</b>
                {launch.bio && <p className="text-[var(--fg-2)] text-[14px]">{launch.bio}</p>}
                <p className="count mt-0.5">{fmtN(followerCount)} followers</p>
              </div>
            </div>

            {soc && (
              <div className="chips wrap">
                <a
                  className="chip"
                  href={soc.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                >
                  <span>{soc.label}</span>
                  {soc.handle && <span>· {soc.handle}</span>}
                  <Icon name="external" size={14} />
                </a>
              </div>
            )}

            <div className="chips wrap">
              <button
                className="btn fill sm"
                aria-pressed={isFollowing}
                onClick={() => toggleFollow(makerKey)}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>

              <button
                className="btn out sm"
                onClick={() => go({ t: 'maker', key: makerKey })}
              >
                See all from {launch.maker}
              </button>
            </div>
          </div>
        </section>

        {/* Support */}
        <section>
          <div className="sec-h">
            <h2 className="h2">Support {launch.maker}</h2>
          </div>
          <button
            className="btn out w-full py-3"
            onClick={() => openSheet({ type: 'support', key: makerKey })}
          >
            <Icon name="heart" size={18} />
            <span>Ways to support {launch.maker}</span>
          </button>
        </section>

        {/* Feedback Section */}
        <section>
          <div className="sec-h">
            <h2 className="h2">Feedback</h2>
          </div>
          <form className="cf" onSubmit={handleCommentSubmit}>
            <div className="field">
              <label className="lbl" htmlFor="ct">
                Say something kind or useful
              </label>
              <textarea
                id="ct"
                maxLength={280}
                placeholder="What worked? What would make it better?"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <span className="cnt">{commentText.length} / 280</span>
            </div>
            <div className="formbar">
              <button className="btn fill sm" type="submit">
                Post
              </button>
            </div>
          </form>

          <div className="mt-3">
            {comments.length > 0 ? (
              comments.map((cm) => (
                <div key={cm.id} className="cm">
                  <MakerAvatar name={cm.name} makerKey={cm.name} size={36} />
                  <div className="min-w-0">
                    <b>{cm.name}</b>
                    <small>{ago(cm.ts)}</small>
                    <p>{cm.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="sub py-3">No feedback yet. Be the first to say something.</p>
            )}
          </div>
        </section>

        {/* Launch Info Details */}
        <section>
          <div className="sec-h">
            <h2 className="h2">Launch info</h2>
          </div>
          <dl className="info">
            <dt>Type</dt>
            <dd>{typeInfo.label}</dd>
            <dt>Works on</dt>
            <dd>{platText(launch)}</dd>
            <dt>Launched</dt>
            <dd>{ago(launch.ts)}</dd>
            <dt>Opens</dt>
            <dd>{parsedLaunchUrl.ok ? parsedLaunchUrl.host : 'Link unavailable'}</dd>
            {isGH(launch) && (
              <>
                <dt>Source</dt>
                <dd>{(ghHref(launch) || '').replace('https://', '')}</dd>
              </>
            )}
            <dt>Made by</dt>
            <dd>{launch.maker}</dd>
          </dl>
        </section>

        {/* More from Maker */}
        {moreFromMaker.length > 0 && (
          <section className="sec">
            <div className="sec-h">
              <h2 className="h2">More from {launch.maker}</h2>
            </div>
            <Carousel>
              {moreFromMaker.map((l) => (
                <LaunchCard key={l.id} launch={l} />
              ))}
            </Carousel>
          </section>
        )}

        {/* More like this (Mobile Carousel) */}
        <section className="hide-lg sec">
          <div className="sec-h">
            <h2 className="h2">More like this</h2>
          </div>
          {similar.length > 0 ? (
            <Carousel>
              {similar.map((l) => (
                <LaunchCard key={l.id} launch={l} />
              ))}
            </Carousel>
          ) : (
            <p className="sub">Nothing similar yet.</p>
          )}
        </section>
      </div>

      {/* Desktop Aside: More like this */}
      <aside className="side" aria-label="More like this">
        <div className="sec-h">
          <h2 className="h2">More like this</h2>
        </div>
        {similar.slice(0, 6).map((x) => (
          <LaunchRow key={x.id} launch={x} />
        ))}
      </aside>
    </div>
  );
}

