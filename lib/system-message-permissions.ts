export function canManageSystemMessages(user: {
  role: string;
  organization?: { name?: string | null } | null;
}) {
  if (user.role === "ADMIN") return true;
  if (user.role === "ORG_ADMIN") return true;
  if (user.role === "EDITOR") return true;
  const allowedViewerOrganizations = ["AFD-NaCo"];
  return (
    user.role === "VIEWER" &&
    allowedViewerOrganizations.includes(user.organization?.name ?? "")
  );
}
