type LogLevel = "info" | "warn" | "error";

function formatMeta(meta?: Record<string, unknown>) {
  if (!meta) {
    return "";
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " {\"meta\":\"unserializable\"}";
  }
}

export function logServer(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const line = `[visualize][${level}] ${message}${formatMeta(meta)}`;

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}
