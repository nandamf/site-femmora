# RBAC, proteção administrativa e bootstrap

## Limites do módulo

Este módulo cria identidade de perfil, papéis administrativos, permissões estruturais, atribuição auditada, proteção de `/admin` e o bootstrap inicial. Permissões comerciais serão adicionadas pelos módulos que as utilizarem.

## Autoridade

- O frontend consulta somente `get_my_admin_access`; ele não lê tabelas RBAC diretamente.
- RLS e funções do PostgreSQL são a autoridade. A proteção React melhora navegação, mas não concede acesso.
- Perfis podem editar somente `full_name` e `avatar_path` próprios. Status e papéis não são editáveis pelo cliente.
- A remoção do próprio papel `superadmin` e a remoção do último superadmin são bloqueadas transacionalmente.

## Bootstrap

1. Um usuário confirmado deve existir no Supabase Auth.
2. A Edge Function recebe o e-mail e `x-bootstrap-secret` por chamada operacional fora do frontend.
3. O segredo é comparado por digest e nunca é incluído em resposta ou log.
4. `service_role` existe somente no ambiente da Edge Function.
5. A RPC obtém advisory lock e só atribui o papel quando nenhum superadmin existe.
6. Toda tentativa válida, negada ou falha é auditada sem guardar o segredo ou o e-mail no payload.
7. Chamadas repetidas são idempotentes e retornam `already_bootstrapped`.
8. O bootstrap só insere; não contém nenhuma operação de remoção.

Secrets necessários:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BOOTSTRAP_SUPERADMIN_SECRET`

Após o primeiro uso, o segredo deve ser rotacionado ou removido. A RPC continuará recusando novas atribuições porque já existe um superadministrador.
