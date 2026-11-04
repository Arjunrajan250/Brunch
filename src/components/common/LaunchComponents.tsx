'use client';

import React, { useRef } from 'react';
import { Launch } from '@/types/brunch';
import { useBrunch } from '@/context/BrunchContext';
import { Glyph, Icon } from '@/components/icons/Icons';
import {
  TYPE,
  fmtN,
  votes as calcVotes,
  isGH,
  platText,
  hash,
} from '@/data/seed';

export function LaunchIcon({ launch, size = 56 }: { launch: Launch; size?: number }) {
  return (
    <span
      className="ico hu"
      style={{ '--h': launch.hue, '--s': `${size}px` } as React.CSSProperties}
    >
      {launch.icon ? (
        <img src={launch.icon} alt="" decoding="async" />
      ) : (
        <Glyph name={launch.glyph} size={Math.round(size * 0.52)} />
      )}
    </span>
  );
}

export function MakerAvatar({ name, makerKey, size = 44 }: { name: string; makerKey: string; size?: number }) {
  const initial = (name || '?').trim()[0]?.toUpperCase() || '?';
  const hue = hash(makerKey) % 360;

  return (
    <span
      className="mav hu"
      style={{ '--h': hue, '--s': `${size}px` } as React.CSSProperties}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

export function VoteButton({ launch, lg = false }: { launch: Launch; lg?: boolean }) {
  const { engagement, toggleVote } = useBrunch();
  const isVoted = !!engagement.votes[launch.id];
  const count = calcVotes(launch, engagement.votes);

  return (
    <button
      className={`vote ${lg ? 'lg' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleVote(launch.id);
      }}
      aria-pressed={isVoted}
      aria-label={`${isVoted ? 'Remove upvote from' : 'Upvote'} ${launch.name}`}
    >
      <Icon name="up" size={lg ? 18 : 16} />
      <b>{fmtN(count)}</b>
    </button>
  );
}

export function GitHubBadge() {
  return (
    <span className="gh" title="Source code on GitHub">
      <Icon name="branch" size={12} />
      <span>GitHub</span>
    </span>
  );
}

export function GitHubDot() {
  return (
    <span
      className="ghdot"
      title="Source code on GitHub"
      role="img"
      aria-label="Source code on GitHub"
    >
      <Icon name="branch" size={14} />
    </span>
  );
}

export function LaunchCard({ launch }: { launch: Launch }) {
  const { go, engagement } = useBrunch();
  const count = calcVotes(launch, engagement.votes);
  const typeLabel = TYPE[launch.type]?.label || 'App';
  const hasGH = isGH(launch);

  return (
    <button
      className="card group cursor-pointer"
      onClick={() => go({ t: 'launch', id: launch.id })}
    >
      <span className="icw">
        <LaunchIcon launch={launch} />
        {hasGH && <GitHubDot />}
      </span>
      <span className="nm">{launch.name}</span>
      <span className="mt flex items-center">
        {typeLabel} · {fmtN(count)}
        <Icon name="up" size={11} className="inline-block align-baseline ml-0.5" />
      </span>
    </button>
  );
}

export function LaunchRow({ launch, rank }: { launch: Launch; rank?: number }) {
  const { go } = useBrunch();
  const hasGH = isGH(launch);
  const typeLabel = TYPE[launch.type]?.label || 'App';
  const platformStr = platText(launch);

  return (
    <div className="lrow2">
      <button
        className="row cursor-pointer"
        onClick={() => go({ t: 'launch', id: launch.id })}
      >
        {rank !== undefined && rank > 0 && <span className="rk">{rank}</span>}
        <LaunchIcon launch={launch} size={56} />
        <span className="tx">
          <span className="nm">{launch.name}</span>
          <span className="tg">{launch.tag}</span>
          <span className="mt flex items-center gap-1">
            {hasGH && <GitHubBadge />}
            <span>
              {typeLabel} · {platformStr} · {launch.maker}
            </span>
          </span>
        </span>
      </button>
      <VoteButton launch={launch} />
    </div>
  );
}

export function Carousel({ children }: { children: React.ReactNode }) {
  const carRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: number) => {
    if (carRef.current) {
      carRef.current.scrollBy({
        left: direction * carRef.current.clientWidth * 0.8,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="cw">
      <div className="car" ref={carRef}>
        {children}
      </div>
      <button
        className="arrow l"
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
      >
        <Icon name="back" size={20} />
      </button>
      <button
        className="arrow r"
        onClick={() => scroll(1)}
        aria-label="Scroll right"
      >
        <Icon name="chev" size={20} />
      </button>
    </div>
  );
}
