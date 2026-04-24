import type { NextRequest } from "next/server";

export const REQUEST_ID_HEADER = "x-request-id";

type HeaderCarrier = Headers | Pick<NextRequest, "headers"> | Request;

function resolveHeaders(input: HeaderCarrier): Headers {
  if (input instanceof Headers) {
    return input;
  }

  return input.headers;
}

export function getRequestId(input: HeaderCarrier): string | null {
  const requestId = resolveHeaders(input).get(REQUEST_ID_HEADER)?.trim();
  return requestId ? requestId : null;
}

export function withRequestId(
  input: HeaderCarrier,
  context: Record<string, unknown> = {},
): Record<string, unknown> {
  const requestId = getRequestId(input);

  if (!requestId) {
    return { ...context };
  }

  return {
    ...context,
    requestId,
  };
}