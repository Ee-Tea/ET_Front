import React, { useState, useRef, useEffect } from 'react';
import { FrontendVoiceService } from '../services/frontendVoiceService';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  onOpenSettings?: () => void;
}

export default function VoiceInputButton({ onTranscript, disabled = false, onOpenSettings }: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 녹음 시간 타이머
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // 브라우저 지원 여부 확인
  useEffect(() => {
    const checkSupport = () => {
      if (typeof window !== 'undefined') {
        const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        setIsSupported(supported);
        
        if (!supported) {
          setError('이 브라우저는 마이크 접근을 지원하지 않습니다. HTTPS 환경에서 사용해주세요.');
        }
      }
    };
    
    checkSupport();
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      
      // Web Speech API를 사용한 음성 인식 (API 키 불필요)
      const response = await FrontendVoiceService.speechToTextWebSpeech('ko-KR');
      
      if (response.success && response.text) {
        console.log('🎤 음성 인식 결과:', response.text);
        onTranscript(response.text);
      } else {
        setError('음성을 인식할 수 없습니다.');
      }
    } catch (error) {
      console.error('STT 처리 실패:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Web Speech API를 지원하지 않습니다')) {
          setError('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome, Edge, Safari를 사용해주세요.');
        } else if (error.message.includes('마이크 접근 권한이 거부되었습니다')) {
          setError('마이크 접근 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
        } else if (error.message.includes('음성이 감지되지 않았습니다')) {
          setError('음성이 감지되지 않았습니다. 다시 시도해주세요.');
        } else {
          setError(`음성 인식 중 오류가 발생했습니다: ${error.message}`);
        }
      } else {
        setError('음성 인식 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isProcessing) {
      return; // 처리 중이면 무시
    }
    startRecording();
  };


  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleRecording}
          disabled={disabled || isProcessing || isSupported === false}
          className={`
            relative w-12 h-12 rounded-full flex items-center justify-center
            transition-all duration-200 transform hover:scale-105
            ${isProcessing 
              ? 'bg-blue-500 text-white animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
            ${disabled || isProcessing || isSupported === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            shadow-lg hover:shadow-xl
          `}
          title={
            isSupported === false 
              ? '음성 인식이 지원되지 않습니다' 
              : isProcessing
              ? '음성 인식 중...'
              : '음성 입력 시작'
          }
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 flex items-center justify-center transition-colors"
            title="마이크 설정"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      {/* 처리 중 표시 */}
      {isProcessing && (
        <div className="mt-2 text-xs text-blue-500 font-medium">
          음성 인식 중...
        </div>
      )}
      
      {/* 에러 메시지 */}
      {error && (
        <div className="mt-2 text-xs text-red-500 font-medium max-w-40 text-center">
          {error}
        </div>
      )}
      
      {/* 지원되지 않는 브라우저 안내 */}
      {isSupported === false && (
        <div className="mt-2 text-xs text-gray-500 text-center max-w-40">
          HTTPS 환경에서 사용해주세요
        </div>
      )}
    </div>
  );
}
