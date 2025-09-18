# Node.js 18 Alpine 이미지 사용
FROM node:18-alpine AS base

# Build arguments for OAuth configuration
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_REDIRECT_URI
ARG NEXT_PUBLIC_KAKAO_CLIENT_ID
ARG NEXT_PUBLIC_KAKAO_REDIRECT_URI
ARG NEXT_PUBLIC_NAVER_CLIENT_ID
ARG NEXT_PUBLIC_NAVER_REDIRECT_URI
ARG NEXT_PUBLIC_BFF_ORIGIN
ARG NEXT_PUBLIC_AUTH_ORIGIN

# pnpm 설치
RUN npm install -g pnpm

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일들 복사
COPY package.json pnpm-lock.yaml ./

# 의존성 설치 (postinstall 스크립트 비활성화)
RUN pnpm install --frozen-lockfile --ignore-scripts

# 소스 코드 복사
COPY . .

# Next.js 빌드
RUN pnpm build

# 프로덕션 이미지
FROM node:18-alpine AS runner

# pnpm 설치
RUN npm install -g pnpm

WORKDIR /app

# 프로덕션 의존성만 설치 (postinstall 스크립트 비활성화)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# 빌드된 애플리케이션 복사
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/next.config.ts ./

# 포트 설정
EXPOSE 3000

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000

# OAuth 환경변수 설정
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_REDIRECT_URI=$NEXT_PUBLIC_GOOGLE_REDIRECT_URI
ENV NEXT_PUBLIC_KAKAO_CLIENT_ID=$NEXT_PUBLIC_KAKAO_CLIENT_ID
ENV NEXT_PUBLIC_KAKAO_REDIRECT_URI=$NEXT_PUBLIC_KAKAO_REDIRECT_URI
ENV NEXT_PUBLIC_NAVER_CLIENT_ID=$NEXT_PUBLIC_NAVER_CLIENT_ID
ENV NEXT_PUBLIC_NAVER_REDIRECT_URI=$NEXT_PUBLIC_NAVER_REDIRECT_URI
ENV NEXT_PUBLIC_BFF_ORIGIN=$NEXT_PUBLIC_BFF_ORIGIN
ENV NEXT_PUBLIC_AUTH_ORIGIN=$NEXT_PUBLIC_AUTH_ORIGIN

# Next.js 애플리케이션 실행
CMD ["pnpm", "start"]