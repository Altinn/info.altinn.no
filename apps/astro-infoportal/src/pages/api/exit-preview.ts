import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  cookies.delete('preview', { path: '/' });
  const referer = url.searchParams.get('redirect') || '/';
  return redirect(referer, 307);
};
