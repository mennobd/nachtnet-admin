type SystemMessageInput = {
  title: string;
  message: string;
  severity: string;
  targetDepot: string;
  activeFrom: Date | null;
  activeUntil: Date | null;
};

export function validateSystemMessage(input: SystemMessageInput) {
  if (!input.title || input.title.length < 3) {
    return "Titel is te kort (minimaal 3 tekens)";
  }
  if (input.title.length > 200) {
    return "Titel mag maximaal 200 tekens bevatten";
  }

  if (!input.message || input.message.length < 5) {
    return "Bericht is te kort (minimaal 5 tekens)";
  }
  if (input.message.length > 2000) {
    return "Bericht mag maximaal 2000 tekens bevatten";
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
