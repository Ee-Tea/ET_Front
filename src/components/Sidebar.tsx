'use client';

import React from 'react';

interface SidebarProps {
  testSessions: any[];
  setTestSessions: React.Dispatch<React.SetStateAction<any[]>>;
  currentSessionId: string | null;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenVoice: () => void;
  isBackendConnected: boolean;
  isVoiceServiceConnected: boolean;
  isOpen: boolean;
}

export default function Sidebar({
  testSessions,
  setTestSessions,
  currentSessionId,
  setCurrentSessionId,
  onNewChat,
  onOpenSettings,
  onOpenVoice,
  isBackendConnected,
  isVoiceServiceConnected,
  isOpen
}: SidebarProps) {
  return (
    <div className={`w-1/5 min-w-64 min-h-screen bg-white flex flex-col border-r border-gray-200 shadow-sm ${
      isOpen ? 'block' : 'hidden'
    }`}>
      {/* 사이드바 헤더 */}
      <div className="p-4 border-b border-gray-200 bg-white h-16 flex items-center">
        <div className="flex items-center justify-center w-full">
          <h2 className="text-lg font-semibold text-gray-800">채팅 히스토리</h2>
        </div>
      </div>

      {/* 채팅 히스토리 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {/* 새 채팅 버튼 */}
          <button
            onClick={onNewChat}
            className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>새 채팅</span>
          </button>
          
          {testSessions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">아직 채팅이 없습니다</p>
              <p className="text-xs mt-1">새 채팅을 시작해보세요</p>
            </div>
          ) : (
            testSessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
                onClick={() => setCurrentSessionId(session.id)}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm truncate">{session.name || '새 채팅'}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(session.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 사이드바 푸터 */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <div className="space-y-2 w-full">
          {/* 연결 상태 표시 */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">백엔드</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={isBackendConnected ? 'text-green-600' : 'text-red-600'}>
                {isBackendConnected ? '연결됨' : '연결 안됨'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">음성 서비스</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isVoiceServiceConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={isVoiceServiceConnected ? 'text-green-600' : 'text-red-600'}>
                {isVoiceServiceConnected ? '연결됨' : '연결 안됨'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
