export default function AuditlogPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Auditlog</h2>
        <p className="mt-2 text-slate-600">
          Hier komt het mutatieoverzicht van uploads, publicaties en wijzigingen.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="space-y-3 text-sm text-slate-600">
          <p>Gepland voor deze pagina:</p>
          <p>• route aangemaakt</p>
          <p>• GPX-bestand geüpload</p>
          <p>• publicatie opgeslagen</p>
          <p>• publicatie live gezet</p>
          <p>• publicatie ingetrokken of verlopen</p>
        </div>
      </section>
    </div>
  );
}

