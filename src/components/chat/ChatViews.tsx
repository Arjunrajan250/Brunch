'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { Icon, Glyph } from '@/components/icons/Icons';
import { MakerAvatar } from '@/components/common/LaunchComponents';
import { CommunityAvatar } from '@/components/community/CommunityFeed';
import { ChatMessage, Community } from '@/types/brunch';
import { fmtN, ago } from '@/data/seed';

export const CHANNELS: Record<string, [string, string]> = {
  general: ['general', 'Main chat for everyone'],
  intros: ['intros', 'Say hi and share what you make'],
  showcase: ['showcase', 'Show off what you are working on'],
  feedback: ['feedback', 'Ask for early thoughts on your project'],
  offtopic: ['offtopic', 'Anything that is not work'],
};

const MPOOL: Record<string, string[]> = {
  general: [
    'Morning all. What is everyone making this week?',
    'Just shipped a tiny fix and it feels much bigger than it is.',
    'Does anyone else find the last 10% takes 90% of the time?',
    'Quiet day here. Good day to finish something small.',
    'Shoutout to whoever left that kind note on my launch yesterday.',
    'Coffee first, commits second.',
    'New here. What is the best way to get your first players?',
    'Reminder to take a break. Your bug will still be there.',
  ],
  intros: [
    'Hi, I make little browser games on weekends.',
    'Hello! Designer by day, building a habit tracker by night.',
    'Hey everyone, I just launched my first tool here.',
    'Hi, I mostly lurk but I want to start sharing what I build.',
    'Hello from a very rainy city. I make puzzle games.',
    'Hi all. Learning to code by making silly apps.',
  ],
  showcase: [
    'Pushed a new build of my puzzle game. Would love eyes on the first level.',
    'Made a tiny tool for renaming files in bulk. It does one thing.',
    'Added dark mode over the weekend. Ten minutes, should have done it ages ago.',
    'This is the icon I settled on after about forty versions.',
    'Open sourced the whole thing today. Be gentle.',
    'Finally got the daily puzzle working across time zones.',
  ],
  feedback: [
    'Could someone try my no-signup flow and tell me where you got stuck?',
    'Which of these two one-liners would make you tap Try it?',
    'I would love honest thoughts on the first minute of my game.',
    'Thanks for all the notes yesterday. Fixed three of them already.',
    'Is my icon too busy at small sizes?',
  ],
  offtopic: [
    'What are you all listening to while you build?',
    'Anyone else obsessed with tiny mechanical keyboards?',
    'Best snack for a long debugging session?',
    'Took a walk and solved the bug in my head. Classic.',
    'What was the last game that made you lose track of time?',
  ],
};

function getSampleMessages(room: string): ChatMessage[] {
  const ch = room.split('__')[1] || 'general';
  const pool = MPOOL[ch] || MPOOL.general;
  const names = ['Priya S.', 'Marcus L.', 'Aiko T.', 'Devon Hale', 'Sam Patel', 'Noor Haddad', 'Lee Tran'];
  const now = Date.now();
  return pool.slice(0, 5).map((text, i) => ({
    id: `sm_${room}_${i}`,
    name: names[i % names.length],
    text,
    ts: now - (5 - i) * 12 * 60e3,
    uid: `user_sample_${i}`,
    sample: true,
  }));
}

export function ChatView({
  communityId,
  initialChannel = 'general',
}: {
  communityId?: string;
  initialChannel?: string;
}) {
  const { allCommunities, makerName, user, toast, forumEngagement } = useBrunch();
  const [selectedChannel, setSelectedChannel] = useState(initialChannel);
  const [text, setText] = useState('');

  const targetComm = communityId
    ? allCommunities.find((c) => c.id === communityId)
    : allCommunities[0];

  const roomId = targetComm ? `${targetComm.id}__${selectedChannel}` : `lounge__${selectedChannel}`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(`brunch.chat.${roomId}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return getSampleMessages(roomId);
  });

  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`brunch.chat.${roomId}`);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        setMessages(getSampleMessages(roomId));
      }
    } catch {
      setMessages(getSampleMessages(roomId));
    }
  }, [roomId]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newMsg: ChatMessage = {
      id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: makerName || 'You',
      text: text.trim(),
      ts: Date.now(),
      uid: user?.id || 'local_user',
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setText('');

    try {
      localStorage.setItem(`brunch.chat.${roomId}`, JSON.stringify(updated.slice(-100)));
    } catch {}
  };

  const isJoined = targetComm ? !!forumEngagement.joined[targetComm.id] : true;

  return (
    <div className="wa-box my-2">
      {/* Top Bar */}
      <div className="wa-bar">
        {targetComm ? (
          <div className="flex items-center gap-3">
            <CommunityAvatar community={targetComm} size={42} />
            <div>
              <div className="font-bold text-base text-[var(--fg)]">
                b/{targetComm.slug}
              </div>
              <div className="text-xs text-[var(--fg-2)]">
                {fmtN(targetComm.base || 1)} members
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--on-accent)] flex items-center justify-center font-bold">
              B
            </div>
            <div>
              <div className="font-bold text-base text-[var(--fg)]">Makers Lounge</div>
              <div className="text-xs text-[var(--fg-2)]">Open chat for all creators</div>
            </div>
          </div>
        )}
      </div>

      {/* Channel Tabs */}
      <div className="wa-chs" role="tablist">
        {Object.entries(CHANNELS).map(([chKey, [label]]) => (
          <button
            key={chKey}
            className="wa-ch"
            aria-current={selectedChannel === chKey}
            onClick={() => setSelectedChannel(chKey)}
          >
            <span className="opacity-50">#</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Messages Log */}
      <div className="mlog" ref={logRef}>
        <div className="mnote text-xs text-center p-2 rounded-xl bg-[var(--surface-2)] text-[var(--fg-2)] mb-2">
          Welcome to #{CHANNELS[selectedChannel]?.[0] || 'chat'}. Keep conversations friendly and constructive.
        </div>

        {messages.map((msg, i) => {
          const isMine = msg.name === (makerName || 'You') || (user && msg.uid === user.id);
          return (
            <div key={msg.id || i} className={`mmsg ${isMine ? 'mine' : ''}`}>
              {!isMine && (
                <div className="avatar sm w-8 h-8 rounded-full bg-[var(--surface-2)] text-xs font-bold flex items-center justify-center flex-none">
                  {msg.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col gap-1 max-w-[85%]">
                {!isMine && (
                  <span className="text-[11px] font-semibold text-[var(--fg-2)]">
                    {msg.name} {msg.sample && <span className="opacity-60">(Sample)</span>}
                  </span>
                )}
                <div className="mbub">
                  {msg.text}
                </div>
                <span className="text-[10px] text-[var(--fg-2)] opacity-70 self-end">
                  {ago(msg.ts)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <form className="mform" onSubmit={handleSend}>
        <textarea
          rows={1}
          maxLength={500}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message #${CHANNELS[selectedChannel]?.[0] || 'chat'}…`}
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm resize-none text-[var(--fg)] placeholder-[var(--fg-2)]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <button
          type="submit"
          className="send p-2 rounded-full bg-[var(--accent)] text-[var(--on-accent)] hover:brightness-110 transition-transform active:scale-95 disabled:opacity-50"
          disabled={!text.trim()}
          aria-label="Send message"
        >
          <Icon name="send" size={18} />
        </button>
      </form>
    </div>
  );
}
