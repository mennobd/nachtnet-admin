import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRoleMeta } from "@/lib/roles";
import AccountProfileForm from "@/components/AccountProfileForm";
import AccountPasswordForm from "@/components/AccountPasswordForm";
import AccountChangeRequestForm from "@/components/AccountChangeRequestForm";
import AccountDirectEmailForm from "@/components/AccountDirectEmailForm";

const statusLabel: Record<string, string> = {
  PENDING: "In behandeling",
  APPROVED: "Goedgekeurd",
  REJECTED: "Afgewezen",
};

const statusClasses: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const typeLabel: Record<string, string> = {
  EMAIL: "E-mailadres",
  ROLE: "Rol",
};

export default async function AccountPage() {
  const user = await requireUser();
  const roleMeta = getRoleMeta(user.role);

  const changeRequests = await prisma.accountChangeRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Mijn account</h2>
        <p className="mt-2 text-slate-600">
          Beheer je profielgegevens en wachtwoord.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Accountoverzicht
        </h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-slate-500">E-mail</dt>
            <dd className="text-slate-900">{user.email}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-slate-500">Rol</dt>
            <dd>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleMeta.color}`}
              >
                {roleMeta.label}
              </span>
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-slate-500">Status</dt>
            <dd className="text-slate-900">
              {user.isActive ? "Actief" : "Inactief"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Naam wijzigen</h3>
        <p className="mt-1 text-sm text-slate-500">Pas je weergavenaam aan.</p>
        <div className="mt-6 max-w-sm">
          <AccountProfileForm initialName={user.name} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Wachtwoord wijzigen
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Voer je huidige wachtwoord in ter verificatie en kies daarna een
          nieuw wachtwoord.
        </p>
        <div className="mt-6 max-w-sm">
          <AccountPasswordForm />
        </div>
      </section>

      {user.role === "ADMIN" ? (
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            E-mailadres wijzigen
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Wijzig je e-mailadres direct — als ADMIN heb je geen goedkeuring nodig.
          </p>
          <div className="mt-6 max-w-sm">
            <AccountDirectEmailForm currentEmail={user.email} />
          </div>
        </section>
      ) : (
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Wijziging aanvragen
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {user.role === "ORG_ADMIN"
              ? "Vraag een wijziging aan — een ADMIN beoordeelt jouw verzoek."
              : "Vraag een wijziging aan — je afdelingsadmin beoordeelt jouw verzoek."}
          </p>
          <div className="mt-6 max-w-sm">
            <AccountChangeRequestForm
              currentEmail={user.email}
              currentRole={user.role}
            />
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Mijn wijzigingsverzoeken
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Status van jouw ingediende verzoeken.
        </p>

        {changeRequests.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            Je hebt nog geen verzoeken ingediend.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {changeRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between rounded-xl border border-slate-200 p-4"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900">
                    {typeLabel[req.type] ?? req.type}
                  </p>
                  <p className="text-sm text-slate-600">
                    Gevraagd:{" "}
                    <span className="font-medium">{req.requestedValue}</span>
                  </p>
                  {req.reason && (
                    <p className="text-xs text-slate-500">
                      Reden: {req.reason}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    {new Date(req.createdAt).toLocaleDateString("nl-NL")}
                  </p>
                  {req.rejectionReason && (
                    <p className="text-xs text-red-600">
                      Afwijzing: {req.rejectionReason}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    statusClasses[req.status] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {statusLabel[req.status] ?? req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
