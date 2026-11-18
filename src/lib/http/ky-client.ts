import ky from 'ky';
import { AUTH_HEADERS } from '@/types/auth';
import { handleAuthError } from '../auth/auth-handlers';
import { useAuthStore } from '@/stores/auth-store';
import type {
  ApiError,
  ErrorResponse,
  FieldError,
  ValidationErrorCode,
} from '@/types/api';
import { clearState } from '@/hooks/auth/use-auth-mutation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const DEFAULT_TIMEOUT = 15_000;

export const kyClient = ky.create({
  prefix: API_URL,
  timeout: DEFAULT_TIMEOUT,
  retry: {
    limit: 2,
    methods: ['get', 'put', 'delete', 'head'],
    statusCodes: [408, 429, 500, 502, 503, 504],
  },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        if (!request.headers.has('X-Request-Id')) {
          request.headers.set('X-Request-Id', createRequestId());
        }
        if (!request.headers.has('Traceparent')) {
          request.headers.set('Traceparent', createTraceparent());
        }

        // Kiểm tra xem request này có yêu cầu bỏ qua việc tiêm token không
        if (request.headers.has(AUTH_HEADERS.SKIP_AUTH_INJECTION)) {
          request.headers.delete(AUTH_HEADERS.SKIP_AUTH_INJECTION);
          return;
        }

        if (typeof window !== 'undefined') {
          const token = useAuthStore.getState().accessToken;
          if (token && !request.headers.has('Authorization')) {
            request.headers.set('Authorization', `Bearer ${token}`);
          }
        }
      },
    ],
    afterResponse: [
      async ({ request, response }) => {
        const shouldSkipAuthRefresh = request.headers.has(
          AUTH_HEADERS.SKIP_AUTH_REFRESH
        );

        const contentType = response.headers.get('content-type');
        let problemResponse: ErrorResponse | null = null;

        if (
          contentType?.includes('application/problem+json') ||
          contentType?.includes('application/json')
        ) {
          try {
            problemResponse = parseProblemResponse(
              await response.clone().json(),
              response.status
            );
          } catch {
            problemResponse = null;
          }
        }

        if (!response.ok) {
          const apiError = toApiError(problemResponse, response);

          const hasRetriedAuth = request.headers.has(AUTH_HEADERS.AUTH_RETRY);

          // Nếu gặp lỗi 401 và KHÔNG mang cờ chặn refresh
          if (response.status === 401 && !shouldSkipAuthRefresh) {
            if (!hasRetriedAuth) {
              try {
                const newToken = await handleAuthError(apiError);

                if (newToken) {
                  const newRequest = request.clone();
                  newRequest.headers.set('Authorization', `Bearer ${newToken}`);
                  newRequest.headers.set(AUTH_HEADERS.AUTH_RETRY, 'true');

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidationErrorCode(value: unknown): value is ValidationErrorCode {
  return (
    typeof value === 'string' &&
    [
      'INVALID_TYPE',
      'INVALID_FORMAT',
      'OUT_OF_RANGE',
      'UNKNOWN_FIELD',
      'INVALID_VALUE',
    ].includes(value)
  );
}

function parseFieldErrors(value: unknown): FieldError[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const errors = value.flatMap((item): FieldError[] => {
    if (!isRecord(item)) {
      return [];
    }

    const field = Array.isArray(item.field)
      ? item.field.filter(
          (segment): segment is string | number =>
            typeof segment === 'string' ||
            (typeof segment === 'number' &&
              Number.isInteger(segment) &&
              segment >= 0)
        )
      : [];

    if (!isValidationErrorCode(item.code) || typeof item.message !== 'string') {
      return [];
    }

    return [{ field, code: item.code, message: item.message }];
  });

  return errors.length > 0 ? errors : undefined;
}

function parseProblemResponse(
  value: unknown,
  status: number
): ErrorResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const code = typeof value.code === 'string' ? value.code : 'UNKNOWN_ERROR';
  const requestId =
    typeof value.request_id === 'string'
      ? value.request_id
      : typeof value.requestId === 'string'
        ? value.requestId
        : '';

  return {
    type: typeof value.type === 'string' ? value.type : 'about:blank',
    title:
      typeof value.title === 'string' ? value.title : 'An API request failed',
    status:
      typeof value.status === 'number' && Number.isInteger(value.status)
        ? value.status
        : status,
    detail:
      typeof value.detail === 'string'
        ? value.detail
        : typeof value.message === 'string'
          ? value.message
          : 'The API request failed.',
    instance: typeof value.instance === 'string' ? value.instance : '',
    code,
    request_id: requestId,
    trace_id: typeof value.trace_id === 'string' ? value.trace_id : undefined,
    errors: parseFieldErrors(value.errors),
  };
}

function toApiError(
  problem: ErrorResponse | null,
  response: Response
): ApiError {
  if (problem) {
    return {
      status: problem.status,
      code: problem.code,
      message: problem.detail,
      title: problem.title,
      detail: problem.detail,
      instance: problem.instance,
      requestId: problem.request_id,
      traceId: problem.trace_id,
      errors: problem.errors,
    };
  }

  return {
    status: response.status,
    code: 'UNKNOWN_ERROR',
    message: response.statusText || 'The API request failed.',
  };
}

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `req_${crypto.randomUUID()}`;
  }

  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function createTraceparent(): string {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    return `00-${'0'.repeat(32)}-${'0'.repeat(16)}-01`;
  }

  const traceId = crypto.getRandomValues(new Uint8Array(16));
  const spanId = crypto.getRandomValues(new Uint8Array(8));
  const traceIdHex = Array.from(traceId, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  const spanIdHex = Array.from(spanId, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');

  return `00-${traceIdHex}-${spanIdHex}-01`;
}
