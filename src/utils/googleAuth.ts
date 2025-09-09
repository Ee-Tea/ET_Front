// 구글 OAuth 설정 및 인증 관련 유틸리티

export interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

// 구글 OAuth 설정
export const GOOGLE_AUTH_CONFIG: GoogleAuthConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000',
  scope: 'openid email profile'
};

// 테스트된 리디렉션 URI (메인 페이지)
export const WORKING_REDIRECT_URI = 'http://localhost:8000/auth/google/callback';

// 구글 로그인 URL 생성
export const generateGoogleAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: GOOGLE_AUTH_CONFIG.clientId,
    redirect_uri: GOOGLE_AUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: GOOGLE_AUTH_CONFIG.scope,
    access_type: 'offline',
    prompt: 'consent'
  });


  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// 구글 로그인 직접 실행
export const initiateGoogleLogin = (): void => {
  if (!GOOGLE_AUTH_CONFIG.clientId) {
    throw new Error('Google Client ID가 설정되지 않았습니다. 환경변수를 확인해주세요.');
  }
  
  console.log('현재 설정:');
  console.log('- Client ID:', GOOGLE_AUTH_CONFIG.clientId);
  console.log('- Redirect URI:', GOOGLE_AUTH_CONFIG.redirectUri);
  
  const authUrl = generateGoogleAuthUrl();
  console.log('생성된 구글 OAuth URL:', authUrl);
  
  window.location.href = authUrl;
};

// 테스트된 리디렉션 URI로 구글 로그인
export const initiateGoogleLoginWithTestedUri = (): void => {
  if (!GOOGLE_AUTH_CONFIG.clientId) {
    throw new Error('Google Client ID가 설정되지 않았습니다. 환경변수를 확인해주세요.');
  }
  
  console.log('=== 구글 OAuth 로그인 시작 ===');
  console.log('Client ID:', GOOGLE_AUTH_CONFIG.clientId);
  console.log('리디렉션 URI:', WORKING_REDIRECT_URI);
  console.log('현재 도메인:', window.location.origin);
  
  /*
  const params = new URLSearchParams({
    client_id: GOOGLE_AUTH_CONFIG.clientId,
    redirect_uri: WORKING_REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_AUTH_CONFIG.scope,
    access_type: 'offline',
    prompt: 'consent'
  });*/
  const params = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=236988096890-5sdm5ivdu05e88g9obi449iq2mum4554.apps.googleusercontent.com&` +
  `redirect_uri=http://localhost:8000/auth/google/callback&` +
  `response_type=code&` +
  `scope=email profile&` +
  `access_type=offline&` +
  `prompt=consent`;
  
  const authUrl = `${params.toString()}`;
  
  
  
  // 추가 보안 파라미터
  console.log(authUrl);
  alert(authUrl);
  
  window.location.href = authUrl;
};

// URL에서 인증 코드 추출
export const extractAuthCodeFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('code');
};

// 에러 메시지 추출
export const extractErrorFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('error');
};

// 환경변수 및 설정 확인 함수
export const checkGoogleAuthConfig = (): void => {
  console.log('=== 구글 OAuth 설정 확인 ===');
  console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  console.log('NEXT_PUBLIC_GOOGLE_REDIRECT_URI:', process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI);
  console.log('현재 설정된 Client ID:', GOOGLE_AUTH_CONFIG.clientId);
  console.log('현재 설정된 Redirect URI:', GOOGLE_AUTH_CONFIG.redirectUri);
  console.log('현재 도메인:', window.location.origin);
  console.log('현재 포트:', window.location.port);
  console.log('현재 프로토콜:', window.location.protocol);
  console.log('============================');
};

// 백엔드로 인증 코드 전송하여 토큰 받기
export const exchangeCodeForToken = async (code: string): Promise<any> => {
  try {
    console.log('백엔드로 인증 코드 전송:', code);
    
    const response = await fetch('http://localhost:8123/auth/google/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('토큰 받기 성공:', data);
    return data;
  } catch (error) {
    console.error('토큰 교환 오류:', error);
    throw error;
  }
};
