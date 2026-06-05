import type { Role } from "@/lib/auth";

const map: Record<Role, { label: string; cls: string; prefix?: string }> = {
  free: { label: "FREE", cls: "bg-white/10 text-white/70" },
  premium: {
    label: "PREMIUM",
    cls: "text-black bg-[linear-gradient(135deg,#FFB800,#FF8C00)]",
  },
  vip: {
    label: "VIP",
    cls: "text-white bg-[linear-gradient(135deg,#7B2FBE,#4F1B8B)]",
  },
  owner: { label: "OWNER", cls: "bg-primary text-white" },
  superowner: { label: "SUPEROWNER", cls: "bg-primary text-white", prefix: "👑" },
};

export function RoleBadge({ role }: { role: Role }) {
  const r = map[role] ?? map.free;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${r.cls}`}
    >
      {r.prefix && <span>{r.prefix}</span>}
      {r.label}
    </span>
  );
}
