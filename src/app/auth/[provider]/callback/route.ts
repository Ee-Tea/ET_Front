export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function getAuthOrigin() {
  return process.env.NEXT_PUBLIC_AUTH_ORIGIN || 'http://localhost:8124';
}

// 프론트 콜백 → 백엔드 콜백으로 302 리다이렉트 (Set-Cookie를 백엔드가 직접 내리도록)
export async function GET(request: NextRequest, ctx: { params: { provider: string } }) {
  const provider = ctx.params.provider;
  const search = request.nextUrl.search || '';
  const target = `${getAuthOrigin()}/auth/${provider}/callback${search}`;
  return NextResponse.redirect(target, 302);
}


