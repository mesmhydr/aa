import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const access = await getAccess();
  if (!access) redirect("/login");

  return <AppShell access={access}>{children}</AppShell>;
}
