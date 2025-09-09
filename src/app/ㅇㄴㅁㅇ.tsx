'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { ProblemContainer } from '@/components/ProblemContainer';
import { WeatherCard } from '@/components/WeatherCard';
import { VoicePanel } from '@/components/VoicePanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { VoiceInputButton } from '@/components/VoiceInputButton';
import { isFarmingRelated } from '@/utils/farmingDetection';

// 테스트 세션 타입 정의
export interface TestSession {
  id: string;
  name: string;
  createdAt: Date;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

// 메인 페이지 컴포넌트
export default function Home() {
  // 테스트 세션 상태 관리
  const [testSessions, setTestSessions] = useState<TestSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [themeColor, setThemeColor] = useState('#10B981'); // 기본 테마 색상

  // 테마 색상 변경 핸들러
  const handleThemeChange = (color: string) => {
    setThemeColor(color);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <YourMainContent 
        themeColor={themeColor}
        testSessions={testSessions}
        setTestSessions={setTestSessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
      />
    </div>
  );
}

// 메인 콘텐츠 컴포넌트
function YourMainContent({ 
  themeColor, 
  testSessions, 
  setTestSessions, 
  currentSessionId, 
  setCurrentSessionId 
}: { 
  themeColor: string; 
  testSessions: TestSession[]; 
  setTestSessions: React.Dispatch<React.SetStateAction<TestSession[]>>; 
  currentSessionId: string | null; 
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>; 
}) {
  // 에이전트 상태는 로컬 상태로 관리
  // useCoAgent는 제거하고 필요시 다시 추가
  
  // 문제 관련 상태
  const [parsedQuestions, setParsedQuestions] = useState<Array<{
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>>([]);
  
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
  const [showProblemContainer, setShowProblemContainer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<{[key: number]: number}>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // 음성 관련 상태
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  
  // 백엔드 연결 상태
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isVoiceServiceConnected, setIsVoiceServiceConnected] = useState(false);

  // 백엔드 연결 상태 확인
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await fetch('http://localhost:8000/health');
        setIsBackendConnected(response.ok);
      } catch (error) {
        setIsBackendConnected(false);
      }
    };

    const checkVoiceServiceConnection = async () => {
      try {
        const response = await fetch('http://localhost:8001/health');
        setIsVoiceServiceConnected(response.ok);
      } catch (error) {
        setIsVoiceServiceConnected(false);
      }
    };

    checkBackendConnection();
    checkVoiceServiceConnection();
    
    // 5초마다 연결 상태 확인
    const interval = setInterval(() => {
      checkBackendConnection();
      checkVoiceServiceConnection();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 문제 파싱 함수
  const parseQuestions = (text: string) => {
    const questions: Array<{
      id: number;
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }> = [];
    
    const lines = text.split('\n').filter(line => line.trim());
    let currentQuestion: any = null;
    let questionId = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 문제 시작 감지
      if (line.match(/^\d+\./) || line.includes('문제') || line.includes('Question')) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          id: questionId++,
          question: line,
          options: [],
          correctAnswer: 0,
          explanation: ''
        };
      }
      // 선택지 감지
      else if (line.match(/^[가-힣]\./) || line.match(/^[a-zA-Z]\./) || line.match(/^[1-4]\./)) {
        if (currentQuestion) {
          currentQuestion.options.push(line);
        }
      }
      // 정답 감지
      else if (line.includes('정답') || line.includes('답') || line.includes('Answer')) {
        if (currentQuestion) {
          const answerMatch = line.match(/[가-힣]|[a-zA-Z]|[1-4]/);
          if (answerMatch) {
            const answer = answerMatch[0];
            if (answer === '가' || answer === 'a' || answer === '1') currentQuestion.correctAnswer = 0;
            else if (answer === '나' || answer === 'b' || answer === '2') currentQuestion.correctAnswer = 1;
            else if (answer === '다' || answer === 'c' || answer === '3') currentQuestion.correctAnswer = 2;
            else if (answer === '라' || answer === 'd' || answer === '4') currentQuestion.correctAnswer = 3;
          }
        }
      }
      // 해설 감지
      else if (line.includes('해설') || line.includes('설명') || line.includes('Explanation')) {
        if (currentQuestion) {
          currentQuestion.explanation = line;
        }
      }
    }
    
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
    
    return questions;
  };

