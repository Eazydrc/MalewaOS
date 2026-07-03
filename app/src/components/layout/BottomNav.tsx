import { useLocation, Link } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

// ─── Icônes SVG inline ────────────────────────────────────────────────────────

const Icons = {
  home: (filled: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {filled
        ? <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" fill="currentColor"/><rect x="9" y="13" width="6" height="8" rx="1" fill="rgb(var(--color-bg))"/></>
        : <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><rect x="9" y="13" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="1.6"/></>
      }
    </svg>
  ),
  search: (filled: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {filled
        ? <><circle cx="11" cy="11" r="7" fill="currentColor"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><circle cx="11" cy="11" r="4" fill="rgb(var(--color-bg))"/></>
        : <><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>
      }
    </svg>
  ),
  bag: (filled: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {filled
        ? <><path d="M4 7h16l-1.5 12H5.5L4 7z" fill="currentColor"/><path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></>
        : <><path d="M4 7h16l-1.5 12H5.5L4 7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></>
      }
    </svg>
  ),
  orders: (filled: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {filled
        ? <><rect x="5" y="3" width="14" height="18" rx="2" fill="currentColor"/><line x1="9" y1="9" x2="15" y2="9" stroke="rgb(var(--color-bg))" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="13" x2="13" y2="13" stroke="rgb(var(--color-bg))" strokeWidth="1.5" strokeLinecap="round"/></>
        : <><rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/><line x1="9" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
      }
    </svg>
  ),
  profile: (filled: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {filled
        ? <><circle cx="12" cy="7" r="4" fill="currentColor"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor"/></>
        : <><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.6"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></>
      }
    </svg>
  ),
  dashboard: (filled: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {filled
        ? <><rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor"/><rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor"/><rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor"/><rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" opacity=".5"/></>
        : <><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/><rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/></>
      }
    </svg>
  ),
  restaurant: (filled: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {filled
        ? <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="currentColor"/>
        : <><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></>
      }
    </svg>
  ),
  truck: (filled: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {filled
        ? <><rect x="1" y="5" width="14" height="11" rx="1" fill="currentColor"/><path d="M15 9h4l3 3v4h-7V9z" fill="currentColor"/><circle cx="5" cy="19" r="2" fill="currentColor"/><circle cx="18" cy="19" r="2" fill="currentColor"/></>
        : <><rect x="1" y="5" width="14" height="11" rx="1" stroke="currentColor" strokeWidth="1.6"/><path d="M15 9h4l3 3v4h-7V9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="5" cy="19" r="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="18" cy="19" r="2" stroke="currentColor" strokeWidth="1.6"/></>
      }
    </svg>
  ),
};

// ─── Configs nav ──────────────────────────────────────────────────────────────

const CLIENT_NAV = [
  { to: "/home",         label: "Accueil",   icon: Icons.home },
  { to: "/search",       label: "Explorer",  icon: Icons.search },
  { to: "/commander",    label: "Commander", icon: Icons.bag },
  { to: "/mes-commandes",label: "Suivi",     icon: Icons.orders },
  { to: "/profile",      label: "Profil",    icon: Icons.profile },
];

const RESTAURANT_NAV = [
  { to: "/dashboard",    label: "Dashboard",  icon: Icons.dashboard },
  { to: "/mon-restaurant",label:"Restaurant", icon: Icons.restaurant },
  { to: "/profile",      label: "Compte",     icon: Icons.profile },
];

const DRIVER_NAV = [
  { to: "/driver",  label: "Courses",  icon: Icons.truck },
  { to: "/profile", label: "Profil",   icon: Icons.profile },
];

// ─── Composant ────────────────────────────────────────────────────────────────

export function BottomNav() {
  const { pathname } = useLocation();
  const { user }     = useAuthStore();

  const isRestaurant = user?.role === "RESTAURANT";
  const isDriver     = user?.role === "LIVREUR";
  const nav          = isRestaurant ? RESTAURANT_NAV : isDriver ? DRIVER_NAV : CLIENT_NAV;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ maxWidth: "430px", margin: "0 auto" }}>
      {/* Conteneur flottant */}
      <div className="mx-3 mb-3 rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(20,23,42,0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -2px 20px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3)',
        }}>
        <div className="flex items-center justify-around px-1 pt-2 pb-3">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to === "/home" && pathname === "/");
            return (
              <Link key={item.to} to={item.to}
                className="flex flex-col items-center gap-1 px-3 py-1 min-w-0 no-tap relative"
                style={{ color: active ? 'rgb(var(--color-accent))' : 'rgb(var(--color-text-3))' }}>
                {/* Indicateur ligne haut */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 transition-all duration-300"
                  style={{
                    width: active ? 20 : 0,
                    height: 2,
                    borderRadius: 2,
                    background: 'rgb(var(--color-accent))',
                    opacity: active ? 1 : 0,
                  }} />
                {/* Icône avec glow subtil si actif */}
                <div className="transition-transform duration-200" style={{ transform: active ? 'translateY(-1px)' : 'none' }}>
                  {item.icon(active)}
                </div>
                <span className="text-[10px] font-semibold tracking-wide transition-colors duration-200">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
