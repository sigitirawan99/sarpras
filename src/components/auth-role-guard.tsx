"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { Role } from "@/lib/types";
import { Spinner } from "./ui/spinner";

interface AuthRoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  fallback?: React.ReactNode;
}

export function AuthRoleGuard({
  children,
  allowedRoles,
  fallback,
}: AuthRoleGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser();

      if (!user) {
        // Not logged in
        if (pathname.startsWith("/dashboard")) {
          router.push("/sign-in");
        }
        setIsAuthorized(false);
        return;
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Logged in but role not allowed
        setIsAuthorized(false);
        return;
      }

      // Authorized
      setIsAuthorized(true);
    };

    checkAuth();
  }, [allowedRoles, router, pathname]);

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthorized) {
    if (fallback) return <>{fallback}</>;
    
    // Default fallback for restricted pages
    return (
      <div className="flex h-[calc(100vh-100px)] w-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="bg-destructive/10 text-destructive rounded-full p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Akses Ditolak</h1>
        <p className="text-muted-foreground max-w-md">
          Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 font-medium transition-colors"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
