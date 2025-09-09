"use client";

import React, { useState } from 'react';
import { LoginModal } from './LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { FrontendVoiceService } from '../services/frontendVoiceService';

interface SettingsPanelProps {
  onClose: () => void;
  isBackendConnected: boolean;
  isOpen: boolean;
}

export function SettingsPanel({ onClose, isBackendConnected, isOpen }: SettingsPanelProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVoiceTest, setShowVoiceTest] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [voiceTestResult, setVoiceTestResult] = useState<string>('');
  const [isTestingTTS, setIsTestingTTS] = useState(false);
  const { user, logout } = useAuth();

  // 음성 인식 테스트
  const testVoiceRecognition = async () => {
    try {
      setIsTestingVoice(true);
      setVoiceTestResult('');
      
      const response = await FrontendVoiceService.speechToTextWebSpeech('ko-KR');
      
      if (response.success && response.text) {
        setVoiceTestResult(`인식 결과: "${response.text}"`);
      } else {
        setVoiceTestResult('음성 인식에 실패했습니다.');
      }
    } catch (error) {
      console.error('음성 인식 테스트 오류:', error);
      setVoiceTestResult(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsTestingVoice(false);
    }
  };

  // 음성 합성 테스트
  const testVoiceSynthesis = async () => {
    try {
      setIsTestingTTS(true);
      
      const testText = '안녕하세요! 음성 합성 테스트입니다.';
      const response = await FrontendVoiceService.textToSpeech(testText, 'ko-KR');
      
      if (response.success) {
        setVoiceTestResult('음성 합성 테스트가 완료되었습니다.');
      } else {
        setVoiceTestResult('음성 합성에 실패했습니다.');
      }
    } catch (error) {
      console.error('음성 합성 테스트 오류:', error);
      setVoiceTestResult(`TTS 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsTestingTTS(false);
    }
  };







  // 항상 렌더링 (isOpen prop 제거됨)

  if (!isOpen) return null;

  return (
    <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border border-gray-200 w-80 z-50">
      {/* 계정 정보 */}
      <div className="p-4 border-b border-gray-200">
        {user ? (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {user.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user.name?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <p className="text-xs text-gray-400">
                {user.provider === 'google' ? '구글' : 
                 user.provider === 'kakao' ? '카카오' : 
                 user.provider === 'naver' ? '네이버' : '알 수 없음'} 로그인
              </p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">F</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">FT Assistant</p>
              <p className="text-xs text-gray-500">로그인이 필요합니다</p>
            </div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        )}
      </div>

      {/* 서버 상태 */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
              <path d="M15 7h1a2 2 0 012 2v10a2 2 0 01-2 2h-1V7z" />
            </svg>
            <span className="text-sm text-gray-700">서버 상태</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-xs ${isBackendConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isBackendConnected ? '연결됨' : '연결 안됨'}
            </span>
          </div>
        </div>
      </div>

      {/* 메뉴 항목들 */}
      <div className="py-1">
        <button
          onClick={() => {
            alert('설정 기능이 곧 추가될 예정입니다.');
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <svg className="w-4 h-4 mr-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          설정
        </button>
        
        <button
          onClick={() => {
            alert('언어 설정 기능이 곧 추가될 예정입니다.');
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
        >
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
            </svg>
            언어
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={() => setShowVoiceTest(!showVoiceTest)}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
        >
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            음성 테스트
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${showVoiceTest ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={() => {
            alert('도움말 기능이 곧 추가될 예정입니다.');
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <svg className="w-4 h-4 mr-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          도움 받기
        </button>
      </div>

      {/* 음성 테스트 패널 */}
      {showVoiceTest && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900 mb-3">음성 기능 테스트</h3>
          
          {/* 음성 인식 테스트 */}
          <div className="mb-4">
            <button
              onClick={testVoiceRecognition}
              disabled={isTestingVoice}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {isTestingVoice ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>음성 인식 중...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  <span>음성 인식 테스트</span>
                </>
              )}
            </button>
          </div>

          {/* 음성 합성 테스트 */}
          <div className="mb-4">
            <button
              onClick={testVoiceSynthesis}
              disabled={isTestingTTS}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {isTestingTTS ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>음성 합성 중...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                  <span>음성 합성 테스트</span>
                </>
              )}
            </button>
          </div>

          {/* 테스트 결과 */}
          {voiceTestResult && (
            <div className="p-3 bg-white rounded-md border border-gray-200">
              <p className="text-xs text-gray-700">{voiceTestResult}</p>
            </div>
          )}
        </div>
      )}

      {/* 구분선 */}
      <div className="border-t border-gray-200"></div>

      {/* 로그인/로그아웃 버튼 */}
      <div className="p-3">
        {user ? (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            <span>로그아웃</span>
          </button>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>로그인</span>
          </button>
        )}
      </div>

      {/* 로그인 모달 */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
}
