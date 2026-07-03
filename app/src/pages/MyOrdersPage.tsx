import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';

interface MyOrder {
  id: string;
  status: string;
  totalCents: number;
  deliveryFeeUsdCents?: number;
  deliveryAddress?: string;
  isPaid: boolean;
  escrowReleased?: boolean;
  verificationCode?: string;
  createdAt: string;
  restaurant: { id: string; name: string; imageUrl?: string };
  items: { id: string; name: string; quantity: number }[];
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:          { label: '⏳ En attente',        color: 'text-amber-500' },
  ACCEPTED:         { label: '✅ Acceptée',           color: 'text-blue-500' },
  PREPARING:        { label: '👨‍🍳 En cuisine',        color: 'text-blue-500' },
  PACKAGING:        { label: '📦 Emballage',          color: 'text-blue-500' },
  OUT_FOR_DELIVERY: { label: '🛵 En route',           color: 'text-accent' },
  READY:            { label: '🔔 Prête',              color: 'text-green-500' },
  DELIVERED:        { label: '✅ Livrée',             color: 'text-green-500' },
  CANCELLED:        { label: '❌ Annulée',            color: 'text-red-500' },
};

function formatPrice(cents: number) {
  return `${(cents * 2800 / 100).toLocaleString('fr-CD')} FC`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

export default function MyOrdersPage() {
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery<MyOrder[]>({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/mine'),
    refetchInterval: 15000,
  });

  const active   = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const done     = orders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status));

  return (
    <AppLayout showBack title="Mes commandes">
      <div className="space-y-5">

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="card h-24 animate-pulse" />)}
          </div>
        )}

        {/* ── Commandes actives ── */}
        {active.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs font-bold text-text-2 uppercase tracking-wide">En cours</p>
            {active.map(order => <OrderCard key={order.id} order={order} navigate={navigate} />)}
          </section>
        )}

        {/* ── Historique ── */}
        {done.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs font-bold text-text-2 uppercase tracking-wide">Historique</p>
            {done.map(order => <OrderCard key={order.id} order={order} navigate={navigate} />)}
          </section>
        )}

        {!isLoading && orders.length === 0 && (
          <div className="card p-10 text-center space-y-2">
            <p className="text-3xl">🛍️</p>
            <p className="text-sm font-bold text-text">Aucune commande</p>
            <p className="text-xs text-text-3">Vos commandes apparaîtront ici</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function OrderCard({ order, navigate }: { order: MyOrder; navigate: (p: string) => void }) {
  const status = STATUS_LABEL[order.status] ?? { label: order.status, color: 'text-text-3' };
  const isDelivery = !!order.deliveryAddress;
  const isActive = !['DELIVERED', 'CANCELLED'].includes(order.status);
  const needsConfirm = order.status === 'DELIVERED' && isDelivery && !order.escrowReleased;
  const total = (order.totalCents ?? 0) + (order.deliveryFeeUsdCents ?? 0);

  return (
    <button
      onClick={() => isDelivery ? navigate(`/track/${order.id}`) : undefined}
      className={`card w-full text-left p-4 space-y-3 transition-all ${isDelivery ? 'active:scale-[0.98] cursor-pointer' : 'cursor-default'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-surface-2 overflow-hidden shrink-0">
          {order.restaurant.imageUrl
            ? <img src={order.restaurant.imageUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text truncate">{order.restaurant.name}</p>
          <p className="text-xs text-text-3">{timeAgo(order.createdAt)}</p>
        </div>
        <span className={`text-xs font-bold shrink-0 ${status.color}`}>{status.label}</span>
      </div>

      {/* Items */}
      <p className="text-xs text-text-2 line-clamp-1">
        {order.items.map(i => `${i.quantity}× ${i.name}`).join(' · ')}
      </p>

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-3">{formatPrice(total)}</span>
        {isDelivery && isActive && (
          <span className="text-xs font-semibold text-accent">Suivre →</span>
        )}
      </div>

      {/* Confirmation bloc — si livré mais pas confirmé */}
      {needsConfirm && (
        <div
          onClick={e => { e.stopPropagation(); navigate(`/track/${order.id}`); }}
          className="rounded-xl bg-amber-500/10 border border-amber-400/30 p-3 space-y-1 cursor-pointer active:scale-[0.98]"
        >
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
            📦 Commande livrée — confirmez la réception
          </p>
          <p className="text-[11px] text-text-3">
            Entrez le code que vous montre le livreur pour clôturer la commande
          </p>
          <div className="mt-1 inline-block px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-bold">
            Entrer le code →
          </div>
        </div>
      )}
    </button>
  );
}
