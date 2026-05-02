import { requireUser } from "@/lib/auth";
import { getRoleMeta } from "@/lib/roles";
import AccountProfileForm from "@/components/AccountProfileForm";
import AccountPasswordForm from "@/components/AccountPasswordForm";

export default async function AccountPage() {
  const user = await requireUser();
  const roleMeta = getRoleMeta(user.role);

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
        <p className="mt-4 text-xs text-slate-400">
          E-mailadres of rol wijzigen? Neem contact op met een beheerder.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Naam wijzigen</h3>
        <p className="mt-1 text-sm text-slate-500">
          Pas je weergavenaam aan.
        </p>
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
    </div>
  );
}
