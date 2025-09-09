"use client";

import { useState, useEffect } from 'react';
import { VoiceService } from '../services/voiceService';
import { HealthResponse } from '../types/voice';

interface SettingsPanelProps {
  onClose: () => void;
  isBackendConnected: boolean;
  isVoiceServiceConnected: boolean;
}

export function SettingsPanel({ onClose, isBackendConnected, isVoiceServiceConnected }: SettingsPanelProps) {
  const [backendHealth, setBackendHealth] = useState<HealthResponse | null>(null);
  const [voiceHealth, setVoiceHealth] = useState<HealthResponse | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [isCheckingVoice, setIsCheckingVoice] = useState(false);
  const [backendError, setBackendError] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string>('');

  // 백엔드 헬스 체크
  const checkBackendHealth = async () => {
    setIsCheckingBackend(true);
    setBackendError('');
    
    try {
      const response = await fetch("http://localhost:8000/health", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBackendHealth({
          status: 'healthy',
          stt_available: true,
          tts_available: true,
          timestamp: new Date().toISOString()
        });
      } else {
        setBackendHealth({
          status: 'unhealthy',
          stt_available: false,
          tts_available: false,
          timestamp: new Date().toISOString()
        });
        setBackendError(`백엔드 연결 실패: ${response.status}`);
      }
    } catch (error) {
      setBackendHealth({
        status: 'unhealthy',
        stt_available: false,
        tts_available: false,
        timestamp: new Date().toISOString()
      });
      setBackendError('백엔드 서버에 연결할 수 없습니다');
    } finally {
      setIsCheckingBackend(false);
    }
  };

  // 음성 서비스 헬스 체크
  const checkVoiceHealth = async () => {
    setIsCheckingVoice(true);
    setVoiceError('');
    
    try {
      const health = await VoiceService.checkHealth();
      setVoiceHealth(health);
    } catch (error) {
      setVoiceHealth({
        status: 'unhealthy',
        stt_available: false,
        tts_available: false,
        timestamp: new Date().toISOString()
      });
      setVoiceError(error instanceof Error ? error.message : '음성 서비스에 연결할 수 없습니다');
    } finally {
      setIsCheckingVoice(false);
    }
  };

  // 모든 서비스 체크
  const checkAllServices = async () => {
    await Promise.all([
      checkBackendHealth(),
      checkVoiceHealth()
    ]);
  };

  // 컴포넌트 마운트 시 체크
  useEffect(() => {
    checkAllServices();
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

  // 항상 렌더링 (isOpen prop 제거됨)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            시스템 설정
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="p-4 space-y-6">
          {/* 전체 새로고침 버튼 */}
          <div className="flex justify-center">
            <button
              onClick={checkAllServices}
              disabled={isCheckingBackend || isCheckingVoice}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isCheckingBackend || isCheckingVoice ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>확인 중...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  <span>모든 서비스 상태 확인</span>
                </>
              )}
            </button>
          </div>

          {/* 백엔드 서비스 상태 */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-800 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                백엔드 서비스
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={checkBackendHealth}
                  disabled={isCheckingBackend}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-50"
                >
                  {isCheckingBackend ? "확인 중..." : "새로고침"}
                </button>
                {backendHealth && (
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(backendHealth.status)}`}>
                    {getStatusIcon(backendHealth.status)}
                    <span className="capitalize">
                      {backendHealth.status === 'healthy' ? '정상' : 
                       backendHealth.status === 'degraded' ? '부분 장애' : '장애'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>서버 주소:</strong> http://localhost:8000</p>
              <p><strong>기능:</strong> 채팅, 문제 생성, PDF 생성</p>
              {backendHealth && (
                <p><strong>마지막 확인:</strong> {formatTimestamp(backendHealth.timestamp)}</p>
              )}
            </div>
            
            {backendError && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-sm text-red-700">{backendError}</p>
              </div>
            )}
          </div>

          {/* 음성 서비스 상태 */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-800 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                음성 서비스
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={checkVoiceHealth}
                  disabled={isCheckingVoice}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-50"
                >
                  {isCheckingVoice ? "확인 중..." : "새로고침"}
                </button>
                {voiceHealth && (
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(voiceHealth.status)}`}>
                    {getStatusIcon(voiceHealth.status)}
                    <span className="capitalize">
                      {voiceHealth.status === 'healthy' ? '정상' : 
                       voiceHealth.status === 'degraded' ? '부분 장애' : '장애'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>서버 주소:</strong> http://localhost:8001</p>
              <p><strong>기능:</strong> STT (Whisper), TTS (pyttsx3)</p>
              {voiceHealth && (
                <>
                  <p><strong>STT 상태:</strong> {voiceHealth.stt_available ? '사용 가능' : '사용 불가'}</p>
                  <p><strong>TTS 상태:</strong> {voiceHealth.tts_available ? '사용 가능' : '사용 불가'}</p>
                  <p><strong>마지막 확인:</strong> {formatTimestamp(voiceHealth.timestamp)}</p>
                </>
              )}
            </div>
            
            {voiceError && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-sm text-red-700">{voiceError}</p>
              </div>
            )}
          </div>

          {/* 서비스 정보 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">서비스 정보</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• 백엔드 서버는 채팅, 문제 생성, PDF 생성 기능을 제공합니다</p>
              <p>• 음성 서버는 STT(음성인식)와 TTS(음성합성) 기능을 제공합니다</p>
              <p>• 두 서버가 모두 정상 작동해야 모든 기능을 사용할 수 있습니다</p>
              <p>• 서버 연결에 문제가 있으면 잠시 후 다시 시도해주세요</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
