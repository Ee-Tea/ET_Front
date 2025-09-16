import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 백엔드 서버들의 헬스체크
    const backendUrls = [
      'http://localhost:8100/health',  // BFF API
      'http://localhost:8124/auth/health'  // Auth API
    ];

    const healthChecks = await Promise.allSettled(
      backendUrls.map(async (url) => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // 타임아웃 설정 (5초)
            signal: AbortSignal.timeout(5000)
          });
          
          return {
            url,
            status: response.ok ? 'healthy' : 'unhealthy',
            statusCode: response.status,
            response: response.ok ? await response.json() : null
          };
        } catch (error) {
          return {
            url,
            status: 'unhealthy',
            statusCode: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const results = healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          url: backendUrls[index],
          status: 'unhealthy',
          statusCode: 0,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        };
      }
    });

    // 전체 상태 결정 (하나라도 healthy이면 전체 healthy)
    const overallStatus = results.some(r => r.status === 'healthy') ? 'healthy' : 'unhealthy';
    
    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: results,
      frontend: {
        status: 'healthy',
        version: '1.0.0'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: [],
      frontend: {
        status: 'healthy',
        version: '1.0.0'
      }
    }, { status: 500 });
  }
}
