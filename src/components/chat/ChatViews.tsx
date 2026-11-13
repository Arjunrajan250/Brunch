'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useBrunch } from '@/context/BrunchContext';
import { Icon } from '@/components/icons/Icons';
import { CommunityAvatar } from '@/components/community/CommunityFeed';
import { ChatMessage } from '@/types/brunch';
import { fmtN, ago } from '@/data/seed';

export const CHANNELS: Record<string, [string, string]> = {
  general: ['general', 'Main chat for everyone'],
  intros: ['intros', 'Say hi and share what you make'],
  showcase: ['showcase', 'Show off what you are working on'],
  feedback: ['feedback', 'Ask for early thoughts on your project'],
  offtopic: ['offtopic', 'Anything that is not work'],
};

const MAX_MESSAGES = 100;

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

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<ChatMessage>;
  return (
    typeof message.id === 'string' && message.id.length > 0 && message.id.length <= 200 &&
    typeof message.name === 'string' && message.name.length > 0 && message.name.length <= 100 &&
    typeof message.text === 'string' && message.text.trim().length > 0 && message.text.length <= 500 &&
    typeof message.uid === 'string' && message.uid.length > 0 && message.uid.length <= 200 &&
    typeof message.ts === 'number' && Number.isFinite(message.ts) && message.ts >= 0 &&
    (message.sample === undefined || typeof message.sample === 'boolean')
  );
}

function loadRoom(roomId: string): { messages: ChatMessage[]; error: string | null } {
  const samples = getSampleMessages(roomId);
  if (typeof window === 'undefined') return { messages: samples, error: null };

  try {
    const stored = localStorage.getItem(`brunch.chat.${roomId}`);
    if (stored === null) return { messages: samples, error: null };
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error('Chat storage is not an array');

    const seenIds = new Set<string>();
    const validMessages = parsed.filter(isChatMessage).filter((message) => {
      if (seenIds.has(message.id)) return false;
      seenIds.add(message.id);
      return true;
    });
    return {
      messages: validMessages.slice(-MAX_MESSAGES),
      error: validMessages.length !== parsed.length
        ? 'Invalid or duplicate stored chat messages were removed from this room.'
        : null,
    };
  } catch {
    return {
      messages: samples,
      error: 'Stored chat could not be read. Sample messages are shown instead.',
    };
  }
}

