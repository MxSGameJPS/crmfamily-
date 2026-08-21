# CRM Family

CRM multiempresa para **Sedux**, **Schemmer Cell** e **House Pet**, com uma base compartilhada, dados isolados por empresa e painel **SuperAdmin somente leitura** para os dados operacionais.

Cada loja possui identidade visual e recursos próprios, mas continua usando a mesma aplicação, autenticação e infraestrutura.

## O que esta versão cobre

### Recursos comuns às três empresas
- Login com Supabase Auth.
- Isolamento por empresa no banco com Row Level Security (RLS).
- Produtos e estoque, estoque mínimo e histórico de movimentação.
- Clientes.
- Vendas com múltiplos itens.
- Financeiro: entradas, saídas, pendências e baixas.
- Fornecedores.
- Clientes devedores / contas a receber.
- Compras e reposição de estoque.
- Central de alertas operacionais.
- Lucro bruto estimado com custo histórico por item vendido.
- Auditoria das operações dos módulos novos.
- Edição e arquivamento de produtos, clientes e fornecedores.

### Schemmer Cell
- Tema visual azul/preto/branco baseado na identidade da empresa.
- Módulo de Assistência Técnica.
- Ordens de serviço com cliente, aparelho, IMEI, série, estado físico, defeito, acessórios, técnico, orçamento, peças, mão de obra e previsão.
- Fluxo de status: recebido, análise, aguardando aprovação, aguardando peça, manutenção, pronto, entregue e cancelado.
- Controle de garantia por ordem de serviço.
- Controle individual de aparelhos por IMEI e número de série.
- Valor de compra, valor de venda, cor e garantia por unidade.
- Alertas de aparelhos prontos e ordens aguardando peça.

> Por segurança, senha de desbloqueio de aparelho não é armazenada em texto aberto pelo CRM.

### House Pet
- Tema visual vermelho/vinho/branco baseado na identidade da empresa.
- Cadastro de pets vinculados ao tutor.
- Espécie, raça, sexo, nascimento, peso, castração, alergias, comportamento, medicamentos, foto e observações.
- Agenda de banho, tosa e demais serviços.
- Responsável pelo atendimento, valor e observações.
- Fluxo de status: agendado, confirmado, em atendimento, pronto, entregue e cancelado.
- Central de alertas com agenda do dia.
- Histórico de atendimentos preservado pela agenda.

### Sedux
- Tema visual preto/pink/magenta baseado na identidade da empresa.
- Variações de produto por cor, tamanho, modelo, sabor e volume.
- Estoque e estoque mínimo por variação.
- Lotes e controle de validade.
- Alerta de produtos próximos do vencimento.
- Kits compostos por vários produtos.
- Venda rápida de kit com baixa automática dos componentes.
- Venda do kit integrada a vendas, estoque e financeiro.

### Compras e reposição
- Pedido de compra por fornecedor.
- Produto, quantidade, custo unitário, documento/nota e situação de pagamento.
- A mercadoria só altera estoque quando é efetivamente recebida.
- Ao receber a compra, o sistema:
  1. aumenta o estoque;
  2. registra a movimentação;
  3. atualiza o custo do produto;
  4. marca a compra como recebida;
  5. cria a saída correspondente no financeiro.

### SuperAdmin
- Visão consolidada das três empresas.
- Faturamento, lucro bruto estimado, clientes, entradas, saídas, dívidas e estoque baixo.
- Lista de faltas.
- Relatórios CSV consolidados ou por empresa de:
  - vendas;
  - lucro bruto;
  - clientes;
  - financeiro;
  - compras;
  - fornecedores;
  - estoque;
  - lista de faltas;
  - devedores;
  - auditoria.
- Criação de login para uma loja.
- Geração segura de nova senha para os acessos das lojas.
- **Sem permissão de inserir, editar ou apagar dados operacionais das lojas.** Essa regra está no RLS do Supabase, e não apenas na interface.

## Fora deste escopo

**PDV / Frente de Caixa não foi incluído nesta atualização.** Ele permanece separado para implementação comercial posterior.

## Stack

- Next.js 16.3 App Router
- React 19.2
- TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- Vercel
- Manifest PWA

## Atualizando um banco que já existe

Depois de fazer pull desta versão, abra o **SQL Editor** do Supabase e execute uma vez:

```text
supabase/upgrade-2026-08-21.sql
```

Esse upgrade:
- renomeia as empresas para Sedux, Schemmer Cell e House Pet;
- cria as tabelas dos módulos especializados;
- adiciona custo histórico aos itens vendidos;
- cria compras, auditoria, kits, lotes e variações;
- adiciona políticas RLS e permissões;
- cria as funções transacionais de recebimento de compra e venda de kit.

Depois rode:

```bash
npm install
npm run typecheck
npm run dev
```

## Projeto novo

Em um projeto Supabase novo:

1. Execute primeiro:

```text
supabase/schema.sql
```

2. Em seguida execute:

```text
supabase/upgrade-2026-08-21.sql
```

3. Configure `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
SUPERADMIN_EMAIL=...
SUPERADMIN_PASSWORD=...
SUPERADMIN_NAME=...
```

**Nunca** coloque `SUPABASE_SECRET_KEY` em variável `NEXT_PUBLIC_`.

4. Crie o primeiro SuperAdmin:

```bash
node --env-file=.env.local scripts/bootstrap-superadmin.mjs
```

5. Rode:

```bash
npm run dev
```

O SuperAdmin poderá entrar no CRM e, na tela **Acessos das lojas**, criar os logins da Sedux, Schemmer Cell e House Pet.

## Fluxo de venda comum

A venda normal continua sendo criada em uma função transacional no PostgreSQL. Ao concluir uma venda, o sistema:

1. cria a venda e seus itens;
2. valida se existe estoque suficiente;
3. baixa o estoque;
4. grava a movimentação de estoque;
5. lança no financeiro o valor efetivamente recebido;
6. se houver valor pendente, cria automaticamente uma conta a receber para o cliente;
7. o custo do produto é gravado no item vendido para permitir cálculo posterior de lucro bruto.

Assim, estoque, vendas, financeiro, devedores e margem permanecem sincronizados.

## Regra de acesso

Cada usuário de loja recebe `role` e `company_id` em `app_metadata` do Supabase Auth. Isso é definido apenas pelo backend administrativo. O RLS usa essas informações para separar os dados.

- `store_admin` / `store_user`: operam apenas a própria empresa.
- `super_admin`: consulta todas as empresas, mas não possui políticas de escrita nas tabelas operacionais.

## Segurança importante

A chave secreta do Supabase é usada apenas em rotas de servidor para criar usuários e redefinir senhas. Ela nunca é enviada ao navegador. As páginas autenticadas são dinâmicas e o proxy mantém a sessão SSR conforme o padrão atual do Supabase/Next.js.
