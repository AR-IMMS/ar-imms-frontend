import { create } from "zustand";
import { RackTopologyResult } from "@/types/assets";

interface AssetStoreState {
  // Active Filters
  selectedSiteCode: string | null;
  selectedRoomCode: string | null;
  searchQuery: string;

  // Selected Assets
  selectedRackId: string | null;
  selectedNodeId: string | null;

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

  // Filter Actions
  setSelectedSiteCode: (siteCode: string | null) => void;
  setSelectedRoomCode: (roomCode: string | null) => void;
  setSearchQuery: (query: string) => void;

  // Asset Selection Actions
  setSelectedRackId: (rackId: string | null) => void;
  setSelectedNodeId: (nodeId: string | null) => void;

  // Panel inspection actions
  setActivePanelType: (type: "site" | "rack" | "node" | null) => void;

  // Drawer Actions
  setIsUnmappedDrawerOpen: (isOpen: boolean) => void;

  // Data & State Sync Actions
  setTopologyData: (data: RackTopologyResult[]) => void;
  setLoadingState: (key: "topology" | "telemetry", value: boolean) => void;
  setErrorState: (key: "topology" | "telemetry", value: boolean) => void;
  resetFilters: () => void;
}

export const useAssetStore = create<AssetStoreState>()((set) => ({
  // Initial State
  selectedSiteCode: null,
  selectedRoomCode: null,
  searchQuery: "",
  selectedRackId: null,
  selectedNodeId: null,
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

  // Setters
  setSelectedSiteCode: (siteCode) =>
    set({
      selectedSiteCode: siteCode,
      selectedRoomCode: null,
      selectedRackId: null,
      selectedNodeId: null,
      activePanelType: siteCode ? "site" : null,
    }),

  setSelectedRoomCode: (roomCode) =>
    set({
      selectedRoomCode: roomCode,
      selectedRackId: null,
      selectedNodeId: null,
      activePanelType: null,
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedRackId: (rackId) =>
    set({
      selectedRackId: rackId,
      selectedNodeId: null,
    }),

  setSelectedNodeId: (nodeId) =>
    set({
      selectedNodeId: nodeId,
    }),

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

  setLoadingState: (key, value) =>
    set((state) => {
      if (state.loadingStates[key] === value) return {};
      return {
        loadingStates: {
          ...state.loadingStates,
          [key]: value,
        },
      };
    }),

  setErrorState: (key, value) =>
    set((state) => {
      if (state.errorStates[key] === value) return {};
      return {
        errorStates: {
          ...state.errorStates,
          [key]: value,
        },
      };
    }),

  resetFilters: () =>
    set({
      selectedSiteCode: null,
      selectedRoomCode: null,
      selectedRackId: null,
      selectedNodeId: null,
      activePanelType: null,
      searchQuery: "",
    }),
}));
