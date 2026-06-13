import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { RESTAURANTS } from "@/data/mockData";

const TIME_SLOTS = ["12h00", "12h30", "13h00", "13h30", "19h00", "19h30", "20h00", "20h30", "21h00", "21h30"];
const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ReservationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const restaurant = RESTAURANTS.find(r => r.id === id) ?? RESTAURANTS[0];

  const [guests, setGuests]     = useState(2);
  const [date, setDate]         = useState("");
  const [time, setTime]         = useState("");
  const [note, setNote]         = useState("");
  const [loading, setLoading]   = useState(false);

  const canSubmit = date && time && guests > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/reservations");
    }, 1500);
  }

  return (
    <AppLayout showBack title="Réserver">
      {/* Restaurant résumé */}
      <div className="card p-4 flex items-center gap-3">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-14 h-14 rounded-xl object-cover border border-border shrink-0"
          onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/56x56/F1F1F5/9999B0?text=${restaurant.name[0]}`; }}
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-text">{restaurant.name}</p>
          <p className="text-xs text-text-3 mt-0.5">{restaurant.cuisine}</p>
          <p className="text-xs text-text-3 mt-0.5">{restaurant.address}</p>
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
          </div>
        </div>
      )}

      <Button fullWidth size="lg" variant="accent" disabled={!canSubmit} loading={loading} onClick={handleSubmit}>
        {canSubmit ? `Confirmer la réservation` : "Complétez tous les champs"}
      </Button>
    </AppLayout>
  );
}
