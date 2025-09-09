'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import { ProblemContainer } from '@/components/ProblemContainer';
import { VoicePanel } from '@/components/VoicePanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { isFarmingRelated } from '@/utils/farmingDetection';

// 메인 페이지 컴포넌트
export default function Home() {
  const [themeColor, setThemeColor] = useState('#10B981');
  const [testSessions, setTestSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
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

    const interval = setInterval(() => {
      checkBackendConnection();
      checkVoiceServiceConnection();
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


  return (
    <div className="h-screen w-screen bg-white flex" suppressHydrationWarning>
      {/* 왼쪽 사이드바 */}
      <Sidebar 
        testSessions={testSessions}
        setTestSessions={setTestSessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        onNewChat={() => window.location.reload()}
        onOpenSettings={() => setShowSettingsPanel(true)}
        onOpenVoice={() => setShowVoicePanel(true)}
        isBackendConnected={isBackendConnected}
        isVoiceServiceConnected={isVoiceServiceConnected}
      />

      {/* 메인 채팅 영역 */}
      <ChatArea 
        onProblemDetected={fetchRecentQuestions}
        onOpenSettings={() => setShowSettingsPanel(true)}
        onVoiceTranscript={handleVoiceTranscript}
        onFarmingTTS={playFarmingTTS}
        isBackendConnected={isBackendConnected}
        isVoiceServiceConnected={isVoiceServiceConnected}
      />

      {/* 문제 컨테이너 (슬라이드 인) */}
      {showProblemContainer && (
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
          isVoiceServiceConnected={isVoiceServiceConnected}
        />
      )}

      {/* 설정 패널 모달 */}
      {showSettingsPanel && (
        <SettingsPanel
          onClose={() => setShowSettingsPanel(false)}
          isBackendConnected={isBackendConnected}
          isVoiceServiceConnected={isVoiceServiceConnected}
        />
      )}
  </div>
  );
}
