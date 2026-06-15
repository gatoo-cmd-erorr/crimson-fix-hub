import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, Button, Input, Label, Skeleton, EmptyState } from "@/components/ui-bits";
import { AdminSubNav } from "./admin.dashboard";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/gmail")({
  component: AdminGmail,
});

interface G {
  _id: string;
  email: string;
  is_active: boolean;
  status: "ok" | "error";
  total_sent: number;
  last_used?: string | null;
  added_by?: string;
  is_current?: boolean;
}

function AdminGmail() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<G[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [health, setHealth] = useState<Record<string, { ok: boolean; msg: string } | undefined>>({});

  const fetchList = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/gmail/list");
      const nextItems: G[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setItems(nextItems);
    } catch (e: any) {
      console.error("Failed to fetch Gmail list:", e);
      setError(e?.response?.data?.message ?? "Gagal memuat data Gmail");
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const add = async () => {
    if (!email || !pw) return toast.error("Isi semua field");
    if (!emailValid) return toast.error("Format email salah");
    setBusy(true);
    try {
      const { data: created } = await api.post("/gmail/add", { email, app_password: pw });
      toast.success(`✅ Gmail ${email} ditambahkan`);
      const item: G = created?.item ?? created ?? {};
      const optimistic: G = {
        _id: item._id ?? `tmp-${Date.now()}`,
        email: item.email ?? email,
        is_active: item.is_active ?? true,
        status: item.status ?? "ok",
        total_sent: item.total_sent ?? 0,
        last_used: item.last_used ?? null,
        added_by: item.added_by,
        is_current: item.is_current,
      };
      setItems((prev) => [optimistic, ...prev.filter((g) => g._id !== optimistic._id)]);
      setEmail("");
      setPw("");
      setOpen(false);
      setHighlightId(optimistic._id);
      setTimeout(() => setHighlightId(null), 3000);
      void fetchList({ silent: true });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal");
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Hapus gmail ini?")) return;
    try {
      await api.delete(`/gmail/${id}`);
      setItems((prev) => prev.filter((item) => item._id !== id));
      toast.success("Gmail dihapus");
      void fetchList({ silent: true });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal");
    }
  };

  const check = async (id: string) => {
    setHealth((h) => ({ ...h, [id]: undefined }));
    try {
      const { data } = await api.get(`/gmail/${id}/health`);
      setHealth((h) => ({ ...h, [id]: { ok: !!data.ok, msg: data.message ?? "OK" } }));
    } catch (e: any) {
      setHealth((h) => ({
        ...h,
        [id]: { ok: false, msg: e?.response?.data?.message ?? "Error" },
      }));
    }
  };

  return (
    <>
      <Header title="Manajemen Gmail" />
      <AdminSubNav />

      <Card className="mb-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="press flex w-full items-center justify-between"
        >
          <span className="font-semibold">+ Tambah Gmail</span>
          <span>{open ? "▲" : "▼"}</span>
        </button>
        {open && (
          <div className="mt-4 space-y-3">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
              />
            </div>
            <div>
              <Label>App Password</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/55"
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>
            {(email || pw) && (
              <Card glow className="!bg-white/3 text-xs">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Preview Gmail
                </p>
                <div className="space-y-1.5 text-white/75">
                  <div className="break-all">
                    <span className="text-white/40">📧 Email:</span>{" "}
                    {email || "—"}{" "}
                    {email && (
                      <span className={emailValid ? "text-success" : "text-danger"}>
                        {emailValid ? "✓" : "✗ format salah"}
                      </span>
                    )}
                  </div>
                  <div className="break-all">
                    <span className="text-white/40">🔑 App Password:</span>{" "}
                    {pw ? "•".repeat(Math.min(pw.length, 16)) : "—"}
                  </div>
                  <div>
                    <span className="text-white/40">Status:</span>{" "}
                    <span className={emailValid && pw.length >= 8 ? "text-success" : "text-warning"}>
                      {emailValid && pw.length >= 8 ? "● Siap disimpan" : "● Lengkapi data"}
                    </span>
                  </div>
                </div>
              </Card>
            )}
            <Button full loading={busy} onClick={add}>
              Tambah
            </Button>
          </div>
        )}
      </Card>

      {error && (
        <Card className="mb-3 flex items-center justify-between gap-3 border-danger/30 bg-danger/10">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-danger">Gagal memuat daftar Gmail</p>
            <p className="truncate text-xs text-white/65">{error}</p>
          </div>
          <Button variant="secondary" className="!h-9 !px-3 !text-xs" onClick={() => void fetchList()}>
            Retry
          </Button>
        </Card>
      )}

      {loading && !items.length ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !items.length && !error ? (
        <EmptyState icon="📧" title="Belum ada gmail" hint="Tambahkan gmail pengirim di atas." />
      ) : (
        <ul className="space-y-2">
          {items.map((g) => (
            <li key={g._id}>
              <Card
                className={`${g.is_current ? "border-primary/50 shadow-[0_0_16px_rgba(10,132,255,0.2)]" : ""} ${highlightId === g._id ? "animate-pulse !border-primary shadow-[0_0_28px_rgba(10,132,255,0.55)]" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{g.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <StatusBadge status={g.status} label={g.status === "ok" ? "OK" : "Error"} />
                      <StatusBadge
                        status={g.is_active ? "ok" : "error"}
                        label={g.is_active ? "Active" : "Inactive"}
                      />
                      {g.is_current && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 font-bold text-primary">
                          🔄 Aktif Round
                        </span>
                      )}
                      <span className="text-white/55">{g.total_sent} sent</span>
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      Last used: {g.last_used ? new Date(g.last_used).toLocaleString("id-ID") : "Belum pernah"}
                    </p>
                    {health[g._id] && (
                      <div
                        className={`mt-2 rounded-lg px-2 py-1 text-xs ${health[g._id]!.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
                      >
                        {health[g._id]!.msg}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    className="!h-9 !px-3 !text-xs"
                    onClick={() => check(g._id)}
                  >
                    Health Check
                  </Button>
                  <Button
                    variant="danger"
                    className="ml-auto !h-9 !px-3 !text-xs"
                    onClick={() => del(g._id)}
                  >
                    Hapus
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}