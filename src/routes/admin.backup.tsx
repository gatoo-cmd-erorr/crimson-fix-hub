import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { Card, Button, Skeleton } from "@/components/ui-bits";
import { BottomSheet } from "@/components/BottomSheet";
import { AdminSubNav } from "./admin.dashboard";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/backup")({
  component: AdminBackup,
});

interface BackupStatus {
  last_backup_at?: string;
  total_users?: number;
  total_fix_history?: number;
}

function formatWIB(d?: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " WIB";
  } catch {
    return d;
  }
}

function AdminBackup() {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastSize, setLastSize] = useState<string | null>(null);

  const status = useQuery<BackupStatus>({
    queryKey: ["backup-status"],
    queryFn: async () => (await api.get("/backup/status")).data,
  });

  const doBackup = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/backup/manual");
      const size = data?.file_size ?? data?.size ?? null;
      setLastSize(size ? `${size}` : null);
      toast.success("✅ Backup berhasil dikirim ke Telegram!");
      status.refetch();
      setConfirm(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal membuat backup");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="Backup" />
      <AdminSubNav />

      <Card className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
          💾 Status Backup
        </p>
        {status.isLoading ? (
          <Skeleton className="mt-2 h-20" />
        ) : (
          <div className="mt-2 space-y-1.5 text-sm">
            <Row k="Backup terakhir" v={formatWIB(status.data?.last_backup_at)} />
            <Row k="Total user" v={status.data?.total_users ?? 0} />
            <Row k="Total fix history" v={status.data?.total_fix_history ?? 0} />
            <Row k="Tujuan backup" v="📨 Telegram Owner" />
          </div>
        )}
      </Card>

      <Card className="mb-3">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/55">
          Backup Manual
        </p>
        <Button full onClick={() => setConfirm(true)} loading={busy}>
          📦 Backup Sekarang
        </Button>
        {lastSize && (
          <p className="mt-2 text-center text-xs text-success">
            ✅ Backup terakhir: {lastSize}
          </p>
        )}
      </Card>

      <Card>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/55">
          ⚡ Auto Backup Aktif
        </p>
        <ul className="space-y-1.5 text-sm text-white/80">
          <li>• Saat ada user baru</li>
          <li>• Setelah user fix</li>
          <li>• Setiap 6 jam otomatis</li>
        </ul>
      </Card>

      <BottomSheet open={confirm} onClose={() => !busy && setConfirm(false)} title="Konfirmasi Backup">
        <div className="text-center">
          <div className="mb-3 text-4xl">📦</div>
          <p className="text-base font-bold">Backup database sekarang?</p>
          <p className="mt-1 text-xs text-white/55">
            File akan dikirim ke Telegram Owner.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="ghost" full onClick={() => setConfirm(false)}>
              Batal
            </Button>
            <Button full loading={busy} onClick={doBackup}>
              Backup
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/55">{k}</span>
      <span className="font-semibold text-white">{v}</span>
    </div>
  );
}
