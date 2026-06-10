import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { Card, Button, Skeleton, EmptyState } from "@/components/ui-bits";
import { BottomSheet } from "@/components/BottomSheet";
import { AdminSubNav } from "./admin.dashboard";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/security")({
  component: AdminSecurity,
});

interface BlockedUser {
  _id: string;
  username: string;
  blocked_reason?: string;
  blocked_at?: string;
}

interface SuspiciousLog {
  _id: string;
  username: string;
  reason: string;
  is_suspicious?: boolean;
  timestamp: string;
}

function fmtWIB(d?: string) {
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

const REASON_LABELS: Record<string, string> = {
  fix_too_fast: "Fix terlalu cepat (bypass cooldown)",
  too_many_fix_per_minute: "Terlalu banyak fix dalam 1 menit",
  multiple_ips: "Terlalu banyak IP berbeda",
  device_fingerprint_changed: "Device berubah",
};

function AdminSecurity() {
  const [confirm, setConfirm] = useState<BlockedUser | null>(null);
  const [busy, setBusy] = useState(false);

  const blocked = useQuery<BlockedUser[]>({
    queryKey: ["sec-blocked"],
    queryFn: async () => {
      const r = await api.get("/security/blocked-users");
      return Array.isArray(r.data) ? r.data : r.data?.users ?? [];
    },
  });

  const logs = useQuery<SuspiciousLog[]>({
    queryKey: ["sec-logs"],
    queryFn: async () => {
      const r = await api.get("/security/suspicious-log");
      return Array.isArray(r.data) ? r.data : r.data?.logs ?? [];
    },
  });

  const doUnblock = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await api.post(`/security/unblock/${confirm._id}`);
      toast.success("User di-unblock");
      blocked.refetch();
      setConfirm(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal unblock");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="Keamanan" />
      <AdminSubNav />

      {/* Stats */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Card className="!p-3">
          <span className="text-xl">🔒</span>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/55">
            User Diblokir
          </p>
          {blocked.isLoading ? (
            <Skeleton className="mt-1 h-6 w-12" />
          ) : (
            <p className="text-2xl font-bold tabular-nums text-[#FF453A]">
              {blocked.data?.length ?? 0}
            </p>
          )}
        </Card>
        <Card className="!p-3">
          <span className="text-xl">⚠️</span>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/55">
            Aktivitas Mencurigakan
          </p>
          {logs.isLoading ? (
            <Skeleton className="mt-1 h-6 w-12" />
          ) : (
            <p className="text-2xl font-bold tabular-nums text-[#FFB800]">
              {logs.data?.length ?? 0}
            </p>
          )}
        </Card>
      </div>

      {/* Blocked users */}
      <Card className="mb-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/55">
          🔒 User Diblokir
        </p>
        {blocked.isLoading ? (
          <Skeleton className="h-16" />
        ) : !blocked.data?.length ? (
          <EmptyState icon="✅" title="Tidak ada user yang diblokir" />
        ) : (
          <ul className="divide-y divide-divider">
            {blocked.data.map((u) => (
              <li key={u._id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{u.username}</p>
                  <p className="text-[11px] text-white/55">
                    {REASON_LABELS[u.blocked_reason ?? ""] ?? u.blocked_reason ?? "—"}
                  </p>
                  <p className="text-[10px] text-white/40">{fmtWIB(u.blocked_at)}</p>
                </div>
                <Button variant="ghost" onClick={() => setConfirm(u)} className="!h-9 !px-3 !text-xs">
                  ✅ Unblock
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Suspicious log */}
      <Card className="mb-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/55">
          ⚠️ Aktivitas Mencurigakan (20 terakhir)
        </p>
        {logs.isLoading ? (
          <Skeleton className="h-16" />
        ) : !logs.data?.length ? (
          <EmptyState icon="🛡️" title="Belum ada aktivitas mencurigakan" />
        ) : (
          <ul className="space-y-2">
            {logs.data.slice(0, 20).map((l) => (
              <li
                key={l._id}
                className={`rounded-xl border px-3 py-2 ${
                  l.is_suspicious
                    ? "border-[#FF453A]/40 bg-[#FF453A]/10"
                    : "border-white/8 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{l.username}</p>
                  {l.is_suspicious && (
                    <span className="rounded-full bg-[#FF453A]/20 px-2 py-0.5 text-[9px] font-bold text-[#FF453A]">
                      ⚠️ SUSPICIOUS
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/65">
                  {REASON_LABELS[l.reason] ?? l.reason}
                </p>
                <p className="text-[10px] text-white/40">{fmtWIB(l.timestamp)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Info */}
      <Card>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/55">
          ℹ️ Info Auto-Block
        </p>
        <p className="text-xs text-white/75">
          User diblokir otomatis jika score ≥ 80.
        </p>
        <ul className="mt-2 space-y-1 text-[11px] text-white/65">
          {Object.entries(REASON_LABELS).map(([k, v]) => (
            <li key={k}>
              <span className="font-mono text-primary">{k}</span>: {v}
            </li>
          ))}
        </ul>
      </Card>

      <BottomSheet open={!!confirm} onClose={() => !busy && setConfirm(null)} title="Unblock User">
        {confirm && (
          <div className="text-center">
            <div className="mb-3 text-4xl">✅</div>
            <p className="text-base font-bold">Unblock {confirm.username}?</p>
            <p className="mt-1 text-xs text-white/55">
              User akan dapat mengakses aplikasi kembali.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" full onClick={() => setConfirm(null)}>
                Batal
              </Button>
              <Button full loading={busy} onClick={doUnblock}>
                Unblock
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
