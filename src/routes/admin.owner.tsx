import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

  const list = useQuery<{ items: O[] }>({
    queryKey: ["admin-owners"],
    queryFn: async () => (await api.get("/admin/owner")).data,
    enabled: user?.role === "superowner",
  });

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
      await api.post("/admin/owner/add", { telegram_id: tg, expiry: expiry || null });
      toast.success("Owner ditambahkan");
      setTg("");
      setExpiry("");
      list.refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal");
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Hapus owner?")) return;
    await api.delete(`/admin/owner/${id}`);
    list.refetch();
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

      {list.isLoading ? (
        <Skeleton className="h-24" />
      ) : !list.data?.items?.length ? (
        <EmptyState icon="👑" title="Belum ada owner" />
      ) : (
        <ul className="space-y-2">
          {list.data.items.map((o) => (
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
