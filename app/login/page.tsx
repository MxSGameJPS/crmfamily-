import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-hero">
        <span className="eyebrow">GESTÃO MULTILOJAS</span>
        <h2>Três empresas.<br />Uma visão organizada.</h2>
        <p>Estoque, clientes, vendas, financeiro, fornecedores e devedores em um único sistema, com os dados de cada empresa separados.</p>
        <div className="company-pills">
          <span>Sexy Shop</span><span>Loja de Celular</span><span>PetShop</span>
        </div>
      </section>
      <LoginForm />
    </main>
  );
}
