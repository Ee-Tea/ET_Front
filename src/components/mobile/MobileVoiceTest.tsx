'use client';

import React, { useState } from 'react';
import { FrontendVoiceService } from '@/services/frontendVoiceService';

interface MobileVoiceTestProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileVoiceTest({ isOpen, onClose }: MobileVoiceTestProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVoiceTest = async () => {
    try {
      setIsTesting(true);
      setTestResult('');
      setError(null);
      setIsListening(true);
      
      console.log('🎤 모바일 음성 인식 테스트 시작');
      
      const response = await FrontendVoiceService.speechToTextWebSpeech('ko-KR');
      
      if (response.success && response.text) {
        setTestResult(`인식 결과: "${response.text}"`);
        console.log('🎤 음성 인식 성공:', response.text);
      } else {
        setTestResult('음성 인식에 실패했습니다.');
        setError('음성을 인식할 수 없습니다.');
      }
    } catch (error) {
      console.error('음성 인식 테스트 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setError(errorMessage);
      setTestResult(`오류: ${errorMessage}`);
    } finally {
      setIsTesting(false);
      setIsListening(false);
    }
  };

  const handleClose = () => {
    setTestResult('');
    setError(null);
    setIsListening(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-h-[70vh] overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎤</span>
              음성 테스트
            </h2>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">마이크 버튼을 눌러 음성 인식을 테스트해보세요</p>
        </div>

        {/* 내용 */}
        <div className="px-6 py-8 space-y-6">
          {/* 음성 테스트 버튼 */}
          <div className="flex justify-center">
            <button
              onClick={handleVoiceTest}
              disabled={isTesting}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 mobile-button ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : isTesting 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isTesting ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              ) : (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
                  />
                </svg>
              )}
            </button>
          </div>

          {/* 상태 표시 */}
          <div className="text-center">
            {isListening && (
              <div className="text-blue-600 font-medium animate-pulse">
                🎤 음성을 듣고 있습니다...
              </div>
            )}
            {isTesting && !isListening && (
              <div className="text-blue-600 font-medium">
                🔄 음성을 처리하고 있습니다...
              </div>
            )}
          </div>

          {/* 테스트 결과 */}
          {testResult && (
            <div className={`p-4 rounded-xl ${
              error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
            }`}>
              <div className="text-sm font-medium mb-2">
                {error ? '❌ 테스트 결과' : '✅ 테스트 결과'}
              </div>
              <div className={`text-sm ${error ? 'text-red-700' : 'text-green-700'}`}>
                {testResult}
              </div>
            </div>
          )}

          {/* 모바일 권한 안내 */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
            <div className="text-sm font-medium text-blue-800 mb-2">📱 모바일 사용 안내</div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• <strong>마이크 권한 팝업이 뜨면 "허용"을 선택하세요</strong></li>
              <li>• 권한이 거부된 경우 브라우저 설정에서 수동으로 허용하세요</li>
              <li>• Chrome: 설정 → 사이트 설정 → 마이크</li>
              <li>• Safari: 설정 → 개인정보 보호 → 마이크</li>
            </ul>
          </div>

          {/* 사용법 안내 */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="text-sm font-medium text-gray-700 mb-2">💡 사용법</div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 마이크 버튼을 누르고 말하세요</li>
              <li>• 명확하고 천천히 말해주세요</li>
              <li>• 조용한 환경에서 테스트해주세요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}