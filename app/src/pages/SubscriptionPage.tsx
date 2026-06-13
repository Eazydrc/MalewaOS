import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TierConfig {
  label:    string;
  price:    string;
  priceUsd: number;
  color:    string;
  bg:       string;
  border:   string;
  features: string[];
}

// ── Config Tiers ─────────────────────────────────────────────────────────────

const TIERS: Record<string, TierConfig> = {
  MAMAN: {
    label:    "Maman",
    price:    "$3/mois",
    priceUsd: 3,
    color:    "#71717A",
    bg:       "rgb(113 113 122 / 0.10)",
    border:   "rgb(113 113 122 / 0.30)",
    features: [
      "Profil restaurant complet",
      "Menu digital QR",
      "Réservations clients",
      "Horaires d'ouverture",
    ],
  },
  ESSENTIEL: {
    label:    "Essentiel",
    price:    "$10/mois",
    priceUsd: 10,
    color:    "#3B82F6",
    bg:       "rgb(59 130 246 / 0.10)",
    border:   "rgb(59 130 246 / 0.30)",
    features: [
      "Tout Maman +",
      "Badges plats (chaud, dernières unités)",
      "Prix promotionnels",
      "Offres & promotions",
      "Répondre aux avis clients",
    ],
  },
  CROISSANCE: {
    label:    "Croissance",
    price:    "$25/mois",
    priceUsd: 25,
    color:    "#8B5CF6",
    bg:       "rgb(139 92 246 / 0.10)",
    border:   "rgb(139 92 246 / 0.30)",
    features: [
      "Tout Essentiel +",
      "Commandes en ligne",
      "Tables QR",
      "Analytics & statistiques",
      "Gestion du personnel",
    ],
  },
  DOMINATION: {
    label:    "Domination",
    price:    "$45/mois",
    priceUsd: 45,
    color:    "#E85D26",
    bg:       "rgb(232 93 38 / 0.10)",
    border:   "rgb(232 93 38 / 0.30)",
    features: [
      "Tout Croissance +",
      "Analytics avancés",
      "Design personnalisé (logo, couleurs)",
      "Notifications push en temps réel",
      "Support prioritaire",
    ],
  },
};

const TIER_ORDER = ["MAMAN", "ESSENTIEL", "CROISSANCE", "DOMINATION"];

