import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { useRestaurantPublic } from "@/hooks/useRestaurantPublic";
import { useCreateReservation } from "@/hooks/useReservations";

const TIME_SLOTS = ["12h00", "12h30", "13h00", "13h30", "19h00", "19h30", "20h00", "20h30", "21h00", "21h30"];
const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

function fc(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ReservationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: restaurant, isLoading } = useRestaurantPublic(id ?? "");
  const createReservation = useCreateReservation();

  const [guests, setGuests]     = useState(2);
  const [date, setDate]         = useState("");
  const [time, setTime]         = useState("");
  const [note, setNote]         = useState("");
  const [error, setError]       = useState("");
  const [showPreOrder, setShowPreOrder] = useState(false);
  const [cart, setCart]         = useState<Map<string, { name: string; priceUsdCents: number; quantity: number }>>(new Map());

  const canSubmit = !!(date && time && guests > 0 && id);

  const cartItems = useMemo(() => Array.from(cart.entries()), [cart]);
  const cartTotal  = cartItems.reduce((sum, [, it]) => sum + it.priceUsdCents * it.quantity, 0);
  const cartCount  = cartItems.reduce((sum, [, it]) => sum + it.quantity, 0);

  function addItem(item: { id: string; name: string; priceUsdCents: number; promoPrice?: number }) {
    setCart(prev => {
      const next = new Map(prev);
      const existing = next.get(item.id);
      next.set(item.id, {
        name: item.name,
        priceUsdCents: item.promoPrice ?? item.priceUsdCents,
        quantity: (existing?.quantity ?? 0) + 1,
      });
      return next;
    });
  }

  function removeItem(itemId: string) {
    setCart(prev => {
      const next = new Map(prev);
      const existing = next.get(itemId);
      if (!existing) return next;
      if (existing.quantity <= 1) next.delete(itemId);
      else next.set(itemId, { ...existing, quantity: existing.quantity - 1 });
      return next;
    });
  }

  async function handleSubmit() {
    if (!canSubmit || !id) return;
    setError("");
    const [h, m] = time.replace("h", ":").split(":");
    const isoDate = new Date(`${date}T${h.padStart(2, "0")}:${m}:00`).toISOString();

    try {
      await createReservation.mutateAsync({
        restaurantId: id,
        date: isoDate,
        partySize: guests,
        notes: note || undefined,
        items: cartItems.length
          ? cartItems.map(([menuItemId, it]) => ({ menuItemId, quantity: it.quantity }))
          : undefined,
      });
      navigate("/reservations");
    } catch (e: any) {
      setError(e?.message ?? "Impossible de créer la réservation, réessayez.");
    }
  }

  if (isLoading || !restaurant) {
    return (
      <AppLayout showBack title="Réserver">
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBack title="Réserver">
      {/* Restaurant résumé */}
      <div className="card p-4 flex items-center gap-3">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="w-14 h-14 rounded-xl object-cover border border-border shrink-0"
          onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/56x56/F1F1F5/9999B0?text=${restaurant.name[0]}`; }}
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-text">{restaurant.name}</p>
          <p className="text-xs text-text-3 mt-0.5">{restaurant.cuisine}</p>
        </div>
      </div>

      {/* Nombre de personnes */}
      <div className="space-y-2">
        <label className="label">Nombre de personnes</label>
        <div className="flex gap-2 flex-wrap">
          {GUEST_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setGuests(n)}
              className={`w-11 h-11 rounded-xl text-sm font-bold border transition-all no-tap active:scale-95 ${
                guests === n
                  ? "bg-text text-bg border-text shadow-btn"
                  : "bg-surface-2 text-text-2 border-border hover:border-border-strong"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <label className="label">Date</label>
        <input
          type="date"
          value={date}
          min={new Date().toISOString().split("T")[0]}
          onChange={e => setDate(e.target.value)}
          className="input-base px-3.5 py-2.5"
        />
      </div>

      {/* Heure */}
      <div className="space-y-2">
        <label className="label">Heure</label>
        <div className="grid grid-cols-5 gap-2">
          {TIME_SLOTS.map(slot => (
            <button
              key={slot}
              onClick={() => setTime(slot)}
              className={`py-2.5 rounded-xl text-xs font-semibold border transition-all no-tap active:scale-95 ${
                time === slot
                  ? "bg-accent text-white border-accent shadow-btn"
                  : "bg-surface-2 text-text-2 border-border hover:border-border-strong"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Note optionnelle */}
      <div className="space-y-1.5">
        <label className="label">Note pour le restaurant <span className="normal-case text-text-3">(optionnel)</span></label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Allergie, occasion spéciale, besoin particulier..."
          rows={3}
          className="input-base px-3.5 py-2.5 resize-none"
        />
      </div>

      {/* Pré-commander des plats — pour être servi dès l'arrivée */}
      {restaurant.menu?.sections?.length ? (
        <div className="space-y-2">
          <button
            onClick={() => setShowPreOrder(v => !v)}
            className="w-full flex items-center justify-between card p-4 no-tap active:scale-[0.99] transition-transform"
          >
            <div className="text-left">
              <p className="text-sm font-bold text-text">🍽️ Pré-commander des plats</p>
              <p className="text-xs text-text-3 mt-0.5">Soyez servi sans attendre à votre arrivée</p>
            </div>
            <div className="flex items-center gap-2">
              {cartCount > 0 && (
                <span className="px-2 py-1 bg-accent text-white rounded-full text-xs font-bold">{cartCount}</span>
              )}
              <span className="text-text-3">{showPreOrder ? "▲" : "▼"}</span>
            </div>
          </button>

          {showPreOrder && (
            <div className="card p-4 space-y-4 animate-fade-in">
              {restaurant.menu.sections.map(section => (
                <div key={section.id} className="space-y-2">
                  <p className="text-xs font-bold text-text-2 uppercase tracking-wide">{section.title}</p>
                  <div className="divide-y divide-border">
                    {section.items.filter(it => it.isAvailable).map(item => {
                      const qty = cart.get(item.id)?.quantity ?? 0;
                      const price = item.promoPrice ?? item.priceUsdCents;
                      return (
                        <div key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text truncate">{item.name}</p>
                            <p className="text-xs text-text-3">{fc(price)}</p>
                          </div>
                          {qty > 0 ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => removeItem(item.id)}
                                className="w-7 h-7 rounded-full bg-surface-2 text-text font-bold text-sm flex items-center justify-center no-tap active:scale-90">−</button>
                              <span className="text-sm font-bold text-text w-4 text-center">{qty}</span>
                              <button onClick={() => addItem(item)}
                                className="w-7 h-7 rounded-full bg-text text-bg font-bold text-sm flex items-center justify-center no-tap active:scale-90">+</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addItem(item)}
                              className="shrink-0 px-3 py-1.5 rounded-full bg-surface-2 text-text-2 text-xs font-bold hover:bg-accent/10 hover:text-accent no-tap active:scale-95"
                            >Ajouter</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {cartCount > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm font-bold text-text">Total pré-commande</span>
                  <span className="text-sm font-bold text-accent">{fc(cartTotal)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Points à gagner */}
      <div className="card p-4 flex items-center gap-3" style={{ borderColor: "rgb(var(--color-success) / 0.20)", background: "rgb(var(--color-success-soft))" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#16A34A" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <div>
          <p className="text-sm font-semibold text-success">Points à gagner</p>
          <p className="text-xs text-success/80 mt-0.5">Gagnez des points fidélité après votre repas</p>
        </div>
      </div>

      {/* Récapitulatif */}
      {canSubmit && (
        <div className="card p-4 space-y-2 animate-fade-in">
          <p className="text-xs font-bold text-text-2 uppercase tracking-wide">Récapitulatif</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-text-3">Restaurant</span><span className="font-semibold text-text">{restaurant.name}</span></div>
            <div className="flex justify-between"><span className="text-text-3">Date</span><span className="font-semibold text-text">{new Date(date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span></div>
            <div className="flex justify-between"><span className="text-text-3">Heure</span><span className="font-semibold text-text">{time}</span></div>
            <div className="flex justify-between"><span className="text-text-3">Personnes</span><span className="font-semibold text-text">{guests}</span></div>
            {cartCount > 0 && (
              <div className="flex justify-between"><span className="text-text-3">Plats pré-commandés</span><span className="font-semibold text-text">{cartCount} ({fc(cartTotal)})</span></div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgb(var(--color-danger-soft))", color: "rgb(var(--color-danger))" }}>
          {error}
        </div>
      )}

      <Button fullWidth size="lg" variant="accent" disabled={!canSubmit} loading={createReservation.isPending} onClick={handleSubmit}>
        {canSubmit ? `Confirmer la réservation` : "Complétez tous les champs"}
      </Button>
    </AppLayout>
  );
}
