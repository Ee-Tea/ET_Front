'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FrontendVoiceService } from '@/services/frontendVoiceService';
import { isFarmingQuestion } from '@/utils/farmingDetection';

interface MobileVoiceModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileVoiceMode({ isOpen, onClose }: MobileVoiceModeProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const checkSupport = () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        setIsSupported(false);
        setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
      }
    };
    
    checkSupport();
  }, []);

  // 컴포넌트 언마운트 시 오디오 정리
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  const handleVoiceInput = async () => {
    if (!isSupported) return;

    // 이미 듣고 있는 중이면 중지
    if (isListening) {
      setIsListening(false);
      return;
    }

    // 처리 중이거나 말하는 중이면 무시
    if (isProcessing || isSpeaking) return;

    try {
      setError(null);
      setIsListening(true);
      
      console.log('🎤 음성 모드 - 음성 인식 시작');
      
      const response = await FrontendVoiceService.speechToTextWebSpeech('ko-KR');
      
      if (response.success && response.text) {
        console.log('🎤 음성 모드 - 인식된 텍스트:', response.text);
        setIsListening(false);
        setIsProcessing(true);
        
        // 백엔드에 질문 전송
        await sendQuestionAndPlayResponse(response.text);
      } else {
        throw new Error('음성을 인식할 수 없습니다.');
      }
    } catch (error) {
      console.error('음성 모드 - STT 오류:', error);
      setError(error instanceof Error ? error.message : '음성 인식 중 오류가 발생했습니다.');
    } finally {
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  const sendQuestionAndPlayResponse = async (question: string) => {
    try {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          user_id: "mobile_voice_user",
          chat_id: "mobile_voice_chat",
        }),
        signal: AbortSignal.timeout(40000)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.final_response || data.response || data.message || "응답을 생성할 수 없습니다.";
      
      console.log('🎤 음성 모드 - 백엔드 응답:', responseText);
      
      // TTS로 응답 재생
      await playTTSResponse(responseText);
      
    } catch (error) {
      console.error('음성 모드 - 백엔드 통신 오류:', error);
      setError('서버와의 통신 중 오류가 발생했습니다.');
    }
  };

  const playTTSResponse = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      // 기존 오디오 정지
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }

      // FrontendVoiceService를 사용한 TTS
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
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        setCurrentAudio(audio);
        
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          setCurrentAudio(null);
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          console.error('TTS 오디오 재생 오류');
          URL.revokeObjectURL(audioUrl);
          setCurrentAudio(null);
        };
        
        await audio.play();
      } else {
        throw new Error('TTS 서비스 오류');
      }
    } catch (error) {
      console.error('TTS 재생 오류:', error);
      setIsSpeaking(false);
      setError('음성 출력 중 오류가 발생했습니다.');
    }
  };

  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
    }
    setIsSpeaking(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-end p-4 bg-white">
        <button
          onClick={onClose}
          className="text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-800">
        {/* 상태 표시 */}
        <div className="mb-8 text-center">
          {!isListening && !isProcessing && !isSpeaking && (
            <div className="mb-4">
              <p className="text-lg text-gray-600">버튼을 눌러 말씀해주세요</p>
              <p className="text-sm text-gray-500 mt-2">음성으로 질문하면</p>
            </div>
          )}
        </div>

        {/* 음성 입력 버튼 */}
        <div className="mt-40 flex flex-col items-center">
          <button
            onClick={handleVoiceInput}
            disabled={!isSupported || (isProcessing || isSpeaking)}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
              isListening 
                ? 'bg-red-500 animate-pulse' 
                : isProcessing 
                ? 'bg-blue-500' 
                : isSpeaking 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-amber-100 hover:bg-amber-200'
            } ${!isSupported ? 'bg-gray-400' : ''}`}
          >
            {isListening ? (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : isProcessing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            ) : isSpeaking ? (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          
          {/* 상태 텍스트 */}
          <div className="mt-4 text-center">
            {isListening && (
              <p className="text-lg text-gray-600">듣고 있습니다...</p>
            )}
            {isProcessing && (
              <p className="text-lg text-gray-600">처리 중...</p>
            )}
            {isSpeaking && (
              <div>
                <p className="text-lg text-gray-600">답변 중...</p>
                <button
                  onClick={stopSpeaking}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  중지
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mt-8 p-4 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
            >
              닫기
            </button>
          </div>
        )}

        {/* 도움말 */}
        <div className="mt-8 text-center text-gray-500 text-sm max-w-md">
        </div>
      </div>
    </div>
  );
}
