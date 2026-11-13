'use client';

import React, { useState, useEffect } from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { LaunchType, PlatformKey, Launch } from '@/types/brunch';
import {
  TYPE,
  PLAT,
  TAGS,
  GLYPHS,
  HUES,
  parseUrl,
} from '@/data/seed';
import { detectLink } from '@/data/stores';
import { LaunchRow } from '@/components/common/LaunchComponents';
import { Glyph, Icon } from '@/components/icons/Icons';
import { uploadMedia } from '@/lib/supabase/storage';

const LF_STEPS = [
  { short: 'Basics', title: 'The basics', desc: 'Name it, say what it does, and link where people can try it.' },
  { short: 'Extras', title: 'Make it stand out', desc: 'An icon, screenshots and a short story help people tap. You can skip all of this.' },
  { short: 'Launch', title: 'Almost there', desc: 'Tell people who made it, then launch.' },
];

export function LaunchForm({ editId }: { editId?: string }) {
  const { allLaunches, saveLaunchItem, go, makerName, makerBio, makerLink, toast } = useBrunch();

  const existing = editId ? allLaunches.find((x) => x.id === editId) : null;

  const [step, setStep] = useState(0);

  // Form Fields
  const [name, setName] = useState(existing?.name || '');
  const [tag, setTag] = useState(existing?.tag || '');
  const [type, setType] = useState<LaunchType>(existing?.type || 'game');
  const [url, setUrl] = useState(existing?.url || '');
  const [extraLinks, setExtraLinks] = useState<string[]>(existing?.links || (existing?.repo ? [existing.repo] : ['']));
  const [plats, setPlats] = useState<PlatformKey[]>(existing?.plats || ['w']);
  const [desc, setDesc] = useState(existing?.desc || '');
  const [tags, setTags] = useState<string[]>(existing?.tags || []);
  const [maker, setMaker] = useState(existing?.maker || makerName || '');
  const [bio, setBio] = useState(existing?.bio || makerBio || '');
  const [social, setSocial] = useState(existing?.social || makerLink || '');
  const [glyph, setGlyph] = useState(existing?.glyph || 'star');
  const [hue, setHue] = useState(existing?.hue ?? 185);
  const [icon, setIcon] = useState(existing?.icon || '');
  const [shots, setShots] = useState<string[]>(existing?.shots || []);
  const [own, setOwn] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  // Auto-detect platforms based on URL
  useEffect(() => {
    if (!existing && url) {
      const st = detectLink(url);
      if (st && st.k) {
        if (st.k === 'play' && !plats.includes('a')) setPlats((p) => [...p, 'a']);
        if (st.k === 'appstore' && !plats.includes('i')) setPlats((p) => [...p, 'i']);
        if ((st.k === 'steam' || st.k === 'msstore' || st.k === 'epic') && !plats.includes('d')) setPlats((p) => [...p, 'd']);
      }
    }
  }, [url, existing, plats]);

  const togglePlatform = (p: PlatformKey) => {
    setPlats((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
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

    setUploading(true);
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
    setUploading(false);
    e.target.value = '';
  };

  const validateStep0 = () => {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = 'Give it a name of at least 2 characters';
    if (tag.trim().length < 5) errs.tag = 'Add a one-line pitch (at least 5 characters)';
    const parsedUrl = parseUrl(url);
    if (!parsedUrl.ok) errs.url = parsedUrl.err || 'Invalid link';
    if (!plats.length) errs.plats = 'Pick at least one platform';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!maker.trim()) errs.maker = 'Add your name or team name';
    if (!own) errs.own = 'Please confirm you made this';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 0) {
      if (validateStep0()) setStep(1);
    } else if (step === 1) {
      setStep(2);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep0()) {
      setStep(0);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }

    const cleanLinks = extraLinks.map((l) => l.trim()).filter((l) => parseUrl(l).ok);

    const launchId = saveLaunchItem(
      {
        name: name.trim(),
        tag: tag.trim(),
        type,
        url: parseUrl(url).ok ? parseUrl(url).href : url,
        links: cleanLinks,
        repo: cleanLinks[0] || '',
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
  const previewLaunch: Launch = {
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
    links: extraLinks.filter(Boolean),
    ts: Date.now(),
  };

  return (
    <div className="max-w-[720px] mx-auto py-2">
      {/* Steps Progress */}
      <ol className="lf-steps mb-6" aria-label="Progress">
        {LF_STEPS.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <li className="lf-ln" aria-hidden="true" data-d={i <= step ? 1 : 0} />}
            <li>
              <button
                type="button"
                className="lf-st"
                data-s={i === step ? 'cur' : i < step ? 'done' : 'todo'}
                aria-current={i === step ? 'step' : undefined}
                onClick={() => {
                  if (i < step || validateStep0()) setStep(i);
                }}
              >
                <span className="lf-n">{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
                <span className="lf-t">{s.short}</span>
              </button>
            </li>
          </React.Fragment>
        ))}
      </ol>

      {/* Header for Step */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-[var(--fg)]">
          {LF_STEPS[step].title}
        </h1>
        <p className="text-sm text-[var(--fg-2)] mt-1">
          {LF_STEPS[step].desc}
        </p>
      </div>

      <form className="stack" style={{ gap: '22px' }} onSubmit={handleSubmit} noValidate>
        {/* Live Preview Box */}
        <div>
          <p className="fine mb-1.5">Live Preview</p>
          <div className="border border-[var(--line)] rounded-2xl p-3 bg-[var(--surface)]">
            <LaunchRow launch={previewLaunch} />
          </div>
        </div>

        {/* STEP 0: BASICS */}
        {step === 0 && (
          <div className="space-y-5 animate-fade-in">
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
              {errors.name && <p className="err-msg">{errors.name}</p>}
            </div>

            {/* Tagline */}
            <div className="field">
              <label htmlFor="f-tag">One-line pitch</label>
              <input
                id="f-tag"
                type="text"
                maxLength={80}
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Grow a reef and run a tiny harbour"
                aria-invalid={!!errors.tag}
              />
              {errors.tag && <p className="err-msg">{errors.tag}</p>}
            </div>

            {/* Type */}
            <div className="field">
              <span className="lbl">Type</span>
              <div className="seg" role="group" aria-label="Launch type">
                {(Object.keys(TYPE) as LaunchType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={type === t}
                    onClick={() => setType(t)}
                  >
                    {TYPE[t].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main URL */}
            <div className="field">
              <label htmlFor="f-url">Website or main link</label>
              <input
                id="f-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://tidepool.app or github.com/..."
                aria-invalid={!!errors.url}
              />
              {errors.url && <p className="err-msg">{errors.url}</p>}
            </div>

            {/* Extra Store Links */}
            <div className="field">
              <label>Extra store or repo links (optional)</label>
              {extraLinks.map((link, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => {
                      const updated = [...extraLinks];
                      updated[idx] = e.target.value;
                      setExtraLinks(updated);
                    }}
                    placeholder="https://play.google.com/..., https://github.com/..."
                    className="flex-1"
                  />
                  {extraLinks.length > 1 && (
                    <button
                      type="button"
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                      onClick={() => setExtraLinks(extraLinks.filter((_, i) => i !== idx))}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
              ))}
              {extraLinks.length < 4 && (
                <button
                  type="button"
                  className="btn text sm text-xs"
                  onClick={() => setExtraLinks([...extraLinks, ''])}
                >
                  + Add another link
                </button>
              )}
            </div>

            {/* Platforms */}
            <div className="field">
              <span className="lbl">Platforms</span>
              <div className="chips wrap" role="group" aria-label="Platforms">
                {(Object.keys(PLAT) as PlatformKey[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="chip"
                    aria-pressed={plats.includes(p)}
                    onClick={() => togglePlatform(p)}
                  >
                    {PLAT[p]}
                  </button>
                ))}
              </div>
              {errors.plats && <p className="err-msg">{errors.plats}</p>}
            </div>
          </div>
        )}

        {/* STEP 1: EXTRAS */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            {/* Story / Description */}
            <div className="field">
              <label htmlFor="f-desc">The story (optional)</label>
              <textarea
                id="f-desc"
                rows={4}
                maxLength={600}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Why did you build it? What was tricky? What are you proud of?"
              />
              <span className="cnt self-end text-xs opacity-60">{desc.length} / 600</span>
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

            {/* Screenshots */}
            <div className="field">
              <span className="lbl">Screenshots (optional, up to 3)</span>
              {shots.length > 0 && (
                <div className="thumbs flex gap-3 mb-2 flex-wrap">
                  {shots.map((s, i) => (
                    <div key={i} className="thumb relative w-24 h-16 rounded-xl overflow-hidden border border-[var(--line)]">
                      <img src={s} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setShots((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                        aria-label="Remove screenshot"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className={`btn out sm cursor-pointer ${shots.length >= 3 ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Icon name="image" size={16} />
                  <span>{uploading ? 'Uploading...' : 'Add screenshots'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'shots')}
                    disabled={shots.length >= 3 || uploading}
                  />
                </label>
              </div>
            </div>

            {/* Icon & Theme */}
            <div className="field">
              <span className="lbl">Icon & Theme Color</span>
              <div className="flex items-center gap-3 mb-3">
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
              </div>

              {/* Symbol selector */}
              <div className="glyphs mt-2 flex flex-wrap gap-2" role="group" aria-label="Symbol">
                {GLYPHS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className="gbtn p-2 rounded-xl border border-[var(--line)] hover:bg-[var(--surface-2)]"
                    aria-pressed={glyph === g}
                    onClick={() => setGlyph(g)}
                  >
                    <Glyph name={g} size={22} />
                  </button>
                ))}
              </div>

              {/* Color swatches */}
              <div className="sw mt-3 flex flex-wrap gap-2" role="group" aria-label="Colour">
                {HUES.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className="swb w-7 h-7 rounded-full border border-black/10"
                    style={{ '--h': h, backgroundColor: `hsl(${h}, 70%, 50%)` } as React.CSSProperties}
                    aria-pressed={hue === h}
                    onClick={() => setHue(h)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: LAUNCH */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            {/* Maker */}
            <div className="field">
              <label htmlFor="f-maker">Maker or team name</label>
              <input
                id="f-maker"
                type="text"
                maxLength={40}
                value={maker}
                onChange={(e) => setMaker(e.target.value)}
                placeholder="Alex Chen"
                aria-invalid={!!errors.maker}
              />
              {errors.maker && <p className="err-msg">{errors.maker}</p>}
            </div>

            {/* Maker Bio */}
            <div className="field">
              <label htmlFor="f-bio">Short bio</label>
              <input
                id="f-bio"
                type="text"
                maxLength={100}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Solo dev making cozy web apps"
              />
            </div>

            {/* Social Link */}
            <div className="field">
              <label htmlFor="f-social">Link to follow your work</label>
              <input
                id="f-social"
                type="url"
                value={social}
                onChange={(e) => setSocial(e.target.value)}
                placeholder="https://x.com/yourhandle or github.com/..."
              />
            </div>

            {/* Ownership Confirmation */}
            <label className="check flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={own}
                onChange={(e) => setOwn(e.target.checked)}
              />
              <span className="text-sm">I made this (or I am on the team that did).</span>
            </label>
            {errors.own && <p className="err-msg">{errors.own}</p>}
          </div>
        )}

        {/* Buttons Row */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--line)]">
          {step > 0 ? (
            <button
              type="button"
              className="btn out"
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              className="btn text"
              onClick={() => go({ t: 'tab', tab: 'home' })}
            >
              Cancel
            </button>
          )}

          {step < 2 ? (
            <button
              type="button"
              className="btn fill"
              onClick={handleNext}
            >
              Next step
            </button>
          ) : (
            <button
              type="submit"
              className="btn fill font-bold px-6"
            >
              {editId ? 'Save changes' : 'Launch yours'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
