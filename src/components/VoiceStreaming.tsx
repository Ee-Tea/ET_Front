"use client";

import { useState, useRef, useEffect } from 'react';
import { VoiceService } from '../services/voiceService';
import { TTSStreamResponse, VoiceSettings } from '../types/voice';

interface VoiceStreamingProps {
  text?: string;
  onTextChange?: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceStreaming({ text = '', onTextChange, disabled = false }: VoiceStreamingProps) {
  const [inputText, setInputText] = useState(text);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string>('');
  const [streamProgress, setStreamProgress] = useState(0);
  const [audioChunks, setAudioChunks] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  
  // 음성 설정
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    language: 'ko',
    voice: 'default',
    speed: 1.0,
    pitch: 1.0
  });

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleTextChange = (newText: string) => {
    setInputText(newText);
    onTextChange?.(newText);
  };

  const startStreaming = async () => {
    if (!inputText.trim()) {
      setError('텍스트를 입력해주세요');
      return;
    }

    setIsStreaming(true);
    setError('');
    setStreamProgress(0);
    setAudioChunks([]);
    audioQueueRef.current = [];
    
    try {
      // AudioContext 초기화
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // 스트리밍 시작
      const streamGenerator = VoiceService.textToSpeechStream(inputText, voiceSettings);
      
      for await (const chunk of streamGenerator) {
        if (chunk.chunk) {
          setAudioChunks(prev => [...prev, chunk.chunk]);
          
          // 오디오 청크를 AudioBuffer로 변환
          try {
            const audioData = Uint8Array.from(atob(chunk.chunk), c => c.charCodeAt(0));
            const audioBuffer = await audioContextRef.current!.decodeAudioData(audioData.buffer);
            audioQueueRef.current.push(audioBuffer);
            
            // 자동 재생 시작
            if (!isPlayingRef.current) {
              startPlayback();
            }
          } catch (err) {
            console.warn('오디오 청크 디코딩 실패:', err);
          }
        }
        
        // 진행률 업데이트 (청크 시퀀스 기반)
        if (chunk.sequence) {
          setStreamProgress(Math.min((chunk.sequence / 10) * 100, 100)); // 예상 총 청크 수: 10
        }
        
        // 스트림 완료
        if (chunk.is_final) {
          setIsStreaming(false);
          setStreamProgress(100);
          break;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '스트리밍 중 오류가 발생했습니다';
      setError(errorMessage);
      setIsStreaming(false);
    }
  };

  const startPlayback = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    
    isPlayingRef.current = true;
    setIsPlaying(true);
    
    try {
      while (audioQueueRef.current.length > 0 && isPlayingRef.current) {
        const audioBuffer = audioQueueRef.current.shift()!;
        const source = audioContextRef.current!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current!.destination);
        
        // 재생 완료 대기
        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
          source.start();
        });
      }
    } catch (err) {
      console.error('재생 중 오류:', err);
      setError('오디오 재생 중 오류가 발생했습니다');
    } finally {
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    isPlayingRef.current = false;
    setIsPlaying(false);
    audioQueueRef.current = [];
  };

  const clearText = () => {
    setInputText('');
    onTextChange?.('');
    setError('');
    setAudioChunks([]);
    audioQueueRef.current = [];
    setStreamProgress(0);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          🌊 실시간 음성 스트리밍
        </h3>
        <div className="flex items-center space-x-2">
          {isStreaming && (
            <div className="flex items-center space-x-1 text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm">스트리밍 중</span>
            </div>
          )}
          {isPlaying && !isStreaming && (
            <div className="flex items-center space-x-1 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">재생 중</span>
            </div>
          )}
        </div>
      </div>

      {/* 텍스트 입력 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          변환할 텍스트
        </label>
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="실시간 음성 스트리밍할 텍스트를 입력하세요..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            disabled={disabled || isStreaming}
          />
          {inputText && (
            <button
              onClick={clearText}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {inputText.length}자 / 최대 1000자
        </div>
      </div>

      {/* 음성 설정 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            언어
          </label>
          <select
            value={voiceSettings.language}
            onChange={(e) => setVoiceSettings(prev => ({ ...prev, language: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled || isStreaming}
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="zh">中文</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            음성
          </label>
          <select
            value={voiceSettings.voice}
            onChange={(e) => setVoiceSettings(prev => ({ ...prev, voice: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled || isStreaming}
          >
            <option value="default">기본</option>
            <option value="female">여성</option>
            <option value="male">남성</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            속도: {voiceSettings.speed}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={voiceSettings.speed}
            onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
            className="w-full"
            disabled={disabled || isStreaming}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            음높이: {voiceSettings.pitch}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={voiceSettings.pitch}
            onChange={(e) => setVoiceSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
            className="w-full"
            disabled={disabled || isStreaming}
          />
        </div>
      </div>

      {/* 스트리밍 진행률 */}
      {isStreaming && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>스트리밍 진행률</span>
            <span>{Math.round(streamProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${streamProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 오디오 청크 정보 */}
      {audioChunks.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-blue-700">스트리밍 상태</span>
          </div>
          <div className="text-sm text-blue-800">
            <p>수신된 오디오 청크: {audioChunks.length}개</p>
            <p>재생 대기 중: {audioQueueRef.current.length}개</p>
          </div>
        </div>
      )}

      {/* 컨트롤 버튼 */}
      <div className="flex items-center justify-center space-x-4">
        {!isStreaming ? (
          <button
            onClick={startStreaming}
            disabled={disabled || !inputText.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>스트리밍 시작</span>
          </button>
        ) : (
          <button
            onClick={stopStreaming}
            className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>스트리밍 중지</span>
          </button>
        )}
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* 사용 안내 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 실시간으로 음성이 스트리밍되어 즉시 재생됩니다</p>
        <p>• 긴 텍스트도 빠르게 음성으로 변환됩니다</p>
        <p>• 스트리밍 중에는 다른 작업을 할 수 있습니다</p>
      </div>
    </div>
  );
}
