'use client';

import React from 'react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subject: string;
  created_at: number;
}

interface ProblemContainerProps {
  questions: Question[];
  selectedAnswers: {[key: string]: string};
  onAnswerSelect: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting: boolean;
  submittedAnswers: {[key: number]: number};
  showResults: boolean;
  score: number;
  totalQuestions: number;
  themeColor: string;
  gradingResults?: {[key: string]: any};
}

export function ProblemContainer({
  questions,
  selectedAnswers,
  onAnswerSelect,
  onSubmit,
  onClose,
  isSubmitting,
  submittedAnswers,
  showResults,
  score,
  totalQuestions,
  themeColor,
  gradingResults = {}
}: ProblemContainerProps) {
  const isAllAnswered = questions.every(q => selectedAnswers[`question-${q.id}`] !== undefined);

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">생성된 문제</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors p-1"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* 문제 목록 */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {questions.map((question, questionIndex) => {
          const questionId = `question-${question.id}`;
          const gradingResult = gradingResults[questionId];
          
          return (
            <div key={question.id} className="space-y-3">
              <h4 className="font-medium text-gray-900">
                {questionIndex + 1}. {question.question}
              </h4>
              
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => {
                  const isSelected = selectedAnswers[questionId] === option;
                  const isCorrect = gradingResult?.isCorrect && isSelected;
                  const isWrong = gradingResult && !gradingResult.isCorrect && isSelected;
                
                return (
                  <label
                    key={optionIndex}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      isCorrect
                        ? 'border-green-500 bg-green-50'
                        : isWrong
                        ? 'border-red-500 bg-red-50'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={questionId}
                      checked={isSelected}
                      onChange={() => onAnswerSelect(questionId, option)}
                      className="sr-only"
                      disabled={showResults}
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      isCorrect
                        ? 'border-green-500 bg-green-500'
                        : isWrong
                        ? 'border-red-500 bg-red-500'
                        : isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="flex-1 text-sm">{option}</span>
                    {showResults && isCorrect && (
                      <span className="text-green-600 text-sm font-medium">✓</span>
                    )}
                    {showResults && isWrong && (
                      <span className="text-red-600 text-sm font-medium">✗</span>
                    )}
                  </label>
                );
              })}
            </div>

              {/* 채점 결과 및 해설 */}
              {gradingResult && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`text-sm font-medium ${
                      gradingResult.isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {gradingResult.isCorrect ? '✅ 정답' : '❌ 오답'}
                    </span>
                    <span className="text-sm text-gray-600">
                      정답: {question.correctAnswer}
                    </span>
                  </div>
                  {question.explanation && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">해설:</span> {question.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 버튼들 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
        {showResults ? (
          <div className="text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: themeColor }}>
              {score}/{totalQuestions}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              정답률: {Math.round((score / totalQuestions) * 100)}%
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={onSubmit}
              disabled={!isAllAnswered || isSubmitting}
              className="w-full px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: isAllAnswered ? themeColor : '#9CA3AF',
                cursor: isAllAnswered ? 'pointer' : 'not-allowed'
              }}
            >
              {isSubmitting ? '제출 중...' : '답안 제출'}
            </button>
            
            <div className="text-xs text-gray-500 text-center">
              {questions.filter((_, index) => selectedAnswers[index] !== undefined).length} / {questions.length} 문제 완료
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
