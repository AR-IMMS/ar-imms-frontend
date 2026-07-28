import { AUTH_HEADERS } from "@/types/auth";
import type { ApiError, ApiFailure, ApiResponse } from "@/types/api";
import { useAuthStore } from "@/stores/auth-store";

type ServiceRequestOptions = RequestInit & {
  includeAuth?: boolean;
};

type ApiEnvelope<T> = ApiResponse<T> | T;

export const serviceApiConfig = {
  identityApiUrl:
    process.env.NEXT_PUBLIC_IDENTITY_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4001/api/v1",
  incidentApiUrl:
    process.env.NEXT_PUBLIC_INCIDENT_API_URL ?? "/api/incident-workflow",
};

export async function requestServiceJson<T>(
  baseUrl: string,
  path: string,
  options: ServiceRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const includeAuth = options.includeAuth ?? true;

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (includeAuth && !headers.has("Authorization")) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  headers.delete(AUTH_HEADERS.SKIP_AUTH_INJECTION);
  headers.delete(AUTH_HEADERS.SKIP_AUTH_REFRESH);

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null as T;
  }

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | null;

  if (!response.ok || isApiFailure(payload)) {
    throw toApiError(response, payload);
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiResponse<T>).data as T;
  }

  return payload as T;
}

function isApiFailure<T>(payload: ApiEnvelope<T> | null): payload is ApiFailure {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    Boolean((payload as ApiFailure).error)
  );
}

function toApiError<T>(
  response: Response,
  payload: ApiEnvelope<T> | null,
): ApiError {
  if (isApiFailure(payload)) {
    return {
      status: payload.error.details?.status ?? response.status,
      code: payload.error.code ?? "HTTP_ERROR",
      message:
        payload.error.details?.detail ??
        payload.error.details?.reason ??
        payload.error.message ??
        response.statusText,
    };
  }

  if (payload && typeof payload === "object" && "message" in payload) {
    return {
      status: response.status,
      code: "HTTP_ERROR",
      message: String((payload as { message?: unknown }).message),
    };
  }

  return {
    status: response.status,
    code: "HTTP_ERROR",
    message: response.statusText || "Request failed",
  };
}
