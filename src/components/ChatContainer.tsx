'use client';

import React, { useState, useRef, useEffect } from 'react';
import VoiceInputButton from './VoiceInputButton';
import { SettingsPanel } from './SettingsPanel';
import { useAuth } from '@/contexts/AuthContext';

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

interface ChatContainerProps {
  onProblemDetected: (userMessage?: string) => void;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  onVoiceTranscript: (transcript: string) => void;
  onFarmingTTS: (text: string) => void;
  isBackendConnected: boolean;
  isSidebarOpen: boolean;
  onLayoutExpansion?: () => void;
  message?: string;
  setMessage?: (message: string) => void;
}

export default function ChatContainer({
  onProblemDetected,
  onOpenSettings,
  onToggleSidebar,
  onVoiceTranscript,
  onFarmingTTS,
  isBackendConnected,
  isSidebarOpen,
  onLayoutExpansion,
  message: externalMessage,
  setMessage: externalSetMessage
}: ChatContainerProps) {
  const { user } = useAuth();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

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
  const [message, setMessage] = useState(externalMessage || '');
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 외부에서 받은 message 값이 변경될 때 내부 상태 업데이트
  useEffect(() => {
    if (externalMessage !== undefined) {
      setMessage(externalMessage);
    }
  }, [externalMessage]);

  // 자동 전송 이벤트 리스너
  useEffect(() => {
    const handleAutoSend = (event: CustomEvent) => {
      const { message: autoMessage } = event.detail;
      if (autoMessage && autoMessage.trim()) {
        setMessage(autoMessage);
        // 메시지 설정 후 자동 전송을 위한 플래그 설정
        setTimeout(() => {
          // 직접 sendMessage 로직 실행
          if (autoMessage.trim() && !isLoading && isBackendConnected) {
            const sendAutoMessage = async () => {
              setIsLoading(true);
              const newMessage = { role: 'user', content: autoMessage };
              setMessages(prev => [...prev, newMessage]);
              
              // 문제 생성 요청인지 확인하고 즉시 문제 컨테이너 표시
              const isProblemRequest = isProblemGenerationRequest(autoMessage);
              if (isProblemRequest) {
                setTimeout(() => onProblemDetected(autoMessage), 100);
              }
              
              try {
                const response = await fetch('/backend/chat', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    message: autoMessage,
                    session_id: null
                  }),
                });

                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
                setMessage('');
                
                // 응답 완료 후 문제 목록 새로고침 (이미 문제 컨테이너는 표시됨)
                const isProblemRequest = isProblemGenerationRequest(autoMessage);
                if (isProblemRequest && data.response && !autoMessage.includes('채점') && (
                  data.response.includes('문제') && (
                    data.response.includes('생성') || 
                    data.response.includes('다음 중') ||
                    data.response.includes('정답:') ||
                    data.response.includes('해설:')
                  )
                )) {
                  setTimeout(() => onProblemDetected(autoMessage), 1000);
                }
              } catch (error) {
                console.error('Error:', error);
                setMessages(prev => [...prev, { role: 'assistant', content: '죄송합니다. 오류가 발생했습니다.' }]);
              } finally {
                setIsLoading(false);
              }
            };
            sendAutoMessage();
          }
        }, 50);
      }
    };

    window.addEventListener('autoSendMessage', handleAutoSend as EventListener);
    return () => {
      window.removeEventListener('autoSendMessage', handleAutoSend as EventListener);
    };
  }, [isLoading, isBackendConnected]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    // 레이아웃 확장 트리거 (첫 메시지 전송 시)
    if (onLayoutExpansion && messages.length === 0) {
      onLayoutExpansion();
    }

    // clear 명령어 감지
    if (message.trim().toLowerCase() === "clear") {
      await handleClearCommand();
      return;
    }

    const userMessage = { role: "user", content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    // 문제 생성 요청인지 확인하고 즉시 문제 컨테이너 표시
    const isProblemRequest = isProblemGenerationRequest(message);
    if (isProblemRequest) {
      setTimeout(() => onProblemDetected(message), 100);
    }

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

      // 응답 완료 후 문제 목록 새로고침 (이미 문제 컨테이너는 표시됨)
      const isProblemRequest = isProblemGenerationRequest(message);
      if (isProblemRequest && data.response && !message.includes('채점') && (
        data.response.includes('문제') && (
          data.response.includes('생성') || 
          data.response.includes('다음 중') ||
          data.response.includes('정답:') ||
          data.response.includes('해설:')
        )
      )) {
        setTimeout(() => onProblemDetected(message), 1000);
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

      // clear 명령어는 문제 생성 요청이 아니므로 문제 목록 새로고침하지 않음
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
    <div className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
      {/* 헤더 */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
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
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mt-20">
              <div className="mb-4">
                <img 
                  src="/FT-logo.png" 
                  alt="FT Logo" 
                  className="w-24 h-24 mx-auto object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                안녕하세요! {user ? `${user.name}님` : ''} FT입니다
              </h3>
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
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
          {/* FT 로고 */}
          <div className="flex-shrink-0">
            <img src="/FT-logo.png" alt="FT" className="h-6 w-6" />
          </div>
          
          {/* 입력 필드 */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="질문을 입력해주세요."
            className="flex-1 text-gray-900 placeholder-gray-400 focus:outline-none text-base"
            disabled={isLoading || !isBackendConnected}
          />
          
          {/* 오른쪽 아이콘들 */}
          <div className="flex items-center space-x-2">
            {/* 음성 버튼 */}
            <VoiceInputButton
              onTranscript={handleVoiceTranscript}
              disabled={isLoading || !isBackendConnected}
            />
            
            {/* 전송 버튼 */}
            <button
              onClick={sendMessage}
              disabled={isLoading || !message.trim() || !isBackendConnected}
              className="bg-green-500 text-white rounded-lg p-2 hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 연결 상태에 따른 안내 */}
      </div>
    </div>
  );
}
