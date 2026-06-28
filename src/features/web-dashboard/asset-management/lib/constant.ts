import { DC, NodeAsset } from "@/types/assets";

export const DATA: DC[] = [
  {
    id: "dc-01",
    name: "Data Center · MDC-Alpha",
    region: "us-west-2a",
    racks: [
      {
        id: "rk-a01", name: "Rack A-01", slots: 12,
        nodes: [
          { id: "nd-001", name: "node-alpha-01", ip: "10.42.1.11", mac: "AC:DE:48:00:11:01", cpu: "Intel i7-12700 · 12c", ram: "32 GB DDR5", storage: "1 TB NVMe", status: "online", marker: "ARUCO-0142", slot: 1, power: 142, temp: 48 },
          { id: "nd-002", name: "node-alpha-02", ip: "10.42.1.12", mac: "AC:DE:48:00:11:02", cpu: "Intel i7-12700 · 12c", ram: "32 GB DDR5", storage: "1 TB NVMe", status: "warning", marker: "ARUCO-0143", slot: 2, power: 168, temp: 71 },
          { id: "nd-003", name: "node-alpha-03", ip: "10.42.1.13", mac: "AC:DE:48:00:11:03", cpu: "AMD R7 5800X · 8c", ram: "64 GB DDR4", storage: "2 TB NVMe", status: "online", marker: null, slot: 3, power: 138, temp: 51 },
          { id: "nd-004", name: "node-alpha-04", ip: "10.42.1.14", mac: "AC:DE:48:00:11:04", cpu: "Intel i9-13900 · 24c", ram: "64 GB DDR5", storage: "2 TB NVMe", status: "critical", marker: "ARUCO-0145", slot: 4, power: 212, temp: 84 },
          { id: "nd-005", name: "node-alpha-05", ip: "10.42.1.15", mac: "AC:DE:48:00:11:05", cpu: "Intel i7-12700 · 12c", ram: "32 GB DDR5", storage: "1 TB NVMe", status: "online", marker: "ARUCO-0146", slot: 5, power: 140, temp: 47 },
          { id: "nd-006", name: "node-alpha-06", ip: "10.42.1.16", mac: "AC:DE:48:00:11:06", cpu: "Intel i7-12700 · 12c", ram: "32 GB DDR5", storage: "1 TB NVMe", status: "offline", marker: null, slot: 6, power: 0, temp: 22 },
          { id: "nd-007", name: "node-alpha-07", ip: "10.42.1.17", mac: "AC:DE:48:00:11:07", cpu: "AMD R9 7900X · 12c", ram: "64 GB DDR5", storage: "4 TB NVMe", status: "online", marker: "ARUCO-0148", slot: 7, power: 156, temp: 53 },
          { id: "nd-008", name: "node-alpha-08", ip: "10.42.1.18", mac: "AC:DE:48:00:11:08", cpu: "Intel i7-12700 · 12c", ram: "32 GB DDR5", storage: "1 TB NVMe", status: "online", marker: "ARUCO-0149", slot: 8, power: 144, temp: 49 },
        ],
      },
      {
        id: "rk-a02", name: "Rack A-02", slots: 12,
        nodes: [
          { id: "nd-010", name: "node-bravo-01", ip: "10.42.2.11", mac: "AC:DE:48:00:12:01", cpu: "Intel Xeon E-2388G", ram: "128 GB ECC", storage: "8 TB NVMe RAID", status: "online", marker: "ARUCO-0201", slot: 1, power: 220, temp: 55 },
          { id: "nd-011", name: "node-bravo-02", ip: "10.42.2.12", mac: "AC:DE:48:00:12:02", cpu: "Intel Xeon E-2388G", ram: "128 GB ECC", storage: "8 TB NVMe RAID", status: "warning", marker: null, slot: 2, power: 232, temp: 73 },
          { id: "nd-012", name: "node-bravo-03", ip: "10.42.2.13", mac: "AC:DE:48:00:12:03", cpu: "Intel Xeon E-2388G", ram: "128 GB ECC", storage: "8 TB NVMe RAID", status: "online", marker: "ARUCO-0203", slot: 3, power: 208, temp: 58 },
          { id: "nd-013", name: "node-bravo-04", ip: "10.42.2.14", mac: "AC:DE:48:00:12:04", cpu: "Intel Xeon E-2388G", ram: "128 GB ECC", storage: "8 TB NVMe RAID", status: "critical", marker: "ARUCO-0204", slot: 4, power: 244, temp: 87 },
        ],
      },
    ],
  },
  {
    id: "dc-02",
    name: "Data Center · MDC-Bravo",
    region: "eu-central-1b",
    racks: [
      { id: "rk-b01", name: "Rack B-01", slots: 10, nodes: [
        { id: "nd-020", name: "node-charlie-01", ip: "10.50.1.11", mac: "AC:DE:48:00:21:01", cpu: "Intel i9-13900", ram: "64 GB DDR5", storage: "2 TB NVMe", status: "online", marker: "ARUCO-0301", slot: 1, power: 198, temp: 56 },
        { id: "nd-021", name: "node-charlie-02", ip: "10.50.1.12", mac: "AC:DE:48:00:21:02", cpu: "Intel i9-13900", ram: "64 GB DDR5", storage: "2 TB NVMe", status: "warning", marker: null, slot: 2, power: 210, temp: 74 },
        { id: "nd-022", name: "node-charlie-03", ip: "10.50.1.13", mac: "AC:DE:48:00:21:03", cpu: "Intel i9-13900", ram: "64 GB DDR5", storage: "2 TB NVMe", status: "online", marker: "ARUCO-0303", slot: 3, power: 190, temp: 52 },
      ] },
      { id: "rk-b02", name: "Rack B-02", slots: 8, nodes: [
        { id: "nd-030", name: "node-delta-01", ip: "10.50.2.11", mac: "AC:DE:48:00:22:01", cpu: "AMD EPYC 7543", ram: "256 GB ECC", storage: "16 TB NVMe", status: "online", marker: "ARUCO-0401", slot: 1, power: 305, temp: 61 },
        { id: "nd-031", name: "node-delta-02", ip: "10.50.2.12", mac: "AC:DE:48:00:22:02", cpu: "AMD EPYC 7543", ram: "256 GB ECC", storage: "16 TB NVMe", status: "offline", marker: "ARUCO-0402", slot: 2, power: 0, temp: 24 },
      ] },
    ],
  },
];

export const STATUS_DOT: Record<NodeAsset["status"], string> = {
  online: "bg-neon-green shadow-[0_0_8px_rgba(0,255,156,0.6)]",
  warning: "bg-amber shadow-[0_0_8px_rgba(255,200,87,0.6)]",
  critical: "bg-critical shadow-[0_0_8px_rgba(255,77,109,0.7)] animate-pulse-dot",
  offline: "bg-offline",
};

export const STATUS_BORDER: Record<NodeAsset["status"], string> = {
  online: "border-neon-green/40",
  warning: "border-amber/40",
  critical: "border-critical/60 animate-pulse-alert",
  offline: "border-offline/40",
};

export const STATUS_BG: Record<NodeAsset["status"], string> = {
  online: "bg-neon-green/80",
  warning: "bg-amber/80",
  critical: "bg-critical animate-pulse-dot",
  offline: "bg-offline/50",
};

export const STATUS_TEXT: Record<NodeAsset["status"], string> = {
  online: "text-neon-green",
  warning: "text-amber",
  critical: "text-critical",
  offline: "text-offline",
};