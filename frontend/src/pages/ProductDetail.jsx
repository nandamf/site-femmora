import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Truck, RefreshCw, Ruler, ChevronDown, Check, Minus, Plus } from "lucide-react";
import api from "@/lib/api";
import StoreLayout from "@/components/store/StoreLayout";
import ProductCard from "@/components/store/ProductCard";
import SizeGuideModal from "@/components/store/SizeGuideModal";
import { formatBRL } from "@/lib/format";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";

function Accordion({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-parchment">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left">
        <span className="text-xs tracking-[0.2em] uppercase text-bordeaux">{title}</span>
        <ChevronDown className={`w-4 h-4 text-bordeaux transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-5 text-sm text-obsidian/70 leading-relaxed whitespace-pre-line">{children}</div>}
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => (await api.get(`/products/${slug}`)).data,
  });

  const isValidProduct = product != null && typeof product === "object" && Array.isArray(product.variants);

  const selectedVariant = useMemo(() => {
    if (!isValidProduct) return null;
    return product.variants.find((v) => (!color || v.color === color) && (!size || v.size === size) &&
      (color ? v.color === color : true) && (size ? v.size === size : true)) || null;
  }, [isValidProduct, product, color, size]);

  const matchVariant = useMemo(() => {
    if (!isValidProduct || !color || !size) return null;
    return product.variants.find((v) => v.color === color && v.size === size) || null;
  }, [isValidProduct, product, color, size]);

  if (isLoading) return <StoreLayout><div className="py-32 text-center text-obsidian/50">Carregando...</div></StoreLayout>;
  if (!isValidProduct) return <StoreLayout><div className="py-32 text-center text-obsidian/50">Produto não encontrado.</div></StoreLayout>;

  const images = product.images.length ? product.images : [{ url: "", alt: product.name }];
  const displayPrice = matchVariant ? matchVariant.price : product.min_price;
  const displayCompare = matchVariant ? matchVariant.compare_at : product.compare_at_price;
  const fav = has(product.id);

  const sizeAvailable = (s) => {
    if (!color) return product.variants.some((v) => v.size === s && v.available > 0);
    return product.variants.some((v) => v.size === s && v.color === color && v.available > 0);
  };

  const handleAdd = () => {
    setError("");
    if (product.colors.length && !color) { setError("Selecione uma cor"); return; }
    if (product.sizes.length && !size) { setError("Selecione um tamanho"); return; }
    if (!matchVariant || matchVariant.available < qty) { setError("Variação indisponível"); return; }
    addItem({
      product_id: product.id, variant_id: matchVariant.id, name: product.name, slug: product.slug,
      size: matchVariant.size, color: matchVariant.color, color_hex: matchVariant.color_hex,
      image: images[0].url, price: matchVariant.price, qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const onFav = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    await toggle(product.id);
  };

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <nav className="text-xs text-obsidian/50 mb-6">
          <Link to="/" className="hover:text-bordeaux">Início</Link> / <Link to={`/produtos?category=${product.category_slug}`} className="hover:text-bordeaux">{product.category}</Link> / <span className="text-obsidian/70">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery */}
          <div className="flex flex-col-reverse md:flex-row gap-4">
            <div className="flex md:flex-col gap-3 overflow-x-auto no-scrollbar">
              {images.map((im, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-20 shrink-0 overflow-hidden border ${activeImg === i ? "border-bordeaux" : "border-transparent"}`}>
                  <img src={im.url} alt={im.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="flex-1 aspect-[4/5] overflow-hidden bg-parchment" data-testid="product-main-image">
              <img src={images[activeImg]?.url} alt={images[activeImg]?.alt} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase text-bordeaux/50 mb-2">{product.category}</p>
            <h1 className="font-display text-4xl md:text-5xl font-light text-bordeaux leading-tight" data-testid="product-title">{product.name}</h1>
            <p className="text-sm text-obsidian/60 mt-1">SKU: {product.sku}</p>

            <div className="flex items-center gap-3 mt-5">
              {displayCompare && (<span className="text-lg text-obsidian/40 line-through">{formatBRL(displayCompare)}</span>)}
              <span className="text-3xl font-display text-bordeaux" data-testid="product-price">{formatBRL(displayPrice)}</span>
            </div>
            {product.installments?.parts > 1 && (
              <p className="text-sm text-obsidian/60 mt-1">ou {product.installments.parts}x de {formatBRL(product.installments.value)} sem juros</p>
            )}

            {product.short_description && <p className="text-obsidian/70 leading-relaxed mt-5">{product.short_description}</p>}

            {/* Colors */}
            {product.colors.length > 0 && (
              <div className="mt-7">
                <p className="text-xs tracking-[0.2em] uppercase text-bordeaux mb-3">Cor: <span className="text-obsidian/70">{color || "Selecione"}</span></p>
                <div className="flex gap-3">
                  {product.colors.map((c) => (
                    <button key={c.name} title={c.name} onClick={() => { setColor(c.name); setSize(null); }} data-testid={`color-${c.name}`}
                      className={`w-9 h-9 rounded-full border-2 ${color === c.name ? "border-bordeaux ring-2 ring-bordeaux/20" : "border-obsidian/15"}`}
                      style={{ backgroundColor: c.hex }} />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div className="mt-7">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs tracking-[0.2em] uppercase text-bordeaux">Tamanho: <span className="text-obsidian/70">{size || "Selecione"}</span></p>
                  <button onClick={() => setShowGuide(true)} className="flex items-center gap-1.5 text-xs text-bordeaux underline" data-testid="size-guide-btn">
                    <Ruler className="w-3.5 h-3.5" /> Qual é o meu tamanho?
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => {
                    const avail = sizeAvailable(s);
                    return (
                      <button key={s} disabled={!avail} onClick={() => setSize(s)} data-testid={`size-${s}`}
                        className={`min-w-[48px] h-12 px-3 text-sm border transition-colors ${
                          size === s ? "bg-bordeaux text-alabaster border-bordeaux"
                          : avail ? "border-parchment text-obsidian/80 hover:border-bordeaux" : "border-parchment text-obsidian/25 line-through cursor-not-allowed"}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {matchVariant && matchVariant.available > 0 && matchVariant.available <= 5 && (
              <p className="text-sm text-bordeaux mt-4">Apenas {matchVariant.available} em estoque!</p>
            )}
            {matchVariant && matchVariant.available === 0 && (
              <p className="text-sm text-obsidian/60 mt-4">Esgotado nesta variação.</p>
            )}

            {/* Qty + Add */}
            <div className="flex items-center gap-4 mt-7">
              <div className="flex items-center border border-parchment">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 text-bordeaux"><Minus className="w-4 h-4" /></button>
                <span className="px-4 text-sm" data-testid="qty-value">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="p-3 text-bordeaux"><Plus className="w-4 h-4" /></button>
              </div>
              <button onClick={onFav} className="w-12 h-12 border border-parchment flex items-center justify-center text-bordeaux hover:bg-bordeaux hover:text-alabaster transition-colors" aria-label="Favoritar">
                <Heart className="w-5 h-5" fill={fav ? "currentColor" : "none"} />
              </button>
            </div>

            <button onClick={handleAdd} data-testid="add-to-cart-btn"
              className="w-full mt-4 bg-bordeaux text-alabaster py-4 text-xs tracking-[0.2em] uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              {added ? (<><Check className="w-4 h-4" /> Adicionado</>) : "Adicionar à Sacola"}
            </button>
            {error && <p className="text-sm text-red-700 mt-2" data-testid="product-error">{error}</p>}

            <div className="flex flex-col gap-2.5 mt-6 text-sm text-obsidian/60">
              <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-bordeaux" /> Frete grátis acima de R$ 300 · envio discreto</span>
              <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-bordeaux" /> Primeira troca gratuita em até 30 dias</span>
            </div>

            <div className="mt-8">
              {product.description && <Accordion title="Descrição">{product.description}</Accordion>}
              {product.composition && <Accordion title="Composição">{product.composition}</Accordion>}
              {product.care && <Accordion title="Cuidados">{product.care}</Accordion>}
            </div>
          </div>
        </div>

        {/* Related */}
        {product.related?.length > 0 && (
          <div className="mt-20">
            <h2 className="font-display text-3xl md:text-4xl font-light text-bordeaux mb-8 text-center">Combine com</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {product.related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {showGuide && <SizeGuideModal rows={product.size_guide} onClose={() => setShowGuide(false)} />}
    </StoreLayout>
  );
}
