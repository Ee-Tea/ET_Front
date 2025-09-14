'use client';

import React from 'react';

interface ProblemResult {
  id: number;
  question: string;
  options?: string[];
  selectedAnswer?: number;
  correctAnswer?: string;
  explanation?: string;
  isCorrect?: boolean;
}

interface ResultPopupProps {
  isOpen: boolean;
  onClose: () => void;
  results: ProblemResult[];
  totalCorrect: number;
  totalProblems: number;
}

const ResultPopup: React.FC<ResultPopupProps> = ({
  isOpen,
  onClose,
  results,
  totalCorrect,
  totalProblems
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">채점 결과</h2>
              <p className="text-sm text-gray-500 mt-1">
                정답: {totalCorrect}/{totalProblems}개
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 결과 목록 */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                {/* 문제 번호와 정답 여부 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    문제 {result.id}
                  </span>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.isCorrect 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.isCorrect ? '정답' : '오답'}
                  </div>
                </div>

                {/* 문제 내용 */}
                <div className="text-sm text-gray-800 mb-3">
                  {result.question}
                </div>

                {/* 선택한 답안 */}
                {result.options && result.selectedAnswer !== undefined && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-600 mb-2">선택한 답안:</div>
                    <div className={`p-2 rounded-lg text-sm ${
                      result.isCorrect 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {result.options[result.selectedAnswer]}
                    </div>
                  </div>
                )}

                {/* 정답 */}
                {result.correctAnswer && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-600 mb-2">정답:</div>
                    <div className="p-2 rounded-lg text-sm bg-blue-50 text-blue-800 border border-blue-200">
                      {result.correctAnswer}
                    </div>
                  </div>
                )}

                {/* 해설 */}
                {result.explanation && (
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">해설:</div>
                    <div className="p-2 rounded-lg text-sm bg-gray-50 text-gray-700 border border-gray-200">
                      {result.explanation}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPopup;
