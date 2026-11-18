'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/icons/Icons';
import { Launch } from '@/types/brunch';
import { copyText } from '@/lib/clipboard';
import { routeToUrl } from '@/lib/navigation';

export function Lightbox({
  images,
  initialIndex = 0,
  onClose,
}: {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(() => Math.max(0, Math.min(initialIndex, images.length - 1)));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (images.length < 2) return;
      if (event.key === 'ArrowLeft') setIndex((previous) => (previous > 0 ? previous - 1 : images.length - 1));
      if (event.key === 'ArrowRight') setIndex((previous) => (previous < images.length - 1 ? previous + 1 : 0));
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [images.length, onClose]);

  if (!images || images.length === 0) return null;

  const currentIndex = Math.max(0, Math.min(index, images.length - 1));
  const current = images[currentIndex];

  return (
    <div
      className="lbx animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot viewer"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        <span className="text-white/70 text-sm font-semibold">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Close image viewer"
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      <div
        className="relative max-w-4xl max-h-[85vh] p-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={current}
          width={1600}
          height={1000}
          unoptimized
          alt={`Screenshot ${currentIndex + 1}`}
          className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={() => setIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/75 text-white transition-all active:scale-95"
              aria-label="Previous image"
            >
              <div className="rotate-180">
                <Icon name="chev" size={24} />
              </div>
            </button>
            <button
              onClick={() => setIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/75 text-white transition-all active:scale-95"
              aria-label="Next image"
            >
              <Icon name="chev" size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function ShareModal({
  launch,
  onClose,
  onToast,
}: {
  launch: Launch;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const shareUrl = new URL(routeToUrl({ t: 'launch', id: launch.id }), typeof window !== 'undefined' ? window.location.origin : 'https://brunch.so').href;

  const handleCopy = async () => {
    const success = await copyText(shareUrl);
    if (!success) {
      onToast('Could not copy automatically. Select the link and copy it manually.');
      return;
    }
    setCopied(true);
    onToast('Link copied to clipboard');
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      await handleCopy();
      return;
    }
    try {
      await navigator.share({ title: launch.name, text: launch.tag, url: shareUrl });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      onToast(`Could not open sharing options: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Share ${launch.name}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg font-heading text-[var(--fg)]">
            Share {launch.name}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--fg-2)] hover:text-[var(--fg)] rounded-lg"
            aria-label="Close share dialog"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Card Preview */}
        <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-[var(--on-accent)] font-bold flex items-center justify-center">
              {launch.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-sm text-[var(--fg)]">{launch.name}</div>
              <div className="text-xs text-[var(--fg-2)]">by {launch.maker}</div>
            </div>
          </div>
          <p className="text-xs text-[var(--fg-2)] line-clamp-2">{launch.tag}</p>
        </div>

        {/* Link box */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] mb-4">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent border-0 text-xs text-[var(--fg)] outline-none select-all"
          />
          <button
            onClick={() => void handleCopy()}
            className="btn fill sm text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <Icon name={copied ? 'check' : 'copy'} size={14} />
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Check out ${launch.name} on Brunch: ${launch.tag}`)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn out sm flex items-center justify-center gap-2 text-xs"
          >
            <Icon name="share" size={14} />
            <span>Share on X</span>
          </a>
          <button
            onClick={() => void handleNativeShare()}
            className="btn out sm flex items-center justify-center gap-2 text-xs"
          >
            <Icon name="external" size={14} />
            <span>More options</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreateMenuSheet({
  onClose,
  onAction,
}: {
  onClose: () => void;
  onAction: (act: 'launch' | 'comm' | 'post') => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="scrim" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sh-h mb-3">
          <b className="text-lg font-bold">Create something</b>
        </div>
        <nav className="menu">
          <button
            onClick={() => {
              onClose();
              onAction('launch');
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent)] text-[var(--on-accent)] flex items-center justify-center">
                <Icon name="rocket" size={20} />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Launch yours</div>
                <div className="text-xs text-[var(--fg-2)]">Show off your game, app or tool</div>
              </div>
            </div>
            <Icon name="chev" size={18} />
          </button>

          <button
            onClick={() => {
              onClose();
              onAction('comm');
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                <Icon name="users" size={20} />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Create a community</div>
                <div className="text-xs text-[var(--fg-2)]">Gather people around an idea</div>
              </div>
            </div>
            <Icon name="chev" size={18} />
          </button>

          <button
            onClick={() => {
              onClose();
              onAction('post');
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Icon name="comment" size={20} />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Start a conversation</div>
                <div className="text-xs text-[var(--fg-2)]">Share a thought or ask for feedback</div>
              </div>
            </div>
            <Icon name="chev" size={18} />
          </button>
        </nav>
      </div>
    </div>
  );
}

