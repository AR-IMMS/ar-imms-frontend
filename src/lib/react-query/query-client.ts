import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ApiError } from "@/types/api";

function handleGlobalError(error: unknown, isMutation: boolean) {
  const apiError = error as ApiError;
  const errorMessage = apiError?.message ?? "An unexpected error occurred";

  // Tối ưu UX - dành cho khi useQuery fetch dữ liệu ngầm
  // tránh spam toast
  if (!isMutation) {
    const ignoredCodes = ["NOT_FOUND", "UNAUTHORIZED", "FORBIDDEN"];
    if (ignoredCodes.includes(apiError?.code)) {
      return; // Để Component tự hiển thị UI Error/Empty State, không bắn Toast phá vỡ trải nghiệm
    }
  }

  switch (apiError?.code) {
    case "REQUEST_TIMEOUT":
      toast.error(errorMessage ?? "Server is not responding. Please try again later");
      break;

    case "NETWORK_ERROR":
      toast.error(
        errorMessage ?? "Cannot connect to server, please check your network connection",
      );
      break;

    case "NOT_FOUND":
      toast.error(errorMessage ?? "Resource not found");
      break;

    default:
      toast.error(errorMessage ?? "Something went wrong");
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // flag "false" để báo lỗi từ query (fetch)
    onError: (error) => handleGlobalError(error, false),
  }),
  mutationCache: new MutationCache({
    // flag "true" để báo lỗi từ mutation (create/update/delete)
    onError: (error) => handleGlobalError(error, true),
  }),

  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});
