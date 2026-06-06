import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { Card, Button, Input, Label, Skeleton, EmptyState, Switch } from "@/components/ui-bits";
import { AdminSubNav } from "./admin.dashboard";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/premium")({
  component: AdminPremium,
});

interface P {
  _id: string;
  username?: string;
  telegram_id: string;
  expiry?: string | null;
  status: "active" | "expired";
}

const DURATIONS = [
  { label: "7 Hari", days: 7 },
  { label: "30 Hari", days: 30 },
  { label: "90 Hari", days: 90 },
  { label: "Permanent", days: 0 },
];

function AdminPremium() {
  const [tg, setTg] = useState("");
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [gratis, setGratis] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const list = useQuery<{ items: P[] }>({
    queryKey: ["admin-premium"],
    queryFn: async () => (await api.get("/admin/premium")).data,
  });
  const settings = useQuery<{ fix_gratis_open: boolean }>({
    queryKey: ["settings-public"],
    queryFn: async () => {
      const { data } = await api.get("/admin/settings");
      setGratis(!!data.fix_gratis_open);
      return data;
    },
  });

  const previewExpiry = useMemo(() => {
    if (days === 0) return "Permanent";
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [days]);

  const add = async () => {
    if (!tg) return toast.error("Isi Telegram ID");
    setBusy(true);
    try {
      const { data: created } = await api.post("/admin/premium/add", {
        telegram_id: tg,
        days,
      });
      toast.success(`✅ Premium ${days === 0 ? "Permanent" : days + " hari"} ditambahkan`);
      const newId = created?._id ?? created?.item?._id ?? null;
      setTg("");
      await list.refetch();
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
    if (!confirm("Hapus premium?")) return;
    await api.delete(`/admin/premium/${id}`);
    list.refetch();
  };

  const toggleGratis = async (v: boolean) => {
    setGratis(v);
    await api.post("/admin/settings", { fix_gratis_open: v });
    toast.success(v ? "Fix Gratis ON" : "Fix Gratis OFF");
  };

  return (
    <>
      <Header title="Manajemen Premium" />
      <AdminSubNav />

      <Card className="mb-3 space-y-3">
        <div>
          <Label>Telegram ID</Label>
          <Input value={tg} onChange={(e) => setTg(e.target.value)} placeholder="123456789" />
        </div>
        <div>
          <Label>Durasi</Label>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.days}
                onClick={() => setDays(d.days)}
                className={`press rounded-full px-3 py-1.5 text-xs font-semibold ${days === d.days ? "bg-primary text-white" : "bg-white/8 text-white/65"}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <Button full loading={busy} onClick={add}>
          + Tambah Premium
        </Button>
      </Card>

      <Card className="mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Fix Gratis</p>
            <p className="mt-0.5 text-xs text-white/55">
              Aktifkan agar FREE user bisa fix tanpa limit
            </p>
          </div>
          <Switch checked={gratis} onChange={toggleGratis} />
        </div>
      </Card>

      {list.isLoading ? (
        <Skeleton className="h-24" />
      ) : !list.data?.items?.length ? (
        <EmptyState icon="💎" title="Belum ada premium" />
      ) : (
        <ul className="space-y-2">
          {list.data.items.map((p) => (
            <li key={p._id}>
              <Card className="!p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{p.username ?? p.telegram_id}</p>
                    <p className="text-xs text-white/55">
                      {p.expiry ? new Date(p.expiry).toLocaleDateString("id-ID") : "Permanent"} ·{" "}
                      <span
                        className={
                          p.status === "active" ? "text-success" : "text-warning"
                        }
                      >
                        {p.status}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    className="!h-9 !text-xs !px-3"
                    onClick={() => del(p._id)}
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
