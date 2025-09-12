'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  testSessions: any[];
  setTestSessions: React.Dispatch<React.SetStateAction<any[]>>;
  currentSessionId: string | null;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenVoice: () => void;
  isBackendConnected: boolean;
  isOpen: boolean;
  onOpenLogin?: () => void;
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
  isOpen,
  onOpenLogin
}: SidebarProps) {
  const { user, logout } = useAuth();
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
        <div className="space-y-3 w-full">
          {/* 사용자 프로필 또는 로그인 버튼 */}
          {user ? (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {user.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium text-sm">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-xs text-gray-400">
                    {user.provider === 'google' ? '구글' : 
                     user.provider === 'kakao' ? '카카오' : 
                     user.provider === 'naver' ? '네이버' : '알 수 없음'}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="로그아웃"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            onOpenLogin && (
              <div className="p-3">
                <button
                  onClick={onOpenLogin}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>로그인</span>
                </button>
              </div>
            )
          )}
          
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
        </div>
      </div>
    </div>
  );
}
