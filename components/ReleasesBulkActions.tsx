"use client";

import { useMemo, useState } from "react";
import BulkPublishButton from "@/components/BulkPublishButton";

type ReleaseItem = {
  id: string;
  routeTitle: string;
  version: string;
  publicationState: string;
};

export default function ReleasesBulkActions({
  releases,
}: {
  releases: ReleaseItem[];
}) {
  const selectable = useMemo(
    () => releases.filter((r) => r.publicationState === "Concept"),
    [releases]
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function toggleEntry(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (selectedIds.length === selectable.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(selectable.map((r) => r.id));
  }

  if (selectable.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Er zijn momenteel geen concept-releases beschikbaar voor bulkpublicatie.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Bulkpublicatie concept-releases
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Selecteer concept-releases en zet ze in één keer live.
          </p>
        </div>

        <BulkPublishButton selectedEntryIds={selectedIds} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={toggleAll}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          {selectedIds.length === selectable.length
            ? "Selectie wissen"
            : "Selecteer alles"}
        </button>

        <span className="text-sm text-slate-500">
          {selectedIds.length} geselecteerd
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {selectable.map((release) => (
          <label
            key={release.id}
            className="flex items-center justify-between rounded-xl border p-4"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.includes(release.id)}
                onChange={() => toggleEntry(release.id)}
                className="h-4 w-4"
              />

              <div>
                <p className="font-medium text-slate-900">{release.routeTitle}</p>
                <p className="text-sm text-slate-500">Versie: {release.version}</p>
              </div>
            </div>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              Concept
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
