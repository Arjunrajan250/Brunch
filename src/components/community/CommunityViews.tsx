'use client';

import React, { useState } from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { fmtN, ago, parseUrl, GLYPHS, HUES } from '@/data/seed';
import { CommunityAvatar, PostCard, PostVotingPill } from './CommunityFeed';
import { Glyph, Icon } from '@/components/icons/Icons';
import { MakerAvatar } from '@/components/common/LaunchComponents';

export const COMMUNITY_GUIDELINES = (
  <div className="box">
    <b>Community guidelines</b>
    <ul className="flex flex-col gap-1.5 text-[var(--fg-2)] text-[13.5px]">
      <li>Be kind. Critique the work, not the person.</li>
      <li>No spam or sneaky self-promotion. Share things you made, say that you made them.</li>
      <li>Only link to real projects and pages you trust.</li>
    </ul>
  </div>
);

// Individual Community View
export function CommunityDetail({ communityId }: { communityId: string }) {
  const { allCommunities, allPosts, forumEngagement, toggleJoinCommunity, go, forumSort, setForumSort } = useBrunch();

  const community = allCommunities.find((c) => c.id === communityId);

  if (!community) {
    return (
      <div className="empty">
        <Icon name="search" size={44} />
        <b>Community not found</b>
        <span>It may not exist anymore.</span>
        <button className="btn out" onClick={() => go({ t: 'tab', tab: 'community' })}>
          Back to communities
        </button>
      </div>
    );
  }

  const isJoined = !!forumEngagement.joined[community.id];
  const posts = allPosts.filter((p) => p.cid === community.id);

  const aboutBox = (
    <div className="box">
      <b>About b/{community.slug}</b>
      <p className="text-[var(--fg-2)]">{community.about || community.title}</p>
      <p className="count">
        {fmtN((community.base || 0) + (isJoined ? 1 : 0))} members · {posts.length} posts · started{' '}
        {ago(community.ts)}
      </p>
    </div>
  );

  return (
    <div className="cgrid">
      <div className="cmain">
        {community.sample && (
          <div className="notice">
            <Icon name="info" size={18} />
            <span>Sample community. Posts and members here are made up.</span>
          </div>
        )}

        {/* Banner */}
        <div
          className="banner hu flex items-center justify-end pr-6"
          style={{ '--h': community.hue } as React.CSSProperties}
        >
          <Glyph name={community.glyph} className="i opacity-20" size={120} />
        </div>

        {/* Header */}
        <div className="chead">
          <CommunityAvatar community={community} size={72} />
          <div className="ct">
            <h1>b/{community.slug}</h1>
            <p className="sub">{community.title}</p>
          </div>
          <div className="cbtns">
            <button
              className="btn out sm"
              aria-pressed={isJoined}
              onClick={() => toggleJoinCommunity(community.id)}
            >
              {isJoined ? 'Joined' : 'Join'}
            </button>
            <button
              className="btn fill sm"
              onClick={() => go({ t: 'newpost', cid: community.id })}
            >
              <Icon name="plus" size={16} />
              <span>New post</span>
            </button>
          </div>
        </div>

        {/* Mobile About */}
        <div className="hide-lg flex flex-col gap-3">
          {aboutBox}
          {COMMUNITY_GUIDELINES}
        </div>

        {/* Sort Chips */}
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

        {/* Posts */}
        {posts.length > 0 ? (
          <div className="plist">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} noCommunity />
            ))}
          </div>
        ) : (
          <div className="empty">
            <Icon name="comment" size={44} />
            <b>No posts yet</b>
            <span>Be the first to start a conversation here.</span>
            <button
              className="btn fill"
              onClick={() => go({ t: 'newpost', cid: community.id })}
            >
              New post
            </button>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="side flex flex-col gap-3" aria-label="About this community">
        {aboutBox}
        {COMMUNITY_GUIDELINES}
      </aside>
    </div>
  );
}

