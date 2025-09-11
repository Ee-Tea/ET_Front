'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import MobileSettingsMenu from './MobileSettingsMenu';
import { MobileLoginModal } from './MobileLoginModal';
import { MobileVoiceInput } from './MobileVoiceInput';
import { MobileVoiceTest } from './MobileVoiceTest';
import { HelpModal } from '../HelpModal';
import { useAuth } from '@/contexts/AuthContext';

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
}

interface MainPageProps {
  onQuestionSubmit?: (question: string) => void;
  onVoiceInput?: () => void;
  isBackendConnected?: boolean;
}

const MainPage: React.FC<MainPageProps> = ({ 
  onQuestionSubmit, 
  onVoiceInput,
  isBackendConnected = false
}) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'problems'>('chat');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVoiceTest, setShowVoiceTest] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const { user } = useAuth();

  // 문제 생성 요청인지 확인하는 함수
  const isProblemGenerationRequest = (message: string): boolean => {
    const problemKeywords = ['문제', '문제만들어', '문제생성', '문제출제', '문제만들어줘', '문제생성해줘'];
    return problemKeywords.some(keyword => message.includes(keyword));
  };

  // 문제 파싱 함수
  const parseProblems = (content: string): Problem[] => {
    const problems: Problem[] = [];
    const lines = content.split('\n');
    let currentProblem: Partial<Problem> = {};
    let problemId = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('문제:') || trimmedLine.match(/^\d+\.\s*문제:/)) {
        if (currentProblem.question) {
          problems.push({ ...currentProblem, id: problemId } as Problem);
          problemId++;
        }
        currentProblem = {
          question: trimmedLine.replace(/^\d+\.\s*/, ''),
          type: 'multiple' as const,
          options: []
        };
      } else if (trimmedLine.startsWith('*') && currentProblem.question) {
        if (!currentProblem.options) currentProblem.options = [];
        currentProblem.options.push(trimmedLine.substring(1).trim());
      } else if (trimmedLine.includes('답:') && currentProblem.question) {
        currentProblem.type = 'short' as const;
      }
    }

    if (currentProblem.question) {
      problems.push({ ...currentProblem, id: problemId } as Problem);
    }

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
      setCurrentView('problems');
    }

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question.trim(),
          user_id: "mobile_user",
          chat_id: "mobile_chat",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || "응답을 생성할 수 없습니다."
      };
      setMessages(prev => [...prev, assistantMessage]);

      // 문제 생성 요청인 경우 문제 파싱
      if (isProblemRequest && data.response) {
        const parsedProblems = parseProblems(data.response);
        if (parsedProblems.length > 0) {
          setProblems(parsedProblems);
          setCurrentView('problems');
        }
      }

    } catch (error) {
      console.error('메시지 전송 실패:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "죄송합니다. 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setQuestion('');
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setQuestion(text);
    if (onVoiceInput) {
      onVoiceInput();
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
          {/* 왼쪽: FT 로고 */}
          <div className="flex items-center">
            <Image 
              src="/FT-logo.png" 
              alt="FT" 
              width={32} 
              height={32} 
              className="object-contain"
            />
          </div>
          
          {/* 오른쪽: 웹모드 버튼과 설정 버튼 */}
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
                  {/* FT 로고 */}
                  <div className="mb-6">
                    <Image 
                      src="/FT-logo.png" 
                      alt="FT" 
                      width={120} 
                      height={120} 
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
                    <div className="space-y-2">
                      <div className="text-sm text-black flex items-center justify-center">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                        농사: "오이에는 어떤 병해충이 있어?"
                      </div>
                      <div className="text-sm text-black flex items-center justify-center">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                        정처기: "소프트웨어 설계 3문제 만들어줘"
                      </div>
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
              {/* 문제 화면 헤더 */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">FT</div>
                </div>
              </div>
              
              {/* 문제 목록 */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-6">
                {problems.map((problem) => (
                  <div key={problem.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-800 mb-3">
                      {problem.id}. {problem.question}
                    </div>
                    
                    {problem.type === 'multiple' && problem.options ? (
                      <div className="space-y-2">
                        {problem.options.map((option, index) => (
                          <div key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span>{option}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {[1, 2, 3].map((_, index) => (
                          <div key={index} className="border border-gray-300 rounded px-3 py-2 h-10 bg-gray-50"></div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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
                placeholder="소프트웨어 설계 3문제 만들어줘"
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
          isBackendConnected={isBackendConnected}
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
