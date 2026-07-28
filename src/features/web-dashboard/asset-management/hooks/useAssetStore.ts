import { create } from "zustand";
import { RackTopologyResult } from "@/types/assets";

interface AssetStoreState {
  // Active Filters
  selectedSiteCode: string | null;
  selectedRoomCode: string | null;

  // Selected Assets
  selectedRackId: string | null;
  selectedNodeCode: string | null;

  // Active panel type (mutual exclusion details panels)
  activePanelType: "site" | "rack" | "node" | null;

  // Drawer state
  isUnmappedDrawerOpen: boolean;

  // Cached/Stored Telemetry & Topology Data
  topologyData: RackTopologyResult[];

  // Loading & Error States
  loadingStates: {
    topology: boolean;
    telemetry: boolean;
  };
  errorStates: {
    topology: boolean;
    telemetry: boolean;
  };

  // Mutation Modal States
  createEditRackModal: { isOpen: boolean; rackId?: string | null } | null;
  lifecycleModalState: {
    entityType: "rack" | "node";
    entityId: string;
    action: "activate" | "retire";
    displayName: string;
  } | null;
  assignNodeModalState: {
    nodeId: string;
    rackId: string;
  } | null;
  confirmMoveModalState: {
    assetType: "rack" | "node";
    assetId: string | null;
    targetCoords: {
      siteCode: string | null;
      roomCode: string | null;
      rowCode: string | null;
      positionCode: string | null;
      rackId?: string | null;
      rackName?: string | null;
    };
    onConfirm: () => void;
  } | null;

  // Drag and Drop States
  draggedAsset: {
    type: "rack" | "node";
    id: string;
    origin: "drawer" | "canvas";
  } | null;
  dragOverGridCell: { row: number; col: number } | null;
  dragOverRackId: string | null;

  // Filter Actions
  setSelectedSiteCode: (siteCode: string | null) => void;
  setSelectedRoomCode: (roomCode: string | null) => void;

  // Asset Selection Actions
  setSelectedRackId: (rackId: string | null) => void;
  setSelectedNodeCode: (nodeCode: string | null) => void;

  // Panel inspection actions
  setActivePanelType: (type: "site" | "rack" | "node" | null) => void;

  // Drawer Actions
  setIsUnmappedDrawerOpen: (isOpen: boolean) => void;

  // Data & State Sync Actions
  setTopologyData: (data: RackTopologyResult[]) => void;
  resetFilters: () => void;

  // Modal Actions
  setCreateEditRackModal: (
    state: { isOpen: boolean; rackId?: string | null } | null,
  ) => void;
  setLifecycleModalState: (
    state: {
      entityType: "rack" | "node";
      entityId: string;
      action: "activate" | "retire";
      displayName: string;
    } | null,
  ) => void;
  setAssignNodeModalState: (
    state: { nodeId: string; rackId: string } | null,
  ) => void;
  setConfirmMoveModalState: (
    state: {
      assetType: "rack" | "node";
      assetId: string | null;
      targetCoords: {
        siteCode: string | null;
        roomCode: string | null;
        rowCode: string | null;
        positionCode: string | null;
        rackId?: string | null;
        rackName?: string | null;
      };
      onConfirm: () => void;
    } | null,
  ) => void;

  // Drag and Drop Actions
  setDraggedAsset: (
    asset: {
      type: "rack" | "node";
      id: string;
      origin: "drawer" | "canvas";
    } | null,
  ) => void;
  setDragOverGridCell: (cell: { row: number; col: number } | null) => void;
  setDragOverRackId: (rackId: string | null) => void;
}

export const useAssetStore = create<AssetStoreState>()((set) => ({
  // Initial State
  selectedSiteCode: null,
  selectedRoomCode: null,
  selectedRackId: null,
  selectedNodeCode: null,
  activePanelType: null,
  isUnmappedDrawerOpen: true,
  topologyData: [],
  loadingStates: {
    topology: false,
    telemetry: false,
  },
  errorStates: {
    topology: false,
    telemetry: false,
  },

  // Modal initial states
  createEditRackModal: null,
  lifecycleModalState: null,
  assignNodeModalState: null,
  confirmMoveModalState: null,

  // DND initial states
  draggedAsset: null,
  dragOverGridCell: null,
  dragOverRackId: null,

  // Setters
  setSelectedSiteCode: (siteCode) =>
    set({
      selectedSiteCode: siteCode,
      selectedRoomCode: null,
      selectedRackId: null,
      selectedNodeCode: null,
      activePanelType: siteCode ? "site" : null,
    }),

  setSelectedRoomCode: (roomCode) =>
    set({
      selectedRoomCode: roomCode,
      selectedRackId: null,
      selectedNodeCode: null,
      activePanelType: null,
    }),

  setSelectedRackId: (rackId) => set({ selectedRackId: rackId }),
  setSelectedNodeCode: (nodeCode) => set({ selectedNodeCode: nodeCode }),

  setActivePanelType: (type) => set({ activePanelType: type }),

  setIsUnmappedDrawerOpen: (isOpen) => set({ isUnmappedDrawerOpen: isOpen }),

  setTopologyData: (data) =>
    set((state) => {
      if (
        state.topologyData.length === data.length &&
        state.topologyData.every((item, idx) => item === data[idx])
      ) {
        return {};
      }
      return { topologyData: data };
    }),

  resetFilters: () =>
    set({
      selectedSiteCode: null,
      selectedRoomCode: null,
      selectedRackId: null,
      selectedNodeCode: null,
      activePanelType: null,
    }),

  // Modal Actions implementation
  setCreateEditRackModal: (state) => set({ createEditRackModal: state }),
  setLifecycleModalState: (state) => set({ lifecycleModalState: state }),
  setAssignNodeModalState: (state) => set({ assignNodeModalState: state }),
  setConfirmMoveModalState: (state) => set({ confirmMoveModalState: state }),

  // DND Actions implementation
  setDraggedAsset: (asset) => set({ draggedAsset: asset }),
  setDragOverGridCell: (cell) => set({ dragOverGridCell: cell }),
  setDragOverRackId: (rackId) => set({ dragOverRackId: rackId }),
}));
