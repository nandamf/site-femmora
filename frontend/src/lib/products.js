export const CATEGORIES = [
  { name: "Sutiãs", image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80", alt: "Linha de sutiãs delicados com detalhes em renda" },
  { name: "Calcinhas", image: "https://images.unsplash.com/photo-1520962918204-b5ae7fd9c5c8?auto=format&fit=crop&w=1200&q=80", alt: "Conjunto de calcinhas em tons suaves em dobra elegante" },
  { name: "Bodys", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80", alt: "Body de lingerie com acabamento sofisticado" },
  { name: "Linha Noite", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80", alt: "Camisola e robe de noite em seda leve" },
];

export const PRODUCTS = [
  {
    id: "p1",
    name: "Bralette Fleur Noir",
    category: "Sutiãs",
    price: 189.9,
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
    hoverImage: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=800&q=80",
    alt: "Bralette de renda floral preta destacando as bordas em festonê",
  },
  {
    id: "p2",
    name: "Sutiã Cetim Aurora",
    category: "Sutiãs",
    price: 219.9,
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
    hoverImage: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=800&q=80",
    alt: "Sutiã de cetim tom areia com detalhe em renda fina",
  },
  {
    id: "p3",
    name: "Body Séduction Bordeaux",
    category: "Bodys",
    price: 289.9,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    hoverImage: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=800&q=80",
    alt: "Body de renda vinho profundo com decote nas costas",
  },
  {
    id: "p4",
    name: "Camisola Seda Lumière",
    category: "Linha Noite",
    price: 259.9,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    hoverImage: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
    alt: "Camisola slip de seda champagne com caimento fluido",
  },
  {
    id: "p5",
    name: "Calcinha Rendada Blush",
    category: "Calcinhas",
    price: 119.9,
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
    hoverImage: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=800&q=80",
    alt: "Calcinha de renda delicada tom rosa quartzo",
  },
  {
    id: "p6",
    name: "Calcinha Cetim Nude",
    category: "Calcinhas",
    price: 99.9,
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
    hoverImage: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
    alt: "Calcinha de cetim nude com acabamento bordado",
  },
];

export const formatBRL = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });