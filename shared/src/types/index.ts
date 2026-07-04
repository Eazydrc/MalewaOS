// ── Utilisateur ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CLIENT' | 'RESTAURANT' | 'ADMIN' | 'SUPER_ADMIN' | 'STAFF' | 'LIVREUR';
  points: number;
  avatarUrl?: string;
  isActive: boolean;
}

// ── Restaurant ────────────────────────────────────────────────────────────────

export type SubscriptionTier = 'MAMAN' | 'ESSENTIEL' | 'CROISSANCE' | 'DOMINATION';
export type RestaurantType = 'RESTAURANT' | 'LIVRAISON' | 'HYBRIDE';
export type PriceRange = 'BUDGET' | 'MOYEN' | 'PREMIUM' | 'LUXE';

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  coverUrl?: string;
  category?: string;
  priceRange?: PriceRange;
  subscription: SubscriptionTier;
  restaurantType: RestaurantType;
  lat?: number;
  lng?: number;
  isOpen: boolean;
  primaryColor?: string;
  accentColor?: string;
}

// ── Menu ──────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  priceUsdCents: number;
  promoPrice?: number;
  imageUrl?: string;
  isAvailable: boolean;
  isHot: boolean;
  isLastUnits: boolean;
}

export interface MenuSection {
  id: string;
  title: string;
  order: number;
  items: MenuItem[];
}

export interface Menu {
  id: string;
  sections: MenuSection[];
}

// ── Réservation ───────────────────────────────────────────────────────────────

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Reservation {
  id: string;
  restaurantId: string;
  userId: string;
  date: string;
  partySize: number;
  status: ReservationStatus;
  notes?: string;
  restaurant?: Pick<Restaurant, 'id' | 'name' | 'logoUrl' | 'address'>;
  user?: Pick<AuthUser, 'id' | 'firstName' | 'lastName' | 'phone'>;
  createdAt: string;
}

// ── Commande ──────────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
export type OrderType = 'TABLE' | 'DELIVERY' | 'TAKEAWAY';

export interface OrderItem {
  id: string;
  name: string;
  priceUsdCents: number;
  quantity: number;
  menuItemId: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  type: OrderType;
  totalCents: number;
  deliveryFeeCents?: number;
  notes?: string;
  items: OrderItem[];
  restaurant?: Pick<Restaurant, 'id' | 'name' | 'logoUrl' | 'address'>;
  userId: string;
  restaurantId: string;
  tableId?: string;
  livreurId?: string;
  createdAt: string;
  estimatedAt?: string;
}

// ── Livraison ─────────────────────────────────────────────────────────────────

export interface DeliveryRequest {
  orderId: string;
  restaurantName: string;
  restaurantAddress: string;
  clientAddress: string;
  totalCents: number;
  deliveryFeeCents: number;
  distanceKm: number;
}

// ── Offre ─────────────────────────────────────────────────────────────────────

export type OfferType = 'PROMO' | 'POINTS' | 'FLASH';

export interface Offer {
  id: string;
  restaurantId: string;
  title: string;
  description?: string;
  type: OfferType;
  discountPct?: number;
  pointsCost?: number;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  imageUrl?: string;
}

// ── Avis ──────────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  userId: string;
  restaurantId: string;
  rating: number;
  comment?: string;
  ownerReply?: string;
  repliedAt?: string;
  user?: Pick<AuthUser, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
  createdAt: string;
}

// ── Wallet ────────────────────────────────────────────────────────────────────

export interface PointTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
