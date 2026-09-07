export const formatBRL = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const ORDER_STATUS_LABEL = {
  aguardando_pagamento: "Aguardando pagamento",
  pagamento_aprovado: "Pagamento aprovado",
  em_preparacao: "Em preparação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  devolvido: "Devolvido",
};
