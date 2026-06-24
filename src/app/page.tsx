import { ProtectedRoute } from "@/components/auth/protected-route";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <main className="min-h-[100dvh] bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
        <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-7xl items-center justify-center rounded-[2rem] border border-[var(--border)] bg-[rgba(17,24,39,0.68)] p-10">
          <div className="max-w-2xl space-y-4 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--cyan)]">
              Protected workspace
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Authentication is live.
            </h1>
            <p className="text-sm leading-7 text-slate-300 md:text-base">
              This landing surface is protected by session state, refresh token
              handling, and route guards. Replace this shell with the actual
              operator dashboard when ready.
            </p>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
