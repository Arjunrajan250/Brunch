import type { ForumEngagementState, Post } from '@/types/brunch';

export const postScore = (post: Post, engagement: ForumEngagementState): number =>
  (post.base ?? 1) + (engagement.pv[post.id] || 0);

export function sortPosts(
  input: Post[],
  engagement: ForumEngagementState,
  sort: 'hot' | 'new' | 'top',
): Post[] {
  const posts = input.slice();
  if (sort === 'new') return posts.sort((a, b) => b.ts - a.ts);
  if (sort === 'top') return posts.sort((a, b) => postScore(b, engagement) - postScore(a, engagement));

  // Comparing against the newest post is deterministic during SSR and hydration.
  // Recent activity is represented without calling Date.now during render.
  const reference = Math.max(0, ...posts.map((post) => post.ts));
  return posts.sort((a, b) => {
    const heat = (post: Post) => postScore(post, engagement) /
      Math.pow(Math.max(0, reference - post.ts) / 36e5 + 2, 1.5);
    return heat(b) - heat(a) || b.ts - a.ts;
  });
}

export const commentKey = (kind: 'launch' | 'post', id: string): string => `${kind}:${id}`;
