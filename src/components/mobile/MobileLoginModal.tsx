'use client';

import React, { useState } from 'react';

interface MobileLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileLoginModal({ isOpen, onClose }: MobileLoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // 모바일에서는 백엔드 연결 없이 직접 Google OAuth URL 생성
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Google Client ID가 설정되지 않았습니다.');
      }

      const redirectUri = `${window.location.origin}/mobile/callback`;
      const scope = 'openid email profile';
      
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scope,
        access_type: 'offline',
        prompt: 'consent'
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      // 구글 OAuth로 이동
      window.location.href = authUrl;
      return;
    } catch (e) {
      console.error('Google 로그인 시작 실패:', e);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-h-[70vh] overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">로그인</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">계정에 로그인하여 더 많은 기능을 이용하세요</p>
        </div>

        {/* 로그인 버튼들 */}
        <div className="px-6 py-8 space-y-4">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mobile-button"
          >
            {isLoading ? (
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
              {isLoading ? '로그인 중...' : 'Google로 로그인'}
            </span>
          </button>

          {/* Naver Login */}
          <button
            onClick={() => alert('네이버 로그인은 준비 중입니다.')}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg mobile-button"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z"/>
            </svg>
            <span className="text-lg font-medium">네이버로 로그인</span>
          </button>

          {/* Kakao Login */}
          <button
            onClick={() => alert('카카오 로그인은 준비 중입니다.')}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-yellow-400 text-gray-800 rounded-xl hover:bg-yellow-500 transition-colors shadow-lg mobile-button"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11L8.5 21.5c-1.5.5-3.5-1-3-2.5l.5-2.5c-2.5-1.5-4.5-4-4.5-6.5C1.5 6.664 6.201 3 12 3Z"/>
            </svg>
            <span className="text-lg font-medium">카카오로 로그인</span>
          </button>
        </div>

        {/* 하단 텍스트 */}
        <div className="px-6 pb-6">
          <p className="text-center text-xs text-gray-500 leading-relaxed">
            로그인하면 서비스 이용약관 및 개인정보처리방침에<br />
            동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
