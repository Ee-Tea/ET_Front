import { NextRequest, NextResponse } from 'next/server';

// 임시 세션 저장소 (실제로는 데이터베이스 사용)
let sessions: any[] = [];

// 세션 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, user_id } = body;

    const newSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || '새 채팅',
      user_id: user_id || 'anonymous',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    sessions.unshift(newSession);

    return NextResponse.json(newSession);
  } catch (error) {
    console.error('세션 생성 오류:', error);
    return NextResponse.json(
      { error: '세션을 생성할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// 세션 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id') || 'anonymous';

    const userSessions = sessions.filter(session => session.user_id === user_id);
    
    return NextResponse.json(userSessions);
  } catch (error) {
    console.error('세션 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '세션 목록을 가져올 수 없습니다.' },
      { status: 500 }
    );
  }
}
