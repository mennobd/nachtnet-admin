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
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/bannerlogo.png"
            alt="RET"
            width={260}
            height={80}
            priority
            className="h-auto w-auto max-w-full"
          />

          <h1 className="mt-6 text-2xl font-semibold text-slate-900">
            RET Navigatie portaal
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Log in om routes, publicaties en manifesten te beheren.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
