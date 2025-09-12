'use client';

import React, { useState, useEffect, useRef } from 'react';
import VoiceInputButton from './VoiceInputButton';
import { SettingsPanel } from './SettingsPanel';

// 정처기 관련 문제 생성 요청 감지 함수
const isProblemGenerationRequest = (message: string) => {
  const lowerMessage = message.toLowerCase();
  
  // 정처기 관련 키워드들
  const jpkiKeywords = [
    '정처기', '정보처리기사', '정보처리', 'jpki', 'jpki시험', 'jpki문제',
    '소프트웨어설계', '소프트웨어 설계', '데이터베이스', '데이터베이스구축',
    '시스템분석설계', '시스템 분석 설계', '프로그래밍언어', '프로그래밍 언어',
    '정보시스템구축', '정보시스템 구축', 'it기술', 'it 기술'
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

interface ChatAreaProps {
  onProblemDetected: () => void;
  onOpenSettings: () => void;
  onOpenVoice: () => void;
  onToggleSidebar: () => void;
  onVoiceTranscript: (transcript: string) => void;
  onFarmingTTS: (text: string) => void;
  isBackendConnected: boolean;
  isSidebarOpen: boolean;
  onLayoutChange?: (mode: number) => void;
  currentLayout?: number;
}

export default function ChatArea({
  onProblemDetected,
  onOpenSettings,
  onOpenVoice,
  onToggleSidebar,
  onVoiceTranscript,
  onFarmingTTS,
  isBackendConnected,
  isSidebarOpen,
  onLayoutChange,
  currentLayout
}: ChatAreaProps) {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;

    // clear 명령어 감지
    if (message.trim().toLowerCase() === "clear") {
      await handleClearCommand();
      return;
    }

    const userMessage = { role: "user", content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/backend/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          user_id: "frontend_user",
          chat_id: "frontend_chat",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = {
        role: "assistant",
        content: data.response || "응답을 생성할 수 없습니다."
      };
      setMessages(prev => [...prev, assistantMessage]);

      // 농사 관련 질문인지 확인하고 TTS 재생
      if (data.response) {
        onFarmingTTS(data.response);
      }

      // 문제 생성 요청인지 확인하고 문제 목록 새로고침
      const isProblemRequest = isProblemGenerationRequest(message);
      if (isProblemRequest) {
        setTimeout(() => onProblemDetected(), 1000);
      }
    } catch (error) {
      console.error("백엔드 API 호출 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCommand = async () => {
    const userMessage = { role: "user", content: "clear" };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/backend/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = {
        role: "assistant",
        content: data.message || "✅ 세션과 서비스 락이 초기화되었습니다."
      };
      setMessages(prev => [...prev, assistantMessage]);

      // 문제 목록도 새로고침
      setTimeout(() => onProblemDetected(), 1000);
    } catch (error) {
      console.error("Clear 명령 실행 실패:", error);
      const errorMessage = {
        role: "assistant",
        content: "❌ 초기화에 실패했습니다. 서버 연결을 확인해주세요."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setMessage(transcript);
    onVoiceTranscript(transcript);
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col bg-white" suppressHydrationWarning>
      {/* 채팅 헤더 */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white h-16 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            {/* 사이드바 토글 버튼 */}
            <button
              onClick={onToggleSidebar}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title={isSidebarOpen ? "사이드바 숨기기" : "사이드바 보이기"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <img 
              src="/FT-logo.png" 
              alt="FT Logo" 
              className="w-8 h-8 object-contain"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 레이아웃 전환 버튼 */}
            {onLayoutChange && (
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onLayoutChange(1)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    currentLayout === 1 ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="채팅내역 + 문제 + 채팅"
                >
                  3패널
                </button>
                <button
                  onClick={() => onLayoutChange(2)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    currentLayout === 2 ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="문제 + 채팅"
                >
                  2패널
                </button>
                <button
                  onClick={() => onLayoutChange(3)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    currentLayout === 3 ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="채팅만"
                >
                  1패널
                </button>
              </div>
            )}
            
            {/* 음성 패널 버튼 */}
            <button
              onClick={onOpenVoice}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="음성 패널"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            
            {/* 모바일 페이지 버튼 */}
            <button
              onClick={() => window.location.href = '/mobile'}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="모바일 페이지"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
            
            {/* 설정 버튼 */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="설정"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              {/* 설정 드롭다운 */}
              <SettingsPanel
                isOpen={showSettingsDropdown}
                onClose={() => setShowSettingsDropdown(false)}
                isBackendConnected={isBackendConnected}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mb-4">
                <img 
                  src="/FT-logo.png" 
                  alt="FT Logo" 
                  className="w-24 h-24 mx-auto object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">안녕하세요! FT입니다</h3>
              <p className="text-gray-600 mb-6 text-center">
                농사와 정보처리기사 관련 질문에 답변해드릴 수 있습니다.
              </p>
              <div className="text-center space-y-2 text-sm text-gray-600">
                <p className="font-medium">예시 질문:</p>
                <ul className="space-y-1">
                  <li className="flex items-center justify-center">
                    <span className="text-blue-500 mr-2">•</span>
                    <span><strong>농사:</strong> "오이에는 어떤 병해충이 있어?"</span>
                  </li>
                  <li className="flex items-center justify-center">
                    <span className="text-blue-500 mr-2">•</span>
                    <span><strong>정처기:</strong> "소프트웨어 설계 3문제 만들어줘"</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.role === "user" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-800"
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm">응답 중...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="질문을 입력하세요..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isLoading || !isBackendConnected}
          />
          
          {/* 음성 입력 버튼 */}
          <VoiceInputButton
            onTranscript={handleVoiceTranscript}
            disabled={isLoading || !isBackendConnected}
          />
          
          <button
            onClick={sendMessage}
            disabled={isLoading || !message.trim() || !isBackendConnected}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
          >
            전송
          </button>
        </div>
        
        {/* 연결 상태에 따른 안내 */}
      </div>
    </div>
  );
}