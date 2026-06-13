import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function RestaurantProfilePage() {
  const navigate = useNavigate();
  const { user }  = useAuthStore();
  const [tab, setTab] = useState<Tab>("menu");
  const isDesktop = useIsDesktop();

  const { data: restaurant, isLoading } = useQuery<Restaurant>({
    queryKey: ["my-restaurant"],
    queryFn:  () => api.get("/restaurants/mine"),
    enabled:  !!user,
  });

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "menu",         label: "Menu",        icon: "🍽️" },
    { id: "reservations", label: "Réservations", icon: "📅" },
    { id: "offres",       label: "Offres",       icon: "🎟️" },
    { id: "avis",         label: "Avis",         icon: "⭐" },
    { id: "tables",       label: "Tables",       icon: "🪑" },
    { id: "analytics",    label: "Analytics",    icon: "📊" },
    { id: "personnel",    label: "Personnel",    icon: "👥" },
    { id: "design",       label: "Design",       icon: "🎨" },
    { id: "horaires",     label: "Horaires",     icon: "🕐" },
    { id: "infos",        label: "Infos",        icon: "🏪" },
  ];

  const activeTab = TABS.find(t => t.id === tab);

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

  // ── Layout Desktop ──────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <AppLayout
        title={restaurant?.name ?? "Mon Restaurant"}
        showBack
        noPadding
      >
        {/* Barre onglets desktop */}
        <div className="border-b border-border bg-surface/95 sticky top-14 z-20">
          <div className="flex px-6 overflow-x-auto gap-1" style={{ scrollbarWidth: "none" } as any}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  tab === t.id ? "border-accent text-accent" : "border-transparent text-text-3 hover:text-text"
                }`}>
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="px-6 py-6 max-w-5xl">
          {tabContent}
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
          <button onClick={() => navigate("/dashboard")}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-text-3 hover:text-text hover:bg-surface-2 transition-all shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-text tracking-tight">Mon Restaurant</h1>
            {activeTab && (
              <p className="text-[10px] text-text-3 font-medium -mt-0.5">
                {activeTab.icon} {activeTab.label}
              </p>
            )}
          </div>
        </div>
        {/* Pills nav — scrollable, style mobile natif */}
        <div className="flex gap-2 px-3 pb-3 overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" } as any}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 transition-all no-tap active:scale-95 ${
                tab === t.id
                  ? "bg-accent text-white shadow-btn"
                  : "bg-surface-2 text-text-3 border border-border"
              }`}>
              <span className="text-[13px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-5 pb-32">
        {tabContent}
      </main>

      <BottomNav />
    </div>
  );
}
