'use client';

import React from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { Post, Community } from '@/types/brunch';
import { fmtN, ago, parseUrl } from '@/data/seed';
import { Carousel } from '@/components/common/LaunchComponents';
import { Glyph, Icon } from '@/components/icons/Icons';

export function CommunityAvatar({ community, size = 36 }: { community: Community; size?: number }) {
  return (
    <span
      className="cav hu"
      style={{ '--h': community.hue, '--s': `${size}px` } as React.CSSProperties}
      aria-hidden="true"
    >
      <Glyph name={community.glyph} size={Math.round(size * 0.55)} />
    </span>
  );
}

export function PostVotingPill({ post }: { post: Post }) {
  const { forumEngagement, votePost } = useBrunch();
  const dir = forumEngagement.pv[post.id] || 0;
  const currentScore = (post.base || 1) + (forumEngagement.pv[post.id] || 0);

  return (
    <span className="pv" role="group" aria-label="Vote">
      <button
        className={`pu ${dir === 1 ? 'text-[var(--ink)]' : ''}`}
        aria-pressed={dir === 1}
        onClick={() => votePost(post.id, 1)}
        aria-label="Upvote"
      >
        <Icon name="up" size={18} />
      </button>
      <span>{fmtN(currentScore)}</span>
      <button
        className={`pd ${dir === -1 ? 'text-[var(--danger)]' : ''}`}
        aria-pressed={dir === -1}
        onClick={() => votePost(post.id, -1)}
        aria-label="Downvote"
      >
        <Icon name="down" size={18} />
      </button>
    </span>
  );
}

