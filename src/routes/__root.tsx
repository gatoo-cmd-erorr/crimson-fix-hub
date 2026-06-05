import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "@/lib/auth";
import { initTelegram } from "@/lib/telegram";
import { BottomNav } from "@/components/BottomNav";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-sm rounded-2xl p-8 text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-2xl font-bold">404</h1>
        <p className="mt-2 text-sm text-white/60">Halaman tidak ditemukan.</p>
        <Link
          to="/"
          className="press mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 font-semibold text-white"
        >
          Ke Beranda
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-sm rounded-2xl p-8 text-center">
        <div className="text-5xl">⚠️</div>
        <h1 className="mt-3 text-lg font-bold">Terjadi kesalahan</h1>
        <p className="mt-1 text-sm text-white/60">{error.message}</p>
        <button
          onClick={reset}
          className="press mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 font-semibold text-white"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function PageFrame() {
  const { location } = useRouterState();
  const isLogin = location.pathname === "/login";
  return (
    <>
      <main
        className={`mx-auto max-w-md px-4 ${isLogin ? "" : "safe-top safe-bottom"}`}
      >
        <Outlet />
      </main>
      {!isLogin && <BottomNav />}
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    initTelegram();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PageFrame />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "rgba(20,20,20,0.95)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              borderRadius: "14px",
              fontSize: "14px",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
