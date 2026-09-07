import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { useWishlist } from "@/lib/WishlistContext";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ProductCard({ product }) {
  const { has, toggle } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fav = has(product.id);

  const onFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { navigate("/login"); return; }
    await toggle(product.id);
  };

  const discountPct = product.compare_at_price && product.compare_at_price > product.min_price
    ? Math.round((1 - product.min_price / product.compare_at_price) * 100)
    : 0;

  return (
    <Link to={`/produto/${product.slug}`} className="group block w-full" data-testid={`product-card-${product.slug}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-parchment">
        <img src={product.image} alt={product.alt} loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0" />
        {product.hover_image && (
          <img src={product.hover_image} alt="" loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.on_sale && discountPct > 0 && (
            <span className="bg-bordeaux text-alabaster text-[10px] tracking-wider uppercase px-2.5 py-1" data-testid="badge-sale">-{discountPct}%</span>
          )}
          {product.is_new && (
            <span className="bg-alabaster text-bordeaux text-[10px] tracking-wider uppercase px-2.5 py-1 border border-bordeaux/20">Novo</span>
          )}
          {!product.in_stock && (
            <span className="bg-obsidian/80 text-alabaster text-[10px] tracking-wider uppercase px-2.5 py-1">Esgotado</span>
          )}
          {product.in_stock && product.low_stock && (
            <span className="bg-parchment text-bordeaux text-[10px] tracking-wider uppercase px-2.5 py-1">Últimas unidades</span>
          )}
        </div>

        <button onClick={onFav} aria-label="Favoritar" data-testid={`fav-${product.slug}`}
          className="absolute top-3 right-3 w-9 h-9 bg-alabaster/90 backdrop-blur flex items-center justify-center text-bordeaux hover:bg-bordeaux hover:text-alabaster transition-colors">
          <Heart className="w-4 h-4" fill={fav ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="pt-4 text-center">
        <p className="text-[10px] tracking-[0.2em] uppercase text-bordeaux/50 mb-1">{product.category}</p>
        <h3 className="font-display text-xl text-bordeaux leading-tight">{product.name}</h3>
        <div className="mt-2 flex items-center justify-center gap-2">
          {product.compare_at_price && product.on_sale && (
            <span className="text-sm text-obsidian/40 line-through">{formatBRL(product.compare_at_price)}</span>
          )}
          <span className="text-obsidian font-medium">{formatBRL(product.min_price)}</span>
        </div>
        {product.installment && product.installment.parts > 1 && (
          <p className="text-[11px] text-obsidian/50 mt-1">{product.installment.parts}x de {formatBRL(product.installment.value)}</p>
        )}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {product.colors.slice(0, 5).map((c) => (
              <span key={c.name} title={c.name} className="w-3.5 h-3.5 rounded-full border border-obsidian/15" style={{ backgroundColor: c.hex }} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
