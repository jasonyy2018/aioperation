'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';

/**
 * Protected Route - redirects to login if not authenticated
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> {
  return function ProtectedRoute(props: P) {
    const { isLoggedIn, isLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (mounted && !isLoading && !isLoggedIn) {
        const redirect = searchParams.get('redirect');
        router.replace(`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`);
      }
    }, [mounted, isLoading, isLoggedIn, router, searchParams]);

    if (isLoading || !mounted) {
      return (
        <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
            <p className="text-xs text-slate-500">验证中...</p>
          </div>
        </div>
      );
    }

    if (!isLoggedIn) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
