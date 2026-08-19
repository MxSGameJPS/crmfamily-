import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { requireSuperAdmin } from "@/lib/auth";
import { brl } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const reportTypes = [
  ["sales", "Vendas", "Vendas, valores recebidos, forma e situação do pagamento"],
  ["customers", "Clientes", "Cadastro de clientes por empresa"],
  ["finance", "Financeiro", "Entradas, saídas, categorias e vencimentos"],
  ["suppliers", "Fornecedores", "Fornecedores e contatos"],
  ["stock", "Estoque completo", "Produtos, preços, estoque atual e mínimo"],
  ["low-stock", "Lista de faltas", "Somente produtos em estoque baixo ou zerado"],
  ["debtors", "Clientes devedores", "Valores em aberto, pagos e vencimentos"],
] as const;

export default async function ReportsPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const [companiesR, salesR, financeR, debtR, productsR] = await Promise.all([
    supabase.from("companies").select("id,name").eq("is_active", true).order("name"),
    supabase.from("sales").select("company_id,total").eq("status", "completed"),
    supabase.from("financial_transactions").select("company_id,transaction_type,amount,status"),
    supabase.from("receivables").select("company_id,amount_total,amount_paid,status").in("status", ["open","partial"]),
    supabase.from("products").select("company_id,stock_qty,min_stock").eq("is_active", true),
  ]);
  const companies = companiesR.data ?? [];
  const totalSales = (salesR.data ?? []).reduce((a, r) => a + Number(r.total), 0);
  const realized = (financeR.data ?? []).filter((r) => r.status === "paid");
  const income = realized.filter((r) => r.transaction_type === "income").reduce((a,r)=>a+Number(r.amount),0);
  const expense = realized.filter((r) => r.transaction_type === "expense").reduce((a,r)=>a+Number(r.amount),0);
  const debt = (debtR.data ?? []).reduce((a,r)=>a+Number(r.amount_total)-Number(r.amount_paid),0);
  const low = (productsR.data ?? []).filter((r)=>Number(r.stock_qty)<=Number(r.min_stock)).length;

  return <>
    <PageHeader eyebrow="SUPERADMIN" title="Relatórios" description="Relatórios consolidados ou por empresa. Downloads em CSV abrem normalmente no Excel e Google Planilhas." />
    <div className="stat-grid"><StatCard label="Faturamento registrado" value={brl(totalSales)} /><StatCard label="Entradas realizadas" value={brl(income)} tone="success" /><StatCard label="Saídas realizadas" value={brl(expense)} /><StatCard label="Em aberto" value={brl(debt)} tone={debt ? "warning" : "default"} /></div>
    <p className="callout">Existem <strong>{low} produto(s)</strong> na lista de faltas considerando as três empresas.</p>
    <section className="panel section-gap"><div className="panel-head"><h2>Gerar relatórios</h2></div><div className="table-wrap"><table><thead><tr><th>Relatório</th><th>Conteúdo</th><th>Consolidado</th><th>Por empresa</th></tr></thead><tbody>
      {reportTypes.map(([type,title,desc]) => <tr key={type}><td><strong>{title}</strong></td><td>{desc}</td><td><a className="secondary" href={`/api/reports?type=${type}`}>Baixar CSV</a></td><td><div className="toolbar">{companies.map((c)=><a key={c.id} className="secondary" href={`/api/reports?type=${type}&companyId=${c.id}`}>{c.name}</a>)}</div></td></tr>)}
    </tbody></table></div></section>
  </>;
}
