import { http, type ExtendedHttpOptions } from "./http-wrapper";

export const httpGet = <T>(url: string, options?: ExtendedHttpOptions) =>
  http<T>(url, { ...options, method: "GET" });

export const httpPost = <T>(
  url: string,
  body?: unknown,
  options?: ExtendedHttpOptions,
) => {
  const isFormData = body instanceof FormData;
  return http<T>(url, {
    ...options,
    method: "POST",
    ...(isFormData ? { body } : { json: body }), // Ky tự động hóa header dựa trên kiểu data
  });
};

export const httpPut = <T>(
  url: string,
  body?: unknown,
  options?: ExtendedHttpOptions,
) => {
  const isFormData = body instanceof FormData;
  return http<T>(url, {
    ...options,
    method: "PUT",
    ...(isFormData ? { body } : { json: body }),
  });
};

export const httpPatch = <T>(
  url: string,
  body?: unknown,
  options?: ExtendedHttpOptions,
) => {
  const isFormData = body instanceof FormData;
  return http<T>(url, {
    ...options,
    method: "PATCH",
    ...(isFormData ? { body } : { json: body }),
  });
};

export const httpDelete = <T>(url: string, options?: ExtendedHttpOptions) =>
  http<T>(url, { ...options, method: "DELETE" });
