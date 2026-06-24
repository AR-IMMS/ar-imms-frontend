"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  EyeOff,
  Eye,
  FileSpreadsheet,
  Rocket,
  Send,
  UploadCloud,
  X,
} from "lucide-react";

type ParsedRow = {
  email: string;
  password: string;
  status: "valid" | "invalid" | "duplicate";
  reason?: string;
};

function randPwd() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let s = "";
  for (let i = 0; i < 14; i++)
    s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function parse(raw: string): ParsedRow[] {
  const seen = new Set<string>();
  return raw
    .split(/[\s,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((email) => {
      const lc = email.toLowerCase();
      if (seen.has(lc))
        return {
          email,
          password: randPwd(),
          status: "duplicate" as const,
          reason: "duplicate",
        };
      seen.add(lc);
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const gmail = lc.endsWith("@gmail.com") || lc.endsWith("@arimms.io");
      if (!valid)
        return {
          email,
          password: randPwd(),
          status: "invalid",
          reason: "malformed",
        };
      if (!gmail)
        return {
          email,
          password: randPwd(),
          status: "invalid",
          reason: "domain not allowed",
        };
      return { email, password: randPwd(), status: "valid" };
    });
}

export default function BulkGmailImport({ onClose }: { onClose: () => void }) {
  const [raw, setRaw] = useState(
    "lena.okafor@gmail.com\ndimitri.roux@gmail.com\naiko.wen@gmail.com\nmarcus.vale@gmail.com\npriya.shankar@gmail.com\nbad-email\ndimitri.roux@gmail.com\nrouge.user@yahoo.com",
  );
  const [reveal, setReveal] = useState<Record<number, boolean>>({});
  const [notify, setNotify] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);

  const rows = useMemo(() => parse(raw), [raw]);
  const valid = rows.filter((r) => r.status === "valid").length;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    f.text().then((t) => setRaw(t));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-lg"
        onClick={onClose}
      />
      <div className="glass relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-cyan/30 p-6 shadow-[0_0_40px_rgba(0,209,255,0.15)]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="label-mono text-[10px] text-cyan-ice">
              BULK ACCOUNT PROVISIONING
            </div>
            <div className="title-display text-lg text-foreground mt-1">
              Gmail List Import
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {!done ? (
          <>
            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
                dragging
                  ? "border-cyan bg-cyan/10 shadow-[0_0_20px_rgba(0,209,255,0.2)]"
                  : "border-border bg-surface-1/60 hover:border-cyan/50"
              }`}
            >
              <UploadCloud
                className={`mx-auto size-8 ${dragging ? "text-cyan" : "text-muted-foreground"}`}
              />
              <div className="title-display text-sm text-foreground mt-2">
                Drop CSV / XLSX file or roster sheet
              </div>
              <div className="font-mono text-[11px] text-muted-foreground mt-1">
                accepts .csv · .xlsx · max 5MB · drag from finder/explorer
              </div>
              <div className="inline-flex items-center gap-2 mt-3 label-mono text-[9px] text-cyan-ice">
                <FileSpreadsheet className="size-3" /> Or paste raw list below
              </div>
            </div>

            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={5}
              className="mt-4 w-full bg-surface-1 border border-border rounded-md p-3 font-mono text-xs text-foreground outline-none focus:border-cyan/40"
              placeholder="paste comma- or newline-separated emails…"
            />

            {/* Live parsing grid */}
            <div className="panel mt-5 overflow-hidden">
              <div className="grid grid-cols-12 border-b border-border bg-surface-1/60 px-4 py-2.5">
                <div className="col-span-5 label-mono text-[10px]">
                  Parsed Email
                </div>
                <div className="col-span-4 label-mono text-[10px]">
                  Generated Password
                </div>
                <div className="col-span-3 label-mono text-[10px]">
                  Validation Status
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {rows.map((r, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 items-center px-4 py-2 border-b border-border/40 font-mono text-xs"
                  >
                    <div className="col-span-5 text-foreground truncate">
                      {r.email}
                    </div>
                    <div className="col-span-4 flex items-center gap-2">
                      <span className="text-cyan-ice tabular-nums">
                        {reveal[i] ? r.password : "•".repeat(r.password.length)}
                      </span>
                      <button
                        onClick={() => setReveal((s) => ({ ...s, [i]: !s[i] }))}
                        className="p-1 rounded hover:bg-white/5"
                      >
                        {reveal[i] ? (
                          <EyeOff className="size-3 text-muted-foreground" />
                        ) : (
                          <Eye className="size-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <div className="col-span-3">
                      {r.status === "valid" ? (
                        <span className="inline-flex items-center gap-1 label-mono text-[10px] text-neon-green">
                          <CheckCircle2 className="size-3" /> VALID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 label-mono text-[10px] text-critical">
                          <AlertCircle className="size-3" />{" "}
                          {r.status.toUpperCase()} · {r.reason}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {rows.length === 0 && (
                  <div className="px-4 py-6 text-center label-mono text-[10px] text-muted-foreground">
                    No entries · paste or drop a file to begin parsing
                  </div>
                )}
              </div>
            </div>

            {/* Execution suite */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2 label-mono text-[10px] text-cyan-ice cursor-pointer">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                  className="accent-cyan size-3.5"
                />
                Send automated access credentials email immediately upon
                creation
              </label>
              <div className="flex items-center gap-3">
                <span className="label-mono text-[10px] text-muted-foreground">
                  {valid} valid · {rows.length - valid} rejected
                </span>
                <button
                  disabled={valid === 0}
                  onClick={() => setDone(true)}
                  className="label-mono inline-flex items-center gap-2 rounded-md bg-linear-to-r from-cyan to-electric px-4 py-2.5 text-xs text-primary-foreground hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] disabled:opacity-50"
                >
                  <Rocket className="size-3.5" /> Execute Asset Provisioning &
                  Notify
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="panel p-8 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full border border-neon-green/40 bg-neon-green/15 shadow-[0_0_24px_rgba(0,255,156,0.3)]">
              <CheckCircle2 className="size-7 text-neon-green" />
            </div>
            <div className="title-display text-base text-foreground mt-4">
              Provisioning Executed · {valid} accounts created
            </div>
            <div className="font-mono text-xs text-muted-foreground mt-2">
              {notify
                ? "Encrypted credential bundles dispatched via SMTP relay · ETA < 30s"
                : "Credentials staged for manual distribution"}
            </div>
            <div className="mt-4 inline-flex items-center gap-2 label-mono text-[10px] text-cyan-ice">
              <Send className="size-3" /> audit event recorded
            </div>
            <button
              onClick={onClose}
              className="label-mono mt-5 rounded-md bg-linear-to-r from-cyan to-electric px-4 py-2 text-xs text-primary-foreground"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
