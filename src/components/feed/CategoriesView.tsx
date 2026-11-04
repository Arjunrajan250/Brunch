'use client';

import React from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { MainTab, PlatformKey } from '@/types/brunch';
import {
  TABS,
  TYPE,
  TAGS,
  PLAT,
  isGH,
  hash,
  hot as calcHot,
} from '@/data/seed';
import { Glyph } from '@/components/icons/Icons';

export function CategoriesView({ tab }: { tab: MainTab }) {
  const { allLaunches, engagement, go } = useBrunch();
  const targetType = TABS[tab]?.type;
  const launches = allLaunches.filter((x) => !targetType || x.type === targetType);

  const sortHot = (list: typeof launches) =>
    [...list].sort((a, b) => calcHot(b, engagement.votes) - calcHot(a, engagement.votes));

  const tagCounts = TAGS.map((t) => [t, launches.filter((x) => x.tags.includes(t)).length] as [string, number]).filter(
    ([, count]) => count > 0
  );

  const ghCount = launches.filter(isGH).length;

  return (
    <div className="stack">
      {/* Types (only shown when on home tab) */}
      {!targetType && (
        <section>
          <h2 className="lead mb-3">Types</h2>
          <div className="tiles">
            {Object.entries(TYPE).map(([typeKey, typeInfo]) => {
              const matched = launches.filter((x) => x.type === typeKey);
              return (
                <button
                  key={typeKey}
                  className="tile hu cursor-pointer"
                  style={{ '--h': typeInfo.hue } as React.CSSProperties}
                  onClick={() =>
                    go({
                      t: 'coll',
                      title: typeInfo.plural,
                      ids: sortHot(matched).map((x) => x.id),
                    })
                  }
                >
                  <Glyph name={typeInfo.glyph} className="i" />
                  <b>{typeInfo.plural}</b>
                  <span>
                    {matched.length} {matched.length === 1 ? 'launch' : 'launches'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Browse by tag */}
      <section>
        <h2 className="lead mb-3">Browse by tag</h2>
        {tagCounts.length > 0 ? (
          <div className="tiles">
            {tagCounts.map(([tag, count]) => {
              const hue = hash(tag) % 360;
              const matched = launches.filter((x) => x.tags.includes(tag));
              return (
                <button
                  key={tag}
                  className="tile hu cursor-pointer"
                  style={{ '--h': hue } as React.CSSProperties}
                  onClick={() =>
                    go({
                      t: 'coll',
                      title: `#${tag}`,
                      ids: sortHot(matched).map((x) => x.id),
                    })
                  }
                >
                  <Glyph name="star" className="i" />
                  <b>{tag}</b>
                  <span>
                    {count} {count === 1 ? 'launch' : 'launches'}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="sub">No tags yet.</p>
        )}
      </section>

      {/* Works on platforms */}
      <section>
        <h2 className="lead mb-3">Works on</h2>
        <div className="tiles">
          {ghCount > 0 && (
            <button
              className="tile hu cursor-pointer"
              style={{ '--h': 215 } as React.CSSProperties}
              onClick={() =>
                go({
                  t: 'coll',
                  title: 'On GitHub',
                  ids: sortHot(launches.filter(isGH)).map((x) => x.id),
                })
              }
            >
              <Glyph name="hex" className="i" />
              <b>On GitHub</b>
              <span>
                {ghCount} {ghCount === 1 ? 'launch' : 'launches'}
              </span>
            </button>
          )}

          {Object.entries(PLAT).map(([pKey, pLabel]) => {
            const matched = launches.filter((x) => x.plats.includes(pKey as PlatformKey));
            if (!matched.length) return null;
            const hue = (200 + (hash(pKey) % 60)) % 360;
            return (
              <button
                key={pKey}
                className="tile hu cursor-pointer"
                style={{ '--h': hue } as React.CSSProperties}
                onClick={() =>
                  go({
                    t: 'coll',
                    title: `On ${pLabel}`,
                    ids: sortHot(matched).map((x) => x.id),
                  })
                }
              >
                <Glyph name="globe" className="i" />
                <b>{pLabel}</b>
                <span>
                  {matched.length} {matched.length === 1 ? 'launch' : 'launches'}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

