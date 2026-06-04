import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cart, useCart } from "@/lib/cart";
import { brl, whatsappLink } from "@/lib/whatsapp";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Plus, Minus, Trash2, ChevronDown, Search, Grid2X2, Rows3 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Banquinha da Pâmela — Catálogo" },
      { name: "description", content: "Catálogo da Banquinha da Pâmela. Monte seu pedido e finalize pelo WhatsApp." },
    ],
  }),
  component: Index,
});

type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  in_stock: boolean;
  max_per_cart: number;
};
type Category = { id: string; name: string; sort_order: number };

function Index() {
  const [cats, setCats] = useState<Category[]>([]);
  const [prods, setProds] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"comfort" | "compact">("compact");
  const [cartOpen, setCartOpen] = useState(false);
  const items = useCart();

  useEffect(() => {
    (async () => {
      const [c, p] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("products").select("*").order("sort_order"),
      ]);
      setCats(c.data ?? []);
      setProds((p.data ?? []) as Product[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("pt-BR");
    return prods.filter((p) => {
      const matchesCat = activeCat === "all" || p.category_id === activeCat;
      const searchable = `${p.name} ${p.description ?? ""}`.toLocaleLowerCase("pt-BR");
      const matchesSearch = !query || searchable.includes(query);
      return matchesCat && matchesSearch;
    });
  }, [prods, activeCat, searchTerm]);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  function finalizar() {
    if (!items.length) return;
    const lines = [
      "*Pedido — Banquinha da Pâmela* 🌸",
      "",
      ...items.map((i, idx) => {
        const sub = i.price * i.qty;
        return `${idx + 1}. *${i.name}*\n   ${i.qty} × ${brl(i.price)} = *${brl(sub)}*`;
      }),
      "",
      `*Total: ${brl(total)}*`,
      "",
      "Obrigada! 💛",
    ];
    window.open(whatsappLink(lines.join("\n")), "_blank");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-black">
              P
            </div>
            <div className="leading-tight">
              <div className="font-display text-xl font-black text-foreground sm:text-2xl">
                Banquinha da Pâmela
              </div>
              <div className="text-xs text-muted-foreground">Catálogo de produtos</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="hidden rounded-full border border-border bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80 sm:inline-flex"
            >
              Área do Administrador
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Carrinho</span>
              {itemCount > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-black text-accent-foreground">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-to-br from-secondary via-background to-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Bem-vindo(a)</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-foreground sm:text-5xl md:text-6xl">
            Tudo da Banquinha,<br />a um clique do WhatsApp.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Navegue pelo catálogo, escolha seus produtos preferidos e finalize o pedido direto
            com a Pâmela.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <div className="sticky top-[64px] z-20 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
          <CatChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>
            Todos
          </CatChip>
          {cats.map((c) => (
            <CatChip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
              {c.name}
            </CatChip>
          ))}
        </div>
      </div>

      {/* Products grid */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {loading ? (
          <p className="text-muted-foreground">Carregando catálogo…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-lg font-semibold">Nenhum produto por aqui ainda.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              A Pâmela está organizando o estoque. Volte logo!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={finalizar}
              className="inline-flex items-center gap-3 rounded-full bg-whatsapp px-8 py-5 text-lg font-black text-whatsapp-foreground shadow-xl shadow-black/15 transition hover:scale-[1.02] active:scale-100"
            >
              Finalizar Compra pelo WhatsApp
              <span className="rounded-full bg-black/15 px-3 py-1 text-sm">{brl(total)}</span>
            </button>
          </div>
        )}
      </main>

      <footer className="mt-10 border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Banquinha da Pâmela — Feito com 💛
        </div>
      </footer>

      {cartOpen && (
        <CartDrawer onClose={() => setCartOpen(false)} total={total} onFinalize={finalizar} />
      )}
      <WhatsAppFloat />
    </div>
  );
}

function CatChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition " +
        (active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/70")
      }
    >
      {children}
    </button>
  );
}

function ProductCard({ p }: { p: Product }) {
  const items = useCart();
  const inCart = items.find((i) => i.id === p.id);
  const qty = inCart?.qty ?? 0;
  const disabled = !p.in_stock;
  const reachedMax = qty >= p.max_per_cart;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ShoppingBag className="h-12 w-12 opacity-30" />
          </div>
        )}
        {!p.in_stock && (
          <span className="absolute left-3 top-3 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">
            Sem estoque
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-bold leading-tight text-card-foreground">
          {p.name}
        </h3>
        {p.description && (
          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
        )}
        <div className="mt-3 text-2xl font-black text-primary">{brl(Number(p.price))}</div>

        <div className="mt-auto pt-4">
          {qty === 0 ? (
            <Button
              type="button"
              disabled={disabled}
              onClick={() =>
                cart.add({ id: p.id, name: p.name, price: Number(p.price), max: p.max_per_cart })
              }
              className="w-full rounded-full bg-primary py-6 text-base font-bold text-primary-foreground hover:bg-primary/90"
            >
              Botar no Carrinho
            </Button>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-full bg-secondary p-1">
              <button
                onClick={() => cart.setQty(p.id, qty - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground hover:bg-background/70"
                aria-label="Diminuir"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-black">{qty}</span>
              <button
                disabled={reachedMax}
                onClick={() =>
                  cart.add({
                    id: p.id,
                    name: p.name,
                    price: Number(p.price),
                    max: p.max_per_cart,
                  })
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
                aria-label="Aumentar"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
          {reachedMax && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Máximo de {p.max_per_cart} por pedido
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function CartDrawer({
  onClose,
  total,
  onFinalize,
}: {
  onClose: () => void;
  total: number;
  onFinalize: () => void;
}) {
  const items = useCart();
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-xl font-black">Seu Carrinho</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-secondary" aria-label="Fechar">
            <ChevronDown className="h-5 w-5 rotate-[-90deg]" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="mt-10 text-center text-muted-foreground">
              Seu carrinho está vazio. Adicione produtos no catálogo!
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex-1">
                    <div className="font-bold leading-tight">{i.name}</div>
                    <div className="text-sm text-muted-foreground">{brl(i.price)} cada</div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-secondary px-1">
                    <button
                      onClick={() => cart.setQty(i.id, i.qty - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-background"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center font-bold">{i.qty}</span>
                    <button
                      onClick={() => cart.setQty(i.id, Math.min(i.qty + 1, i.max))}
                      disabled={i.qty >= i.max}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-background disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => cart.remove(i.id)}
                    className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="border-t border-border bg-card px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-2xl font-black text-primary">{brl(total)}</span>
          </div>
          <button
            onClick={onFinalize}
            disabled={items.length === 0}
            className="w-full rounded-full bg-whatsapp py-4 text-base font-black text-whatsapp-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            Finalizar pelo WhatsApp
          </button>
        </footer>
      </aside>
    </div>
  );
}
