"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

const storeItems = [
  ["/dashboard", "Visão geral", "⌂"],
  ["/dashboard/produtos", "Produtos e estoque", "□"],
  ["/dashboard/clientes", "Clientes", "♙"],
  ["/dashboard/vendas", "Vendas", "▣"],
  ["/dashboard/financeiro", "Financeiro", "$"],
  ["/dashboard/fornecedores", "Fornecedores", "◇"],
  ["/dashboard/devedores", "Clientes devedores", "!"],
] as const;

const superItems = [
  ["/dashboard", "Visão geral", "⌂"],
  ["/dashboard/relatorios", "Relatórios", "▤"],
  ["/dashboard/acessos", "Acessos das lojas", "⚿"],
] as const;

export function Sidebar({ role, companyName, userName }: { role: UserRole; companyName: string; userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = role === "super_admin" ? superItems : storeItems;

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <div className="side-brand"><span>CF</span><div><strong>CRM Family</strong><small>{role === "super_admin" ? "SuperAdmin" : companyName}</small></div></div>
      <nav>
        {items.map(([href, label, icon]) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return <Link key={href} href={href} className={active ? "active" : ""}><b>{icon}</b>{label}</Link>;
        })}
      </nav>
      <div className="side-user">
        <small>Conectado como</small>
        <strong>{userName}</strong>
        <button onClick={logout}>Sair</button>
      </div>
    </aside>
  );
}
