export function getRoleMeta(role: string) {
  switch (role) {
    case "ADMIN":
      return {
        label: "Systeembeheerder",
        color: "bg-red-100 text-red-700",
      };
    case "ORG_ADMIN":
      return {
        label: "Afdelingsbeheerder",
        color: "bg-blue-100 text-blue-700",
      };
    case "EDITOR":
      return {
        label: "Editor",
        color: "bg-green-100 text-green-700",
      };
    case "VIEWER":
      return {
        label: "Viewer",
        color: "bg-slate-100 text-slate-700",
      };
    default:
      return {
        label: role,
        color: "bg-slate-100 text-slate-700",
      };
  }
}
