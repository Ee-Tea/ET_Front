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
  isVoiceServiceConnected
}: SidebarProps) {
  return (
    <div className="w-80 bg-gray-900 flex flex-col">
      {/* 사이드바 헤더 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/FT-logo.png" 
              alt="FT Logo" 
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-xl font-bold text-white">FT</h1>
          </div>
          <div className="flex items-center space-x-2">
            {/* 음성 패널 버튼 */}
            <button
              onClick={onOpenVoice}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="음성 패널"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            
            {/* 설정 버튼 */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="설정"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 새 채팅 버튼 */}
        <button
          onClick={onNewChat}
          className="w-full mt-4 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>새 채팅</span>
        </button>
      </div>

      {/* 채팅 히스토리 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
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
      <div className="p-4 border-t border-gray-700">
        <div className="space-y-2">
          {/* 연결 상태 표시 */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">백엔드</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={isBackendConnected ? 'text-green-400' : 'text-red-400'}>
                {isBackendConnected ? '연결됨' : '연결 안됨'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">음성 서비스</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isVoiceServiceConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={isVoiceServiceConnected ? 'text-green-400' : 'text-red-400'}>
                {isVoiceServiceConnected ? '연결됨' : '연결 안됨'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
