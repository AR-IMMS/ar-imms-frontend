import { useMutation } from "@tanstack/react-query";
import { assetService } from "@/services/asset/asset-service";
import { queryClient } from "@/lib/react-query/query-client";
import { queryKeys } from "@/lib/react-query/query-keys";
import type {
  CreateRackRequestDto,
  UpdateRackRequestDto,
  AssignNodeToRackRequestDto,
} from "@/types/assets";

// --- Admin Topology - Racks Mutations ---

export function useCreateRackMutation() {
  return useMutation({
    mutationFn: (payload: CreateRackRequestDto) =>
      assetService.createRack(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.topologyTree(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.asset.search() });
    },
  });
}

export function useUpdateRackMutation() {
  return useMutation({
    mutationFn: ({
      rackId,
      payload,
    }: {
      rackId: string;
      payload: UpdateRackRequestDto;
    }) => assetService.updateRack(rackId, payload),
    onSuccess: (_, { rackId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.topologyTree(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.rackTopology(rackId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.asset.search() });
    },
  });
}

export function useActivateRackMutation() {
  return useMutation({
    mutationFn: (rackId: string) => assetService.activateRack(rackId),
    onSuccess: (_, rackId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.topologyTree(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.rackTopology(rackId),
      });
    },
  });
}

export function useRetireRackMutation() {
  return useMutation({
    mutationFn: (rackId: string) => assetService.retireRack(rackId),
    onSuccess: (_, rackId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.topologyTree(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.rackTopology(rackId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.asset.search() });
    },
  });
}

export function useRetireAndReplaceRackMutation() {
  return useMutation({
    mutationFn: async ({ rackId }: { rackId: string }) => {
      await assetService.retireRack(rackId);
      const updatedRack = await assetService.updateRack(rackId, {
        siteCode: "",
        roomCode: "",
        rowCode: "",
        positionCode: "",
      });
      return updatedRack;
    },
    onSuccess: (_, { rackId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.topologyTree(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.rackTopology(rackId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.asset.search() });
    },
  });
}

// export function useConfirmReadyRackMutation() {
//   return useMutation({
//     mutationFn: (rackId: string) => assetService.confirmReadyRack(rackId),
//     onSuccess: (_, rackId) => {
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.topologyTree(),
//       });
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.rackTopology(rackId),
//       });
//     },
//   });
// }

// export function useDrainRackMutation() {
//   return useMutation({
//     mutationFn: (rackId: string) => assetService.drainRack(rackId),
//     onSuccess: (_, rackId) => {
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.topologyTree(),
//       });
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.rackTopology(rackId),
//       });
//     },
//   });
// }

// --- Admin Topology - Nodes Mutations ---

// export function useUpdateNodeMutation() {
//   return useMutation({
//     mutationFn: ({
//       nodeId,
//       payload,
//     }: {
//       nodeId: string;
//       payload: UpdateNodeRequestDto;
//     }) => assetService.updateNode(nodeId, payload),
//     onSuccess: (updatedNode) => {
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.topologyTree(),
//       });
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.nodeContext(updatedNode.id),
//       });
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.nodeContext(updatedNode.nodeCode),
//       });
//       queryClient.invalidateQueries({ queryKey: queryKeys.asset.search() });
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.pendingAssignmentNodes(),
//       });
//       if (updatedNode.rackId) {
//         queryClient.invalidateQueries({
//           queryKey: queryKeys.asset.rackTopology(updatedNode.rackId),
//         });
//       }
//     },
//   });
// }

export function useAssignNodeMutation() {
  return useMutation({
    mutationFn: ({
      nodeId,
      payload,
    }: {
      nodeId: string;
      payload: AssignNodeToRackRequestDto;
    }) => assetService.assignNode(nodeId, payload),
    onSuccess: (updatedNode) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.topologyTree(), // after updating, need to be removed
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.nodeContext(updatedNode.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.pendingAssignmentNodes(),
      });
      if (updatedNode.rackId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.asset.rackTopology(updatedNode.rackId),
        });
      }
    },
  });
}

