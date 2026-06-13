import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/cn';
import {
  Home, Search, ShoppingBag, Calendar, Wallet, User,
  LayoutDashboard, UtensilsCrossed, BarChart2, Users,
  Clock, Star, Truck, LogOut, Settings, ChefHat,
} from 'lucide-react';

// ── Items nav ─────────────────────────────────────────────────────────────────

const CLIENT_NAV = [
  { to: '/home',         label: 'Accueil',       icon: Home },
  { to: '/search',       label: 'Explorer',       icon: Search },
  { to: '/commander',    label: 'Commander',      icon: ShoppingBag },
  { to: '/reservations', label: 'Réservations',   icon: Calendar },
  { to: '/wallet',       label: 'Mon wallet',     icon: Wallet },
  { to: '/profile',      label: 'Mon profil',     icon: User },
];

const RESTAURANT_NAV = [
  { to: '/dashboard',       label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/mon-restaurant',  label: 'Mon restaurant', icon: UtensilsCrossed },
  { to: '/mon-restaurant',  label: 'Commandes',      icon: ShoppingBag,  hash: 'orders' },
  { to: '/mon-restaurant',  label: 'Réservations',   icon: Calendar,     hash: 'reservations' },
  { to: '/mon-restaurant',  label: 'Menu',           icon: ChefHat,      hash: 'menu' },
  { to: '/mon-restaurant',  label: 'Analytics',      icon: BarChart2,    hash: 'analytics' },
  { to: '/mon-restaurant',  label: 'Personnel',      icon: Users,        hash: 'staff' },
  { to: '/mon-restaurant',  label: 'Horaires',       icon: Clock,        hash: 'horaires' },
  { to: '/abonnement',      label: 'Abonnement',     icon: Star },
  { to: '/profile',         label: 'Mon compte',     icon: User },
];

const DRIVER_NAV = [
  { to: '/driver',    label: 'Mes livraisons', icon: Truck },
  { to: '/profile',  label: 'Mon compte',      icon: User },
];

const ADMIN_NAV = [
  { to: '/admin',     label: 'Admin',          icon: LayoutDashboard },
  { to: '/profile',   label: 'Mon compte',     icon: User },
];

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hash?: string;
}

function NavLink({ item }: { item: NavItem }) {
  const { pathname, hash } = useLocation();
  const Icon = item.icon;
  const itemPath = item.hash ? `${item.to}#${item.hash}` : item.to;

  const active = item.hash
    ? pathname === item.to && hash === `#${item.hash}`
    : pathname === item.to || (item.to === '/home' && pathname === '/');

  return (
    <Link
      to={itemPath}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
        active
          ? 'bg-accent/10 text-accent'
          : 'text-text-2 hover:bg-surface-2 hover:text-text',
      )}
    >
      <Icon className={cn('w-4 h-4 shrink-0 transition-colors', active ? 'text-accent' : 'text-text-3 group-hover:text-text')} />
      <span className="truncate">{item.label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
    </Link>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function DesktopSidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems: NavItem[] = (() => {
    switch (user?.role) {
      case 'RESTAURANT': return RESTAURANT_NAV;
      case 'LIVREUR':    return DRIVER_NAV;
      case 'ADMIN':
      case 'SUPER_ADMIN': return ADMIN_NAV;
      default:           return CLIENT_NAV;
    }
  })();

  const roleLabel: Record<string, string> = {
    CLIENT:     'Client',
    RESTAURANT: 'Restaurateur',
    LIVREUR:    'Livreur',
    ADMIN:      'Admin',
    SUPER_ADMIN:'Super Admin',
    STAFF:      'Staff',
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-border flex flex-col z-30">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border shrink-0">
        <Link to="/home" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-black text-sm">E</div>
          <span className="text-lg font-black tracking-tight text-text">
            Elen<span className="text-accent">gi</span>
          </span>
        </Link>
      </div>

      {/* Profil utilisateur */}
      {user && (
        <div className="px-3 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm shrink-0">
              {user.firstName?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-text-3">{roleLabel[user.role] ?? user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item, i) => (
          <NavLink key={`${item.to}-${i}`} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border shrink-0 space-y-1">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs text-text-3">Thème</span>
          <ThemeToggle />
        </div>
        <Link
          to="/abonnement"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-text-3 hover:bg-surface-2 hover:text-text transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Paramètres
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
