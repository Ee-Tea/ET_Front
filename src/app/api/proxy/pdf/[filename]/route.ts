export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function getBffOrigin() {
  // 임시로 하드코딩 (환경변수 문제 해결 후 제거)
  return process.env.NEXT_PUBLIC_BFF_ORIGIN || 'http://10.0.136.230:8100';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const url = `${getBffOrigin()}/pdf/${encodeURIComponent(filename)}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/pdf',
      },
      cache: 'no-store',
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }
    
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      status: res.status,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    const message = typeof err?.message === 'string' ? err.message : 'Upstream call failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
