import type { ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  meta,
  action,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
          {meta && <p className="mt-2 text-sm text-slate-500">{meta}</p>}
        </div>
        {action && <div className="shrink-0 flex items-center gap-3">{action}</div>}
      </div>
    </section>
  );
}
