import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

const userTabs = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/fix", label: "Fix", icon: "🔧" },
  { to: "/history", label: "History", icon: "📋" },
  { to: "/referral", label: "Referral", icon: "👥" },
  { to: "/profil", label: "Profil", icon: "👤" },
] as const;

const ownerTabs = [
  { to: "/admin/dashboard", label: "Dash", icon: "📊" },
  { to: "/admin/users", label: "Users", icon: "👥" },
  { to: "/admin/gmail", label: "Gmail", icon: "📧" },
  { to: "/admin/templates", label: "Template", icon: "📝" },
  { to: "/admin/settings", label: "Set", icon: "⚙️" },
] as const;

export function BottomNav() {
  const { user } = useAuth();
  const { location } = useRouterState();
  if (!user) return null;

  const inAdmin = location.pathname.startsWith("/admin");
  const tabs = inAdmin ? ownerTabs : userTabs;

  return (
    <nav
      className="glass-strong fixed inset-x-0 bottom-0 z-50 border-t border-divider"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
      }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 px-2 pt-2">
        {tabs.map((t) => {
          const active =
            t.to === "/"
              ? location.pathname === "/"
              : location.pathname === t.to ||
                location.pathname.startsWith(t.to + "/");
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className="press flex flex-col items-center gap-0.5 py-1.5"
              >
                <span
                  className={`h-1 w-1 rounded-full transition-all ${active ? "bg-primary" : "bg-transparent"}`}
                />
                <span
                  className={`text-[22px] leading-none transition-all ${active ? "" : "grayscale opacity-60"}`}
                >
                  {t.icon}
                </span>
                <span
                  className={`text-[10px] font-semibold tracking-wide ${active ? "text-primary" : "text-white/40"}`}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
