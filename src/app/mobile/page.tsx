'use client';

import React, { useState, useEffect } from 'react';
import { LoadingPage, MainPage } from '@/components/mobile';

export default function MobilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'loading' | 'main'>('loading');
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    // 2초 후 로딩 완료
    const timer = setTimeout(() => {
      setIsLoading(false);
      setCurrentPage('main');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleQuestionSubmit = (question: string) => {
    console.log('질문 제출:', question);
    // 여기에 질문 처리 로직 추가
  };

  const handleVoiceInput = () => {
    console.log('음성 입력 시작');
    // 여기에 음성 입력 로직 추가
  };

  return (
    <div className="min-h-screen bg-white">
      {currentPage === 'loading' && <LoadingPage isLoading={isLoading} />}
      {currentPage === 'main' && (
        <MainPage 
          onQuestionSubmit={handleQuestionSubmit}
          onVoiceInput={handleVoiceInput}
          isBackendConnected={isBackendConnected}
        />
      )}
    </div>
  );
}
