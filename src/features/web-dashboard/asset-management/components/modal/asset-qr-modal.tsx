"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Link2, LoaderCircle, QrCode, ShieldCheck } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { toast } from "sonner";

import ModalLayout from "@/components/layout/modal-layout";
import { useCreateMarkerMutation } from "@/hooks/asset/use-asset-mutations";
import type { MarkerEntity, MarkerTargetType } from "@/types/assets";

export interface AssetQrTarget {
  id: string;
  type: MarkerTargetType;
  code: string;
  name: string;
}

interface AssetQrModalProps {
  target: AssetQrTarget;
  existingMarker?: MarkerEntity;
  onCreated?: (marker: MarkerEntity) => void;
  onClose: () => void;
}

function buildDefaultMarkerCode(target: AssetQrTarget) {
  const normalizedCode = target.code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `AR-${target.type.toUpperCase()}-${normalizedCode || target.id}`;
}

function buildQrPayload(markerCode: string) {
  const webArUrl = process.env.NEXT_PUBLIC_WEBAR_URL?.trim();

  if (webArUrl) {
    try {
      const url = new URL(webArUrl);
      url.searchParams.set("markerCode", markerCode);
      return url.toString();
    } catch {
      // Fall through to the app deep link when the configured URL is invalid.
    }
  }

  return `arimms://ar/marker/${encodeURIComponent(markerCode)}`;
}

export default function AssetQrModal({
  target,
  existingMarker,
  onCreated,
  onClose,
}: AssetQrModalProps) {
  const createMarker = useCreateMarkerMutation();
  const [createdMarker, setCreatedMarker] = useState<MarkerEntity | undefined>();
  const marker = existingMarker ?? createdMarker;
  const [markerCode, setMarkerCode] = useState(
    existingMarker?.markerCode ?? buildDefaultMarkerCode(target),
  );
  const [qrDataUrl, setQrDataUrl] = useState("");

  const qrPayload = useMemo(
    () => buildQrPayload(marker?.markerCode ?? markerCode.trim()),
    [marker?.markerCode, markerCode],
  );

  useEffect(() => {
    let cancelled = false;

    void QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 360,
      color: { dark: "#08111f", light: "#ffffff" },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });

    return () => {
      cancelled = true;
    };
  }, [qrPayload]);

  const handleCreate = () => {
    const normalizedMarkerCode = markerCode.trim();
    if (!normalizedMarkerCode) {
      toast.error("Marker code is required.");
      return;
    }

    createMarker.mutate(
      {
        markerCode: normalizedMarkerCode,
        displayLabel: `${target.name} QR`,
        targetType: target.type,
        targetId: target.id,
        worldTrackingEnabled: true,
        notes: "QR identifies the asset; the shared MindAR image target handles spatial tracking.",
        metadata: {
          qrPayloadVersion: 1,
          identificationMethod: "qr",
          trackingTarget: "shared-mindar",
        },
      },
      {
        onSuccess: (newMarker) => {
          setCreatedMarker(newMarker);
          setMarkerCode(newMarker.markerCode);
          onCreated?.(newMarker);
          toast.success(`QR marker mapped to ${target.code}.`);
        },
        onError: (error: Error) => {
          toast.error(error.message || "Could not create the QR marker.");
        },
      },
    );
  };

  const handleDownload = () => {
    if (!qrDataUrl || !marker) return;

    const anchor = document.createElement("a");
    anchor.href = qrDataUrl;
    anchor.download = `${marker.markerCode}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <ModalLayout
      onClose={onClose}
      eyebrow="ASSET IDENTIFICATION"
      title={`${target.type.toUpperCase()} QR · ${target.code}`}
      isPending={createMarker.isPending}
      maxWidth="max-w-2xl"
    >
      <div className="grid gap-6 overflow-y-auto p-6 md:grid-cols-[240px_1fr]">
        <div className="rounded-2xl border border-cyan/25 bg-white p-4 shadow-[0_0_30px_rgba(0,212,255,0.08)]">
          {qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt={`QR marker ${marker?.markerCode ?? markerCode}`}
              width={360}
              height={360}
              unoptimized
              className="aspect-square w-full"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center text-slate-500">
              <LoaderCircle className="size-8 animate-spin" />
            </div>
          )}
          <div className="mt-3 break-all text-center font-mono text-[10px] font-bold text-slate-900">
            {marker?.markerCode ?? markerCode}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-cyan/20 bg-cyan/5 p-4">
            <div className="flex items-start gap-3">
              <QrCode className="mt-0.5 size-5 shrink-0 text-cyan" />
              <div>
                <div className="text-xs font-semibold text-foreground">
                  QR identifies this {target.type}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground light:text-foreground/70">
                  Scan this code to resolve the backend marker mapping. The
                  shared MindAR image remains the visual target used for AR
                  tracking.
                </p>
              </div>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="label-mono text-[10px] text-muted-foreground light:font-bold">
              MARKER CODE
            </span>
            <input
              value={marker?.markerCode ?? markerCode}
              onChange={(event) => setMarkerCode(event.target.value)}
              disabled={!!marker || createMarker.isPending}
              className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2.5 font-mono text-xs text-foreground outline-none transition focus:border-cyan disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <div className="space-y-2">
            <div className="label-mono text-[10px] text-muted-foreground light:font-bold">
              QR PAYLOAD
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-border/40 bg-background/40 p-3">
              <Link2 className="mt-0.5 size-3.5 shrink-0 text-cyan" />
              <code className="break-all text-[10px] leading-relaxed text-foreground/75">
                {qrPayload}
              </code>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-[10px] text-foreground/75">
            <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
            The QR contains no access token or private asset telemetry.
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-border/40 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={createMarker.isPending}
              className="rounded-lg border border-border/50 px-4 py-2 text-xs font-mono text-muted-foreground transition hover:bg-white/5 hover:text-foreground disabled:opacity-40"
            >
              CLOSE
            </button>
            {marker ? (
              <button
                type="button"
                onClick={handleDownload}
                disabled={!qrDataUrl}
                className="flex items-center gap-2 rounded-lg bg-cyan px-4 py-2 text-xs font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-40"
              >
                <Download className="size-4" /> DOWNLOAD PNG
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                disabled={createMarker.isPending || !markerCode.trim()}
                className="flex items-center gap-2 rounded-lg bg-cyan px-4 py-2 text-xs font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-40"
              >
                {createMarker.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <QrCode className="size-4" />
                )}
                {createMarker.isPending ? "CREATING..." : "CREATE QR MAPPING"}
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalLayout>
  );
}
