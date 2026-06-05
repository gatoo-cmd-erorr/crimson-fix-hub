import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { api } from "./api";

export type Role = "free" | "premium" | "vip" | "owner" | "superowner";

export interface AuthUser {
  _id: string;
  username: string;
  telegram_id?: string;
  role: Role;
  created_at?: string;
  total_fix?: number;
  expiry?: string | null;
}

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
  setUser: (u: AuthUser) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

const INACTIVITY_MS = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { location } = useRouterState();
  const timer = useRef<number | null>(null);

  const setUser = (u: AuthUser) => {
    setUserState(u);
    localStorage.setItem("fm_user", JSON.stringify(u));
  };

  const logout = () => {
    localStorage.removeItem("fm_token");
    localStorage.removeItem("fm_user");
    setUserState(null);
    setToken(null);
    navigate({ to: "/login" });
  };

  const resetInactivity = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => logout(), INACTIVITY_MS);
  };

  // hydrate
  useEffect(() => {
    const t = localStorage.getItem("fm_token");
    const u = localStorage.getItem("fm_user");
    if (t && u) {
      setToken(t);
      try {
        setUserState(JSON.parse(u));
      } catch {}
    }
    setLoading(false);
  }, []);

  // guard
  useEffect(() => {
    if (loading) return;
    const path = location.pathname;
    if (!token && path !== "/login") navigate({ to: "/login" });
    if (token && path === "/login") navigate({ to: "/" });
  }, [token, loading, location.pathname, navigate]);

  // inactivity
  useEffect(() => {
    if (!token) return;
    const handler = () => resetInactivity();
    resetInactivity();
    window.addEventListener("pointerdown", handler);
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (username: string, password: string) => {
    const tg = (window as any)?.Telegram?.WebApp;
    const { data } = await api.post("/auth/login", {
      username,
      password,
      tg_init_data: tg?.initData ?? null,
    });
    localStorage.setItem("fm_token", data.token);
    localStorage.setItem("fm_user", JSON.stringify(data.user));
    setToken(data.token);
    setUserState(data.user);
    navigate({ to: "/" });
  };

  return (
    <Ctx.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
