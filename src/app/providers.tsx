"use client";

import QueryProvider from "@/providers/query-provider";
import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryProvider>
        <AuthBootstrap />
        {children}
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </QueryProvider>
    </NextThemesProvider>
  );
}