// ── Icons ─────────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CreditCardIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function PhoneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.53a16 16 0 0 0 6 6l.88-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-2 ${
      type === "success"
        ? "bg-green-500 text-white"
        : "bg-red-500 text-white"
    }`}>
      {type === "success" ? "✅" : "❌"} {message}
    </div>
  );
}

// ── Modal Paiement ────────────────────────────────────────────────────────────

function PaymentModal({
  tier,
  onClose,
  onSuccess,
}: {
  tier: string;
  onClose: () => void;
  onSuccess: (result: any) => void;
}) {
  const [phone, setPhone]     = useState("");
  const [error, setError]     = useState("");
  const cfg                   = TIERS[tier];

  const subscribe = useMutation({
    mutationFn: () => api.post<any>("/payments/subscribe", { tier, phone }),
    onSuccess:  (data) => onSuccess(data),
    onError:    (err: any) => setError(err?.message ?? "Erreur lors du paiement"),
  });

  const handleConfirm = () => {
    if (!phone.trim()) { setError("Veuillez saisir votre numéro Mobile Money"); return; }
    if (!/^0[0-9]{8,9}$/.test(phone.trim())) { setError("Numéro invalide (ex: 0999999999)"); return; }
    setError("");
    subscribe.mutate();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-bg rounded-t-3xl p-6 space-y-5 shadow-2xl z-10">
        {/* En-tête */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-black text-text">Passer au plan</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                style={{ color: cfg.color, background: cfg.bg }}>
                {cfg.label}
              </span>
              <span className="text-sm font-bold text-text">{cfg.price}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text-3">
            <XIcon />
          </button>
        </div>

        {/* Champ téléphone */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-2 flex items-center gap-1.5">
            <PhoneIcon size={13} /> Numéro Mobile Money
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="0999 999 999"
            className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            maxLength={10}
          />
          <p className="text-[11px] text-text-3">Airtel Money, M-Pesa, Orange Money — DRC</p>
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>

        {/* Résumé */}
        <div className="bg-surface-2 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-xs text-text-3">
            <span>Plan</span>
            <span className="font-semibold text-text">{cfg.label}</span>
          </div>
          <div className="flex justify-between text-xs text-text-3">
            <span>Montant (USD)</span>
            <span className="font-semibold text-text">${cfg.priceUsd}/mois</span>
          </div>
          <div className="flex justify-between text-xs text-text-3 pt-1 border-t border-border">
            <span>Montant (CDF approx.)</span>
            <span className="font-bold text-text">{(cfg.priceUsd * 2800).toLocaleString("fr-FR")} FC</span>
          </div>
        </div>

        {/* Bouton confirmer */}
        <Button
          variant="accent"
          className="w-full"
          onClick={handleConfirm}
          disabled={subscribe.isPending}
        >
          {subscribe.isPending ? "Traitement en cours…" : (
            <span className="flex items-center justify-center gap-2">
              <CreditCardIcon size={16} /> Confirmer le paiement Mobile Money
            </span>
          )}
        </Button>

        <p className="text-center text-[10px] text-text-3">
          Paiement sécurisé par CinetPay. En confirmant vous acceptez les conditions d'utilisation.
        </p>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export function SubscriptionPage() {
  const { user }               = useAuthStore();
  const qc                     = useQueryClient();
  const [searchParams]         = useSearchParams();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [toast, setToast]      = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Charger le restaurant courant
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["my-restaurant"],
    queryFn:  () => api.get<any>("/restaurants/mine"),
    enabled:  user?.role === "RESTAURANT" || user?.role === "ADMIN",
  });

  const currentTier = restaurant?.subscription ?? "MAMAN";

  // Gérer le retour depuis CinetPay (?status=success)
  useEffect(() => {
    if (searchParams.get("status") === "success") {
      qc.invalidateQueries({ queryKey: ["my-restaurant"] });
      setToast({ message: "Abonnement mis à jour avec succès !", type: "success" });
    }
  }, [searchParams, qc]);

  const handlePaymentSuccess = (result: any) => {
    setSelectedTier(null);

    if (result.devMode) {
      // Mode dev : actualiser et afficher toast
      qc.invalidateQueries({ queryKey: ["my-restaurant"] });
      setToast({ message: `Abonnement ${result.tier} activé (mode dev) !`, type: "success" });
      return;
    }

    if (result.paymentUrl) {
      // Mode prod : rediriger vers CinetPay
      window.location.href = result.paymentUrl;
    }
  };

  if (!user || (user.role !== "RESTAURANT" && user.role !== "ADMIN")) {
    return (
      <AppLayout title="Abonnement">
        <div className="card p-8 text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="text-sm font-semibold text-text-2">Accès réservé aux restaurateurs</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Mon abonnement">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal paiement */}
      {selectedTier && (
        <PaymentModal
          tier={selectedTier}
          onClose={() => setSelectedTier(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* En-tête */}
      <div className="card p-4 space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <CreditCardIcon />
          </div>
          <div>
            <h2 className="text-sm font-black text-text">Choisir un plan</h2>
            <p className="text-xs text-text-3">Payez via Mobile Money (Airtel, M-Pesa, Orange)</p>
          </div>
        </div>
        {isLoading ? (
          <div className="h-5 w-32 bg-surface-2 rounded animate-pulse mt-2" />
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-text-3">Plan actuel :</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{
                color:      TIERS[currentTier]?.color,
                background: TIERS[currentTier]?.bg,
              }}>
              {TIERS[currentTier]?.label ?? currentTier}
            </span>
          </div>
        )}
      </div>

      {/* Cards des tiers */}
      <div className="space-y-3">
        {TIER_ORDER.map((tierKey) => {
          const cfg       = TIERS[tierKey];
          const isCurrent = tierKey === currentTier;
          const tierIdx   = TIER_ORDER.indexOf(tierKey);
          const currIdx   = TIER_ORDER.indexOf(currentTier);
          const isUpgrade = tierIdx > currIdx;
          const isLower   = tierIdx < currIdx;

          return (
            <div
              key={tierKey}
              className="card p-4 space-y-3 transition-all"
              style={isCurrent ? { borderColor: cfg.color, borderWidth: "2px" } : {}}
            >
              {/* En-tête tier */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ color: cfg.color, background: cfg.bg }}>
                    {cfg.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                      Plan actuel
                    </span>
                  )}
                </div>
                <span className="text-sm font-black text-text">{cfg.price}</span>
              </div>

              {/* Fonctionnalités */}
              <ul className="space-y-1.5">
                {cfg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-2">
                    <span style={{ color: cfg.color }} className="mt-0.5 shrink-0">
                      <CheckIcon />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Bouton action */}
              {!isCurrent && (
                <button
                  onClick={() => isUpgrade ? setSelectedTier(tierKey) : undefined}
                  disabled={isLower}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isUpgrade
                      ? "text-white hover:opacity-90 active:scale-[0.98]"
                      : "bg-surface-2 text-text-3 cursor-not-allowed opacity-50"
                  }`}
                  style={isUpgrade ? { background: cfg.color } : {}}
                >
                  {isUpgrade ? `Passer à ${cfg.label}` : "Plan inférieur"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Infos paiement */}
      <div className="card p-4 bg-surface-2">
        <p className="text-xs text-text-3 text-center leading-relaxed">
          Paiements traités via <span className="font-bold text-text-2">CinetPay</span> — Mobile Money DRC.
          Les abonnements sont mensuels et non remboursables.
          Taux de change indicatif : 1 USD = 2 800 FC.
        </p>
      </div>
    </AppLayout>
  );
}

export default SubscriptionPage;
