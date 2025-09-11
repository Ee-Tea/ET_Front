'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface MobileSettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isBackendConnected: boolean;
  onVoiceTest?: () => void;
  onGetHelp?: () => void;
  onLogin?: () => void;
  user?: any;
}

const MobileSettingsMenu: React.FC<MobileSettingsMenuProps> = ({
  isOpen,
  onClose,
  isBackendConnected,
  onVoiceTest,
  onGetHelp,
  onLogin,
  user
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-hidden">
        {/* 메뉴 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">F</span>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800">FT Assistant</div>
                <div className="text-sm text-gray-500">
                  {user ? `${user.name}님 환영합니다` : '로그인이 필요합니다'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 메뉴 아이템들 */}
        <div className="px-6 py-4 space-y-4">
          {/* 서버 상태 */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-gray-800 font-medium">서버 상태</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm ${isBackendConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isBackendConnected ? '연결됨' : '연결 안됨'}
              </span>
            </div>
          </div>

          {/* 음성 테스트 */}
          <button
            onClick={() => {
              if (onVoiceTest) onVoiceTest();
              onClose();
            }}
            className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="text-gray-800 font-medium">음성 테스트</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* 도움 받기 */}
          <button
            onClick={() => {
              if (onGetHelp) onGetHelp();
              onClose();
            }}
            className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-gray-800 font-medium">도움 받기</span>
            </div>
          </button>
        </div>

        {/* 로그인/로그아웃 버튼 */}
        <div className="px-6 pb-6">
          {user ? (
            <button
              onClick={() => {
                // 로그아웃 로직 추가
                console.log('로그아웃');
                onClose();
              }}
              className="w-full bg-red-500 text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">로그아웃</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (onLogin) onLogin();
                onClose();
              }}
              className="w-full bg-blue-500 text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">로그인</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileSettingsMenu;
