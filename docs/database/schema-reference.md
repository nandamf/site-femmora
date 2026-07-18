# Referência do banco de dados Femmora

Todas as datas usam `timestamptz`, valores monetários usam `bigint` em centavos e chaves públicas usam UUID. As migrations deste módulo dependem das fundações de auditoria e RBAC.

## Perfis

### `profiles`

- Objetivo: extensão comercial de `auth.users`.
- Campos: `id uuid` PK/FK, `full_name text`, `avatar_path text`, `phone text`, `birth_date date`, consentimento de marketing, status e timestamps.
- FK: `id → auth.users.id`.
- Índices: PK e índice parcial de status.
- Constraints: comprimentos, nascimento não futuro e consistência do consentimento.
- RLS: cliente lê/edita campos permitidos do próprio perfil; administradores com `profiles.read` podem consultar.
- Observação: e-mail e credenciais permanecem exclusivamente no Supabase Auth.

### `addresses`

- Objetivo: catálogo mutável de endereços do cliente.
- Campos: identificação, destinatário, telefone, CEP, logradouro, número, complemento, bairro, cidade, UF, país, indicadores padrão, timestamps e `deleted_at`.
- PK: `id uuid`. FK: `profile_id → profiles.id`.
- Índices: endereço ativo por cliente; únicos parciais para padrões de entrega e cobrança.
- Constraints: CEP brasileiro, UF/país ISO, comprimentos.
- RLS: proprietário gerencia; `profiles.read` consulta.
- Observação: pedidos copiam snapshots e nunca dependem desta tabela.

## Catálogo

### `categories`

- Objetivo: árvore hierárquica de categorias.
- Campos: `parent_id`, nome, slug, conteúdo, imagem, SEO, ordem, status e soft delete.
- PK: UUID. FK autorreferente em `parent_id`.
- Índices: slug único e `(parent_id, sort_order)`.
- Constraints: slug, ordem, autorreferência e trigger contra ciclos.
- RLS: ativos são públicos; `catalog.read/write` controla administração.

### `brands`

- Objetivo: marcas normalizadas.
- Campos: nome, slug, descrição, status, timestamps e soft delete.
- PK UUID; slug único. Índice por status/nome.
- Constraints: slug e comprimento.
- RLS: marcas ativas públicas; administração por catálogo.

### `collections`

- Objetivo: agrupamentos editoriais temporários.
- Campos: nome, slug, descrição, período, status, timestamps e soft delete.
- PK UUID; slug único; índice de vigência.
- Constraints: período válido.
- RLS: somente coleções ativas e vigentes são públicas.

### `products`

- Objetivo: dados compartilhados pelas variantes vendáveis.
- Campos: `brand_id`, nome, slug, descrições, status, destaque, publicação, SEO/OG, timestamps e soft delete.
- PK UUID. FK `brand_id → brands.id`.
- Índices: slug único, status/publicação e marca/status.
- Constraints: produto ativo exige publicação; slug normalizado.
- RLS: ativos/publicados são públicos; administração por catálogo.

### `product_categories`

- Objetivo: relação N:N produto–categoria.
- PK composta `(product_id, category_id)`; FKs para produtos/categorias.
- Campos adicionais: categoria principal, ordem e criação.
- Índices: categoria/ordem e único parcial para uma principal.
- RLS: leitura acompanha publicação; escrita exige `catalog.write`.

### `collection_products`

- Objetivo: produtos ordenados em coleções.
- PK composta e FKs para coleção/produto.
- Índice: coleção, ordem e produto.
- RLS: catálogo público publicado; escrita administrativa.

### `option_types`

- Objetivo: eixos de variação extensíveis, inicialmente tamanho e cor.
- Campos: código, nome, tipo visual e ordem.
- PK UUID; código único.
- Constraints: código normalizado.
- RLS: leitura pública; escrita administrativa.

### `option_values`

