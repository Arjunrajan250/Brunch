'use client';

import React, { useState } from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { LaunchType, PlatformKey } from '@/types/brunch';
import {
  TYPE,
  PLAT,
  TAGS,
  GLYPHS,
  HUES,
  parseUrl,
} from '@/data/seed';
import { uploadMedia } from '@/lib/supabase/storage';
import { LaunchRow } from '@/components/common/LaunchComponents';
import { Glyph, Icon } from '@/components/icons/Icons';

export function LaunchForm({ editId }: { editId?: string }) {
  const { allLaunches, saveLaunchItem, go, makerName, makerBio, makerLink, toast } = useBrunch();

  const existing = editId ? allLaunches.find((x) => x.id === editId) : null;

  const [name, setName] = useState(existing?.name || '');
  const [tag, setTag] = useState(existing?.tag || '');
  const [type, setType] = useState<LaunchType>(existing?.type || 'game');
  const [url, setUrl] = useState(existing?.url || '');
  const [repo, setRepo] = useState(existing?.repo || '');
  const [plats, setPlats] = useState<PlatformKey[]>(existing?.plats || ['w']);
  const [desc, setDesc] = useState(existing?.desc || '');
  const [tags, setTags] = useState<string[]>(existing?.tags || []);
  const [maker, setMaker] = useState(existing?.maker || makerName || '');
  const [social, setSocial] = useState(existing?.social || makerLink || '');
  const [bio, setBio] = useState(existing?.bio || makerBio || '');
  const [glyph, setGlyph] = useState(existing?.glyph || 'gamepad');
  const [hue, setHue] = useState(existing?.hue ?? 185);
  const [icon, setIcon] = useState(existing?.icon || '');
  const [shots, setShots] = useState<string[]>(existing?.shots || []);
  const [own, setOwn] = useState(!!existing);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const togglePlatform = (p: PlatformKey) => {
    setPlats((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const toggleTag = (t: string) => {
    setTags((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 3) {
        toast('Pick up to 3 tags');
        return prev;
      }
      return [...prev, t];
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'icon' | 'shots') => {
    const files = e.target.files;
    if (!files || !files.length) return;

    for (const file of Array.from(files)) {
      const res = await uploadMedia(file, kind === 'icon' ? 'icons' : 'shots');
      if (res.url) {
        if (kind === 'icon') {
          setIcon(res.url);
        } else {
          setShots((prev) => (prev.length < 3 ? [...prev, res.url!] : prev));
        }
      } else if (res.error) {
        toast(res.error);
      }
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (name.trim().length < 2) newErrors.name = 'Give it a name of at least 2 characters';
    if (tag.trim().length < 5) newErrors.tag = 'Add a one-line pitch, at least 5 characters';
    const parsedUrl = parseUrl(url);
    if (!parsedUrl.ok) newErrors.url = parsedUrl.err || 'Invalid link';
    if (repo.trim()) {
      const parsedRepo = parseUrl(repo);
      if (!parsedRepo.ok) newErrors.repo = parsedRepo.err || 'Invalid repo link';
    }
    if (!plats.length) newErrors.plats = 'Pick at least one platform';
    if (!maker.trim()) newErrors.maker = 'Add your name or team name';
    if (!own) newErrors.own = 'Please confirm you made this';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast('Please fix the highlighted errors');
      return;
    }

    const launchId = saveLaunchItem(
      {
        name: name.trim(),
        tag: tag.trim(),
        type,
        url: parsedUrl.ok ? parsedUrl.href : url,
        repo: repo.trim(),
        plats,
        tags,
        desc: desc.trim(),
        maker: maker.trim(),
        social: social.trim(),
        bio: bio.trim(),
        glyph,
        hue,
        icon,
        shots,
      },
      editId
    );

    go({ t: 'launch', id: launchId });
  };

  // Preview launch object
  const previewLaunch = {
    id: 'preview',
    name: name.trim() || 'Your launch',
    tag: tag.trim() || 'One line about what it does',
    type,
    plats: plats.length ? plats : (['w'] as PlatformKey[]),
    tags,
    desc,
    maker: maker.trim() || 'You',
    glyph,
    hue,
    icon,
    url,
    repo,
    ts: Date.now(),
  };

  return (
    <form className="stack max-w-[680px]" style={{ gap: '22px' }} onSubmit={handleSubmit} noValidate>
      <div>
        <p className="fine mb-1.5">Live Preview</p>
        <div className="border border-[var(--line)] rounded-2xl p-3 bg-[var(--surface)]">
          <LaunchRow launch={previewLaunch} />
        </div>
      </div>

      {/* Name */}
      <div className="field">
        <label htmlFor="f-name">Name</label>
        <input
          id="f-name"
          type="text"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tidepool"
          aria-invalid={!!errors.name}
        />
        {errors.name && <span className="err" role="alert">{errors.name}</span>}
      </div>

      {/* Tagline */}
      <div className="field">
        <label htmlFor="f-tag">One-line pitch</label>
        <input
          id="f-tag"
          type="text"
          maxLength={70}
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Grow a reef and run a tiny harbour"
          aria-invalid={!!errors.tag}
        />
        <span className="hint">What does it do, in plain words?</span>
        {errors.tag && <span className="err" role="alert">{errors.tag}</span>}
      </div>

      {/* Type */}
      <div className="field">
        <span className="lbl">What is it?</span>
        <div className="chips wrap" role="group" aria-label="Type">
          {Object.entries(TYPE).map(([tKey, tInfo]) => (
            <button
              key={tKey}
              type="button"
              className="chip"
              aria-pressed={type === tKey}
              onClick={() => setType(tKey as LaunchType)}
            >
              {tInfo.label}
            </button>
          ))}
        </div>
      </div>

      {/* URL */}
      <div className="field">
        <label htmlFor="f-url">Where can people try it?</label>
        <input
          id="f-url"
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yourgame.itch.io/tidepool"
          aria-invalid={!!errors.url}
        />
        <span className="hint">Your site, itch.io page, store listing or GitHub. Must be a web link.</span>
        {errors.url && <span className="err" role="alert">{errors.url}</span>}
      </div>

      {/* GitHub Repo */}
      <div className="field">
        <label htmlFor="f-repo">Source code on GitHub (optional)</label>
        <input
          id="f-repo"
          type="url"
          inputMode="url"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="https://github.com/you/project"
          aria-invalid={!!errors.repo}
        />
        <span className="hint">Adds a GitHub tag to your launch and a View source button, so people know the code is open.</span>
        {errors.repo && <span className="err" role="alert">{errors.repo}</span>}
      </div>

      {/* Platforms */}
      <div className="field">
        <span className="lbl">Works on</span>
        <div className="chips wrap" role="group" aria-label="Platforms">
          {Object.entries(PLAT).map(([pKey, pLabel]) => (
            <button
              key={pKey}
              type="button"
              className="chip"
              aria-pressed={plats.includes(pKey as PlatformKey)}
              onClick={() => togglePlatform(pKey as PlatformKey)}
            >
              {pLabel}
            </button>
          ))}
        </div>
        {errors.plats && <span className="err" role="alert">{errors.plats}</span>}
      </div>

      {/* Description */}
      <div className="field">
        <label htmlFor="f-desc">About (optional)</label>
        <textarea
          id="f-desc"
          maxLength={600}
          rows={4}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="What is it, why did you make it, what should people try first?"
        />
        <span className="cnt">{desc.length} / 600</span>
      </div>

      {/* Screenshots */}
      <div className="field">
        <span className="lbl">Screenshots (optional, up to 3)</span>
        {shots.length > 0 && (
          <div className="thumbs">
            {shots.map((s, i) => (
              <div key={i} className="thumb">
                <img src={s} alt={`Screenshot ${i + 1}`} />
                <button
                  type="button"
                  onClick={() => setShots((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label="Remove screenshot"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <label className={`btn out sm cursor-pointer ${shots.length >= 3 ? 'opacity-50 pointer-events-none' : ''}`}>
            <Icon name="image" size={16} />
            <span>Add screenshots</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e, 'shots')}
              disabled={shots.length >= 3}
            />
          </label>
          <span className="hint">PNG, JPEG or WebP.</span>
        </div>
      </div>

      {/* Icon & Theme */}
      <div className="field">
        <span className="lbl">Icon & Color</span>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <label className="btn out sm cursor-pointer">
            <Icon name="image" size={16} />
            <span>{icon ? 'Change image' : 'Upload image'}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleImageUpload(e, 'icon')}
            />
          </label>
          {icon && (
            <button type="button" className="btn text sm" onClick={() => setIcon('')}>
              Remove
            </button>
          )}
          <span className="hint">Square works best. Or pick a symbol and colour below.</span>
        </div>

        <div className="glyphs mt-2" role="group" aria-label="Symbol">
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

      {/* Tags */}
      <div className="field">
        <span className="lbl">Tags (up to 3)</span>
        <div className="chips wrap" role="group" aria-label="Tags">
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              className="chip"
              aria-pressed={tags.includes(t)}
              onClick={() => toggleTag(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Maker name */}
      <div className="field">
        <label htmlFor="f-maker">Your name or team</label>
        <input
          id="f-maker"
          type="text"
          maxLength={40}
          value={maker}
          onChange={(e) => setMaker(e.target.value)}
          placeholder="Mara Okafor"
          aria-invalid={!!errors.maker}
        />
        {errors.maker && <span className="err" role="alert">{errors.maker}</span>}
      </div>

      {/* Social link */}
      <div className="field">
        <label htmlFor="f-social">Where can people follow you? (optional)</label>
        <input
          id="f-social"
          type="url"
          inputMode="url"
          value={social}
          onChange={(e) => setSocial(e.target.value)}
          placeholder="https://instagram.com/yourhandle"
        />
        <span className="hint">Instagram, X, GitHub, YouTube or your own site.</span>
      </div>

      {/* Bio */}
      <div className="field">
        <label htmlFor="f-bio">One line about you (optional)</label>
        <input
          id="f-bio"
          type="text"
          maxLength={100}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Makes small cozy things after work."
        />
      </div>

      {/* Confirmation */}
      <label className="check cursor-pointer">
        <input
          type="checkbox"
          checked={own}
          onChange={(e) => setOwn(e.target.checked)}
        />
        <span>I made this, or I am part of the team that did.</span>
      </label>
      {errors.own && <span className="err" role="alert">{errors.own}</span>}

      {/* Submit bar */}
      <div className="formbar">
        <button className="btn fill lg" type="submit">
          {editId ? 'Save changes' : 'Launch it'}
        </button>
        <span className="fine">Free. No payment, no review queue.</span>
      </div>
    </form>
  );
}