function ChatRoom({
  roomId,
  channelLabel,
  canPost,
  joinCommunityName,
  onJoin,
  authorName,
  userId,
  toast,
}: {
  roomId: string;
  channelLabel: string;
  canPost: boolean;
  joinCommunityName?: string;
  onJoin?: () => void;
  authorName: string;
  userId?: string;
  toast: (message: string) => void;
}) {
  const [initialRoom] = useState(() => loadRoom(roomId));
  const [messages, setMessages] = useState<ChatMessage[]>(initialRoom.messages);
  const [text, setText] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialRoom.error) toast(initialRoom.error);
  }, [initialRoom.error, toast]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    const trimmed = text.trim();
    if (!canPost || !trimmed) return;

    const newMessage: ChatMessage = {
      id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: authorName,
      text: trimmed,
      ts: Date.now(),
      uid: userId || 'local_user',
    };
    const updated = [...messages, newMessage].slice(-MAX_MESSAGES);
    setMessages(updated);
    setText('');

    try {
      localStorage.setItem(`brunch.chat.${roomId}`, JSON.stringify(updated));
    } catch {
      toast('Message added for this session, but it could not be saved on this device.');
    }
  };

  return (
    <>
      <div className="mlog" ref={logRef} role="log" aria-live="polite">
        <div className="mnote">
          Welcome to #{channelLabel}. This is device-local demo chat, not live messaging. Messages stay in this browser; sample messages are fictional.
        </div>

        {messages.map((msg) => {
          const isMine = !msg.sample && (
            (userId ? msg.uid === userId : msg.uid === 'local_user') ||
            (msg.uid === 'local_user' && msg.name === authorName)
          );
          return (
            <div key={msg.id} className={`msg ${isMine ? 'me' : 'in'}`}>
              <div className="wa-b">
                {!isMine && (
                  <div className="wa-sn">
                    <span>{msg.name}</span>
                    {msg.sample && <span className="msb">Sample</span>}
                  </div>
                )}
                <span className="mtx">{msg.text}</span>
                <span className="mts">{ago(msg.ts)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mcomp">
        {!canPost && joinCommunityName && onJoin && (
          <div className="mjoin">
            <span>Join b/{joinCommunityName} to write in this device-local demo room.</span>
            <button type="button" className="btn fill sm" onClick={onJoin}>
              Join community
            </button>
          </div>
        )}
        <form
          className="mform"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <textarea
            rows={1}
            maxLength={500}
            value={text}
            disabled={!canPost}
            onChange={(e) => setText(e.target.value)}
            placeholder={canPost ? `Message #${channelLabel}…` : 'Join this community to message'}
            aria-label={`Message #${channelLabel}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            type="submit"
            className="send disabled:opacity-50"
            disabled={!canPost || !text.trim()}
            aria-label="Send message"
          >
            <Icon name="send" size={18} />
          </button>
        </form>
        <div className="mfoot">
          <span>Device-local demo · no messages are sent to other people</span>
          <span>Latest {MAX_MESSAGES} messages</span>
        </div>
      </div>
    </>
  );
}

export function ChatView({
  communityId,
  initialChannel = 'general',
}: {
  communityId?: string;
  initialChannel?: string;
}) {
  const {
    allCommunities,
    makerName,
    user,
    toast,
    forumEngagement,
    toggleJoinCommunity,
  } = useBrunch();
  const [selectedChannel, setSelectedChannel] = useState(
    CHANNELS[initialChannel] ? initialChannel : 'general'
  );

  const targetComm = communityId
    ? allCommunities.find((c) => c.id === communityId)
    : allCommunities[0];
  const roomId = targetComm ? `${targetComm.id}__${selectedChannel}` : `lounge__${selectedChannel}`;
  const isJoined = targetComm ? !!forumEngagement.joined[targetComm.id] : true;
  const channelLabel = CHANNELS[selectedChannel]?.[0] || 'general';

  return (
    <div className="mchat my-2">
      <div className="mhead">
        <div className="wa-bar">
          {targetComm ? (
            <div className="wa-who">
              <CommunityAvatar community={targetComm} size={42} />
              <div className="wa-wt">
                <div className="wa-h">b/{targetComm.slug}</div>
                <div className="wa-sub">
                  {fmtN(targetComm.base || 1)} members · device-local demo
                </div>
              </div>
            </div>
          ) : (
            <div className="wa-who">
              <div className="avatar">B</div>
              <div className="wa-wt">
                <div className="wa-h">Makers Lounge</div>
                <div className="wa-sub">Device-local lounge · not live multiplayer</div>
              </div>
            </div>
          )}
        </div>

        <div className="wa-chs" role="tablist" aria-label="Chat channels">
          {Object.entries(CHANNELS).map(([chKey, [label]]) => (
            <button
              key={chKey}
              type="button"
              role="tab"
              className="wa-ch"
              aria-selected={selectedChannel === chKey}
              aria-current={selectedChannel === chKey}
              onClick={() => setSelectedChannel(chKey)}
            >
              <span className="hash">#</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <ChatRoom
        key={roomId}
        roomId={roomId}
        channelLabel={channelLabel}
        canPost={isJoined}
        joinCommunityName={targetComm?.slug}
        onJoin={targetComm ? () => toggleJoinCommunity(targetComm.id) : undefined}
        authorName={makerName || 'You'}
        userId={user?.id}
        toast={toast}
      />
    </div>
  );
}
