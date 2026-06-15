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
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  role: Role;
  created_at?: string;
  total_fix?: number;
  expiry?: string | null;
  coin_balance?: number;
}

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  loginTelegram: () => Promise<boolean>;
  logout: () => void;
  setUser: (u: AuthUser) => void;
  tgUser: any;
}

const Ctx = createContext<AuthCtx | null>(null);
const INACTIVITY_MS = 30 * 60 * 1000;

// Helper: ambil Telegram WebApp object
function getTg() {
  return (window as any)?.Telegram?.WebApp ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tgUser, setTgUser] = useState<any>(null);
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

  // ── Telegram Auto Login ─────────────────────────────────────────────────────
  const loginTelegram = async (): Promise<boolean> => {
    const tg = getTg();
    if (!tg?.initData || !tg?.initDataUnsafe?.user) return false;
    
    const tgU = tg.initDataUnsafe.user;
    setTgUser(tgU);

    try {
      const { data } = await api.post("/auth/login-telegram", {
        init_data: tg.initData,
        telegram_id: String(tgU.id),
        first_name: tgU.first_name ?? "",
        last_name: tgU.last_name ?? "",
        username: tgU.username ?? "",
        photo_url: tgU.photo_url ?? "",
      });

      localStorage.setItem("fm_token", data.token);
      localStorage.setItem("fm_user", JSON.stringify(data.user));
      setToken(data.token);
      setUserState(data.user);
      return true;
    } catch {
      return false;
    }
  };

  // ── Hydrate & Auto Login ────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // Coba hydrate dari localStorage
      const t = localStorage.getItem("fm_token");
      const u = localStorage.getItem("fm_user");
      if (t && u) {
        setToken(t);
        try { setUserState(JSON.parse(u)); } catch {}
        setLoading(false);
        return;
      }

      // Coba auto login via Telegram
      const tg = getTg();
      if (tg?.initData) {
        tg.ready();
        tg.expand();
        const ok = await loginTelegram();
        if (ok) {
          setLoading(false);
          return;
        }
      }

      setLoading(false);
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Route Guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const path = location.pathname;
    if (!token && path !== "/login") navigate({ to: "/login" });
    if (token && path === "/login") navigate({ to: "/" });
  }, [token, loading, location.pathname, navigate]);

  // ── Inactivity Logout ───────────────────────────────────────────────────────
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

  // ── Username/Password Login (fallback) ──────────────────────────────────────
  const login = async (username: string, password: string) => {
    const tg = getTg();
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
    <Ctx.Provider value={{ user, token, loading, login, loginTelegram, logout, setUser, tgUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
