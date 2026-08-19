# CRM Family

CRM multiempresa para **Sexy Shop**, **Loja de Celular** e **PetShop**, com painel **SuperAdmin somente leitura** para os dados operacionais.

## O que esta versão já cobre

### Cada empresa
- Login com Supabase Auth.
- Isolamento por empresa no próprio banco (RLS).
- Produtos e estoque, com estoque mínimo e histórico de movimentação.
- Clientes.
- Vendas com múltiplos itens.
- Financeiro (entradas, saídas, pendências e baixa).
- Fornecedores.
- Clientes devedores / contas a receber.
- Edição e arquivamento de produtos, clientes e fornecedores.

### SuperAdmin
- Visão consolidada das três empresas.
- Faturamento, clientes, entradas, saídas, dívidas e estoque baixo.
- Lista de faltas.
- Relatórios CSV de vendas, clientes, financeiro, fornecedores, estoque e devedores.
- Relatórios consolidados ou separados por empresa.
- Criação de login para uma loja.
- Geração segura de nova senha para os acessos das lojas.
- **Sem permissão de inserir, editar ou apagar dados operacionais das lojas.** Essa regra está no RLS do Supabase, e não apenas na interface.

## Stack

- Next.js 16.3 App Router
- React 19.2
- TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- Vercel
- Manifest PWA

## Como iniciar

### 1. Criar projeto no Supabase

Crie um projeto e abra o **SQL Editor**. Execute o conteúdo de:

```text
supabase/schema.sql
```

Esse arquivo cria as tabelas, políticas de segurança, funções transacionais e também cadastra as três empresas iniciais.

> O schema dá `GRANT` explícito para `authenticated`, porque projetos Supabase novos podem não expor tabelas novas automaticamente na Data API. O RLS continua controlando quais linhas cada usuário enxerga e altera.

### 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
SUPERADMIN_EMAIL=...
SUPERADMIN_PASSWORD=...
SUPERADMIN_NAME=...
```

**Nunca** coloque `SUPABASE_SECRET_KEY` em variável `NEXT_PUBLIC_`.

### 3. Instalar dependências

```bash
npm install
```

Depois do primeiro `npm install`, **commite o `package-lock.json`** para manter as dependências travadas.

### 4. Criar o primeiro SuperAdmin

```bash
node --env-file=.env.local scripts/bootstrap-superadmin.mjs
```

O SuperAdmin poderá entrar no CRM e, na tela **Acessos das lojas**, criar os logins da Sexy Shop, Loja de Celular e PetShop.

### 5. Rodar localmente

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Fluxo de venda

A venda é criada em uma função transacional no PostgreSQL. Ao concluir uma venda, o sistema:

1. cria a venda e seus itens;
2. valida se existe estoque suficiente;
3. baixa o estoque;
4. grava a movimentação de estoque;
5. lança no financeiro o valor efetivamente recebido;
6. se houver valor pendente, cria automaticamente uma conta a receber para o cliente.

Assim, estoque, vendas, financeiro e devedores permanecem sincronizados.

## Regra de acesso

Cada usuário de loja recebe `role` e `company_id` em `app_metadata` do Supabase Auth. Isso é definido apenas pelo backend administrativo. O RLS usa essas informações para separar os dados.

- `store_admin` / `store_user`: podem operar apenas a própria empresa.
- `super_admin`: pode consultar todas as empresas, mas não possui políticas de escrita nas tabelas operacionais.

## Próximos upgrades recomendados

A estrutura foi feita para evoluir sem recriar o CRM. Algumas extensões que fazem sentido:

- **Frente de caixa (PDV)**: sessão de caixa, abertura/fechamento, sangria e suprimento.
- **Loja de celular**: controle de IMEI/número de série e garantia por unidade.
- **PetShop**: cadastro de pets por cliente, histórico de banho/tosa e agenda.
- **Sexy Shop**: variações de produto (cor/tamanho) e estoque por variante.
- Importação inicial por CSV.
- Relatórios em PDF além do CSV.
- Auditoria detalhada de alterações por usuário.

## Segurança importante

A chave secreta do Supabase é usada apenas em rotas de servidor para criar usuários e redefinir senhas. Ela nunca é enviada ao navegador. As páginas autenticadas são dinâmicas e o proxy mantém a sessão SSR conforme o padrão atual do Supabase/Next.js.
