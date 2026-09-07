import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { apiErrorMessage } from "@/lib/api";
import StoreLayout from "@/components/store/StoreLayout";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { formatBRL } from "@/lib/format";

const inputCls = "w-full border border-parchment bg-alabaster px-4 py-3 text-sm outline-none focus:border-bordeaux transition-colors";

export default function Checkout() {
  const { items, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [address, setAddress] = useState({ cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" });
  const [shipping, setShipping] = useState("sedex");
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.name) setCustomer((c) => ({ ...c, name: user.name, email: user.email }));
  }, [user]);

  const refreshQuote = async (couponCode = coupon, shipMethod = shipping) => {
    if (!items.length) return;
    try {
      const { data } = await api.post("/cart/quote", {
        items: items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id, qty: i.qty })),
        coupon_code: couponCode || null, shipping_method: shipMethod,
      });
      setQuote(data);
      setError("");
    } catch (e) {
      setError(apiErrorMessage(e.response?.data?.detail));
    }
  };

  useEffect(() => { refreshQuote(); /* eslint-disable-next-line */ }, [items, shipping]);

  const applyCoupon = async () => {
    try {
      await refreshQuote(coupon, shipping);
    } catch (e) { /* handled */ }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const orderRes = await api.post("/orders/checkout", {
        items: items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id, qty: i.qty })),
        customer, address, shipping_method: shipping, coupon_code: coupon || null,
      });
      const order = orderRes.data;
      const payRes = await api.post("/payments/checkout", {
        order_id: order.id, origin_url: window.location.origin,
      });
      window.location.href = payRes.data.checkout_url;
    } catch (e) {
      setError(apiErrorMessage(e.response?.data?.detail));
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <h1 className="font-display text-3xl text-bordeaux mb-4">Sua sacola está vazia</h1>
          <Link to="/produtos" className="border border-bordeaux text-bordeaux px-8 py-3 text-xs tracking-[0.2em] uppercase hover:bg-bordeaux hover:text-alabaster transition-colors">Explorar Coleção</Link>
        </div>
      </StoreLayout>
    );
  }

  const totals = quote || { subtotal, discount: 0, shipping: 0, total: subtotal, shipping_options: [] };

  return (
    <StoreLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <h1 className="font-display text-4xl md:text-5xl font-light text-bordeaux mb-10">Finalizar Compra</h1>
        <form onSubmit={submit} className="grid lg:grid-cols-[1fr_400px] gap-12">
          <div className="space-y-10">
            <section>
              <h2 className="text-xs tracking-[0.2em] uppercase text-bordeaux mb-4">Dados Pessoais</h2>
              <div className="grid gap-3">
                <input required placeholder="Nome completo" className={inputCls} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} data-testid="checkout-name" />
                <div className="grid md:grid-cols-2 gap-3">
                  <input required type="email" placeholder="E-mail" className={inputCls} value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} data-testid="checkout-email" />
                  <input required placeholder="Telefone" className={inputCls} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} data-testid="checkout-phone" />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xs tracking-[0.2em] uppercase text-bordeaux mb-4">Endereço de Entrega</h2>
              <div className="grid gap-3">
                <div className="grid md:grid-cols-[160px_1fr] gap-3">
                  <input required placeholder="CEP" className={inputCls} value={address.cep} onChange={(e) => setAddress({ ...address, cep: e.target.value })} data-testid="checkout-cep" />
                  <input required placeholder="Rua / Logradouro" className={inputCls} value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <input required placeholder="Número" className={inputCls} value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} />
                  <input placeholder="Complemento" className={inputCls} value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} />
                </div>
                <input required placeholder="Bairro" className={inputCls} value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} />
                <div className="grid md:grid-cols-[1fr_120px] gap-3">
                  <input required placeholder="Cidade" className={inputCls} value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  <input required placeholder="UF" maxLength={2} className={inputCls} value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })} />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xs tracking-[0.2em] uppercase text-bordeaux mb-4">Entrega</h2>
              <div className="space-y-2">
                {(totals.shipping_options || []).map((o) => (
                  <label key={o.code} className={`flex items-center justify-between border px-4 py-3 cursor-pointer ${shipping === o.code ? "border-bordeaux" : "border-parchment"}`}>
                    <span className="flex items-center gap-3">
                      <input type="radio" name="shipping" checked={shipping === o.code} onChange={() => setShipping(o.code)} className="accent-bordeaux" data-testid={`shipping-${o.code}`} />
                      <span><span className="text-sm text-obsidian">{o.label}</span><span className="block text-xs text-obsidian/50">{o.eta}</span></span>
                    </span>
                    <span className="text-sm text-bordeaux">{o.free ? "Grátis" : formatBRL(o.price)}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Summary */}
          <aside className="bg-quartz/30 p-6 h-fit">
            <h2 className="font-display text-2xl text-bordeaux mb-5">Resumo</h2>
            <div className="space-y-4 max-h-64 overflow-y-auto mb-5">
              {items.map((it) => (
                <div key={it.key} className="flex gap-3">
                  <img src={it.image} alt={it.name} className="w-14 h-16 object-cover bg-parchment" />
                  <div className="flex-1 text-sm">
                    <p className="text-bordeaux leading-tight">{it.name}</p>
                    <p className="text-xs text-obsidian/50">{it.color} · {it.size} · {it.qty}x</p>
                  </div>
                  <span className="text-sm">{formatBRL(it.price * it.qty)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-5">
              <input placeholder="Cupom" className="flex-1 border border-parchment bg-alabaster px-3 py-2 text-sm outline-none" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} data-testid="coupon-input" />
              <button type="button" onClick={applyCoupon} className="bg-bordeaux text-alabaster px-4 text-xs tracking-wider uppercase" data-testid="apply-coupon">Aplicar</button>
            </div>

            <div className="space-y-2 text-sm border-t border-parchment pt-4">
              <div className="flex justify-between"><span className="text-obsidian/60">Subtotal</span><span>{formatBRL(totals.subtotal)}</span></div>
              {totals.discount > 0 && <div className="flex justify-between text-bordeaux"><span>Desconto {totals.coupon ? `(${totals.coupon})` : ""}</span><span>-{formatBRL(totals.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-obsidian/60">Frete</span><span>{totals.shipping ? formatBRL(totals.shipping) : "Grátis"}</span></div>
              <div className="flex justify-between text-lg font-medium text-bordeaux border-t border-parchment pt-3 mt-1"><span>Total</span><span data-testid="checkout-total">{formatBRL(totals.total)}</span></div>
            </div>

            {error && <p className="text-sm text-red-700 mt-4" data-testid="checkout-error">{error}</p>}

            <button type="submit" disabled={loading} data-testid="place-order-btn"
              className="w-full mt-5 bg-bordeaux text-alabaster py-4 text-xs tracking-[0.2em] uppercase hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Processando..." : "Ir para o Pagamento"}
            </button>
            <p className="text-[11px] text-obsidian/40 text-center mt-3">Pagamento seguro via Mercado Pago</p>
          </aside>
        </form>
      </div>
    </StoreLayout>
  );
}
