'use client';

import React, { useState, useMemo } from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { MetricType } from '@/types/brunch';
import {
  TYPE,
  fmtN,
  ago,
  isGH,
  votes as calcVotes,
  tries as calcTries,
  views as calcViews,
  saves as calcSaves,
  followers as calcFollowers,
  getMakersList,
  rng,
  DAY,
} from '@/data/seed';
import { GitHubBadge, LaunchIcon, MakerAvatar } from '@/components/common/LaunchComponents';
import { Icon } from '@/components/icons/Icons';

const DM: [MetricType, string][] = [
  ['views', 'Viewers'],
  ['clicks', 'Tried it'],
  ['votes', 'Upvotes'],
  ['saves', 'Saves'],
];

const DR: [number, string][] = [
  [7, '7 days'],
  [30, '30 days'],
  [90, '90 days'],
];

const niceMax = (v: number) => {
  const s = [4, 6, 8, 10, 12, 20, 40, 60, 80, 100];
  for (let k = 1; ; k *= 10) {
    for (const x of s) {
      if (x * k >= v) return x * k;
    }
  }
};

const fmtD = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function CreatorDashboard({ launchId, isDemo = false }: { launchId: string; isDemo?: boolean }) {
  const { allLaunches, engagement, go, openSheet, getComments } = useBrunch();

  const [metric, setMetric] = useState<MetricType>('views');
  const [days, setDays] = useState<number>(30);
  const [activeTooltip, setActiveTooltip] = useState<{ index: number; x: number; y: number; val: number; date: string } | null>(null);

  const launch = allLaunches.find((x) => x.id === launchId);

  // Compute totals
  const totals = useMemo(() => {
    if (!launch) return { views: 0, clicks: 0, votes: 0, saves: 0 };
    if (isDemo) {
      const tr = calcTries(launch, engagement.clicks);
      const vo = calcVotes(launch, engagement.votes);
      return {
        views: Math.round(tr * 3.4),
        clicks: tr,
        votes: vo,
        saves: Math.round(vo * 0.4),
      };
    }
    return {
      views: calcViews(launch, engagement.views),
      clicks: calcTries(launch, engagement.clicks),
      votes: calcVotes(launch, engagement.votes),
      saves: calcSaves(launch, engagement.saves),
    };
  }, [launch, isDemo, engagement]);

  // Generate daily series
  const seriesData = useMemo(() => {
    if (!launch) return [];
    const ds: number[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (days - 1 - i));
      ds.push(d.getTime());
    }

    const out = ds.map((t) => ({ t, n: 0 }));
    const tot = totals[metric];
    const life = Math.max(1, Math.ceil((Date.now() - launch.ts) / DAY));
    const r = rng(launch.id + metric);
    const w: number[] = [];
    let sum = 0;

    for (let a = 0; a <= life; a++) {
      const x = (Math.exp(-a / 8) + 0.06) * (0.55 + r());
      w.push(x);
      sum += x;
    }

    const bornDate = new Date(launch.ts);
    bornDate.setHours(0, 0, 0, 0);
    const born = bornDate.getTime();

    ds.forEach((t, i) => {
      const age = Math.round((t - born) / DAY);
      if (age >= 0 && age <= life) {
        out[i].n = Math.round((tot * w[age]) / sum);
      }
    });

    return out;
  }, [launch, days, metric, totals]);

  if (!launch) {
    return (
      <div className="empty">
        <Icon name="search" size={44} />
        <b>This launch is gone</b>
        <span>It may have been removed.</span>
        <button className="btn out" onClick={() => go({ t: 'saved', sub: 'mine' })}>
          Back to your launches
        </button>
      </div>
    );
  }

  const makerKey = launch.sample ? 's:' + launch.maker.toLowerCase() : launch.uid || 'n:' + launch.maker;
  const followersCount = calcFollowers(makerKey, engagement.follows);
  const comments = getComments(launch.id, 'launch');
  const tryRate = totals.views >= 5 ? Math.round((totals.clicks / totals.views) * 100) + '%' : '—';
  const totalInPeriod = seriesData.reduce((s, x) => s + x.n, 0);
  const metricLabel = DM.find((x) => x[0] === metric)?.[1] || 'Metric';

  // Ranking calculation
  const allMakers = getMakersList(allLaunches, engagement.votes, engagement.clicks, engagement.follows);
  const creatorRank = allMakers.findIndex((m) => m.name === launch.maker) + 1;
  const categoryPeers = allLaunches.filter((x) => x.type === launch.type);
  const launchRank = categoryPeers.findIndex((x) => x.id === launch.id) + 1;

  // Chart measurements
  const chartW = 600;
  const chartH = 220;
  const L = 34;
  const R = 6;
  const T = 16;
  const B = 24;
  const pw = chartW - L - R;
  const ph = chartH - T - B;
  const maxVal = Math.max(0, ...seriesData.map((x) => x.n));
  const topVal = niceMax(maxVal);
  const slotW = pw / seriesData.length;
  const barW = Math.max(2, Math.min(24, slotW - 2));

  let peakIdx = -1;
  seriesData.forEach((x, i) => {
    if (maxVal > 0 && x.n === maxVal && peakIdx < 0) peakIdx = i;
  });

  const maxEngage = Math.max(1, totals.views, totals.clicks, totals.votes, totals.saves);

  return (
    <div className="stack" style={{ gap: '20px' }}>
      {isDemo && (
        <div className="notice">
          <Icon name="info" size={18} />
          <span>Sample data. This is what your dashboard will look like once people start finding your launch.</span>
        </div>
      )}

      {/* Header */}
      <section className="d-head dsh-head">
        <LaunchIcon launch={launch} size={64} />
        <div className="min-w-0">
          <h1>{launch.name}</h1>
          <span className="flags">
            {isGH(launch) && <GitHubBadge />}{' '}
            <span>Launched {ago(launch.ts)}</span>
          </span>
          <div className="dsh-btns flex gap-1 mt-1.5 flex-wrap">
            <button className="btn text sm" onClick={() => go({ t: 'launch', id: launch.id })}>
              View listing
            </button>
            {!isDemo && (
              <button className="btn text sm" onClick={() => go({ t: 'submit', edit: launch.id })}>
                Edit
              </button>
            )}
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <span>Viewers</span>
          <b>{fmtN(totals.views)}</b>
          <small className="up">+12 this week</small>
        </div>
        <div className="kpi">
          <span>Tried it</span>
          <b>{fmtN(totals.clicks)}</b>
          <small className="up">+8 this week</small>
        </div>
        <div className="kpi">
          <span>Upvotes</span>
          <b>{fmtN(totals.votes)}</b>
          <small className="up">+4 this week</small>
        </div>
        <div className="kpi">
          <span>Saves</span>
          <b>{fmtN(totals.saves)}</b>
          <small>Bookmarked</small>
        </div>
        <div className="kpi">
          <span>Feedback</span>
          <b>{comments.length}</b>
          <small>Comments</small>
        </div>
        <div className="kpi">
          <span>Try rate</span>
          <b>{tryRate}</b>
          <small>{totals.views >= 5 ? 'Viewers who tapped Try it' : 'Needs 5 viewers'}</small>
        </div>
      </div>

      {/* Interactive Chart Panel */}
      <section className="panel">
        <div className="panel-h">
          <h2>{metricLabel} per day</h2>
          <div className="chips wrap" role="group" aria-label="Time range">
            {DR.map(([val, label]) => (
              <button
                key={val}
                className="chip"
                aria-pressed={days === val}
                onClick={() => setDays(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="chips wrap" role="group" aria-label="Metric">
          {DM.map(([key, label]) => (
            <button
              key={key}
              className="chip"
              aria-pressed={metric === key}
              onClick={() => setMetric(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="readout" aria-live="polite">
          <b>{fmtN(totalInPeriod)}</b> {metricLabel.toLowerCase()} in the last {days} days
        </p>

        {/* SVG Chart */}
        <div className="chartbox relative w-full overflow-hidden">
          <svg
            className="chart"
            viewBox={`0 0 ${chartW} ${chartH}`}
            width="100%"
            height={chartH}
            role="img"
            aria-label={`${metricLabel} per day for the last ${days} days.`}
          >
            {/* Grid lines */}
            {[0, topVal / 2, topVal].map((v, i) => {
              const y = T + ph - (v / topVal) * ph;
              return (
                <g key={i}>
                  <line className="grid" x1={L} x2={chartW - R} y1={y} y2={y} />
                  <text x={L - 6} y={y + 4} textAnchor="end">
                    {fmtN(v)}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {seriesData.map((item, i) => {
              const cx = L + slotW * i + slotW / 2;
              const h = item.n ? Math.max(2, (item.n / topVal) * ph) : 0;
              const y = T + ph - h;
              const isPeak = i === peakIdx;

              return (
                <g key={i}>
                  {h > 0 && (
                    <rect
                      className={`bar ${activeTooltip?.index === i ? 'on' : ''}`}
                      x={cx - barW / 2}
                      y={y}
                      width={barW}
                      height={h}
                      rx={Math.min(4, barW / 2)}
                    />
                  )}
                  {isPeak && (
                    <text className="pk" x={cx} y={y - 5} textAnchor="middle">
                      {fmtN(item.n)}
                    </text>
                  )}
                  <rect
                    className="hit"
                    x={L + slotW * i}
                    y={T}
                    width={slotW}
                    height={ph}
                    onPointerEnter={() =>
                      setActiveTooltip({
                        index: i,
                        x: cx,
                        y,
                        val: item.n,
                        date: fmtD(item.t),
                      })
                    }
                    onPointerLeave={() => setActiveTooltip(null)}
                  />
                </g>
              );
            })}

            {/* X-axis labels */}
            {(days <= 7
              ? seriesData.map((_, i) => i)
              : [0, Math.round(days / 3), Math.round((2 * days) / 3), days - 1]
            ).map((idx, k) => {
              const item = seriesData[idx];
              if (!item) return null;
              const cx = L + slotW * idx + slotW / 2;
              const text =
                days <= 7
                  ? new Date(item.t).toLocaleDateString('en-US', { weekday: 'short' })
                  : fmtD(item.t);
              const anchor = days <= 7 ? 'middle' : k === 0 ? 'start' : k === 3 ? 'end' : 'middle';
              const xPos = anchor === 'start' ? L : anchor === 'end' ? chartW - R : cx;

              return (
                <text key={k} x={xPos} y={chartH - 6} textAnchor={anchor}>
                  {text}
                </text>
              );
            })}
          </svg>

          {activeTooltip && (
            <div
              className="tip"
              style={{
                left: `${Math.min(Math.max(activeTooltip.x, 60), chartW - 60)}px`,
                top: `${activeTooltip.y}px`,
              }}
            >
              <strong>{fmtN(activeTooltip.val)}</strong> {metricLabel.toLowerCase()} · {activeTooltip.date}
            </div>
          )}
        </div>

        {/* Accessible Data Table */}
        <details className="tbl mt-2">
          <summary>View as table</summary>
          <div className="tbl-w">
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>{metricLabel}</th>
                </tr>
              </thead>
              <tbody>
                {[...seriesData].reverse().map((x, i) => (
                  <tr key={i}>
                    <td>{fmtD(x.t)}</td>
                    <td>{x.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      {/* Engagement Breakdown */}
      <section className="panel">
        <h2>How people engaged</h2>
        <div className="eng">
          {[
            ['Viewers', totals.views],
            ['Tried it', totals.clicks],
            ['Upvoted', totals.votes],
            ['Saved', totals.saves],
          ].map(([label, val]) => (
            <div key={label as string} className="eng-r">
              <span>{label}</span>
              <div className="trk">
                <i style={{ width: `${Math.max(val ? 2 : 0, Math.round(((val as number) / maxEngage) * 100))}%` }} />
              </div>
              <b>{fmtN(val as number)}</b>
            </div>
          ))}
        </div>
      </section>

      {/* Creator stats */}
      <section className="panel">
        <div className="panel-h">
          <h2>You as a creator</h2>
          {!isDemo && (
            <button
              className="btn out sm"
              onClick={() => openSheet({ type: 'editprofile' })}
            >
              Edit support links
            </button>
          )}
        </div>
        <div className="kpis">
          <div className="kpi">
            <span>Followers</span>
            <b>{fmtN(followersCount)}</b>
            <small>People following you</small>
          </div>
          <div className="kpi">
            <span>Support opens</span>
            <b>{fmtN(Math.round(followersCount * 0.08))}</b>
            <small>Taps on your links</small>
          </div>
          <div className="kpi">
            <span>Creator rank</span>
            <b>{creatorRank ? `#${creatorRank}` : '—'}</b>
            <small>of {allMakers.length} creators</small>
          </div>
          <div className="kpi">
            <span>Launch rank</span>
            <b>{launchRank ? `#${launchRank}` : '—'}</b>
            <small>of {categoryPeers.length} {TYPE[launch.type]?.plural.toLowerCase()} this week</small>
          </div>
        </div>
      </section>

      {/* Feedback stream */}
      <section className="panel">
        <div className="panel-h">
          <h2>Latest feedback</h2>
          <span className="count">{comments.length} total</span>
        </div>
        <div>
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
            <p className="sub py-3">No feedback yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
