"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { TicketPriority, TicketStatus } from "@/types/ticket";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "../lib/ticket-ui";

type AssigneeFilter = "ALL" | "UNASSIGNED" | string;
type MenuKey = "priority" | "status" | "assignee" | null;

type TicketListFiltersProps = {
  search: string;
  priority: TicketPriority | "ALL";
  status: TicketStatus | "ALL";
  assignee: AssigneeFilter;
  assigneeOptions: Array<{ id: string; label: string }>;
  onSearchChange: (value: string) => void;
  onPriorityChange: (value: TicketPriority | "ALL") => void;
  onStatusChange: (value: TicketStatus | "ALL") => void;
  onAssigneeChange: (value: AssigneeFilter) => void;
};

export default function TicketListFilters({
  search,
  priority,
  status,
  assignee,
  assigneeOptions,
  onSearchChange,
  onPriorityChange,
  onStatusChange,
  onAssigneeChange,
}: TicketListFiltersProps) {
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);

  const assigneeLabel = useMemo(() => {
    if (assignee === "ALL") {
      return "All";
    }

    if (assignee === "UNASSIGNED") {
      return "Unassigned";
    }

    return (
      assigneeOptions.find((option) => option.id === assignee)?.label ??
      "Technician"
    );
  }, [assignee, assigneeOptions]);

  const activeFilters = [
    priority !== "ALL" ? `Priority: ${priority}` : null,
    status !== "ALL" ? `Status: ${status}` : null,
    assignee !== "ALL" ? `Assign Tech: ${assigneeLabel}` : null,
  ].filter((label): label is string => Boolean(label));

  return (
    <div className="panel space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-11 min-w-70 flex-1 items-center gap-2 rounded-lg border border-cyan/15 bg-surface-1 px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by ticket code, title, or technician..."
            className="flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </label>

        <FilterDropdown
          menuKey="priority"
          label="Priority"
          value={priority === "ALL" ? "All" : priority}
          openMenu={openMenu}
          onOpenMenu={setOpenMenu}
          active={priority !== "ALL"}
        >
          <FilterItem
            label="All Priorities"
            selected={priority === "ALL"}
            onSelect={() => onPriorityChange("ALL")}
          />
          {PRIORITY_OPTIONS.filter((option) => option !== "ALL").map(
            (option) => (
              <FilterItem
                key={option}
                label={option}
                selected={priority === option}
                onSelect={() => onPriorityChange(option)}
              />
            ),
          )}
        </FilterDropdown>

        <FilterDropdown
          menuKey="status"
          label="Status"
          value={status === "ALL" ? "All" : status}
          openMenu={openMenu}
          onOpenMenu={setOpenMenu}
          active={status !== "ALL"}
        >
          <FilterItem
            label="All Statuses"
            selected={status === "ALL"}
            onSelect={() => onStatusChange("ALL")}
          />
          {STATUS_OPTIONS.filter((option) => option !== "ALL").map((option) => (
            <FilterItem
              key={option}
              label={option}
              selected={status === option}
              onSelect={() => onStatusChange(option)}
            />
          ))}
        </FilterDropdown>

        <FilterDropdown
          menuKey="assignee"
          label="Assign Tech"
          value={assigneeLabel}
          openMenu={openMenu}
          onOpenMenu={setOpenMenu}
          active={assignee !== "ALL"}
          menuClassName="w-72"
        >
          <FilterItem
            label="All Technicians"
            selected={assignee === "ALL"}
            onSelect={() => onAssigneeChange("ALL")}
          />
          <FilterItem
            label="Unassigned"
            selected={assignee === "UNASSIGNED"}
            onSelect={() => onAssigneeChange("UNASSIGNED")}
          />
          {assigneeOptions.map((option) => (
            <FilterItem
              key={option.id}
              label={option.label}
              selected={assignee === option.id}
              onSelect={() => onAssigneeChange(option.id)}
            />
          ))}
        </FilterDropdown>
      </div>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (label.startsWith("Priority")) {
                  onPriorityChange("ALL");
                } else if (label.startsWith("Status")) {
                  onStatusChange("ALL");
                } else {
                  onAssigneeChange("ALL");
                }
              }}
              className="inline-flex items-center gap-2 rounded-md border border-cyan/30 bg-cyan/10 px-3 py-1.5 text-[10px] text-cyan-ice transition hover:border-cyan/50"
            >
              <span className="label-mono">{label}</span>
              <X className="size-3.5" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FilterDropdown({
  menuKey,
  label,
  value,
  openMenu,
  active,
  children,
  menuClassName = "w-52",
  onOpenMenu,
}: {
  menuKey: Exclude<MenuKey, null>;
  label: string;
  value: string;
  openMenu: MenuKey;
  active: boolean;
  children: ReactNode;
  menuClassName?: string;
  onOpenMenu: (menu: MenuKey) => void;
}) {
  const isOpen = openMenu === menuKey;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => onOpenMenu(isOpen ? null : menuKey)}
        className={`inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-xs transition ${
          active || isOpen
            ? "border-cyan/45 bg-cyan/10 text-cyan-ice"
            : "border-border bg-surface-1 text-muted-foreground hover:border-cyan/30 hover:text-cyan-ice"
        }`}
      >
        <span className="label-mono text-[10px]">{label}</span>
        <span className="label-mono max-w-28 truncate text-[10px]">
          {value}
        </span>
        <ChevronDown className="size-3.5" />
      </button>

      {isOpen ? (
        <div
          className={`absolute left-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-xl border border-cyan/40 bg-surface-2 py-2 shadow-[0_22px_50px_rgba(0,0,0,0.45)] ${menuClassName}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function FilterItem({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
        selected ? "bg-cyan/10 text-cyan-ice" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      }`}
    >
      <span className="label-mono text-[11px]">{label}</span>
    </button>
  );
}
