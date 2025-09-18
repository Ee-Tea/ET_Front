'use client';

import React, { useState, useEffect } from 'react';

interface PdfViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string;
  filename?: string;
  isBackendConnected?: boolean;
}

export default function PdfViewer({
  isOpen,
  onClose,
  pdfUrl,
  filename,
  isBackendConnected = false
}: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // PDF 로드
  useEffect(() => {
    if (isOpen && pdfUrl && isBackendConnected) {
      loadPdf();
    }
    
    return () => {
      // 컴포넌트 언마운트 시 blob URL 정리
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [isOpen, pdfUrl, isBackendConnected]);

  const loadPdf = async () => {
    if (!pdfUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    console.log('PDF 로드 시도:', pdfUrl);
    
    // 여러 URL을 시도해보기
    const urlsToTry = [
      pdfUrl,
      pdfUrl.replace('/api/proxy/', '/api/proxy/'),
      pdfUrl.replace('/api/proxy/', '/api/proxy/')
    ];
    
    for (const url of urlsToTry) {
      try {
        console.log('PDF URL 시도:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf,application/octet-stream,*/*'
          }
        });
        
        console.log('PDF 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
          console.warn(`PDF URL 실패: ${url} - ${response.status}`);
          continue; // 다음 URL 시도
        }
        
        const contentType = response.headers.get('content-type');
        console.log('PDF Content-Type:', contentType);
        
        const blob = await response.blob();
        console.log('PDF Blob 크기:', blob.size, 'bytes');
        
        if (blob.size === 0) {
          console.warn(`PDF 파일이 비어있음: ${url}`);
          continue; // 다음 URL 시도
        }
        
        const blobUrl = URL.createObjectURL(blob);
        
        // 이전 blob URL 정리
        if (pdfBlobUrl) {
          URL.revokeObjectURL(pdfBlobUrl);
        }
        
        setPdfBlobUrl(blobUrl);
        console.log('PDF 로드 성공:', url);
        setIsLoading(false);
        return; // 성공하면 함수 종료
        
      } catch (err) {
        console.warn(`PDF URL 오류: ${url}`, err);
        continue; // 다음 URL 시도
      }
    }
    
    // 모든 URL이 실패한 경우
    console.error('모든 PDF URL 시도 실패');
    setError('PDF를 로드할 수 없습니다. 서버 연결을 확인해주세요.');
    setIsLoading(false);
  };

  const handleDownload = () => {
    if (pdfBlobUrl && filename) {
      const a = document.createElement('a');
      a.href = pdfBlobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handlePrint = () => {
    if (pdfBlobUrl) {
      const printWindow = window.open(pdfBlobUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 text-red-600 rounded flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{filename || 'PDF 뷰어'}</h2>
              <p className="text-sm text-gray-500">PDF 파일 미리보기</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 다운로드 버튼 */}
            <button
              onClick={handleDownload}
              disabled={!pdfBlobUrl || isLoading}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>다운로드</span>
            </button>
            
            {/* 인쇄 버튼 */}
            <button
              onClick={handlePrint}
              disabled={!pdfBlobUrl || isLoading}
              className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>인쇄</span>
            </button>
            
            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
              title="닫기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF 뷰어 영역 */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">PDF를 로드하는 중...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600 font-medium mb-2">PDF 로드 실패</p>
                <p className="text-gray-500 text-sm mb-4">{error}</p>
                <button
                  onClick={loadPdf}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}
          
          {pdfBlobUrl && !isLoading && !error && (
            <iframe
              src={pdfBlobUrl}
              className="w-full h-full border-0"
              title={filename || 'PDF 뷰어'}
            />
          )}
          
          {!pdfBlobUrl && !isLoading && !error && !isBackendConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-yellow-600 font-medium mb-2">서버 연결 필요</p>
                <p className="text-gray-500 text-sm">PDF를 보려면 서버에 연결되어야 합니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>PDF 뷰어 - {filename || '알 수 없는 파일'}</span>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full ${
                isBackendConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isBackendConnected ? '서버 연결됨' : '서버 연결 안됨'}
              </span>
              {pdfBlobUrl && (
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  로드 완료
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
