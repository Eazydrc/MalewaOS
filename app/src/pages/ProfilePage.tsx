import { useState, FormEvent, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { BottomNav } from "@/components/layout/BottomNav";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ChangePasswordModal } from "@/components/profile/ChangePasswordModal";
import { DAYS, DEFAULT_HOURS, OpeningHours } from "@/hooks/useMenu";
import { useWalletSummary } from "@/hooks/useWallet";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Restaurant {
  id: string; name: string; description?: string; categories: string[];
  phone?: string; address: string; city: string; imageUrl?: string;
  images: string[]; priceRange: number; rating: number; reviewCount: number;
  isOpen: boolean; isActive: boolean; subscription: string;
  subscriptionExpiresAt?: string; createdAt: string;
  openingHours?: OpeningHours;
}

interface Reservation {
  id: string; date: string; partySize: number; notes?: string; status: string;
  user: { firstName: string; lastName: string; email: string; phone?: string };
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  MAMAN:      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  ESSENTIEL:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  CROISSANCE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  DOMINATION: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "En attente",  color: "warning" },
  CONFIRMED: { label: "Confirmée",   color: "success" },
  CANCELLED: { label: "Annulée",     color: "danger"  },
  COMPLETED: { label: "Terminée",    color: "default" },
  NO_SHOW:   { label: "Absent",      color: "danger"  },
};

const CATEGORIES_LIST = [
  "Congolaise","Africaine","Internationale","Fast-food",
  "Pizza","Grillades","Street food","Végétarien","Fruits de mer",
];

// ─── Onglet Profil du restaurant ──────────────────────────────────────────────

