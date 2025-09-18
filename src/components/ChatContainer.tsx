'use client';

import React, { useState, useRef, useEffect } from 'react';
import VoiceInputButton from './VoiceInputButton';
import { SettingsPanel } from './SettingsPanel';
import { useAuth } from '@/contexts/AuthContext';
import { isFarmingQuestion } from '@/utils/farmingDetection';

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
  
  // 문제 생성 요청 키워드가 있으면 문제 패널 트리거 (정처기 키워드는 필수 아님)
  return hasGenerationRequest;
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
  currentSessionId?: string | null;
  currentChatId?: string;
  currentMessages?: Array<{ role: string; content: string }>;
  setCurrentMessages?: (messages: Array<{ role: string; content: string }>) => void;
  saveMessage?: (message: any) => Promise<void> | void;
  createNewSession?: () => Promise<string | null> | void;
  clearCurrentSession?: () => Promise<void> | void;
  onSessionBound?: (sessionId: string) => void;
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
  setMessage: externalSetMessage,
  currentSessionId,
  currentChatId,
  currentMessages,
  setCurrentMessages,
  saveMessage,
  createNewSession,
  clearCurrentSession
  , onSessionBound
}: ChatContainerProps) {
  const { user } = useAuth();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const autoSendInFlight = useRef(false);
  const sendInFlight = useRef(false);
  const pendingUserRef = useRef<string | null>(null);

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
  const sessionIdRef = useRef<string | null>(null);
  const debugIds = (phase: string, extra?: Record<string, any>) => {
    try {
      // eslint-disable-next-line no-console
      console.log(`[chat:ids] ${phase}`, {
        uid: user?.id || '(guest)',
        cid: currentChatId || '',
        sid_ref: sessionIdRef.current || '',
        sid_prop: currentSessionId || '',
        ...extra,
      });
    } catch {}
  };

  // ID helpers
  const getGuestId = () => {
    if (typeof window === 'undefined') return 'guest_anon';
    try {
      let gid = localStorage.getItem('guest_id');
      if (!gid) {
        gid = 'guest_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('guest_id', gid);
      }
      return gid;
    } catch {
      return 'guest_anon';
    }
  };

  const resolveIds = () => {
    const uid = user?.id || getGuestId();
    const cid = currentChatId ? String(currentChatId) : '';
    return { uid, cid };
  };


  // 외부로부터 전달된 currentSessionId가 바뀌면 항상 ref도 동기화하고, 내부 메시지를 초기화
  const prevSessionPropRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentSessionId && currentSessionId !== prevSessionPropRef.current) {
      const isFirstBind = prevSessionPropRef.current === null;
      sessionIdRef.current = currentSessionId;
      prevSessionPropRef.current = currentSessionId;
      // 세션 전환(이전 세션 존재)일 때만 메시지 초기화. 최초 바인딩(첫 전송 직후)은 초기화하지 않음.
      if (!isFirstBind) {
        setMessages([]);
      }
      debugIds('bind-from-props', { bind: currentSessionId, first: isFirstBind });
    } else if (!currentSessionId && prevSessionPropRef.current !== null) {
      // 세션 해제 시 내부도 초기화
      sessionIdRef.current = null;
      prevSessionPropRef.current = null;
      setMessages([]);
      debugIds('unbind-from-props');
    }
  }, [currentSessionId]);

  // 세션 보장: 없으면 생성 후 ref에 고정
  const ensureSession = async (uid: string): Promise<string> => {
    // 1) 이미 바인딩된 세션이 있으면 그대로 사용
    if (sessionIdRef.current) return sessionIdRef.current;
    // 2) 부모에서 전달된 세션을 우선 사용하여 중복 생성 방지 (특히 '새 채팅' 직후)
    if (currentSessionId) {
      sessionIdRef.current = currentSessionId;
      debugIds('ensureSession:bind-prop', { sid: currentSessionId });
      return currentSessionId;
    }
    // 3) 초기 화면(대화 비어있음)이고 상위 세션이 아직 없다면: 잠시 대기하여 상위가 세션을 설정할 기회를 줌(레코딩/저사양 환경 레이스 완화)
    if (messages.length === 0 && !currentSessionId) {
      for (let i = 0; i < 10; i++) { // 최대 ~500ms 대기
        await new Promise(r => setTimeout(r, 50));
        if (currentSessionId) {
          sessionIdRef.current = currentSessionId;
          debugIds('ensureSession:bind-prop-delayed', { sid: currentSessionId, waitedMs: (i + 1) * 50 });
          return currentSessionId;
        }
      }
    }
    // 3-b) 여전히 없으면 새 세션 생성 (첫 전송은 항상 신규 세션)
    if (messages.length === 0 && createNewSession && !currentSessionId) {
      const previous = sessionIdRef.current || currentSessionId || '';
      const sid = await Promise.resolve(createNewSession());
      if (sid) {
        sessionIdRef.current = sid;
        if (onSessionBound) onSessionBound(sid);
        debugIds('ensureSession:new-first-send', { sid, previous });
        return sid;
      }
    }
    // 4) 여전히 없으면 새 세션 생성
    if (createNewSession) {
      const sid = await Promise.resolve(createNewSession());
      if (sid) {
        sessionIdRef.current = sid;
        if (onSessionBound) onSessionBound(sid);
        debugIds('ensureSession:new', { sid });
        return sid;
      }
    }
    // 5) 실패 시 게스트용 임시 식별 (서버가 다시 부여할 수 있음)
    return '';
  };

  // 외부에서 받은 message 값이 변경될 때 내부 상태 업데이트
  useEffect(() => {
    if (externalMessage !== undefined) {
      setMessage(externalMessage);
    }
  }, [externalMessage]);

  // 외부 메시지가 늘어난 경우에만 내부 상태를 동기화 (빈 목록으로는 덮어쓰지 않음)
  useEffect(() => {
    if (!currentMessages) return;
    const mapped = currentMessages.map((m: any) => ({
      role: m.role || m.speaker || 'user',
      content: m.content || '',
    }));
    const pending = pendingUserRef.current;
    const hasPendingInServer = !!pending && mapped.some((m: any) => m.role === 'user' && m.content === pending);
    if (hasPendingInServer) pendingUserRef.current = null;
    const display = (!pending || hasPendingInServer) ? mapped : [{ role: 'user', content: pending }, ...mapped];
    // 중복 렌더 방지
    if (JSON.stringify(display) !== JSON.stringify(messages)) {
      setMessages(display);
    }
  }, [currentMessages]);

  // 자동 전송 이벤트 리스너
  useEffect(() => {
    const handleAutoSend = (event: CustomEvent) => {
      const { message: autoMessage } = event.detail;
      if (!autoMessage || !autoMessage.trim()) return;
      if (autoSendInFlight.current) return;
      if (isLoading || !isBackendConnected) return;
      autoSendInFlight.current = true;
      setMessage(autoMessage);
      // 문제 생성 요청이어도, 세션 바인딩 후(sendMessage 내부에서) 트리거하도록 변경
      setTimeout(async () => {
        try {
          await sendMessage(autoMessage);
        } finally {
          autoSendInFlight.current = false;
        }
      }, 50);
    };

    const handleExampleQuestion = (event: CustomEvent) => {
      if (event.detail && event.detail.question && !isLoading && isBackendConnected) {
        setMessage(event.detail.question);
        setTimeout(() => {
          sendMessage();
        }, 50);
      }
    };

    window.addEventListener('autoSendMessage', handleAutoSend as EventListener);
    window.addEventListener('exampleQuestionClick', handleExampleQuestion as EventListener);
    return () => {
      window.removeEventListener('autoSendMessage', handleAutoSend as EventListener);
      window.removeEventListener('exampleQuestionClick', handleExampleQuestion as EventListener);
    };
  }, [isLoading, isBackendConnected]);

  const sendMessage = async (forceMessage?: string) => {
    const text = (forceMessage ?? message).trim();
    if (!text) return;
    if (sendInFlight.current) return;
    sendInFlight.current = true;

    // 레이아웃 확장 트리거 (첫 메시지 전송 시)
    if (onLayoutExpansion && messages.length === 0) {
      onLayoutExpansion();
    }

    // clear 명령어 감지
    if (message.trim().toLowerCase() === "clear") {
      await handleClearCommand();
      return;
    }

    const userMessage = { role: "user", content: text };
    // 중복 삽입 방지: 같은 내용의 사용자 메시지가 마지막에 이미 있으면 추가하지 않음
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === 'user' && (last as any).content === text) return prev;
      return [...prev, userMessage];
    });
    pendingUserRef.current = text;
    // 세션 보장
    try {
      await ensureSession(user?.id || getGuestId());
    } catch {}
    if (!forceMessage) setMessage("");
    setIsLoading(true);

    // 문제 생성 요청인지 확인하고 즉시 문제 컨테이너 표시
    const isProblemRequest = isProblemGenerationRequest(text);

    try {
      const reqId = Math.random().toString(36).slice(2, 10);
      const t0 = performance.now();
      // eslint-disable-next-line no-console
      console.log(`[req:${reqId}] POST /api/proxy/chat start`);
      const { uid, cid } = resolveIds();
      const sid = await ensureSession(uid);
      debugIds('sendMessage:before-fetch', { reqId, uid, sid });
      const response = await fetch("/api/proxy/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": uid,
          "x-request-id": reqId,
          ...(sid ? { 'x-session-id': sid } : {}),
        },
        body: JSON.stringify({
          message: text || '안녕하세요',
          user_id: uid,
          ...(sid ? { session_id: sid } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const resSessionId = (data && data.session_id) || response.headers.get('x-session-id');
      if (!sessionIdRef.current && resSessionId) {
        sessionIdRef.current = resSessionId;
        if (onSessionBound) onSessionBound(resSessionId);
      }
      debugIds('sendMessage:after-fetch', { reqId, res_sid_header: response.headers.get('x-session-id') || '', res_sid_body: data?.session_id || '' });
      // eslint-disable-next-line no-console
      console.log(`[req:${reqId}] POST /api/proxy/chat done`, { status: response.status, ms: (performance.now() - t0).toFixed(1) });
      const assistantMessage = {
        role: "assistant",
        content: data.response || "응답을 생성할 수 없습니다."
      };
      // 서버 응답이 우리 낙관적 메시지 개수보다 적으면 덮어쓰지 않음
      setMessages(prev => {
        const next = [...prev, assistantMessage];
        return next;
      });
      // 외부 저장 제거: 서버에서 이미 user/assistant 메시지를 저장함

      // 세션 바인딩 이후: 문제 생성 요청이면 응답 내용과 무관하게 문제 목록 폴링을 트리거
      if (isProblemRequest) {
        setTimeout(() => onProblemDetected(text), 300);
      }
    } catch (error) {
      console.error("백엔드 API 호출 실패:", error);
    } finally {
      setIsLoading(false);
      sendInFlight.current = false;
    }
  };

  const handleClearCommand = async () => {
    const userMessage = { role: "user", content: "clear" };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const { uid, cid } = resolveIds();
      const response = await fetch("/api/proxy/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": uid,
          "x-chat-id": cid,
        },
        body: JSON.stringify({
          user_id: uid,
          chat_id: cid,
        }),
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
              className="p-2 text-gray-700 rounded-lg"
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
                <div className="flex items-start justify-between">
                  <p className="text-sm whitespace-pre-wrap flex-1">{msg.content}</p>
                  {/* 농사 관련 질문인 경우 TTS 버튼 표시 */}
                  {msg.role === "assistant" && isFarmingQuestion(msg.content) && (
                    <button
                      onClick={() => onFarmingTTS(msg.content)}
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
            placeholder={message ? "" : "질문을 입력해주세요."}
            className="flex-1 text-gray-900 placeholder-gray-400 focus:outline-none text-base"
            disabled={!isBackendConnected}
          />
          
          {/* 오른쪽 아이콘들 */}
          <div className="flex items-center space-x-2">
            {/* 음성 버튼 */}
            <VoiceInputButton
              onTranscript={handleVoiceTranscript}
              disabled={!isBackendConnected}
            />
            
            {/* 전송 버튼 */}
            <button
              onClick={() => sendMessage()}
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
