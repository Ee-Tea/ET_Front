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
    const AUTH_ORIGIN = process.env.NEXT_PUBLIC_AUTH_ORIGIN || 'http://localhost:8124';
    const BFF_ORIGIN = process.env.NEXT_PUBLIC_BFF_ORIGIN || 'http://localhost:8100';
    return [
      // Auth → AUTH_ORIGIN
      { source: '/auth/:path*', destination: `${AUTH_ORIGIN}/auth/:path*` },
      // Backend core → BFF_ORIGIN (PDF/채팅 등)
      { source: '/backend/:path*', destination: `${BFF_ORIGIN}/:path*` },
    ];
  },
};

export default nextConfig;