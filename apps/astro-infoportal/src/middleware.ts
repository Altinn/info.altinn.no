import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { pageCacheControl } from '@constants/cache';

const PREVIEW_COOKIE_MAX_AGE = 60 * 10; // 10 minutes

const CSP_FRAME_ANCESTORS = [
  "'self'",
  'https://infoportal.at22.dis-core.altinn.cloud',
  'https://infoportal.at23.dis-core.altinn.cloud',
  'https://infoportal.tt02.dis-core.altinn.cloud',
  'https://infoportal.prod.dis-core.altinn.cloud',
  'http://localhost:5000',
  'https://localhost:44391',
];

function isAssetOrApi(pathname: string): boolean {
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/_astro/')) return true;
  if (pathname.startsWith('/@vite/')) return true;
  if (pathname.startsWith('/@id/')) return true;
  if (pathname.startsWith('/@fs/')) return true;
  if (pathname.startsWith('/@react-refresh')) return true;
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function verifyPreviewSignature(
  secret: string,
  path: string,
  expSeconds: number,
  sig: string,
): Promise<boolean> {
  if (!secret || !sig || !Number.isFinite(expSeconds)) return false;
  if (Date.now() / 1000 > expSeconds) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(`${path}|${expSeconds}`),
  );
  const expected = base64UrlEncode(new Uint8Array(signature));
  return constantTimeEqual(expected, sig);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies } = context;

  const previewSecret = env.PREVIEW_SECRET || '';
  const previewParam = url.searchParams.get('preview');
  const expParam = url.searchParams.get('exp');
  const sigParam = url.searchParams.get('sig');
  const hasPreviewQuery = previewParam !== null;

  let hasValidPreviewQuery = false;
  if (hasPreviewQuery && expParam !== null && sigParam !== null) {
    const expNum = Number.parseInt(expParam, 10);
    hasValidPreviewQuery = await verifyPreviewSignature(
      previewSecret,
      url.pathname,
      expNum,
      sigParam,
    );
  }
  const hasFailedPreviewQuery = hasPreviewQuery && !hasValidPreviewQuery;
  const hasPreviewCookie = cookies.has('preview');
  const isPreview = hasValidPreviewQuery || hasPreviewCookie;

  if (hasValidPreviewQuery) {
    cookies.set('preview', '1', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: url.protocol === 'https:',
      maxAge: PREVIEW_COOKIE_MAX_AGE,
    });
  }

  const response = await next();

  if (!response.headers.has('X-Content-Type-Options')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }
  if (!response.headers.has('Referrer-Policy')) {
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  if (!response.headers.has('Strict-Transport-Security')) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  if (!response.headers.has('Content-Security-Policy')) {
    response.headers.set(
      'Content-Security-Policy',
      `frame-ancestors ${CSP_FRAME_ANCESTORS.join(' ')}`,
    );
  }

  const status = response.status;
  const isErrorStatus = status >= 400;
  const skipCache =
    isPreview ||
    hasFailedPreviewQuery ||
    isAssetOrApi(url.pathname) ||
    isErrorStatus;

  if (skipCache) {
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  response.headers.set('Cache-Control', pageCacheControl(url.hostname));
  return response;
});
