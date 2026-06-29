import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CreateRestaurantModal } from "@/components/admin/CreateRestaurantModal";
import { AppLayout } from "@/components/layout/AppLayout";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import {
  useAdminStats,
  useAdminUsers,
  useAdminRestaurants,
  useAdminRestaurantMenu,
  useAdminOrders,
  useChangeUserRole,
  useToggleUserStatus,
  useToggleRestaurantStatus,
  useChangeRestaurantSubscription,
  type AdminRole,
  type SubTier,
  type OrderStatus,
  type AdminUser,
  type AdminRestaurant,
  type AdminOrder,
} from "@/hooks/useAdmin";

// ─── Meta ────────────────────────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; variant: any; emoji: string }> = {
  CLIENT:      { label: "Client",      variant: "default", emoji: "👤" },
  RESTAURANT:  { label: "Restaurant",  variant: "info",    emoji: "🍽️" },
  ADMIN:       { label: "Admin",       variant: "warning", emoji: "🛡️" },
  SUPER_ADMIN: { label: "Super Admin", variant: "danger",  emoji: "👑" },
};

const TIER_META: Record<string, { label: string; variant: any }> = {
  DECOUVERTE: { label: "Découverte",  variant: "default" },
  MAMAN:      { label: "Maman $3",    variant: "default" },
  ESSENTIEL:  { label: "Essentiel",   variant: "info"    },
  CROISSANCE: { label: "Croissance",  variant: "accent"  },
  DOMINATION: { label: "Domination",  variant: "warning" },
};

