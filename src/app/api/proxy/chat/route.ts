export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBffOrigin() {
  return process.env.NEXT_PUBLIC_BFF_ORIGIN || 'http://localhost:8100';
}

export async function POST(request: Request) {
  const url = `${getBffOrigin()}/chat`;
  const body = await request.text();
  const incomingHeaders = request.headers;
  const headers: Record<string, string> = {
    'content-type': incomingHeaders.get('content-type') || 'application/json',
    'x-user-id': incomingHeaders.get('x-user-id') || 'frontend_user',
    'x-chat-id': incomingHeaders.get('x-chat-id') || 'frontend_chat',
    'x-request-id': incomingHeaders.get('x-request-id') || Math.random().toString(36).slice(2, 10),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body,
    // no timeout; rely on upstream
    cache: 'no-store',
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') || 'application/json',
    },
  });
}


