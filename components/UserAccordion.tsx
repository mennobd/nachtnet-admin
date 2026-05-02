"use client";

import { useState } from "react";

export default function UserAccordion({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 transition-all duration-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <span>Aanpassen</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? "max-h-[800px]" : "max-h-0"
        }`}
      >
        <div className="border-t border-slate-200 bg-slate-50">
          {children}
        </div>
      </div>
    </div>
  );
}
