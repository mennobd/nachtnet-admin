import Image from "next/image";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          {/* Brand header */}
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

          {/* Form area */}
          <div className="px-8 py-7">
            <h1 className="mb-1 text-lg font-semibold text-slate-900">
              Inloggen
            </h1>
            <p className="mb-6 text-sm text-slate-500">
              Voer uw gegevens in om verder te gaan.
            </p>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
