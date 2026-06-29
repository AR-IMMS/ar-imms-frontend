import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type IncidentWorkflowRouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const UPSTREAM_BASE_URL =
  process.env.INCIDENT_WORKFLOW_API_URL ??
  process.env.NEXT_PUBLIC_INCIDENT_API_URL ??
  "http://localhost:4003/api/v1";

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "authorization",
  "content-type",
  "x-correlation-id",
  "x-request-id",
] as const;

const FORWARDED_RESPONSE_HEADERS = [
  "cache-control",
  "content-type",
  "x-correlation-id",
  "x-request-id",
] as const;

export async function GET(
  request: NextRequest,
  context: IncidentWorkflowRouteContext,
) {
  return proxyIncidentWorkflowRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: IncidentWorkflowRouteContext,
) {
  return proxyIncidentWorkflowRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: IncidentWorkflowRouteContext,
) {
  return proxyIncidentWorkflowRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: IncidentWorkflowRouteContext,
) {
  return proxyIncidentWorkflowRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: IncidentWorkflowRouteContext,
) {
  return proxyIncidentWorkflowRequest(request, context);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    },
  });
}

async function proxyIncidentWorkflowRequest(
  request: NextRequest,
  context: IncidentWorkflowRouteContext,
) {
  const targetUrl = await buildTargetUrl(request, context);
  const headers = pickHeaders(request.headers, FORWARDED_REQUEST_HEADERS);
  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
    }
  }

  try {
    const upstreamResponse = await fetch(targetUrl, init);
    const responseHeaders = pickHeaders(
      upstreamResponse.headers,
      FORWARDED_RESPONSE_HEADERS,
    );

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      {
        error: {
          code: "INCIDENT_WORKFLOW_UNAVAILABLE",
          message: "Incident workflow service is not reachable.",
        },
        meta: {
          timestamp: new Date().toISOString(),
          correlationId: request.headers.get("x-correlation-id") ?? "",
          version: "v1",
        },
      },
      { status: 502 },
    );
  }
}

async function buildTargetUrl(
  request: NextRequest,
  context: IncidentWorkflowRouteContext,
) {
  const { path = [] } = await context.params;
  const sourceUrl = new URL(request.url);
  const baseUrl = UPSTREAM_BASE_URL.replace(/\/$/, "");
  const upstreamPath = path.map(encodeURIComponent).join("/");

  return `${baseUrl}/${upstreamPath}${sourceUrl.search}`;
}

function pickHeaders(
  headers: Headers,
  names: readonly string[],
): HeadersInit {
  const picked = new Headers();

  for (const name of names) {
    const value = headers.get(name);
    if (value) {
      picked.set(name, value);
    }
  }

  return picked;
}
