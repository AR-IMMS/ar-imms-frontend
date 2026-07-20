"use client";

import Header from "@/components/layout/web-dashboard/header";
import BulkGmailImport from "@/features/web-dashboard/user-management/bulk-gmail-import";
import UserListView from "@/features/web-dashboard/user-management/user-list-view";
import AddUserModal from "@/features/web-dashboard/user-management/add-user-modal";
import { Plus, Upload } from "lucide-react";
import { useState } from "react";

export default function UserManagementPage() {
  const [importOpen, setImportOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  
  return (
    <div className="flex flex-col gap-6 p-6">
      <Header
        eyebrow="ADMIN // IDENTITY CONTROL"
        title="User Management"
        actions={
          <>
            <button
              onClick={() => setImportOpen(true)}
              disabled={true}
              className="glass rounded-lg px-3 py-2 text-xs label-mono text-cyan-ice hover:border-cyan/50 transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="size-3.5" /> Bulk Import Users
            </button>
            <button
              onClick={() => setAddUserOpen(true)}
              disabled={importOpen}
              className="rounded-lg px-3 py-2 text-xs label-mono bg-gradient-to-r from-cyan to-electric text-primary-foreground light:text-destructive-foreground light:font-bold hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="size-3.5" /> Add User
            </button>
          </>
        }
      />

      <UserListView />

      {importOpen && <BulkGmailImport onClose={() => setImportOpen(false)} />}
      {addUserOpen && <AddUserModal onClose={() => setAddUserOpen(false)} />}
    </div>
  );
}
