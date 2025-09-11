"use client";

import React, { useState, useEffect } from 'react';
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
  const [microphoneDevices, setMicrophoneDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [microphone, setMicrophone] = useState<MediaStreamAudioSourceNode | null>(null);
  const { user, logout } = useAuth();

  // 마이크 장치 목록 가져오기
  const getMicrophoneDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const microphones = devices.filter(device => device.kind === 'audioinput');
      setMicrophoneDevices(microphones);
      if (microphones.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(microphones[0].deviceId);
      }
    } catch (error) {
      console.error('마이크 장치를 가져올 수 없습니다:', error);
    }
  };

  // 음성 레벨 모니터링 시작
  const startVoiceLevelMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : true
      });

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyserNode = audioCtx.createAnalyser();
      const microphoneNode = audioCtx.createMediaStreamSource(stream);
      
      analyserNode.fftSize = 256;
      microphoneNode.connect(analyserNode);
      
      setAudioContext(audioCtx);
      setAnalyser(analyserNode);
      setMicrophone(microphoneNode);
      setIsListening(true);

      // 음성 레벨 업데이트
      const updateVoiceLevel = () => {
        if (analyserNode && isListening) {
          const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
          analyserNode.getByteFrequencyData(dataArray);
          
          // 평균 레벨 계산
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVoiceLevel(average);
          
          requestAnimationFrame(updateVoiceLevel);
        }
      };
      
      updateVoiceLevel();
    } catch (error) {
      console.error('음성 레벨 모니터링을 시작할 수 없습니다:', error);
      setVoiceTestResult('마이크 접근 권한이 필요합니다.');
    }
  };

  // 음성 레벨 모니터링 중지
  const stopVoiceLevelMonitoring = () => {
    if (microphone) {
      microphone.disconnect();
    }
    if (audioContext) {
      audioContext.close();
    }
    setIsListening(false);
    setVoiceLevel(0);
    setAudioContext(null);
    setAnalyser(null);
    setMicrophone(null);
  };

  // 컴포넌트 마운트 시 마이크 장치 가져오기
  useEffect(() => {
    if (showVoiceTest) {
      getMicrophoneDevices();
    }
  }, [showVoiceTest]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopVoiceLevelMonitoring();
    };
  }, []);

  // 음성 인식 테스트
  const testVoiceRecognition = async () => {
    try {
      setIsTestingVoice(true);
      setVoiceTestResult('');
      
      // 음성 레벨 모니터링이 실행 중이 아니면 시작
      if (!isListening) {
        await startVoiceLevelMonitoring();
      }
      
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

  // TTS 테스트 (Web Speech API 사용)
  const testVoiceSynthesis = async () => {
    try {
      setIsTestingTTS(true);
      setVoiceTestResult('');
      
      // Web Speech API 지원 확인
      if (!('speechSynthesis' in window)) {
        throw new Error('이 브라우저는 Web Speech API를 지원하지 않습니다.');
      }

      const testText = '안녕하세요! TTS 테스트입니다.';
      
      // Web Speech API로 직접 TTS 실행
      const utterance = new SpeechSynthesisUtterance(testText);
      utterance.lang = 'ko-KR';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      // 한국어 음성 선택 (가능한 경우)
      const voices = speechSynthesis.getVoices();
      const koreanVoice = voices.find(voice => 
        voice.lang.startsWith('ko') || voice.name.includes('Korean')
      );
      if (koreanVoice) {
        utterance.voice = koreanVoice;
      }

      // TTS 완료/오류 처리
      utterance.onend = () => {
        setVoiceTestResult('TTS 테스트가 완료되었습니다.');
        setIsTestingTTS(false);
      };

      utterance.onerror = (event) => {
        console.error('TTS 오류:', event);
        setVoiceTestResult(`TTS 오류: ${event.error}`);
        setIsTestingTTS(false);
      };

      // TTS 시작
      speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('TTS 테스트 오류:', error);
      setVoiceTestResult(`TTS 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
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
            // 도움 받기 팝업 띄우기
            const helpWindow = window.open(
              '',
              'help',
              'width=600,height=400,scrollbars=yes,resizable=yes'
            );
            if (helpWindow) {
              helpWindow.document.write(`
                <html>
                  <head>
                    <title>FT 도움말</title>
                    <style>
                      body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                      h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                      h2 { color: #555; margin-top: 30px; }
                      .feature { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
                      .example { background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 3px; font-family: monospace; }
                    </style>
                  </head>
                  <body>
                    <h1>🎯 FT Assistant 도움말</h1>
                    
                    <h2>📚 주요 기능</h2>
                    <div class="feature">
                      <strong>농업 관련 질문</strong><br>
                      작물 재배, 병해충, 토양 관리 등 농업에 관한 모든 질문에 답변해드립니다.
                    </div>
                    
                    <div class="feature">
                      <strong>정보처리기사 문제 생성</strong><br>
                      정처기 시험 문제를 자동으로 생성하고 채점해드립니다.
                    </div>
                    
                    <div class="feature">
                      <strong>음성 기능</strong><br>
                      음성으로 질문하고 음성으로 답변을 들을 수 있습니다.
                    </div>
                    
                    <h2>💡 사용 예시</h2>
                    <div class="example">
                      농업: "오이에 어떤 병해충이 있어?"<br>
                      정처기: "소프트웨어 설계 3문제 만들어줘"
                    </div>
                    
                    <h2>🎤 음성 사용법</h2>
                    <div class="feature">
                      1. 채팅창 옆의 마이크 버튼을 클릭<br>
                      2. 음성으로 질문하기<br>
                      3. 자동으로 텍스트로 변환되어 전송됩니다
                    </div>
                    
                    <h2>❓ 문제 해결</h2>
                    <div class="feature">
                      <strong>음성이 작동하지 않을 때:</strong><br>
                      • HTTPS 환경에서 사용해주세요<br>
                      • 마이크 권한을 허용해주세요<br>
                      • 설정 > 음성 테스트에서 확인해보세요
                    </div>
                    
                    <div class="feature">
                      <strong>서버 연결이 안 될 때:</strong><br>
                      • 백엔드 서버가 실행 중인지 확인해주세요<br>
                      • 네트워크 연결을 확인해주세요
                    </div>
                    
                    <p style="margin-top: 30px; text-align: center; color: #666;">
                      더 궁금한 점이 있으시면 언제든 문의해주세요! 🚀
                    </p>
                  </body>
                </html>
              `);
              helpWindow.document.close();
            }
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
          
          {/* 마이크 장치 선택 */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">마이크 장치</label>
            <select
              value={selectedMicrophone}
              onChange={(e) => setSelectedMicrophone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {microphoneDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `마이크 ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          {/* 음성 레벨 모니터링 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">음성 레벨</label>
              <button
                onClick={isListening ? stopVoiceLevelMonitoring : startVoiceLevelMonitoring}
                className={`px-3 py-1 text-xs rounded-md ${
                  isListening 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isListening ? '음성 레벨 중지' : '음성 레벨 시작'}
              </button>
            </div>
            
            {/* 음성 레벨 바 */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(voiceLevel * 2, 100)}%` }}
              ></div>
            </div>
            
            {/* 레벨 수치 표시 */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>조용함</span>
              <span className="font-mono">{Math.round(voiceLevel)}</span>
              <span>시끄러움</span>
            </div>
          </div>

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
                  <span>음성 인식 테스트 중...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  <span>음성 인식 테스트 시작</span>
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
                  <span>TTS 처리 중...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                  <span>TTS 테스트</span>
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
