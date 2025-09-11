'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import MobileSettingsMenu from './MobileSettingsMenu';
import { MobileLoginModal } from './MobileLoginModal';
import { MobileVoiceInput } from './MobileVoiceInput';
import { MobileVoiceTest } from './MobileVoiceTest';
import { HelpModal } from '../HelpModal';

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

  // 전역 오류 처리
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('message port closed')) {
        console.warn('메시지 포트 오류 무시:', event.message);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

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
              if (line.match(/^\d+\./)) {
                options.push(line);
              } else if (line.includes('정답:') || line.includes('답:')) {
                correctAnswer = line.replace(/.*(정답|답):\s*/, '');
              } else if (line.includes('해설:') || line.includes('설명:')) {
                explanation = line.replace(/.*(해설|설명):\s*/, '');
              }
            }
            
            if (questionText && options.length > 0) {
              problems.push({
                id: questionId,
                question: questionText,
                type: 'multiple' as const,
                options: options,
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
          const parsedProblems: Problem[] = newQuestions.map((q: any, index: number) => ({
            id: index + 1,
            question: q.question,
            type: 'multiple' as const,
            options: q.options,
            correctAnswer: q.answer,
            explanation: q.explanation
          }));
          
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

  return (
    <div className="w-full h-screen bg-white flex flex-col mobile-container mobile-safe-area">
        {/* 상단 헤더 */}
        <div className="pt-4 px-6 flex items-center justify-between">
          {/* 왼쪽: FT 로고와 사용자 정보 */}
          <div className="flex items-center gap-3">
            <Image 
              src="/FT-logo.png" 
              alt="FT" 
              width={32} 
              height={32} 
              className="object-contain"
            />
            {isLoggedIn && user && (
              <div className="flex items-center gap-2">
                {user?.picture && (
                  <Image 
                    src={user.picture} 
                    alt={user?.name || 'User'} 
                    width={24} 
                    height={24} 
                    className="rounded-full"
                  />
                )}
                <span className="text-sm text-gray-600 font-medium">
                  {user?.name || 'User'}
                </span>
              </div>
            )}
          </div>
          
          {/* 오른쪽: 백엔드 상태, 웹모드 버튼과 설정 버튼 */}
          <div className="flex items-center gap-2">
            
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

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'chat' ? (
            /* 채팅 화면 */
            <div className="h-full flex flex-col">
              {messages.length === 0 ? (
                /* 초기 화면 */
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
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
                    <div className="space-y-2">
                      <button 
                        onClick={() => setQuestion("오이에는 어떤 병해충이 있어?")}
                        className="w-full text-sm text-black flex items-center justify-center hover:bg-gray-50 rounded-lg py-2 transition-colors"
                      >
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        농사: "오이에는 어떤 병해충이 있어?"
                      </button>
                      <button 
                        onClick={() => setQuestion("소프트웨어 설계 3문제 만들어줘")}
                        className="w-full text-sm text-black flex items-center justify-center hover:bg-gray-50 rounded-lg py-2 transition-colors"
                      >
                        <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                        정처기: "소프트웨어 설계 3문제 만들어줘"
                      </button>
                      <button 
                        onClick={() => setQuestion("데이터베이스 5문제 만들어줘")}
                        className="w-full text-sm text-black flex items-center justify-center hover:bg-gray-50 rounded-lg py-2 transition-colors"
                      >
                        <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                        정처기: "데이터베이스 5문제 만들어줘"
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
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
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
                        {problem.options.map((option, index) => (
                          <div key={index} className="flex items-start">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                            </div>
                            <div className="text-sm text-gray-700 leading-relaxed flex-1">
                              {option}
                            </div>
                          </div>
                        ))}
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
                    
                    {/* 정답과 해설 (개발용 - 실제로는 숨김) */}
                    {process.env.NODE_ENV === 'development' && (problem.correctAnswer || problem.explanation) && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        {problem.correctAnswer && (
                          <div className="text-sm text-blue-800 mb-2">
                            <span className="font-medium">정답:</span> {problem.correctAnswer}
                          </div>
                        )}
                        {problem.explanation && (
                          <div className="text-sm text-blue-700">
                            <span className="font-medium">해설:</span> {problem.explanation}
                          </div>
                        )}
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
            </div>
          )}
        </div>
        
        {/* 하단 입력 바 */}
        <div className="px-4 pb-6 mobile-safe-area">
          <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3">
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
                placeholder="질문을 입력해 주세요."
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

        {/* 설정 메뉴 */}
        <MobileSettingsMenu
          isOpen={showSettingsMenu}
          onClose={() => setShowSettingsMenu(false)}
          onVoiceTest={handleVoiceTest}
          onGetHelp={handleGetHelp}
          onLogin={handleLogin}
          user={user}
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
