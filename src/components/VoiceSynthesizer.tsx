"use client";

import { useState, useRef } from 'react';
import { VoiceService } from '../services/voiceService';
import { TTSResponse, VoiceSettings } from '../types/voice';

interface VoiceSynthesizerProps {
  text?: string;
  onTextChange?: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceSynthesizer({ text = '', onTextChange, disabled = false }: VoiceSynthesizerProps) {
  const [inputText, setInputText] = useState(text);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 음성 설정
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    language: 'ko',
    voice: 'default',
    speed: 1.0,
    pitch: 1.0,
    volume: 0.9,
    rate: 150
  });

  const handleTextChange = (newText: string) => {
    setInputText(newText);
    onTextChange?.(newText);
  };

  const generateSpeech = async () => {
    if (!inputText.trim()) {
      setError('텍스트를 입력해주세요');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      const response: TTSResponse = await VoiceService.textToSpeech(inputText, voiceSettings);
      
      if (response.success) {
        if (response.audio_url) {
          // 음성 파일 다운로드
          const audioBlob = await VoiceService.downloadTTSAudio(response.audio_url);
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          // 자동 재생
          playAudio(url);
        } else if (response.audio_data) {
          // base64 오디오 데이터를 URL로 변환
          const audioBlob = new Blob([
            Uint8Array.from(atob(response.audio_data), c => c.charCodeAt(0))
          ], { type: 'audio/wav' });
          
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          // 자동 재생
          playAudio(url);
        } else {
          setError('음성 데이터를 받을 수 없습니다');
        }
      } else {
        setError(response.message || '음성 생성에 실패했습니다');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '음성 생성 중 오류가 발생했습니다';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(url);
    audioRef.current = audio;
    
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      setError('오디오 재생에 실패했습니다');
    };
    
    audio.play().catch(err => {
      setIsPlaying(false);
      setError('오디오 재생 권한이 필요합니다');
    });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const clearText = () => {
    setInputText('');
    onTextChange?.('');
    setError('');
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl('');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          🔊 음성 합성
        </h3>
        <div className="flex items-center space-x-2">
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
            placeholder="음성으로 변환할 텍스트를 입력하세요..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            disabled={disabled || isGenerating}
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
            disabled={disabled || isGenerating}
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="zh">中文</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
            <option value="ru">Русский</option>
            <option value="ar">العربية</option>
            <option value="hi">हिन्दी</option>
            <option value="th">ไทย</option>
            <option value="vi">Tiếng Việt</option>
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
            disabled={disabled || isGenerating}
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
            disabled={disabled || isGenerating}
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
            disabled={disabled || isGenerating}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            볼륨: {Math.round((voiceSettings.volume || 0.9) * 100)}%
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.1"
            value={voiceSettings.volume || 0.9}
            onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
            className="w-full"
            disabled={disabled || isGenerating}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            말하기 속도: {voiceSettings.rate || 150}
          </label>
          <input
            type="range"
            min="50"
            max="300"
            step="10"
            value={voiceSettings.rate || 150}
            onChange={(e) => setVoiceSettings(prev => ({ ...prev, rate: parseInt(e.target.value) }))}
            className="w-full"
            disabled={disabled || isGenerating}
          />
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={generateSpeech}
          disabled={disabled || isGenerating || !inputText.trim()}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>생성 중...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>음성 생성</span>
            </>
          )}
        </button>

        {audioUrl && (
          <button
            onClick={isPlaying ? stopAudio : () => playAudio(audioUrl)}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
          >
            {isPlaying ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>정지</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>재생</span>
              </>
            )}
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
        <p>• 텍스트를 입력하고 음성 생성 버튼을 클릭하세요</p>
        <p>• 다양한 언어와 음성 설정을 지원합니다</p>
        <p>• 생성된 음성은 자동으로 재생됩니다</p>
      </div>
    </div>
  );
}
