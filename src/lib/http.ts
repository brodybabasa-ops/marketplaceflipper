import { NextResponse } from "next/server";

export function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export function errorResponse(message: string, status = 400) {
  return json({ error: message }, { status });
}

export function httpError(error: unknown) {
  const status = typeof error === "object" && error && "status" in error
    ? Number((error as { status: number }).status)
    : 500;
  const message = error instanceof Error ? error.message : "Server error";
  return errorResponse(message, status || 500);
}
