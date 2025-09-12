"use client";

import { useState, useEffect, useRef } from 'react';

interface MicrophoneSettingsProps {
  onClose: () => void;
}

export default function MicrophoneSettings({ onClose }: MicrophoneSettingsProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');
  const [testText, setTestText] = useState('안녕하세요, 마이크 테스트입니다.');
  const [microphoneGain, setMicrophoneGain] = useState(0.5); // 마이크 게인 설정
  
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // 마이크 지원 여부 확인
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

  // 마이크 장치 목록 가져오기
  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = deviceList.filter(device => device.kind === 'audioinput');
        setDevices(audioInputs);
        
        if (audioInputs.length > 0) {
          setSelectedDevice(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error('마이크 장치 목록 가져오기 실패:', err);
        setError('마이크 장치를 찾을 수 없습니다.');
      }
    };

    if (isSupported) {
      getDevices();
    }
  }, [isSupported]);

  // 볼륨 모니터링
  const startVolumeMonitoring = async (stream: MediaStream) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // AudioContext가 일시정지 상태라면 재개
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateVolume = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // 주파수 데이터에서 평균 계산
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          
          // 볼륨을 0-100 범위로 정규화
          const normalizedVolume = Math.min(100, (average / 255) * 100);
          setVolume(normalizedVolume);
          
          console.log('Volume level:', normalizedVolume.toFixed(1) + '%');
        }
        
        animationRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (error) {
      console.error('볼륨 모니터링 시작 실패:', error);
    }
  };

  // 마이크 테스트 시작
  const startTest = async () => {
    try {
      setError('');
      
      const constraints = {
        audio: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // 낮은 샘플레이트로 감도 조정
          channelCount: 1,   // 모노 채널
          volume: microphoneGain        // 사용자 설정 게인 사용
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsListening(true);
      
      await startVolumeMonitoring(stream);
      
    } catch (err) {
      console.error('마이크 테스트 시작 실패:', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('마이크 접근 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
        } else if (err.name === 'NotFoundError') {
          setError('마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.');
        } else {
          setError(`마이크 접근 오류: ${err.message}`);
        }
      } else {
        setError('마이크 접근 중 알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  // 마이크 테스트 중지
  const stopTest = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsListening(false);
    setVolume(0);
    
    console.log('마이크 테스트 중지됨');
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopTest();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // 음성 테스트 (Web Speech API)
  const testSpeech = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(testText);
      utterance.lang = 'ko-KR';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      speechSynthesis.speak(utterance);
    } else {
      setError('이 브라우저는 음성 합성을 지원하지 않습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border border-gray-200 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            마이크 설정 및 테스트
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
          {/* 마이크 장치 선택 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-800">마이크 장치 선택</h3>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isListening}
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `마이크 ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-600">
              사용할 마이크 장치를 선택하세요. {devices.length}개의 오디오 입력 장치가 감지되었습니다.
            </p>
          </div>

          {/* 마이크 게인 설정 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-800">마이크 감도 조정</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">마이크 게인</span>
                <span className="text-sm text-gray-600">{Math.round(microphoneGain * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={microphoneGain}
                onChange={(e) => setMicrophoneGain(parseFloat(e.target.value))}
                className="w-full"
                disabled={isListening}
              />
              <div className="text-xs text-gray-500">
                {microphoneGain <= 0.3 ? '낮은 감도 (조용한 환경에 적합)' :
                 microphoneGain <= 0.6 ? '보통 감도 (일반적인 환경에 적합)' :
                 '높은 감도 (시끄러운 환경에 적합)'}
              </div>
            </div>
          </div>

          {/* 마이크 테스트 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-800">마이크 테스트</h3>
            
            {/* 볼륨 표시기 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">음성 레벨</span>
                <span className="text-sm text-gray-600">{volume.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-100 ${
                    volume > 15 ? 'bg-green-500' : volume > 5 ? 'bg-yellow-500' : volume > 0 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(volume, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                {volume > 15 ? '음성이 잘 감지되고 있습니다' : 
                 volume > 5 ? '음성이 약하게 감지되고 있습니다' : 
                 volume > 0 ? '음성이 매우 약하게 감지되고 있습니다' : 
                 '음성이 감지되지 않습니다'}
              </div>
            </div>

            {/* 테스트 버튼 */}
            <div className="flex space-x-3">
              {!isListening ? (
                <button
                  onClick={startTest}
                  disabled={!isSupported || devices.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  <span>마이크 테스트 시작</span>
                </button>
              ) : (
                <button
                  onClick={stopTest}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>테스트 중지</span>
                </button>
              )}
            </div>

            {isListening && (
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm">마이크가 활성화되었습니다. 말씀해보세요.</span>
              </div>
            )}
          </div>

          {/* 음성 테스트 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-800">음성 테스트</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                테스트할 텍스트
              </label>
              <input
                type="text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="음성으로 재생할 텍스트를 입력하세요"
              />
            </div>

            <button
              onClick={testSpeech}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>음성 재생 테스트</span>
            </button>
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
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">사용 안내</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• 마이크 게인을 조정하여 음성 인식 감도를 조절할 수 있습니다</p>
              <p>• 음성 레벨이 15% 이상이면 정상적으로 인식됩니다</p>
              <p>• 낮은 감도(30% 이하)는 조용한 환경에 적합합니다</p>
              <p>• 마이크 테스트를 통해 최적 설정을 찾아보세요</p>
              <p>• HTTPS 환경에서만 마이크 접근이 가능합니다</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
