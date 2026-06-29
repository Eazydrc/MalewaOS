import { useState, useEffect, type ComponentType } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppLayout } from "@/components/layout/AppLayout";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { Restaurant, Tab } from "./restaurant-profile/shared";
import { MenuTab } from "./restaurant-profile/MenuTab";
import { InfosTab } from "./restaurant-profile/InfosTab";
import { HorairesTab } from "./restaurant-profile/HorairesTab";
import { ReservationsTab } from "./restaurant-profile/ReservationsTab";
import { OffresTab } from "./restaurant-profile/OffresTab";
import { AvisTab } from "./restaurant-profile/AvisTab";
import { TablesTab } from "./restaurant-profile/TablesTab";
import { AnalyticsTab } from "./restaurant-profile/AnalyticsTab";
import { PersonnelTab } from "./restaurant-profile/PersonnelTab";
import { DesignTab } from "./restaurant-profile/DesignTab";
import { ChefHatIcon, TagIcon, TableIcon, CalendarIcon, StarFilledIcon, BarChartIcon, UsersIcon, PaletteIcon, ClockIcon, StoreIcon } from "@/components/ui/Icon";

// Groupes thématiques — pour un menu d'accès plus doux et plus lisible
// qu'une longue barre d'onglets défilante
const TAB_GROUPS: { label: string; tabs: { id: Tab; label: string; icon: ComponentType<{ size?: number; className?: string }> }[] }[] = [
  { label: "Vente", tabs: [
    { id: "menu",      label: "Menu",    icon: ChefHatIcon },
    { id: "offres",    label: "Offres",  icon: TagIcon },
    { id: "tables",    label: "Tables",  icon: TableIcon },
  ]},
  { label: "Clients", tabs: [
    { id: "reservations", label: "Réservations", icon: CalendarIcon },
    { id: "avis",         label: "Avis",         icon: StarFilledIcon },
  ]},
  { label: "Gestion", tabs: [
    { id: "analytics", label: "Analytics",  icon: BarChartIcon },
    { id: "personnel", label: "Personnel",  icon: UsersIcon },
    { id: "design",    label: "Design",     icon: PaletteIcon },
    { id: "horaires",  label: "Horaires",   icon: ClockIcon },
    { id: "infos",     label: "Infos",      icon: StoreIcon },
  ]},
];

const ALL_TABS = TAB_GROUPS.flatMap(g => g.tabs);

export default function RestaurantProfilePage() {
  const navigate = useNavigate();
  const { user }  = useAuthStore();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab | null>(tabParam);

  useEffect(() => {
    if (tabParam) setTab(tabParam);
  }, [tabParam]);
  const isDesktop = useIsDesktop();

  const { data: restaurant, isLoading } = useQuery<Restaurant>({
    queryKey: ["my-restaurant"],
    queryFn:  () => api.get("/restaurants/mine"),
    enabled:  !!user,
  });

  const activeTab = ALL_TABS.find(t => t.id === tab);

  const tabContent = (
    <>
      {isLoading && <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} height={100} />)}</div>}
      {!isLoading && !restaurant && tab !== "menu" && (
        <div className="card text-center py-20">
          <p className="text-5xl mb-4">🏪</p>
          <p className="text-sm text-text-3">Contactez un administrateur pour configurer votre restaurant.</p>
        </div>
      )}
      {tab === "menu"         && <MenuTab />}
      {restaurant && tab === "infos"        && <InfosTab r={restaurant} />}
      {restaurant && tab === "horaires"     && <HorairesTab r={restaurant} />}
      {restaurant && tab === "reservations" && <ReservationsTab restaurantId={restaurant.id} />}
      {restaurant && tab === "offres"       && <OffresTab subscription={restaurant.subscription} />}
      {restaurant && tab === "avis"         && <AvisTab subscription={restaurant.subscription} />}
      {restaurant && tab === "tables"       && <TablesTab subscription={restaurant.subscription} restaurantId={restaurant.id} />}
      {restaurant && tab === "analytics"    && <AnalyticsTab subscription={restaurant.subscription} />}
      {restaurant && tab === "personnel"    && <PersonnelTab subscription={restaurant.subscription} />}
      {restaurant && tab === "design"       && <DesignTab r={restaurant} />}
    </>
  );

  // Grille d'accès — tuiles douces groupées par thème, plutôt qu'une
  // longue barre d'onglets à faire défiler latéralement
  const launcherGrid = (
    <div className="space-y-6">
      {TAB_GROUPS.map(group => (
        <div key={group.label} className="space-y-2.5">
          <p className="text-xs font-bold text-text-3 uppercase tracking-wider px-1">{group.label}</p>
          <div className="grid grid-cols-3 gap-2.5">
            {group.tabs.map(t => {
              const TabIcon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="card flex flex-col items-center gap-2 py-5 rounded-2xl border border-border bg-surface hover:bg-surface-2 active:scale-[0.97] transition-all no-tap"
                >
                  <TabIcon size={22} className="text-accent" />
                  <span className="text-xs font-bold text-text-2">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Layout Desktop ──────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <AppLayout
        title={tab ? `${restaurant?.name ?? "Mon Restaurant"} — ${activeTab?.label}` : (restaurant?.name ?? "Mon Restaurant")}
        showBack
        headerRight={tab ? (
          <button onClick={() => setTab(null)} className="text-xs font-bold text-accent hover:underline">
            ← Tous les réglages
          </button>
        ) : undefined}
      >
        <div className="px-6 py-6 max-w-5xl">
          {tab === null ? launcherGrid : tabContent}
        </div>
      </AppLayout>
    );
  }

  // ── Layout Mobile ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface" style={{ maxWidth: "430px", margin: "0 auto" }}>
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="px-4 h-14 flex items-center gap-3">
          <button onClick={() => (tab ? setTab(null) : navigate("/dashboard"))}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-text-3 hover:text-text hover:bg-surface-2 transition-all shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-text tracking-tight">Mon Restaurant</h1>
            {activeTab && (
              <p className="text-[10px] text-text-3 font-medium -mt-0.5">
                {activeTab.label}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-5 pb-32">
        {tab === null ? launcherGrid : tabContent}
      </main>

      <BottomNav />
    </div>
  );
}
