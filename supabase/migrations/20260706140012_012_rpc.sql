-- Depends on inventory tables, indexes, RLS and audit foundation.

create or replace function public.adjust_inventory(
  p_variant_id uuid,
  p_location_id uuid,
  p_quantity_delta integer,
  p_reason text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_inventory public.inventory%rowtype;
  v_event_id uuid;
  v_existing public.inventory_movements%rowtype;
begin
  if not app_private.has_admin_permission(auth.uid(), 'inventory.adjust') then
    raise exception using errcode = '42501', message = 'insufficient_inventory_permission';
  end if;
  if p_quantity_delta = 0 then
    raise exception using errcode = '22023', message = 'quantity_delta_must_not_be_zero';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception using errcode = '22023', message = 'reason_required';
  end if;
  if nullif(btrim(p_idempotency_key), '') is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;

  select * into v_existing from public.inventory_movements
  where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'eventId', v_existing.event_id,
      'onHand', v_existing.balance_on_hand,
      'reserved', v_existing.balance_reserved,
      'idempotentReplay', true
    );
  end if;

  insert into public.inventory (variant_id, location_id)
  values (p_variant_id, p_location_id)
  on conflict (variant_id, location_id) do nothing;

  select * into v_inventory from public.inventory
  where variant_id = p_variant_id and location_id = p_location_id
  for update;

  if v_inventory.on_hand + p_quantity_delta < v_inventory.reserved then
    raise exception using errcode = '23514', message = 'insufficient_unreserved_inventory';
  end if;

  update public.inventory
  set on_hand = on_hand + p_quantity_delta,
      version = version + 1,
      updated_at = statement_timestamp()
  where variant_id = p_variant_id and location_id = p_location_id
  returning * into v_inventory;

  insert into public.inventory_movements (
    variant_id, location_id, movement_type, quantity_delta, reservation_delta,
    balance_on_hand, balance_reserved, idempotency_key, reason, created_by
  ) values (
    p_variant_id, p_location_id, 'adjustment', p_quantity_delta, 0,
    v_inventory.on_hand, v_inventory.reserved, p_idempotency_key, p_reason, auth.uid()
  ) returning event_id into v_event_id;

  perform app_private.write_audit_log(
    auth.uid(), 'admin', 'inventory.adjust', 'inventory',
    p_variant_id::text || ':' || p_location_id::text, 'erp', 'success', 1::smallint,
    null, null, p_reason,
    jsonb_build_object('onHand', v_inventory.on_hand - p_quantity_delta),
    jsonb_build_object('onHand', v_inventory.on_hand),
    jsonb_build_object('movementEventId', v_event_id)
  );

  return jsonb_build_object(
    'eventId', v_event_id,
    'onHand', v_inventory.on_hand,
    'reserved', v_inventory.reserved,
    'idempotentReplay', false
  );
end;
$$;

revoke all on function public.adjust_inventory(uuid, uuid, integer, text, text)
from public, anon, service_role;
grant execute on function public.adjust_inventory(uuid, uuid, integer, text, text)
to authenticated;

comment on function public.adjust_inventory(uuid, uuid, integer, text, text) is
  'Atomic, idempotent administrative stock adjustment. Updates balance, ledger and audit in one transaction.';
