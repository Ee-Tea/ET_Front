import React, { useState, useRef, useEffect } from 'react';
import { FrontendVoiceService } from '../services/frontendVoiceService';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInputButton({ onTranscript, disabled = false }: VoiceInputButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const maxRetries = 3;


  // 브라우저 지원 여부 확인
  useEffect(() => {
    const checkSupport = () => {
      if (typeof window !== 'undefined') {
        const supported = !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
        setIsSupported(supported);
        
        if (!supported) {
          setError('이 브라우저는 Web Speech API를 지원하지 않습니다. Chrome, Edge, Safari를 사용해주세요.');
        }
      }
    };
    
    checkSupport();
  }, []);


  const startRecording = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      setIsListening(true);
      
      console.log(`🎤 음성 인식 시도 ${retryCount + 1}/${maxRetries + 1}`);
      
      // Web Speech API를 사용한 음성 인식 (API 키 불필요)
      const response = await FrontendVoiceService.speechToTextWebSpeech('ko-KR');
      
      if (response.success && response.text) {
        console.log('🎤 음성 인식 결과:', response.text);
        onTranscript(response.text);
        setRetryCount(0); // 성공 시 재시도 카운트 리셋
      } else {
        throw new Error('음성을 인식할 수 없습니다.');
      }
    } catch (error) {
      console.error('STT 처리 실패:', error);
      
      let errorMessage = '음성 인식 중 오류가 발생했습니다.';
      let shouldRetry = false;
      
      if (error instanceof Error) {
        if (error.message.includes('Web Speech API를 지원하지 않습니다')) {
          errorMessage = '이 브라우저는 음성 인식을 지원하지 않습니다. Chrome, Edge, Safari를 사용해주세요.';
        } else if (error.message.includes('마이크 접근 권한이 거부되었습니다')) {
          errorMessage = '마이크 접근 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.';
        } else if (error.message.includes('음성이 감지되지 않았습니다') || 
                   error.message.includes('음성 인식 시간이 초과되었습니다')) {
          shouldRetry = true;
          errorMessage = `음성이 감지되지 않았습니다. 마이크에 더 가까이서 말씀해주세요. (${retryCount + 1}/${maxRetries + 1})`;
        } else if (error.message.includes('음성이 명확하지 않습니다')) {
          shouldRetry = true;
          errorMessage = `음성이 명확하지 않습니다. 더 천천히 말씀해주세요. (${retryCount + 1}/${maxRetries + 1})`;
        } else if (error.message.includes('음성이 너무 짧습니다')) {
          shouldRetry = true;
          errorMessage = `음성이 너무 짧습니다. 더 길게 말씀해주세요. (${retryCount + 1}/${maxRetries + 1})`;
        } else if (error.message.includes('네트워크 연결에 문제가 있습니다')) {
          shouldRetry = true;
          errorMessage = `네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요. (${retryCount + 1}/${maxRetries + 1})`;
        } else if (error.message.includes('마이크에 접근할 수 없습니다')) {
          errorMessage = '마이크에 접근할 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.';
        } else if (error.message.includes('HTTPS 환경에서 사용해주세요')) {
          errorMessage = 'HTTPS 환경에서 사용해주세요.';
        } else {
          errorMessage = `음성 인식 중 오류가 발생했습니다: ${error.message}`;
        }
      } else {
        errorMessage = '음성 인식 중 알 수 없는 오류가 발생했습니다.';
      }
      
      setError(errorMessage);
      
      // 재시도 가능한 오류이고 최대 재시도 횟수에 도달하지 않은 경우
      if (shouldRetry && retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        console.log(`🔄 ${retryCount + 1}초 후 재시도...`);
        
        setTimeout(() => {
          if (retryCount < maxRetries) {
            startRecording();
          }
        }, 2000); // 2초 후 재시도
      } else if (retryCount >= maxRetries) {
        setError('음성 인식에 여러 번 실패했습니다. 마이크 설정을 확인해주세요.');
        setRetryCount(0);
      }
    } finally {
      setIsProcessing(false);
      setIsListening(false);
    }
  };

  const toggleRecording = () => {
    if (isProcessing) {
      return; // 처리 중이면 무시
    }
    setRetryCount(0); // 새로 시작할 때 재시도 카운트 리셋
    startRecording();
  };

  const resetError = () => {
    setError(null);
    setRetryCount(0);
  };



  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleRecording}
          disabled={disabled || isProcessing || isSupported === false}
          className={`
            relative w-8 h-8 flex items-center justify-center
            transition-colors duration-200
            ${isListening 
              ? 'text-red-500' 
              : isProcessing
              ? 'text-blue-500' 
              : 'text-gray-600 hover:text-gray-800'
            }
            ${disabled || isProcessing || isSupported === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={
            isSupported === false 
              ? '음성 인식이 지원되지 않습니다' 
              : isListening
              ? '듣고 있습니다... 말씀해주세요'
              : isProcessing
              ? '음성 인식 중...'
              : '음성 입력 시작'
          }
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

      </div>
      
      {/* 처리 중 표시 */}
      {isProcessing && (
        <div className="mt-2 text-xs font-medium text-center">
          {isListening ? (
            <div className="text-red-500 flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>듣고 있습니다... 말씀해주세요</span>
            </div>
          ) : (
            <div className="text-blue-500 flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>음성 인식 중...</span>
            </div>
          )}
        </div>
      )}
      
      {/* 재시도 표시 */}
      {retryCount > 0 && retryCount <= maxRetries && (
        <div className="mt-2 text-xs text-yellow-600 font-medium text-center">
          재시도 중... ({retryCount}/{maxRetries})
        </div>
      )}
      
      {/* 에러 메시지 */}
      {error && (
        <div className="mt-2 text-xs text-red-500 font-medium max-w-48 text-center">
          <div className="flex items-center justify-center space-x-1">
            <span>{error}</span>
            <button
              onClick={resetError}
              className="text-red-400 hover:text-red-600 ml-1"
              title="오류 메시지 닫기"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* 지원되지 않는 브라우저 안내 */}
      {isSupported === false && (
        <div className="mt-2 text-xs text-gray-500 text-center max-w-48">
          HTTPS 환경에서 사용해주세요
        </div>
      )}
    </div>
  );
}
