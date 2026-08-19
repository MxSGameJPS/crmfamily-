import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { createFinancialTransaction, markFinancialPaid } from "@/lib/actions";
import { requireStoreUser } from "@/lib/auth";
import { brl, dateBR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function FinancePage() {
  await requireStoreUser();
  const supabase = await createClient();
  const { data: rows } = await supabase.from("financial_transactions").select("*").order("created_at", { ascending: false }).limit(200);
  const list = rows ?? [];
  const paidIncome = list.filter((r) => r.transaction_type === "income" && r.status === "paid").reduce((a, r) => a + Number(r.amount), 0);
  const paidExpense = list.filter((r) => r.transaction_type === "expense" && r.status === "paid").reduce((a, r) => a + Number(r.amount), 0);
  const pending = list.filter((r) => r.status === "pending").reduce((a, r) => a + Number(r.amount), 0);
  return <>
    <PageHeader eyebrow="CAIXA" title="Financeiro" description="Controle entradas, despesas, vencimentos e valores já realizados." />
    <div className="stat-grid">
      <StatCard label="Entradas realizadas" value={brl(paidIncome)} tone="success" />
      <StatCard label="Saídas realizadas" value={brl(paidExpense)} />
      <StatCard label="Saldo realizado" value={brl(paidIncome - paidExpense)} tone="success" />
      <StatCard label="Lançamentos pendentes" value={brl(pending)} tone={pending ? "warning" : "default"} />
    </div>
    <section className="panel"><div className="panel-head"><h2>Novo lançamento</h2></div><div className="panel-body"><form action={createFinancialTransaction} className="form-grid">
      <label>Tipo<select name="transaction_type"><option value="expense">Despesa / saída</option><option value="income">Entrada</option></select></label>
      <label>Status<select name="status"><option value="pending">Pendente</option><option value="paid">Pago / recebido</option></select></label>
      <label>Categoria<input name="category" required placeholder="Aluguel, compra, serviços..." /></label>
      <label>Valor (R$)<input name="amount" type="number" min="0.01" step="0.01" required /></label>
      <label className="wide">Descrição<input name="description" required /></label>
      <label>Vencimento<input name="due_date" type="date" /></label>
      <div className="form-actions"><button className="primary">Adicionar lançamento</button></div>
    </form></div></section>
    <section className="panel section-gap"><div className="panel-head"><h2>Movimentações</h2><span className="badge">{list.length}</span></div><div className="table-wrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Vencimento</th><th>Status</th><th>Valor</th><th></th></tr></thead><tbody>
      {list.map((r) => <tr key={r.id}><td>{dateBR(r.created_at)}</td><td>{r.transaction_type === "income" ? "Entrada" : "Saída"}</td><td>{r.category}</td><td>{r.description}</td><td>{dateBR(r.due_date)}</td><td><span className={`badge ${r.status === "paid" ? "success" : r.status === "pending" ? "warning" : ""}`}>{r.status === "paid" ? "Realizado" : r.status === "pending" ? "Pendente" : "Cancelado"}</span></td><td className="amount">{brl(r.amount)}</td><td>{r.status === "pending" ? <form action={markFinancialPaid}><input type="hidden" name="id" value={r.id}/><button className="secondary">Dar baixa</button></form> : null}</td></tr>)}
      {!list.length ? <tr><td colSpan={8} className="empty">Nenhum lançamento financeiro.</td></tr> : null}
    </tbody></table></div></section>
  </>;
}