// Individual Post Thread View
export function PostDetail({ postId }: { postId: string }) {
  const { allPosts, allCommunities, go, openSheet, getComments, postComment, toast } = useBrunch();
  const [commentText, setCommentText] = useState('');

  const post = allPosts.find((p) => p.id === postId);

  if (!post) {
    return (
      <div className="empty">
        <Icon name="search" size={44} />
        <b>This post is gone</b>
        <span>It may have been deleted.</span>
        <button className="btn out" onClick={() => go({ t: 'tab', tab: 'community' })}>
          Back to communities
        </button>
      </div>
    );
  }

  const community = allCommunities.find((c) => c.id === post.cid);
  const linkParsed = post.link ? parseUrl(post.link) : null;
  const comments = getComments(post.id, 'post');

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    postComment(post.id, 'post', commentText.trim().slice(0, 280));
    setCommentText('');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${post.title} (b/${community?.slug || 'brunch'})`);
      toast('Copied link');
    }
  };

  return (
    <div className="cgrid">
      <div className="cmain">
        {/* Post meta */}
        <div className="post-meta">
          {community && (
            <button
              className="cmeta cursor-pointer"
              onClick={() => go({ t: 'comm', id: community.id })}
            >
              <CommunityAvatar community={community} size={24} />
              <b>b/{community.slug}</b>
            </button>
          )}
          <span>·</span>
          <span>{post.author}</span>
          <span>·</span>
          <span>{ago(post.ts)}</span>
        </div>

        {post.sample && (
          <div className="notice">
            <Icon name="info" size={18} />
            <span>Sample post. Written for the demo, not by a real person.</span>
          </div>
        )}

        {/* Title & Body */}
        <h1 className="ptitle">{post.title}</h1>
        {post.body && <div className="pbody">{post.body}</div>}

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

        {/* Actions */}
        <div className="post-act flex items-center gap-2 mt-2">
          <PostVotingPill post={post} />
          <button className="pill-b cursor-pointer" onClick={handleShare}>
            <Icon name="share" size={16} />
            <span>Share</span>
          </button>
          <button
            className="pill-b cursor-pointer"
            onClick={() => openSheet({ type: 'report', id: post.id })}
          >
            <Icon name="flag" size={16} />
            <span>Report</span>
          </button>
          {!post.sample && (
            <button
              className="pill-b cursor-pointer text-[var(--danger)]"
              onClick={() => openSheet({ type: 'deletePost', id: post.id })}
            >
              Delete
            </button>
          )}
        </div>

        {/* Comments Section */}
        <section className="mt-4">
          <div className="sec-h">
            <h2 className="h2">Comments</h2>
          </div>
          <form className="cf" onSubmit={handleCommentSubmit}>
            <div className="field">
              <label className="lbl" htmlFor="pct">
                Add a comment
              </label>
              <textarea
                id="pct"
                maxLength={280}
                placeholder="Share a thought, kindly"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <span className="cnt">{commentText.length} / 280</span>
            </div>
            <div className="formbar">
              <button className="btn fill sm" type="submit">
                Comment
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
              <p className="sub py-3">No comments yet. Be the first.</p>
            )}
          </div>
        </section>
      </div>

      {/* Desktop Aside */}
      <aside className="side flex flex-col gap-3" aria-label="About this community">
        {community && (
          <div className="box">
            <b>b/{community.slug}</b>
            <p className="text-[var(--fg-2)]">{community.about || community.title}</p>
            <p className="count">{fmtN(community.base || 1)} members</p>
          </div>
        )}
        {COMMUNITY_GUIDELINES}
      </aside>
    </div>
  );
}

// New Community Form
export function NewCommunityForm() {
  const { createCommunityItem, allCommunities, go, toast } = useBrunch();

  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [about, setAbout] = useState('');
  const [glyph, setGlyph] = useState('chat');
  const [hue, setHue] = useState(205);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const cleanSlug = slug.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,21}$/.test(cleanSlug)) {
      newErrors.slug = 'Use 3 to 21 letters, numbers or underscores';
    } else if (allCommunities.some((c) => c.slug === cleanSlug)) {
      newErrors.slug = 'That name is taken. Try another';
    }

    if (title.trim().length < 3) {
      newErrors.title = 'Add a title of at least 3 characters';
    }

    if (about.trim().length < 10) {
      newErrors.about = 'Tell people what it is about, at least 10 characters';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast('Please fix the highlighted errors');
      return;
    }

    const newId = createCommunityItem({
      slug: cleanSlug,
      title: title.trim(),
      about: about.trim(),
      glyph,
      hue,
    });

    go({ t: 'comm', id: newId });
  };

  const previewCommunity = {
    id: 'preview',
    slug: slug.trim().toLowerCase() || 'yourcommunity',
    title: title.trim() || 'Cozy corner',
    about: about.trim() || 'What is this community about?',
    glyph,
    hue,
    uid: 'user',
    ts: Date.now(),
  };

  return (
    <form className="stack max-w-[680px]" style={{ gap: '22px' }} onSubmit={handleSubmit} noValidate>
      <div>
        <p className="fine mb-1.5">Live Preview</p>
        <div className="border border-[var(--line)] rounded-2xl p-3 bg-[var(--surface)] flex items-center gap-3">
          <CommunityAvatar community={previewCommunity} size={52} />
          <div className="tx min-w-0 flex-1">
            <span className="nm font-semibold">b/{previewCommunity.slug}</span>
            <p className="tg text-[13px] text-[var(--fg-2)] truncate">{previewCommunity.about}</p>
            <span className="mt text-[12.5px] text-[var(--fg-2)]">1 member · 0 posts</span>
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="c-slug">Community name</label>
        <div className="slug">
          <span>b/</span>
          <input
            id="c-slug"
            type="text"
            maxLength={21}
            autoComplete="off"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="cozygames"
            aria-invalid={!!errors.slug}
          />
        </div>
        <span className="hint">3 to 21 letters, numbers or underscores. This is the web address.</span>
        {errors.slug && <span className="err" role="alert">{errors.slug}</span>}
      </div>

      <div className="field">
        <label htmlFor="c-title">Title</label>
        <input
          id="c-title"
          type="text"
          maxLength={50}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Cozy corner"
          aria-invalid={!!errors.title}
        />
        {errors.title && <span className="err" role="alert">{errors.title}</span>}
      </div>

      <div className="field">
        <label htmlFor="c-about">What is it about?</label>
        <textarea
          id="c-about"
          maxLength={240}
          rows={3}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Who is it for and what do people talk about here?"
          aria-invalid={!!errors.about}
        />
        <span className="cnt">{about.length} / 240</span>
        {errors.about && <span className="err" role="alert">{errors.about}</span>}
      </div>

      <div className="field">
        <span className="lbl">Symbol and colour</span>
        <div className="glyphs" role="group" aria-label="Symbol">
          {GLYPHS.map((g) => (
            <button
              key={g}
              type="button"
              className="gbtn"
              aria-label={g}
              aria-pressed={glyph === g}
              onClick={() => setGlyph(g)}
            >
              <Glyph name={g} size={22} />
            </button>
          ))}
        </div>

        <div className="sw mt-2" role="group" aria-label="Colour">
          {HUES.map((h) => (
            <button
              key={h}
              type="button"
              className="swb"
              style={{ '--h': h } as React.CSSProperties}
              aria-label={`Colour ${h}`}
              aria-pressed={hue === h}
              onClick={() => setHue(h)}
            />
          ))}
        </div>
      </div>

      <div className="formbar">
        <button className="btn fill lg" type="submit">
          Create community
        </button>
        <span className="fine">Free. You become the first member.</span>
      </div>
    </form>
  );
}

// New Post Form
export function NewPostForm({ initialCommunityId }: { initialCommunityId?: string }) {
  const { allCommunities, createPostItem, go, toast } = useBrunch();

  const [cid, setCid] = useState(initialCommunityId || allCommunities[0]?.id || '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!cid) newErrors.cid = 'Pick a community';
    if (title.trim().length < 3) newErrors.title = 'Add a title of at least 3 characters';
    if (!body.trim() && !link.trim()) newErrors.body = 'Add some text or a link';

    if (link.trim()) {
      const parsed = parseUrl(link);
      if (!parsed.ok) newErrors.link = parsed.err || 'Invalid link';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast('Please fix the highlighted errors');
      return;
    }

    const newId = createPostItem({
      cid,
      title: title.trim(),
      body: body.trim(),
      link: link.trim(),
    });

    go({ t: 'post', id: newId });
  };

  return (
    <form className="stack max-w-[680px]" style={{ gap: '22px' }} onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="p-cid">Post in</label>
        <select
          id="p-cid"
          className="sel"
          value={cid}
          onChange={(e) => setCid(e.target.value)}
        >
          {allCommunities.map((c) => (
            <option key={c.id} value={c.id}>
              b/{c.slug} ({c.title})
            </option>
          ))}
        </select>
        {errors.cid && <span className="err" role="alert">{errors.cid}</span>}
      </div>

      <div className="field">
        <label htmlFor="p-title">Title</label>
        <input
          id="p-title"
          type="text"
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you want to talk about?"
          aria-invalid={!!errors.title}
        />
        {errors.title && <span className="err" role="alert">{errors.title}</span>}
      </div>

      <div className="field">
        <label htmlFor="p-body">Text (optional)</label>
        <textarea
          id="p-body"
          maxLength={2000}
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add some detail, a question or your story"
        />
        <span className="cnt">{body.length} / 2000</span>
        {errors.body && <span className="err" role="alert">{errors.body}</span>}
      </div>

      <div className="field">
        <label htmlFor="p-link">Link (optional)</label>
        <input
          id="p-link"
          type="url"
          inputMode="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://yourproject.example"
        />
        <span className="hint">Must be a web address. Only link to things you made or trust.</span>
        {errors.link && <span className="err" role="alert">{errors.link}</span>}
      </div>

      <div className="formbar">
        <button className="btn fill lg" type="submit">
          Post
        </button>
      </div>
    </form>
  );
}
