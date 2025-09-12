"use client";

import { useState } from 'react';
import VoiceInputButton from './VoiceInputButton';

interface VoicePanelProps {
  onClose: () => void;
  onTranscript?: (text: string) => void;
  disabled?: boolean;
  isBackendConnected?: boolean;
}

export function VoicePanel({ onClose, onTranscript, disabled = false, isBackendConnected = false }: VoicePanelProps) {
  const handleTranscript = (text: string) => {
    onTranscript?.(text);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-4xl w-full mx-4 max-h-[90vh]">
      {/* 헤더 */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">🎤</span>
            음성 인식
          </h2>
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

      {/* 내용 */}
      <div className="p-4">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">음성 인식 (Web Speech API)</h3>
            <VoiceInputButton
              onTranscript={handleTranscript}
              disabled={disabled}
            />
            <p className="mt-4 text-sm text-gray-600">
              브라우저의 내장 음성 인식 기능을 사용합니다. API 키가 필요하지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </div>

  </div>
  );
}
