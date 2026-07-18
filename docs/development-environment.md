# Ambiente de desenvolvimento local

## Reconstrução

Pré-requisitos:

- Node.js e dependências instaladas com `npm install`.
- Docker Desktop em execução.

Execute:

```powershell
npm run db:reset
```

O comando usa o Supabase CLI fixado nas dependências do projeto, recria o banco, aplica todas as migrations em ordem e executa `supabase/seed.sql`. O script interrompe imediatamente se Docker ou o CLI local não estiverem disponíveis.

## Contas fictícias

Uso exclusivo em ambiente local:

- Administrador: `admin@femmora.local` / `FemmoraAdmin123!`
- Cliente: `cliente@femmora.local` / `FemmoraCliente123!`

Essas credenciais nunca devem ser copiadas para ambientes hospedados.

## Conteúdo do seed

- Um superadministrador e um cliente.
- Endereço fictício.
- Marca, categorias, coleção, produtos e variantes.
- Tamanhos e cores normalizados.
- Estoque e movimentos iniciais consistentes.
- Carrinho ativo.
- Pedido pago e pagamento fictício, sem integração externa.
- Cupom, favorito, newsletter, banner e configurações públicas.

O seed utiliza UUIDs fixos e operações idempotentes para facilitar testes e depuração.
