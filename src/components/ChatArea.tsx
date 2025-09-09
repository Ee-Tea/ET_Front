'use client';

import React, { useState, useEffect } from 'react';
import VoiceInputButton from './VoiceInputButton';

interface ChatAreaProps {
  onProblemDetected: () => void;
  onOpenSettings: () => void;
  onVoiceTranscript: (transcript: string) => void;
  onFarmingTTS: (text: string) => void;
  isBackendConnected: boolean;
  isVoiceServiceConnected: boolean;
}

export default function ChatArea({
  onProblemDetected,
  onOpenSettings,
  onVoiceTranscript,
  onFarmingTTS,
  isBackendConnected,
  isVoiceServiceConnected
}: ChatAreaProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await fetch("http://localhost:8000/chat", {
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

      // LLM 응답 완료 후 문제 목록 새로고침
      setTimeout(() => onProblemDetected(), 1000);
    } catch (error) {
      console.error("백엔드 API 호출 실패:", error);
      const errorMessage = {
        role: "assistant",
        content: "죄송합니다. 백엔드 서버에 연결할 수 없습니다."
      };
      setMessages(prev => [...prev, errorMessage]);
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
      const response = await fetch("http://localhost:8000/clear", {
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
    <div className="flex-1 flex flex-col" suppressHydrationWarning>
      {/* 채팅 헤더 */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/FT-logo.png" 
              alt="FT Logo" 
              className="w-8 h-8 object-contain"
            />
            <h2 className="text-lg font-semibold text-gray-800">FT 채팅</h2>
          </div>
          <div className="flex items-center space-x-2">
            {/* 연결 상태 표시 */}
            {isBackendConnected === null ? (
              <div className="flex items-center space-x-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                <span className="text-xs text-gray-500">연결 확인 중...</span>
              </div>
            ) : isBackendConnected ? (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">연결됨</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-red-600">연결 안됨</span>
              </div>
            )}
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
              <h3 className="text-2xl font-bold text-gray-800 mb-4">안녕하세요! FT입니다</h3>
              <p className="text-gray-600 mb-6">
                농사와 정보처리기사 관련 질문에 답변해드릴 수 있습니다.
              </p>
              <div className="text-left space-y-2 text-sm text-gray-600">
                <p className="font-medium">예시 질문:</p>
                <ul className="space-y-1">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span><strong>농사:</strong> "오이에는 어떤 병해충이 있어?"</span>
                  </li>
                  <li className="flex items-start">
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
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="질문을 입력하세요..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            전송
          </button>
        </div>
        
        {/* 연결 상태에 따른 안내 */}
        {!isBackendConnected && (
          <div className="mt-2 text-center">
            <p className="text-sm text-red-600">
              백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}