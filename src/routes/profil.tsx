import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { Card, Button, Input, Label } from "@/components/ui-bits";
import { BottomSheet } from "@/components/BottomSheet";
import { RoleBadge } from "@/components/RoleBadge";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/profil")({
  component: ProfilPage,
});

function ProfilPage() {
  const { user, logout } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const stats = useQuery<{
    total_fix: number;
    fix_this_month: number;
  }>({
    queryKey: ["profile-stats"],
    queryFn: async () => (await api.get("/user/me")).data,
  });

  if (!user) return null;
  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <>
      <Header title="Profil Saya" />

      <Card className="mb-3 flex flex-col items-center text-center">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#0A84FF,#0060CC)] text-2xl font-bold">
          {initials}
        </div>
        <h2 className="mt-3 text-xl font-bold">{user.username}</h2>
        <div className="mt-2">
          <RoleBadge role={user.role} />
        </div>
        {user.telegram_id && (
          <p className="mt-2 text-xs text-white/40">TG: {user.telegram_id}</p>
        )}
      </Card>

      <Card className="mb-3 divide-y divide-divider !p-0">
        <Row k="📅 Bergabung" v={user.created_at ? new Date(user.created_at).toLocaleDateString("id-ID") : "-"} />
        <Row k="🔧 Total Fix" v={String(stats.data?.total_fix ?? user.total_fix ?? 0)} />
        <Row
          k="💎 Status"
          v={`${user.role.toUpperCase()}${user.expiry ? " · exp " + new Date(user.expiry).toLocaleDateString("id-ID") : ""}`}
        />
        <Row k="📊 Bulan Ini" v={String(stats.data?.fix_this_month ?? 0)} />
      </Card>

      <Card className="mb-3 divide-y divide-divider !p-0">
        <button
          onClick={() => setShowPw(true)}
          className="press flex w-full items-center justify-between px-4 py-4 text-left"
        >
          <span>🔑 Ganti Password</span>
          <span className="text-white/40">›</span>
        </button>
        {(user.role === "owner" || user.role === "superowner") && (
          <Link
            to="/admin/dashboard"
            className="press flex items-center justify-between px-4 py-4"
          >
            <span>👑 Panel Owner</span>
            <span className="text-white/40">›</span>
          </Link>
        )}
        <button
          onClick={() => setShowLogout(true)}
          className="press flex w-full items-center justify-between px-4 py-4 text-left text-danger"
        >
          <span>🚪 Keluar</span>
          <span className="text-danger/60">›</span>
        </button>
      </Card>

      <ChangePassword open={showPw} onClose={() => setShowPw(false)} />

      <BottomSheet open={showLogout} onClose={() => setShowLogout(false)} title="Keluar">
        <p className="text-sm text-white/65">Yakin ingin logout dari akun ini?</p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" full onClick={() => setShowLogout(false)}>
            Batal
          </Button>
          <Button
            variant="danger"
            full
            onClick={() => {
              setShowLogout(false);
              logout();
            }}
          >
            Ya, Keluar
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-sm text-white/65">{k}</span>
      <span className="text-sm font-semibold">{v}</span>
    </div>
  );
}

function ChangePassword({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [oldP, setOldP] = useState("");
  const [newP, setNewP] = useState("");
  const [conf, setConf] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!oldP || !newP) return toast.error("Lengkapi semua field");
    if (newP !== conf) return toast.error("Konfirmasi tidak cocok");
    setBusy(true);
    try {
      await api.post("/user/change-password", {
        old_password: oldP,
        new_password: newP,
      });
      toast.success("Password diubah");
      onClose();
      setOldP("");
      setNewP("");
      setConf("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Ganti Password">
      <div className="space-y-3">
        <div>
          <Label>Password Lama</Label>
          <Input type="password" value={oldP} onChange={(e) => setOldP(e.target.value)} />
        </div>
        <div>
          <Label>Password Baru</Label>
          <Input type="password" value={newP} onChange={(e) => setNewP(e.target.value)} />
        </div>
        <div>
          <Label>Konfirmasi</Label>
          <Input type="password" value={conf} onChange={(e) => setConf(e.target.value)} />
        </div>
        <Button full loading={busy} onClick={submit}>
          Simpan
        </Button>
      </div>
    </BottomSheet>
  );
}
