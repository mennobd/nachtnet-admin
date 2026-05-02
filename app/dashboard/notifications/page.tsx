export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NotificationsPanel from "@/components/NotificationsPanel";
import PageHeader from "@/components/PageHeader";

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meldingen"
        subtitle="Overzicht van alle meldingen voor jouw account."
      />

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <NotificationsPanel notifications={notifications} />
      </section>
    </div>
  );
}
