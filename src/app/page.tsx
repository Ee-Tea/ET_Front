'use client';

import React, { useState, useEffect } from 'react';
import ChatHistoryContainer from '@/components/ChatHistoryContainer';
import ProblemContainer from '@/components/ProblemContainer';
import ChatContainer from '@/components/ChatContainer';
import { VoicePanel } from '@/components/VoicePanel';
import { LoginModal } from '@/components/LoginModal';
import VoiceInputButton from '@/components/VoiceInputButton';
import { useAuth } from '@/contexts/AuthContext';
import { isFarmingRelated } from '@/utils/farmingDetection';
import { extractAuthCodeFromUrl, extractErrorFromUrl } from '@/utils/googleAuth';

// 메인 페이지 컴포넌트
export default function Home() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const [themeColor, setThemeColor] = useState('#10B981');
  const [testSessions, setTestSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // 문제 관련 상태
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: string}>({});
  const [showProblemContainer, setShowProblemContainer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingResults, setGradingResults] = useState<{[key: string]: any}>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<{[key: number]: number}>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // PDF 관련 상태
  const [pdfGenerationStatus, setPdfGenerationStatus] = useState({
    is_generating: false,
    last_generated_time: null,
    generated_files: []
  });
  const [availablePdfs, setAvailablePdfs] = useState<any[]>([]);
  
  // 음성 관련 상태
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  
  // 사이드바 토글 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 레이아웃 상태 (초기: 압축, 채팅 시작: 확장)
  const [isLayoutExpanded, setIsLayoutExpanded] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [miniMessage, setMiniMessage] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  
  // 백엔드 연결 상태
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  
  // 로그인 상태 확인 (선택사항으로 변경)
  useEffect(() => {
    if (isLoggedIn) {
      setShowLoginModal(false);
    }
  }, [isLoggedIn]);

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


    checkBackendConnection();

    const interval = setInterval(() => {
      checkBackendConnection();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // PDF 관련 함수들
  const checkPdfGenerationStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/pdf-status", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setPdfGenerationStatus(data);
        if (data.generated_files && data.generated_files.length > 0) {
          fetchPdfs();
        }
      } else {
        setPdfGenerationStatus({
          is_generating: false,
          last_generated_time: null,
          generated_files: []
        });
      }
    } catch (error) {
      setPdfGenerationStatus({
        is_generating: false,
        last_generated_time: null,
        generated_files: []
      });
    }
  };

  const fetchPdfs = async () => {
    try {
      const response = await fetch("http://localhost:8000/pdfs", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailablePdfs(data.pdfs || []);
      } else {
        setAvailablePdfs([]);
      }
    } catch (error) {
      setAvailablePdfs([]);
    }
  };

  const downloadPdf = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:8000/pdf/${filename}`, {
        method: "GET",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("PDF 다운로드에 실패했습니다. 서버 연결을 확인해주세요.");
      }
    } catch (error) {
      alert("PDF 다운로드 중 오류가 발생했습니다. 서버 연결을 확인해주세요.");
    }
  };

  // 컴포넌트 마운트 시 PDF 상태 확인
  useEffect(() => {
    checkPdfGenerationStatus();
  }, []);

  // 문제 파싱 함수
  const parseQuestions = (text: string) => {
    const questions: any[] = [];
    const questionBlocks = text.split(/(?=\d+\.\s*문제)/);
    
    questionBlocks.forEach((block, index) => {
      if (block.trim()) {
        const lines = block.trim().split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const questionMatch = lines[0].match(/(\d+)\.\s*문제[:\s]*(.+)/);
          if (questionMatch) {
            const questionId = parseInt(questionMatch[1]);
            const questionText = questionMatch[2].trim();
            
            const options: string[] = [];
            let correctAnswer = '';
            let explanation = '';
            
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line.match(/^\d+\./)) {
                options.push(line);
              } else if (line.includes('정답:') || line.includes('답:')) {
                correctAnswer = line.replace(/.*(정답|답):\s*/, '');
              } else if (line.includes('해설:') || line.includes('설명:')) {
                explanation = line.replace(/.*(해설|설명):\s*/, '');
              }
            }
            
            if (questionText && options.length > 0) {
              questions.push({
                id: questionId,
                question: questionText,
                options: options,
                correctAnswer: correctAnswer,
                explanation: explanation,
                subject: '정보처리기사',
                created_at: Date.now()
              });
            }
          }
        }
      }
    });
    
    return questions;
  };

  // 최근 질문 가져오기
  const fetchRecentQuestions = async () => {
    try {
      const response = await fetch(`http://localhost:8000/recent-questions`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setParsedQuestions(data.questions || []);
        if (data.questions && data.questions.length > 0) {
          setShowProblemContainer(true);
        }
      } else {
        setParsedQuestions([]);
      }
    } catch (error) {
      setParsedQuestions([]);
    }
  };

  // 답안 제출
  const submitAnswers = async () => {
    if (!isAllQuestionsAnswered()) return;
    
    setIsSubmitting(true);
    try {
      const answers = parsedQuestions.map(q => {
        const questionId = `question-${q.id}`;
        const selectedAnswer = selectedAnswers[questionId];
        const extractedAnswer = selectedAnswer ? selectedAnswer.match(/^\s*(\d+)\./)?.[1] : null;
        return extractedAnswer || "1";
      });
      
      const query = `${answers.join(',')} + 문제의 답이야 채점해줘`;
      
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          user_id: "frontend_user",
          chat_id: "frontend_chat",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.grading_results) {
          setGradingResults(data.grading_results);
        } else {
          const newGradingResults: {[key: string]: any} = {};
          parsedQuestions.forEach((q) => {
            const questionId = `question-${q.id}`;
            const selectedAnswer = selectedAnswers[questionId];
            const correctAnswer = q.correctAnswer;
            const extractedUserAnswer = selectedAnswer ? selectedAnswer.match(/^\s*(\d+)\./)?.[1] : null;
            
            newGradingResults[questionId] = {
              isCorrect: extractedUserAnswer === correctAnswer,
              userAnswer: selectedAnswer,
              correctAnswer: correctAnswer
            };
          });
          setGradingResults(newGradingResults);
        }
      }
    } catch (error) {
      console.error('답안 제출 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모든 문제에 답했는지 확인
  const isAllQuestionsAnswered = () => {
    return parsedQuestions.length > 0 && parsedQuestions.every(q => selectedAnswers[`question-${q.id}`]);
  };

  // 답안 선택 핸들러
  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // 문제 컨테이너 닫기
  const handleCloseProblemContainer = () => {
        setShowProblemContainer(false);
      setParsedQuestions([]);
    setSelectedAnswers({});
    setGradingResults({});
    setSubmittedAnswers({});
    setShowResults(false);
    setScore(0);
    setTotalQuestions(0);
  };

  // 음성 관련 함수들
  const handleVoiceTranscript = (transcript: string) => {
    console.log("음성 인식 결과:", transcript);
  };

  const playFarmingTTS = async (text: string) => {
    if (isFarmingRelated(text)) {
      setIsPlayingTTS(true);
      try {
        console.log("농사 관련 질문 TTS 재생:", text);
      } catch (error) {
        console.error("TTS 재생 오류:", error);
      } finally {
        setIsPlayingTTS(false);
      }
    }
  };

  // 레이아웃 확장 핸들러
  const handleLayoutExpansion = () => {
    if (!isLayoutExpanded) {
      setIsLayoutExpanded(true);
    }
  };

  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    
    if (newCount >= 15) {
      window.open('https://youtu.be/S5QNkr7EGgo?si=eSaFpWhOHoB2r3E4', '_blank');
      setLogoClickCount(0); // 카운트 리셋
    }
  };

  const handleMiniVoiceTranscript = (transcript: string) => {
    setMiniMessage(transcript);
  };


  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }


  return (
    <div className={`h-screen w-screen transition-all duration-700 ease-in-out ${isLayoutExpanded ? 'p-4 bg-gray-100' : 'flex items-center justify-center'} ${hoveredCard ? 'bg-cover bg-center' : 'bg-gray-100'}`} 
         style={hoveredCard ? { backgroundImage: `url(${hoveredCard === 'agriculture' ? '/farmer.png' : '/teacher.png'})` } : {}} 
         suppressHydrationWarning>
        {!isLayoutExpanded ? (
          /* 초기 압축된 레이아웃 - 중앙 집중형 */
          <div className="w-full max-w-lg min-w-80 h-3/5 min-h-[450px] bg-gray-50 rounded-lg shadow-lg overflow-hidden flex flex-col mx-auto transition-all duration-700 ease-in-out transform scale-100 animate-in fade-in-0 zoom-in-95">
            {/* 헤더 */}
            <div className="flex items-center justify-center py-8">
              <img 
                src="/FT-logo.png" 
                alt="FT Assistant" 
                className="h-15 w-15 cursor-pointer hover:opacity-80 transition-opacity duration-200" 
                onClick={handleLogoClick}
              />
            </div>
            
            {/* 메인 컨텐츠 */}
            <div className="flex-1 flex flex-col items-center justify-center px-2">
              {/* 환영 메시지 */}
              <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                안녕하세요!
              </h1>
              
              {/* 기능 카드들 */}
            <div className="grid grid-cols-2 gap-4 mb-4 w-full px-2">
              <div 
                className="rounded-lg p-1 text-center h-32 sm:h-36 md:h-40 flex flex-col justify-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-lg cursor-pointer" 
                style={{ backgroundColor: '#dee3e7' }}
                onMouseEnter={() => setHoveredCard('agriculture')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                  <div className="w-8 h-8 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75S7 8 17 8Z"/>
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-700 mb-1">농업</h3>
                  <p className="text-gray-600 text-xs">농작물 재배와 농업 기술에 대한 전문적인 조언을 제공합니다.</p>
                </div>
                
                <div 
                className="rounded-lg p-1 text-center h-32 sm:h-36 md:h-40 flex flex-col justify-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-lg cursor-pointer" 
                style={{ backgroundColor: '#dee3e7' }}
                onMouseEnter={() => setHoveredCard('it')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                  <div className="w-8 h-8 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 text-gray-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-700 mb-1">정보처리기사</h3>
                  <p className="text-gray-600 text-xs">정보처리기사 시험 준비와 IT 관련 학습을 도와드립니다.</p>
                </div>
                
              </div>
              
            </div>
            
            {/* 입력 영역 */}
            <div className="px-4 pb-4 flex-shrink-0">
              <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                {/* FT 로고 */}
                <div className="flex-shrink-0">
                  <img src="/FT-logo.png" alt="FT" className="h-6 w-6" />
                </div>
                
                {/* 입력 필드 */}
                <input
                  type="text"
                  value={miniMessage}
                  onChange={(e) => setMiniMessage(e.target.value)}
                  placeholder="질문을 입력해주세요."
                  className="flex-1 text-gray-900 placeholder-gray-400 focus:outline-none text-base"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLayoutExpansion();
                    }
                  }}
                />
                
                {/* 오른쪽 아이콘들 */}
                <div className="flex items-center space-x-2">
                  {/* 음성 버튼 */}
                  <VoiceInputButton
                    onTranscript={handleMiniVoiceTranscript}
                    disabled={false}
                  />
                  
                  {/* 전송 버튼 */}
                  <button 
                    onClick={handleLayoutExpansion}
                    className="bg-green-500 text-white rounded-lg p-2 hover:bg-green-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 확장된 레이아웃 - 전체 화면 */
          <div className="h-full flex gap-4 transition-all duration-700 ease-in-out transform scale-100 animate-in fade-in-0 zoom-in-95" suppressHydrationWarning>
          {/* 왼쪽 채팅내역 컨테이너 - 사이드바가 열려있을 때만 표시 */}
          {isSidebarOpen && (
            <div className="w-1/5 min-w-80 h-full" suppressHydrationWarning>
              <ChatHistoryContainer
                testSessions={testSessions}
                setTestSessions={setTestSessions}
                currentSessionId={currentSessionId}
                setCurrentSessionId={setCurrentSessionId}
                onNewChat={() => window.location.reload()}
                isBackendConnected={isBackendConnected}
              />
            </div>
          )}

          {/* 가운데 문제 컨테이너 - 문제가 있을 때만 표시 */}
          {parsedQuestions.length > 0 && (
            <div className={`${isSidebarOpen ? 'w-1/3' : 'w-1/2'} min-w-80 h-full`} suppressHydrationWarning>
              <ProblemContainer
                questions={parsedQuestions}
                selectedAnswers={selectedAnswers}
                onAnswerSelect={handleAnswerSelect}
                onSubmit={submitAnswers}
                isSubmitting={isSubmitting}
                submittedAnswers={submittedAnswers}
                showResults={showResults}
                score={score}
                totalQuestions={totalQuestions}
                themeColor={themeColor}
                gradingResults={gradingResults}
              />
            </div>
          )}

          {/* 오른쪽 채팅 컨테이너 */}
          <div className="flex-1 h-full" suppressHydrationWarning>
            <ChatContainer
              onProblemDetected={fetchRecentQuestions}
              onOpenSettings={() => {}}
              onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
              onVoiceTranscript={handleVoiceTranscript}
              onFarmingTTS={playFarmingTTS}
              isBackendConnected={isBackendConnected}
              isSidebarOpen={isSidebarOpen}
              onLayoutExpansion={handleLayoutExpansion}
            />
          </div>
        </div>
      )}

      {/* 문제 컨테이너 (슬라이드 인) - 문제가 있을 때만 표시 */}
      {showProblemContainer && parsedQuestions.length > 0 && (
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
          gradingResults={gradingResults}
        />
      )}

      {/* 음성 패널 모달 */}
      {showVoicePanel && (
        <VoicePanel
          onClose={() => setShowVoicePanel(false)}
          isBackendConnected={isBackendConnected}
        />
      )}

      {/* 로그인 모달 */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

  </div>
  );
}
