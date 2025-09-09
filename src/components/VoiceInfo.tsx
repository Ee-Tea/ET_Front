"use client";

import { useState, useEffect } from 'react';
import { VoiceService } from '../services/voiceService';
import { VoiceInfo, HealthResponse, LanguagesResponse, SpeakersResponse } from '../types/voice';

interface VoiceInfoProps {
  onStatusChange?: (isHealthy: boolean) => void;
}

export default function VoiceInfo({ onStatusChange }: VoiceInfoProps) {
  const [voiceInfo, setVoiceInfo] = useState<VoiceInfo | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [languagesInfo, setLanguagesInfo] = useState<LanguagesResponse | null>(null);
  const [speakersInfo, setSpeakersInfo] = useState<SpeakersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchVoiceInfo = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const [info, health, languages, speakers] = await Promise.all([
        VoiceService.getVoiceInfo(),
        VoiceService.checkHealth(),
        VoiceService.getSupportedLanguages(),
        VoiceService.getAvailableSpeakers()
      ]);
      
      setVoiceInfo(info);
      setHealthStatus(health);
      setLanguagesInfo(languages);
      setSpeakersInfo(speakers);
      setLastUpdated(new Date());
      
      // 상태 변경 알림
      onStatusChange?.(health.status === 'healthy');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '음성 서비스 정보를 가져올 수 없습니다';
      setError(errorMessage);
      onStatusChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 정보 로드
  useEffect(() => {
    fetchVoiceInfo();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'degraded':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'unhealthy':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('ko-KR');
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          ℹ️ 음성 서비스 정보
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchVoiceInfo}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                <span>새로고침 중...</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <span>새로고침</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 서비스 상태 */}
      {healthStatus && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-800">서비스 상태</h4>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthStatus.status)}`}>
              {getStatusIcon(healthStatus.status)}
              <span className="capitalize">{healthStatus.status}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">STT 서비스:</span>
              <span className={`font-medium ${healthStatus.stt_available ? 'text-green-600' : 'text-red-600'}`}>
                {healthStatus.stt_available ? '사용 가능' : '사용 불가'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">TTS 서비스:</span>
              <span className={`font-medium ${healthStatus.tts_available ? 'text-green-600' : 'text-red-600'}`}>
                {healthStatus.tts_available ? '사용 가능' : '사용 불가'}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            마지막 확인: {formatTimestamp(healthStatus.timestamp)}
          </div>
        </div>
      )}

      {/* 모델 정보 */}
      {voiceInfo && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-800">모델 정보</h4>
          
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">STT 모델:</span>
              <span className="font-medium text-gray-800">{voiceInfo.stt_model}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">TTS 모델:</span>
              <span className="font-medium text-gray-800">{voiceInfo.tts_model}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">최대 오디오 길이:</span>
              <span className="font-medium text-gray-800">{voiceInfo.max_audio_duration}초</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-gray-600">지원 언어:</div>
            <div className="flex flex-wrap gap-1">
              {voiceInfo.supported_languages.map((lang, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {lang}
                </span>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-gray-600">지원 형식:</div>
            <div className="flex flex-wrap gap-1">
              {voiceInfo.supported_formats.map((format, index) => (
                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {format}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 언어 정보 */}
      {languagesInfo && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-800">지원 언어 상세</h4>
          
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">STT 지원 언어 (40개):</div>
              <div className="flex flex-wrap gap-1">
                {languagesInfo.stt_languages.slice(0, 10).map((lang, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {lang.native_name} ({lang.code})
                  </span>
                ))}
                {languagesInfo.stt_languages.length > 10 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{languagesInfo.stt_languages.length - 10}개 더...
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">TTS 지원 언어 (14개):</div>
              <div className="flex flex-wrap gap-1">
                {languagesInfo.tts_languages.map((lang, index) => (
                  <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {lang.native_name} ({lang.code})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 화자 정보 */}
      {speakersInfo && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-800">사용 가능한 화자</h4>
          
          <div className="space-y-2">
            {speakersInfo.speakers.map((speaker, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                <div>
                  <div className="font-medium text-sm text-gray-800">{speaker.name}</div>
                  <div className="text-xs text-gray-600">
                    {speaker.language} • {speaker.gender || 'neutral'} • {speaker.description || '기본 화자'}
                  </div>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {speaker.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* 마지막 업데이트 시간 */}
      {lastUpdated && (
        <div className="text-xs text-gray-500 text-center">
          마지막 업데이트: {lastUpdated.toLocaleString('ko-KR')}
        </div>
      )}

      {/* 사용 안내 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 음성 서비스의 현재 상태와 모델 정보를 확인할 수 있습니다</p>
        <p>• STT는 OpenAI Whisper, TTS는 MeloTTS를 사용합니다</p>
        <p>• 서비스 상태가 불안정할 때는 잠시 후 다시 시도해주세요</p>
      </div>
    </div>
  );
}