const ORDER_STATUS_META: Record<string, { label: string; variant: any }> = {
  PENDING:          { label: "En attente",     variant: "warning" },
  ACCEPTED:         { label: "Acceptée",       variant: "info"    },
  PREPARING:        { label: "En préparation", variant: "info"    },
  PACKAGING:        { label: "Emballage",      variant: "info"    },
  OUT_FOR_DELIVERY: { label: "En livraison",   variant: "accent"  },
  READY:            { label: "Prête",          variant: "success" },
  DELIVERED:        { label: "Livrée",         variant: "success" },
  CANCELLED:        { label: "Annulée",        variant: "danger"  },
};

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const parts = name.trim().split(" ");
  const init = (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  const s = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${s} rounded-xl bg-accent/10 flex items-center justify-center font-black text-accent shrink-0 uppercase`}>
      {init}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 min-w-[160px]">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-surface-2 text-sm text-text placeholder:text-text-3 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
      />
    </div>
  );
}

function FilterSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-10 px-3 rounded-xl border border-border bg-surface-2 text-sm text-text outline-none focus:ring-2 focus:ring-accent/30"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Pager({ page, pages, total, label, onPrev, onNext }: {
  page: number; pages: number; total: number; label: string;
  onPrev: () => void; onNext: () => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-xs text-text-3">{total} {label}</p>
      <div className="flex items-center gap-1.5">
        <button disabled={page <= 1} onClick={onPrev}
          className="h-7 px-3 rounded-lg border border-border text-xs text-text-2 disabled:opacity-40 hover:bg-surface-2 transition-colors">
          ‹
        </button>
        <span className="text-xs px-2 text-text-2 font-semibold">{page}/{pages}</span>
        <button disabled={page >= pages} onClick={onNext}
          className="h-7 px-3 rounded-lg border border-border text-xs text-text-2 disabled:opacity-40 hover:bg-surface-2 transition-colors">
          ›
        </button>
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: number | string; sub?: string }) {
  return (
    <div className="card rounded-2xl p-4 border border-border flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-black tracking-tighter text-text leading-none">{typeof value === "number" ? value.toLocaleString() : value}</p>
        <p className="text-xs font-semibold text-text-3 uppercase tracking-wide mt-0.5">{label}</p>
        {sub && <p className="text-xs text-text-3 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function OverviewTab() {
  const { data, isLoading } = useAdminStats();

  if (isLoading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={84} />)}
      </div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="👥" label="Utilisateurs" value={data.totals.users} />
        <StatCard icon="🍽️" label="Restaurants" value={data.totals.restaurants} sub={`${data.totals.activeRestaurants} actifs`} />
        <StatCard icon="📅" label="Réservations" value={data.totals.reservations} />
        <StatCard icon="📦" label="Commandes" value={data.totals.orders} />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="card rounded-2xl border border-border p-4">
          <p className="text-xs font-bold text-text-3 uppercase tracking-wide mb-3">Par rôle</p>
          <div className="space-y-2.5">
            {data.usersByRole.map(({ role, count }) => {
              const m = ROLE_META[role] ?? { label: role, variant: "default", emoji: "?" };
              return (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{m.emoji}</span>
                    <Badge variant={m.variant} size="sm">{m.label}</Badge>
                  </div>
                  <span className="text-sm font-bold text-text">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card rounded-2xl border border-border p-4">
          <p className="text-xs font-bold text-text-3 uppercase tracking-wide mb-3">Par abonnement</p>
          <div className="space-y-2.5">
            {data.restaurantsByTier.map(({ tier, count }) => {
              const m = TIER_META[tier] ?? { label: tier, variant: "default" };
              return (
                <div key={tier} className="flex items-center justify-between">
                  <Badge variant={m.variant} size="sm">{m.label}</Badge>
                  <span className="text-sm font-bold text-text">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card rounded-2xl border border-border">
        <p className="text-xs font-bold text-text-3 uppercase tracking-wide px-4 pt-4 pb-2">Dernières inscriptions</p>
        <div className="divide-y divide-border">
          {data.recentUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-text-3 truncate">{u.email}</p>
                </div>
              </div>
              <Badge variant={ROLE_META[u.role]?.variant ?? "default"} size="sm">
                {ROLE_META[u.role]?.label ?? u.role}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────

function UsersTab({ currentUserRole }: { currentUserRole: string }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRole] = useState<AdminRole | "">("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminUsers({ search: search || undefined, role: (roleFilter as AdminRole) || undefined, page });
  const changeRole   = useChangeUserRole();
  const toggleStatus = useToggleUserStatus();
  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";
  const ROLES: AdminRole[] = ["CLIENT", "RESTAURANT", "ADMIN", "SUPER_ADMIN"];

  function handleRoleChange(user: AdminUser, newRole: AdminRole) {
    if (!confirm(`Changer le rôle de ${user.firstName} ${user.lastName} en ${newRole} ?`)) return;
    changeRole.mutate({ userId: user.id, role: newRole });
  }
  function handleToggle(user: AdminUser) {
    if (!confirm(`${user.isActive ? "Désactiver" : "Activer"} ${user.firstName} ${user.lastName} ?`)) return;
    toggleStatus.mutate(user.id);
  }

  const users = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Rechercher un utilisateur…" />
        <FilterSelect value={roleFilter} onChange={v => { setRole(v as any); setPage(1); }}
          options={[{ value: "", label: "Tous les rôles" }, ...ROLES.map(r => ({ value: r, label: ROLE_META[r]?.label ?? r }))]} />
      </div>

      <div className="card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={64} />)}</div>
        ) : (
          <div className="divide-y divide-border">
            {users.map(user => {
              const m = ROLE_META[user.role] ?? { label: user.role, variant: "default", emoji: "?" };
              return (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={`${user.firstName} ${user.lastName}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-text-3 truncate">{user.email}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={m.variant} size="sm">{m.label}</Badge>
                          <Badge variant={user.isActive ? "success" : "danger"} dot size="sm">
                            {user.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-3">
                    <span>🏅 {user.points} pts</span>
                    <span>📅 {user._count.reservations}</span>
                    <span>📦 {user._count.orders}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSuperAdmin && (
                      <select value={user.role} onChange={e => handleRoleChange(user, e.target.value as AdminRole)}
                        disabled={changeRole.isPending}
                        className="text-xs h-8 px-2 rounded-lg border border-border bg-surface-2 text-text outline-none flex-1">
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>)}
                      </select>
                    )}
                    <button onClick={() => handleToggle(user)} disabled={toggleStatus.isPending}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold shrink-0 ${user.isActive ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"}`}>
                      {user.isActive ? "Désactiver" : "Activer"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pager page={page} pages={data?.meta.pages ?? 1} total={data?.meta.total ?? 0} label="utilisateurs"
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
      </div>
    </div>
  );
}

// ─── Restaurants ──────────────────────────────────────────────────────────────

