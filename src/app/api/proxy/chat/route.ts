export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function getBffOrigin() {
  // 임시로 하드코딩 (환경변수 문제 해결 후 제거)
  return process.env.NEXT_PUBLIC_BFF_ORIGIN || 'http://10.0.136.230:8100';
}

export async function POST(request: NextRequest) {
  try {
    const bffOrigin = getBffOrigin();
    const url = `${bffOrigin}/chat`;
    
    console.log('Proxy Chat Request:', {
      bffOrigin,
      url,
      env: process.env.NEXT_PUBLIC_BFF_ORIGIN
    });
    
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

    console.log('Making request to:', url, 'with headers:', headers);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    });

    console.log('Response status:', res.status, res.statusText);

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
    console.error('Proxy Chat Error:', err);
    console.error('Error stack:', err.stack);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      cause: err.cause,
      name: err.name
    });
    
    const message = typeof err?.message === 'string' ? err.message : 'Upstream call failed';
    return NextResponse.json({ 
      error: message,
      details: err.toString(),
      bffOrigin: getBffOrigin(),
      env: process.env.NEXT_PUBLIC_BFF_ORIGIN,
      stack: err.stack,
      code: err.code
    }, { status: 502 });
  }
}


