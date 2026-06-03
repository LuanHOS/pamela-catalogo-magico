import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast, Toaster } from "sonner";
import { ArrowLeft, LogOut, Plus, Pencil, Trash2, Upload, UserPlus } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administração — Banquinha da Pâmela" }] }),
  component: AdminPage,
});

type Category = { id: string; name: string; sort_order: number };
type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  cost: number;
  in_stock: boolean;
  max_per_cart: number;
  sort_order: number;
};

function AdminPage() {
  const [session, setSession] = useState<{ userId: string; email: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ? { userId: s.user.id, email: s.user.email ?? "" } : null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? { userId: data.session.user.id, email: data.session.user.email ?? "" } : null);
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (checking) return <Shell><p className="p-8 text-muted-foreground">Carregando…</p></Shell>;
  if (!session) return <Shell><LoginForm /></Shell>;
  if (isAdmin === null) return <Shell><p className="p-8 text-muted-foreground">Verificando permissões…</p></Shell>;
  if (!isAdmin) return <Shell><NotAdmin email={session.email} /></Shell>;

  return <Shell><Dashboard email={session.email} /></Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
          </Link>
          <div className="font-display text-lg font-black">Painel Admin</div>
        </div>
      </header>
      {children}
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const fullEmail = email.includes("@") ? email : `${email}@banquinha.local`;
    const { error } = await supabase.auth.signInWithPassword({ email: fullEmail, password });
    setLoading(false);
    if (error) toast.error("Login inválido", { description: error.message });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-6 sm:p-10">
      <div>
        <h1 className="font-display text-3xl font-black">Área do Administrador</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entre para gerenciar o catálogo.</p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div>
          <Label htmlFor="u">Usuário</Label>
          <Input id="u" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin" autoFocus />
        </div>
        <div>
          <Label htmlFor="p">Senha</Label>
          <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading} className="w-full rounded-full py-6 text-base font-bold">
          {loading ? "Entrando…" : "Entrar"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Usuário inicial: <code className="rounded bg-secondary px-1.5 py-0.5">admin</code> · Senha: <code className="rounded bg-secondary px-1.5 py-0.5">admin</code>
        </p>
      </form>
    </div>
  );
}

function NotAdmin({ email }: { email: string }) {
  return (
    <div className="mx-auto max-w-md p-10 text-center">
      <p className="text-lg font-bold">Olá, {email}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Sua conta não tem permissão de administrador.
      </p>
      <Button onClick={() => supabase.auth.signOut()} className="mt-6 rounded-full">Sair</Button>
    </div>
  );
}

function Dashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<"products" | "categories" | "admins">("products");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black">Gerenciar Catálogo</h1>
          <p className="text-sm text-muted-foreground">Logado como {email}</p>
        </div>
        <Button variant="outline" onClick={() => supabase.auth.signOut()} className="rounded-full">
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>

      <div className="mb-6 flex gap-2 border-b border-border">
        {(["products", "categories", "admins"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "border-b-2 px-4 py-2 text-sm font-bold transition " +
              (tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")
            }
          >
            {t === "products" ? "Produtos" : t === "categories" ? "Categorias" : "Administradores"}
          </button>
        ))}
      </div>

      {tab === "products" && <ProductsPanel />}
      {tab === "categories" && <CategoriesPanel />}
      {tab === "admins" && <AdminsPanel />}
    </div>
  );
}

/* ---------- Categories ---------- */
function CategoriesPanel() {
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState("");

  async function refresh() {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCats(data ?? []);
  }
  useEffect(() => { refresh(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: name.trim(), sort_order: cats.length });
    if (error) return toast.error(error.message);
    setName("");
    toast.success("Categoria criada");
    refresh();
  }

  async function rename(c: Category) {
    const newName = prompt("Novo nome:", c.name);
    if (!newName) return;
    const { error } = await supabase.from("categories").update({ name: newName }).eq("id", c.id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function del(c: Category) {
    if (!confirm(`Remover categoria "${c.name}"? Os produtos ficarão sem categoria.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="flex gap-2 rounded-xl border border-border bg-card p-4">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da categoria (ex: Doces)" />
        <Button type="submit" className="rounded-full"><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
      </form>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {cats.length === 0 && <li className="p-6 text-center text-muted-foreground">Nenhuma categoria ainda.</li>}
        {cats.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 p-4">
            <span className="font-semibold">{c.name}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => rename(c)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Products ---------- */
function ProductsPanel() {
  const [prods, setProds] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    const [p, c] = await Promise.all([
      supabase.from("products").select("*").order("sort_order"),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setProds((p.data ?? []) as Product[]);
    setCats(c.data ?? []);
  }
  useEffect(() => { refresh(); }, []);

  async function del(p: Product) {
    if (!confirm(`Remover "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Produto removido");
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="rounded-full">
          <Plus className="mr-1 h-4 w-4" /> Novo produto
        </Button>
      </div>

      {prods.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          Nenhum produto ainda. Adicione o primeiro!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prods.map((p) => (
            <div key={p.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="font-bold">{p.name}</div>
                <div className="text-sm text-primary font-black">{brl(Number(p.price))}</div>
                <div className="mt-auto flex items-center justify-between text-xs">
                  <span className={p.in_stock ? "text-accent-foreground" : "text-destructive"}>
                    {p.in_stock ? "Em estoque" : "Sem estoque"}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(p); setShowForm(true); }} className="rounded-full p-1.5 hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => del(p)} className="rounded-full p-1.5 hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editing}
          cats={cats}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refresh(); }}
        />
      )}
    </div>
  );
}

