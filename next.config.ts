import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // 하이드레이션 오류 방지를 위한 설정
    optimizePackageImports: ['@copilotkit/react-core', '@copilotkit/react-ui'],
  },
  // SSR 최적화
  swcMinify: true,
  // 컴파일러 옵션
  compiler: {
    // 개발 환경에서 콘솔 제거 X, 프로덕션만 제거
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 하이드레이션 오류 방지
  reactStrictMode: false,
  // 개발 환경에서 하이드레이션 경고 억제
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // ✅ 프록시: 프론트(3000) → 백엔드들
  async rewrites() {
    return [
      // 인증 서버 (8124) 프록시
      { source: '/api/auth/:path*', destination: 'http://localhost:8124/auth/:path*' },
      { source: '/api/:path*', destination: 'http://localhost:8124/:path*' },
      // 채팅/PDF 서버 (8000) 프록시
      { source: '/backend/:path*', destination: 'http://localhost:8000/:path*' },
    ];
  },
};

export default nextConfig;
