import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-1 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vemana-crest.png" alt="Vemana Institute of Technology" width={96} height={96} className="mb-2 h-24 w-24 object-contain" />
        <h1 className="text-2xl font-semibold tracking-tight">Academic Atelier</h1>
        <p className="text-base font-medium">Vemana Institute of Technology</p>
        <p className="text-sm text-muted-foreground">College ERP · Academics · Examinations · Fees</p>
      </div>
      <LoginForm />
    </div>
  );
}
