'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('로그인 처리 중...');

  useEffect(() => {
    const handleCallback = async () => {
      console.log('=== 모바일 Google OAuth 콜백 처리 시작 ===');
      console.log('현재 URL:', window.location.href);
      
      // URL에서 인증 코드 또는 에러 추출
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('OAuth 에러:', error, errorDescription);
        setStatus('error');
        setMessage(`인증 오류: ${error} - ${errorDescription || '알 수 없는 오류'}`);
        setTimeout(() => router.push('/mobile'), 3000);
        return;
      }

      if (!code) {
        console.error('인증 코드가 없습니다');
        setStatus('error');
        setMessage('인증 코드를 받지 못했습니다.');
        setTimeout(() => router.push('/mobile'), 3000);
        return;
      }

      console.log('인증 코드 받음:', code);
      
      try {
        // 모바일에서는 백엔드 없이 Google OAuth 토큰 직접 처리
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
          throw new Error('Google Client ID가 설정되지 않았습니다.');
        }

        // Google OAuth 토큰 교환
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: `${window.location.origin}/mobile/callback`,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('토큰 교환 실패');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Google 사용자 정보 가져오기
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error('사용자 정보 가져오기 실패');
        }

        const userData = await userResponse.json();
        console.log('사용자 정보 받음:', userData);

        // 사용자 정보를 AuthContext에 저장
        login({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
          provider: 'google'
        });

        setStatus('success');
        setMessage('구글 로그인이 성공했습니다!');
        
        // 2초 후 모바일 메인 페이지로 리디렉션
        setTimeout(() => router.push('/mobile'), 2000);
      } catch (error) {
        console.error('로그인 처리 오류:', error);
        setStatus('error');
        setMessage('로그인 처리 중 오류가 발생했습니다.');
        setTimeout(() => router.push('/mobile'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center mobile-container mobile-safe-area">
      {/* 모바일 프레임 */}
      <div className="w-full max-w-sm mx-auto bg-black rounded-[2.5rem] p-2 mobile-frame">
        {/* 노치 영역 */}
        <div className="h-6 bg-black rounded-t-[2rem] flex items-center justify-center">
          <div className="w-32 h-1 bg-gray-600 rounded-full"></div>
        </div>
        
        {/* 실제 화면 영역 */}
        <div className="bg-white rounded-[2rem] h-[calc(100vh-2rem)] flex flex-col items-center justify-center px-6 text-center">
          {/* 로딩 스피너 */}
          <div className={`w-16 h-16 rounded-full border-4 mb-6 ${
            status === 'processing' ? 'border-blue-500 border-t-transparent animate-spin' :
            status === 'success' ? 'border-green-500' :
            'border-red-500'
          }`}>
            {status === 'success' && (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          
          {/* 상태 메시지 */}
          <h1 className="text-xl font-bold text-gray-800 mb-4">
            {status === 'processing' && '로그인 처리 중...'}
            {status === 'success' && '로그인 성공!'}
            {status === 'error' && '로그인 실패'}
          </h1>
          
          <p className="text-gray-600 text-sm leading-relaxed">
            {message}
          </p>
          
          {status === 'processing' && (
            <p className="text-gray-500 text-xs mt-4">
              잠시만 기다려주세요...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
