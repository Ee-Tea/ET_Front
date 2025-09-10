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
        <h2 className="text-lg font-semibold text-gray-800 text-center flex-1">문제</h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          title="문제 닫기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
            {/* 채점 결과 표시 */}
            {showResults && Object.keys(gradingResults).length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      📊
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">채점 결과</h2>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {score}점
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    총 {totalQuestions}문제 중 {Object.values(gradingResults).filter((result: any) => result.isCorrect).length}문제 정답
                  </div>
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    score >= 80 
                      ? 'bg-green-100 text-green-800' 
                      : score >= 60 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {score >= 80 ? '🎉 훌륭합니다!' : score >= 60 ? '👍 잘했습니다!' : '💪 다시 도전해보세요!'}
                  </div>
                </div>
              </div>
            )}
            
            {questions.map((question, index) => {
              const questionId = `question-${question.id || index}`;
              const gradingResult = gradingResults[questionId];
              const isCorrect = gradingResult?.isCorrect;
              
              return (
                <div key={question.id || index} className={`border rounded-lg p-4 mb-4 ${
                  showResults ? (isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-bold ${
                      showResults ? (isCorrect ? 'bg-green-500' : 'bg-red-500') : 'bg-blue-500'
                    }`}>
                      {question.id || index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 leading-relaxed">
                        {question.question}
                      </h3>
                      
                      {/* 선택지들 */}
                      <div className="space-y-3 mb-4">
                        {question.options?.map((option: string, optionIndex: number) => {
                          const isSelected = selectedAnswers[questionId] === option;
                          const isCorrectOption = showResults && option.includes(question.correctAnswer);
                          
                          return (
                            <div
                              key={optionIndex}
                              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                                showResults 
                                  ? isCorrectOption 
                                    ? 'bg-green-100 border-green-300 text-green-800' 
                                    : isSelected && !isCorrectOption
                                    ? 'bg-red-100 border-red-300 text-red-800'
                                    : 'bg-gray-100 border-gray-300'
                                  : isSelected
                                  ? 'bg-blue-50 border-blue-300'
                                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                              } ${!showResults ? 'cursor-pointer' : 'cursor-default'}`}
                              onClick={() => {
                                if (!showResults && onAnswerSelect) {
                                  onAnswerSelect(questionId, option);
                                }
                              }}
                            >
                              <input
                                type="radio"
                                name={`question-${question.id || index}`}
                                value={option}
                                checked={isSelected}
                                onChange={(e) => {
                                  console.log('라디오 버튼 클릭:', questionId, e.target.value);
                                  onAnswerSelect?.(questionId, e.target.value);
                                }}
                                className="text-blue-600 cursor-pointer"
                                disabled={showResults}
                              />
                              <span className={`text-sm flex-1 cursor-pointer ${
                                showResults 
                                  ? isCorrectOption 
                                    ? 'text-green-800 font-medium' 
                                    : isSelected && !isCorrectOption
                                    ? 'text-red-800 font-medium'
                                    : 'text-gray-700'
                                  : isSelected
                                  ? 'text-blue-800 font-medium'
                                  : 'text-gray-800'
                              }`}>{option}</span>
                              {showResults && (
                                <div className="flex-shrink-0">
                                  {isCorrectOption && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-200 text-green-800">
                                      ✓ 정답
                                    </span>
                                  )}
                                  {isSelected && !isCorrectOption && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-200 text-red-800">
                                      ✗ 오답
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* 해설 표시 - 하나만 표시 */}
                      {showResults && (gradingResult?.explanation || question.explanation) && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              💡
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-blue-800 mb-2">해설</div>
                              <div className="text-sm text-blue-700 leading-relaxed">
                                {gradingResult?.explanation || question.explanation}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 푸터 - 제출 버튼 (채점 결과가 없을 때만 표시) */}
      {questions.length > 0 && onSubmit && !showResults && (
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