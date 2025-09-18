# CopilotKit <> LangGraph 스타터

이것은 [LangGraph](https://www.langchain.com/langgraph)와 [CopilotKit](https://copilotkit.ai)을 사용하여 AI 에이전트를 구축하기 위한 스타터 템플릿입니다. 통합된 LangGraph 에이전트가 구축된 최신 Next.js 애플리케이션을 제공합니다.

## 사전 요구사항

- Node.js 18+ 
- Python 3.8+
- 다음 패키지 매니저 중 하나:
  - [pnpm](https://pnpm.io/installation) (권장)
  - npm
  - [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)
  - [bun](https://bun.sh/)
- OpenAI API 키 (LangGraph 에이전트용)

> **참고:** 이 저장소는 서로 다른 패키지 매니저 간의 충돌을 피하기 위해 락 파일(package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb)을 무시합니다. 각 개발자는 선호하는 패키지 매니저를 사용하여 자체 락 파일을 생성해야 합니다. 그 후 .gitignore에서 삭제해야 합니다.

## 시작하기

1. 선호하는 패키지 매니저를 사용하여 의존성을 설치하세요:
```bash
# pnpm 사용 (권장)
pnpm install

# npm 사용
npm install

# yarn 사용
yarn install

# bun 사용
bun install
```

2. LangGraph 에이전트의 의존성을 설치하세요:
```bash
cd agent
```
```bash
# pnpm 사용 (권장)
pnpm install 

# npm 사용
npm run install

# yarn 사용
yarn install

# bun 사용
bun run install
```

3. 환경변수를 설정하세요!:

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경변수들을 설정하세요:

```bash
# OpenAI API 키 (LangGraph 에이전트용)
OPENAI_API_KEY=your-openai-api-key-here

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Kakao OAuth
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_client_id
NEXT_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback

# Naver OAuth
NEXT_PUBLIC_NAVER_CLIENT_ID=your_naver_client_id
NEXT_PUBLIC_NAVER_REDIRECT_URI=http://localhost:3000/auth/naver/callback

# Backend API
NEXT_PUBLIC_BFF_ORIGIN=http://localhost:8100
```

**OAuth 설정 방법:**
- Google: [Google Cloud Console](https://console.cloud.google.com/)에서 OAuth 2.0 클라이언트 ID 생성
- Kakao: [Kakao Developers](https://developers.kakao.com/)에서 애플리케이션 등록
- Naver: [Naver Developers](https://developers.naver.com/)에서 애플리케이션 등록

**GitHub Secrets 설정 (CI/CD용):**
GitHub Actions에서 Docker 이미지를 빌드할 때 사용할 시크릿을 설정하세요:

1. GitHub 리포지토리 → Settings → Secrets and variables → Actions
2. 다음 시크릿들을 추가하세요:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`
   - `NEXT_PUBLIC_KAKAO_CLIENT_ID`
   - `NEXT_PUBLIC_KAKAO_REDIRECT_URI`
   - `NEXT_PUBLIC_NAVER_CLIENT_ID`
   - `NEXT_PUBLIC_NAVER_REDIRECT_URI`
   - `NEXT_PUBLIC_BFF_ORIGIN` (백엔드 API 주소)
   - `DOCKER_USERNAME` (Docker Hub 사용자명)
   - `DOCKER_PASSWORD` (Docker Hub 비밀번호)

4. 개발 서버를 시작하세요:
```bash
# pnpm 사용 (권장)
pnpm dev

# npm 사용
npm run dev

# yarn 사용
yarn dev

# bun 사용
bun run dev
```

이렇게 하면 UI와 에이전트 서버가 동시에 시작됩니다.

## 사용 가능한 스크립트
다음 스크립트는 선호하는 패키지 매니저를 사용하여 실행할 수도 있습니다:
- `dev` - 개발 모드에서 UI와 에이전트 서버를 모두 시작
- `dev:studio` - LangGraph Studio와 함께 UI와 에이전트 시작
- `dev:debug` - 디버그 로깅이 활성화된 개발 서버 시작
- `dev:ui` - Next.js UI 서버만 시작
- `dev:agent` - LangGraph 에이전트 서버만 시작
- `dev:agent:studio` - LangGraph Studio와 함께 LangGraph 에이전트 서버 시작
- `build` - 프로덕션용 Next.js 애플리케이션 빌드
- `start` - 프로덕션 서버 시작
- `lint` - 코드 린팅을 위한 ESLint 실행
- `install:agent` - 에이전트의 Python 의존성 설치

## 문서

메인 UI 컴포넌트는 `src/app/page.tsx`에 있습니다. 다음을 할 수 있습니다:
- 테마 색상과 스타일링 수정
- 새로운 프론트엔드 액션 추가
- 공유 상태 활용
- LangGraph와 상호작용하기 위한 사용자 인터페이스 커스터마이징

## 📚 문서

- [CopilotKit 문서](https://docs.copilotkit.ai) - CopilotKit의 기능 탐색
- [LangGraph 문서](https://langchain-ai.github.io/langgraph/) - LangGraph와 그 기능에 대해 자세히 알아보기
- [Next.js 문서](https://nextjs.org/docs) - Next.js 기능과 API에 대해 알아보기

## 기여하기

이슈와 개선 요청을 자유롭게 제출하세요! 이 스타터는 쉽게 확장할 수 있도록 설계되었습니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 제공됩니다 - 자세한 내용은 LICENSE 파일을 참조하세요.

## 문제 해결

### 에이전트 연결 문제
"I'm having trouble connecting to my tools"가 표시되면 다음을 확인하세요:
1. LangGraph 에이전트가 포트 8000에서 실행 중인지
2. OpenAI API 키가 올바르게 설정되었는지
3. 두 서버가 모두 성공적으로 시작되었는지

이 오류는 LangGraph CLI가 로컬 의존성을 찾을 때 발생하는 문제입니다.

에러 메시지를 보면:
```
Error: Local dependency must be a subdirectory of the config file: C:\ET_Agent
```

`langgraph.json`에서 `"dependencies": ["../../"]`로 설정했는데, LangGraph CLI는 설정 파일(`langgraph.json`)이 있는 디렉토리보다 상위 디렉토리를 참조하는 것을 허용하지 않습니다.

## 해결 방법들:

### 방법 1: 루트의 langgraph.json 사용
frontend에서 루트의 `langgraph.json`을 사용하도록 설정을 변경하세요.

`C:\ET_Agent\frontend\agent\langgraph.json`을 삭제하고, `C:\ET_Agent\frontend\package.json`의 dev:agent 스크립트를 수정하세요:

```json
{
  "scripts": {
    "dev:agent": "cd ../.. && npx @langchain/langgraph-cli dev --port 8123 --no-browser"
  }
}
```

### 방법 2: 심볼릭 링크 생성 (Windows)
Windows에서 심볼릭 링크를 생성해서 루트 디렉토리를 frontend/agent 하위로 연결:

```cmd
cd C:\ET_Agent\frontend\agent
mklink /D root ..\..\..
```

그 후 `langgraph.json`을:
```json
{
  "python_version": "3.12",
  "dockerfile_lines": [],
  "dependencies": ["./root"],
  "graphs": {
    "sample_agent": "./root/main.py:MainOrchestrator"
  },
  "env": "../.env"
}
```

### 방법 3: 간단한 해결책 (추천)
frontend/agent 디렉토리에 필요한 파일들을 복사하거나, 루트에서 직접 실행:

```bash
cd C:\ET_Agent
npx @langchain/langgraph-cli dev --port 8123 --no-browser
```

어떤 방법을 시도해보시겠어요?
