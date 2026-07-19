"use client";

import { useSyncExternalStore } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTheme } from "next-themes";
import { useUiConfigStore } from "@/stores/ui-config-store";
import { useAuth } from "@/hooks/auth/use-auth";
import { useLogoutMutation } from "@/hooks/auth/use-auth-mutation";
import { getRoleName } from "@/lib/utils/roleConverter";
import { Avatar } from "@/components/common/avatar";
import { ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const emptySubscribe = () => () => {};

export function UserDropdown() {
  const { theme, setTheme } = useTheme();
  const uiTheme = useUiConfigStore((state) => state.theme);
  const setUiTheme = useUiConfigStore((state) => state.setTheme);
  const { user } = useAuth();
  const logoutMutation = useLogoutMutation();

  // Hydration safeguard via useSyncExternalStore to prevent layout shifts and lint errors
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const handleThemeToggle = (checked: boolean) => {
    const nextTheme = checked ? "dark" : "light";
    setTheme(nextTheme);
    setUiTheme(nextTheme);
  };

  const handleLogout = (e: Event) => {
    e.preventDefault();
    logoutMutation.mutate();
  };

  if (!mounted) {
    // Static loading placeholder that perfectly matches the trigger button structure to avoid layout shift
    return (
      <div className="flex items-center gap-2 border-l border-cyan/15 pl-3 select-none opacity-50">
        <Avatar
          avatarUrl={user?.avatarUrl || null}
          fullName={user?.fullName || user?.username || "N/A"}
          size="sm"
          variant="square"
        />
        <div className="hidden md:block leading-tight text-left">
          <div className="text-xs font-medium text-foreground">
            {user?.username || "N/A"}
          </div>
          <div className="label-mono text-[9px] text-muted-foreground">
            {getRoleName(user?.roleCodes?.[0]) || "N/A"}
          </div>
        </div>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </div>
    );
  }

  const activeTheme = theme || uiTheme;
  const isDark = activeTheme === "dark" || activeTheme === "system";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 border-l border-cyan/15 pl-3 select-none focus:outline-none group cursor-pointer text-left">
          <Avatar
            avatarUrl={user?.avatarUrl || null}
            fullName={user?.fullName || user?.username || "N/A"}
            size="sm"
            variant="square"
          />
          <div className="hidden md:block leading-tight">
            <div className="text-xs font-medium text-foreground group-hover:text-cyan group-hover:text-glow-cyan transition-colors">
              {user?.username || "N/A"}
            </div>
            <div className="label-mono text-[9px] text-muted-foreground">
              {getRoleName(user?.roleCodes?.[0]) || "N/A"}
            </div>
          </div>
          <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-cyan transition-colors" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-56 overflow-hidden rounded-xl bg-accent border border-cyan/20 light:border-primary backdrop-blur-md p-1 shadow-lg transition duration-200 outline-none select-none font-mono"
        >
          {/* User Info Header (Static, non-clickable) */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-foreground/15">
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">
                {user?.fullName || user?.username || "N/A"}
              </div>
              <div className="text-[11px] text-muted-foreground font-semibold truncate">
                {user?.email || "N/A"}
              </div>
            </div>
          </div>

          {/* Theme Title */}
          <div className="px-3 pt-2 pb-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest label-mono">
            System Appearance
          </div>

          {/* Theme Toggle Item with Switch */}
          <DropdownMenu.Item
            onSelect={(e: Event) => {
              e.preventDefault();
              handleThemeToggle(!isDark);
            }}
            className="flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition text-foreground/75 light:hover:bg-slate-50 hover:bg-cyan/10"
          >
            <div className="flex items-center gap-2">
              {isDark ? (
                <Moon className="size-3.5 text-cyan dark:text-glow-cyan" />
              ) : (
                <Sun className="size-3.5 text-amber-500" />
              )}
              <span>Theme Mode</span>
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={(checked: boolean) => {
                handleThemeToggle(checked);
              }}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
              }}
            />
          </DropdownMenu.Item>

          {/* Separator */}
          <DropdownMenu.Separator className="h-px bg-foreground/10 my-1" />

          {/* Logout sequence */}
          <DropdownMenu.Item
            onSelect={handleLogout}
            disabled={logoutMutation.isPending}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-400 light:hover:bg-red-50 hover:bg-red-700/25 rounded-md cursor-pointer transition outline-none border border-transparent"
          >
            <LogOut className="size-3.5" />
            <span>Logout</span>
            {logoutMutation.isPending && (
              <span className="ml-auto text-xs opacity-70">...logging out</span>
            )}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
