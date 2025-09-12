'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('로그인 처리 중...');

  useEffect(() => {
    const handleCallback = async () => {
      console.log('=== Google OAuth 콜백 처리 시작 ===');
      console.log('현재 URL:', window.location.href);
      
      // URL에서 인증 코드 또는 에러 추출
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('OAuth 에러:', error, errorDescription);
        setStatus('error');
        setMessage(`인증 오류: ${error} - ${errorDescription || '알 수 없는 오류'}`);
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      if (!code) {
        console.error('인증 코드가 없습니다');
        setStatus('error');
        setMessage('인증 코드를 받지 못했습니다.');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      console.log('인증 코드 받음:', code);
      
      try {
        // 백엔드로 인증 코드 전송하여 사용자 정보 받기
        const response = await fetch('/api/auth/google/callback', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        console.log('사용자 정보 받음:', userData);

        // 사용자 정보를 AuthContext에 저장
        login({
          id: userData.id || userData.sub,
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
          provider: 'google'
        });

        setStatus('success');
        setMessage('구글 로그인이 성공했습니다!');
        
        // 2초 후 메인 페이지로 리디렉션
        setTimeout(() => router.push('/'), 2000);
      } catch (error) {
        console.error('로그인 처리 오류:', error);
        setStatus('error');
        setMessage('로그인 처리 중 오류가 발생했습니다.');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {status === 'processing' && (
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
        )}
        {status === 'success' && (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        <h1 className={`text-2xl font-bold mb-4 ${
          status === 'success' ? 'text-green-800' : 
          status === 'error' ? 'text-red-800' : 'text-gray-800'
        }`}>
          {status === 'success' ? '로그인 성공!' : 
           status === 'error' ? '로그인 실패' : '로그인 처리 중...'}
        </h1>
        <p className={`text-gray-600 ${
          status === 'success' ? 'text-green-600' : 
          status === 'error' ? 'text-red-600' : ''
        }`}>
          {message}
        </p>
      </div>
    </div>
  );
}
