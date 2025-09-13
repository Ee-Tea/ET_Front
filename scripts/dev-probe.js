/* eslint-disable no-console */
(async () => {
  const front = process.env.FRONT_ORIGIN || 'http://localhost:3000';
  const proxy = process.env.PROXY_ORIGIN || 'http://localhost';

  const requests = [
    {
      name: 'front/chat',
      url: `${front}/backend/chat`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'ping', user_id: 'frontend_user', chat_id: 'frontend_chat' })
      }
    },
    { name: 'front/recent-questions', url: `${front}/backend/recent-questions` },
    {
      name: 'proxy/chat',
      url: `${proxy}/backend/chat`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'ping', user_id: 'frontend_user', chat_id: 'frontend_chat' })
      }
    },
    { name: 'proxy/recent-questions', url: `${proxy}/backend/recent-questions` },
  ];

  for (const { name, url, init } of requests) {
    try {
      const res = await fetch(url, init);
      const text = await res.text();
      const snippet = (text || '').slice(0, 200).replace(/\n/g, ' ');
      console.log(`[${name}] ${res.status} ${res.statusText} ${snippet}`);
    } catch (e) {
      console.log(`[${name}] ERROR ${(e && e.message) || e}`);
    }
  }
})();


