import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireUser();
  let companyName = "Todas as empresas";

  if (auth.companyId) {
    const supabase = await createClient();
    const { data } = await supabase.from("companies").select("name").eq("id", auth.companyId).single();
    companyName = data?.name ?? "Minha empresa";
  }

  return (
    <div className="app-shell">
      <Sidebar role={auth.role} companyName={companyName} userName={auth.fullName ?? auth.email ?? "Usuário"} />
      <main className="content">{children}</main>
    </div>
  );
}
