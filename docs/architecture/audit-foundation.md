# Fundação mínima de auditoria

## Escopo

Esta decisão cria o ledger compartilhado de auditoria antes do RBAC. Ela não cria telas, papéis administrativos nem o bootstrap do primeiro administrador.

## Decisões

- `audit_logs` é append-only: `UPDATE` e `DELETE` são rejeitados por trigger.
- `event_version` permite evoluir o contrato dos payloads sem reinterpretar históricos.
- `action` utiliza o enum versionado `audit_action`; cada módulo adiciona apenas suas ações por migration.
- `request_ip` e `user_agent` são opcionais, não confiáveis e só podem ser coletados com necessidade operacional e retenção mínima.
- A PK interna é `bigint identity`, compacta para alto volume; `event_id` é o UUID público.
- `actor_id` é um snapshot sem FK para sobreviver à exclusão do usuário no Supabase Auth.
- Nenhuma policy de leitura existe nesta etapa. A futura leitura administrativa será adicionada junto ao RBAC.
- `anon` e `authenticated` não possuem privilégios de tabela nem de função.
- Edge Functions confiáveis escrevem somente por `record_system_audit_event`, concedida exclusivamente a `service_role`.
- Funções transacionais futuras usarão a função privada `app_private.write_audit_log` na mesma transação da mutação.
- A aplicação é responsável por sanitizar snapshots. Senhas, tokens, secrets, dados de cartão e PII desnecessária são proibidos.

## Performance

- BRIN em `occurred_at` favorece retenção e consultas cronológicas com baixo custo de armazenamento.
- Índices B-tree cobrem ator, entidade, ação, request e correlação.
- JSONB não recebe GIN antecipadamente; esse índice seria caro e não há consulta comprovada que o justifique.
- A tabela pode ser particionada por período futuramente sem alterar o contrato de `event_id`.

## Bootstrap aprovado

O próximo módulo implementará a Edge Function de bootstrap. Ela usará `service_role` somente no servidor e registrará cada resultado por `record_system_audit_event`. A função de auditoria não conhece nem armazena o segredo do bootstrap.
