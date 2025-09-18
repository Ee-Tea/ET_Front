'use client';

import React from 'react';

interface ChatHistoryContainerProps {
  testSessions: any[];
  setTestSessions: React.Dispatch<React.SetStateAction<any[]>>;
  currentSessionId: string | null;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  onNewChat: () => void;
  isBackendConnected: boolean;
  onDeleteSession?: (sessionId: string) => Promise<void> | void;
  onOpenLogin?: () => void;
}

export default function ChatHistoryContainer({
  testSessions,
  setTestSessions,
  currentSessionId,
  setCurrentSessionId,
  onNewChat,
  isBackendConnected,
  onDeleteSession,
  onOpenLogin
}: ChatHistoryContainerProps) {
  const toPlus9 = (iso?: string) => {
    try {
      if (!iso) return '';
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
      return kst.toLocaleString();
    } catch {
      return iso || '';
    }
  };
  React.useEffect(() => {
    console.log('[sidebar] render with sessions =', Array.isArray(testSessions) ? testSessions.length : null, 'currentSessionId =', currentSessionId);
  }, [testSessions, currentSessionId]);
  
  const isValidSid = (sid: any) => typeof sid === 'string' && /^[a-f0-9]{24}$/i.test(sid);

  // 세션 배열 중복/무효 ID 정리 (key 경고 방지)
  const uniqueSessions = React.useMemo(() => {
    const seen = new Set<string>();
    const result: any[] = [];
    for (let i = 0; i < testSessions.length; i++) {
      const s = testSessions[i];
      const id = (s && typeof s.session_id === 'string' && s.session_id) ? s.session_id : '';
      const dedupeKey = id || `${s?.title ?? ''}:${s?.created_at ?? ''}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      result.push(s);
    }
    return result;
  }, [testSessions]);

  // 클릭 가능한 세션만 노출 (세션ID 유효)
  const displaySessions = React.useMemo(() => {
    // 1) 유효한 session_id만
    let filtered = uniqueSessions.filter(s => isValidSid(s?.session_id));
    if (filtered.length !== uniqueSessions.length) {
      console.warn('[sidebar] filtered invalid sessions', uniqueSessions.length - filtered.length);
    }
    // 2) 제목 없는 세션 제외 (UI에서 '새 채팅'으로 표시될 것들)
    const before = filtered.length;
    filtered = filtered.filter(s => typeof s?.title === 'string' && s.title.trim().length > 0);
    if (filtered.length !== before) {
      console.warn('[sidebar] filtered untitled sessions', before - filtered.length);
    }
    return filtered;
  }, [uniqueSessions]);

  return (
    <div className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h2 className="text-lg font-semibold text-gray-800 text-center">채팅 히스토리</h2>
      </div>

      {/* 내용 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-2">
          {/* 새 채팅 버튼 */}
          <button
            onClick={onNewChat}
            className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>새 채팅</span>
          </button>
          
          {displaySessions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">아직 채팅이 없습니다</p>
              <p className="text-xs mt-1">새 채팅을 시작해보세요</p>
            </div>
          ) : (
            displaySessions.map((session, idx) => (
              <div
                key={(session && session.session_id) ? String(session.session_id) : `${session?.title ?? 'untitled'}:${session?.created_at ?? ''}:${idx}`}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session.session_id
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
                onClick={() => {
                  console.log('[sidebar] click session', session);
                  if (!isValidSid(session.session_id)) return;
                  setCurrentSessionId(session.session_id)
                }}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm truncate">{session.title || '새 채팅'}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {session.created_at ? toPlus9(session.created_at) : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 푸터 - 연결 상태 */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 font-medium">백엔드</span>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isBackendConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`font-semibold ${isBackendConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isBackendConnected ? '연결됨' : '연결 안됨'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
