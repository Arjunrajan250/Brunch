import type { Page } from '@playwright/test';

export const USER_ID = '11111111-1111-4111-811111111111' as string;
export const OTHER_USER_ID = '22222222-2222-4222-822222222222' as string;

const createdAt = '2026-11-01T12:00:00.000Z';
const profile = (id: string, name: string) => ({
  id,
  name,
  handle: id === USER_ID ? 'current_user' : 'other_user',
  bio: '',
  avatar_url: '',
  website: '',
  support_links: [],
  created_at: createdAt,
});

const launch = (id: string, makerId: string, makerName: string) => ({
  id,
  name: id === USER_ID ? 'Owned cloud launch' : 'Mock cloud launch',
  tag: 'A launch supplied entirely by a mocked Supabase response.',
  type: 'tool',
  url: 'https://example.com/cloud',
  repo: '',
  links: [],
  plats: ['w'],
  tags: ['testing'],
  desc: '',
  maker_id: makerId,
  maker_name: makerName,
  maker_bio: '',
  maker_social: '',
  glyph: 'star',
  hue: 185,
  icon_url: '',
  screenshots: [],
  sample: false,
  views_count: 10,
  tries_count: 7,
  created_at: createdAt,
});

interface MockOptions {
  authenticated?: boolean;
  ownedContent?: boolean;
}

export async function mockCloud(page: Page, options: MockOptions = {}) {
  const currentProfile = profile(USER_ID, 'Current Maker');
  const otherProfile = profile(OTHER_USER_ID, 'Other Maker');
  const launches = [launch(options.ownedContent ? USER_ID : OTHER_USER_ID, options.ownedContent ? USER_ID : OTHER_USER_ID, options.ownedContent ? 'Current Maker' : 'Other Maker')];
  const rows: Record<string, Record<string, unknown>[]> = {
    launches,
    communities: [{ id: 'cloud_comm', slug: 'cloud', title: 'Mock cloud community', about: 'Mocked community response', glyph: 'chat', hue: 205, creator_id: OTHER_USER_ID, sample: false, created_at: createdAt }],
    posts: [{ id: 'cloud_post', community_id: 'cloud_comm', title: 'Mock cloud post', body: 'A post returned by a local response mock.', link: '', author_id: OTHER_USER_ID, author_name: 'Other Maker', sample: false, created_at: createdAt }],
    comments: [],
    votes: [],
    saves: [],
    post_votes: [],
    community_members: [],
    follows: [],
    profiles: [currentProfile, otherProfile],
  };
  let failure: { table: string; method?: string; times?: number } | null = null;
  const calls: { table: string; method: string; body: string }[] = [];

  if (options.authenticated) {
    const session = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
      expires_in: 86400,
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      user: {
        id: USER_ID,
        aud: 'authenticated',
        role: 'authenticated',
        email: 'current@example.test',
        email_confirmed_at: '2026-11-01T12:00:00.000Z',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { full_name: 'Current Maker' },
        identities: [],
        created_at: '2026-11-01T12:00:00.000Z',
        updated_at: '2026-11-01T12:00:00.000Z',
        is_anonymous: false,
      },
    };
    // createBrowserClient persists sessions in base64url cookies, not localStorage.
    await page.context().addCookies([{
      name: 'sb-mock-auth-token',
      value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`,
      url: 'http://127.0.0.1:3101',
      sameSite: 'Lax',
    }]);
  }

  await page.route('https://mock.test/auth/v1/**', async (route) => {
    const request = route.request();
    if (request.url().includes('/user')) {
      await route.fulfill({ json: {
        id: USER_ID,
        aud: 'authenticated',
        role: 'authenticated',
        email: 'current@example.test',
        app_metadata: {},
        user_metadata: {},
        identities: [],
        created_at: createdAt,
      } });
    } else {
      await route.fulfill({ status: 200, json: {} });
    }
  });

  await page.route('https://mock.test/rest/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const table = url.pathname.split('/rest/v1/')[1]?.split('/')[0] || '';
    const method = request.method();
    const body = request.postData() || '';
    calls.push({ table, method, body });

    if (failure?.table === table && (!failure.method || failure.method === method)) {
      if (failure.times !== undefined) failure.times -= 1;
      if (failure.times === undefined || failure.times >= 0) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: `mock ${method} failure`, code: 'MOCK_FAILURE' }) });
        return;
      }
    }

    if (table.startsWith('rpc/')) {
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    if (method !== 'GET' && method !== 'HEAD') {
      // Configurable zero-row deletes are returned as an empty representation.
      await route.fulfill({ status: method === 'POST' ? 201 : 200, contentType: 'application/json', body: method === 'DELETE' ? '[]' : body || '[]' });
      return;
    }

    let result = [...(rows[table] || [])];
    for (const [key, value] of url.searchParams) {
      if (!value.startsWith('eq.') || key === 'select' || key === 'order') continue;
      result = result.filter((row) => row[key] === value.slice(3));
    }
    const wantsObject = request.headers().accept?.includes('vnd.pgrst.object+json');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(wantsObject ? result[0] || null : result) });
  });

  // Avoid an unrelated external WebSocket while retaining all tested REST behavior.
  await page.routeWebSocket(/mock\.test/, () => {});

  return {
    calls,
    failNext(table: string, method?: string, times = 1) {
      failure = { table, method, times };
    },
    alwaysFail(table: string, method?: string) {
      failure = { table, method };
    },
    clearFailure() { failure = null; },
    rows,
  };
}
