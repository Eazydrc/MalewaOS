import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import {
  TIER_INFO,
  TIER_PRICES_CENTS,
  usePaymentHistory,
  type PaymentTier,
} from '@/hooks/usePayments';

// ── Icons ──────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CreditCardIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

// ── Helpers couleurs par tier ──────────────────────────────────────────────────

type TierStyle = { border: string; bg: string; text: string; badge: string };

const TIER_STYLES: Record<PaymentTier, TierStyle> = {
  MAMAN:      { border: 'border-zinc-300 dark:border-zinc-700',    bg: 'bg-zinc-50 dark:bg-zinc-900/30',       text: 'text-zinc-600 dark:text-zinc-300',    badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300' },
  ESSENTIEL:  { border: 'border-sky-200 dark:border-sky-800',      bg: 'bg-sky-50 dark:bg-sky-900/20',         text: 'text-sky-600 dark:text-sky-300',      badge: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300' },
  CROISSANCE: { border: 'border-violet-200 dark:border-violet-800', bg: 'bg-violet-50 dark:bg-violet-900/20',  text: 'text-violet-600 dark:text-violet-300', badge: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300' },
  DOMINATION: { border: 'border-orange-300 dark:border-orange-700', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-300', badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' },
};

const TIER_ORDER: PaymentTier[] = ['MAMAN', 'ESSENTIEL', 'CROISSANCE', 'DOMINATION'];

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-2 ${className ?? ''}`} />;
}

// ── Carte tier ─────────────────────────────────────────────────────────────────

interface TierCardProps {
  tierKey: PaymentTier;
  isCurrent: boolean;
  isLoading: boolean;
}

function TierCard({ tierKey, isCurrent, isLoading }: TierCardProps) {
  const navigate = useNavigate();
  const info     = TIER_INFO[tierKey];
  const style    = TIER_STYLES[tierKey];

  const handleChoose = () => {
    if (isCurrent) return;
    navigate('/payment', {
      state: {
        amountCents: TIER_PRICES_CENTS[tierKey],
        label: `Abonnement ${info.label}`,
        kind: 'subscription',
        tier: tierKey,
        returnTo: '/dashboard',
      },
    });
  };

  return (
    <div
      className={`card p-4 space-y-3 border transition-all ${
        isCurrent
          ? `${style.border} border-2 ${style.bg}`
          : 'border-border'
      }`}
    >
      {/* En-tête */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${style.badge}`}>
            {info.label}
          </span>
          {isCurrent && (
            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full shrink-0">
              Actuel
            </span>
          )}
        </div>
        <span className="text-sm font-black text-text shrink-0">{info.price}</span>
      </div>

      {/* Fonctionnalités */}
      <ul className="space-y-1.5">
        {info.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2 text-xs text-text-2">
            <span className={`mt-0.5 shrink-0 ${style.text}`}>
              <CheckIcon />
            </span>
            {feat}
          </li>
        ))}
      </ul>


      {/* Bouton */}
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : isCurrent ? (
        <div className={`w-full py-2.5 rounded-xl text-xs font-bold text-center ${style.badge}`}>
          Plan actif
        </div>
      ) : (
        <Button
          variant={tierKey === 'DOMINATION' ? 'accent' : 'secondary'}
          fullWidth
          onClick={handleChoose}
          className={
            tierKey === 'CROISSANCE'
              ? 'bg-violet-600 hover:bg-violet-700 text-white border-0'
              : tierKey === 'ESSENTIEL'
              ? 'bg-sky-600 hover:bg-sky-700 text-white border-0'
              : tierKey === 'MAMAN'
              ? 'bg-zinc-500 hover:bg-zinc-600 text-white border-0'
              : ''
          }
        >
          Choisir {info.label}
        </Button>
      )}
    </div>
  );
}

// ── Historique des paiements ───────────────────────────────────────────────────

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  SUCCESS: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40',
  PENDING: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40',
  FAILED:  'text-red-600   dark:text-red-400   bg-red-100   dark:bg-red-900/40',
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  SUCCESS: 'Réussi',
  PENDING: 'En attente',
  FAILED:  'Échoué',
};

function PaymentHistory() {
  const { data: payments, isLoading, isError } = usePaymentHistory();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-text px-1">Historique des paiements</h3>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div className="card p-4 text-center">
          <p className="text-xs text-text-3">Impossible de charger l'historique</p>
        </div>
      )}

      {!isLoading && !isError && (!payments || payments.length === 0) && (
        <div className="card p-6 text-center">
          <p className="text-xl mb-1">💳</p>
          <p className="text-sm font-semibold text-text-2">Aucun paiement enregistré</p>
          <p className="text-xs text-text-3 mt-0.5">Vos transactions apparaîtront ici</p>
        </div>
      )}

      {payments && payments.length > 0 && (
        <div className="card divide-y divide-border overflow-hidden p-0">
          {payments.map((payment) => {
            const tierInfo = TIER_INFO[payment.tier as PaymentTier];
            return (
              <div key={payment.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text truncate">
                    {tierInfo?.label ?? payment.tier}
                  </p>
                  <p className="text-xs text-text-3">
                    {new Date(payment.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-sm font-bold text-text">
                    ${payment.amount}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PAYMENT_STATUS_STYLE[payment.status] ?? ''}`}>
                    {PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function AbonnementPage() {
  const navigate = useNavigate();

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn:  () => api.get<{ subscription?: string }>('/restaurants/mine'),
  });

  const currentTier = (restaurant?.subscription ?? 'MAMAN') as PaymentTier;
  const currentInfo = TIER_INFO[currentTier];
  const currentStyle = TIER_STYLES[currentTier];

  return (
    <AppLayout title="Abonnement">
      <div className="space-y-6">

        {/* ── Header avec bouton retour ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center text-text-2 hover:bg-surface hover:text-text transition-colors"
          >
            <ArrowLeftIcon />
          </button>
          <div>
            <h1 className="text-base font-black text-text">Choisir un abonnement</h1>
            <p className="text-xs text-text-3">Payez via CinetPay — Mobile Money DRC</p>
          </div>
        </div>

        {/* ── Badge tier actuel ── */}
        {loadingRestaurant ? (
          <Skeleton className="h-14 w-full" />
        ) : (
          <div className={`card p-3 flex items-center gap-3 border ${currentStyle.border} ${currentStyle.bg}`}>
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${currentStyle.badge}`}>
              <CreditCardIcon size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-3">Plan actuel</p>
              <p className={`text-sm font-black ${currentStyle.text}`}>
                {currentInfo.label} — {currentInfo.price}
              </p>
            </div>
          </div>
        )}

        {/* ── Cards des 4 tiers ── */}
        <div className="space-y-3">
          {TIER_ORDER.map((tierKey) => (
            <TierCard
              key={tierKey}
              tierKey={tierKey}
              isCurrent={tierKey === currentTier}
              isLoading={loadingRestaurant}
            />
          ))}
        </div>

        {/* ── Note CinetPay ── */}
        <div className="card p-4 bg-surface-2 text-center">
          <p className="text-xs text-text-3 leading-relaxed">
            Paiements sécurisés par{' '}
            <span className="font-bold text-text-2">CinetPay</span>{' '}
            — Airtel Money, M-Pesa, Orange Money.{' '}
            Abonnements mensuels, non remboursables.
            Taux indicatif : 1 USD = 2 800 FC.
          </p>
        </div>

        {/* ── Historique ── */}
        <PaymentHistory />
      </div>
    </AppLayout>
  );
}
