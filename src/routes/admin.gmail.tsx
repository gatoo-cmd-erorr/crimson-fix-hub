import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
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
  is_current?: boolean;
}

function AdminGmail() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [health, setHealth] = useState<Record<string, { ok: boolean; msg: string } | undefined>>({});

  const { data, isLoading, refetch } = useQuery<{ items: G[] }>({
    queryKey: ["admin-gmail"],
    queryFn: async () => (await api.get("/gmail/list")).data,
  });

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const add = async () => {
    if (!email || !pw) return toast.error("Isi semua field");
    if (!emailValid) return toast.error("Format email salah");
    setBusy(true);
    try {
      const { data: created } = await api.post("/gmail/add", { email, app_password: pw });
      toast.success(`✅ Gmail ${email} ditambahkan`);
      const newId = created?._id ?? created?.item?._id ?? null;
      setEmail("");
      setPw("");
      setOpen(false);
      await refetch();
      if (newId) {
        setHighlightId(newId);
        setTimeout(() => setHighlightId(null), 3000);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal");
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Hapus gmail ini?")) return;
    await api.delete(`/gmail/${id}`);
    refetch();
  };

  const check = async (id: string) => {
    setHealth((h) => ({ ...h, [id]: undefined }));
    try {
      const { data } = await api.get(`/gmail/${id}/health`);
      setHealth((h) => ({ ...h, [id]: { ok: !!data.ok, msg: data.message ?? "OK" } }));
    } catch (e: any) {
      setHealth((h) => ({ ...h, [id]: { ok: false, msg: e?.response?.data?.message ?? "Error" } }));
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
                    <span
                      className={
                        emailValid && pw.length >= 8
                          ? "text-success"
                          : "text-warning"
                      }
                    >
                      {emailValid && pw.length >= 8
                        ? "● Siap disimpan"
                        : "● Lengkapi data"}
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

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <EmptyState icon="📧" title="Belum ada gmail" hint="Tambahkan gmail pengirim di atas." />
      ) : (
        <ul className="space-y-2">
          {data.items.map((g) => (
            <li key={g._id}>
              <Card
                className={`${g.is_current ? "border-primary/50 shadow-[0_0_16px_rgba(10,132,255,0.2)]" : ""} ${highlightId === g._id ? "animate-pulse !border-primary shadow-[0_0_28px_rgba(10,132,255,0.55)]" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{g.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${g.status === "ok" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}
                      >
                        {g.status === "ok" ? "✅ OK" : "❌ Error"}
                      </span>
                      {g.is_current && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 font-bold text-primary">
                          🔄 Aktif Round
                        </span>
                      )}
                      <span className="text-white/55">{g.total_sent} sent</span>
                    </div>
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
                    className="!h-9 !text-xs !px-3"
                    onClick={() => check(g._id)}
                  >
                    Health Check
                  </Button>
                  <Button
                    variant="danger"
                    className="!h-9 !text-xs !px-3 ml-auto"
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
