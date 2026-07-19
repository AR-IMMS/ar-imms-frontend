"use client";

import { ChevronRight } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import type { RoleCode, UserProfileResponse, UserStatus } from "@/types/auth";
import CopyableUserId from "@/components/common/copyable-user-id";
import UserDetailPanel from "./user-detail-panel";
import { ROLE_COLORS } from "./lib/constant";
import { ListUsersRequest } from "@/types/users";
import {
  useRolesQuery,
  useUsersQuery,
} from "@/hooks/identity/use-identity-queries";
import UserListFilters from "./components/user-list-filters";
import Pagination from "@/components/common/pagination";
import { Avatar } from "@/components/common/avatar";

type RoleFilter = RoleCode | "ALL";
type StatusFilter = UserStatus | "ALL";
type MenuKey = "role" | "status" | null;

function getRoleLabel(
  roleCode: RoleCode,
  roleNameMap: Map<RoleCode, string>,
): string {
  return roleNameMap.get(roleCode) ?? roleCode.replace(/_/g, " ");
}

function getRoleTone(roleCode: RoleCode): string {
  return (
    ROLE_COLORS[roleCode] ?? "border-white/10 bg-white/5 text-muted-foreground"
  );
}

export default function UserListView() {
  const [search, setSearch] = useState("");
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("ALL");
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const deferredSearch = useDeferredValue(search.trim());

  const params: ListUsersRequest = useMemo(() => {
    const listParams: ListUsersRequest = {
      page: currentPage,
      limit: 20,
      sortBy: "createdAt",
      sortDirection: "desc",
    };

    if (selectedStatus !== "ALL") {
      listParams.status = selectedStatus;
    }

    if (selectedRole !== "ALL") {
      listParams.roleCodes = [selectedRole];
    }

    const trimmedSearch = deferredSearch.trim();
    if (trimmedSearch) {
      if (trimmedSearch.includes("@")) {
        listParams.email = trimmedSearch;
      } else {
        listParams.username = trimmedSearch;
      }
    }

    return listParams;
  }, [currentPage, deferredSearch, selectedRole, selectedStatus]);

  const rolesQuery = useRolesQuery();
  const usersQuery = useUsersQuery(params);
  const roleOptions = rolesQuery.data ?? [];

  const roleNameMap = useMemo(() => {
    return new Map(
      (rolesQuery.data ?? []).map((role) => [role.code, role.name] as const),
    );
  }, [rolesQuery.data]);

  const users = useMemo(
    () => usersQuery.data?.items ?? [],
    [usersQuery.data?.items],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  function selectRoleFilter(roleCode: RoleFilter) {
    setSelectedRole(roleCode);
    setCurrentPage(1);
    setOpenMenu(null);
  }

  function selectStatusFilter(status: StatusFilter) {
    setSelectedStatus(status);
    setCurrentPage(1);
    setOpenMenu(null);
  }

  const selectedRoleLabel =
    selectedRole === "ALL"
      ? "All"
      : (roleNameMap.get(selectedRole) ?? selectedRole.replace(/_/g, " "));

  const selectedUser = useMemo(() => {
    if (!selectedUsername) {
      return null;
    }

    return (
      users.find(
        (user: UserProfileResponse) => user.username === selectedUsername,
      ) ?? null
    );
  }, [selectedUsername, users]);

  return (
    <>
      <UserListFilters
        search={search}
        onSearchChange={handleSearchChange}
        roleOptions={roleOptions}
        selectedRole={selectedRole}
        selectedRoleLabel={selectedRoleLabel}
        selectedStatus={selectedStatus}
        onSelectRole={selectRoleFilter}
        onSelectStatus={selectStatusFilter}
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
      />

      <div className="panel flex flex-col overflow-hidden">
        <div className="grid grid-cols-12 border-b border-border bg-surface-1/50 light:bg-accent px-4 py-3 shrink-0">
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

        <div className="h-[600px] overflow-y-auto min-h-[300px] divide-y divide-border/40">
          {usersQuery.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-lg border border-border/60 bg-surface-1/40"
                />
              ))}
            </div>
          ) : usersQuery.isError ? (
            <div className="p-6 text-sm text-center text-muted-foreground">
              Failed to load users list.
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-sm text-center text-muted-foreground">
              No users match the current filters.
            </div>
          ) : (
            users.map((user: UserProfileResponse, index: number) => {
              const roleCode = user.roleCodes?.[0];
              const roleLabel = roleCode
                ? getRoleLabel(roleCode, roleNameMap)
                : "N/A";

              return (
                <div
                  key={user.id || `user-key-${user.username || index}-${index}`}
                  onClick={() => setSelectedUsername(user.username)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedUsername(user.username);
                    }
                  }}
                  className="group grid w-full grid-cols-12 items-center border-b border-border/60 px-4 py-3 text-left transition light:bg-muted hover:bg-cyan/4 light:hover:bg-white"
                >
                  <div className="col-span-3 flex min-w-0 items-center gap-3">
                    <Avatar
                      avatarUrl={user.avatarUrl}
                      fullName={user.fullName || user.username || "User"}
                      variant="square"
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm text-foreground">
                        {user.fullName || "N/A"}
                      </div>
                      <div className="truncate font-mono text-[11px] text-muted-foreground">
                        {user.email || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 truncate text-sm text-foreground">
                    {user.username || "N/A"}
                  </div>

                  <div className="col-span-1 min-w-0">
                    <CopyableUserId value={user.id || ""} />
                  </div>

                  <div className="col-span-3 flex justify-center">
                    <span
                      className={`label-mono rounded border px-2 py-1 text-[10px] ${roleCode ? getRoleTone(roleCode) : "border-white/10 bg-white/5 text-muted-foreground"}`}
                    >
                      {user.roleCodes && user.roleCodes.length > 1
                        ? `${roleLabel} +${user.roleCodes.length - 1}`
                        : roleLabel}
                    </span>
                  </div>

                  <div
                    className={`col-span-2 font-mono text-xs text-center light:font-bold ${user.status === "ACTIVE" ? "text-neon-green" : user.status === "LOCKED" ? "text-critical" : "text-amber"}`}
                  >
                    {user.status}
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-cyan-ice" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
        <span>
          Loaded {users.length} of{" "}
          {usersQuery.data?.pageInfo.totalItems ?? users.length}
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={usersQuery.data?.pageInfo.totalPages ?? 1}
          onPageChange={setCurrentPage}
          isLoading={usersQuery.isFetching}
        />
      </div>

      {selectedUser ? (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUsername(null)}
          roleNameMap={roleNameMap}
        />
      ) : null}
    </>
  );
}
