import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center">
          <Image
            src="/bannerlogo.png"
            alt="RET"
            width={220}
            height={70}
            priority
            className="h-auto w-auto animate-pulse"
          />
          <p className="mt-4 text-sm text-slate-500">Portaal wordt geladen...</p>
        </div>
      </div>
    </div>
  );
}