export function useActivateNodeMutation() {
  return useMutation({
    mutationFn: (nodeId: string) => assetService.activateNode(nodeId),
    onSuccess: (updatedNode) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.topologyTree(), // after updating, need to be removed
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.nodeContext(updatedNode.id),
      });
      // if (updatedNode.rackId) {
      //   queryClient.invalidateQueries({
      //     queryKey: queryKeys.asset.rackTopology(updatedNode.rackId),
      //   });
      // }
    },
  });
}

export function useRetireNodeMutation() {
  return useMutation({
    mutationFn: (nodeId: string) => assetService.retireNode(nodeId),
    onSuccess: (updatedNode) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.topologyTree(), // after updating, need to be removed
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.nodeContext(updatedNode.id),
      });
      // if (updatedNode.rackId) {
      //   queryClient.invalidateQueries({
      //     queryKey: queryKeys.asset.rackTopology(updatedNode.rackId),
      //   });
      // }
    },
  });
}

export function useRetireAndReplaceNodeMutation() {
  return useMutation({
    mutationFn: async ({ nodeId }: { nodeId: string }) => {
      const retiredNode = await assetService.retireNode(nodeId);
      const oldRackId = retiredNode.rackId;
      const updatedNode = await assetService.updateNode(nodeId, {
        positionCode: "",
        rackId: "",
      });
      return { updatedNode, oldRackId };
    },
    onSuccess: ({ updatedNode, oldRackId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.topologyTree(), // after updating, need to be removed
      });
      // if (oldRackId) {
      //   queryClient.invalidateQueries({
      //     queryKey: queryKeys.asset.rackTopology(oldRackId),
      //   });
      // }
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.nodeContext(updatedNode.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.asset.pendingAssignmentNodes(),
      });
    },
  });
}

// export function useNormalizeNodeMutation() {
//   return useMutation({
//     mutationFn: (payload: NormalizeNodeRequestDto) =>
//       assetService.normalizeNode(payload),
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.topologyTree(),
//       });
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.pendingAssignmentNodes(),
//       });
//     },
//   });
// }

// export function useDrainNodeMutation() {
//   return useMutation({
//     mutationFn: (nodeId: string) => assetService.drainNode(nodeId),
//     onSuccess: (updatedNode) => {
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.topologyTree(),
//       });
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.nodeContext(updatedNode.id),
//       });
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.nodeContext(updatedNode.nodeCode),
//       });
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.pendingAssignmentNodes(),
//       });
//       if (updatedNode.rackId) {
//         queryClient.invalidateQueries({
//           queryKey: queryKeys.asset.rackTopology(updatedNode.rackId),
//         });
//       }
//     },
//   });
// }

// --- Admin Markers Mutations ---

// export function useCreateMarkerMutation() {
//   return useMutation({
//     mutationFn: (payload: CreateMarkerRequestDto) =>
//       assetService.createMarker(payload),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: queryKeys.asset.search() });
//     },
//   });
// }

// export function useUpdateMarkerMutation() {
//   return useMutation({
//     mutationFn: ({
//       markerId,
//       payload,
//     }: {
//       markerId: string;
//       payload: UpdateMarkerRequestDto;
//     }) => assetService.updateMarker(markerId, payload),
//     onSuccess: (updatedMarker) => {
//       queryClient.invalidateQueries({ queryKey: queryKeys.asset.search() });
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.resolveMarker(updatedMarker.markerCode),
//       });
//       if (updatedMarker.targetId) {
//         queryClient.invalidateQueries({
//           queryKey: queryKeys.asset.nodeContext(updatedMarker.targetId),
//         });
//         queryClient.invalidateQueries({
//           queryKey: queryKeys.asset.rackTopology(updatedMarker.targetId),
//         });
//       }
//     },
//   });
// }

