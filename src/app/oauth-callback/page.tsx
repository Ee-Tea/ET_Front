'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleOAuthCallback = () => {
      try {
        console.log('=== OAuth 콜백 처리 시작 ===');
        console.log('현재 URL:', window.location.href);
        
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        const scope = urlParams.get('scope');
        
        if (error) {
          console.error('OAuth 에러:', error, errorDescription);
          alert(`인증 오류: ${error} - ${errorDescription || '알 수 없는 오류'}`);
          router.push('/');
          return;
        }
        
        if (code) {
          console.log('OAuth 인증 코드 받음:', code);
          console.log('스코프:', scope);
          alert('구글 로그인이 성공했습니다!');
          
          // 메인 페이지로 리디렉션
          router.push('/');
        } else {
          console.log('OAuth 코드가 없습니다');
          router.push('/');
        }
      } catch (error) {
        console.error('OAuth 콜백 처리 오류:', error);
        router.push('/');
      }
    };
    
    handleOAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">로그인 처리 중...</h1>
        <p className="text-gray-600">잠시만 기다려주세요...</p>
      </div>
    </div>
  );
}


