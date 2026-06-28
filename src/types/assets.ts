export type NodeAsset = {
  id: string;
  name: string;
  ip: string;
  mac: string;
  cpu: string;
  ram: string;
  storage: string;
  status: "online" | "warning" | "critical" | "offline";
  marker: string | null;
  slot: number;
  power: number;
  temp: number;
};

export type Rack = {
  id: string;
  name: string;
  slots: number;
  nodes: NodeAsset[];
};
export type DC = {
  id: string;
  name: string;
  region: string;
  racks: Rack[];
};
