import axios, { AxiosInstance } from 'axios';

/** Real integration tests hit the actual running backend over HTTP (see
 * jest.config.cjs's globalSetup — the `e2e` target depends on
 * `@org/backend:serve`), including its real auth cookies, not mocked
 * Prisma. axios has no browser-style cookie jar, so this captures the
 * Set-Cookie header from signup/login and replays it on every later
 * request — the minimal amount of cookie handling this test tier needs. */
export function createAuthedClient(): AxiosInstance {
  const client = axios.create();
  let cookieHeader = '';

  client.interceptors.request.use((config) => {
    if (cookieHeader) {
      config.headers['Cookie'] = cookieHeader;
    }
    return config;
  });

  client.interceptors.response.use((response) => {
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      cookieHeader = setCookie.map((entry: string) => entry.split(';')[0]).join('; ');
    }
    return response;
  });

  return client;
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}
