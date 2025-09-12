'use client';

import React, { useState, useEffect } from 'react';
import { FrontendVoiceService } from '@/services/frontendVoiceService';

interface MobileVoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function MobileVoiceInput({ onTranscript, disabled = false }: MobileVoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isSupported, setIsSupported] = useState(true);

  const maxRetries = 2;

  useEffect(() => {
    const checkSupport = () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        setIsSupported(false);
        setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
      }
    };
    
    checkSupport();
  }, []);

  const startRecording = async () => {
    if (disabled || !isSupported || isListening || isProcessing) return;

    try {
      setError(null);
      setIsProcessing(true);
      setIsListening(true);
      
      console.log(`🎤 모바일 음성 인식 시도 ${retryCount + 1}/${maxRetries + 1}`);
      
      const response = await FrontendVoiceService.speechToTextWebSpeech('ko-KR');
      
      if (response.success && response.text) {
        console.log('🎤 모바일 음성 인식 결과:', response.text);
        onTranscript(response.text);
        setRetryCount(0);
      } else {
        throw new Error('음성을 인식할 수 없습니다.');
      }
    } catch (error) {
      console.error('모바일 STT 처리 실패:', error);
      
      let errorMessage = '음성 인식 중 오류가 발생했습니다.';
      let shouldRetry = false;
      
      if (error instanceof Error) {
        if (error.message.includes('권한')) {
          errorMessage = '마이크 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해주세요.';
        } else if (error.message.includes('시간이 초과')) {
          errorMessage = '음성 인식 시간이 초과되었습니다. 다시 시도해주세요.';
          shouldRetry = retryCount < maxRetries;
        } else if (error.message.includes('지원하지 않습니다')) {
          errorMessage = '이 브라우저는 음성 인식을 지원하지 않습니다.';
          setIsSupported(false);
        } else if (error.message.includes('감지되지 않았습니다')) {
          errorMessage = error.message; // 친화적인 메시지 그대로 사용
          shouldRetry = retryCount < maxRetries;
        } else {
          errorMessage = error.message;
          shouldRetry = retryCount < maxRetries;
        }
      }
      
      setError(errorMessage);
      
      if (shouldRetry) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          startRecording();
        }, 1000);
      } else {
        setRetryCount(0);
      }
    } finally {
      setIsProcessing(false);
      setIsListening(false);
    }
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className="p-2 text-gray-400 cursor-not-allowed mobile-button"
        title="음성 인식 미지원"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled || isListening || isProcessing}
      className={`p-2 transition-all duration-300 mobile-button ${
        isListening 
          ? 'text-red-500 animate-pulse' 
          : isProcessing 
            ? 'text-blue-500' 
            : 'text-gray-500 hover:text-gray-700'
      }`}
      title={isListening ? '음성 인식 중...' : '음성 입력'}
    >
      {isProcessing ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
          />
        </svg>
      )}
    </button>
  );
}