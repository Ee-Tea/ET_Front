import React, { useState, useRef, useEffect } from 'react';
import { VoiceService } from '../services/voiceService';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInputButton({ onTranscript, disabled = false }: VoiceInputButtonProps) {
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
      
      // 브라우저 지원 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('이 브라우저는 마이크 접근을 지원하지 않습니다.');
      }
      
      // 마이크 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // MediaRecorder 설정 - WAV 형식 우선 시도
      let mediaRecorder: MediaRecorder;
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/wav' });
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/mp4' });
      } else {
        mediaRecorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // 녹음 데이터 수집
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // 녹음 완료 처리
      mediaRecorder.onstop = async () => {
        try {
          setIsProcessing(true);
          
          // 오디오 데이터를 Blob으로 변환
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
          console.log('🎤 녹음 완료:', {
            size: audioBlob.size,
            type: audioBlob.type,
            chunks: audioChunksRef.current.length
          });
          
          // STT API 호출
          const response = await VoiceService.speechToText(audioBlob, 'ko');
          
          if (response.success && response.text) {
            console.log('🎤 음성 인식 결과:', response.text);
            onTranscript(response.text);
          } else {
            setError('음성을 인식할 수 없습니다.');
          }
        } catch (error) {
          console.error('STT 처리 실패:', error);
          
          if (error instanceof Error) {
            if (error.message.includes('STT 서버 오류')) {
              setError('음성 서비스 서버가 실행되지 않았습니다. 서버를 확인해주세요.');
            } else if (error.message.includes('STT API를 찾을 수 없습니다')) {
              setError('음성 서비스 서버를 찾을 수 없습니다. 서버를 실행해주세요.');
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
      
      // 녹음 시작
      mediaRecorder.start(1000); // 1초마다 데이터 수집
      setIsRecording(true);
      
    } catch (error) {
      console.error('녹음 시작 실패:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('마이크 접근 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
        } else if (error.name === 'NotFoundError') {
          setError('마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.');
        } else if (error.name === 'NotSupportedError') {
          setError('이 브라우저는 마이크 접근을 지원하지 않습니다.');
        } else {
          setError(`마이크 접근 오류: ${error.message}`);
        }
      } else {
        setError('마이크 접근 중 알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    // 스트림 정리
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };


  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={toggleRecording}
        disabled={disabled || isProcessing || isSupported === false}
        className={`
          relative w-12 h-12 rounded-full flex items-center justify-center
          transition-all duration-200 transform hover:scale-105
          ${isRecording 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
          }
          ${disabled || isProcessing || isSupported === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          shadow-lg hover:shadow-xl
        `}
        title={
          isSupported === false 
            ? '마이크 접근이 지원되지 않습니다' 
            : isRecording 
            ? '녹음 중지' 
            : '음성 입력 시작'
        }
      >
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : isRecording ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      
      {/* 녹음 시간 표시 */}
      {isRecording && (
        <div className="mt-2 text-xs text-red-500 font-medium">
          {formatTime(recordingTime)}
        </div>
      )}
      
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
