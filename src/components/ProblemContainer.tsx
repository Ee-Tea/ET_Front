'use client';

import React from 'react';

interface ProblemContainerProps {
  questions?: any[];
  selectedAnswers?: {[key: string]: string};
  onAnswerSelect?: (questionId: string, answer: string) => void;
  onSubmit?: () => void;
  onClose?: () => void;
  isSubmitting?: boolean;
  submittedAnswers?: {[key: number]: number};
  showResults?: boolean;
  score?: number;
  totalQuestions?: number;
  themeColor?: string;
  gradingResults?: {[key: string]: any};
}

export default function ProblemContainer({
  questions = [],
  selectedAnswers = {},
  onAnswerSelect,
  onSubmit,
  onClose,
  isSubmitting = false,
  submittedAnswers = {},
  showResults = false,
  score = 0,
  totalQuestions = 0,
  themeColor = '#10B981',
  gradingResults = {}
}: ProblemContainerProps) {
  return (
    <div className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">문제</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 내용 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {questions.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm">문제가 없습니다</p>
            <p className="text-xs mt-1">새로운 문제를 생성해보세요</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {question.id || index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-800 mb-3">
                      {question.question}
                    </h3>
                    <div className="space-y-2">
                      {question.options?.map((option: string, optionIndex: number) => (
                        <label
                          key={optionIndex}
                          className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                            selectedAnswers[`question-${question.id}`] === option
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={selectedAnswers[`question-${question.id}`] === option}
                            onChange={(e) => onAnswerSelect?.(`question-${question.id}`, e.target.value)}
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 푸터 - 제출 버튼 */}
      {questions.length > 0 && onSubmit && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>제출 중...</span>
              </>
            ) : (
              <span>답안 제출</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}