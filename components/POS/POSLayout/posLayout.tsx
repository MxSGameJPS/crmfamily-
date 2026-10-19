"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./posLayout.module.css";

type CompanyOption = {
  id: string;
  name: string;
};

type Props = {
  companyName: string;
  businessLabel: string;
  brandShort: string;
  userName: string;
  cashOpen: boolean;
  centralMode?: boolean;
  selectedCompanyId?: string;
  companies?: CompanyOption[];
  children: React.ReactNode;
};

const items = [
  ["/caixa", "Frente de caixa", "PDV"],
  ["/caixa/agenda", "Agenda", "Hoje"],
  ["/caixa/historico", "Histórico", "Vendas"],
] as const;

export function POSLayout({
  companyName,
  businessLabel,
  brandShort,
  userName,
  cashOpen,
  centralMode = false,
  selectedCompanyId,
  companies = [],
  children,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [switchingCompany, setSwitchingCompany] = useState(false);
  const [switchError, setSwitchError] = useState("");

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function switchCompany(companyId: string) {
    if (!companyId || companyId === selectedCompanyId || switchingCompany) return;
    if (!window.confirm("Trocar a empresa ativa do PDV? Uma venda em andamento será descartada.")) return;

    setSwitchingCompany(true);
    setSwitchError("");

    try {
      const response = await fetch("/api/pos/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível trocar a empresa.");

      router.refresh();
      setSwitchingCompany(false);
    } catch (error) {
      setSwitchError(error instanceof Error ? error.message : "Não foi possível trocar a empresa.");
      setSwitchingCompany(false);
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brandBlock}>
          <span className={styles.brandMark}>{brandShort}</span>
          <div>
            <span className={styles.kicker}>{centralMode ? "PDV CENTRAL" : "FRENTE DE CAIXA"}</span>
            <strong>{companyName}</strong>
            <small>{businessLabel}</small>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Navegação do caixa">
          {items.map(([href, label, detail]) => {
            const active = href === "/caixa" ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={active ? styles.active : ""}>
                <span>{label}</span>
                <small>{detail}</small>
              </Link>
            );
          })}
        </nav>

        <div className={styles.operator}>
          {centralMode && companies.length > 1 ? (
            <label className={styles.companySwitch}>
              <small>Empresa da venda</small>
              <select
                value={selectedCompanyId}
                onChange={(event) => void switchCompany(event.target.value)}
                disabled={switchingCompany}
                aria-label="Empresa ativa do PDV"
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
              {switchError ? <span>{switchError}</span> : null}
            </label>
          ) : null}

          <span className={`${styles.cashStatus} ${cashOpen ? styles.open : styles.closed}`}>
            <i /> {cashOpen ? "Caixa aberto" : "Caixa fechado"}
          </span>
          <div>
            <small>Operador</small>
            <strong>{userName}</strong>
          </div>
          <button type="button" onClick={logout} disabled={loggingOut}>{loggingOut ? "Saindo..." : "Sair"}</button>
        </div>
      </header>

      <main className={styles.content}>{children}</main>

      <nav className={styles.mobileNav} aria-label="Navegação móvel do caixa">
        {items.map(([href, label]) => {
          const active = href === "/caixa" ? pathname === href : pathname.startsWith(href);
          return <Link key={href} href={href} className={active ? styles.active : ""}>{label}</Link>;
        })}
      </nav>
    </div>
  );
}
