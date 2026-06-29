import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/constants";
import { openPaymentPopup } from "@/lib/paymentPopup";
import { useInitiatePayment, usePayOrders, type PaymentMethod, type PaymentTier } from "@/hooks/usePayments";
import { LockIcon, CheckCircleIcon, ClockAlertIcon } from "@/components/ui/Icon";

// ── Icônes ────────────────────────────────────────────────────────────────────

function CardIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <line x1="2" y1="9.5" x2="22" y2="9.5" />
      <line x1="5.5" y1="14.5" x2="10" y2="14.5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <line x1="11" y1="18.5" x2="13" y2="18.5" />
    </svg>
  );
}

// ── Réseaux Mobile Money (RDC) ──────────────────────────────────────────────────

const NETWORKS = [
  { id: "orange",   label: "Orange Money",   mono: "OM", color: "#FF6600" },
  { id: "airtel",   label: "Airtel Money",   mono: "AM", color: "#E2231A" },
  { id: "mpesa",    label: "M-Pesa",         mono: "MP", color: "#4CAF50" },
  { id: "africell", label: "Africell Money", mono: "AF", color: "#0073CF" },
];

// Numéro RDC : 0 + 9 chiffres, ou +243 + 9 chiffres, espaces tolérés
const DRC_PHONE_RE = /^(?:\+?243|0)\d{9}$/;

function normalizePhone(raw: string) {
  return raw.replace(/[\s.-]/g, "");
}

// ── État attendu en navigation ──────────────────────────────────────────────────

export interface PaymentRequest {
  amountCents: number;
  label: string;
  kind: "subscription" | "order";
  tier?: PaymentTier;
  restaurantId?: string;
  orderId?: string;
  returnTo?: string;
}

export default function PaymentPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const request = state as PaymentRequest | null;

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const initiateSubscription = useInitiatePayment();
  const payOrders = usePayOrders();
  const pending = initiateSubscription.isPending || payOrders.isPending;

  if (!request) {
    return (
      <AppLayout showBack title="Paiement">
        <div className="card p-8 text-center space-y-3">
          <ClockAlertIcon size={28} className="mx-auto text-text-3" />
          <p className="text-sm text-text-3">Aucun paiement en cours. Retournez à la page précédente pour relancer le paiement.</p>
          <Button variant="accent" onClick={() => navigate(-1)}>Retour</Button>
        </div>
      </AppLayout>
    );
  }

  const phoneValid = DRC_PHONE_RE.test(normalizePhone(phone));
  const canSubmit = method === "CARD" || (method === "MOBILE_MONEY" && network && phoneValid);

  const handlePay = async () => {
    if (!canSubmit || pending) return;
    setError("");
    try {
      const cleanPhone = method === "MOBILE_MONEY" ? normalizePhone(phone) : undefined;
      const result = request.kind === "subscription"
        ? await initiateSubscription.mutateAsync({ tier: request.tier!, method: method!, phone: cleanPhone })
        : await payOrders.mutateAsync({ restaurantId: request.restaurantId!, method: method!, phone: cleanPhone, orderId: request.orderId });

      if (result?.paymentUrl) {
        await openPaymentPopup(result.paymentUrl);
      }
      setSuccess(true);
      setTimeout(() => navigate(request.returnTo ?? "/home"), 1500);
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors du paiement");
    }
  };

  if (success) {
    return (
      <AppLayout title="Paiement">
        <div className="card p-10 text-center space-y-3">
          <CheckCircleIcon size={40} className="mx-auto text-green-500" />
          <p className="text-base font-bold text-text">Paiement effectué</p>
          <p className="text-xs text-text-3">Redirection…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBack title="Paiement">
      <div className="space-y-5 max-w-md">
        {/* Montant — fixé par le système, non modifiable par le client */}
        <div className="card p-5 text-center space-y-1">
          <p className="text-xs text-text-3">{request.label}</p>
          <p className="text-3xl font-black text-text">{formatPrice(request.amountCents).cdf}</p>
          <p className="text-xs text-text-3">{formatPrice(request.amountCents).usd}</p>
        </div>

        {/* Choix du mode de paiement — sélection unique */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-text-3 uppercase tracking-wider">Mode de paiement</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMethod("CARD")}
              className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all ${
                method === "CARD" ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-text-2 hover:bg-surface-2"
              }`}
            >
              <CardIcon />
              <span className="text-sm font-bold">Visa / Carte</span>
            </button>
            <button
              onClick={() => setMethod("MOBILE_MONEY")}
              className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all ${
                method === "MOBILE_MONEY" ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-text-2 hover:bg-surface-2"
              }`}
            >
              <PhoneIcon />
              <span className="text-sm font-bold">Mobile Money</span>
            </button>
          </div>
        </div>

        {/* Visa : rien à saisir, CinetPay gère la carte sur sa page sécurisée */}
        {method === "CARD" && (
          <div className="card p-4 flex items-center gap-3 text-xs text-text-3">
            <LockIcon size={18} className="shrink-0" />
            Vous serez redirigé vers une page sécurisée pour saisir les informations de votre carte Visa/Mastercard.
          </div>
        )}

        {/* Mobile Money : se déploie vers le bas — réseau puis numéro */}
        <div
          className={`grid transition-all duration-300 ease-out ${
            method === "MOBILE_MONEY" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden space-y-3">
            <div className="space-y-2">
              <p className="text-xs font-bold text-text-3 uppercase tracking-wider">Choisissez votre réseau</p>
              <div className="grid grid-cols-2 gap-2">
                {NETWORKS.map(n => (
                  <button
                    key={n.id}
                    onClick={() => setNetwork(n.id)}
                    className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      network === n.id ? "border-accent bg-accent/10 text-text" : "border-border bg-surface text-text-2 hover:bg-surface-2"
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: n.color }}
                    >
                      {n.mono}
                    </span>
                    <span className="truncate">{n.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-text-3 uppercase tracking-wider">Numéro Mobile Money</p>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ex : 09XX XXX XXX"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60"
              />
              {phone.length > 0 && !phoneValid && (
                <p className="text-[11px] text-text-3">Format attendu : 0XXXXXXXXX ou +243XXXXXXXXX</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2.5 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <Button variant="accent" fullWidth loading={pending} disabled={!canSubmit} onClick={handlePay}>
          {method === "CARD" ? "Continuer vers le paiement" : "Payer maintenant"}
        </Button>
      </div>
    </AppLayout>
  );
}