function RestaurantMenuModal({ restaurantId, onClose }: { restaurantId: string; onClose: () => void }) {
  const { data, isLoading } = useAdminRestaurantMenu(restaurantId);
  const sections = data?.menus?.[0]?.sections ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text">{data?.name ?? "Menu"}</h3>
          <button onClick={onClose} className="text-text-3 hover:text-text text-sm">✕</button>
        </div>
        {isLoading ? (
          <Skeleton height={120} />
        ) : sections.length === 0 ? (
          <p className="text-sm text-text-3">Aucun menu pour ce restaurant.</p>
        ) : (
          sections.map(s => (
            <div key={s.id} className="space-y-1.5">
              <p className="text-xs font-bold text-text-3 uppercase tracking-wider">{s.title}</p>
              {s.items.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className={item.isAvailable ? "text-text" : "text-text-3 line-through"}>{item.name}</span>
                  <span className="font-semibold text-text-2">${(item.priceUsdCents / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RestaurantsTab({ onNewRestaurant }: { onNewRestaurant: () => void }) {
  const [search, setSearch] = useState("");
  const [subFilter, setSub] = useState<SubTier | "">("");
  const [page, setPage] = useState(1);
  const [menuRestaurantId, setMenuRestaurantId] = useState<string | null>(null);

  const { data, isLoading } = useAdminRestaurants({ search: search || undefined, subscription: (subFilter as SubTier) || undefined, page });
  const toggleStatus = useToggleRestaurantStatus();
  const changeSub    = useChangeRestaurantSubscription();
  const TIERS: SubTier[] = ["DECOUVERTE", "MAMAN", "ESSENTIEL", "CROISSANCE", "DOMINATION"];

  function handleSubChange(r: AdminRestaurant, sub: SubTier) {
    if (!confirm(`Passer "${r.name}" en ${sub} ?`)) return;
    changeSub.mutate({ restaurantId: r.id, subscription: sub });
  }
  function handleToggle(r: AdminRestaurant) {
    if (!confirm(`${r.isActive ? "Désactiver" : "Activer"} "${r.name}" ?`)) return;
    toggleStatus.mutate(r.id);
  }

  const restaurants = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={onNewRestaurant}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouveau
        </button>
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Rechercher un restaurant…" />
        <FilterSelect value={subFilter} onChange={v => { setSub(v as any); setPage(1); }}
          options={[{ value: "", label: "Tous" }, ...TIERS.map(t => ({ value: t, label: TIER_META[t]?.label ?? t }))]} />
      </div>

      <div className="card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={80} />)}</div>
        ) : (
          <div className="divide-y divide-border">
            {restaurants.map(r => (
              <div key={r.id} className="p-4 space-y-2">
                <div className="flex items-start gap-3">
                  {r.imageUrl
                    ? <img src={r.imageUrl} alt={r.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    : <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-2xl shrink-0">🍽️</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-text truncate">{r.name}</p>
                      <Badge variant={r.isActive ? "success" : "danger"} dot size="sm">
                        {r.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-3">{r.city} · ⭐ {r.rating.toFixed(1)}</p>
                    <p className="text-xs text-text-3 truncate">{r.owner.firstName} {r.owner.lastName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select value={r.subscription} onChange={e => handleSubChange(r, e.target.value as SubTier)}
                    disabled={changeSub.isPending}
                    className="text-xs h-8 px-2 rounded-lg border border-border bg-surface-2 text-text outline-none flex-1">
                    {TIERS.map(t => <option key={t} value={t}>{TIER_META[t]?.label ?? t}</option>)}
                  </select>
                  <button onClick={() => setMenuRestaurantId(r.id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold shrink-0 bg-surface-2 text-text-2 hover:bg-surface-3">
                    🍽️ Menu
                  </button>
                  <button onClick={() => handleToggle(r)} disabled={toggleStatus.isPending}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold shrink-0 ${r.isActive ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"}`}>
                    {r.isActive ? "Désactiver" : "Activer"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Pager page={page} pages={data?.meta.pages ?? 1} total={data?.meta.total ?? 0} label="restaurants"
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
      </div>
      {menuRestaurantId && (
        <RestaurantMenuModal restaurantId={menuRestaurantId} onClose={() => setMenuRestaurantId(null)} />
      )}
    </div>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function OrdersTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminOrders({ search: search || undefined, status: (statusFilter as OrderStatus) || undefined, page });
  const ALL_STATUSES: OrderStatus[] = ["PENDING","ACCEPTED","PREPARING","PACKAGING","OUT_FOR_DELIVERY","READY","DELIVERED","CANCELLED"];
  const orders = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Restaurant ou client…" />
        <FilterSelect value={statusFilter} onChange={v => { setStatus(v as any); setPage(1); }}
          options={[{ value: "", label: "Tous les statuts" }, ...ALL_STATUSES.map(s => ({ value: s, label: ORDER_STATUS_META[s]?.label ?? s }))]} />
      </div>

      <div className="card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={64} />)}</div>
        ) : !orders.length ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-sm font-semibold text-text-2">Aucune commande</p>
            <p className="text-xs text-text-3 mt-1">Les commandes apparaîtront ici</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order: AdminOrder) => {
              const sm = ORDER_STATUS_META[order.status] ?? { label: order.status, variant: "default" };
              return (
                <div key={order.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-bold text-text">{order.restaurant.name}</p>
                        <Badge variant={sm.variant} size="sm">{sm.label}</Badge>
                      </div>
                      <p className="text-xs text-text-3">{order.user.firstName} {order.user.lastName}</p>
                      <p className="text-xs text-text-3 mt-0.5">{order._count.items} article{order._count.items > 1 ? "s" : ""} · {timeAgo(order.createdAt)}</p>
                    </div>
                    <p className="text-base font-black text-text shrink-0">{fmt(order.totalCents)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pager page={page} pages={data?.meta.pages ?? 1} total={data?.meta.total ?? 0} label="commandes"
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

type Tab = "overview" | "users" | "restaurants" | "orders";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",    label: "Vue d'ensemble", icon: "📊" },
  { id: "users",       label: "Utilisateurs",   icon: "👥" },
  { id: "restaurants", label: "Restaurants",    icon: "🍽️" },
  { id: "orders",      label: "Commandes",      icon: "📦" },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [createOpen, setCreateOpen] = useState(false);
  const isDesktop = useIsDesktop();

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center p-8">
        <p className="text-5xl mb-4">🚫</p>
        <h1 className="text-xl font-bold text-text mb-2">Accès refusé</h1>
        <p className="text-sm text-text-2 mb-5">Vous n'avez pas les permissions nécessaires.</p>
        <button onClick={() => navigate("/home")}
          className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:opacity-90 transition-opacity">
          Retour à l'accueil
        </button>
      </div>
    </div>
  );

  async function handleLogout() { await logout(); navigate("/login"); }

  // ── Layout Desktop ──────────────────────────────────────────────────────────
  if (isDesktop) {
    const headerRight = (
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-3 font-medium">
          {user.firstName} · <span className="text-accent font-bold">{user.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}</span>
        </span>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-accent text-white text-xs font-bold hover:opacity-90 transition-opacity">
          + Restaurant
        </button>
        <button onClick={handleLogout}
          className="text-xs px-3 py-1.5 rounded-xl border border-border text-text-2 font-semibold hover:bg-surface-2 transition-colors">
          Déconnexion
        </button>
      </div>
    );
    return (
      <AppLayout title="Administration" headerRight={headerRight} noPadding>
        <CreateRestaurantModal open={createOpen} onClose={() => setCreateOpen(false)} />

        {/* Tabs — segmented control */}
        <div className="bg-surface/95 sticky top-14 z-20 px-6 py-3 border-b border-border">
          <div className="flex gap-1 bg-surface-2 rounded-xl p-1 max-w-2xl">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t.id ? "bg-bg text-text shadow-card" : "text-text-3 hover:text-text-2"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4 max-w-7xl">
          {tab === "overview"    && <OverviewTab />}
          {tab === "users"       && <UsersTab currentUserRole={user?.role ?? ""} />}
          {tab === "restaurants" && <RestaurantsTab onNewRestaurant={() => setCreateOpen(true)} />}
          {tab === "orders"      && <OrdersTab />}
        </div>
      </AppLayout>
    );
  }

  // ── Layout Mobile ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface" style={{ maxWidth: "430px", margin: "0 auto" }}>
      <CreateRestaurantModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 card border-b border-border/60 px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")}
            className="w-8 h-8 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-text-2 hover:text-text transition-colors shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tighter text-text">Elen<span className="text-accent">gi</span></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full">Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-accent text-white text-xs font-bold hover:opacity-90 transition-opacity">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            +
          </button>

          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white text-xs font-black shrink-0">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>

          <ThemeToggle />
        </div>
      </header>

      {/* ── Tabs — segmented control ── */}
      <div className="sticky top-14 z-30 px-3 py-2 bg-surface border-b border-border/60">
        <div className="flex gap-1 bg-surface-2 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                tab === t.id ? "bg-bg text-text shadow-card" : "text-text-3 hover:text-text-2"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <main className="px-4 py-5 pb-24 space-y-4">
        {tab === "overview"    && <OverviewTab />}
        {tab === "users"       && <UsersTab currentUserRole={user?.role ?? ""} />}
        {tab === "restaurants" && <RestaurantsTab onNewRestaurant={() => setCreateOpen(true)} />}
        {tab === "orders"      && <OrdersTab />}
      </main>

      {/* ── Bottom bar logout ── */}
      <div className="fixed bottom-0 z-40 card border-t border-border px-4 py-3 flex items-center justify-between" style={{ maxWidth: "430px", left: 0, right: 0, margin: "0 auto" }}>
        <div className="text-xs text-text-3">
          <span className="font-bold text-text">{user.firstName}</span>
          {" · "}{user.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
        </div>
        <button onClick={handleLogout}
          className="text-xs px-3 py-1.5 rounded-xl border border-border text-text-2 font-semibold">
          Déconnexion
        </button>
      </div>
    </div>
  );
}
