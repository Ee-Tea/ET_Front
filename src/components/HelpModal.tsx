'use client';

import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">🎯 FT Assistant 도움말</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* 주요 기능 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 주요 기능</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-semibold text-gray-800 mb-2">농업 관련 질문</h4>
                <p className="text-gray-600">
                  작물 재배, 병해충, 토양 관리 등 농업에 관한 모든 질문에 답변해드립니다.
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-gray-800 mb-2">정보처리기사 문제 생성</h4>
                <p className="text-gray-600">
                  정처기 시험 문제를 자동으로 생성하고 채점해드립니다.
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <h4 className="font-semibold text-gray-800 mb-2">음성 기능</h4>
                <p className="text-gray-600">
                  음성으로 질문하고 음성으로 답변을 들을 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 사용 예시 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 사용 예시</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="space-y-2 text-sm">
                <button
                  onClick={() => {
                    // 전역 이벤트로 메시지 전송
                    const event = new CustomEvent('exampleQuestionClick', {
                      detail: { question: "오이에 어떤 병해충이 있어?" }
                    });
                    window.dispatchEvent(event);
                    onClose();
                  }}
                  className="block w-full text-left hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                >
                  <strong>농업:</strong> "오이에 어떤 병해충이 있어?"
                </button>
                <button
                  onClick={() => {
                    // 전역 이벤트로 메시지 전송
                    const event = new CustomEvent('exampleQuestionClick', {
                      detail: { question: "소프트웨어 설계 3문제 만들어줘" }
                    });
                    window.dispatchEvent(event);
                    onClose();
                  }}
                  className="block w-full text-left hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                >
                  <strong>정처기:</strong> "소프트웨어 설계 3문제 만들어줘"
                </button>
              </div>
            </div>
          </div>

          {/* 음성 사용법 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎤 음성 사용법</h3>
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <ol className="space-y-2 text-gray-600">
                <li>1. 채팅창 옆의 마이크 버튼을 클릭</li>
                <li>2. 음성으로 질문하기</li>
                <li>3. 자동으로 텍스트로 변환되어 전송됩니다</li>
              </ol>
            </div>
          </div>

          {/* 문제 해결 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">❓ 문제 해결</h3>
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <h4 className="font-semibold text-gray-800 mb-2">음성이 작동하지 않을 때:</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• HTTPS 환경에서 사용해주세요</li>
                  <li>• 마이크 권한을 허용해주세요</li>
                  <li>• 설정 &gt; 음성 테스트에서 확인해보세요</li>
                </ul>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-semibold text-gray-800 mb-2">서버 연결이 안 될 때:</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• 백엔드 서버가 실행 중인지 확인해주세요</li>
                  <li>• 네트워크 연결을 확인해주세요</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 하단 메시지 */}
          <div className="text-center text-gray-500 pt-4 border-t">
            <p>더 궁금한 점이 있으시면 언제든 문의해주세요! 🚀</p>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
