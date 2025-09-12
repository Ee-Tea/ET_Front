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

// 8124에 쿠키 저장을 원하므로 고정 ORIGIN 사용
const AUTH_ORIGIN = 'http://172.29.208.1:8124';

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
    console.log(`[AUTH] /auth/me 요청 (${label})`);
    try {
      const res = await fetch(`${AUTH_ORIGIN}/auth/me`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
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

  const logout = async () => {
    try {
      const res = await fetch(`${AUTH_ORIGIN}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      // 응답 간단 확인
      if (!res.ok) {
        console.warn('[AUTH] /auth/logout 실패:', res.status);
      }
    } catch {}
    setUser(null);
    localStorage.removeItem('user');
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
