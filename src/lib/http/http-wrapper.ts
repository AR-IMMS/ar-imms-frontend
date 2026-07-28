import { ApiError, ApiFailure, ApiResponse } from "@/types/api";
import { kyClient } from "./ky-client";
import { HTTPError, Options } from "ky";

// Options mở rộng cho Auth service
export interface ExtendedHttpOptions extends Options {
  includeAuth?: boolean; // Mặc định là true, nếu truyền false sẽ không đính kèm Token
  skipAuthHooks?: boolean; // Nếu là true, sẽ bypass qua cơ chế đính token và tự động refresh
  timeout?: number;
  service?: "identity" | "asset" | "monitoring" | "ticket" | "incident"; // Tự động chọn base URL theo service
}

// Cấu hình URL cho từng service
const SERVICE_URLS: Record<string, string> = {
  identity: process.env.NEXT_PUBLIC_IDENTITY_API_URL || "",
  asset: process.env.NEXT_PUBLIC_ASSET_API_URL || "",
  monitoring: process.env.NEXT_PUBLIC_MONITORING_API_URL || "",
  ticket: process.env.NEXT_PUBLIC_TICKET_API_URL || "",
  incident: process.env.NEXT_PUBLIC_INCIDENT_API_URL || "",
};

// Wrapper function to handle API requests with error handling and response parsing
export async function http<T>(
  url: string,
  options: ExtendedHttpOptions = {},
): Promise<T> {
  try {
    const headers = new Headers(options.headers as Record<string, string>);

    // Mặc định includeAuth là true trừ khi dev chủ động truyền false
    const shouldIncludeAuth = options.includeAuth ?? true;
    if (!shouldIncludeAuth) {
      headers.set("X-Skip-Auth-Injection", "true");
    }

    // Nếu muốn bỏ qua hoàn toàn các logic kiểm tra auth (dành cho Login/Register/Refresh)
    if (options.skipAuthHooks) {
      headers.set("X-Skip-Auth-Injection", "true");
      headers.set("X-Skip-Auth-Refresh", "true");
    }

    // Xác định prefix URL dựa trên service được truyền vào
    let servicePrefix = undefined;
    if (options.service && SERVICE_URLS[options.service]) {
      servicePrefix = SERVICE_URLS[options.service];
    }

    const finalOptions = {
      ...options,
      headers,
      ...(servicePrefix ? { prefix: servicePrefix } : {}),
    };

    // request qua kyClient
    const response = await kyClient(url, finalOptions);

    // 204 No Content: Return null for DELETE requests
    if (response.status === 204) {
      return null as T;
    }

    const json = await response.json<ApiResponse<T>>();
    if (json && "data" in json) {
      return json.data as T;
    }

    return null as T;
  } catch (error: unknown) {
    // Lỗi ApiError throw từ hook afterResponse
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      "code" in error
    ) {
      throw error;
    }

    // Lỗi HTTPError từ hệ thống Ky (nếu không lọt qua được afterResponse)
    if (error instanceof HTTPError) {
      let json: ApiFailure | null = null;
      try {
        json = await error.response.json();
      } catch {}

      throw {
        status: error.response.status,
        code: json?.error?.code ?? "HTTP_ERROR",
        message: json?.error?.message ?? error.message,
      } as ApiError;
    }

    // Lỗi Timeout hệ thống
    if (error instanceof Error && error.name === "TimeoutError") {
      throw {
        status: 0,
        code: "REQUEST_TIMEOUT",
        message: "Server is not responding. Please try again later.",
      } as ApiError;
    }

    // Lỗi kết nối mạng vật lý
    throw {
      status: 0,
      code: "NETWORK_ERROR",
      message: "Network error. Please check your connection.",
    } as ApiError;
  }
}
