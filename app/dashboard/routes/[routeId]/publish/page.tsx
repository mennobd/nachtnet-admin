import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PublishManifestEntryForm from "@/components/PublishManifestEntryForm";
import ReleaseValidationPanel from "@/components/ReleaseValidationPanel";
import DeleteReleaseButton from "@/components/DeleteReleaseButton";

function getPublicationState(entry: {
  isPublished: boolean;
  activeFrom: Date | null;
  activeUntil: Date | null;
}) {
  const now = new Date();

  if (!entry.isPublished) return "Concept";
  if (entry.activeFrom && entry.activeFrom > now) return "Gepland";
  if (entry.activeUntil && entry.activeUntil < now) return "Verlopen";
  return "Live";
}

function getStatusClasses(status: string) {
  switch (status) {
    case "Live":
      return "bg-green-100 text-green-700";
    case "Gepland":
      return "bg-blue-100 text-blue-700";
    case "Verlopen":
      return "bg-slate-200 text-slate-700";
    case "Concept":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getCategoryClasses(category: string) {
  switch (category) {
    case "CALAMITEIT":
      return "bg-red-100 text-red-700";
    case "OMLEIDING":
      return "bg-orange-100 text-orange-700";
    case "REGULIER":
      return "bg-green-100 text-green-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function PublishRoutePage({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  const { routeId } = await params;

  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
      manifestEntries: {
        include: {
          file: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
