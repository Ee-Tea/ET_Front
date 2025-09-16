import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // 하이드레이션 오류 방지를 위한 설정
    optimizePackageImports: ['@copilotkit/react-core', '@copilotkit/react-ui'],
  },
  // ESLint 비활성화 (빌드 시)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScript 오류 무시 (빌드 시)
  typescript: {
    ignoreBuildErrors: true,
  },
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

  // ✅ 프록시: 프론트(3000) -> 백엔드(8124, 8100)
  async rewrites() {
    return [
      // Auth/BFF -> 8124
      { source: '/auth/:path*', destination: 'http://localhost:8124/auth/:path*' },
      // Backend core -> 8100 (PDF/채팅 등)
      { source: '/backend/:path*', destination: 'http://localhost:8100/:path*' },
       
    ];
  },
};

export default nextConfig;