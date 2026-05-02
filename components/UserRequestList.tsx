"use client";

import { useState } from "react";
import HandleUserRequestButtons from "@/components/HandleUserRequestButtons";

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "APPROVED":
      return "bg-green-100 text-green-700";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-200 text-slate-700";
  }
}

export default function UserRequestList({ requests }: any) {
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("PENDING");

  const filtered =
    filter === "ALL"
      ? requests
      : requests.filter((r: any) => r.status === filter);

  return (
    <>
      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              filter === f
                ? "bg-ret-red text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Lijst */}
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">
          Geen aanvragen in deze categorie.
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((req: any) => (
            <div
              key={req.id}
              className="rounded-xl border p-4 flex justify-between items-start"
            >
              <div>
                <p className="font-medium text-slate-900">{req.name}</p>
                <p className="text-sm text-slate-500">{req.email}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Afdeling: {req.organization?.name}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Rol: {req.requestedRole}
                </p>

                <div className="mt-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                      req.status
                    )}`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>

              {req.status === "PENDING" && (
                <HandleUserRequestButtons requestId={req.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
