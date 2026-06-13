import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { Card, Button, Input, Label, Skeleton, EmptyState } from "@/components/ui-bits";
import { BottomSheet } from "@/components/BottomSheet";
import { RoleBadge } from "@/components/RoleBadge";
import { AdminSubNav } from "./admin.dashboard";
import { api } from "@/lib/api";
import type { Role } from "@/lib/auth";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

interface U {
  _id: string;
  username: string;
  telegram_id?: string;
  role: Role;
  status: "active" | "inactive";
  total_fix: number;
  expiry?: string | null;
}

const FILTERS = ["all", "free", "premium", "vip", "owner", "inactive"] as const;

function AdminUsers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [editing, setEditing] = useState<U | null>(null);
  const [creating, setCreating] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const qc = useQueryClient();

  const queryKey = ["admin-users", search, filter] as const;
  const { data, isLoading, refetch } = useQuery<{ items: U[] }>({
    queryKey,
    queryFn: async () =>
      (
        await api.get("/admin/users", {
          params: { search: search || undefined, role: filter === "all" ? undefined : filter },
        })
      ).data,
  });

  const onCreated = (item: U) => {
    qc.setQueryData<{ items: U[] }>(queryKey, (old) => ({
      items: [item, ...(old?.items ?? []).filter((u) => u._id !== item._id)],
    }));
    if (item._id) {
      setHighlightId(item._id);
      setTimeout(() => setHighlightId(null), 3000);
    }
    refetch();
  };

  const del = async (id: string) => {
    if (!confirm("Hapus user ini?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("Dihapus");
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal");
    }
  };

  const resetPw = async (id: string) => {
    if (!confirm("Reset password user?")) return;
    try {
      const { data } = await api.post(`/admin/users/${id}/reset-password`);
      toast.success(`Password baru: ${data.password}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal");
    }
  };

  return (
    <>
      <Header title="Manajemen User" />
      <AdminSubNav />

      <Input
        placeholder="🔍 Cari username / TG ID"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`press shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${filter === f ? "bg-primary text-white" : "bg-white/8 text-white/65"}`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <EmptyState icon="👤" title="Belum ada user" />
      ) : (
        <ul className="space-y-2">
          {data.items.map((u) => (
            <li key={u._id}>
              <Card className={`!p-3 ${highlightId === u._id ? "animate-pulse !border-primary shadow-[0_0_28px_rgba(232,25,44,0.55)]" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{u.username}</p>
                      <RoleBadge role={u.role} />
                    </div>
                    <p className="mt-0.5 text-xs text-white/55">
                      TG {u.telegram_id ?? "-"} · {u.total_fix} fix
                    </p>
                  </div>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${u.status === "active" ? "bg-success" : "bg-white/30"}`}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    className="!h-9 !text-xs !px-3"
                    onClick={() => setEditing(u)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    className="!h-9 !text-xs !px-3"
                    onClick={() => resetPw(u._id)}
                  >
                    Reset PW
                  </Button>
                  <Button
                    variant="danger"
                    className="!h-9 !text-xs !px-3 ml-auto"
                    onClick={() => del(u._id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setCreating(true)}
        className="press fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-white shadow-[0_8px_24px_rgba(10,132,255,0.5)]"
      >
        +
      </button>

      <UserForm
        open={creating}
        onClose={() => setCreating(false)}
        onDone={() => refetch()}
      />
      <UserForm
        open={!!editing}
        editing={editing}
        onClose={() => setEditing(null)}
        onDone={() => refetch()}
      />
    </>
  );
}

function UserForm({
  open,
  onClose,
  editing,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  editing?: U | null;
  onDone: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("free");
  const [tg, setTg] = useState("");
  const [expiry, setExpiry] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);

  useState(() => {
    if (editing) {
      setUsername(editing.username);
      setRole(editing.role);
      setTg(editing.telegram_id ?? "");
      setExpiry(editing.expiry?.slice(0, 10) ?? "");
      setActive(editing.status === "active");
    }
  });

  const submit = async () => {
    setBusy(true);
    try {
      if (editing) {
        await api.put(`/admin/users/${editing._id}`, {
          role,
          expiry: expiry || null,
          status: active ? "active" : "inactive",
        });
        toast.success("Tersimpan");
      } else {
        if (!username || !password) {
          setBusy(false);
          return toast.error("Wajib isi username & password");
        }
        await api.post("/admin/users/create", {
          username,
          password,
          role,
          telegram_id: tg || null,
          expiry: expiry || null,
        });
        toast.success("User dibuat");
      }
      onDone();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={editing ? "Edit User" : "Buat User"}>
      <div className="space-y-3">
        {!editing && (
          <>
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <Label>Password</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <Label>Telegram ID</Label>
              <Input value={tg} onChange={(e) => setTg(e.target.value)} />
            </div>
          </>
        )}
        <div>
          <Label>Role</Label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="h-12 w-full rounded-xl border border-white/10 bg-white/7 px-3 text-sm"
          >
            <option value="free">FREE</option>
            <option value="premium">PREMIUM</option>
            <option value="vip">VIP</option>
            <option value="owner">OWNER</option>
          </select>
        </div>
        <div>
          <Label>Expiry (opsional)</Label>
          <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
        {editing && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Aktif
          </label>
        )}
        <Button full loading={busy} onClick={submit}>
          Simpan
        </Button>
      </div>
    </BottomSheet>
  );
}
