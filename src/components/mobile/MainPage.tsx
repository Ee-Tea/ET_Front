'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import MobileSettingsMenu from './MobileSettingsMenu';
import { MobileLoginModal } from './MobileLoginModal';
import { MobileVoiceInput } from './MobileVoiceInput';
import { MobileVoiceTest } from './MobileVoiceTest';
import { HelpModal } from '../HelpModal';
import ResultPopup from './ResultPopup';
import { isFarmingQuestion } from '@/utils/farmingDetection';
import { FrontendVoiceService } from '@/services/frontendVoiceService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Problem {
  id: number;
  question: string;
  type: 'multiple' | 'short';
  options?: string[];
  userAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  selectedAnswer?: number; // 선택된 답안 인덱스
  isSubmitted?: boolean; // 제출 여부
  isCorrect?: boolean; // 정답 여부
}

interface MainPageProps {
  onQuestionSubmit?: (question: string) => void;
  onVoiceInput?: () => void;
  isLoggedIn?: boolean;
  user?: any;
}

const MainPage: React.FC<MainPageProps> = (props) => {
  const { 
    onQuestionSubmit, 
    onVoiceInput,
    isLoggedIn = false,
    user
  } = props;
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'problems'>('chat');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVoiceTest, setShowVoiceTest] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isPlayingFarmingTTS, setIsPlayingFarmingTTS] = useState(false);
  const [farmingTTSAudio, setFarmingTTSAudio] = useState<HTMLAudioElement | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<{[problemId: number]: number}>({});
  const [problemResults, setProblemResults] = useState<{[problemId: number]: {isCorrect: boolean, explanation?: string}}>({});
  const [autoTTSEnabled, setAutoTTSEnabled] = useState(true); // 농업 관련 질문 자동 TTS

  // 데스크탑 감지 및 리다이렉트
  useEffect(() => {
    const checkDevice = () => {
      const isDesktop = window.innerWidth > 768 && !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isDesktop) {
        // 데스크탑인 경우 메인 페이지로 리다이렉트
        window.location.href = '/';
      }
    };
    
    checkDevice();
    
    // 윈도우 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  // 전역 오류 처리 및 스크롤 방지
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('message port closed')) {
        console.warn('메시지 포트 오류 무시:', event.message);
        event.preventDefault();
      }
    };

    // 스크롤 방지
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    // body 스크롤 방지
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    window.addEventListener('error', handleError);
    window.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('touchmove', preventScroll);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // 농사 관련 질문 TTS 함수
  const handleFarmingTTS = async (text: string) => {
    if (!text || !isFarmingQuestion(text)) {
      return;
    }

    try {
      setIsPlayingFarmingTTS(true);
      
      // 기존 오디오가 재생 중이면 정지
      if (farmingTTSAudio) {
        farmingTTSAudio.pause();
        farmingTTSAudio.currentTime = 0;
      }

      const response = await FrontendVoiceService.textToSpeech(text, {
        language: 'ko',
        voice: 'default',
        speed: 1.0,
        pitch: 1.0,
        volume: 0.9
      });

      if (response.success && response.audio_data) {
        // base64 오디오 데이터를 URL로 변환
        const audioBlob = new Blob([
          Uint8Array.from(atob(response.audio_data), c => c.charCodeAt(0))
        ], { type: 'audio/wav' });
        
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);
        
        audio.onplay = () => setIsPlayingFarmingTTS(true);
        audio.onended = () => {
          setIsPlayingFarmingTTS(false);
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          setIsPlayingFarmingTTS(false);
          URL.revokeObjectURL(url);
        };
        
        setFarmingTTSAudio(audio);
        await audio.play();
      }
    } catch (error) {
      console.error('농사 관련 TTS 오류:', error);
      setIsPlayingFarmingTTS(false);
    }
  };

  // 농사 관련 질문 TTS 정지
  const stopFarmingTTS = () => {
    if (farmingTTSAudio) {
      farmingTTSAudio.pause();
      farmingTTSAudio.currentTime = 0;
      setIsPlayingFarmingTTS(false);
    }
  };

  // 문제 생성 요청인지 확인하는 함수
  const isProblemGenerationRequest = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    
    // 정처기 관련 키워드들
    const jpkiKeywords = [
      '정처기', '정보처리기사', '정보처리', 'jpki', 'jpki시험', 'jpki문제',
      '소프트웨어설계', '소프트웨어 설계', '데이터베이스', '데이터베이스구축',
      '시스템분석설계', '시스템 분석 설계', '프로그래밍언어', '프로그래밍 언어',
      '정보시스템구축', '정보시스템 구축', 'it기술', 'it 기술', '소프트웨어 개발'
    ];
    
    // 문제 생성 요청 키워드들
    const problemGenerationKeywords = [
      '문제 만들어줘', '문제 생성해줘', '문제 만들어', '문제 생성해',
      '문제 만들어주세요', '문제 생성해주세요', '문제 만들어줄래',
      '문제 생성해줄래', '문제 만들어줄 수 있어', '문제 생성해줄 수 있어',
      '문제 만들어주실 수 있어', '문제 생성해주실 수 있어',
      '퀴즈 만들어줘', '퀴즈 생성해줘', '시험문제 만들어줘', '시험문제 생성해줘',
      '문제집 만들어줘', '문제은행 만들어줘'
    ];
    
    // 정처기 관련 키워드가 있는지 확인
    const hasJpkiKeyword = jpkiKeywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    // 문제 생성 요청인지 확인
    const hasGenerationRequest = problemGenerationKeywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    // 정처기 관련 키워드가 있고 문제 생성 요청이 있는 경우만 true 반환
    return hasJpkiKeyword && hasGenerationRequest;
  };

  // 보기 형식 정규화 함수
  const normalizeOptions = (options: string[]): string[] => {
    return options.map((option, index) => {
      // 이미 "숫자. " 형식인 경우 그대로 반환
      if (option.match(/^\d+\.\s/)) {
        return option;
      }
      // "숫자)" 형식인 경우 "숫자. " 형식으로 변환
      if (option.match(/^\d+\)\s/)) {
        return option.replace(/^(\d+)\)\s/, '$1. ');
      }
      // 숫자로 시작하는 경우 "숫자. " 형식으로 변환
      if (option.match(/^\d+\s/)) {
        return option.replace(/^(\d+)\s/, '$1. ');
      }
      // 그 외의 경우 인덱스 기반으로 "숫자. " 형식으로 변환
      return `${index + 1}. ${option}`;
    });
  };

  // 문제 파싱 함수
  const parseProblems = (content: string): Problem[] => {
    const problems: Problem[] = [];
    const questionBlocks = content.split(/(?=\d+\.\s*문제)/);
    
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
              if (line.match(/^\d+[\.\)]\s/) || line.match(/^\d+\s/)) {
                options.push(line);
              } else if (line.includes('정답:') || line.includes('답:')) {
                correctAnswer = line.replace(/.*(정답|답):\s*/, '');
              } else if (line.includes('해설:') || line.includes('설명:')) {
                explanation = line.replace(/.*(해설|설명):\s*/, '');
              }
            }
            
            if (questionText && options.length > 0) {
              // 보기 형식 정규화
              const normalizedOptions = normalizeOptions(options);
              
              problems.push({
                id: questionId,
                question: questionText,
                type: 'multiple' as const,
                options: normalizedOptions,
                correctAnswer: correctAnswer,
                explanation: explanation
              });
            }
          }
        }
      }
    });
    
    return problems;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage: Message = { role: 'user', content: question.trim() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);


    // 문제 생성 요청인지 확인
    const isProblemRequest = isProblemGenerationRequest(question.trim());
    if (isProblemRequest) {
      // 문제 생성 요청 시 즉시 문제 페이지로 전환
      setCurrentView('problems');
      
      // 문제 생성 중임을 알리는 메시지 추가
      const generatingMessage: Message = {
        role: 'assistant',
        content: "🔧 정처기 문제를 생성하고 있습니다. 잠시만 기다려주세요..."
      };
      setMessages(prev => [...prev, generatingMessage]);
    }

    try {
      const response = await fetch("/backend/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question.trim(),
          user_id: "mobile_user",
          chat_id: "mobile_chat",
        }),
        // 타임아웃 설정 (40초)
        signal: AbortSignal.timeout(40000)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[MOBILE] 백엔드 응답:', data);
      
      // 백엔드 응답에서 실제 응답 텍스트 추출
      const responseText = data.final_response || data.response || data.message || "응답을 생성할 수 없습니다.";
      
      // 백엔드 응답 구조 확인을 위한 로깅
      console.log('[MOBILE] 백엔드 응답 키들:', Object.keys(data));
      console.log('[MOBILE] teacher_result:', data.teacher_result);
      console.log('[MOBILE] generation:', data.generation);
      console.log('[MOBILE] 전체 응답 구조:', JSON.stringify(data, null, 2));
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: responseText
      };
      setMessages(prev => [...prev, assistantMessage]);

      // 농업 관련 질문이고 자동 TTS가 활성화된 경우 TTS 재생
      const isFarming = isFarmingQuestion(question.trim());
      if (isFarming && autoTTSEnabled) {
        setTimeout(() => {
          handleFarmingTTS(responseText);
        }, 1000); // 1초 후 TTS 재생
      }

      // 문제 생성 요청인 경우 웹페이지와 동일한 방식으로 처리
      if (isProblemRequest) {
        // 웹페이지와 동일하게 100ms 후 문제 데이터 요청
        setTimeout(() => {
          fetchRecentQuestions(question.trim());
        }, 100);
      }

    } catch (error) {
      console.error('[MOBILE] 메시지 전송 실패:', error);
      
      let errorContent = "⚠️ 서버 연결에 문제가 발생했습니다.";
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorContent = "⏰ 요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
        } else if (error.message.includes('Failed to fetch')) {
          errorContent = "🌐 네트워크 연결을 확인해주세요.";
        } else if (error.message.includes('500')) {
          errorContent = "🔧 서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
        }
      }
      
      const errorMessage: Message = {
        role: 'assistant',
        content: errorContent
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setQuestion('');
    }
  };

  const handleVoiceTranscript = (text: string) => {
    try {
      setQuestion(text);
      if (onVoiceInput) {
        onVoiceInput();
      }
    } catch (error) {
      console.warn('음성 인식 처리 중 오류:', error);
    }
  };

  // 문제 답안 선택 핸들러
  const handleAnswerSelect = (problemId: number, answerIndex: number) => {
    setSubmittedAnswers(prev => ({
      ...prev,
      [problemId]: answerIndex
    }));
  };

  // 전체 답안 제출 핸들러
  const handleSubmitAllAnswers = async () => {
    if (Object.keys(submittedAnswers).length === 0) {
      alert('답안을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      // 모든 문제에 대해 정답 체크
      const newResults: {[problemId: number]: {isCorrect: boolean, explanation?: string}} = {};
      
      problems.forEach(problem => {
        const selectedAnswer = submittedAnswers[problem.id];
        if (selectedAnswer !== undefined) {
          // correctAnswer가 인덱스 번호(1, 2, 3, 4)로 오므로 0-based 인덱스로 변환
          const correctAnswerIndex = parseInt(problem.correctAnswer || '0') - 1;
          const isCorrect = selectedAnswer === correctAnswerIndex;
          
          console.log(`문제 ${problem.id} 정답 체크:`, {
            selectedAnswer,
            correctAnswer: problem.correctAnswer,
            correctAnswerIndex,
            isCorrect
          });
          
          newResults[problem.id] = {
            isCorrect: isCorrect,
            explanation: problem.explanation
          };
        }
      });

      setProblemResults(newResults);
      
      // 전체 결과 요약
      const correctCount = Object.values(newResults).filter(result => result.isCorrect).length;
      const totalCount = Object.keys(newResults).length;
      
      console.log(`전체 답안 제출 완료: ${correctCount}/${totalCount} 정답`);
      
    } catch (error) {
      console.error('답안 제출 오류:', error);
      alert('답안 제출에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 웹페이지와 동일한 최근 질문 가져오기 함수
  const fetchRecentQuestions = async (userMessage?: string) => {
    try {
      const response = await fetch(`/backend/recent-questions`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        const newQuestions = data.questions || [];
        
        // 새로운 문제가 있을 때만 상태 업데이트하고 바로 표시
        if (newQuestions.length > 0) {
          console.log('백엔드 데이터 확인:', newQuestions);
          
          const parsedProblems: Problem[] = newQuestions.map((q: any, index: number) => {
            console.log(`문제 ${index + 1} 데이터:`, q);
            return {
              id: index + 1,
              question: q.question,
              type: 'multiple' as const,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation
            };
          });
          
          setProblems(parsedProblems);
          setCurrentView('problems');
          
          // 기존 생성 중 메시지를 제거하고 문제 생성 완료 메시지로 교체
          setMessages(prev => {
            const filteredMessages = prev.filter(msg => 
              !msg.content.includes('정처기 문제를 생성하고 있습니다')
            );
            return [...filteredMessages, {
              role: 'assistant' as const,
              content: `✅ ${parsedProblems.length}개의 정처기 문제가 생성되었습니다!`
            }];
          });
        }
      } else {
        console.warn('문제 서버 응답 오류:', response.status);
      }
    } catch (error) {
      console.warn('문제 서버 연결 실패 - 정상적인 동작입니다:', error);
    }
  };

  const handleVoiceTest = () => {
    setShowVoiceTest(true);
  };

  const handleGetHelp = () => {
    setShowHelpModal(true);
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleToggleAutoTTS = () => {
    setAutoTTSEnabled(prev => !prev);
  };

  return (
    <div className="w-full h-screen bg-gray-300 flex flex-col overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        {/* 상단 헤더 */}
        <div className="h-16 bg-gray-300 flex items-center justify-center">
          <div className="px-6 py-3 flex items-center justify-between w-full">
            {/* 왼쪽: 빈 공간 */}
            <div className="w-16"></div>
            
            {/* 중앙: FT 로고 */}
            <div className="flex-1 flex justify-center ml-2 -mt-1">
              <Image 
                src="/FT-logo.png" 
                alt="FT" 
                width={40} 
                height={40} 
                className="object-contain"
              />
            </div>
            
            {/* 오른쪽: 웹모드 버튼과 설정 버튼 */}
            <div className="flex items-center gap-2 w-16 justify-end">
              {/* 웹모드 버튼 */}
              <button
                onClick={() => window.location.href = '/'}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors mobile-button"
                title="웹모드로 이동"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              
              {/* 설정 버튼 */}
              <button
                onClick={() => setShowSettingsMenu(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors mobile-button"
                title="설정"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 - 위로 겹치는 부분 */}
        <div className="relative -mt-2 bg-white rounded-t-3xl shadow-lg flex flex-col h-[calc(100vh-3.5rem)]">
          {/* 탭 네비게이션 */}
          {messages.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-200">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentView('chat')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'chat'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  채팅 페이지
                </button>
                {problems.length > 0 && (
                  <button
                    onClick={() => setCurrentView('problems')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'problems'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    문제 페이지
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 채팅/문제 영역 */}
          <div className="flex-1 overflow-hidden">
          {currentView === 'chat' ? (
            /* 채팅 화면 */
            <div className="h-full flex flex-col">
              {messages.length === 0 ? (
                /* 초기 화면 */
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                  {/* FT 로고 */}
                  <div className="mb-6">
                    <Image 
                      src="/FT-logo.png" 
                      alt="FT" 
                      width={80} 
                      height={80} 
                      className="object-contain"
                    />
                  </div>
                  
                  {/* 인사말 */}
                  <div className="text-lg font-bold text-black mb-4">
                    안녕하세요! FT입니다
                  </div>
                  
                  {/* 설명 */}
                  <div className="text-sm text-gray-600 mb-6 leading-relaxed">
                    농사와 정보처리기사 관련 질문에 답변해드릴 수 있습니다.
                  </div>
                  
                  {/* 예시 질문 */}
                  <div className="w-full">
                    <div className="text-sm font-medium text-gray-700 mb-3 text-center">
                      예시 질문:
                    </div>
                    <div className="space-y-3 text-center">
                      <button
                        onClick={(e) => {
                          setQuestion("오이에는 어떤 병해충이 있어?");
                          handleSubmit(e);
                        }}
                        className="block w-full text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                      >
                        <span className="font-bold">농사:</span> "오이에는 어떤 병해충이 있어?"
                      </button>
                      <button
                        onClick={(e) => {
                          setQuestion("소프트웨어 설계 3문제 만들어줘");
                          handleSubmit(e);
                        }}
                        className="block w-full text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                      >
                        <span className="font-bold">정보처리기사:</span> "소프트웨어 설계 3문제 만들어줘"
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* 채팅 메시지 목록 */
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="text-sm whitespace-pre-wrap flex-1">{message.content}</div>
                          {/* 농사 관련 질문인 경우 TTS 버튼 표시 */}
                          {message.role === 'assistant' && isFarmingQuestion(message.content) && (
                            <button
                              onClick={() => handleFarmingTTS(message.content)}
                              className="ml-2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
                              title="음성으로 듣기"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm">답변을 생성하고 있습니다...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* 문제 화면 */
            <div className="h-full flex flex-col">
              
              {/* 문제 목록 */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-6">
                {problems.map((problem) => (
                  <div key={problem.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    {/* 문제 제목 */}
                    <div className="text-base font-semibold text-gray-800 mb-4 leading-relaxed">
                      {problem.id}. 문제: {problem.question}
                    </div>
                    
                    {problem.type === 'multiple' && problem.options ? (
                      <div className="space-y-3">
                        {problem.options.map((option, index) => {
                          const isSelected = submittedAnswers[problem.id] === index;
                          // correctAnswer가 인덱스 번호(1, 2, 3, 4)로 오므로 0-based 인덱스로 변환
                          const correctAnswerIndex = parseInt(problem.correctAnswer || '0') - 1;
                          const isCorrectAnswer = index === correctAnswerIndex;
                          const hasResults = Object.keys(problemResults).length > 0;
                          const problemResult = problemResults[problem.id];
                          
                          return (
                            <label key={index} className={`flex items-start cursor-pointer p-3 rounded-lg ${hasResults ? 'cursor-default' : ''} ${hasResults && problemResult ? (
                              isSelected ? (
                                problemResult.isCorrect ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300'
                              ) : isCorrectAnswer ? 'bg-green-100 border-2 border-green-300' : 'bg-gray-50'
                            ) : 'bg-gray-50'}`}>
                              <input
                                type="radio"
                                name={`problem-${problem.id}`}
                                value={index}
                                checked={isSelected}
                                onChange={() => handleAnswerSelect(problem.id, index)}
                                disabled={hasResults}
                                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2 mr-3 mt-0.5 flex-shrink-0 disabled:opacity-50"
                              />
                              <div className="text-sm leading-relaxed flex-1 flex items-center justify-between">
                                <span className={`${hasResults && problemResult ? (
                                  isSelected ? (
                                    problemResult.isCorrect ? 'text-green-800 font-medium' : 'text-red-800 font-medium'
                                  ) : isCorrectAnswer ? 'text-green-800 font-medium' : 'text-gray-700'
                                ) : 'text-gray-700'}`}>
                                  {option}
                                </span>
                                {hasResults && problemResult && (
                                  <div className="ml-2 flex items-center gap-1">
                                    {isSelected && (
                                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                                        problemResult.isCorrect 
                                          ? 'bg-green-200 text-green-800' 
                                          : 'bg-red-200 text-red-800'
                                      }`}>
                                        {problemResult.isCorrect ? '정답' : '오답'}
                                      </span>
                                    )}
                                    {!isSelected && isCorrectAnswer && (
                                      <span className="text-xs font-medium px-2 py-1 rounded bg-green-200 text-green-800">
                                        정답
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                        
                        
                        {/* 해설 표시 */}
                        {problemResults[problem.id] && problemResults[problem.id].explanation && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-700">
                              <div className="font-medium text-gray-800 mb-2">
                                정답: {(() => {
                                  if (!problem.correctAnswer) return '?';
                                  // correctAnswer가 숫자 문자열인 경우 (1, 2, 3, 4)
                                  const correctNumber = parseInt(problem.correctAnswer);
                                  if (!isNaN(correctNumber) && correctNumber >= 1 && correctNumber <= 4) {
                                    return correctNumber + '번';
                                  }
                                  return '?';
                                })()}
                              </div>
                              <div className="font-medium text-gray-800 mb-1">해설:</div>
                              <div>{problemResults[problem.id].explanation}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[1, 2, 3].map((_, index) => (
                          <div key={index} className="border border-gray-300 rounded-lg px-4 py-3 h-12 bg-gray-50 flex items-center">
                            <span className="text-sm text-gray-500">답안을 입력하세요...</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {problems.length === 0 && (
                  <div className="text-center py-12">
                    {isLoading ? (
                      <>
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                        <p className="text-blue-600 text-sm font-medium">정처기 문제를 생성하고 있습니다...</p>
                        <p className="text-gray-400 text-xs mt-1">잠시만 기다려주세요</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">아직 생성된 문제가 없습니다</p>
                        <p className="text-gray-400 text-xs mt-1">채팅에서 "소프트웨어 설계 3문제 만들어줘"라고 요청해보세요</p>
                      </>
                    )}
                  </div>
                )}
                </div>
              </div>
              
              {/* 전체 답안 제출 버튼 */}
              {problems.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100">
                  <button
                    onClick={handleSubmitAllAnswers}
                    disabled={isLoading || Object.keys(submittedAnswers).length === 0 || Object.keys(problemResults).length > 0}
                    className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                  >
                    {isLoading ? '채점 중...' : Object.keys(problemResults).length > 0 ? '제출 완료' : '답안 제출'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
          {/* 입력 영역 */}
          <div className="border-t border-gray-100 p-4 pb-8 flex items-center gap-2">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 flex-1">
            {/* FT 로고 */}
            <Image 
              src="/FT-logo.png" 
              alt="FT" 
              width={20} 
              height={20} 
              className="object-contain"
            />
            
              {/* 텍스트 입력 필드 */}
              <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-3">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // 폼 제출 트리거
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        form.requestSubmit();
                      }
                    }
                  }}
                  placeholder={question ? "" : "질문을 입력해 주세요."}
                  className="flex-1 bg-transparent border-0 focus:outline-none text-gray-700 placeholder-gray-500 text-sm"
                />
                
                {/* 마이크 버튼 */}
                <MobileVoiceInput
                  onTranscript={handleVoiceTranscript}
                  disabled={false}
                />
                
                {/* 전송 버튼 */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors mobile-button disabled:opacity-50"
                  aria-label="전송"
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                    />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* 설정 메뉴 */}
        <MobileSettingsMenu
          isOpen={showSettingsMenu}
          onClose={() => setShowSettingsMenu(false)}
          onVoiceTest={handleVoiceTest}
          onGetHelp={handleGetHelp}
          onLogin={handleLogin}
          user={user}
          autoTTSEnabled={autoTTSEnabled}
          onToggleAutoTTS={handleToggleAutoTTS}
        />

        {/* 로그인 모달 */}
        <MobileLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />

        {/* 음성 테스트 모달 */}
        <MobileVoiceTest
          isOpen={showVoiceTest}
          onClose={() => setShowVoiceTest(false)}
        />

        {/* 도움말 모달 */}
        <HelpModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />
    </div>
  );
};

export default MainPage;
