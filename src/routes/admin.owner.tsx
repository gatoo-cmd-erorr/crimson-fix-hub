import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { Card, Button, Input, Label, Skeleton, EmptyState } from "@/components/ui-bits";
import { AdminSubNav } from "./admin.dashboard";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/owner")({
  component: AdminOwner,
});

interface O {
  _id: string;
  username?: string;
  telegram_id: string;
  expiry?: string | null;
}

function AdminOwner() {
  const { user } = useAuth();
  const [tg, setTg] = useState("");
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<O[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async (options?: { silent?: boolean }) => {
    if (user?.role !== "superowner") return;
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/admin/owner");
      const nextItems: O[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setItems(nextItems);
    } catch (e: any) {
      console.error("Failed to fetch Owner list:", e);
      setError(e?.response?.data?.message ?? "Gagal memuat daftar owner");
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === "superowner") {
      void fetchList();
    }
  }, [fetchList, user?.role]);

  if (user?.role !== "superowner") {
    return (
      <>
        <Header title="Manajemen Owner" />
        <AdminSubNav />
        <EmptyState icon="🔒" title="Hanya SuperOwner" hint="Halaman ini terkunci." />
      </>
    );
  }

  const add = async () => {
    if (!tg) return toast.error("Isi Telegram ID");
    setBusy(true);
    try {
      const { data: created } = await api.post("/admin/owner/add", { telegram_id: tg, expiry: expiry || null });
      toast.success("Owner ditambahkan");
      const item: O = created?.item ?? created?.user ?? created?.data ?? created ?? {};
      const optimistic: O = {
        _id: item._id ?? `tmp-${Date.now()}`,
        username: item.username,
        telegram_id: item.telegram_id ?? tg,
        expiry: item.expiry ?? expiry ?? null,
      };
      setItems((prev) => [optimistic, ...prev.filter((o) => o._id !== optimistic._id)]);
      setTg("");
      setExpiry("");
      void fetchList({ silent: true });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal");
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Hapus owner?")) return;
    const previous = items;
    setItems((prev) => prev.filter((item) => item._id !== id));
    try {
      await api.delete(`/admin/owner/${id}`);
      toast.success("Owner dihapus");
      void fetchList({ silent: true });
    } catch (e: any) {
      setItems(previous);
      toast.error(e?.response?.data?.message ?? "Gagal");
    }
  };

  return (
    <>
      <Header title="Manajemen Owner" />
      <AdminSubNav />

      <Card className="mb-3 space-y-3">
        <div>
          <Label>Telegram ID</Label>
          <Input value={tg} onChange={(e) => setTg(e.target.value)} />
        </div>
        <div>
          <Label>Expiry (opsional)</Label>
          <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
        <Button full loading={busy} onClick={add}>
          + Tambah Owner
        </Button>
      </Card>

      {error && (
        <Card className="mb-3 flex items-center justify-between gap-3 border-danger/30 bg-danger/10">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-danger">Gagal memuat daftar owner</p>
            <p className="truncate text-xs text-white/65">{error}</p>
          </div>
          <Button variant="secondary" className="!h-9 !px-3 !text-xs" onClick={() => void fetchList()}>
            Retry
          </Button>
        </Card>
      )}

      {loading && !items.length ? (
        <Skeleton className="h-24" />
      ) : !items.length && !error ? (
        <EmptyState icon="👑" title="Belum ada owner" />
      ) : (
        <ul className="space-y-2">
          {items.map((o) => (
            <li key={o._id}>
              <Card className="!p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{o.username ?? o.telegram_id}</p>
                  <p className="text-xs text-white/55">
                    {o.expiry ? new Date(o.expiry).toLocaleDateString("id-ID") : "Permanent"}
                  </p>
                </div>
                <Button
                  variant="danger"
                  className="!h-9 !text-xs !px-3"
                  onClick={() => del(o._id)}
                >
                  Hapus
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
