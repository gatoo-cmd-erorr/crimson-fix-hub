import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tgHaptic } from "@/lib/telegram";

interface Channel {
  _id: string;
  name: string;
  username: string;
  type: "channel" | "group";
  url: string;
}

interface VerifyResult {
  all_joined: boolean;
  missing: Channel[];
}

function openTgLink(url: string) {
  try {
    const tg = (window as any)?.Telegram?.WebApp;
    if (tg?.openTelegramLink && url.includes("t.me/")) {
      tg.openTelegramLink(url);
      return;
    }
  } catch {
    // ignore
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function MandatoryJoinGate() {
  const { user, token } = useAuth();
  const [missing, setMissing] = useState<Channel[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [tappedIds, setTappedIds] = useState<Set<string>>(new Set());
  const [cooldown, setCooldown] = useState(0);

  const check = useCallback(async () => {
    if (!user?.telegram_id || !token) {
      setMissing(null);
      return;
    }
    try {
      const { data } = await api.post<VerifyResult>("/mandatory/verify", {
        telegram_id: user.telegram_id,
      });
      if (data.all_joined) {
        setMissing(null);
      } else {
        setMissing(data.missing ?? []);
      }
    } catch (e: any) {
      // If endpoint doesn't exist (404) or feature disabled, silently skip
      if (e?.response?.status === 404 || e?.response?.status === 400) {
        setMissing(null);
      }
    }
  }, [user, token]);

  // Initial check
  useEffect(() => {
    check();
    // re-check every 5 min
    const i = window.setInterval(check, 5 * 60 * 1000);
    return () => window.clearInterval(i);
  }, [check]);

  // Cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(
      () => setCooldown((c) => Math.max(0, c - 1)),
      1000,
    );
    return () => window.clearInterval(t);
  }, [cooldown]);

  // Listen for fix-blocked global event
  useEffect(() => {
    const h = (e: Event) => {
      const detail = (e as CustomEvent).detail as VerifyResult | undefined;
      if (detail?.missing) {
        setMissing(detail.missing);
        tgHaptic("warning");
      } else {
        check();
      }
    };
    window.addEventListener("mandatory-join-required", h);
    return () => window.removeEventListener("mandatory-join-required", h);
  }, [check]);

  const verifyNow = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      const { data } = await api.post<VerifyResult>("/mandatory/verify", {
        telegram_id: user?.telegram_id,
      });
      if (data.all_joined) {
        tgHaptic("success");
        setMissing(null);
      } else {
        tgHaptic("error");
        setMissing(data.missing ?? []);
      }
    } catch {
      tgHaptic("error");
    } finally {
      setLoading(false);
      setCooldown(10);
    }
  };

  const tap = (c: Channel) => {
    tgHaptic("light");
    setTappedIds((s) => new Set(s).add(c._id));
    openTgLink(c.url);
  };

  const show = !!missing && missing.length > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/85 px-4 pb-6 pt-10 backdrop-blur-md sm:items-center"
        >
          <motion.div
            initial={{ y: 40, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 40, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="glass-strong w-full max-w-md overflow-hidden rounded-3xl border border-primary/40 shadow-[0_0_40px_rgba(10,132,255,0.35)]"
            style={{ maxHeight: "92dvh" }}
          >
            <div className="overflow-y-auto" style={{ maxHeight: "92dvh" }}>
              <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(10,132,255,0.15),transparent)] p-5 text-center">
                <div className="mx-auto mb-2 text-4xl">🔒</div>
                <h2 className="text-lg font-bold text-white">WAJIB JOIN DULU!</h2>
                <p className="mt-1 text-xs text-white/65">
                  Join semua channel/grup berikut untuk bisa menggunakan Fix Merah
                </p>
              </div>

              <ul className="space-y-2 p-4">
                {missing!.map((c) => {
                  const tapped = tappedIds.has(c._id);
                  return (
                    <li
                      key={c._id}
                      className="overflow-hidden rounded-2xl border border-danger/40 bg-danger/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xl">
                          {c.type === "group" ? "👥" : "📢"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {c.name}
                          </p>
                          <p className="truncate text-[11px] text-white/55">
                            {c.username}
                          </p>
                        </div>
                        <button
                          onClick={() => tap(c)}
                          className="press inline-flex h-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary px-3 text-xs font-bold text-white"
                        >
                          {tapped ? "↻ Buka lagi" : "Tap untuk join →"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-white/10 bg-black/30 p-4">
                <button
                  onClick={verifyNow}
                  disabled={loading || cooldown > 0}
                  className="press inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0A84FF,#0060CC)] font-bold text-white shadow-[0_8px_24px_rgba(10,132,255,0.4)] disabled:opacity-50"
                >
                  {loading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {cooldown > 0
                    ? `Tunggu ${cooldown}s...`
                    : loading
                    ? "Mengecek..."
                    : "✅ SUDAH JOIN, CEK SEKARANG"}
                </button>
                <p className="mt-2 text-center text-[10px] text-white/40">
                  Verifikasi langsung ke Telegram API. Tidak bisa dicurangi.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
