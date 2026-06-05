import { RoleBadge } from "./RoleBadge";
import { useAuth } from "@/lib/auth";

export function Header({ title }: { title: string }) {
  const { user } = useAuth();
  return (
    <header className="glass-strong sticky top-0 z-40 -mx-4 mb-4 flex items-center justify-between border-b border-divider px-4 pb-3 safe-top">
      <h1 className="text-[18px] font-bold tracking-tight">{title}</h1>
      {user && <RoleBadge role={user.role} />}
    </header>
  );
}
