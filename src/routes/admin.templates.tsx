import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { Card, Button, Input, Label, Skeleton, EmptyState } from "@/components/ui-bits";
import { AdminSubNav } from "./admin.dashboard";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/templates")({
  component: AdminTemplates,
});

interface T {
  _id: string;
  name: string;
  to_email: string;
  subject: string;
  body: string;
  is_active: boolean;
}

function AdminTemplates() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    to_email: "",
    subject: "",
    body: "",
    is_active: false,
  });
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<{ items: T[] }>({
    queryKey: ["admin-templates"],
    queryFn: async () => (await api.get("/template/list")).data,
  });

  const SAMPLE_NOMOR = "+628123456789";
  const preview = useMemo(() => ({
    subject: form.subject.replaceAll("{nomor}", SAMPLE_NOMOR),
    to: form.to_email || "(belum diisi)",
    nomor: SAMPLE_NOMOR,
  }), [form]);

  const save = async () => {
    if (!form.name || !form.subject || !form.body || !form.to_email)
      return toast.error("Lengkapi semua field");
    setBusy(true);
    try {
      const { data: created } = await api.post("/template/add", form);
      toast.success(`✅ Template "${form.name}" tersimpan`);
      const newId = created?._id ?? created?.item?._id ?? null;
      setForm({ name: "", to_email: "", subject: "", body: "", is_active: false });
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

  const setActive = async (id: string) => {
    await api.post(`/template/${id}/set-active`);
    toast.success("Aktif");
    refetch();
  };
  const del = async (id: string) => {
    if (!confirm("Hapus template?")) return;
    await api.delete(`/template/${id}`);
    refetch();
  };

  return (
    <>
      <Header title="Manajemen Template" />
      <AdminSubNav />

      <Card className="mb-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="press flex w-full items-center justify-between"
        >
          <span className="font-semibold">+ Tambah Template</span>
          <span>{open ? "▲" : "▼"}</span>
        </button>
        {open && (
          <div className="mt-4 space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>To Email</Label>
              <Input
                value={form.to_email}
                onChange={(e) => setForm({ ...form, to_email: e.target.value })}
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="gunakan {nomor}"
              />
            </div>
            <div>
              <Label>Body</Label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={5}
                className="w-full rounded-xl border border-white/10 bg-white/7 p-3 text-sm"
                placeholder="gunakan {nomor}"
              />
            </div>
            <Card glow className="!bg-white/3 text-xs">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                Preview Pengiriman
              </p>
              <div className="space-y-1.5 text-white/75">
                <div className="break-all">
                  <span className="text-white/40">📧 To:</span> {preview.to}
                </div>
                <div className="break-all">
                  <span className="text-white/40">📌 Subject:</span> {preview.subject}
                </div>
                <div className="break-all">
                  <span className="text-white/40">📞 Nomor:</span> {preview.nomor}
                </div>
                <div className="mt-2 rounded-lg bg-black/20 px-2 py-1 text-[10px] text-white/40">
                  Body email disembunyikan dari preview pengiriman
                </div>
              </div>
            </Card>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Set sebagai aktif
            </label>
            <Button full loading={busy} onClick={save}>
              Simpan Template
            </Button>
          </div>
        )}
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <EmptyState icon="📝" title="Belum ada template" />
      ) : (
        <ul className="space-y-2">
          {data.items.map((t) => (
            <li key={t._id}>
              <Card
                className={`${
                  t.is_active
                    ? "border-primary/50 shadow-[0_0_16px_rgba(10,132,255,0.2)]"
                    : ""
                } ${
                  highlightId === t._id
                    ? "animate-pulse !border-primary shadow-[0_0_28px_rgba(10,132,255,0.55)]"
                    : ""
                }`}
              >
                <button
                  onClick={() => setExpanded((e) => (e === t._id ? null : t._id))}
                  className="press w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <p className="flex-1 truncate font-semibold">{t.name}</p>
                    {t.is_active && (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-white/55">{t.to_email}</p>
                  <p className="mt-0.5 truncate text-xs text-white/45">{t.subject}</p>
                </button>
                {expanded === t._id && (
                  <div className="mt-3 rounded-lg bg-black/30 p-2 text-xs whitespace-pre-wrap text-white/70">
                    {t.body}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  {!t.is_active && (
                    <Button
                      variant="secondary"
                      className="!h-9 !text-xs !px-3"
                      onClick={() => setActive(t._id)}
                    >
                      Set Aktif
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    className="!h-9 !text-xs !px-3 ml-auto"
                    onClick={() => del(t._id)}
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
