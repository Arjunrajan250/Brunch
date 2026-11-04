'use client';

import React from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { getMakersList, fmtN, socialInfo, SUP, parseUrl } from '@/data/seed';
import { LaunchRow, MakerAvatar } from '@/components/common/LaunchComponents';
import { Glyph, Icon } from '@/components/icons/Icons';

export const SUP_WARN = (
  <div className="warn">
    <Icon name="alert" size={18} />
    <span>
      Brunch does not process payments or check these pages. Only send money or credits to people you trust, and look carefully at the page you land on.
    </span>
  </div>
);

export function MakerView({ makerKey }: { makerKey: string }) {
  const { allLaunches, engagement, go, openSheet, toggleFollow, toast } = useBrunch();

  const makers = getMakersList(allLaunches, engagement.votes, engagement.clicks, engagement.follows);
  const maker = makers.find((m) => m.key === makerKey);

  if (!maker) {
    return (
      <div className="empty">
        <Icon name="search" size={44} />
        <b>Nobody here</b>
        <span>This creator has no launches.</span>
      </div>
    );
  }

  const rank = makers.findIndex((x) => x.key === makerKey) + 1;
  const isFollowing = !!engagement.follows[maker.key];
  const soc = socialInfo(maker.social || '');

  const copyUpi = (upiId: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      toast('UPI ID copied');
    }
  };

  return (
    <div className="stack" style={{ gap: '20px' }}>
      {/* Header */}
      <div className="mcard">
        <MakerAvatar name={maker.name} makerKey={maker.key} size={72} />
        <div className="min-w-0">
          <h1 className="h2 text-[clamp(22px,2vw+14px,30px)]">{maker.name}</h1>
          {maker.bio && <p className="sub text-[14px]">{maker.bio}</p>}
          <p className="count mt-1">
            #{rank} creator · {maker.list.length} {maker.list.length === 1 ? 'launch' : 'launches'} ·{' '}
            {fmtN(maker.votes)} upvotes · {fmtN(maker.fol)} followers
          </p>
        </div>
      </div>

      {maker.sample && (
        <div className="notice">
          <Icon name="info" size={18} />
          <span>Sample creator. Their numbers and support links are made up.</span>
        </div>
      )}

      {/* Action Chips */}
      <div className="chips wrap">
        <button
          className="btn fill"
          aria-pressed={isFollowing}
          onClick={() => toggleFollow(maker.key)}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>

        {maker.support.length > 0 && (
          <button
            className="btn out"
            onClick={() => openSheet({ type: 'support', key: maker.key })}
          >
            <Icon name="heart" size={16} />
            <span>Support</span>
          </button>
        )}

        {soc && (
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
        )}
      </div>

      {/* Ways to support */}
      {maker.support.length > 0 && (
        <section>
          <div className="sec-h">
            <h2 className="h2">Ways to support</h2>
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
                    onClick={() => copyUpi(s.u)}
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
          <div className="mt-2.5">{SUP_WARN}</div>
        </section>
      )}

      {/* Launches */}
      <section>
        <div className="sec-h">
          <h2 className="h2">Launches</h2>
        </div>
        <div className="grid-list">
          {maker.list.map((item) => (
            <LaunchRow key={item.id} launch={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
