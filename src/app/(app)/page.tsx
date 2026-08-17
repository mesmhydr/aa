import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/access";
import { DashboardRouter } from "@/components/dashboards";

export default async function HomePage() {
  const access = await requireAccess();
  return <DashboardRouter access={access} />;
}
