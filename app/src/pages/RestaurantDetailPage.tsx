import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useRestaurant } from "@/hooks/useRestaurants";
import { DAYS } from "@/hooks/useMenu";

// ─── Icônes ───────────────────────────────────────────────────────────────────

function StarIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? "#F59E0B" : "none"} stroke={filled ? "none" : "#D1D5DB"} strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  const val = (cents / 100).toLocaleString("fr-CD", { maximumFractionDigits: 0 });
  return `${val} FC`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <AppLayout showBack title="Chargement..." noPadding>
      <Skeleton height={224} className="w-full rounded-none" />
      <div className="px-4 py-5 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <Skeleton key={i} height={72} className="rounded-2xl" />)}
        </div>
        <div className="flex gap-2">
          {[1,2,3].map(i => <Skeleton key={i} height={24} width={80} className="rounded-full" />)}
        </div>
        <Skeleton height={80} className="rounded-2xl" />
        <div className="space-y-2">
          {[1,2,3,4].map(i => <Skeleton key={i} height={64} className="rounded-xl" />)}
        </div>
      </div>
    </AppLayout>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: restaurant, isLoading, isError } = useRestaurant(id ?? "");

  if (isLoading) return <PageSkeleton />;

  if (isError || !restaurant) {
    return (
      <AppLayout showBack title="Introuvable">
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <p className="text-5xl mb-4">🍽️</p>
          <h2 className="text-lg font-black text-text mb-2">Restaurant introuvable</h2>
          <p className="text-sm text-text-3 mb-6">Ce restaurant n'existe pas ou n'est plus disponible.</p>
          <Button variant="accent" onClick={() => navigate("/search")}>Voir tous les restaurants</Button>
        </div>
      </AppLayout>
    );
  }

  const hasMenu    = restaurant.menus?.some(m => m.sections?.length > 0);
  const hasReviews = restaurant.reviews?.length > 0;

  return (
    <AppLayout showBack title={restaurant.name} noPadding>
      {/* Hero image */}
      <div className="relative h-56 bg-surface-2 overflow-hidden">
        {restaurant.imageUrl ? (
          <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-surface-2">
            <span className="text-7xl">🍽️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-xl font-black text-white tracking-tight drop-shadow">{restaurant.name}</h1>
              <p className="text-white/80 text-sm mt-0.5">{restaurant.categories.join(" · ")}</p>
            </div>
            <div className="card-glass px-3 py-1.5 flex items-center gap-1.5 rounded-full">
              <StarIcon />
              <span className="text-sm font-bold text-text">{restaurant.rating.toFixed(1)}</span>
              <span className="text-xs text-text-3">({restaurant.reviewCount})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6 pb-28">

        {/* Infos rapides */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              ),
              label: "Ville",
              value: restaurant.city,
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              ),
              label: "Prix",
              value: "$".repeat(restaurant.priceRange),
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 13"/>
                  <path d="M22 16.92a19.79 19.79 0 0 0-3.07-8.63A19.5 19.5 0 0 0 2.08 2"/>
                </svg>
              ),
              label: "Téléphone",
              value: restaurant.phone ?? "N/A",
            },
          ].map(info => (
            <div key={info.label} className="card p-3 text-center space-y-1.5">
              <div className="text-accent flex justify-center">{info.icon}</div>
              <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wide">{info.label}</p>
              <p className="text-xs font-bold text-text truncate">{info.value}</p>
            </div>
          ))}
        </div>

        {/* Statut + catégories */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={restaurant.isOpen ? "success" : "danger"} dot>
            {restaurant.isOpen ? "Ouvert maintenant" : "Fermé"}
          </Badge>
          {restaurant.categories.map(cat => (
            <Badge key={cat} variant="default">{cat}</Badge>
          ))}
        </div>

        {/* Description */}
        {restaurant.description && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-text tracking-tight">À propos</h2>
            <p className="text-sm text-text-2 leading-relaxed">{restaurant.description}</p>
          </div>
        )}

        {/* Adresse + Carte */}
        <div className="card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-2 border border-border flex items-center justify-center shrink-0 text-text-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-3 uppercase tracking-wide">Adresse</p>
              <p className="text-sm text-text font-medium mt-0.5">{restaurant.address}</p>
              <p className="text-xs text-text-3 mt-0.5">{restaurant.city}</p>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address + ', ' + restaurant.city + ', Congo')}`}
              target="_blank" rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Carte
            </a>
          </div>
        </div>

        {/* Horaires d'ouverture */}
        {restaurant.openingHours && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-text tracking-tight">Horaires d'ouverture</h2>
            <div className="card divide-y divide-border/60 p-0 overflow-hidden">
              {DAYS.map(({ key, label }) => {
                const day = (restaurant.openingHours as any)?.[key];
                if (!day) return null;
                const isToday = new Date().toLocaleDateString("fr-FR", { weekday: "short" }).toLowerCase().startsWith(label.slice(0, 3).toLowerCase());
                return (
                  <div key={key} className={`flex items-center justify-between px-4 py-2.5 ${isToday ? "bg-accent/5" : ""}`}>
                    <span className={`text-sm ${isToday ? "font-bold text-accent" : "text-text-2"}`}>
                      {label}{isToday && " (aujourd'hui)"}
                    </span>
                    {day.closed
                      ? <span className="text-xs font-semibold text-danger">Fermé</span>
                      : <span className="text-xs font-semibold text-text">{day.open} – {day.close}</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Menu */}
        {hasMenu && (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-text tracking-tight">Menu</h2>
            {restaurant.menus.map(menu =>
              menu.sections?.map(section => (
                <div key={section.id} className="space-y-2">
                  <h3 className="text-[11px] font-bold text-text-3 uppercase tracking-wider">{section.title}</h3>
                  <div className="card divide-y divide-border/60 p-0 overflow-hidden">
                    {section.items
                      .filter(item => item.isAvailable)
                      .map(item => (
                        <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-text">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-text-3 mt-0.5 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                          <span className="text-sm font-bold text-accent shrink-0">
                            {formatPrice(item.priceUsdCents)}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!hasMenu && (
          <div className="card p-6 text-center">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm font-semibold text-text-2">Menu non disponible</p>
            <p className="text-xs text-text-3 mt-1">Ce restaurant n'a pas encore publié son menu</p>
          </div>
        )}

        {/* Avis clients */}
        {hasReviews && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text tracking-tight">Avis clients</h2>
              <div className="flex items-center gap-1">
                <StarIcon />
                <span className="text-sm font-black text-text">{restaurant.rating.toFixed(1)}</span>
                <span className="text-xs text-text-3">/ 5</span>
              </div>
            </div>
            <div className="space-y-3">
              {restaurant.reviews.map(review => (
                <div key={review.id} className="card p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-black text-sm shrink-0">
                        {review.user.firstName[0]}{review.user.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text">{review.user.firstName} {review.user.lastName}</p>
                        <p className="text-[10px] text-text-3">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon key={i} filled={i < review.rating} />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-text-2 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA sticky */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 p-4 card-glass border-t border-border/60 rounded-none"
        style={{ maxWidth: "430px", margin: "0 auto" }}
      >
        <Button
          fullWidth
          size="lg"
          variant="accent"
          onClick={() => navigate(`/reservation/${restaurant.id}`)}
          disabled={!restaurant.isOpen}
        >
          {restaurant.isOpen ? "Réserver une table" : "Restaurant fermé"}
        </Button>
      </div>
    </AppLayout>
  );
}
