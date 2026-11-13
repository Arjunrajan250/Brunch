'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useBrunch } from '@/context/BrunchContext';
import { Launch, Maker } from '@/types/brunch';
import { getMakersList, fmtN, socialInfo, SUP, parseUrl, hash, TYPE, platText } from '@/data/seed';
import { storesOf, STORES } from '@/data/stores';
import { LaunchIcon, MakerAvatar, VoteButton } from '@/components/common/LaunchComponents';
import { Glyph, Icon } from '@/components/icons/Icons';
import { copyText } from '@/lib/clipboard';

export const SUP_WARN = (
  <div className="warn">
    <Icon name="alert" size={18} />
    <span>
      Brunch does not process payments or check these pages. Only send money or credits to people you trust, and look carefully at the page you land on.
    </span>
  </div>
);

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function readStoredImage(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function MineCard({ launch }: { launch: Launch }) {
  const { go, openShareLaunch, openSheet, engagement } = useBrunch();
  const v = (launch.base || 0) + (engagement.votes[launch.id] ? 1 : 0);
  const c = (launch.tried || 0) + (engagement.clicks[launch.id] ? 1 : 0);
  const views =
    (launch.viewCount ?? (launch.sample ? Math.round(c * 2.8) + 12 : 0)) +
    (engagement.views[launch.id] ? 1 : 0);

  const stores = storesOf(launch);
  const typeLabel = TYPE[launch.type]?.label || 'App';
  const platformStr = platText(launch);

  return (
    <article className="lc">
      <button
        className="lc-top cursor-pointer text-left w-full"
        onClick={() => go({ t: 'launch', id: launch.id })}
        aria-label={`Open ${launch.name}`}
      >
        <LaunchIcon launch={launch} size={56} />
        <span className="tx min-w-0 flex-1">
          <span className="nm">{launch.name}</span>
          <span className="tg">{launch.tag}</span>
          <span className="mt flex items-center gap-1.5 flex-wrap">
            {stores.map((s) => {
              const def = STORES[s.k];
              if (!def) return null;
              return (
                <span key={s.k} className="stb" style={{ '--col': def.col } as React.CSSProperties}>
                  <span className="stdot" />
                  <span>{def.label}</span>
                </span>
              );
            })}
            <span>
              {typeLabel} · {platformStr}
            </span>
          </span>
        </span>
        <span className="lc-go" aria-hidden="true">
          <Icon name="chev" size={18} />
        </span>
      </button>

      <div className="lc-stats" role="group" aria-label={`Numbers for ${launch.name}`}>
        <div className="lc-s">
          <b>{fmtN(views)}</b>
          <span>Viewers</span>
        </div>
        <div className="lc-s">
          <b>{fmtN(c)}</b>
          <span>Tried it</span>
        </div>
        <div className="lc-s">
          <b>{fmtN(v)}</b>
          <span>Upvotes</span>
        </div>
      </div>

      <div className="lc-acts">
        <button
          className="btn fill cursor-pointer"
          onClick={() => go({ t: 'dash', id: launch.id })}
        >
          <Icon name="chart" size={16} />
          <span>Dashboard</span>
        </button>
        <button
          className="btn out sq cursor-pointer"
          onClick={() => openShareLaunch(launch)}
          aria-label={`Share ${launch.name}`}
          title="Share"
        >
          <Icon name="share" size={16} />
          <span className="lb">Share</span>
        </button>
        <button
          className="btn out sq cursor-pointer"
          onClick={() => go({ t: 'submit', edit: launch.id })}
          aria-label={`Edit ${launch.name}`}
          title="Edit"
        >
          <Icon name="edit" size={16} />
          <span className="lb">Edit</span>
        </button>
        <button
          className="btn out sq danger cursor-pointer"
          onClick={() => openSheet({ type: 'deleteLaunch', id: launch.id })}
          aria-label={`Delete ${launch.name}`}
          title="Delete"
        >
          <Icon name="trash" size={16} />
          <span className="lb">Delete</span>
        </button>
      </div>
    </article>
  );
}

function PubCard({ launch }: { launch: Launch }) {
  const { go, openShareLaunch, engagement } = useBrunch();
  const v = (launch.base || 0) + (engagement.votes[launch.id] ? 1 : 0);
  const c = (launch.tried || 0) + (engagement.clicks[launch.id] ? 1 : 0);
  const stores = storesOf(launch);
  const typeLabel = TYPE[launch.type]?.label || 'App';
  const platformStr = platText(launch);

  return (
    <article className="lc">
      <button
        className="lc-top cursor-pointer text-left w-full"
        onClick={() => go({ t: 'launch', id: launch.id })}
        aria-label={`Open ${launch.name}`}
      >
        <LaunchIcon launch={launch} size={56} />
        <span className="tx min-w-0 flex-1">
          <span className="nm">{launch.name}</span>
          <span className="tg">{launch.tag}</span>
          <span className="mt flex items-center gap-1.5 flex-wrap">
            {stores.map((s) => {
              const def = STORES[s.k];
              if (!def) return null;
              return (
                <span key={s.k} className="stb" style={{ '--col': def.col } as React.CSSProperties}>
                  <span className="stdot" />
                  <span>{def.label}</span>
                </span>
              );
            })}
            <span>
              {typeLabel} · {platformStr}
            </span>
          </span>
        </span>
      </button>

      <div className="lc-stats two" role="group" aria-label={`Numbers for ${launch.name}`}>
        <div className="lc-s">
          <b>{fmtN(c)}</b>
          <span>Tried it</span>
        </div>
        <div className="lc-s">
          <b>{fmtN(v)}</b>
          <span>Upvotes</span>
        </div>
      </div>

      <div className="lc-acts">
        <button
          className="btn fill cursor-pointer"
          onClick={() => go({ t: 'launch', id: launch.id })}
        >
          <span>View launch</span>
        </button>
        <button
          className="btn out sq cursor-pointer"
          onClick={() => openShareLaunch(launch)}
          aria-label={`Share ${launch.name}`}
          title="Share"
        >
          <Icon name="share" size={16} />
          <span className="lb">Share</span>
        </button>
        <VoteButton launch={launch} />
      </div>
    </article>
  );
}

export function MakerView({ makerKey }: { makerKey: string }) {
  const {
    allLaunches,
    myLaunches,
    savedLaunches,
    engagement,
    currentRoute,
    go,
    openSheet,
    toggleFollow,
    toast,
    makerName,
    makerBio,
    makerLink,
    supportLinks,
    user,
    userProfile,
  } = useBrunch();

  const isOwn = makerKey === 'me' || (user && makerKey === user.id) || (makerKey && makerKey === (userProfile?.handle || makerName));
  const [subTab, setSubTab] = useState<'launches' | 'saved' | 'following'>(
    currentRoute.t === 'me' && currentRoute.sub ? currentRoute.sub : 'launches'
  );

  const [pic, setPic] = useState<string>(() => readStoredImage('brunch.user.pic'));
  const [ban, setBan] = useState<string>(() => readStoredImage('brunch.user.ban'));
  const picInputRef = useRef<HTMLInputElement>(null);
  const banInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'pic' | 'ban'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!IMAGE_TYPES.has(file.type)) {
      toast('Choose a JPG, PNG, WebP or GIF image.');
      return;
    }
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      toast('Choose a non-empty image no larger than 2 MB.');
      return;
    }

    const label = kind === 'pic' ? 'Profile photo' : 'Profile banner';
    const storageKey = kind === 'pic' ? 'brunch.user.pic' : 'brunch.user.ban';
    const setImage = kind === 'pic' ? setPic : setBan;
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        toast(`Could not read that ${kind === 'pic' ? 'photo' : 'banner'}.`);
        return;
      }

      const result = reader.result;
      setImage(result);
      try {
        localStorage.setItem(storageKey, result);
        toast(`${label} updated`);
      } catch (error) {
        const isQuotaError =
          error instanceof DOMException &&
          (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
        toast(
          isQuotaError
            ? `${label} is visible for this session, but browser storage is full.`
            : `${label} is visible for this session, but it could not be saved on this device.`
        );
      }
    };
    reader.onerror = () => {
      toast(`Could not read that ${kind === 'pic' ? 'photo' : 'banner'}. Please try another image.`);
    };
    reader.readAsDataURL(file);
  };

  const makers = getMakersList(allLaunches, engagement.votes, engagement.clicks, engagement.follows);

  // Determine current profile data
  let maker: Maker | null = null;
  let rank = 0;

  if (isOwn) {
    const myVotes = myLaunches.reduce((acc, l) => acc + (l.base || 0) + (engagement.votes[l.id] ? 1 : 0), 0);
    const myTries = myLaunches.reduce((acc, l) => acc + (l.tried || 0) + (engagement.clicks[l.id] ? 1 : 0), 0);
    // Local follow storage contains this viewer's outgoing follows, not their followers.
    const myFol = 0;

    maker = {
      key: makerKey || user?.id || 'me',
      name: makerName || userProfile?.name || 'You',
      bio: makerBio || userProfile?.bio || '',
      social: makerLink || userProfile?.website || '',
      socials: makerLink ? [makerLink] : (userProfile?.website ? [userProfile.website] : []),
      support: supportLinks,
      sample: false,
      uid: user?.id,
      list: myLaunches,
      votes: myVotes,
      tries: myTries,
      hot: 0,
      fol: myFol,
      score: myVotes * 2 + myTries,
      pic: pic || userProfile?.avatar_url,
      ban: ban,
    };
    rank = makers.findIndex((x) => x.name.toLowerCase() === maker?.name.toLowerCase()) + 1;
  } else {
    maker = makers.find((m) => m.key === makerKey) || null;
    if (maker) {
      rank = makers.findIndex((x) => x.key === makerKey) + 1;
    }
  }

  if (!maker) {
    return (
      <div className="empty">
        <Icon name="search" size={44} />
        <b>Nobody here</b>
        <span>This creator has no launches.</span>
      </div>
    );
  }

  const isFollowing = !isOwn && !!engagement.follows[maker.key];
  const socials = maker.socials && maker.socials.length > 0 ? maker.socials : maker.social ? [maker.social] : [];
  const hue = hash(maker.key) % 360;
  const bannerImage = isOwn ? ban : maker.ban;
  const profileImage = isOwn ? pic : maker.pic;

  const copyUpi = async (upiId: string) => {
    const copied = await copyText(upiId);
    toast(copied ? 'UPI ID copied' : 'Could not copy the UPI ID. Please copy it manually.');
  };

  const copyProfileShare = async () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/u/${encodeURIComponent(maker.key)}`;
    const copied = await copyText(url);
    toast(copied ? 'Profile link copied' : 'Could not copy the profile link.');
  };

  // Profile Checklist items (Own profile). Ref-backed actions stay in event handlers below.
  const todo = [
    { id: 'launch', ok: myLaunches.length > 0, text: 'Launch something' },
    { id: 'bio', ok: !!maker.bio, text: 'Write a short bio' },
    { id: 'socials', ok: socials.length > 0, text: 'Add your social pages' },
    { id: 'support', ok: maker.support.length > 0, text: 'Add a support link' },
    { id: 'photo', ok: !!(pic || maker.pic), text: 'Add a profile photo' },
  ];
  const done = todo.filter((t) => t.ok).length;

  const followingMakers = makers.filter((x) => engagement.follows[x.key]);

  return (
    <div className="mp">
      {/* Hidden file pickers for banner and avatar */}
      {isOwn && (
        <>
          <input
            ref={picInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleImageUpload(e, 'pic')}
          />
          <input
            ref={banInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleImageUpload(e, 'ban')}
          />
        </>
      )}

      {maker.sample && (
        <div className="notice">
          <Icon name="info" size={18} />
          <span>Sample creator. Their numbers and support links are made up.</span>
        </div>
      )}

      {/* Hero Banner & Head */}
      <section
        className="mp-hero"
        style={{ '--h': hue } as React.CSSProperties}
        aria-label="Creator profile"
      >
        <div className={`mp-cover ${(isOwn ? ban : maker.ban) ? 'has' : ''}`} aria-hidden="true">
          {bannerImage && (
            <Image
              src={bannerImage}
              alt=""
              fill
              sizes="100vw"
              unoptimized
              decoding="async"
            />
          )}
        </div>

        {isOwn && (
          <button
            className="mp-cam cursor-pointer"
            onClick={() => banInputRef.current?.click()}
            aria-label={(isOwn ? ban : maker.ban) ? 'Change banner image' : 'Add a banner image'}
          >
            <Icon name="camera" size={16} />
            <span>{(isOwn ? ban : maker.ban) ? 'Change banner' : 'Add banner'}</span>
          </button>
        )}

        <div className="mp-body">
          <div className="mp-head">
            <span className="mp-av">
              <span
                className={`mav hu ${(isOwn ? pic : maker.pic) ? 'pi' : ''}`}
                style={{ '--h': hue, '--s': 'var(--av)' } as React.CSSProperties}
                aria-hidden="true"
              >
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt=""
                    width={116}
                    height={116}
                    unoptimized
                    decoding="async"
                  />
                ) : (
                  (maker.name || '?').trim()[0]?.toUpperCase() || '?'
                )}
              </span>

              {isOwn && (
                <button
                  className="mp-avcam cursor-pointer"
                  onClick={() => picInputRef.current?.click()}
                  aria-label="Change profile photo"
                >
                  <Icon name="camera" size={16} />
                </button>
              )}
            </span>

            <div className="mp-id">
              <h1 className="mp-nm">{maker.name}</h1>
              <div className="mp-tags">
                {rank > 0 && (
                  <span className={`mp-rank ${rank <= 3 ? `r${rank}` : ''}`}>
                    #{rank} creator
                  </span>
                )}
                {isOwn && maker.name !== 'You' && <span className="mp-you">You</span>}
              </div>
            </div>
          </div>

          {maker.bio && <p className="mp-bio">{maker.bio}</p>}

          {/* Socials / Add Prompts */}
          {(socials.length > 0 || isOwn) && (
            <div className="mp-soc" role="group" aria-label="Social pages">
              {socials.map((socUrl, idx) => {
                const s = socialInfo(socUrl);
                if (!s) return null;
                return (
                  <a
                    key={idx}
                    className="chip"
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow ugc"
                  >
                    <span>{s.label}</span>
                    {s.handle && <span>· {s.handle}</span>}
                    <Icon name="external" size={14} />
                  </a>
                );
              })}

              {isOwn && !maker.bio && (
                <button
                  className="chip dash cursor-pointer"
                  onClick={() => openSheet({ type: 'editprofile' })}
                >
                  <Icon name="plus" size={16} />
                  <span>Add a short bio</span>
                </button>
              )}

              {isOwn && socials.length === 0 && (
                <button
                  className="chip dash cursor-pointer"
                  onClick={() => openSheet({ type: 'editprofile' })}
                >
                  <Icon name="plus" size={16} />
                  <span>Add your social pages</span>
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mp-acts row1">
            {isOwn ? (
              <>
                <button
                  className="btn fill cursor-pointer"
                  onClick={() => openSheet({ type: 'editprofile' })}
                >
                  <Icon name="edit" size={16} />
                  <span>Edit profile</span>
                </button>
                <button
                  className="rb cursor-pointer"
                  onClick={copyProfileShare}
                  aria-label="Share your profile"
                  title="Share"
                >
                  <Icon name="share" size={18} />
                </button>
                <button
                  className="rb cursor-pointer"
                  onClick={() => openSheet({ type: 'profile' })}
                  aria-label="Settings"
                  title="Settings"
                >
                  <Icon name="sliders" size={18} />
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn fill cursor-pointer"
                  aria-pressed={isFollowing}
                  onClick={() => toggleFollow(maker.key)}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  className="btn out cursor-pointer"
                  onClick={() => go({ t: 'chat' })}
                >
                  <Icon name="comment" size={16} />
                  <span>Message</span>
                </button>
                {maker.support.length > 0 && (
                  <button
                    className="btn out cursor-pointer"
                    onClick={() => openSheet({ type: 'support', key: maker.key })}
                  >
                    <Icon name="heart" size={16} />
                    <span>Support</span>
                  </button>
                )}
                <button
                  className="rb cursor-pointer"
                  onClick={copyProfileShare}
                  aria-label="Share this profile"
                  title="Share"
                >
                  <Icon name="share" size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mp-stats">
          <div>
            <b>{maker.list.length}</b>
            <span>{maker.list.length === 1 ? 'Launch' : 'Launches'}</span>
          </div>
          <div>
            <b>{fmtN(maker.votes)}</b>
            <span>Upvotes</span>
          </div>
          <div>
            <b>{fmtN(maker.tries)}</b>
            <span>Tries</span>
          </div>
          <div>
            <b>{fmtN(maker.fol)}</b>
            <span>Followers</span>
          </div>
        </div>
      </section>

      {/* Main & Sidebar Grid */}
      <div className={`mp-grid ${isOwn || maker.support.length > 0 ? '' : 'solo'}`}>
        <section
          className="mp-main"
          aria-label={isOwn ? 'Your launches, saved and following' : 'Launches'}
        >
          {isOwn ? (
            <>
              {/* Profile Subtabs */}
              <div className="mp-tabs" role="tablist" aria-label="Profile tabs">
                <button
                  className="tab cursor-pointer"
                  role="tab"
                  aria-selected={subTab === 'launches'}
                  onClick={() => setSubTab('launches')}
                >
                  <span>Launches</span>
                  {maker.list.length > 0 && <span className="tn">{maker.list.length}</span>}
                </button>
                <button
                  className="tab cursor-pointer"
                  role="tab"
                  aria-selected={subTab === 'saved'}
                  onClick={() => setSubTab('saved')}
                >
                  <span>Saved</span>
                  {savedLaunches.length > 0 && <span className="tn">{savedLaunches.length}</span>}
                </button>
                <button
                  className="tab cursor-pointer"
                  role="tab"
                  aria-selected={subTab === 'following'}
                  onClick={() => setSubTab('following')}
                >
                  <span>Following</span>
                  {followingMakers.length > 0 && (
                    <span className="tn">{followingMakers.length}</span>
                  )}
                </button>
              </div>

              {/* Subtab Contents */}
              {subTab === 'launches' && (
                <>
                  {maker.list.length > 0 ? (
                    <div className="mp-list">
                      {maker.list.map((item) => (
                        <MineCard key={item.id} launch={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="empty">
                      <Icon name="plus" size={44} />
                      <b>You have not launched anything</b>
                      <span>
                        Put your game, app or tool where people can find it. Every launch gets its own dashboard.
                      </span>
                      <button
                        className="btn fill cursor-pointer"
                        onClick={() => go({ t: 'submit' })}
                      >
                        Launch yours
                      </button>
                      <button
                        className="btn text cursor-pointer"
                        onClick={() =>
                          go({
                            t: 'dash',
                            id: allLaunches[0]?.id || '1',
                            demo: true,
                          })
                        }
                      >
                        <Icon name="chart" size={16} />
                        <span>See a sample dashboard</span>
                      </button>
                    </div>
                  )}
                </>
              )}

              {subTab === 'saved' && (
                <>
                  {savedLaunches.length > 0 ? (
                    <div className="grid-list">
                      {savedLaunches.map((item) => (
                        <PubCard key={item.id} launch={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="empty">
                      <Icon name="bookmark" size={44} />
                      <b>Nothing saved yet</b>
                      <span>
                        Tap “Save for later” on any launch to keep it here.
                      </span>
                      <button
                        className="btn out cursor-pointer"
                        onClick={() => go({ t: 'tab', tab: 'home' })}
                      >
                        Find something
                      </button>
                    </div>
                  )}
                </>
              )}

              {subTab === 'following' && (
                <>
                  {followingMakers.length > 0 ? (
                    <div className="grid-list">
                      {followingMakers.map((m) => (
                        <div key={m.key} className="lrow2">
                          <button
                            className="row cursor-pointer text-left"
                            onClick={() => go({ t: 'maker', key: m.key })}
                          >
                            <MakerAvatar name={m.name} makerKey={m.key} size={48} />
                            <span className="tx">
                              <span className="nm">{m.name}</span>
                              {m.bio && <span className="tg">{m.bio}</span>}
                              <span className="mt">
                                {m.list.length} {m.list.length === 1 ? 'launch' : 'launches'} ·{' '}
                                {fmtN(m.votes)} upvotes · {fmtN(m.fol)} followers
                              </span>
                            </span>
                          </button>
                          <button
                            className="btn out sm cursor-pointer"
                            onClick={() => toggleFollow(m.key)}
                          >
                            Following
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty">
                      <Icon name="users" size={44} />
                      <b>You are not following anyone yet</b>
                      <span>Follow creators to keep track of what they make.</span>
                      <button
                        className="btn out cursor-pointer"
                        onClick={() => go({ t: 'tab', tab: 'home' })}
                      >
                        See the creator ranking
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <div className="sec-h">
                <h2 className="h2">
                  Launches
                  <span className="mp-n">{maker.list.length}</span>
                </h2>
              </div>
              <div className="mp-list">
                {maker.list.map((item) => (
                  <PubCard key={item.id} launch={item} />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Sidebar: Profile Checklist & Support Card */}
        <aside className="mp-side" aria-label="Support and profile">
          {/* Profile Checklist (Own Profile Only) */}
          {isOwn && done < todo.length && (
            <section className="mp-card" aria-label="Profile checklist">
              <div className="mp-todo-h">
                <h2 className="h2 text-[18px]">Complete your profile</h2>
                <span className="mp-prog">
                  {done} of {todo.length}
                </span>
              </div>
              <div
                className="mp-bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={todo.length}
                aria-valuenow={done}
              >
                <i style={{ width: `${Math.round((done / todo.length) * 100)}%` }} />
              </div>
              <ul className="mp-todo">
                {todo.map((item) =>
                  item.ok ? (
                    <li key={item.id} className="ok">
                      <div className="r">
                        <span className="ck">
                          <Icon name="check" size={14} />
                        </span>
                        <span>{item.text}</span>
                      </div>
                    </li>
                  ) : (
                    <li key={item.id}>
                      <button
                        className="r cursor-pointer"
                        onClick={() => {
                          if (item.id === 'launch') go({ t: 'submit' });
                          else if (item.id === 'photo') picInputRef.current?.click();
                          else openSheet({ type: 'editprofile' });
                        }}
                      >
                        <span className="ck">
                          <Icon name="plus" size={14} />
                        </span>
                        <span>{item.text}</span>
                        <Icon name="chev" size={16} />
                      </button>
                    </li>
                  )
                )}
              </ul>
            </section>
          )}

          {/* Ways to Support */}
          {maker.support.length > 0 ? (
            <section className="mp-card">
              <div className="sec-h">
                <h2 className="h2 text-[18px]">Ways to support</h2>
              </div>
              <div className="sup">
                {maker.support.map((s, idx) => {
                  const supDef = SUP[s.t] || SUP.other;
                  const host = supDef.id ? '' : parseUrl(s.u).host || '';

                  if (supDef.id) {
                    return (
                      <button
                        key={idx}
                        className="sup-i cursor-pointer"
                        onClick={() => void copyUpi(s.u)}
                      >
                        <span className={`si ${s.t}`}>
                          <Glyph name={supDef.glyph} size={20} />
                        </span>
                        <span className="tx text-left">
                          <b>{s.l || supDef.label}</b>
                          <span>{supDef.label} · {s.u} · tap to copy</span>
                        </span>
                        <Icon name="copy" size={18} />
                      </button>
                    );
                  }

                  return (
                    <a
                      key={idx}
                      className="sup-i cursor-pointer"
                      href={s.u}
                      target="_blank"
                      rel="noopener noreferrer nofollow ugc"
                    >
                      <span className={`si ${s.t}`}>
                        <Glyph name={supDef.glyph} size={20} />
                      </span>
                      <span className="tx text-left">
                        <b>{s.l || supDef.label}</b>
                        <span>{supDef.label} · {host}</span>
                      </span>
                      <Icon name="external" size={18} />
                    </a>
                  );
                })}
              </div>
              <div className="mt-2.5">{SUP_WARN}</div>
            </section>
          ) : isOwn ? (
            <section className="mp-card">
              <div className="sec-h">
                <h2 className="h2 text-[18px]">Ways to support</h2>
              </div>
              <div className="mp-empty">
                <Icon name="heart" size={24} />
                <b>No support links yet</b>
                <p>
                  Add a Ko-fi, Patreon, UPI or any page where people can back your work.
                </p>
                <button
                  className="btn out sm cursor-pointer mt-2"
                  onClick={() => openSheet({ type: 'editprofile' })}
                >
                  Add support links
                </button>
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
