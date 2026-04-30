type LogLevel = "INFO" | "WARNING" | "ERROR";

export function logEvent(
  action: string,
  details: Record<string, any>,
  level: LogLevel = "INFO"
) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    action,
    ...details,
  };

  console.log(JSON.stringify(payload));
}
