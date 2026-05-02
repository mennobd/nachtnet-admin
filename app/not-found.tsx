import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
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
              priority
              className="mx-auto h-auto w-auto max-w-full"
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-ret-red">
              Routebeheer
            </p>
          </div>
          <div className="px-8 py-8 text-center">
            <p className="text-5xl font-bold text-slate-200">404</p>
            <h1 className="mt-3 text-lg font-semibold text-slate-900">
              Pagina niet gevonden
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              De pagina die je zoekt bestaat niet of is verplaatst.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-xl bg-ret-red px-5 py-2.5 text-sm font-medium text-white hover:bg-ret-red-dark transition-colors"
            >
              Terug naar dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