function ProductForm({
  product,
  cats,
  onClose,
  onSaved,
}: {
  product: Product | null;
  cats: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [cost, setCost] = useState(product ? String(product.cost) : "");
  const [maxPerCart, setMaxPerCart] = useState(product ? String(product.max_per_cart) : "10");
  const [inStock, setInStock] = useState(product?.in_stock ?? true);
  const [categoryId, setCategoryId] = useState<string>(product?.category_id ?? "");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function uploadImage(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      max_per_cart: Math.max(1, parseInt(maxPerCart || "10", 10)),
      in_stock: inStock,
      category_id: categoryId || null,
      image_url: imageUrl || null,
    };
    const { error } = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(product ? "Produto atualizado" : "Produto criado");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-0 sm:items-center sm:p-6">
      <form
        onSubmit={save}
        className="w-full max-w-2xl space-y-4 rounded-t-2xl bg-background p-6 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-black">{product ? "Editar" : "Novo"} produto</h3>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground">Fechar</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Foto</Label>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-24 w-24 overflow-hidden rounded-lg border border-border bg-secondary">
                {imageUrl && <img src={imageUrl} className="h-full w-full object-cover" />}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
                <Upload className="h-4 w-4" />
                {uploading ? "Enviando…" : "Enviar imagem"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          <div className="sm:col-span-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div>
            <Label>Categoria</Label>
            <select
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">(sem categoria)</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Limite por carrinho</Label>
            <Input type="number" min={1} value={maxPerCart} onChange={(e) => setMaxPerCart(e.target.value)} />
          </div>
          <div>
            <Label>Preço de venda (R$)</Label>
            <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div>
            <Label>Custo interno (R$)</Label>
            <Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 sm:col-span-2">
            <div>
              <div className="font-semibold">Em estoque</div>
              <div className="text-xs text-muted-foreground">Produtos fora de estoque não podem ser adicionados ao carrinho.</div>
            </div>
            <Switch checked={inStock} onCheckedChange={setInStock} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-full">Cancelar</Button>
          <Button type="submit" disabled={saving} className="rounded-full">
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Admins ---------- */
function AdminsPanel() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user.trim() || pass.length < 6) {
      return toast.error("Usuário e senha (mín. 6 caracteres) obrigatórios");
    }
    setLoading(true);
    const email = user.includes("@") ? user : `${user}@banquinha.local`;

    // Save current session
    const { data: current } = await supabase.auth.getSession();

    const { data: signUp, error: e1 } = await supabase.auth.signUp({ email, password: pass });
    if (e1 || !signUp.user) {
      setLoading(false);
      return toast.error(e1?.message ?? "Não foi possível criar o usuário");
    }
    const newUserId = signUp.user.id;

    // Restore admin session (signUp logs the new user in)
    if (current.session) {
      await supabase.auth.setSession({
        access_token: current.session.access_token,
        refresh_token: current.session.refresh_token,
      });
    }

    const { error: e2 } = await supabase.from("user_roles").insert({ user_id: newUserId, role: "admin" });
    setLoading(false);
    if (e2) return toast.error("Usuário criado, mas falhou ao conceder admin: " + e2.message);

    toast.success(`Administrador "${user}" criado`);
    setUser(""); setPass("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-display text-lg font-black">Criar novo administrador</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          O novo usuário poderá entrar na Área do Administrador com este login e senha.
        </p>
        <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <Label htmlFor="nu">Usuário</Label>
            <Input id="nu" value={user} onChange={(e) => setUser(e.target.value)} placeholder="ex: pamela" />
          </div>
          <div>
            <Label htmlFor="np">Senha</Label>
            <Input id="np" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="mínimo 6 caracteres" />
          </div>
          <Button type="submit" disabled={loading} className="self-end rounded-full">
            <UserPlus className="mr-1 h-4 w-4" /> Criar
          </Button>
        </form>
      </div>
    </div>
  );
}