// export function useGenerateMarkerMutation() {
//   return useMutation({
//     mutationFn: (markerId: string) => assetService.generateMarker(markerId),
//     onSuccess: (updatedMarker) => {
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.resolveMarker(updatedMarker.markerCode),
//       });
//     },
//   });
// }

// export function usePrintMarkerMutation() {
//   return useMutation({
//     mutationFn: (markerId: string) => assetService.printMarker(markerId),
//     onSuccess: (updatedMarker) => {
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.resolveMarker(updatedMarker.markerCode),
//       });
//     },
//   });
// }

// export function useMountMarkerMutation() {
//   return useMutation({
//     mutationFn: (markerId: string) => assetService.mountMarker(markerId),
//     onSuccess: (updatedMarker) => {
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.topologyTree(),
//       });
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.resolveMarker(updatedMarker.markerCode),
//       });
//       if (updatedMarker.targetId) {
//         queryClient.invalidateQueries({
//           queryKey: queryKeys.asset.nodeContext(updatedMarker.targetId),
//         });
//         queryClient.invalidateQueries({
//           queryKey: queryKeys.asset.rackTopology(updatedMarker.targetId),
//         });
//       }
//     },
//   });
// }

// export function useValidateMarkerMutation() {
//   return useMutation({
//     mutationFn: (markerId: string) => assetService.validateMarker(markerId),
//     onSuccess: (updatedMarker) => {
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.resolveMarker(updatedMarker.markerCode),
//       });
//       if (updatedMarker.targetId) {
//         queryClient.invalidateQueries({
//           queryKey: queryKeys.asset.nodeContext(updatedMarker.targetId),
//         });
//         queryClient.invalidateQueries({
//           queryKey: queryKeys.asset.rackTopology(updatedMarker.targetId),
//         });
//       }
//     },
//   });
// }

// export function useActivateMarkerMutation() {
//   return useMutation({
//     mutationFn: (markerId: string) => assetService.activateMarker(markerId),
//     onSuccess: (updatedMarker) => {
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.topologyTree(),
//       });
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.resolveMarker(updatedMarker.markerCode),
//       });
//       if (updatedMarker.targetId) {
//         queryClient.invalidateQueries({
//           queryKey: queryKeys.asset.nodeContext(updatedMarker.targetId),
//         });
//         queryClient.invalidateQueries({
//           queryKey: queryKeys.asset.rackTopology(updatedMarker.targetId),
//         });
//       }
//     },
//   });
// }

// export function useRemapMarkerMutation() {
//   return useMutation({
//     mutationFn: ({
//       markerId,
//       payload,
//     }: {
//       markerId: string;
//       payload: RemapMarkerTargetRequestDto;
//     }) => assetService.remapMarker(markerId, payload),
//     onSuccess: (updatedMarker) => {
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.topologyTree(),
//       });
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.resolveMarker(updatedMarker.markerCode),
//       });
//       queryClient.invalidateQueries({ queryKey: queryKeys.asset.search() });
//       if (updatedMarker.targetId) {
//         queryClient.invalidateQueries({
//           queryKey: queryKeys.asset.nodeContext(updatedMarker.targetId),
//         });
//         queryClient.invalidateQueries({
//           queryKey: queryKeys.asset.rackTopology(updatedMarker.targetId),
//         });
//       }
//     },
//   });
// }

// export function useRetireMarkerMutation() {
//   return useMutation({
//     mutationFn: (markerId: string) => assetService.retireMarker(markerId),
//     onSuccess: (updatedMarker) => {
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.topologyTree(),
//       });
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.asset.resolveMarker(updatedMarker.markerCode),
//       });
//       queryClient.invalidateQueries({ queryKey: queryKeys.asset.search() });
//       if (updatedMarker.targetId) {
//         queryClient.invalidateQueries({
//           queryKey: queryKeys.asset.nodeContext(updatedMarker.targetId),
//         });
//         queryClient.invalidateQueries({
//           queryKey: queryKeys.asset.rackTopology(updatedMarker.targetId),
//         });
//       }
//     },
//   });
// }
