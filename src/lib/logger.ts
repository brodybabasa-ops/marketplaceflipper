type LogLevel = "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

const REDACT_KEYS = new Set([
  "password",
  "passwordHash",
  "token",
  "authorization",
  "email",
  "sellerName",
  "vin",
]);

function sanitize(value: unknown, key?: string): unknown {
  if (key && REDACT_KEYS.has(key)) {
    return "[redacted]";
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        sanitize(v, k),
      ]),
    );
  }
  return value;
}

function write(level: LogLevel, event: string, fields: LogFields = {}) {
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    ...((sanitize(fields) as LogFields) ?? {}),
  };
  const payload = JSON.stringify(line);
  if (level === "error") {
    console.error(payload);
    return;
  }
  if (level === "warn") {
    console.warn(payload);
    return;
  }
  console.log(payload);
}

export const logger = {
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};
