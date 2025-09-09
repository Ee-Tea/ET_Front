"use client";

import { useState, useRef, useEffect } from 'react';
import { VoiceService } from '../services/voiceService';
import { RealtimeTTSResponse, VoiceSettings } from '../types/voice';

interface RealtimeTTSProps {
  text?: string;
  onTextChange?: (text: string) => void;
  disabled?: boolean;
}

export default function RealtimeTTS({ text = '', onTextChange, disabled = false }: RealtimeTTSProps) {
  const [inputText, setInputText] = useState(text);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [audioChunks, setAudioChunks] = useState<string[]>([]);
  const [currentText, setCurrentText] = useState<string>('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
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
      disconnect();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleTextChange = (newText: string) => {
    setInputText(newText);
    onTextChange?.(newText);
  };

  const connect = async () => {
    if (!inputText.trim()) {
      setError('텍스트를 입력해주세요');
      return;
    }

    setConnectionStatus('connecting');
    setError('');
    setAudioChunks([]);
    setCurrentText('');
    
    try {
      // AudioContext 초기화
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // WebSocket 연결
      const ws = VoiceService.createRealtimeTTSConnection(inputText, voiceSettings);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket 연결됨');
        setIsConnected(true);
        setConnectionStatus('connected');
      };

      ws.onmessage = async (event) => {
        try {
          const data: RealtimeTTSResponse = JSON.parse(event.data);
          
          switch (data.type) {
            case 'audio':
              // 오디오 청크 처리
              setAudioChunks(prev => [...prev, data.data]);
              await processAudioChunk(data.data);
              break;
              
            case 'text':
              // 현재 처리 중인 텍스트 업데이트
              setCurrentText(data.data);
              break;
              
            case 'status':
              console.log('상태 업데이트:', data.data);
              break;
              
            case 'error':
              setError(data.data);
              setConnectionStatus('error');
              break;
          }
        } catch (err) {
          console.error('메시지 파싱 오류:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket 연결 종료');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        isPlayingRef.current = false;
        setIsPlaying(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket 오류:', error);
        setError('WebSocket 연결 오류가 발생했습니다');
        setConnectionStatus('error');
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '연결 중 오류가 발생했습니다';
      setError(errorMessage);
      setConnectionStatus('error');
    }
  };

  const processAudioChunk = async (base64Audio: string) => {
    try {
      // base64를 ArrayBuffer로 변환
      const audioData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      const audioBuffer = await audioContextRef.current!.decodeAudioData(audioData.buffer);
      
      // 오디오 큐에 추가
      audioQueueRef.current.push(audioBuffer);
      
      // 자동 재생 시작
      if (!isPlayingRef.current) {
        startPlayback();
      }
    } catch (err) {
      console.warn('오디오 청크 처리 실패:', err);
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
        
        audioSourceRef.current = source;
        
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
      audioSourceRef.current = null;
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
    isPlayingRef.current = false;
    setIsPlaying(false);
    
    // 현재 재생 중인 오디오 정지
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
  };

  const stopPlayback = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    
    audioQueueRef.current = [];
  };

  const clearText = () => {
    setInputText('');
    onTextChange?.('');
    setError('');
    setAudioChunks([]);
    setCurrentText('');
    audioQueueRef.current = [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'connecting':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'connecting':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          ⚡ 리얼타임 TTS
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(connectionStatus)}`}>
            {getStatusIcon(connectionStatus)}
            <span className="capitalize">
              {connectionStatus === 'connecting' ? '연결 중...' : 
               connectionStatus === 'connected' ? '연결됨' :
               connectionStatus === 'error' ? '오류' : '연결 안됨'}
            </span>
          </div>
          {isPlaying && (
            <div className="flex items-center space-x-1 text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
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
            placeholder="리얼타임 음성 변환할 텍스트를 입력하세요..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            disabled={disabled || isConnected}
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
            disabled={disabled || isConnected}
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
            disabled={disabled || isConnected}
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
            disabled={disabled || isConnected}
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
            disabled={disabled || isConnected}
          />
        </div>
      </div>

      {/* 현재 처리 중인 텍스트 */}
      {currentText && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-blue-700">현재 처리 중</span>
          </div>
          <p className="text-sm text-blue-800">{currentText}</p>
        </div>
      )}

      {/* 오디오 청크 정보 */}
      {audioChunks.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-700">스트리밍 상태</span>
          </div>
          <div className="text-sm text-green-800">
            <p>수신된 오디오 청크: {audioChunks.length}개</p>
            <p>재생 대기 중: {audioQueueRef.current.length}개</p>
          </div>
        </div>
      )}

      {/* 컨트롤 버튼 */}
      <div className="flex items-center justify-center space-x-4">
        {!isConnected ? (
          <button
            onClick={connect}
            disabled={disabled || !inputText.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>리얼타임 시작</span>
          </button>
        ) : (
          <div className="flex items-center space-x-4">
            <button
              onClick={disconnect}
              className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>연결 종료</span>
            </button>
            
            {isPlaying && (
              <button
                onClick={stopPlayback}
                className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>재생 정지</span>
              </button>
            )}
          </div>
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
        <p>• WebSocket을 통한 실시간 음성 스트리밍</p>
        <p>• 텍스트가 음성으로 변환되는 과정을 실시간으로 확인</p>
        <p>• 매우 낮은 지연시간으로 즉시 재생</p>
        <p>• 연결 중에는 설정을 변경할 수 없습니다</p>
      </div>
    </div>
  );
}
