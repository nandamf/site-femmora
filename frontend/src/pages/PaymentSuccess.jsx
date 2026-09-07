import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import api from "@/lib/api";
import StoreLayout from "@/components/store/StoreLayout";
import { useCart } from "@/lib/CartContext";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { clear } = useCart();
  const [status, setStatus] = useState("checking"); // checking | paid | failed | timeout
  const [order, setOrder] = useState(null);
  const attempts = useRef(0);
  const cleared = useRef(false);

  useEffect(() => {
    if (!sessionId) { setStatus("failed"); return; }
    let active = true;
    const poll = async () => {
      if (!active) return;
      if (attempts.current >= 8) { setStatus("timeout"); return; }
      attempts.current += 1;
      try {
        const { data } = await api.get(`/payments/status/${sessionId}`);
        setOrder(data);
        if (data.payment_status === "paid") {
          setStatus("paid");
          if (!cleared.current) { clear(); cleared.current = true; }
          return;
        }
        if (["expired", "failed"].includes(data.payment_status)) { setStatus("failed"); return; }
      } catch { /* retry */ }
      setTimeout(poll, 2000);
    };
    poll();
    return () => { active = false; };
    // eslint-disable-next-line
  }, [sessionId]);

  return (
    <StoreLayout>
      <div className="max-w-xl mx-auto px-4 py-24 text-center" data-testid="payment-result">
        {status === "checking" && (<>
          <Loader2 className="w-12 h-12 text-bordeaux mx-auto mb-6 animate-spin" />
          <h1 className="font-display text-3xl text-bordeaux mb-2">Confirmando pagamento...</h1>
          <p className="text-obsidian/60">Aguarde um instante.</p>
        </>)}
        {status === "paid" && (<>
          <CheckCircle className="w-14 h-14 text-bordeaux mx-auto mb-6" />
          <h1 className="font-display text-4xl text-bordeaux mb-3">Pedido Confirmado!</h1>
          <p className="text-obsidian/70 mb-2">Recebemos o seu pagamento. Obrigada por comprar na Femmora 💌</p>
          {order?.order_number && <p className="text-sm text-obsidian/50 mb-8">Pedido {order.order_number}</p>}
          <div className="flex gap-3 justify-center">
            <Link to="/conta?tab=pedidos" className="bg-bordeaux text-alabaster px-8 py-3 text-xs tracking-[0.2em] uppercase">Meus Pedidos</Link>
            <Link to="/produtos" className="border border-bordeaux text-bordeaux px-8 py-3 text-xs tracking-[0.2em] uppercase">Continuar Comprando</Link>
          </div>
        </>)}
        {(status === "failed" || status === "timeout") && (<>
          <XCircle className="w-14 h-14 text-obsidian/50 mx-auto mb-6" />
          <h1 className="font-display text-3xl text-bordeaux mb-3">{status === "timeout" ? "Ainda processando" : "Pagamento não concluído"}</h1>
          <p className="text-obsidian/60 mb-8">{status === "timeout" ? "Seu pagamento pode levar alguns instantes. Verifique 'Meus Pedidos' em breve." : "Não foi possível confirmar o pagamento."}</p>
          <Link to="/checkout" className="border border-bordeaux text-bordeaux px-8 py-3 text-xs tracking-[0.2em] uppercase">Voltar ao Checkout</Link>
        </>)}
      </div>
    </StoreLayout>
  );
}
