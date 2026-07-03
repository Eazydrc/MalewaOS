import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/auth.store";

// ─── Nav Client ───────────────────────────────────────────────────────────────

const CLIENT_NAV = [
  {
    to: "/home", label: "Accueil",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    iconActive: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/><rect x="9" y="12" width="6" height="10" fill="white" opacity="0.9" rx="1"/></svg>,
  },
  {
    to: "/search", label: "Explorer",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    iconActive: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  },
  {
    to: "/commander", label: "Commander",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    iconActive: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <path d="M3 6h18" stroke="white" strokeWidth="1.5" fill="none"/>
        <path d="M16 10a4 4 0 0 1-8 0" stroke="white" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
  {
    to: "/mes-commandes", label: "Commandes",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
    iconActive: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 3h6a1 1 0 0 1 1 1v2H8V4a1 1 0 0 1 1-1z"/></svg>,
  },
  {
    to: "/profile", label: "Profil",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    iconActive: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

// ─── Nav Restaurant ───────────────────────────────────────────────────────────

const RESTAURANT_NAV = [
  {
    to: "/dashboard", label: "Dashboard",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    iconActive: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    to: "/mon-restaurant", label: "Restaurant",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>,
    iconActive: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>,
  },
  {
    to: "/profile", label: "Mon compte",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    iconActive: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

// ─── Nav Livreur ──────────────────────────────────────────────────────────────

const DRIVER_NAV = [
  {
    to: "/driver", label: "Livraisons",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    iconActive: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5" fill="white"/><circle cx="18.5" cy="18.5" r="2.5" fill="white"/></svg>,
  },
  {
    to: "/profile", label: "Mon compte",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    iconActive: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

// ─── Composant ────────────────────────────────────────────────────────────────

export function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();

  const isRestaurant = user?.role === "RESTAURANT";
  const isDriver     = user?.role === "LIVREUR";
  const nav = isRestaurant ? RESTAURANT_NAV : isDriver ? DRIVER_NAV : CLIENT_NAV;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb" style={{ maxWidth: "430px", margin: "0 auto" }}>
      <div className="bg-bg border-t border-border px-2 pt-2 pb-4">
        <div className="flex items-center justify-around">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to === "/home" && pathname === "/");
            return (
              <Link key={item.to} to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150 no-tap min-w-0",
                  active ? "text-accent" : "text-text-3 hover:text-text-2 active:scale-95"
                )}>
                <div className={cn("transition-transform duration-150", active && "scale-110")}>
                  {active ? item.iconActive : item.icon}
                </div>
                <span className={cn("text-[10px] font-semibold tracking-wide truncate", active ? "text-accent" : "text-text-3")}>
                  {item.label}
                </span>
                {active && <span className="absolute bottom-2 w-1 h-1 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
