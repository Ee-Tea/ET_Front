"use client";

import { useState } from 'react';
import VoiceInputButton from './VoiceInputButton';
import VoiceSynthesizer from './VoiceSynthesizer';
import VoiceStreaming from './VoiceStreaming';
import MicrophoneSettings from './MicrophoneSettings';

interface VoicePanelProps {
  onClose: () => void;
  onTranscript?: (text: string) => void;
  disabled?: boolean;
  isBackendConnected?: boolean;
  isVoiceServiceConnected?: boolean;
}

export function VoicePanel({ onClose, onTranscript, disabled = false, isBackendConnected = false, isVoiceServiceConnected = false }: VoicePanelProps) {
  const [activeTab, setActiveTab] = useState<'stt' | 'tts' | 'streaming'>('stt');
  const [transcriptText, setTranscriptText] = useState('');
  const [showMicrophoneSettings, setShowMicrophoneSettings] = useState(false);

  const handleTranscript = (text: string) => {
    setTranscriptText(text);
    onTranscript?.(text);
  };

  const tabs = [
    { id: 'stt', label: '음성 인식', icon: '🎤' },
    { id: 'tts', label: '음성 합성', icon: '🔊' },
    { id: 'streaming', label: 'RealTans TTS', icon: '🌊' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-4xl w-full mx-4 max-h-[90vh]">
      {/* 탭 헤더 */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="text-lg font-semibold text-gray-900">음성 기능</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMicrophoneSettings(true)}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="마이크 설정 및 테스트"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span>마이크 설정</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              disabled={disabled}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 탭 내용 */}
      <div className="p-4">
        {activeTab === 'stt' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">음성 인식 (Web Speech API)</h3>
              <VoiceInputButton
                onTranscript={handleTranscript}
                disabled={disabled}
                onOpenSettings={() => setShowMicrophoneSettings(true)}
              />
              <p className="mt-4 text-sm text-gray-600">
                브라우저의 내장 음성 인식 기능을 사용합니다. API 키가 필요하지 않습니다.
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'tts' && (
          <VoiceSynthesizer
            text={transcriptText}
            onTextChange={setTranscriptText}
            disabled={disabled || !isVoiceServiceConnected}
          />
        )}
        
        {activeTab === 'streaming' && (
          <VoiceStreaming
            text={transcriptText}
            onTextChange={setTranscriptText}
            disabled={disabled || !isVoiceServiceConnected}
          />
        )}
      </div>
    </div>

    {/* 마이크 설정 모달 */}
    {showMicrophoneSettings && (
      <MicrophoneSettings
        onClose={() => setShowMicrophoneSettings(false)}
      />
    )}
  </div>
  );
}
