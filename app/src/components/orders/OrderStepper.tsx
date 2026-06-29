// Stepper visuel de progression d'une commande.
// Trois parcours distincts : sur place (servie en salle), à emporter
// (récupérée par le client) et livraison (remise à un livreur).

import type { ComponentType } from 'react';
import { ClockAlertIcon, CheckCircleIcon, ChefHatIcon, BellIcon, PackageIcon, BikeIcon, StoreIcon, XCircleIcon } from '@/components/ui/Icon';

export type OrderStatus =
  | 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'PACKAGING'
  | 'OUT_FOR_DELIVERY' | 'READY' | 'DELIVERED' | 'CANCELLED';

export type OrderFulfillment = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

/** Dérive le type de service à partir des données de la commande. */
export function fulfillmentOf(order: { deliveryAddress?: string | null; table?: unknown | null }): OrderFulfillment {
  if (order.deliveryAddress) return 'DELIVERY';
  if (order.table) return 'DINE_IN';
  return 'TAKEAWAY';
}

interface Stage { status: OrderStatus; label: string; icon: ComponentType<{ size?: number }> }

const DINE_IN_STAGES: Stage[] = [
  { status: 'PENDING',   label: 'Reçue',      icon: ClockAlertIcon },
  { status: 'ACCEPTED',  label: 'Acceptée',   icon: CheckCircleIcon },
  { status: 'PREPARING', label: 'En cuisine',  icon: ChefHatIcon },
  { status: 'READY',     label: 'Prête',      icon: BellIcon },
  { status: 'DELIVERED', label: 'Servie',     icon: StoreIcon },
];

const TAKEAWAY_STAGES: Stage[] = [
  { status: 'PENDING',   label: 'Reçue',          icon: ClockAlertIcon },
  { status: 'ACCEPTED',  label: 'Acceptée',       icon: CheckCircleIcon },
  { status: 'PREPARING', label: 'En cuisine',      icon: ChefHatIcon },
  { status: 'READY',     label: 'À récupérer',    icon: BellIcon },
  { status: 'DELIVERED', label: 'Récupérée',      icon: PackageIcon },
];

const DELIVERY_STAGES: Stage[] = [
  { status: 'PENDING',          label: 'Reçue',      icon: ClockAlertIcon },
  { status: 'ACCEPTED',         label: 'Acceptée',   icon: CheckCircleIcon },
  { status: 'PREPARING',        label: 'En cuisine',  icon: ChefHatIcon },
  { status: 'PACKAGING',        label: 'Emballage',  icon: PackageIcon },
  { status: 'OUT_FOR_DELIVERY', label: 'En route',   icon: BikeIcon },
  { status: 'DELIVERED',        label: 'Livrée',     icon: StoreIcon },
];

export function stagesFor(fulfillment: OrderFulfillment): Stage[] {
  if (fulfillment === 'DELIVERY') return DELIVERY_STAGES;
  if (fulfillment === 'TAKEAWAY') return TAKEAWAY_STAGES;
  return DINE_IN_STAGES;
}

export function nextStatus(status: OrderStatus, fulfillment: OrderFulfillment): OrderStatus | null {
  const stages = stagesFor(fulfillment);
  const i = stages.findIndex(s => s.status === status);
  if (i === -1 || i === stages.length - 1) return null;
  return stages[i + 1].status;
}

interface OrderStepperProps {
  status: OrderStatus;
  fulfillment: OrderFulfillment;
  /** Version compacte : pastilles seules + libellé de l'étape en cours, pour les espaces étroits (cartes en grille). */
  compact?: boolean;
}

export function OrderStepper({ status, fulfillment, compact = false }: OrderStepperProps) {
  const stages = stagesFor(fulfillment);

  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
        <XCircleIcon size={14} /><span>Annulée</span>
      </div>
    );
  }

  const currentIndex = stages.findIndex(s => s.status === status);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center w-full">
          {stages.map((stage, i) => {
            const done = currentIndex >= 0 && i <= currentIndex;
            return (
              <div key={stage.status} className="flex items-center flex-1 last:flex-none">
                <div className={`w-2 h-2 rounded-full shrink-0 ${done ? 'bg-accent' : 'bg-surface-2'}`} />
                {i < stages.length - 1 && (
                  <div className={`h-[2px] flex-1 mx-1 rounded-full ${i < currentIndex ? 'bg-accent' : 'bg-surface-2'}`} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] font-semibold text-text">
          {stages[currentIndex]?.label ?? status}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center w-full">
      {stages.map((stage, i) => {
        const done    = currentIndex >= 0 && i <= currentIndex;
        const current = i === currentIndex;
        const StageIcon = stage.icon;
        return (
          <div key={stage.status} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                  done ? 'bg-accent text-white' : 'bg-surface-2 text-text-3',
                  current ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : '',
                ].join(' ')}
                title={stage.label}
              >
                <StageIcon size={14} />
              </div>
              <span className={`text-[10px] font-medium tracking-tight whitespace-nowrap ${done ? 'text-text font-semibold' : 'text-text-3'}`}>
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className={`h-[3px] flex-1 mx-1.5 rounded-full self-start mt-4 ${i < currentIndex ? 'bg-accent' : 'bg-surface-2'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
