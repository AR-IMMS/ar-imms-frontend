import { create } from "zustand";
import type { ErrorResponse } from "@/types/api";
import type { RackInvestigationOverviewResponse } from "@/types/monitoring";

interface RackOverviewState {
  overview: RackInvestigationOverviewResponse | null;
  loading: boolean;
  error: ErrorResponse | null;
}

interface RackMonitoringState {
  racksOverview: Record<string, RackOverviewState>;

  setOverviewLoading: (rackId: string, loading: boolean) => void;
  setOverviewData: (
    rackId: string,
    data: RackInvestigationOverviewResponse,
  ) => void;
  setOverviewError: (rackId: string, error: ErrorResponse | null) => void;
}

export const DEFAULT_RACK_OVERVIEW_STATE: RackOverviewState = {
  overview: null,
  loading: false,
  error: null,
};

export const useRackMonitoringStore = create<RackMonitoringState>((set) => ({
  racksOverview: {},

  setOverviewLoading: (rackId, loading) =>
    set((state) => ({
      racksOverview: {
        ...state.racksOverview,
        [rackId]: {
          ...state.racksOverview[rackId],
          loading,
        },
      },
    })),

  setOverviewData: (rackId, data) =>
    set((state) => ({
      racksOverview: {
        ...state.racksOverview,
        [rackId]: {
          overview: data,
          loading: false,
          error: null,
        },
      },
    })),

  setOverviewError: (rackId, error) =>
    set((state) => ({
      racksOverview: {
        ...state.racksOverview,
        [rackId]: {
          ...state.racksOverview[rackId],
          error,
          loading: false,
        },
      },
    })),
}));