  // 최근 질문 가져오기
  const fetchRecentQuestions = async () => {
    try {
      const response = await fetch('http://localhost:8000/recent-questions');
      if (response.ok) {
        const data = await response.json();
        if (data.questions && data.questions.length > 0) {
          const questions = parseQuestions(data.questions.join('\n'));
          if (questions.length > 0) {
            setParsedQuestions(questions);
            setShowProblemContainer(true);
          }
        }
      }
    } catch (error) {
      console.error('최근 질문 가져오기 실패:', error);
    }
  };

  // 답안 제출
  const submitAnswers = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:8000/submit-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: selectedAnswers,
          questions: parsedQuestions
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setScore(result.score || 0);
        setTotalQuestions(result.totalQuestions || parsedQuestions.length);
        setSubmittedAnswers(selectedAnswers);
        setShowResults(true);
      }
    } catch (error) {
      console.error('답안 제출 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모든 문제에 답했는지 확인
  const isAllQuestionsAnswered = () => {
    return parsedQuestions.every((_, index) => selectedAnswers[index] !== undefined);
  };

  // 답안 선택 핸들러
  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  // 문제 컨테이너 닫기
  const handleCloseProblemContainer = () => {
    setShowProblemContainer(false);
    setParsedQuestions([]);
    setSelectedAnswers({});
    setSubmittedAnswers({});
    setShowResults(false);
    setScore(0);
    setTotalQuestions(0);
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showProblemContainer) {
        setShowProblemContainer(false);
      }
    };

    if (showProblemContainer) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showProblemContainer]);

  // 날씨 카드 렌더링 함수
  const renderWeatherCard = (location: string) => {
    return <WeatherCard location={location} themeColor={themeColor} />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/FT-logo.png" alt="이장&선생" className="h-8 w-8 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">이장&선생</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* 음성 패널 토글 버튼 */}
              <button
                onClick={() => setShowVoicePanel(!showVoicePanel)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="음성 기능"
              >
                🎤
              </button>
              
              {/* 설정 패널 토글 버튼 */}
              <button
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="설정"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 채팅 인터페이스 */}
          <div className="lg:col-span-2">
            <ChatInterface 
              onMessageSent={fetchRecentQuestions} 
              onProblemDetected={() => setShowProblemContainer(true)}
              onOpenSettings={() => setShowSettingsPanel(true)}
              isExpanded={!showProblemContainer}
            />
          </div>

          {/* 오른쪽: 문제 컨테이너 */}
          <div className="lg:col-span-1">
            {showProblemContainer && (
              <div className="sticky top-8">
                <ProblemContainer
                  questions={parsedQuestions}
                  selectedAnswers={selectedAnswers}
                  onAnswerSelect={handleAnswerSelect}
                  onSubmit={submitAnswers}
                  onClose={handleCloseProblemContainer}
                  isSubmitting={isSubmitting}
                  submittedAnswers={submittedAnswers}
                  showResults={showResults}
                  score={score}
                  totalQuestions={totalQuestions}
                  themeColor={themeColor}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 음성 패널 */}
      {showVoicePanel && (
        <VoicePanel onClose={() => setShowVoicePanel(false)} />
      )}

      {/* 설정 패널 */}
      {showSettingsPanel && (
        <SettingsPanel 
          onClose={() => setShowSettingsPanel(false)}
          isBackendConnected={isBackendConnected}
          isVoiceServiceConnected={isVoiceServiceConnected}
        />
      )}

      {/* 날씨 카드들 */}
      <div className="fixed bottom-4 right-4 space-y-2">
        {renderWeatherCard('서울')}
        {renderWeatherCard('부산')}
        {renderWeatherCard('대구')}
      </div>
    </div>
  );
}
