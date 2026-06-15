import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth";
import { Button, Input, Label, Card } from "@/components/ui-bits";
import { tgHaptic } from "@/lib/telegram";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, loginTelegram } = useAuth();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const rocketControls = useAnimationControls();

  // ── Cek Telegram auto login saat mount ──────────────────────────────────────
  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    if (tg?.initData && tg?.initDataUnsafe?.user) {
      void handleTelegramLogin();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTelegramLogin = async () => {
    setTgLoading(true);
    try {
      const ok = await loginTelegram();
      if (ok) {
        tgHaptic("success");
        await launchRocket();
      } else {
        toast.error("Akun Telegram belum terdaftar. Hubungi owner.");
      }
    } catch {
      toast.error("Login Telegram gagal");
    } finally {
      setTgLoading(false);
    }
  };

  // ── Animasi roket naik ───────────────────────────────────────────────────────
  const launchRocket = async () => {
    setLaunching(true);
    // Goyang dulu
    await rocketControls.start({
      x: [0, -6, 6, -4, 4, 0],
      transition: { duration: 0.4 },
    });
    // Naik ke atas layar
    await rocketControls.start({
      y: -800,
      scale: 0.3,
      opacity: 0,
      transition: { duration: 0.8, ease: "easeIn" },
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!u || !p) return toast.error("Isi username & password");
    setLoading(true);
    try {
      await login(u, p);
      tgHaptic("success");
      toast.success("Berhasil masuk!");
      await launchRocket();
    } catch (err: any) {
      tgHaptic("error");
      toast.error(err?.response?.data?.message || "Login gagal");
      setLaunching(false);
    } finally {
      setLoading(false);
    }
  };

  const isTelegram = !!(window as any)?.Telegram?.WebApp?.initData;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 safe-top overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* ── Logo + Roket ── */}
        <div className="mb-10 flex flex-col items-center text-center">
          <motion.div
            animate={rocketControls}
            className="relative cursor-pointer"
            onClick={() => {
              if (!launching) {
                // Bounce naik turun saat di-tap
                rocketControls.start({
                  y: [0, -20, 0, -10, 0],
                  transition: { duration: 0.6, ease: "easeOut" },
                });
              }
            }}
          >
            {/* Glow */}
            <div className="absolute inset-0 animate-pulse rounded-3xl bg-primary/30 blur-2xl" />
            {/* Icon */}
            <motion.div
              className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#0A84FF,#0060CC)] text-4xl"
              style={{ boxShadow: "0 0 40px rgba(10,132,255,0.5)" }}
              animate={{
                y: launching ? 0 : [0, -8, 0, -4, 0],
              }}
              transition={
                launching
                  ? {}
                  : {
                      repeat: Infinity,
                      duration: 2.5,
                      ease: "easeInOut",
                      delay: 0.5,
                    }
              }
            >
              🚀
            </motion.div>

            {/* Exhaust flame */}
            {!launching && (
              <motion.div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-lg"
                animate={{ opacity: [0.4, 1, 0.4], scaleY: [0.8, 1.2, 0.8] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              >
                🔥
              </motion.div>
            )}
          </motion.div>

          <h1 className="mt-8 text-3xl font-bold tracking-tight">Fix Merah</h1>
          <p className="mt-1 text-sm text-white/55">Sistem Fix Nomor Profesional</p>
        </div>

        {/* ── Telegram Login Button (kalau di dalam Telegram) ── */}
        {isTelegram && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <Button
              full
              loading={tgLoading}
              onClick={handleTelegramLogin}
              className="!bg-[linear-gradient(135deg,#0A84FF,#0060CC)] !text-white"
            >
              {tgLoading ? "Memverifikasi..." : "🔵 Login dengan Telegram"}
            </Button>
            <div className="my-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/35">atau</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </motion.div>
        )}

        {/* ── Username/Password Form ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isTelegram ? 0.3 : 0.2 }}
        >
          <Card>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label>Username</Label>
                <Input
                  value={u}
                  onChange={(e) => setU(e.target.value)}
                  placeholder="username"
                  autoCapitalize="none"
                  autoComplete="username"
                />
              </div>
              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    value={p}
                    onChange={(e) => setP(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="press absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/60"
                  >
                    {show ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>
              </div>
              <Button type="submit" full loading={loading}>
                MASUK
              </Button>
            </form>
          </Card>
        </motion.div>

        <p className="mt-6 text-center text-xs text-white/35">
          Akun dibuat oleh SuperOwner
        </p>
      </motion.div>
    </div>
  );
}
