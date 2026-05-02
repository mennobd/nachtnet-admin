"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-100 px-8 py-7 text-center">
            <Image
              src="/bannerlogo.png"
              alt="RET"
              width={180}
              height={56}
              className="mx-auto h-auto w-auto max-w-full"
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Routebeheer
            </p>
          </div>
          <div className="px-8 py-8 text-center">
            <p className="text-5xl font-bold text-slate-200">500</p>
            <h1 className="mt-3 text-lg font-semibold text-slate-900">
              Er ging iets mis
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Er is een onverwachte fout opgetreden. Probeer het opnieuw of ga terug naar het dashboard.
            </p>
            {error.digest && (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-400">
                {error.digest}
              </p>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={reset}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
              >
                Probeer opnieuw
              </button>
              <Link
                href="/dashboard"
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Naar dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
