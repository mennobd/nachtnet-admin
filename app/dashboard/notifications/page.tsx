export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NotificationsPanel from "@/components/NotificationsPanel";

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Meldingen</h2>
        <p className="mt-2 text-slate-600">
          Overzicht van alle meldingen voor jouw account.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <NotificationsPanel notifications={notifications} />
      </section>
    </div>
  );
}
