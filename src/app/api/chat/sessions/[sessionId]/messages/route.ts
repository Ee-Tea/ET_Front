import { NextRequest, NextResponse } from 'next/server';

// 임시 메시지 저장소 (실제로는 데이터베이스 사용)
let sessionMessages: {[sessionId: string]: any[]} = {};

// 세션의 메시지 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const messages = sessionMessages[sessionId] || [];
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('메시지 조회 오류:', error);
    return NextResponse.json(
      { error: '메시지를 가져올 수 없습니다.' },
      { status: 500 }
    );
  }
}

// 세션에 메시지 저장
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const message = await request.json();

    if (!sessionMessages[sessionId]) {
      sessionMessages[sessionId] = [];
    }

    const newMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    sessionMessages[sessionId].push(newMessage);

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('메시지 저장 오류:', error);
    return NextResponse.json(
      { error: '메시지 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}
