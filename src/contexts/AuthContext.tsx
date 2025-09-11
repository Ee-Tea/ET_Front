'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: 'google' | 'kakao' | 'naver';
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 동일 오리진 프록시 사용: /api 로 호출
const AUTH_API = ''; // Next.js 프록시를 통해 /api 경로 사용

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('user');
      if (cached) setUser(JSON.parse(cached));
    } catch {}
  }, []);

  const fetchMe = async (label: string) => {
    // 모바일 페이지에서도 인증 확인은 시도하되, 실패해도 계속 진행
    if (window.location.pathname.startsWith('/mobile')) {
      console.log('[AUTH] 모바일 페이지 - 인증 확인 시도');
    }

    console.log(`[AUTH] /auth/me 요청 (${label})`);
    try {
      const res = await fetch(`${AUTH_API}/api/auth/me`, {
        credentials: 'include',
      });
      if (!res.ok) {
        console.warn('[AUTH] /auth/me 실패:', res.status, await safeText(res));
        setUser(null);
        localStorage.removeItem('user');
        return;
      }
      const me = (await res.json()) as User;
      console.log('[AUTH] /auth/me 성공:', me);
      setUser(me);
      localStorage.setItem('user', JSON.stringify(me));
    } catch (e) {
      console.error('[AUTH] /auth/me 에러:', e);
      // 모바일 페이지에서는 인증 실패해도 계속 진행
      if (window.location.pathname.startsWith('/mobile')) {
        console.log('[AUTH] 모바일 페이지 - 인증 실패해도 계속 진행');
        setIsLoading(false);
        return;
      }
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const hasLoginOk = params.get('login') === 'ok';

    (async () => {
      if (hasLoginOk) {
        await fetchMe('login=ok');
        // URL 정리
        params.delete('login');
        const clean = window.location.pathname + (params.toString() ? `?${params}` : '');
        window.history.replaceState({}, '', clean);
      } else {
        await fetchMe('initial');
      }
      setIsLoading(false);
    })();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // 필요시 서버 로그아웃 API 호출
  };

  const value = { user, isLoggedIn: !!user, login, logout, isLoading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 안전하게 텍스트 로깅
async function safeText(res: Response) {
  try { return await res.text(); } catch { return ''; }
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
