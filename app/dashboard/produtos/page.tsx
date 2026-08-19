import { PageHeader } from "@/components/page-header";
import { adjustStock, archiveProduct, createProduct } from "@/lib/actions";
import { requireStoreUser } from "@/lib/auth";
import { brl } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage() {
  await requireStoreUser();
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("*").eq("is_active", true).order("name");
  const lowStockProducts = (products ?? []).filter((p) => Number(p.stock_qty) <= Number(p.min_stock));
  const outOfStockProducts = lowStockProducts.filter((p) => Number(p.stock_qty) <= 0);

  return <>
    <PageHeader eyebrow="OPERAÇÃO" title="Produtos e estoque" description="Cadastre produtos, preços, estoque mínimo e registre cada entrada ou saída." />

    {lowStockProducts.length > 0 ? (
      <section className={`stock-alert ${outOfStockProducts.length > 0 ? "critical" : ""}`} role="alert">
        <div className="stock-alert-icon">!</div>
        <div className="stock-alert-copy">
          <strong>{outOfStockProducts.length > 0 ? "Atenção: há produto sem estoque" : "Atenção ao estoque mínimo"}</strong>
          <p>
            {lowStockProducts.length} produto(s) precisam de reposição.
            {outOfStockProducts.length > 0 ? ` ${outOfStockProducts.length} já estão zerados.` : " Eles chegaram ao estoque mínimo configurado."}
          </p>
        </div>
        <span className="stock-alert-count">{lowStockProducts.length}</span>
      </section>
    ) : null}

    <div className="grid-2">
      <section className="panel"><div className="panel-head"><h2>Novo produto</h2></div><div className="panel-body">
        <form action={createProduct} className="form-grid">
          <label>SKU<input name="sku" required placeholder="Ex.: CEL-001" /></label>
          <label>Código de barras<input name="barcode" placeholder="Opcional" /></label>
          <label className="wide">Nome<input name="name" required /></label>
          <label>Categoria<input name="category" /></label>
          <label>Estoque inicial<input name="stock_qty" type="number" step="0.001" min="0" defaultValue="0" /></label>
          <label>Estoque mínimo<input name="min_stock" type="number" step="0.001" min="0" defaultValue="0" /></label>
          <label>Custo (R$)<input name="cost" type="number" step="0.01" min="0" defaultValue="0" /></label>
          <label>Preço de venda (R$)<input name="price" type="number" step="0.01" min="0" required /></label>
          <label className="wide">Descrição<textarea name="description" /></label>
          <div className="form-actions"><button className="primary">Cadastrar produto</button></div>
        </form>
      </div></section>
      <section className="panel"><div className="panel-head"><h2>Ajustar estoque</h2></div><div className="panel-body">
        <form action={adjustStock} className="form-grid">
          <label className="wide">Produto<select name="product_id" required><option value="">Selecione...</option>{products?.map((p) => <option key={p.id} value={p.id}>{p.name} — estoque {p.stock_qty}</option>)}</select></label>
          <label>Quantidade (+ entrada / - saída)<input name="quantity_change" type="number" step="0.001" required placeholder="Ex.: 10 ou -2" /></label>
          <label>Motivo<input name="reason" required placeholder="Compra, perda, correção..." /></label>
          <div className="form-actions"><button className="secondary">Registrar ajuste</button></div>
        </form>
        <p className="callout section-gap">Toda alteração de estoque fica registrada. As vendas também baixam estoque automaticamente.</p>
      </div></section>
    </div>
    <section className="panel section-gap"><div className="panel-head"><h2>Produtos ativos</h2><span className={`badge ${lowStockProducts.length ? "warning" : ""}`}>{products?.length ?? 0}</span></div><div className="table-wrap"><table><thead><tr><th>Produto</th><th>SKU</th><th>Categoria</th><th>Custo</th><th>Venda</th><th>Estoque</th><th>Status</th><th></th></tr></thead><tbody>
      {products?.map((p) => {
        const low = Number(p.stock_qty) <= Number(p.min_stock);
        const out = Number(p.stock_qty) <= 0;
        return <tr key={p.id} className={low ? (out ? "low-stock-row critical" : "low-stock-row") : ""}>
          <td><strong>{p.name}</strong>{low ? <small className="stock-row-note">Reposição necessária</small> : null}</td>
          <td>{p.sku}</td>
          <td>{p.category ?? "—"}</td>
          <td>{brl(p.cost)}</td>
          <td className="amount">{brl(p.price)}</td>
          <td><strong className={low ? "stock-value-alert" : ""}>{p.stock_qty}</strong><small className="stock-minimum">mín. {p.min_stock}</small></td>
          <td><span className={`badge ${out ? "danger" : low ? "warning" : "success"}`}>{out ? "Sem estoque" : low ? "Estoque mínimo" : "Normal"}</span></td>
          <td><div className="toolbar"><a className="secondary" href={`/dashboard/produtos/${p.id}`}>Editar</a><form action={archiveProduct}><input type="hidden" name="id" value={p.id}/><button className="danger">Arquivar</button></form></div></td>
        </tr>;
      })}
      {!products?.length ? <tr><td colSpan={8} className="empty">Nenhum produto cadastrado.</td></tr> : null}
    </tbody></table></div></section>
  </>;
}
