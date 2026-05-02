type Variant =
  | "green"
  | "blue"
  | "amber"
  | "slate"
  | "red"
  | "orange"
  | "purple"
  | "indigo"
  | "muted";

const variants: Record<Variant, string> = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  slate: "bg-slate-200 text-slate-700",
  muted: "bg-slate-100 text-slate-600",
  red: "bg-red-100 text-red-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
  indigo: "bg-indigo-100 text-indigo-700",
};

export default function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {label}
    </span>
  );
}

export function publicationBadgeVariant(state: string): Variant {
  switch (state) {
    case "Live":
      return "green";
    case "Gepland":
      return "blue";
    case "Concept":
      return "amber";
    case "Verlopen":
      return "slate";
    default:
      return "muted";
  }
}

export function roleBadgeVariant(role: string): Variant {
  switch (role) {
    case "ADMIN":
      return "purple";
    case "ORG_ADMIN":
      return "indigo";
    case "EDITOR":
      return "blue";
    default:
      return "slate";
  }
}

export function categoryBadgeVariant(category: string): Variant {
  switch (category) {
    case "REGULIER":
      return "green";
    case "OMLEIDING":
      return "orange";
    case "CALAMITEIT":
      return "red";
    default:
      return "muted";
  }
}