function RestaurantProfilTab({ restaurant }: { restaurant: Restaurant }) {
  const qc = useQueryClient();
  const [name,        setName]        = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description ?? "");
  const [address,     setAddress]     = useState(restaurant.address);
  const [city,        setCity]        = useState(restaurant.city);
  const [phone,       setPhone]       = useState(restaurant.phone ?? "");
  const [imageUrl,    setImageUrl]    = useState(restaurant.imageUrl ?? "");
  const [categories,  setCategories]  = useState<string[]>(restaurant.categories);
  const [priceRange,  setPriceRange]  = useState(restaurant.priceRange);
  const [isOpen,      setIsOpen]      = useState(restaurant.isOpen);
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    setName(restaurant.name); setDescription(restaurant.description ?? "");
    setAddress(restaurant.address); setCity(restaurant.city);
    setPhone(restaurant.phone ?? ""); setImageUrl(restaurant.imageUrl ?? "");
    setCategories(restaurant.categories); setPriceRange(restaurant.priceRange);
    setIsOpen(restaurant.isOpen);
  }, [restaurant]);

  function toggleCat(cat: string) {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess(false);
    try {
      await api.patch(`/restaurants/${restaurant.id}`, {
        name, description, address, city,
        phone: phone || undefined,
        imageUrl: imageUrl || undefined,
        categories, priceRange, isOpen,
      });
      await qc.invalidateQueries({ queryKey: ["my-restaurant"] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Abonnement */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Abonnement actuel</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">Contactez un admin pour changer</p>
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide ${TIER_COLORS[restaurant.subscription] ?? ""}`}>
          {restaurant.subscription}
        </span>
      </div>

      {/* Toggle ouvert */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div>
          <p className="text-sm font-bold text-zinc-900 dark:text-white">Restaurant ouvert</p>
          <p className="text-xs text-zinc-400 mt-0.5">Visible aux clients sur la plateforme</p>
        </div>
        <button type="button" onClick={() => setIsOpen(v => !v)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isOpen ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isOpen ? "translate-x-6" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Infos principales */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Informations générales</h3>
        <Input label="Nom du restaurant" value={name} onChange={e => setName(e.target.value)} required />
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            placeholder="Décrivez votre restaurant..."
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 resize-none" />
        </div>
        <Input label="Téléphone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+243 8XX XXX XXX" />
        <Input label="Photo principale (URL)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
        {imageUrl && (
          <div className="rounded-xl overflow-hidden h-40 bg-zinc-100 dark:bg-zinc-800">
            <img src={imageUrl} alt="Aperçu" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
          </div>
        )}
      </div>

      {/* Localisation */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Localisation</h3>
        <Input label="Adresse" value={address} onChange={e => setAddress(e.target.value)} required />
        <Input label="Ville" value={city} onChange={e => setCity(e.target.value)} />
      </div>

      {/* Gamme de prix */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Gamme de prix</label>
        <div className="flex gap-2">
          {[1, 2, 3].map(p => (
            <button key={p} type="button" onClick={() => setPriceRange(p)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${priceRange === p ? "bg-orange-500 text-white border-orange-500" : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-orange-300"}`}>
              {"$".repeat(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Catégories */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Catégories</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES_LIST.map(cat => (
            <button key={cat} type="button" onClick={() => toggleCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${categories.includes(cat) ? "bg-orange-500 text-white border-orange-500" : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-orange-300"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {error   && <p className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>}
      {success && <p className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">✅ Profil mis à jour</p>}
      <Button type="submit" variant="accent" loading={loading}>Enregistrer les modifications</Button>
    </form>
  );
}

// ─── Onglet Horaires ──────────────────────────────────────────────────────────

function HorairesTab({ restaurant }: { restaurant: Restaurant }) {
  const qc = useQueryClient();
  const [hours, setHours] = useState<OpeningHours>(restaurant.openingHours ?? DEFAULT_HOURS);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { setHours(restaurant.openingHours ?? DEFAULT_HOURS); }, [restaurant.openingHours]);

  function update(day: string, field: keyof typeof DEFAULT_HOURS.lun, value: string | boolean) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  async function handleSave() {
    setLoading(true); setSuccess(false);
    try {
      await api.patch(`/restaurants/${restaurant.id}`, { openingHours: hours });
      await qc.invalidateQueries({ queryKey: ["my-restaurant"] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <p className="text-xs text-zinc-400">Définissez vos horaires d'ouverture pour chaque jour de la semaine.</p>
      <div className="space-y-2">
        {DAYS.map(({ key, label }) => {
          const day = hours[key] ?? DEFAULT_HOURS.lun;
          return (
            <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${day.closed ? "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 opacity-60" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"}`}>
              <span className="w-10 text-sm font-bold text-zinc-900 dark:text-white shrink-0">{label.slice(0, 3)}</span>
              <input type="time" value={day.open} disabled={day.closed}
                onChange={e => update(key, "open", e.target.value)}
                className="flex-1 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm disabled:opacity-40 outline-none focus:border-orange-400" />
              <span className="text-xs text-zinc-400">→</span>
              <input type="time" value={day.close} disabled={day.closed}
                onChange={e => update(key, "close", e.target.value)}
                className="flex-1 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm disabled:opacity-40 outline-none focus:border-orange-400" />
              <button type="button" onClick={() => update(key, "closed", !day.closed)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${day.closed ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-800" : "bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800"}`}>
                {day.closed ? "Fermé" : "Ouvert"}
              </button>
            </div>
          );
        })}
      </div>
      {success && <p className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">✅ Horaires enregistrés</p>}
      <Button variant="accent" loading={loading} onClick={handleSave}>Enregistrer les horaires</Button>
    </div>
  );
}

// ─── Onglet Réservations ──────────────────────────────────────────────────────

function ReservationsTab({ restaurantId }: { restaurantId: string }) {
  const qc = useQueryClient();
  const { data: reservations, isLoading } = useQuery<Reservation[]>({
    queryKey: ["restaurant-reservations", restaurantId],
    queryFn:  () => api.get(`/reservations/restaurant/${restaurantId}`),
  });

  async function updateStatus(id: string, status: string) {
    await api.patch(`/reservations/${id}/status`, { status });
    qc.invalidateQueries({ queryKey: ["restaurant-reservations"] });
  }

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} height={80} />)}</div>;

  const pending   = reservations?.filter(r => r.status === "PENDING")   ?? [];
  const confirmed = reservations?.filter(r => r.status === "CONFIRMED") ?? [];
  const others    = reservations?.filter(r => !["PENDING","CONFIRMED"].includes(r.status)) ?? [];

  function ReservCard({ r }: { r: Reservation }) {
    const st = STATUS_LABELS[r.status] ?? { label: r.status, color: "default" };
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-zinc-900 dark:text-white">{r.user.firstName} {r.user.lastName}</p>
            <p className="text-xs text-zinc-400">{r.user.email}{r.user.phone ? ` · ${r.user.phone}` : ""}</p>
          </div>
          <Badge variant={st.color as any} size="sm">{st.label}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span>📅 {new Date(r.date).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", hour:"2-digit", minute:"2-digit" })}</span>
          <span>👥 {r.partySize} pers.</span>
        </div>
        {r.notes && <p className="text-xs text-zinc-400 italic">"{r.notes}"</p>}
        {r.status === "PENDING" && (
          <div className="flex gap-2">
            <button onClick={() => updateStatus(r.id, "CONFIRMED")}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 transition-colors">✓ Confirmer</button>
            <button onClick={() => updateStatus(r.id, "CANCELLED")}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-colors">✕ Annuler</button>
          </div>
        )}
        {r.status === "CONFIRMED" && (
          <div className="flex gap-2">
            <button onClick={() => updateStatus(r.id, "COMPLETED")}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 transition-colors">✓ Terminée</button>
            <button onClick={() => updateStatus(r.id, "NO_SHOW")}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100 transition-colors">Absent</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {pending.length   > 0 && <section className="space-y-3"><p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">En attente ({pending.length})</p>{pending.map(r => <ReservCard key={r.id} r={r} />)}</section>}
      {confirmed.length > 0 && <section className="space-y-3"><p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Confirmées ({confirmed.length})</p>{confirmed.map(r => <ReservCard key={r.id} r={r} />)}</section>}
      {others.length    > 0 && <section className="space-y-3"><p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Historique</p>{others.map(r => <ReservCard key={r.id} r={r} />)}</section>}
      {!reservations?.length && (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-semibold">Aucune réservation pour l'instant</p>
        </div>
      )}
    </div>
  );
}

// ─── Vue Restaurateur ─────────────────────────────────────────────────────────

type RestauTab = "compte" | "restaurant" | "horaires" | "reservations" | "commandes";

function RestaurantAccountPage() {
  const navigate   = useNavigate();
  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState<RestauTab>("compte");
  const [editOpen,     setEditOpen]     = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const { data: restaurant, isLoading } = useQuery<Restaurant>({
    queryKey: ["my-restaurant"],
    queryFn:  () => api.get("/restaurants/mine"),
    enabled:  !!user,
  });

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "—";
  const initials = fullName.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const TABS: { id: RestauTab; label: string; icon: string; locked?: boolean }[] = [
    { id: "compte",       label: "Mon compte",    icon: "👤" },
    { id: "restaurant",   label: "Informations",  icon: "🏪" },
    { id: "horaires",     label: "Horaires",      icon: "🕐" },
    { id: "reservations", label: "Réservations",  icon: "📅" },
    { id: "commandes",    label: "Commandes",     icon: "📦",
      locked: !["CROISSANCE","DOMINATION"].includes(restaurant?.subscription ?? "") },
  ];

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <>
      <div className="min-h-screen bg-surface" style={{ maxWidth: "430px", margin: "0 auto" }}>
        {/* Header */}
        <header className="bg-surface border-b border-border sticky top-0 z-40">
          <div className="px-4 h-14 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-base font-black tracking-tighter text-text">
                Elen<span className="text-accent">gi</span>
                <span className="ml-2 text-xs font-bold text-text-3">Mon compte</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {restaurant && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide ${TIER_COLORS[restaurant.subscription] ?? ""}`}>
                  {restaurant.subscription}
                </span>
              )}
              <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white text-xs font-black overflow-hidden shrink-0">
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : initials
                }
              </div>
            </div>
          </div>
          {/* Pills nav */}
          <div className="flex gap-2 px-3 pb-3 overflow-x-auto"
            style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" } as any}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => !t.locked && setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 transition-all no-tap active:scale-95 ${
                  t.locked
                    ? "bg-surface-2 text-text-3 border border-border opacity-50 cursor-not-allowed"
                    : tab === t.id
                      ? "bg-accent text-white shadow-btn"
                      : "bg-surface-2 text-text-3 border border-border"
                }`}>
                <span className="text-[13px]">{t.icon}</span>
                {t.label}
                {t.locked && <span className="text-[8px] opacity-70">🔒</span>}
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-5 pb-32">

          {/* ── Onglet Mon compte ── */}
          {tab === "compte" && (
            <div className="space-y-5">
              {/* Identité */}
              <div className="card p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-white text-xl font-black shrink-0 overflow-hidden">
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : initials
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text truncate">{fullName}</p>
                  <p className="text-xs text-text-3 truncate mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                    Restaurateur
                  </span>
                </div>
                <button onClick={() => setEditOpen(true)}
                  className="w-8 h-8 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-text-3 hover:text-text transition-all shrink-0 no-tap">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>

              {/* Actions */}
              <div className="card divide-y divide-border/60 p-0 overflow-hidden">
                {[
                  { icon: "✏️", label: "Modifier mon profil",     onClick: () => setEditOpen(true) },
                  { icon: "🔒", label: "Changer de mot de passe", onClick: () => setPasswordOpen(true) },
                  { icon: "🔔", label: "Notifications",           onClick: () => {} },
                ].map(item => (
                  <button key={item.label} onClick={item.onClick}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors text-left no-tap active:bg-surface-3">
                    <span className="text-base w-6 text-center shrink-0">{item.icon}</span>
                    <span className="flex-1 text-sm font-medium text-text">{item.label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-text-3">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                ))}
              </div>

              {/* Support */}
              <div className="card divide-y divide-border/60 p-0 overflow-hidden">
                {[
                  { icon: "💬", label: "Aide & Support" },
                  { icon: "📄", label: "Conditions d'utilisation" },
                  { icon: "🔐", label: "Politique de confidentialité" },
                ].map(item => (
                  <button key={item.label}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors text-left no-tap active:bg-surface-3">
                    <span className="text-base w-6 text-center shrink-0">{item.icon}</span>
                    <span className="flex-1 text-sm font-medium text-text-2">{item.label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-text-3">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                ))}
              </div>

              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 dark:border-red-900 text-red-500 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors no-tap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Se déconnecter
              </button>

              <p className="text-center text-[11px] text-text-3">Elengi v1.0.0 · Made with ❤️ in Kinshasa</p>
            </div>
          )}

          {/* ── Autres onglets ── */}
          {isLoading && tab !== "compte" && (
            <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} height={100} />)}</div>
          )}

          {!isLoading && !restaurant && tab !== "compte" && (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🏪</p>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Aucun restaurant trouvé</h2>
              <p className="text-zinc-500 text-sm">Contactez un administrateur pour configurer votre restaurant.</p>
            </div>
          )}

          {restaurant && tab === "restaurant"   && <RestaurantProfilTab restaurant={restaurant} />}
          {restaurant && tab === "horaires"     && <HorairesTab restaurant={restaurant} />}
          {restaurant && tab === "reservations" && <ReservationsTab restaurantId={restaurant.id} />}
          {restaurant && tab === "commandes"    && (
            <div className="text-center py-20 text-zinc-400">
              <p className="text-4xl mb-3">📦</p>
              <p className="font-semibold text-zinc-600 dark:text-zinc-400">Commandes en ligne</p>
              <p className="text-sm mt-1">Disponible avec l'abonnement CROISSANCE ou DOMINATION</p>
            </div>
          )}
        </main>
      </div>

      <EditProfileModal    open={editOpen}     onClose={() => setEditOpen(false)} />
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <BottomNav />
    </>
  );
}

// ─── Vue Client ───────────────────────────────────────────────────────────────

function ClientProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [editOpen,     setEditOpen]     = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { data: wallet } = useWalletSummary();

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "—";
  const initials = fullName.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const isAdmin  = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const MENU_SECTIONS = [
    {
      title: "Compte",
      items: [
        { icon: "👤", label: "Modifier le profil",         onClick: () => setEditOpen(true),     arrow: true },
        { icon: "🔔", label: "Notifications",              onClick: () => {},                    arrow: true },
        { icon: "🔒", label: "Sécurité & mot de passe",   onClick: () => setPasswordOpen(true), arrow: true },
        { icon: "💳", label: "Méthodes de paiement",      onClick: () => {},                    arrow: true },
      ],
    },
    {
      title: "Préférences",
      items: [
        { icon: "🍽️", label: "Préférences alimentaires", onClick: () => {}, arrow: true },
        { icon: "📍", label: "Adresses sauvegardées",    onClick: () => {}, arrow: true },
        { icon: "🌍", label: "Langue",      value: "Français", onClick: () => {}, arrow: true },
      ],
    },
    ...(isAdmin ? [{
      title: "Administration",
      items: [{ icon: "⚙️", label: "Dashboard Administrateur", onClick: () => navigate("/admin"), arrow: true, highlight: true }],
    }] : []),
    {
      title: "Support",
      items: [
        { icon: "💬", label: "Aide & Support",                onClick: () => {}, arrow: true },
        { icon: "⭐", label: "Évaluer l'application",         onClick: () => {}, arrow: false },
        { icon: "📄", label: "Conditions d'utilisation",     onClick: () => {}, arrow: true },
        { icon: "🔐", label: "Politique de confidentialité", onClick: () => {}, arrow: true },
      ],
    },
  ];

  const roleLabelMap: Record<string, string> = {
    CLIENT: "Membre", RESTAURANT: "Restaurateur",
    ADMIN: "Administrateur", SUPER_ADMIN: "Super Administrateur",
  };

  return (
    <>
      <AppLayout title="Profil">
        {/* Avatar + infos */}
        <div className="card p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-white text-2xl font-black shadow-btn shrink-0 overflow-hidden">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              : initials
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-text tracking-tight truncate">{fullName}</p>
            <p className="text-xs text-text-3 truncate mt-0.5">{user?.email ?? "—"}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isAdmin ? "warning" : "accent"} size="sm">
                {isAdmin ? "⚡" : "⭐"} {roleLabelMap[user?.role ?? "CLIENT"] ?? "Membre"}
              </Badge>
            </div>
          </div>
          <button onClick={() => setEditOpen(true)}
            className="w-8 h-8 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-text-3 hover:text-text hover:border-border-strong transition-all no-tap active:scale-95 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Points",       value: (user?.points ?? 0).toLocaleString(), accent: true },
            { label: "Réservations", value: "0" },
            { label: "Dépenses",     value: "0 FC" },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center space-y-0.5">
              <p className={`text-lg font-black tracking-tighter ${s.accent ? "text-accent" : "text-text"}`}>{s.value}</p>
              <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Wallet */}
        <Link to="/wallet" className="card p-4 flex items-center gap-4 active:scale-[0.98] transition-transform no-tap">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center text-white text-xl shadow-btn shrink-0">
            💰
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text">Mon Portefeuille</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-black text-accent">
                {wallet ? wallet.points.toLocaleString() : (user?.points ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-text-3">pts</span>
              {wallet && wallet.redeemableFC > 0 && (
                <span className="text-xs text-text-3">
                  · {wallet.redeemableFC.toLocaleString()} FC disponibles
                </span>
              )}
            </div>
            {wallet && wallet.nextTierPoints > 0 && (
              <div className="mt-1.5">
                <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(wallet.progress, 100)}%` }} />
                </div>
              </div>
            )}
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-text-3 shrink-0">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>

        {/* Sections */}
        {MENU_SECTIONS.map(section => (
          <section key={section.title} className="space-y-2">
            <p className="section-label px-1">{section.title}</p>
            <div className="card divide-y divide-border/60 p-0 overflow-hidden">
              {section.items.map((item: any) => (
                <button key={item.label} onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left no-tap active:bg-surface-3 ${item.highlight ? "hover:bg-accent/5" : "hover:bg-surface-2"}`}>
                  <span className="text-base w-6 flex items-center justify-center shrink-0">{item.icon}</span>
                  <span className={`flex-1 text-sm font-medium ${item.highlight ? "text-accent" : "text-text"}`}>{item.label}</span>
                  {"value" in item && item.value && <span className="text-xs text-text-3 font-medium">{item.value}</span>}
                  {item.arrow && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={item.highlight ? "text-accent" : "text-text-3"}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}

        <Button fullWidth variant="ghost" className="text-danger hover:bg-danger-soft border border-border" onClick={handleLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Se déconnecter
        </Button>

        <p className="text-center text-[11px] text-text-3 font-medium pb-2">Elengi v1.0.0 · Made with ❤️ in Kinshasa</p>
      </AppLayout>

      <EditProfileModal    open={editOpen}     onClose={() => setEditOpen(false)} />
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuthStore();
  // Les restaurateurs ont leur propre vue "Mon compte" simplifiée
  if (user?.role === "RESTAURANT") return <RestaurantAccountPage />;
  return <ClientProfilePage />;
}
