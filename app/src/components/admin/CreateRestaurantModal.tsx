import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TIERS = ["DECOUVERTE", "MAMAN", "ESSENTIEL", "CROISSANCE", "DOMINATION"] as const;
const TIER_LABELS: Record<string, string> = {
  DECOUVERTE: "DÉCOUVERTE (Gratuit)",
  MAMAN:      "MAMAN $3",
  ESSENTIEL:  "ESSENTIEL $10",
  CROISSANCE: "CROISSANCE $25",
  DOMINATION: "DOMINATION $45",
};

const REST_TYPES = ["SUR_PLACE", "LIVRAISON", "LES_DEUX"] as const;
const REST_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  SUR_PLACE: { label: "Sur place",          emoji: "🪑" },
  LIVRAISON: { label: "Livraison",           emoji: "🛵" },
  LES_DEUX:  { label: "Sur place + Livraison", emoji: "🪑🛵" },
};
const CATEGORIES = [
  "Congolaise", "Africaine", "Internationale", "Fast-food",
  "Pizza", "Grillades", "Street food", "Végétarien", "Fruits de mer",
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

export function CreateRestaurantModal({ open, onClose }: Props) {
  const qc = useQueryClient();

  // ── Propriétaire ────────────────────────────────────────────────────────────
  const [firstName,   setFirstName]   = useState("");
  const [lastName,    setLastName]    = useState("");
  const [email,       setEmail]       = useState("");
  const [phone,       setPhone]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");

  // ── Restaurant ──────────────────────────────────────────────────────────────
  const [restName,      setRestName]      = useState("");
  const [restPhone,     setRestPhone]     = useState("");
  const [description,   setDescription]   = useState("");
  const [categories,    setCategories]    = useState<string[]>([]);
  const [subscription,  setSub]           = useState<string>("MAMAN");
  const [restaurantType, setRestType]     = useState<string>("SUR_PLACE");

  // ── Adresse structurée ──────────────────────────────────────────────────────
  const [ville,     setVille]     = useState("Kinshasa");
  const [commune,   setCommune]   = useState("");
  const [quartier,  setQuartier]  = useState("");
  const [numero,    setNumero]    = useState("");
  const [reference, setReference] = useState("");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState<any>(null);

  if (!open) return null;

  function toggleCategory(cat: string) {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  // Indicateur force mot de passe
  const pwdStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8)                        score++;
    if (/[A-Z]/.test(password))                      score++;
    if (/[0-9]/.test(password))                      score++;
    if (/[^A-Za-z0-9]/.test(password))               score++;
    return score;
  })();
  const pwdStrengthLabel = ['', 'Faible', 'Moyen', 'Bon', 'Fort'][pwdStrength];
  const pwdStrengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][pwdStrength];

  function reset() {
    setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setPassword(""); setConfirmPwd("");
    setRestName(""); setRestPhone(""); setDescription(""); setCategories([]); setSub("MAMAN"); setRestType("SUR_PLACE");
    setVille("Kinshasa"); setCommune(""); setQuartier(""); setNumero(""); setReference("");
    setError(""); setSuccess(null);
  }

  function handleClose() { reset(); onClose(); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8)        { setError("Mot de passe : minimum 8 caractères"); return; }
    if (pwdStrength < 3)            { setError("Mot de passe trop faible — ajoutez majuscule, chiffre et symbole"); return; }
    if (password !== confirmPwd)    { setError("Les mots de passe ne correspondent pas"); return; }
    if (!commune.trim())            { setError("La commune est obligatoire"); return; }
    if (!quartier.trim())           { setError("Le quartier est obligatoire"); return; }

    setLoading(true); setError("");
    try {
      const result = await api.post("/admin/restaurants/create-account", {
        // Propriétaire
        firstName, lastName, email,
        phone:    phone || undefined,
        password,
        // Restaurant
        restaurantName: restName,
        restaurantPhone: restPhone || undefined,
        description: description || undefined,
        categories: categories.length ? categories : undefined,
        subscription,
        restaurantType,
        // Adresse structurée
        ville:     ville || "Kinshasa",
        commune,
        quartier,
        numero:    numero    || undefined,
        reference: reference || undefined,
      });
      setSuccess(result);
      qc.invalidateQueries({ queryKey: ["admin", "restaurants"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    } catch (err: any) {
      setError(err.message ?? "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 " +
    "text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl my-8">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-black tracking-tighter text-zinc-900 dark:text-white">
              Créer un compte restaurant
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Le propriétaire recevra ses identifiants</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Succès ── */}
        {success ? (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-4xl">✅</div>
            <div>
              <p className="text-lg font-black text-zinc-900 dark:text-white">Compte créé !</p>
              <p className="text-sm text-zinc-500 mt-1">
                Restaurant <span className="font-bold text-zinc-700 dark:text-zinc-300">{success.restaurant?.name}</span> enregistré
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">{success.restaurant?.address}</p>
            </div>
            <div className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 text-left space-y-1.5">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Identifiants du propriétaire</p>
              <p className="text-sm"><span className="text-zinc-400">Email :</span> <span className="font-semibold text-zinc-900 dark:text-white">{success.user?.email}</span></p>
              <p className="text-sm"><span className="text-zinc-400">Mot de passe :</span> <span className="font-semibold text-zinc-900 dark:text-white">{password}</span></p>
            </div>
            <Button variant="accent" onClick={handleClose}>Fermer</Button>
          </div>
        ) : (

        /* ── Formulaire ── */
        <form onSubmit={handleSubmit} className="p-6 space-y-7">

          {/* Section 1 — Propriétaire */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-black text-orange-500">1</div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Propriétaire du restaurant</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prénom *" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              <Input label="Nom *" value={lastName} onChange={e => setLastName(e.target.value)} required />
            </div>
            <Input label="Email *" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label="Téléphone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+243 8XX XXX XXX" />

            {/* Mot de passe + confirmation */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Input label="Mot de passe *" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 caractères" />
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1 h-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`flex-1 rounded-full transition-all ${i <= pwdStrength ? pwdStrengthColor : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                      ))}
                    </div>
                    <p className={`text-[10px] font-semibold ${['','text-red-500','text-orange-400','text-yellow-500','text-green-500'][pwdStrength]}`}>
                      {pwdStrengthLabel}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Input
                  label="Confirmer *"
                  type="password"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  required
                  placeholder="Répéter le mot de passe"
                />
                {confirmPwd && (
                  <p className={`text-[10px] font-semibold ${password === confirmPwd ? 'text-green-500' : 'text-red-500'}`}>
                    {password === confirmPwd ? '✓ Identiques' : '✗ Ne correspondent pas'}
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="border-t border-zinc-100 dark:border-zinc-800" />

          {/* Section 2 — Restaurant */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-black text-orange-500">2</div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Informations du restaurant</h3>
            </div>
            <Input label="Nom du restaurant *" value={restName} onChange={e => setRestName(e.target.value)} required />
            <Input label="Tél. restaurant" type="tel" value={restPhone} onChange={e => setRestPhone(e.target.value)} placeholder="+243..." />

            {/* Abonnement */}
            <Field label="Abonnement initial">
              <div className="grid grid-cols-2 gap-2">
                {TIERS.map(t => (
                  <button key={t} type="button" onClick={() => setSub(t)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      subscription === t
                        ? "bg-orange-500 text-white border-orange-500"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-orange-300"
                    }`}
                  >{TIER_LABELS[t] ?? t}</button>
                ))}
              </div>
            </Field>

            {/* Type de service */}
            <Field label="Type de service *">
              <div className="grid grid-cols-3 gap-2">
                {REST_TYPES.map(t => {
                  const meta = REST_TYPE_LABELS[t];
                  return (
                    <button key={t} type="button" onClick={() => setRestType(t)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                        restaurantType === t
                          ? "bg-orange-500 text-white border-orange-500"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-orange-300"
                      }`}
                    >
                      <span className="text-base">{meta.emoji.split(' ')[0]}</span>
                      <span className="leading-tight text-center">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Catégories */}
            <Field label="Catégories">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      categories.includes(cat)
                        ? "bg-orange-500 text-white border-orange-500"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-orange-300"
                    }`}
                  >{cat}</button>
                ))}
              </div>
            </Field>

            {/* Description */}
            <Field label="Description (optionnel)">
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                rows={2} placeholder="Décrivez le restaurant…"
                className={inputClass + " resize-none py-3 h-auto"}
              />
            </Field>
          </section>

          <div className="border-t border-zinc-100 dark:border-zinc-800" />

          {/* Section 3 — Adresse */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-black text-orange-500">3</div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Adresse du restaurant</h3>
            </div>

            {/* Ville */}
            <Field label="Ville">
              <input
                value={ville} onChange={e => setVille(e.target.value)}
                className={inputClass}
                placeholder="Kinshasa"
              />
            </Field>

            {/* Commune + Quartier */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Commune *">
                <input
                  value={commune} onChange={e => setCommune(e.target.value)}
                  className={inputClass}
                  placeholder="Ex : Gombe"
                  required
                />
              </Field>
              <Field label="Quartier *">
                <input
                  value={quartier} onChange={e => setQuartier(e.target.value)}
                  className={inputClass}
                  placeholder="Ex : Lingwala"
                  required
                />
              </Field>
            </div>

            {/* Numéro + Référence */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Numéro (parcelle / rue)">
                <input
                  value={numero} onChange={e => setNumero(e.target.value)}
                  className={inputClass}
                  placeholder="Ex : 12 ou 12B"
                />
              </Field>
              <Field label="Référence / repère">
                <input
                  value={reference} onChange={e => setReference(e.target.value)}
                  className={inputClass}
                  placeholder="Ex : face à la pharmacie"
                />
              </Field>
            </div>
          </section>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" fullWidth onClick={handleClose}>Annuler</Button>
            <Button type="submit" variant="accent" fullWidth loading={loading}>Créer le restaurant</Button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
