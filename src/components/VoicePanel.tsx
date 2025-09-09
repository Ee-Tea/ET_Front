"use client";

import { useState } from 'react';
import VoiceRecorder from './VoiceRecorder';
import VoiceSynthesizer from './VoiceSynthesizer';
import VoiceStreaming from './VoiceStreaming';
import RealtimeTTS from './RealtimeTTS';
import VoiceInfo from './VoiceInfo';

interface VoicePanelProps {
  onClose: () => void;
  onTranscript?: (text: string) => void;
  disabled?: boolean;
  isBackendConnected?: boolean;
  isVoiceServiceConnected?: boolean;
}

export function VoicePanel({ onClose, onTranscript, disabled = false, isBackendConnected = false, isVoiceServiceConnected = false }: VoicePanelProps) {
  const [activeTab, setActiveTab] = useState<'stt' | 'tts' | 'streaming' | 'realtime' | 'info'>('stt');
  const [transcriptText, setTranscriptText] = useState('');

  const handleTranscript = (text: string) => {
    setTranscriptText(text);
    onTranscript?.(text);
  };

  const tabs = [
    { id: 'stt', label: '음성 인식', icon: '🎤' },
    { id: 'tts', label: '음성 합성', icon: '🔊' },
    { id: 'streaming', label: '스트리밍', icon: '🌊' },
    { id: 'realtime', label: '리얼타임 TTS', icon: '⚡' },
    { id: 'info', label: '서비스 정보', icon: 'ℹ️' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-4xl w-full mx-4 max-h-[90vh]">
      {/* 탭 헤더 */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="text-lg font-semibold text-gray-900">음성 기능</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
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
          <VoiceRecorder
            onTranscript={handleTranscript}
            onError={(error) => console.error('STT Error:', error)}
            disabled={disabled}
          />
        )}
        
        {activeTab === 'tts' && (
          <VoiceSynthesizer
            text={transcriptText}
            onTextChange={setTranscriptText}
            disabled={disabled}
          />
        )}
        
        {activeTab === 'streaming' && (
          <VoiceStreaming
            text={transcriptText}
            onTextChange={setTranscriptText}
            disabled={disabled}
          />
        )}
        
        {activeTab === 'realtime' && (
          <RealtimeTTS
            text={transcriptText}
            onTextChange={setTranscriptText}
            disabled={disabled}
          />
        )}
        
        {activeTab === 'info' && (
          <VoiceInfo
            onStatusChange={(isHealthy) => {
              if (!isHealthy) {
                console.warn('Voice service is not healthy');
              }
            }}
          />
        )}
      </div>
      </div>
    </div>
  );
}
