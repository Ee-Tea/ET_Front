#!/bin/bash

# ET Frontend 배포 스크립트
echo "🚀 ET Frontend 배포를 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 에러 처리 함수
handle_error() {
    echo -e "${RED}❌ 오류가 발생했습니다: $1${NC}"
    exit 1
}

# 성공 메시지 함수
success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 경고 메시지 함수
warning_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 환경 확인
echo "🔍 환경을 확인합니다..."
if ! command -v docker &> /dev/null; then
    handle_error "Docker가 설치되어 있지 않습니다."
fi

if ! command -v docker-compose &> /dev/null; then
    handle_error "Docker Compose가 설치되어 있지 않습니다."
fi

success_msg "Docker 환경 확인 완료"

# 기존 컨테이너 정리
echo "🧹 기존 컨테이너를 정리합니다..."
docker-compose down --remove-orphans || warning_msg "기존 컨테이너 정리 중 일부 오류 발생"

# 이미지 빌드
echo "🔨 Docker 이미지를 빌드합니다..."
docker-compose build --no-cache || handle_error "이미지 빌드 실패"

success_msg "이미지 빌드 완료"

# 컨테이너 시작
echo "🚀 컨테이너를 시작합니다..."
docker-compose up -d || handle_error "컨테이너 시작 실패"

success_msg "컨테이너 시작 완료"

# 헬스 체크
echo "🏥 서비스 상태를 확인합니다..."
sleep 10

# 프론트엔드 헬스 체크
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    success_msg "프론트엔드 서비스 정상 동작"
else
    warning_msg "프론트엔드 서비스 응답 없음"
fi

# 컨테이너 상태 확인
echo "📊 컨테이너 상태:"
docker-compose ps

# 로그 확인 옵션
read -p "로그를 확인하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 최근 로그를 표시합니다..."
    docker-compose logs --tail=50
fi

success_msg "배포가 완료되었습니다! 🎉"
echo "🌐 프론트엔드: http://localhost:3000"
echo "🔧 관리 명령어:"
echo "  - 로그 확인: docker-compose logs -f"
echo "  - 서비스 중지: docker-compose down"
echo "  - 서비스 재시작: docker-compose restart"
