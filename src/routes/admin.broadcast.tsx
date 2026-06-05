import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { Card, Button, Label, Skeleton, EmptyState, Progress } from "@/components/ui-bits";
import { BottomSheet } from "@/components/BottomSheet";
import { AdminSubNav } from "./admin.dashboard";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/broadcast")({
  component: AdminBroadcast,
});

type Target = "all" | "premium" | "free";

interface H {
  _id: string;
  target: Target;
  message: string;
  sent_count: number;
  failed_count: number;
  total_count: number;
  created_at: string;
}

function AdminBroadcast() {
  const [target, setTarget] = useState<Target>("all");
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [progress, setProgress] = useState<H | null>(null);
  const [busy, setBusy] = useState(false);

  const hist = useQuery<{ items: H[] }>({
    queryKey: ["broadcast-hist"],
    queryFn: async () => (await api.get("/admin/broadcast/history")).data,
  });

  const send = async () => {
    setBusy(true);
    setConfirm(false);
    try {
      const { data } = await api.post("/admin/broadcast", { target, message: msg });
      setProgress(data);
      toast.success("Broadcast terkirim");
      setMsg("");
      hist.refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="Broadcast" />
      <AdminSubNav />

      <Card className="mb-3 space-y-3">
        <div>
          <Label>Target</Label>
          <div className="flex gap-2">
            {(["all", "premium", "free"] as Target[]).map((t) => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                className={`press flex-1 rounded-full py-2 text-xs font-semibold ${target === t ? "bg-primary text-white" : "bg-white/8 text-white/65"}`}
              >
                {t === "all" ? "Semua" : t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Pesan</Label>
          <textarea
            rows={5}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/7 p-3 text-sm"
            placeholder="Pesan broadcast..."
          />
          <p className="mt-1 text-xs text-white/40">{msg.length} karakter</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" full onClick={() => setPreview(true)}>
            Preview
          </Button>
          <Button full disabled={!msg} onClick={() => setConfirm(true)}>
            📢 Kirim
          </Button>
        </div>
      </Card>

      {progress && (
        <Card className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
            Status Broadcast
          </p>
          <Progress value={progress.sent_count} max={progress.total_count || 1} />
          <p className="mt-2 text-xs text-white/65">
            Sent {progress.sent_count} / {progress.total_count} · Failed {progress.failed_count}
          </p>
        </Card>
      )}

      <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-white/55">
        Riwayat
      </p>
      {hist.isLoading ? (
        <Skeleton className="h-24" />
      ) : !hist.data?.items?.length ? (
        <EmptyState icon="📭" title="Belum ada broadcast" />
      ) : (
        <ul className="space-y-2">
          {hist.data.items.slice(0, 5).map((h) => (
            <li key={h._id}>
              <Card className="!p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 font-bold text-primary">
                    {h.target.toUpperCase()}
                  </span>
                  <span className="text-white/45">
                    {new Date(h.created_at).toLocaleString("id-ID")}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-white/80">{h.message}</p>
                <p className="mt-2 text-xs text-white/55">
                  ✅ {h.sent_count} · ❌ {h.failed_count} / {h.total_count}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <BottomSheet open={preview} onClose={() => setPreview(false)} title="Preview">
        <p className="whitespace-pre-wrap rounded-xl bg-white/5 p-3 text-sm">{msg || "—"}</p>
      </BottomSheet>

      <BottomSheet open={confirm} onClose={() => setConfirm(false)} title="Konfirmasi">
        <p className="text-sm text-white/65">
          Kirim broadcast ke <b>{target.toUpperCase()}</b>?
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" full onClick={() => setConfirm(false)}>
            Batal
          </Button>
          <Button full loading={busy} onClick={send}>
            Kirim
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
