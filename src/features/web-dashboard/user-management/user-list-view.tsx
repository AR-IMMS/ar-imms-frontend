"use client";

import { ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import type { RoleCode, UserProfileResponse } from "@/types/auth";
import UserDetailPanel from "./user-detail-panel";
import FilterPill from "@/components/common/filter-pill";
import { ROLE_COLORS } from "./lib/constant";

const SEED: Partial<UserProfileResponse>[] = [
  {
    id: "SE190090",
    fullName: "Vera Kestrel",
    username: "Vera Kestrel",
    email: "vera.kestrel@arimms.io",
    roleCodes: ["IT_ADMINISTRATOR"],
    status: "ACTIVE",
    mustChangePassword: false,
    lastLoginAt: "2m ago",
    department: "DC-01",
  },
  {
    id: "SE190112",
    fullName: "Hiro Tanabe",
    username: "Hiro Tanabe",
    email: "hiro.tanabe@arimms.io",
    roleCodes: ["IT_ADMINISTRATOR"],
    status: "ACTIVE",
    mustChangePassword: false,
    lastLoginAt: "14m ago",
    department: "DC-01",
  },
  {
    id: "SE190145",
    fullName: "Lena Okafor",
    username: "Lena Okafor",
    email: "lena.okafor@arimms.io",
    roleCodes: ["MAINTENANCE_TECHNICIAN"],
    status: "ACTIVE",
    mustChangePassword: true,
    lastLoginAt: "1h ago",
    department: "DC-02",
  },
  {
    id: "SE190178",
    fullName: "Dimitri Roux",
    username: "Dimitri Roux",
    email: "dimitri.roux@arimms.io",
    roleCodes: ["MAINTENANCE_TECHNICIAN"],
    status: "LOCKED",
    mustChangePassword: true,
    lastLoginAt: "—",
    department: "DC-02",
  },
  {
    id: "SE190201",
    fullName: "Aiko Wen",
    username: "Aiko Wen",
    email: "aiko.wen@arimms.io",
    roleCodes: ["SYSTEM_MONITORING_OPERATOR"],
    status: "INACTIVE",
    mustChangePassword: false,
    lastLoginAt: "3d ago",
    department: "DC-03",
  },
  {
    id: "SE190233",
    fullName: "Marcus Vale",
    username: "Marcus Vale",
    email: "marcus.vale@arimms.io",
    roleCodes: ["IT_ADMINISTRATOR"],
    status: "ACTIVE",
    mustChangePassword: false,
    lastLoginAt: "—",
    department: "DC-01",
  },
  {
    id: "SE190256",
    fullName: "Priya Shankar",
    username: "Priya Shankar",
    email: "priya.shankar@arimms.io",
    roleCodes: ["MAINTENANCE_TECHNICIAN"],
    status: "ACTIVE",
    mustChangePassword: false,
    lastLoginAt: "8m ago",
    department: "DC-03",
  },
  {
    id: "SE190290",
    fullName: "Oskar Lind",
    username: "Oskar Lind",
    email: "oskar.lind@arimms.io",
    roleCodes: ["SYSTEM_MONITORING_OPERATOR"],
    status: "LOCKED",
    mustChangePassword: true,
    lastLoginAt: "—",
    department: "DC-02",
  },
];

const PRESETS = ["All Users", "Need Password Reset", "Inactive < 30 days"];

export default function UserListView() {
  const [users, setUsers] = useState<UserProfileResponse[]>(
    () => SEED as UserProfileResponse[],
  );
  const [selected, setSelected] = useState<UserProfileResponse | null>(null);
  const [preset, setPreset] = useState("All Users");
  const [query, setQuery] = useState("");

  const rows = users.filter((u) => {
    if (preset === "Need Password Reset" && !u.mustChangePassword) return false;
    if (preset === "Inactive < 30 days" && u.status !== "INACTIVE")
      return false;
    if (
      query &&
      !`${u.username} ${u.email} ${u.id}`
        .toLowerCase()
        .includes(query.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <>
      <div className="panel space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-9 min-w-65 flex-1 items-center gap-2 rounded-md border border-cyan/15 bg-surface-1 px-3">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or UserID…"
              className="flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <FilterPill label="Role: All" />
          <FilterPill label="Status: All" />
          <FilterPill label="Dept: All" />
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`rounded border px-2.5 py-1.5 text-[10px] transition label-mono ${
                preset === p
                  ? "border-cyan/40 bg-cyan/15 text-cyan shadow-[0_0_12px_rgba(0,209,255,0.2)]"
                  : "border-border bg-surface-1 text-muted-foreground hover:border-cyan/30 hover:text-cyan-ice"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="panel overflow-hidden">
        {/* HEADER */}
        <div className="grid grid-cols-12 border-b border-border bg-surface-1/50 px-4 py-3">
          <div className="col-span-3 label-mono text-[10px]">Full Name</div>
          <div className="col-span-2 label-mono text-[10px]">Username</div>
          <div className="col-span-1 label-mono text-[10px]">User ID</div>
          <div className="col-span-3 label-mono text-[10px] text-center">
            Role
          </div>
          <div className="col-span-2 label-mono text-[10px] text-center">
            Status
          </div>
          <div className="col-span-1 text-right label-mono text-[10px]">
            Actions
          </div>
        </div>

        {/* BODY */}
        {rows.map((u) => (
          <div
            key={u.id}
            onClick={() => setSelected(u as UserProfileResponse)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelected(u as UserProfileResponse);
              }
            }}
            className="group grid w-full grid-cols-12 items-center border-b border-border/60 px-4 py-3 text-left transition hover:bg-cyan/4"
          >
            <div className="col-span-3 flex min-w-0 items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-md bg-linear-to-br from-cyan/30 to-purple/30 text-[11px] font-bold text-foreground">
                {u.username
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm text-foreground">
                  {u.fullName}
                </div>
                <div className="truncate font-mono text-[11px] text-muted-foreground">
                  {u.email}
                </div>
              </div>
            </div>

            <div className="col-span-2 truncate text-sm text-foreground">
              {u.username}
            </div>

            <div className="col-span-1 font-mono text-xs tabular-nums text-cyan-ice">
              {u.id}
            </div>

            <div className="col-span-3 flex justify-center">
              <span
                className={`label-mono rounded border px-2 py-1 text-[10px] ${
                  ROLE_COLORS[u.roleCodes?.[0] as RoleCode] ||
                  "border-white/10 bg-white/5 text-muted-foreground"
                }`}
              >
                {u.roleCodes?.map((role) => role.replace(/_/g, " ")).join(", ")}
              </span>
            </div>

            <div
              className={`col-span-2 font-mono text-xs text-center ${u.status === "ACTIVE" ? "text-neon-green" : u.status === "LOCKED" ? "text-critical" : "text-amber"}`}
            >
              {u.status}
            </div>

            <div className="col-span-1 flex justify-end">
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-cyan-ice" />
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <UserDetailPanel user={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
