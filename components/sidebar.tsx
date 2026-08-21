"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCompanyBrand } from "@/lib/company-brand";
import type { UserRole } from "@/lib/types";

const baseStoreItems = [
  ["/dashboard", "Visão geral", "⌂"],
  ["/dashboard/produtos", "Produtos e estoque", "□"],
  ["/dashboard/clientes", "Clientes", "♙"],
  ["/dashboard/vendas", "Vendas", "▣"],
  ["/dashboard/compras", "Compras", "⇩"],
  ["/dashboard/financeiro", "Financeiro", "$"],
  ["/dashboard/fornecedores", "Fornecedores", "◇"],
  ["/dashboard/devedores", "Clientes devedores", "!"],
  ["/dashboard/alertas", "Central de alertas", "●"],
] as const;

const superItems = [
  ["/dashboard", "Visão geral", "⌂"],
  ["/dashboard/relatorios", "Relatórios", "▤"],
  ["/dashboard/acessos", "Acessos das lojas", "⚿"],
] as const;

type Props = {
  role: UserRole;
  companyName: string;
  companySlug?: string | null;
  userName: string;
};

export function Sidebar({ role, companyName, companySlug, userName }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const brand = getCompanyBrand(companySlug, companyName);

  const items = useMemo(() => {
    if (role === "super_admin") return superItems;

    const specialized = brand.key === "schemmer"
      ? [["/dashboard/assistencia", "Assistência técnica", "⚙"] as const]
      : brand.key === "housepet"
        ? [["/dashboard/pets", "Pets e agenda", "♥"] as const]
        : brand.key === "sedux"
          ? [["/dashboard/catalogo", "Variações, kits e validade", "◆"] as const]
          : [];

    return [baseStoreItems[0], ...specialized, ...baseStoreItems.slice(1)];
  }, [role, brand.key]);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erro ao sair:", error.message);
      setLoggingOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <div className="side-brand">
        <span>{role === "super_admin" ? "CF" : brand.short}</span>
        <div>
          <strong>{role === "super_admin" ? "CRM Family" : brand.name}</strong>
          <small>{role === "super_admin" ? "SuperAdmin" : brand.businessLabel}</small>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          title="Sair da conta"
          aria-label="Sair da conta"
          className="logout-button"
        >
          {loggingOut ? "Saindo..." : "Sair"}
        </button>
      </div>
      <nav>
        {items.map(([href, label, icon]) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return <Link key={href} href={href} className={active ? "active" : ""}><b>{icon}</b>{label}</Link>;
        })}
      </nav>
      <div className="side-user">
        <small>Conectado como</small>
        <strong>{userName}</strong>
      </div>
    </aside>
  );
}
