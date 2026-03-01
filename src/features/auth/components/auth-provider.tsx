"use client";

import { useEffect } from "react";
import { useAtom } from "jotai";
import { usePathname, useRouter } from "next/navigation";
import { getMe } from "@/api/auth";
import { userAtom, authLoadingAtom } from "@/features/auth/store/auth-atoms";

/**
 * Public paths that do NOT require authentication.
 * Everything else redirects to /login when there is no valid session.
 */
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useAtom(userAtom);
  const [loading, setLoading] = useAtom(authLoadingAtom);
  const router = useRouter();
  const pathname = usePathname();

  // On mount, check the session once via the cookie-based /api/auth/me call
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const me = await getMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After the session check completes, handle redirects
  useEffect(() => {
    if (loading) return;

    const onPublicPage = isPublicPath(pathname);

    if (!user && !onPublicPage) {
      // Not authenticated → send to login
      router.replace("/login");
    } else if (user && onPublicPage) {
      // Already authenticated → send away from auth pages
      router.replace("/workflows");
    }
  }, [loading, user, pathname, router]);

  // While checking session, render nothing (or a spinner)
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
