export function validateSystemMessage(input: any) {
  if (!input.title || input.title.length < 3) {
    return "Titel is te kort";
  }

  if (!input.message || input.message.length < 5) {
    return "Bericht is te kort";
  }

  if (!["INFO", "WARNING", "CRITICAL"].includes(input.severity)) {
    return "Ongeldige severity";
  }

  if (!["ALL", "ZUID", "KLEIWEG", "NACHTNET"].includes(input.targetDepot)) {
    return "Ongeldig depot";
  }

  if (input.activeUntil && input.activeFrom) {
    if (new Date(input.activeUntil) < new Date(input.activeFrom)) {
      return "activeUntil ligt vóór activeFrom";
    }
  }

  return null;
}
