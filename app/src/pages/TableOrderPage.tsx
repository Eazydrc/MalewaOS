import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";

// Page publique — commande depuis table via QR code

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";

function fc(cents: number) {
  return (cents / 100).toLocaleString("fr-CD", { maximumFractionDigits: 0 }) + " FC";
}

interface CartItem {
  menuItemId: string;
  name: string;
  priceUsdCents: number;
  quantity: number;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function TableOrderPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const { user } = useAuthStore();

  const [cart, setCart]         = useState<CartItem[]>([]);
  const [notes, setNotes]       = useState("");
  const [showCart, setShowCart] = useState(false);
  const [success, setSuccess]   = useState(false);
  const [errMsg, setErrMsg]     = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-table", tableId],
    queryFn: async () => {
      const res = await fetch(`${API}/tables/public/${tableId}`);
      if (!res.ok) throw new Error("Table introuvable");
      return res.json() as Promise<{ table: { id: string; number: number; label?: string }; restaurant: any; menu: any }>;
    },
    enabled: !!tableId,
    staleTime: 2 * 60 * 1000,
  });

  const orderMutation = useMutation({
    mutationFn: async (body: object) => {
      const res = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Erreur lors de la commande");
      }
      return res.json();
    },
    onSuccess: () => {
      setCart([]); setNotes(""); setShowCart(false); setSuccess(true);
    },
    onError: (e: any) => setErrMsg(e.message ?? "Erreur"),
  });

  // ── Helpers panier ────────────────────────────────────────────────────────

  function addToCart(item: any) {
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === item.id);
      if (ex) return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, priceUsdCents: item.promoPrice ?? item.priceUsdCents, quantity: 1 }];
    });
  }

  function removeFromCart(menuItemId: string) {
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === menuItemId);
      if (!ex) return prev;
      if (ex.quantity === 1) return prev.filter(c => c.menuItemId !== menuItemId);
      return prev.map(c => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }

  function getQty(menuItemId: string) {
    return cart.find(c => c.menuItemId === menuItemId)?.quantity ?? 0;
  }

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const totalCents = cart.reduce((s, c) => s + c.priceUsdCents * c.quantity, 0);

  async function placeOrder() {
    setErrMsg("");
    if (!user) { setErrMsg("Connectez-vous pour commander."); return; }
    if (!cart.length) return;
    await orderMutation.mutateAsync({
      restaurantId: data!.restaurant.id,
      tableId: data!.table.id,
      items: cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
      notes: notes || undefined,
    });
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (isLoading) return <Spinner />;

  if (isError || !data) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-4xl">🪑</p>
      <p className="font-bold text-text">Table introuvable</p>
      <p className="text-sm text-text-3">Ce QR code n'est plus valide.</p>
    </div>
  );

  const { table, restaurant, menu } = data;

  if (success) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-4xl">✅</div>
      <div>
        <p className="font-black text-xl text-text">Commande envoyée !</p>
        <p className="text-sm text-text-3 mt-1">Table {table.label ?? `N°${table.number}`} · {restaurant.name}</p>
        <p className="text-xs text-text-3 mt-3">Le personnel prépare votre commande. Merci de patienter.</p>
      </div>
      <button onClick={() => setSuccess(false)}
        className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-bold">
        Commander autre chose
      </button>
      <p className="text-[11px] text-text-3">Propulsé par <span className="font-bold text-accent">Elengi</span></p>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg pb-32">

      {/* ── Header ── */}
      <div className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-black text-text text-sm truncate">{restaurant.name}</p>
            <p className="text-xs text-text-3">🪑 Table {table.label ?? `N°${table.number}`}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${restaurant.isOpen ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-zinc-100 text-zinc-500"}`}>
              {restaurant.isOpen ? "🟢 Ouvert" : "🔴 Fermé"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Menu ── */}
      <div className="px-4 pt-4 space-y-6">
        {!restaurant.isOpen && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-center">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Restaurant actuellement fermé</p>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5">Les commandes ne sont pas disponibles pour l'instant</p>
          </div>
        )}

        {(!menu || !menu.sections?.length) ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-3">🍽️</p>
            <p className="text-sm font-semibold text-text-2">Menu en cours de préparation</p>
          </div>
        ) : (
          menu.sections.map((section: any) => (
            <div key={section.id}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-base font-black text-text">{section.title}</h2>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="divide-y divide-border">
                {section.items.map((item: any) => {
                  const qty = getQty(item.id);
                  const price = item.promoPrice ?? item.priceUsdCents;
                  return (
                    <div key={item.id} className="flex items-start gap-3 py-4">
                      {/* Infos — à gauche */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-bold text-text text-sm leading-tight">{item.name}</p>
                        {item.description && <p className="text-xs text-text-3 line-clamp-2">{item.description}</p>}
                        <div>
                          <span className="text-sm font-semibold text-text">{fc(price)}</span>
                          {item.promoPrice != null && (
                            <span className="text-xs text-text-3 line-through ml-1.5">{fc(item.priceUsdCents)}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.isHot       && <span className="px-1.5 py-0.5 bg-surface-2 text-text-2 rounded text-[10px] font-bold">🔥 Populaire</span>}
                          {item.isLastUnits && <span className="px-1.5 py-0.5 bg-surface-2 text-text-2 rounded text-[10px] font-bold">⚡ Derniers</span>}
                        </div>
                      </div>

                      {/* Image + contrôles — à droite */}
                      <div className="relative w-24 h-24 shrink-0">
                        <div className="w-full h-full rounded-xl overflow-hidden bg-surface-2">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                          )}
                        </div>
                        {restaurant.isOpen && (
                          qty === 0 ? (
                            <button onClick={() => addToCart(item)}
                              className="absolute -bottom-2 -right-1 w-8 h-8 rounded-full bg-text text-bg flex items-center justify-center text-lg font-bold active:scale-90 transition-transform shadow-card border-2 border-bg">
                              +
                            </button>
                          ) : (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-bg border border-border rounded-full px-1 py-1 shadow-card">
                              <button onClick={() => removeFromCart(item.id)}
                                className="w-6 h-6 rounded-full bg-surface-2 text-text flex items-center justify-center text-sm font-bold active:scale-90 transition-transform">
                                −
                              </button>
                              <span className="text-xs font-bold text-text w-3 text-center">{qty}</span>
                              <button onClick={() => addToCart(item)}
                                className="w-6 h-6 rounded-full bg-text text-bg flex items-center justify-center text-sm font-bold active:scale-90 transition-transform">
                                +
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Bouton panier flottant ── */}
      {totalItems > 0 && !showCart && (
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <button onClick={() => setShowCart(true)}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-accent rounded-2xl shadow-lg text-white">
            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-black">{totalItems}</span>
            <span className="font-black text-sm">Voir mon panier</span>
            <span className="font-black text-sm">{fc(totalCents)}</span>
          </button>
        </div>
      )}

      {/* ── Panier (drawer) ── */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50" onClick={() => setShowCart(false)}>
          <div className="bg-surface rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between">
              <p className="font-black text-text text-base">Votre commande</p>
              <p className="text-xs text-text-3">Table {table.label ?? `N°${table.number}`}</p>
            </div>

            {/* Lignes panier */}
            <div className="space-y-2">
              {cart.map(c => (
                <div key={c.menuItemId} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(c.menuItemId)}
                      className="w-6 h-6 rounded-full border border-border text-text-3 flex items-center justify-center text-base font-bold">−</button>
                    <span className="text-sm font-black text-accent w-5 text-center">{c.quantity}</span>
                    <button onClick={() => addToCart({ id: c.menuItemId, name: c.name, priceUsdCents: c.priceUsdCents, promoPrice: null })}
                      className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-base font-bold">+</button>
                  </div>
                  <p className="flex-1 text-sm text-text truncate">{c.name}</p>
                  <p className="text-sm font-bold text-text shrink-0">{fc(c.priceUsdCents * c.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="h-px bg-border" />

            {/* Total */}
            <div className="flex items-center justify-between">
              <p className="font-bold text-text">Total</p>
              <p className="font-black text-accent text-lg">{fc(totalCents)}</p>
            </div>

            {/* Note */}
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Note pour la cuisine (allergies, cuisson…)"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-sm text-text outline-none focus:border-accent/60 resize-none" />

            {!user && (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2 font-semibold">
                ⚠️ Vous devez être connecté pour commander.{" "}
                <a href="/login" className="underline">Se connecter</a>
              </p>
            )}

            {errMsg && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{errMsg}</p>}

            <button
              onClick={placeOrder}
              disabled={orderMutation.isPending || !user}
              className="w-full py-3.5 rounded-2xl bg-accent text-white font-black text-sm disabled:opacity-50 active:scale-95 transition-transform shadow-btn">
              {orderMutation.isPending ? "Envoi en cours…" : `Commander · ${fc(totalCents)}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <p className="text-center text-xs text-text-3 mt-8">
        Propulsé par <span className="font-bold text-accent">Elengi</span> 🍽️
      </p>
    </div>
  );
}
