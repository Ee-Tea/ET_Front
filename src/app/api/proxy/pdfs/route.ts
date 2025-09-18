export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function getBffOrigin() {
  return process.env.NEXT_PUBLIC_BFF_ORIGIN || 'http://localhost:8100';
}

export async function GET(request: NextRequest) {
  try {
    const url = `${getBffOrigin()}/pdfs`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
      cache: 'no-store',
    });
    
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch (err: any) {
    const message = typeof err?.message === 'string' ? err.message : 'Upstream call failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
