'use client';

import React, { useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  // 동일 오리진 경로 사용: Next.js rewrites가 /auth/*를 Auth API로 전달
  const [loadingProvider, setLoadingProvider] = useState<'Google' | 'Naver' | 'Kakao' | null>(null);
  // 8124에 쿠키 저장을 원하므로 고정 ORIGIN 사용
  const AUTH_ORIGIN = 'http://172.29.208.1:8124';

  if (!isOpen) return null;

  const handleSocialLogin = async (provider: 'Google' | 'Naver' | 'Kakao') => {
    if (loadingProvider) return;
    setLoadingProvider(provider);

    try {
      if (provider === 'Google') {
        window.location.href = `/auth/google`;
        return;
      }

      if (provider === 'Naver') {
        window.location.href = `/auth/naver`;
        return;
      }

      if (provider === 'Kakao') {
        window.location.href = `/auth/kakao`;
        return;
      }

    } catch (e) {
      console.error('소셜 로그인 시작 실패:', e);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-96 max-w-[90vw] mx-4 h-[600px] flex flex-col">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center relative">
            <div />
            <button
              onClick={onClose}
              className="absolute -right-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 text-center mt-4">로그인</h2>
          <p className="text-gray-600 mt-2 text-center">계정에 로그인하여 더 많은 기능을 이용하세요</p>
        </div>

        {/* 소셜 로그인 버튼들 */}
        <div className="p-6 space-y-12 flex-1 flex flex-col justify-center">
          {/* Google Login */}
          <button
            onClick={() => handleSocialLogin('Google')}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingProvider === 'Google' ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700" />
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="text-lg font-medium">
              {loadingProvider === 'Google' ? '로그인 중...' : 'Google Login'}
            </span>
          </button>

          {/* Naver Login */}
          <button
            onClick={() => handleSocialLogin('Naver')}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingProvider === 'Naver' ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z"/>
              </svg>
            )}
            <span className="text-lg font-medium">
              {loadingProvider === 'Naver' ? '로그인 중...' : 'Naver Login'}
            </span>
          </button>

          {/* Kakao Login */}
          <button
            onClick={() => handleSocialLogin('Kakao')}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-yellow-400 text-gray-800 rounded-xl hover:bg-yellow-500 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingProvider === 'Kakao' ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800" />
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11L8.5 21.5c-1.5.5-3.5-1-3-2.5l.5-2.5c-2.5-1.5-4.5-4-4.5-6.5C1.5 6.664 6.201 3 12 3Z"/>
              </svg>
            )}
            <span className="text-lg font-medium">
              {loadingProvider === 'Kakao' ? '로그인 중...' : 'Kakao Login'}
            </span>
          </button>
        </div>

        {/* 하단 텍스트 */}
        <div className="p-6 bg-gray-50 rounded-b-2xl">
          <p className="text-center text-sm text-gray-600">
            로그인하면 서비스 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
