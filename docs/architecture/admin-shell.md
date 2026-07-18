# Estrutura base do ERP

## Escopo

O Módulo 6 entrega somente infraestrutura visual e navegação. Não contém catálogo, dashboard comercial, CRUD ou consultas a dados comerciais.

## Composição

- `AdminRoute`: valida sessão e acesso RBAC antes de montar o shell.
- `AdminLayout`: sidebar, header, breadcrumb, área de conteúdo e error boundary.
- `navigation.ts`: registro declarativo de rotas e permissões; módulos futuros acrescentam seus itens sem alterar o layout.
- `AdminSidebar`: navegação desktop fixa e drawer móvel.
- `AdminHeader`: breadcrumb, papel ativo e logout.
- `AdminLoading` e `AdminErrorState`: estados reutilizáveis.

## Segurança

Filtrar navegação melhora a UX, mas não concede acesso. RLS e RPCs continuam sendo a autoridade. Usuários autenticados sem `admin.access` são enviados para `/acesso-negado`; falhas de rede são diferenciadas de falta de permissão.

## Acessibilidade e responsividade

- Link de salto para o conteúdo.
- Landmarks e rótulos de navegação.
- Indicação de rota ativa via `NavLink`.
- Alvos interativos mínimos de 44 px.
- Foco visível e estado de loading anunciado.
- Drawer com `dialog`, `aria-modal`, overlay, Escape e bloqueio de scroll.
- Sidebar permanente a partir de `lg`; drawer abaixo desse breakpoint.

## Performance

O layout, a página inicial e a página de acesso negado são carregados com `React.lazy`. O shell não importa módulos futuros nem bibliotecas operacionais.
