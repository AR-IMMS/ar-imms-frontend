"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
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
import { useSidebar } from "@/hooks/common/use-ui-config";
import { Tooltip } from "@/components/common/tooltip";

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
    title: "Management",
    items: [
      { icon: Users, label: "Users", to: "/users" },
      { icon: Server, label: "Assets", to: "/assets" },
    ],
  },
];

const footerItems: NavItem[] = [
  { icon: Settings, label: "Settings", to: "/settings" },
  { icon: LifeBuoy, label: "Support", to: "/support" },
];

/* ---------- Helper Components ---------- */
function NavLink({
  icon: Icon,
  label,
  to,
  active,
  badge,
  isCollapsed,
}: NavItem & { active?: boolean; isCollapsed: boolean }) {
  const content = (
    <Link
      href={to}
      aria-current={active ? "page" : undefined}
      className={`group/link relative flex h-10 items-center rounded-xl border text-sm transition-all duration-200 ${
        isCollapsed
          ? "w-10 h-10 justify-center px-0 mx-auto"
          : "w-full px-3 gap-3"
      } ${
        active
          ? "border-cyan/30 bg-cyan/10 text-cyan light:bg-destructive-foreground hover:light:bg-destructive-foreground/70"
          : "border-transparent text-muted-foreground hover:border-cyan/15 hover:bg-muted-foreground/10 hover:text-cyan-ice"
      }`}
    >
      <Icon
        className={`size-4 shrink-0 transition-colors duration-200 ${
          active ? "text-cyan" : "group-hover/link:text-cyan-ice"
        }`}
        strokeWidth={1.8}
      />
      {!isCollapsed && (
        <span className="label-mono light:font-bold flex-1 text-left text-[10px] tracking-[0.11em] truncate">
          {label}
        </span>
      )}
      {!isCollapsed && badge && (
        <span className="rounded border border-critical/30 bg-critical/15 px-1.5 py-0.5 text-[9px] font-semibold text-critical">
          {badge}
        </span>
      )}
      {isCollapsed && badge && (
        <span className="absolute top-1 right-1 size-2 rounded-full bg-critical border border-background shadow-[0_0_6px_rgba(255,77,109,0.5)]" />
      )}
    </Link>
  );

  return (
    <Tooltip content={label} enabled={isCollapsed}>
      {content}
    </Tooltip>
  );
}

function SidebarSection({
  title,
  items,
  pathname,
  isCollapsed,
  showDivider,
}: NavSection & {
  pathname: string;
  isCollapsed: boolean;
  showDivider: boolean;
}) {
  return (
    <section className="space-y-2">
      {isCollapsed ? (
        showDivider && (
          <div className="border-t border-sidebar-border/30 mx-2 my-2" />
        )
      ) : (
        <div className="px-3 text-[10px] uppercase tracking-[0.28em] text-muted-foreground truncate">
          {title}
        </div>
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.label}
            {...item}
            active={isActivePath(pathname, item.to)}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>
    </section>
  );
}

/* ---------- Render ---------- */

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div
      className={`glass hidden h-[calc(100vh-60px)] z-20 shrink-0 flex-col gap-6 border-r border-sidebar-border py-5 lg:sticky lg:top-18 lg:flex transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-16 px-2" : "w-60 px-4"
      }`}
    >
      <nav className="space-y-5">
        {sections.map((section, idx) => (
          <SidebarSection
            key={section.title}
            {...section}
            pathname={pathname}
            isCollapsed={isCollapsed}
            showDivider={idx > 0}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <section className="space-y-2">
          {isCollapsed ? (
            <div className="border-t border-sidebar-border/30 mx-2 my-2" />
          ) : (
            <div className="px-3 text-[10px] uppercase tracking-[0.28em] text-muted-foreground truncate">
              Utilities
            </div>
          )}
          <div className="space-y-1">
            {footerItems.map((item) => (
              <NavLink
                key={item.label}
                {...item}
                active={isActivePath(pathname, item.to)}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </section>

        <Tooltip content="Expand Sidebar" enabled={isCollapsed}>
          <button
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`group/toggle relative flex h-10 items-center rounded-xl border text-sm transition-all duration-200 cursor-pointer ${
              isCollapsed
                ? "w-10 h-10 justify-center px-0 mx-auto"
                : "w-full px-3 gap-3"
            } border-transparent text-muted-foreground hover:border-cyan/15 hover:bg-muted-foreground/10 hover:text-cyan-ice`}
          >
            <ChevronLeft
              className={`size-4 shrink-0 transition-transform duration-300 ${
                isCollapsed
                  ? "rotate-180 text-cyan-ice"
                  : "group-hover/toggle:text-cyan-ice"
              }`}
              strokeWidth={1.8}
            />
            {!isCollapsed && (
              <span className="label-mono flex-1 text-left text-[10px] tracking-[0.11em] truncate">
                Collapse
              </span>
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
