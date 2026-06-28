"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/use-auth";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { hasHydrated, isAuthenticated } = useAuth();

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace("/");
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated) {
    return (
      <div className="min-h-dvh bg-(--background)" aria-hidden="true" />
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-dvh bg-(--background)" aria-hidden="true" />
    );
  }

  return <>{children}</>;
}
