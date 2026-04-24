export function getRoleLabel(role: string) {
  switch (role) {
    case "ADMIN":
      return "Systeembeheerder";
    case "ORG_ADMIN":
      return "Afdelingsbeheerder";
    case "EDITOR":
      return "Editor";
    case "VIEWER":
      return "Viewer";
    default:
      return role;
  }
}
