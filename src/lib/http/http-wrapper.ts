import type {
  ApiError,
  ErrorResponse,
  FieldError,
  ListResponse,
  SingleResponse,
  ValidationErrorCode,
} from '@/types/api';
import { kyClient } from './ky-client';
import { HTTPError, Options } from 'ky';

export interface ExtendedHttpOptions extends Options {
  includeAuth?: boolean;
  skipAuthHooks?: boolean;
  timeout?: number;
  idempotencyKey?: string;
  service?: 'identity' | 'asset' | 'monitoring' | 'ticket' | 'incident';
}

export type HttpResponse<T> = SingleResponse<T> | ListResponse<T>;

const SERVICE_URLS: Record<
  NonNullable<ExtendedHttpOptions['service']>,
  string
> = {
  identity: process.env.NEXT_PUBLIC_IDENTITY_API_URL || '',
  asset: process.env.NEXT_PUBLIC_ASSET_API_URL || '',
  monitoring: process.env.NEXT_PUBLIC_MONITORING_API_URL || '',
  ticket: process.env.NEXT_PUBLIC_TICKET_API_URL || '',
  incident:
    process.env.NEXT_PUBLIC_INCIDENT_WORKFLOW_API_URL ||
    process.env.NEXT_PUBLIC_INCIDENT_API_URL ||
    '',
};

export async function http<T>(
  url: string,
  options: ExtendedHttpOptions = {}
): Promise<T> {
  const envelope = await httpResponse<T | T[]>(url, options);

  if (envelope === null) {
    return null as T;
  }

  return envelope.data as T;
}

export async function httpResponse<T>(
  url: string,
  options: ExtendedHttpOptions = {}
): Promise<HttpResponse<T> | null> {
  try {
    const response = await kyClient(url, prepareHttpOptions(options));

    if (response.status === 204) {
      return null;
    }

    const json = await response.json();
    if (!isRecord(json) || !('data' in json)) {
      throw createInvalidEnvelopeError(response);
    }

    return json as unknown as HttpResponse<T>;
  } catch (error: unknown) {
    if (isApiError(error)) {
      throw error;
    }

    if (error instanceof HTTPError) {
      const problem = await readProblemResponse(error.response);
      throw toApiError(problem, error.response);
    }

    if (error instanceof Error && error.name === 'TimeoutError') {
      throw {
        status: 0,
        code: 'REQUEST_TIMEOUT',
        message: 'Server is not responding. Please try again later.',
      } satisfies ApiError;
    }

    throw {
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection.',
    } satisfies ApiError;
  }
}

export async function httpList<T>(
  url: string,
  options: ExtendedHttpOptions = {}
): Promise<ListResponse<T>> {
  const response = await httpResponse<T>(url, options);
  if (!response) {
    throw {
      status: 204,
      code: 'NO_CONTENT',
      message: 'The list endpoint returned no content.',
    } satisfies ApiError;
  }

  if (!Array.isArray(response.data)) {
    throw {
      status: 200,
      code: 'INVALID_RESPONSE',
      message: 'The list endpoint returned an invalid response envelope.',
    } satisfies ApiError;
  }

  return response as ListResponse<T>;
}

function prepareHttpOptions(options: ExtendedHttpOptions): ExtendedHttpOptions {
  const headers = new Headers(options.headers as HeadersInit);

  if (options.idempotencyKey) {
    headers.set('Idempotency-Key', options.idempotencyKey);
  }

  if (options.includeAuth === false) {
    headers.set('X-Skip-Auth-Injection', 'true');
  }

  if (options.skipAuthHooks) {
    headers.set('X-Skip-Auth-Injection', 'true');
    headers.set('X-Skip-Auth-Refresh', 'true');
  }

  const servicePrefix = options.service
    ? SERVICE_URLS[options.service]
    : undefined;

  return {
    ...options,
    headers,
    ...(options.prefix !== undefined
      ? { prefix: options.prefix }
      : servicePrefix
        ? { prefix: servicePrefix }
        : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiError(value: unknown): value is ApiError {
  return (
    isRecord(value) &&
    typeof value.status === 'number' &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
  );
}

function createInvalidEnvelopeError(response: Response): ApiError {
  return {
    status: response.status,
    code: 'INVALID_RESPONSE',
    message: 'The API returned an invalid success response envelope.',
  };
}

async function readProblemResponse(
  response: Response
): Promise<ErrorResponse | null> {
  const contentType = response.headers.get('content-type');
  if (
    !contentType?.includes('application/problem+json') &&
    !contentType?.includes('application/json')
  ) {
    return null;
  }

  try {
    return parseProblemResponse(await response.clone().json(), response.status);
  } catch {
    return null;
  }
}

function parseProblemResponse(
  value: unknown,
  status: number
): ErrorResponse | null {
  if (!isRecord(value)) {
    return null;
  }

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
    code: typeof value.code === 'string' ? value.code : 'UNKNOWN_ERROR',
    request_id:
      typeof value.request_id === 'string'
        ? value.request_id
        : typeof value.requestId === 'string'
          ? value.requestId
          : '',
    trace_id: typeof value.trace_id === 'string' ? value.trace_id : undefined,
    errors: parseFieldErrors(value.errors),
  };
}

function parseFieldErrors(value: unknown): FieldError[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const errors = value.flatMap((item): FieldError[] => {
    if (!isRecord(item) || !isValidationErrorCode(item.code)) {
      return [];
    }

    if (!Array.isArray(item.field) || typeof item.message !== 'string') {
      return [];
    }

    const field = item.field.filter(
      (segment): segment is string | number =>
        typeof segment === 'string' ||
        (typeof segment === 'number' &&
          Number.isInteger(segment) &&
          segment >= 0)
    );

    return [{ field, code: item.code, message: item.message }];
  });

  return errors.length > 0 ? errors : undefined;
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
    code: 'HTTP_ERROR',
    message: response.statusText || 'The API request failed.',
  };
}
