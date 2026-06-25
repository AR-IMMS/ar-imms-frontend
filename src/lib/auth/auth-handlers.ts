import { redirect } from "next/navigation";
import { authService } from "../../services/auth/auth-service";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiError } from "@/types/api";
import { AUTH_ERROR_CODES } from "@/types/auth";
import { clearState } from "@/hooks/auth/use-auth-mutation";

let isRefreshing = false;
// Queue để lưu các request đang chờ refresh token
let queue: Array<(token: string | null) => void> = [];

function isAuthRelatedError(error: ApiError) {
  const normalizedCode = error.code?.toUpperCase();
  const normalizedMessage = error.message?.toLowerCase() ?? "";

  return (
    error.status === 401 ||
    (error.status === 403 &&
      !!normalizedCode &&
      (AUTH_ERROR_CODES.has(normalizedCode) ||
        normalizedCode.includes("TOKEN") ||
        normalizedCode.includes("AUTH"))) ||
    normalizedMessage.includes("token") ||
    normalizedMessage.includes("auth")
  );
}

function isTokenIssueError(error: ApiError) {
  const normalizedCode = error.code?.toUpperCase() ?? "";
  const normalizedMessage = error.message?.toLowerCase() ?? "";

  return (
    error.status === 401 ||
    normalizedCode.includes("TOKEN") ||
    normalizedCode === "UNAUTHORIZED" ||
    normalizedCode === "FORBIDDEN" ||
    normalizedMessage.includes("token") ||
    normalizedMessage.includes("expired") ||
    normalizedMessage.includes("unauthorized")
  );
}

function goToForbiddenPage() {
  if (typeof window !== "undefined") {
    window.location.assign("/403");
    return;
  }
  redirect("/403");
}

export async function handleAuthError(
  error?: ApiError,
): Promise<string | null> {
  if (!error) return null;

  // BẢO VỆ SSR: Nếu đang chạy trên Server của Next.js, không chạy luồng refresh token này
  if (typeof window === "undefined") {
    throw error;
  }

  const { accessToken } = useAuthStore.getState();

  if (!isAuthRelatedError(error)) {
    throw error;
  }

  if (!accessToken) throw error;

  // 403 là lỗi phân quyền thật sự, không thể refresh
  if (error.status === 403) {
    goToForbiddenPage();
    throw error;
  }

  // Chỉ thực hiện luồng refresh khi lỗi 401 liên quan tới Token
  if (error.status !== 401 || !isTokenIssueError(error)) {
    clearState();
    throw error;
  }

  // Nếu đang có một request khác đi refresh token rồi, bắt các request sau "xếp hàng chờ
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      queue.push((newToken) => {
        if (newToken) resolve(newToken);
        else reject(error);
      });
    });
  }

  isRefreshing = true;

  try {
    const { refreshToken, sessionId } = useAuthStore.getState();

    if (!refreshToken || !sessionId) {
      throw error;
    }

    const refreshedTokens = await authService.refreshToken({
      refreshToken,
      sessionId,
    });

    useAuthStore.getState().setTokens(refreshedTokens);
    queue.forEach((cb) => cb(refreshedTokens.accessToken));
    queue = [];

    return refreshedTokens.accessToken;
  } catch {
    queue.forEach((cb) => cb(null));
    queue = [];

    clearState();

    throw error;
  } finally {
    isRefreshing = false;
  }
}
