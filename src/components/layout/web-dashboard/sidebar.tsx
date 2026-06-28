"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  FileText,
  Gauge,
  LifeBuoy,
  LayoutGrid,
  Server,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import isActivePath from "@/lib/utils/isActivePath";

type NavItem = {
  icon: LucideIcon;
  label: string;
  to: string;
  badge?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    title: "Operations",
    items: [
      { icon: LayoutGrid, label: "Overview", to: "/overview" },
      { icon: Gauge, label: "Operations", to: "/operations" },
      { icon: Activity, label: "Monitoring", to: "/monitoring" },
      {
        icon: AlertTriangle,
        label: "Alerts & Tickets",
        to: "/incidents",
        badge: "7",
      },
      { icon: FileText, label: "Audit Logs", to: "/audit" },
    ],
  },
  {
    title: "Manaagement",
    items: [
      { icon: Users, label: "Users", to: "/user-management" },
      { icon: Server, label: "Assets", to: "/assets" },
    ],
  },
];

const footerItems: NavItem[] = [
  { icon: Settings, label: "Settings", to: "/settings" },
  { icon: LifeBuoy, label: "Support", to: "/support" },
];

/* ---------- Render ---------- */
function NavLink({
  icon: Icon,
  label,
  to,
  active,
  badge,
}: NavItem & { active?: boolean }) {
  return (
    <Link
      href={to}
      aria-current={active ? "page" : undefined}
      className={`group flex h-10 w-full items-center gap-3 rounded-xl border px-3 text-sm transition duration-200 ${
        active
          ? "border-cyan/30 bg-cyan/10 text-cyan shadow-[inset_0_0_18px_rgba(0,209,255,0.08)]"
          : "border-transparent text-muted-foreground hover:border-cyan/15 hover:bg-white/2 hover:text-cyan-ice"
      }`}
    >
      <Icon
        className={`size-4 shrink-0 ${active ? "text-cyan" : "group-hover:text-cyan-ice"}`}
        strokeWidth={1.8}
      />
      <span className="label-mono flex-1 text-left text-[10px] tracking-[0.11em]">
        {label}
      </span>
      {badge ? (
        <span className="rounded border border-critical/30 bg-critical/15 px-1.5 py-0.5 text-[9px] font-semibold text-critical">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarSection({
  title,
  items,
  pathname,
}: NavSection & { pathname: string }) {
  return (
    <section className="space-y-2">
      <div className="px-3 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.label}
            {...item}
            active={isActivePath(pathname, item.to)}
          />
        ))}
      </div>
    </section>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="glass hidden h-[calc(100vh-72px)] w-60 shrink-0 flex-col gap-6 border-r border-sidebar-border px-4 py-5 lg:sticky lg:top-18 lg:flex"
      // style={{
      //   background: "rgba(17, 24, 39, 0.85)",
      //   backdropFilter: "blur(14px)",
      //   borderRight: "1px solid rgba(37, 48, 74, 0.6)",
      // }}
    >
      <nav className="space-y-5">
        {sections.map((section) => (
          <SidebarSection
            key={section.title}
            {...section}
            pathname={pathname}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <section className="space-y-2">
          <div className="px-3 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Utilities
          </div>
          <div className="space-y-1">
            {footerItems.map((item) => (
              <NavLink
                key={item.label}
                {...item}
                active={isActivePath(pathname, item.to)}
              />
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