export function PostCard({ post, noCommunity = false }: { post: Post; noCommunity?: boolean }) {
  const { allCommunities, forumEngagement, go, toast } = useBrunch();
  const community = allCommunities.find((c) => c.id === post.cid);
  const commentCount = (post.cbase || 0) + (forumEngagement.pc[post.id] || 0);
  const linkParsed = post.link ? parseUrl(post.link) : null;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${post.title} (b/${community?.slug || 'brunch'})`);
      toast('Copied link');
    }
  };

  return (
    <article className="post">
      <div className="post-meta">
        {!noCommunity && community && (
          <button
            className="cmeta cursor-pointer"
            onClick={() => go({ t: 'comm', id: community.id })}
          >
            <CommunityAvatar community={community} size={22} />
            <b>b/{community.slug}</b>
          </button>
        )}
        {!noCommunity && <span>·</span>}
        <span>{post.author}</span>
        <span>·</span>
        <span>{ago(post.ts)}</span>
      </div>

      <button
        className="post-main cursor-pointer"
        onClick={() => go({ t: 'post', id: post.id })}
      >
        <h3>{post.title}</h3>
        {post.body && <p className="pv-body">{post.body}</p>}
      </button>

      {linkParsed && linkParsed.ok && (
        <a
          className="lnk"
          href={linkParsed.href}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
        >
          <Icon name="external" size={14} />
          <span>{linkParsed.host}</span>
        </a>
      )}

      <div className="post-act flex items-center gap-2 mt-1">
        <PostVotingPill post={post} />
        <button
          className="pill-b cursor-pointer"
          onClick={() => go({ t: 'post', id: post.id })}
          aria-label="Comments"
        >
          <Icon name="comment" size={16} />
          <span>{fmtN(commentCount)}</span>
        </button>
        <button className="pill-b cursor-pointer" onClick={handleShare}>
          <Icon name="share" size={16} />
          <span>Share</span>
        </button>
      </div>
    </article>
  );
}

export function CommunityFeed() {
  const {
    allCommunities,
    allPosts,
    forumEngagement,
    forumSort,
    setForumSort,
    forumScope,
    setForumScope,
    toggleJoinCommunity,
    go,
  } = useBrunch();

  const joinedCommunities = allCommunities.filter((c) => !!forumEngagement.joined[c.id]);

  let posts = [...allPosts];
  if (forumScope === 'joined') {
    posts = posts.filter((p) => joinedCommunities.some((c) => c.id === p.cid));
  }

  // Sort posts
  if (forumSort === 'new') {
    posts.sort((a, b) => b.ts - a.ts);
  } else if (forumSort === 'top') {
    posts.sort(
      (a, b) =>
        (b.base || 1) + (forumEngagement.pv[b.id] || 0) - ((a.base || 1) + (forumEngagement.pv[a.id] || 0))
    );
  } else {
    // Hot sorting
    posts.sort((a, b) => {
      const scoreA = (a.base || 1) + (forumEngagement.pv[a.id] || 0);
      const scoreB = (b.base || 1) + (forumEngagement.pv[b.id] || 0);
      const hotA = scoreA / Math.pow((Date.now() - a.ts) / 36e5 + 2, 1.5);
      const hotB = scoreB / Math.pow((Date.now() - b.ts) / 36e5 + 2, 1.5);
      return hotB - hotA;
    });
  }

  const strip = [...allCommunities].sort((a, b) => {
    const aJoined = forumEngagement.joined[a.id] ? 1 : 0;
    const bJoined = forumEngagement.joined[b.id] ? 1 : 0;
    return bJoined - aJoined || (b.base || 0) - (a.base || 0);
  });

  return (
    <div className="cgrid">
      <div className="cmain">
        {/* Horizontal Community Strip on Mobile */}
        <section className="hide-lg">
          <Carousel>
            <button
              className="cc new cursor-pointer"
              onClick={() => go({ t: 'newcomm' })}
            >
              <span className="cav">
                <Icon name="plus" size={24} />
              </span>
              <b>Create</b>
            </button>

            {strip.map((c) => (
              <button
                key={c.id}
                className="cc cursor-pointer"
                onClick={() => go({ t: 'comm', id: c.id })}
              >
                <CommunityAvatar community={c} size={64} />
                <b>b/{c.slug}</b>
              </button>
            ))}
          </Carousel>
        </section>

        {/* Filters and Scopes */}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="chips" role="group" aria-label="Sort posts">
            {[
              ['hot', 'Hot'],
              ['new', 'New'],
              ['top', 'Top'],
            ].map(([k, t]) => (
              <button
                key={k}
                className="chip"
                aria-pressed={forumSort === k}
                onClick={() => setForumSort(k as 'hot' | 'new' | 'top')}
              >
                {t}
              </button>
            ))}
          </div>

          {joinedCommunities.length > 0 && (
            <div className="chips" role="group" aria-label="Show">
              {[
                ['all', 'Everything'],
                ['joined', 'Joined'],
              ].map(([k, t]) => (
                <button
                  key={k}
                  className="chip"
                  aria-pressed={forumScope === k}
                  onClick={() => setForumScope(k as 'all' | 'joined')}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Post list */}
        {posts.length > 0 ? (
          <div className="plist">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <Icon name="users" size={44} />
            <b>
              {forumScope === 'joined'
                ? 'Nothing from your communities yet'
                : 'No posts yet'}
            </b>
            <span>
              {forumScope === 'joined'
                ? 'Join a few communities or start a conversation.'
                : 'Start the first conversation.'}
            </span>
            <button className="btn fill" onClick={() => go({ t: 'newpost' })}>
              New post
            </button>
          </div>
        )}
      </div>

      {/* Desktop Sidebar with Popular Communities */}
      <aside className="side" aria-label="Communities">
        <div className="sec-h">
          <h2 className="h2">Popular communities</h2>
        </div>
        <div className="flex flex-col gap-2">
          {strip.slice(0, 5).map((c) => {
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
        <button
          className="btn out w-full mt-3"
          onClick={() => go({ t: 'newcomm' })}
        >
          <Icon name="plus" size={16} />
          <span>Create a community</span>
        </button>
      </aside>
    </div>
  );
}

