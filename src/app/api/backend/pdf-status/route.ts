import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // PDF 상태 확인 로직
    // 실제로는 백엔드 서버에서 PDF 처리 상태를 확인해야 함
    
    const pdfStatus = {
      status: 'ready',
      message: 'PDF 처리가 준비되었습니다.',
      timestamp: new Date().toISOString(),
      available: true
    };

    return NextResponse.json(pdfStatus);
  } catch (error) {
    console.error('PDF 상태 확인 오류:', error);
    return NextResponse.json(
      { 
        error: 'PDF 상태를 확인할 수 없습니다.',
        status: 'error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
