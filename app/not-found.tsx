import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-sm text-center">
        <Image
          src="/bannerlogo.png"
          alt="RET"
          width={160}
          height={50}
          className="mx-auto mb-8 h-auto w-auto"
        />
        <p className="text-5xl font-bold text-slate-200">404</p>
        <h1 className="mt-3 text-xl font-semibold text-slate-900">
          Pagina niet gevonden
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          Terug naar dashboard
        </Link>
      </div>
    </div>
  );
}
