import ky from "ky";
import { AUTH_HEADERS } from "@/types/auth";
import { handleAuthError } from "../auth/auth-handlers";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiError, ApiFailure, ApiResponse } from "@/types/api";
import { clearState } from "@/hooks/auth/use-auth-mutation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const DEFAULT_TIMEOUT = 15_000;

export const kyClient = ky.create({
  prefix: API_URL,
  timeout: DEFAULT_TIMEOUT,
  retry: {
    limit: 2,
    methods: ["get", "put", "delete", "head"],
    statusCodes: [408, 429, 500, 502, 503, 504],
  },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        // Kiểm tra xem request này có yêu cầu bỏ qua việc tiêm token không
        if (request.headers.has(AUTH_HEADERS.SKIP_AUTH_INJECTION)) {
          request.headers.delete(AUTH_HEADERS.SKIP_AUTH_INJECTION);
          return;
        }

        if (typeof window !== "undefined") {
          const token = useAuthStore.getState().accessToken;
          if (token && !request.headers.has("Authorization")) {
            request.headers.set("Authorization", `Bearer ${token}`);
          }
        }
      },
    ],
    afterResponse: [
      async ({ request, response }) => {
        const shouldSkipAuthRefresh = request.headers.has(
          AUTH_HEADERS.SKIP_AUTH_REFRESH,
        );

        let body: ApiResponse<unknown> | null = null;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          body = await response.clone().json();
        }

        const isBeBusinessError = body?.success === false;

        if (!response.ok || isBeBusinessError) {
          const errorDetail = (body as ApiFailure | null)?.error;
          const apiError: ApiError = {
            status: errorDetail?.details?.status ?? response.status,
            code: errorDetail?.code ?? "UNKNOWN_ERROR",
            message:
              errorDetail?.details?.detail ??
              errorDetail?.message ??
              response.statusText ??
              "Something went wrong",
          };

          const hasRetriedAuth = request.headers.has(AUTH_HEADERS.AUTH_RETRY);

          // Nếu gặp lỗi 401 và KHÔNG mang cờ chặn refresh
          if (response.status === 401 && !shouldSkipAuthRefresh) {
            if (!hasRetriedAuth) {
              try {
                const newToken = await handleAuthError(apiError);

                if (newToken) {
                  const newRequest = request.clone();
                  newRequest.headers.set("Authorization", `Bearer ${newToken}`);
                  newRequest.headers.set(AUTH_HEADERS.AUTH_RETRY, "true");

                  return ky(newRequest);
                }
              } catch (refreshError) {
                throw refreshError;
              }
            } else {
              // Đã retry nhưng vẫn bị 401 -> Token mới cũng không hợp lệ hoặc session đã bị huỷ
              clearState();
            }
          }

          throw apiError;
        }
        return response;
      },
    ],
  },
});