- Objetivo: valores normalizados como P, M, preto ou bordeaux.
- Campos: tipo, código, valor, metadados JSON e ordem.
- PK UUID. FK `option_type_id → option_types.id`.
- Unique `(option_type_id, code)`; índice implícito.
- Constraints: JSON objeto, código e ordem.
- RLS: leitura pública; escrita administrativa.

### `product_variants`

- Objetivo: SKU vendável com preço e custo próprios.
- Campos: produto, SKU, código de barras, título, preços, moeda, peso, status, timestamps e soft delete.
- PK UUID. FK `product_id → products.id`.
- Índices: SKU/barcode únicos e produto/status.
- Constraints: SKU maiúsculo, dinheiro não negativo, promoção coerente, moeda ISO e peso positivo.
- RLS: variantes ativas de produtos publicados são públicas; custo deve ser omitido pelas consultas públicas futuras.
- Observação: estoque nunca reside em `products`.

### `variant_option_values`

- Objetivo: composição N:N das opções do SKU.
- PK composta; FKs para variante e valor.
- Índice inverso por valor.
- Constraints: trigger impede dois valores do mesmo tipo em uma variante.
- RLS: leitura acompanha variante; escrita administrativa.

### `product_images`

- Objetivo: múltiplas imagens ordenadas de produto/variante no Storage.
- Campos: produto, variante opcional, bucket, caminho, alt, papel, ordem e soft delete.
- PK UUID; FKs produto/variante.
- Índices: caminho único, ordenação e papéis principal/hover únicos.
- Constraints: caminho seguro e variante pertencente ao produto.
- RLS: imagens de produtos publicados são públicas; escrita administrativa.

## Estoque

### `stock_locations`

- Objetivo: locais físicos ou lógicos de estoque.
- Campos: código, nome, padrão, status e timestamps.
- PK UUID; código único; único parcial para local padrão.
- RLS: somente `inventory.read`.

### `inventory`

- Objetivo: saldo materializado por SKU/local.
- PK composta `(variant_id, location_id)`; FKs restritivas.
- Campos: físico, reservado, versão e atualização.
- Índices: localização e disponibilidade positiva.
- Constraints: saldos não negativos e reserva limitada ao físico.
- RLS: leitura com `inventory.read`; sem escrita direta por clientes.

### `inventory_movements`

- Objetivo: ledger imutável das mudanças de estoque.
- PK interna `bigint identity`; `event_id uuid` público.
- FKs: variante, localização, autor.
- Índices: SKU/local por tempo, referência, BRIN cronológico e idempotência única.
- Constraints: delta obrigatório, saldos finais válidos, referência consistente.
- RLS: `inventory.read`; trigger bloqueia update/delete.

## Carrinho

### `carts`

- Objetivo: carrinhos persistentes autenticados ou anônimos.
- Campos: proprietário ou hash de token, status, moeda, expiração e timestamps.
- PK UUID; FK opcional para perfil.
- Índices: um carrinho ativo por perfil/moeda, token hash único e expiração.
- Constraints: proprietário ou token, hash SHA-256 e moeda ISO.
- RLS: cliente gerencia o próprio; `carts.read` consulta. Carrinho visitante exigirá RPC futura.

### `cart_items`

- Objetivo: quantidades mutáveis de SKUs no carrinho.
- PK UUID; FKs para carrinho e variante.
- Unique `(cart_id, variant_id)`; índice inverso de variante.
- Constraints: quantidade entre 1 e 999.
- RLS: acompanha o proprietário do carrinho.
- Observação: preço não é persistido como verdade no carrinho.

## Pedidos

### `orders`

- Objetivo: cabeçalho e snapshots imutáveis da compra.
- PK UUID; número interno `bigint identity` único.
- FKs opcionais para perfil e carrinho.
- Campos: cliente snapshot, status, totais, cupom, entrega, endereços JSON, notas e datas.
- Índices: perfil, status, e-mail e número.
- Constraints: equação do total, valores não negativos e snapshots JSON objeto.
- RLS: cliente lê os próprios; `orders.read` consulta todos.
- Imutabilidade: campos comerciais e exclusão são bloqueados; apenas ciclo operacional pode evoluir.

