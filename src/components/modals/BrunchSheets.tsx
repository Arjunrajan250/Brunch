'use client';

import React, { useState } from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { SUP, getMakersList, fmtN, parseUrl } from '@/data/seed';
import { Glyph, Icon } from '@/components/icons/Icons';
import { MakerAvatar } from '@/components/common/LaunchComponents';
import { SUP_WARN } from '@/components/creator/MakerView';
import { SupportLink } from '@/types/brunch';

export function BrunchSheets() {
  const {
    activeSheet,
    closeSheet,
    allLaunches,
    allPosts,
    engagement,
    makerName,
    makerBio,
    makerLink,
    supportLinks,
    hideSamples,
    saveProfileSettings,
    deleteLaunchItem,
    deletePostItem,
    go,
    toast,
  } = useBrunch();

  // Local states for editing profile
  const [profileName, setProfileName] = useState(makerName);
  const [profileBio, setProfileBio] = useState(makerBio);
  const [profileLink, setProfileLink] = useState(makerLink);
  const [showSamplesCheck, setShowSamplesCheck] = useState(!hideSamples);

  const [editRows, setEditRows] = useState<SupportLink[]>(() => {
    const list: SupportLink[] = [];
    for (let i = 0; i < 4; i++) {
      list.push(supportLinks[i] || { t: 'cash', l: '', u: '' });
    }
    return list;
  });
  const [editError, setEditError] = useState('');

  if (!activeSheet) return null;

  const initial = (makerName || 'You').trim()[0]?.toUpperCase() || 'Y';

  const handleSaveProfile = () => {
    saveProfileSettings(profileName.trim() || 'You', makerBio, makerLink, supportLinks, !showSamplesCheck);
    closeSheet();
  };

  const handleSaveEditProfile = () => {
    setEditError('');
    const cleanRows: SupportLink[] = [];

    for (let i = 0; i < editRows.length; i++) {
      const row = editRows[i];
      if (!row.u.trim()) continue;

      if (row.t === 'upi') {
        if (!/^[a-z0-9._-]{2,40}@[a-z][a-z0-9]{1,20}$/i.test(row.u.trim())) {
          setEditError(`Row ${i + 1}: use a UPI ID like name@bank`);
          return;
        }
        cleanRows.push({ t: 'upi', l: row.l.trim(), u: row.u.trim() });
      } else {
        const p = parseUrl(row.u);
        if (!p.ok) {
          setEditError(`Row ${i + 1}: ${p.err || 'Invalid link'}`);
          return;
        }
        cleanRows.push({ t: row.t, l: row.l.trim(), u: p.href });
      }
    }

    saveProfileSettings(profileName.trim() || 'You', profileBio.trim(), profileLink.trim(), cleanRows, hideSamples);
    closeSheet();
  };

  return (
    <div className="scrim" onClick={closeSheet}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Sheet */}
        {activeSheet.type === 'profile' && (
          <>
            <div className="sh-h">
              <span className="avatar lg">{initial}</span>
              <div className="flex-1 min-w-0">
                <b className="text-[17px]">{makerName || 'Your profile'}</b>
                <span className="mt block text-[var(--fg-2)] text-[13px]">
                  Preview mode. Everything is saved on this device only.
                </span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="p-name">Your name or team</label>
              <input
                id="p-name"
                type="text"
                maxLength={40}
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Shown on launches, posts and comments"
              />
            </div>

            <nav className="menu">
              <button
                onClick={() => {
                  closeSheet();
                  go({ t: 'saved', sub: 'mine' });
                }}
              >
                <span>Your launches and dashboards</span>
                <Icon name="chev" size={18} />
              </button>
              <button
                onClick={() => {
                  closeSheet();
                  go({ t: 'saved', sub: 'saved' });
                }}
              >
                <span>Saved</span>
                <Icon name="chev" size={18} />
              </button>
              <button
                onClick={() => {
                  closeSheet();
                  go({ t: 'saved', sub: 'following' });
                }}
              >
                <span>Following</span>
                <Icon name="chev" size={18} />
              </button>
              <button onClick={() => saveProfileSettings(profileName, makerBio, makerLink, supportLinks, !showSamplesCheck)}>
                <span onClick={() => closeSheet()}>Save profile</span>
              </button>
            </nav>

            <label className="check cursor-pointer">
              <input
                type="checkbox"
                checked={showSamplesCheck}
                onChange={(e) => setShowSamplesCheck(e.target.checked)}
              />
              <span>Show sample listings (made up, for demo)</span>
            </label>

            <p className="fine">
              Brunch is free to use. Links open other sites in a new tab and Brunch does not host or review what is on them. Use Report on anything that looks wrong.
            </p>

            <div className="sh-row">
              <button className="btn text" onClick={closeSheet}>
                Cancel
              </button>
              <button className="btn fill" onClick={handleSaveProfile}>
                Save
              </button>
            </div>
          </>
        )}

        {/* Edit Profile & Support Links Sheet */}
        {activeSheet.type === 'editprofile' && (
          <>
            <h2>Creator profile</h2>

            <div className="field">
              <label htmlFor="e-name">Name or team</label>
              <input
                id="e-name"
                type="text"
                maxLength={40}
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="e-bio">One line about you</label>
              <input
                id="e-bio"
                type="text"
                maxLength={100}
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="e-soc">Where can people follow you?</label>
              <input
                id="e-soc"
                type="url"
                value={profileLink}
                onChange={(e) => setProfileLink(e.target.value)}
                placeholder="https://instagram.com/you"
              />
            </div>

            <div className="field">
              <span className="lbl">Ways people can support you</span>
              <p className="hint">
                Brunch never handles money. Add links to your own pages (Ko-fi, GitHub Sponsors, PayPal.me), a UPI ID, or a page where people can gift compute credits.
              </p>

              {editRows.map((row, i) => (
                <div key={i} className="suprow">
                  <select
                    className="sel"
                    value={row.t}
                    onChange={(e) => {
                      const updated = [...editRows];
                      updated[i] = { ...updated[i], t: e.target.value };
                      setEditRows(updated);
                    }}
                  >
                    {Object.entries(SUP).map(([k, info]) => (
                      <option key={k} value={k}>
                        {info.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={row.u}
                    onChange={(e) => {
                      const updated = [...editRows];
                      updated[i] = { ...updated[i], u: e.target.value };
                      setEditRows(updated);
                    }}
                    placeholder={row.t === 'upi' ? 'name@bank' : 'https://ko-fi.com/you'}
                  />

                  <input
                    className="l"
                    type="text"
                    value={row.l}
                    onChange={(e) => {
                      const updated = [...editRows];
                      updated[i] = { ...updated[i], l: e.target.value };
                      setEditRows(updated);
                    }}
                    placeholder="Label (optional)"
                  />
                </div>
              ))}

              {editError && <span className="err" role="alert">{editError}</span>}
            </div>

            <div className="sh-row">
              <button className="btn text" onClick={closeSheet}>
                Cancel
              </button>
              <button className="btn fill" onClick={handleSaveEditProfile}>
                Save
              </button>
            </div>
          </>
        )}

        {/* Support Creator Sheet */}
        {activeSheet.type === 'support' && (() => {
          const allMakers = getMakersList(allLaunches, engagement.votes, engagement.clicks, engagement.follows);
          const maker = allMakers.find((m) => m.key === activeSheet.key);
          if (!maker) return null;

          return (
            <>
              <div className="sh-h">
                <MakerAvatar name={maker.name} makerKey={maker.key} size={48} />
                <div className="flex-1 min-w-0">
                  <h2>Support {maker.name}</h2>
                  <span className="mt block text-[var(--fg-2)] text-[13px]">
                    {fmtN(maker.fol)} followers
                  </span>
                </div>
              </div>

              {maker.sample && (
                <div className="notice">
                  <Icon name="info" size={18} />
                  <span>Sample creator. These links go to placeholder pages.</span>
                </div>
              )}

              <div className="sup">
                {maker.support.map((s, idx) => {
                  const supDef = SUP[s.t] || SUP.other;
                  const host = supDef.id ? '' : parseUrl(s.u).host || '';

                  if (supDef.id) {
                    return (
                      <button
                        key={idx}
                        className="sup-i cursor-pointer"
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(s.u);
                            toast('UPI ID copied');
                          }
                        }}
                      >
                        <span className={`si ${s.t}`}>
                          <Glyph name={supDef.glyph} size={20} />
                        </span>
                        <span className="tx">
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
                      <span className="tx">
                        <b>{s.l || supDef.label}</b>
                        <span>{supDef.label} · {host}</span>
                      </span>
                      <Icon name="external" size={18} />
                    </a>
                  );
                })}
              </div>

              {SUP_WARN}

              <p className="fine">
                Free ways to help: follow, upvote what you like, leave kind feedback and share it with a friend.
              </p>

              <div className="sh-row">
                <button className="btn fill" onClick={closeSheet}>
                  Done
                </button>
              </div>
            </>
          );
        })()}

        {/* Rank Info Sheet */}
        {activeSheet.type === 'rankinfo' && (
          <>
            <h2>How the ranking works</h2>
            <p>Creators are ranked on one score that updates live from what people do on Brunch.</p>
            <p className="font-bold text-[var(--ink)] bg-[var(--surface-2)] p-3 rounded-xl text-center">
              Score = upvotes + 0.3 × tries + 1.5 × followers
            </p>
            <p>
              Use the chips to sort by upvotes or followers alone. Rising favours creators whose newest launches are getting upvotes right now.
            </p>
            <p className="fine">Sample creators have made-up numbers.</p>
            <div className="sh-row">
              <button className="btn fill" onClick={closeSheet}>
                Got it
              </button>
            </div>
          </>
        )}

        {/* Report Sheet */}
        {activeSheet.type === 'report' && (
          <>
            <h2>Report this item</h2>
            <p>What is wrong with it?</p>
            <nav className="menu">
              {[
                ['spam', 'Spam or misleading'],
                ['notmine', 'Not made by the person who posted it'],
                ['unsafe', 'Unsafe or harmful link'],
                ['other', 'Something else'],
              ].map(([k, t]) => (
                <button
                  key={k}
                  onClick={() => {
                    closeSheet();
                    toast('Thanks. We will take a look.');
                  }}
                >
                  <span>{t}</span>
                  <Icon name="chev" size={18} />
                </button>
              ))}
            </nav>
            <div className="sh-row">
              <button className="btn text" onClick={closeSheet}>
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Delete Launch Sheet */}
        {activeSheet.type === 'deleteLaunch' && (() => {
          const l = allLaunches.find((x) => x.id === activeSheet.id);
          return (
            <>
              <h2>Delete {l?.name || 'this launch'}?</h2>
              <p>It will disappear from Brunch for everyone. Comments on it are not shown anymore.</p>
              <div className="sh-row">
                <button className="btn text" onClick={closeSheet}>
                  Keep it
                </button>
                <button
                  className="btn fill bg-[var(--danger)] text-white hover:brightness-110"
                  onClick={() => {
                    deleteLaunchItem(activeSheet.id);
                    closeSheet();
                    go({ t: 'saved', sub: 'mine' });
                  }}
                >
                  Delete
                </button>
              </div>
            </>
          );
        })()}

        {/* Delete Post Sheet */}
        {activeSheet.type === 'deletePost' && (() => {
          const p = allPosts.find((x) => x.id === activeSheet.id);
          return (
            <>
              <h2>Delete this post?</h2>
              <p>“{p?.title || 'This post'}” will disappear for everyone.</p>
              <div className="sh-row">
                <button className="btn text" onClick={closeSheet}>
                  Keep it
                </button>
                <button
                  className="btn fill bg-[var(--danger)] text-white hover:brightness-110"
                  onClick={() => {
                    deletePostItem(activeSheet.id);
                    closeSheet();
                    go({ t: 'tab', tab: 'community' });
                  }}
                >
                  Delete
                </button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
