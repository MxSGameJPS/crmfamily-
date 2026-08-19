import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { requireUser } from "@/lib/auth";
import { brl, dateBR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

function sum(rows: Array<Record<string, unknown>> | null, key: string) {
  return (rows ?? []).reduce((acc, row) => acc + Number(row[key] ?? 0), 0);
}

export default async function DashboardPage() {
  const auth = await requireUser();
  const supabase = await createClient();

  if (auth.role === "super_admin") {
    const [companiesR, salesR, customersR, productsR, financialR, receivablesR] = await Promise.all([
      supabase.from("companies").select("id,name,slug").eq("is_active", true).order("name"),
      supabase.from("sales").select("company_id,total,status,sold_at").eq("status", "completed"),
      supabase.from("customers").select("id,company_id").eq("is_active", true),
      supabase.from("products").select("id,company_id,name,sku,stock_qty,min_stock").eq("is_active", true),
      supabase.from("financial_transactions").select("company_id,transaction_type,amount,status"),
      supabase.from("receivables").select("company_id,amount_total,amount_paid,status").in("status", ["open", "partial"]),
    ]);

    const companies = companiesR.data ?? [];
    const sales = salesR.data ?? [];
    const customers = customersR.data ?? [];
    const products = productsR.data ?? [];
    const financial = financialR.data ?? [];
    const receivables = receivablesR.data ?? [];
    const lowStock = products.filter((p) => Number(p.stock_qty) <= Number(p.min_stock));
    const debt = receivables.reduce((a, r) => a + Number(r.amount_total) - Number(r.amount_paid), 0);

    return (
      <>
        <PageHeader eyebrow="SUPERADMIN" title="Visão geral das empresas" description="Leitura consolidada. O SuperAdmin não altera dados operacionais das lojas." />
        <div className="stat-grid">
          <StatCard label="Vendas registradas" value={String(sales.length)} hint="Todas as empresas" />
          <StatCard label="Faturamento acumulado" value={brl(sum(sales, "total"))} tone="success" />
          <StatCard label="Clientes ativos" value={String(customers.length)} />
          <StatCard label="Total em aberto" value={brl(debt)} tone={debt > 0 ? "warning" : "default"} />
        </div>
        <div className="company-grid">
          {companies.map((company) => {
            const cSales = sales.filter((r) => r.company_id === company.id);
            const cCustomers = customers.filter((r) => r.company_id === company.id);
            const cFinancial = financial.filter((r) => r.company_id === company.id && r.status === "paid");
            const cIncome = cFinancial.filter((r) => r.transaction_type === "income").reduce((a, r) => a + Number(r.amount), 0);
            const cExpense = cFinancial.filter((r) => r.transaction_type === "expense").reduce((a, r) => a + Number(r.amount), 0);
            const cLow = lowStock.filter((r) => r.company_id === company.id).length;
            return (
              <article className="company-card" key={company.id}>
                <span className="eyebrow">EMPRESA</span><h3>{company.name}</h3>
                <div className="metrics">
                  <div><small>Vendas</small><strong>{cSales.length}</strong></div>
                  <div><small>Faturamento</small><strong>{brl(cSales.reduce((a, r) => a + Number(r.total), 0))}</strong></div>
                  <div><small>Clientes</small><strong>{cCustomers.length}</strong></div>
                  <div><small>Faltas</small><strong>{cLow}</strong></div>
                  <div><small>Entradas</small><strong>{brl(cIncome)}</strong></div>
                  <div><small>Saídas</small><strong>{brl(cExpense)}</strong></div>
                </div>
              </article>
            );
          })}
        </div>
        <section className="panel section-gap">
          <div className="panel-head"><h2>Lista de faltas / estoque baixo</h2><span className="badge warning">{lowStock.length} item(ns)</span></div>
          <div className="table-wrap"><table><thead><tr><th>Empresa</th><th>Produto</th><th>SKU</th><th>Estoque</th><th>Mínimo</th></tr></thead><tbody>
            {lowStock.map((p) => <tr key={p.id}><td>{companies.find((c) => c.id === p.company_id)?.name ?? "—"}</td><td>{p.name}</td><td>{p.sku}</td><td>{p.stock_qty}</td><td>{p.min_stock}</td></tr>)}
            {!lowStock.length ? <tr><td colSpan={5} className="empty">Nenhum produto em falta.</td></tr> : null}
          </tbody></table></div>
        </section>
      </>
    );
  }

  const [companyR, productsR, customersR, salesR, financialR, receivablesR] = await Promise.all([
    supabase.from("companies").select("name").eq("id", auth.companyId!).single(),
    supabase.from("products").select("id,name,stock_qty,min_stock").eq("is_active", true),
    supabase.from("customers").select("id").eq("is_active", true),
    supabase.from("sales").select("id,sale_number,total,payment_status,sold_at").eq("status", "completed").order("sold_at", { ascending: false }).limit(8),
    supabase.from("financial_transactions").select("transaction_type,amount,status"),
    supabase.from("receivables").select("amount_total,amount_paid,status").in("status", ["open","partial"]),
  ]);
  const products = productsR.data ?? [];
  const sales = salesR.data ?? [];
  const fin = financialR.data ?? [];
  const income = fin.filter((r) => r.transaction_type === "income" && r.status === "paid").reduce((a, r) => a + Number(r.amount), 0);
  const expense = fin.filter((r) => r.transaction_type === "expense" && r.status === "paid").reduce((a, r) => a + Number(r.amount), 0);
  const low = products.filter((p) => Number(p.stock_qty) <= Number(p.min_stock));
  const debt = (receivablesR.data ?? []).reduce((a, r) => a + Number(r.amount_total) - Number(r.amount_paid), 0);

  return (
    <>
      <PageHeader eyebrow="PAINEL DA LOJA" title={companyR.data?.name ?? "Minha empresa"} description="Resumo operacional e financeiro da empresa." />
      <div className="stat-grid">
        <StatCard label="Produtos ativos" value={String(products.length)} hint={`${low.length} em estoque baixo`} tone={low.length ? "warning" : "default"} />
        <StatCard label="Clientes" value={String(customersR.data?.length ?? 0)} />
        <StatCard label="Saldo realizado" value={brl(income - expense)} hint={`Entradas ${brl(income)} • Saídas ${brl(expense)}`} tone="success" />
        <StatCard label="Clientes devedores" value={brl(debt)} tone={debt > 0 ? "warning" : "default"} />
      </div>
      <div className="grid-2">
        <section className="panel"><div className="panel-head"><h2>Vendas recentes</h2></div><div className="table-wrap"><table><thead><tr><th>Venda</th><th>Data</th><th>Pagamento</th><th>Total</th></tr></thead><tbody>
          {sales.map((s) => <tr key={s.id}><td>#{s.sale_number}</td><td>{dateBR(s.sold_at)}</td><td><span className={`badge ${s.payment_status === "paid" ? "success" : "warning"}`}>{s.payment_status === "paid" ? "Pago" : s.payment_status === "partial" ? "Parcial" : "Pendente"}</span></td><td className="amount">{brl(s.total)}</td></tr>)}
          {!sales.length ? <tr><td colSpan={4} className="empty">Nenhuma venda registrada.</td></tr> : null}
        </tbody></table></div></section>
        <section className="panel"><div className="panel-head"><h2>Estoque baixo</h2><span className="badge warning">{low.length}</span></div><div className="table-wrap"><table><thead><tr><th>Produto</th><th>Atual</th><th>Mínimo</th></tr></thead><tbody>
          {low.slice(0,8).map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.stock_qty}</td><td>{p.min_stock}</td></tr>)}
          {!low.length ? <tr><td colSpan={3} className="empty">Estoque em ordem.</td></tr> : null}
        </tbody></table></div></section>
      </div>
    </>
  );
}