### `order_items`

- Objetivo: linhas imutáveis independentes do catálogo atual.
- Campos snapshot: nome, variante, SKU, imagem, atributos, preço, desconto, quantidade e total.
- PK UUID. FKs opcionais ao catálogo e obrigatória ao pedido.
- Índices: pedido, variante e SKU snapshot.
- Constraints: cálculo exato da linha e JSON objeto.
- RLS: acompanha o pedido. Update/delete bloqueados.

### `order_status_history`

- Objetivo: histórico append-only do estado do pedido.
- PK interna identity, UUID público e FKs para pedido/autor.
- Índice por pedido/data.
- Constraints: transição não redundante.
- RLS: acompanha o pedido; mutações históricas bloqueadas.

## Pagamentos

### `payments`

- Objetivo: tentativas de pagamento independentes do provedor.
- Campos: pedido, provedor, IDs externos, status, valores, moeda, método, parcelas, idempotência e falha.
- PK UUID. FK restritiva para pedido.
- Índices: pedido/data, status/data e ID externo único por provedor.
- Constraints: valores, reembolso máximo, parcelas, moeda e aprovação datada.
- RLS: cliente lê pagamentos dos próprios pedidos; `payments.read` consulta.
- Observação: não armazena credenciais nem payload sensível.

## Marketing

### `coupons`

- Objetivo: regras versionáveis de desconto.
- Campos: código, tipo/valor, limites, vigência, moeda, status e soft delete.
- PK UUID; código único; índice de vigência.
- Constraints: percentual em basis points, valores/limites e período.
- RLS: somente `marketing.manage` nesta etapa.

### `coupon_products` / `coupon_categories`

- Objetivo: escopo N:N de cupons.
- PKs compostas; FKs com cascade para cupom e produto/categoria.
- Índices inversos para descobrir cupons aplicáveis.
- RLS: somente marketing.

### `coupon_redemptions`

- Objetivo: consumo imutável de cupom por pedido.
- PK UUID; FKs para cupom, perfil e pedido; pedido único.
- Índices por cupom/data e cupom/perfil.
- Constraints: desconto não negativo. Update/delete bloqueados.
- RLS: marketing ou leitura de pedidos.

### `favorites`

- Objetivo: produtos favoritos do cliente.
- PK composta `(profile_id, product_id)` e FKs cascade.
- Índice inverso por produto.
- RLS: proprietário gerencia.

### `newsletter_subscribers`

- Objetivo: consentimento e ciclo da newsletter para clientes/visitantes.
- Campos: e-mail, perfil opcional, status, origem e datas de consentimento.
- PK UUID; e-mail único; índice status/data.
- Constraints: coerência das datas.
- RLS: administração de marketing; inscrição pública virá por RPC antispam futura.

### `banners`

- Objetivo: campanhas visuais agendadas.
- Campos: placement, textos, CTA, imagens, status, ordem, vigência e soft delete.
- PK UUID; índice placement/agendamento.
- Constraints: caminhos, período e ordem.
- RLS: ativos/vigentes são públicos; marketing gerencia.

## Configuração

### `settings`

- Objetivo: configurações não secretas e versionadas.
- PK textual controlada `key`; valor JSON, versão, publicidade, descrição, autor e data.
- FK `updated_by → profiles.id`.
- Constraints: chave e versão.
- RLS: somente valores `is_public` são públicos; `settings.manage` gerencia.
- Observação: tokens e chaves privadas são proibidos.

## Views

- `admin_inventory_summary`: saldo por SKU/local, com `security_invoker`.
- `admin_order_summary`: totais e contagens para listagem, com `security_invoker`.

## RPC

- `adjust_inventory`: ajuste administrativo atômico e idempotente. Verifica permissão, bloqueia saldo, atualiza `inventory`, insere `inventory_movements` e `audit_logs` na mesma transação.
