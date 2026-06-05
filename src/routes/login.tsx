import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth";
import { Button, Input, Label, Card } from "@/components/ui-bits";
import { tgHaptic } from "@/lib/telegram";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!u || !p) return toast.error("Isi username & password");
    setLoading(true);
    try {
      await login(u, p);
      tgHaptic("success");
      toast.success("Berhasil masuk");
    } catch (err: any) {
      tgHaptic("error");
      toast.error(err?.response?.data?.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 safe-top">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse-red rounded-3xl bg-primary/30 blur-2xl" />
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#0A84FF,#0060CC)] text-4xl text-white"
              style={{ boxShadow: "var(--shadow-red-glow-lg)" }}
            >
              🛡️
            </div>
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">Fix Merah</h1>
          <p className="mt-1 text-sm text-white/55">
            Sistem Fix Nomor Profesional
          </p>
        </div>

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

        <p className="mt-6 text-center text-xs text-white/35">
          Akun dibuat oleh SuperOwner
        </p>
      </motion.div>
    </div>
  );
}
