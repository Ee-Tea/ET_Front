export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function getBffOrigin() {
  return process.env.NEXT_PUBLIC_BFF_ORIGIN || 'http://localhost:8100';
}

export async function POST(request: NextRequest) {
  try {
    const url = `${getBffOrigin()}/chat`;
    const body = await request.text();
    const incomingHeaders = request.headers;
    const headers: Record<string, string> = {
      'content-type': incomingHeaders.get('content-type') || 'application/json',
      'x-user-id': incomingHeaders.get('x-user-id') || 'frontend_user',
      'x-chat-id': incomingHeaders.get('x-chat-id') || 'frontend_chat',
      'x-request-id': incomingHeaders.get('x-request-id') || Math.random().toString(36).slice(2, 10),
      // 세션 지속용
      'x-session-id': incomingHeaders.get('x-session-id') || '',
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    });

    const text = await res.text();
    const sessionId = res.headers.get('x-session-id') || '';
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/json',
        ...(sessionId ? { 'x-session-id': sessionId } : {}),
      },
    });
  } catch (err: any) {
    const message = typeof err?.message === 'string' ? err.message : 'Upstream call failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}


