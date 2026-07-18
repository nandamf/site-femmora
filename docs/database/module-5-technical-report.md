# Relatório técnico — Módulo 5

## Entrega

- 12 migrations pequenas e ordenadas de `001_profiles` a `012_rpc`.
- 30 tabelas de domínio, além das fundações anteriores de auditoria/RBAC.
- 2 views administrativas com segurança do invocador.
- 1 RPC pública necessária, transacional e permissionada.
- Tipos enum para estados fechados e ações controladas.
- Relacionamentos por PK/FK; nenhum relacionamento comercial depende de texto.

## Integridade

- Produtos são separados de SKUs.
- Tamanho/cor são opções normalizadas e extensíveis.
- Estoque é exclusivamente por variante/local.
- Pedidos e itens preservam snapshots.
- Ledgers de estoque, status e resgate são imutáveis.
- Endereços pessoais não alteram pedidos históricos.
- Constraints validam dinheiro, moeda, períodos, JSON, quantidades, slugs e códigos.

## Segurança

- Todas as tabelas do domínio possuem RLS habilitado e forçado.
- Catálogo público limita-se a registros ativos/publicados.
- Clientes acessam somente recursos próprios.
- Dados administrativos exigem permissões RBAC específicas.
- Nenhum segredo integra `settings`, `payments` ou auditoria.
- Escrita direta no saldo de estoque não é concedida aos clientes.

## Performance

- SKU, slug, categorias, estoque, carrinho, pedidos e pagamentos possuem índices dedicados.
- Ledgers cronológicos usam BRIN quando apropriado.
- Índices parciais reduzem custo para ativos, padrões e disponibilidade.
- JSONB não recebeu GIN preventivo sem consulta comprovada.

## Riscos e recomendações

- Busca textual avançada ainda não existe; adicionar `tsvector` apenas com requisitos reais de ranking/idioma.
- Carrinho visitante precisará de RPC segura baseada em token hash; acesso direto foi deliberadamente negado.
- Checkout deverá criar pedido, reservar estoque, consumir cupom e converter carrinho em uma única transação futura.
- Mudança de status do pedido exigirá máquina de estados RPC; update comercial direto permanece bloqueado.
- A inscrição pública de newsletter deve usar endpoint antispam/rate limited no módulo correspondente.
- Retenção e minimização de `request_ip`/`user_agent` precisam de política LGPD antes de coleta.
- Particionamento de ledgers só deve ser adotado após métricas justificarem a complexidade.
- Avaliações, fornecedores e compras pertencem a módulos futuros e não foram antecipados.

## Fora do escopo confirmado

- Frontend e ERP.
- CRUD de aplicação.
- Checkout.
- Mercado Pago.
- Storage policies.
- Importação/exportação.
