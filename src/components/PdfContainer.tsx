'use client';

import React from 'react';

interface PdfContainerProps {
  availablePdfs?: any[];
  onDownloadPdf?: (filename: string) => void;
  onViewPdf?: (filename: string) => void;
  onClose?: () => void;
  isBackendConnected?: boolean;
}

export default function PdfContainer({
  availablePdfs = [],
  onDownloadPdf,
  onViewPdf,
  onClose,
  isBackendConnected = false
}: PdfContainerProps) {
  
  // PDF 카테고리별로 분류 (백엔드에서 생성된 PDF만)
  const categorizedPdfs = {
    problemSolving: availablePdfs.filter(pdf => 
      pdf.filename?.includes('답안집')
    ),
    wrongAnswerAnalysis: availablePdfs.filter(pdf => 
      pdf.filename?.includes('분석리포트')
    ),
    problemGeneration: availablePdfs.filter(pdf => 
      pdf.filename?.includes('문제집')
    )
  };

  // 디버깅: PDF 파일명과 분류 결과 로그
  console.log('전체 PDF 목록:', availablePdfs);
  console.log('분류된 PDF:', categorizedPdfs);

  const handleDownload = (filename: string) => {
    if (onDownloadPdf) {
      onDownloadPdf(filename);
    }
  };

  const handleView = (filename: string) => {
    if (onViewPdf) {
      onViewPdf(filename);
    }
  };

  const renderPdfSection = (title: string, pdfs: any[], icon: string, color: string) => {
    if (pdfs.length === 0) {
      return (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <div className={`w-8 h-8 ${color} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">PDF 파일이 없습니다</p>
            <p className="text-xs text-gray-400 mt-1">새로운 PDF가 생성되면 여기에 표시됩니다</p>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <div className={`w-8 h-8 ${color} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
            {pdfs.length}개
          </span>
        </div>
        <div className="space-y-2">
          {pdfs.map((pdf, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 text-red-600 rounded flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{pdf.filename}</p>
                  <p className="text-xs text-gray-500">
                    생성일: {pdf.created_at ? new Date(pdf.created_at).toLocaleDateString('ko-KR') : '알 수 없음'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* 뷰어 버튼 */}
                <button
                  onClick={() => handleView(pdf.filename)}
                  disabled={!isBackendConnected}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>보기</span>
                </button>
                
                {/* 다운로드 버튼 */}
                <button
                  onClick={() => handleDownload(pdf.filename)}
                  disabled={!isBackendConnected}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>다운로드</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 text-center flex-1">PDF 자료실</h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          title="PDF 컨테이너 닫기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 내용 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {availablePdfs.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm">PDF 파일이 없습니다</p>
            <p className="text-xs mt-1">문제를 생성하면 PDF 파일이 만들어집니다</p>
          </div>
        ) : (
          <div>
            {renderPdfSection(
              "답안집", 
              categorizedPdfs.problemSolving, 
              "📝", 
              "bg-blue-500"
            )}
            {renderPdfSection(
              "분석리포트", 
              categorizedPdfs.wrongAnswerAnalysis, 
              "📊", 
              "bg-red-500"
            )}
            {renderPdfSection(
              "문제집", 
              categorizedPdfs.problemGeneration, 
              "📚", 
              "bg-green-500"
            )}
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>총 {availablePdfs.length}개의 PDF 파일</span>
          <span className={`px-2 py-1 rounded-full ${
            isBackendConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isBackendConnected ? '서버 연결됨' : '서버 연결 안됨'}
          </span>
        </div>
      </div>
    </div>
  );
}
