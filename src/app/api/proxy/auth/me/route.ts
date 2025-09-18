export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function getAuthOrigin() {
  // Auth API는 8124 포트에서 실행
  return process.env.NEXT_PUBLIC_AUTH_ORIGIN || 'http://10.0.136.230:8124';
}

export async function GET(request: NextRequest) {
  try {
    const authOrigin = getAuthOrigin();
    const url = `${authOrigin}/auth/me`;
    
    console.log('Proxy Auth Me Request:', {
      authOrigin,
      url,
      env: process.env.NEXT_PUBLIC_AUTH_ORIGIN
    });
    
    const incomingHeaders = request.headers;
    const headers: Record<string, string> = {
      'cache-control': 'no-cache',
      'pragma': 'no-cache',
    };

    // 쿠키 전달
    const cookie = incomingHeaders.get('cookie');
    if (cookie) {
      headers['cookie'] = cookie;
    }

    console.log('Making request to:', url, 'with headers:', headers);

    const res = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    console.log('Response status:', res.status, res.statusText);

    const text = await res.text();
    
    // 응답 헤더 전달
    const responseHeaders: Record<string, string> = {
      'content-type': res.headers.get('content-type') || 'application/json',
    };

    // 쿠키 전달
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      responseHeaders['set-cookie'] = setCookie;
    }

    return new NextResponse(text, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('Proxy Auth Me Error:', err);
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
      authOrigin: getAuthOrigin(),
      env: process.env.NEXT_PUBLIC_AUTH_ORIGIN,
      stack: err.stack,
      code: err.code
    }, { status: 502 });
  }
}
