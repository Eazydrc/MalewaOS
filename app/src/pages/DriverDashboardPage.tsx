import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io, type Socket } from 'socket.io-client';
import {
  Package, MapPin, Phone, CheckCircle, Navigation,
  Clock, ChevronRight, User, AlertCircle,
} from 'lucide-react';
import {
  useDriverOrders, useDriverPickup, useDriverDeliver,
  useUpdateDriverLocation, useSetDriverAvailability, useAcceptDelivery,
  type DriverOrder,
} from '@/hooks/useDelivery';
import { useAuthStore } from '@/store/auth.store';
import { BASE_URL } from '@/lib/api';

const SOCKET_ORIGIN = BASE_URL.replace(/\/api\/v\d+\/?$/, '');

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch { /* autoplay bloqué — silencieux */ }
}

interface DeliveryRequest {
  orderId: string;
  restaurantName: string;
  restaurantLat?: number;
  restaurantLng?: number;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  totalCents: number;
  clientName: string;
}

// ── Fix icônes Leaflet en Vite ────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DRIVER_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const CLIENT_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const RESTO_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

// ── Composant qui centre la carte sur la position du driver ───────────────────
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], map.getZoom()); }, [lat, lng, map]);
  return null;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const fmt = (cents: number) => `${(cents / 100).toFixed(2)} $`;

const STATUS_LABEL: Record<string, string> = {
  PACKAGING:        '📦 Prêt à récupérer',
  OUT_FOR_DELIVERY: '🛵 En livraison',
};

// ── Requête de livraison entrante (façon Yango) ────────────────────────────────

function IncomingRequestModal({ request, onAccept, onDismiss, accepting }: {
  request: DeliveryRequest;
  onAccept: () => void;
  onDismiss: () => void;
  accepting: boolean;
}) {
  const [secondsLeft, setSecondsLeft] = useState(20);

  useEffect(() => {
    setSecondsLeft(20);
    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(interval); onDismiss(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [request.orderId]);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm bg-bg rounded-3xl shadow-2xl p-5 space-y-4 animate-scale-in">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-accent">🛵 Nouvelle livraison disponible</p>
          <div className="w-9 h-9 rounded-full border-2 border-accent flex items-center justify-center text-xs font-black text-accent">
            {secondsLeft}
          </div>
        </div>

        <div className="rounded-2xl bg-surface-2 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <Package className="w-4 h-4 text-accent shrink-0" />
            {request.restaurantName}
          </div>
          <div className="flex items-start gap-2 text-sm text-text-2">
            <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            {request.deliveryAddress}
          </div>
          <div className="flex items-center gap-2 text-sm text-text-2">
            <User className="w-4 h-4 text-text-3 shrink-0" />
            {request.clientName}
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-text-3">Montant commande</span>
          <span className="text-base font-black text-text">{fmt(request.totalCents)}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-surface-2 text-text-2"
          >
            Ignorer
          </button>
          <button
            onClick={onAccept}
            disabled={accepting}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-accent text-white disabled:opacity-50"
          >
            {accepting ? '...' : 'Accepter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Carte de livraison active ─────────────────────────────────────────────────
function ActiveDeliveryMap({
  order, driverPos,
}: {
  order: DriverOrder;
  driverPos: [number, number] | null;
}) {
  const hasRestaurant = order.restaurant.lat && order.restaurant.lng;
  const hasClient     = order.deliveryLat && order.deliveryLng;
  const center: [number, number] = driverPos
    ?? (hasRestaurant ? [order.restaurant.lat!, order.restaurant.lng!] : [-4.3217, 15.3222]);

  return (
    <div className="rounded-2xl overflow-hidden border border-border h-64 w-full">
      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        {/* Driver */}
        {driverPos && (
          <>
            <RecenterMap lat={driverPos[0]} lng={driverPos[1]} />
            <Marker position={driverPos} icon={DRIVER_ICON}>
              <Popup>📍 Ma position</Popup>
            </Marker>
          </>
        )}

        {/* Restaurant */}
        {hasRestaurant && (
          <Marker position={[order.restaurant.lat!, order.restaurant.lng!]} icon={RESTO_ICON}>
            <Popup>🏪 {order.restaurant.name}</Popup>
          </Marker>
        )}

        {/* Client */}
        {hasClient && (
          <Marker position={[order.deliveryLat!, order.deliveryLng!]} icon={CLIENT_ICON}>
            <Popup>🏠 {order.user.firstName} {order.user.lastName}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

// ── Carte commande ────────────────────────────────────────────────────────────
function OrderCard({ order, driverPos }: { order: DriverOrder; driverPos: [number, number] | null }) {
  const [expanded, setExpanded] = useState(false);
  const pickup  = useDriverPickup(order.id);
  const deliver = useDriverDeliver(order.id);

  const isPackaging    = order.status === 'PACKAGING';
  const isOutDelivery  = order.status === 'OUT_FOR_DELIVERY';

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <div className="card rounded-2xl p-4 space-y-4 border border-border bg-surface">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {order.restaurant.imageUrl
            ? <img src={order.restaurant.imageUrl} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />
            : <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 text-xl">🏪</div>
          }
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{order.restaurant.name}</p>
            <p className="text-xs text-text-3 truncate">{order.restaurant.address}</p>
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              isPackaging ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
            }`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-text-3 mt-1">
          <ChevronRight className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Client info */}
      <div className="rounded-xl bg-surface-2 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-text">
          <User className="w-4 h-4 text-accent shrink-0" />
          <span className="font-medium">{order.user.firstName} {order.user.lastName}</span>
        </div>
        {order.user.phone && (
          <a href={`tel:${order.user.phone}`}
             className="flex items-center gap-2 text-sm text-accent active:opacity-70">
            <Phone className="w-4 h-4 shrink-0" />
            <span>{order.user.phone}</span>
          </a>
        )}
        {order.deliveryAddress && (
          <div className="flex items-start gap-2 text-sm text-text-2">
            <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{order.deliveryAddress}</span>
          </div>
        )}
      </div>

      {/* Articles (si expandé) */}
      {expanded && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">Articles</p>
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm text-text">
              <span>{item.quantity}× {item.name}</span>
              <span className="text-text-3">{fmt(item.priceUsdCents * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-1 flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>{fmt(order.totalCents)}</span>
          </div>
        </div>
      )}

      {/* Carte si en livraison */}
      {isOutDelivery && (
        <ActiveDeliveryMap order={order} driverPos={driverPos} />
      )}

      {/* Actions navigation */}
      <div className="grid grid-cols-2 gap-2">
        {/* Navigation vers restaurant (si packaging) */}
        {isPackaging && order.restaurant.lat && order.restaurant.lng && (
          <button
            onClick={() => openGoogleMaps(order.restaurant.lat!, order.restaurant.lng!)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-2 border border-border text-sm font-medium text-text active:scale-95"
          >
            <Navigation className="w-4 h-4 text-accent" />
            Aller au resto
          </button>
        )}

        {/* Navigation vers client (si en livraison) */}
        {isOutDelivery && order.deliveryLat && order.deliveryLng && (
          <button
            onClick={() => openGoogleMaps(order.deliveryLat!, order.deliveryLng!)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-2 border border-border text-sm font-medium text-text active:scale-95"
          >
            <Navigation className="w-4 h-4 text-accent" />
            Aller chez client
          </button>
        )}

        {/* CTA principal */}
        {isPackaging && (
          <button
            onClick={() => pickup.mutate()}
            disabled={pickup.isPending}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-orange-500 text-white text-sm font-semibold active:scale-95 disabled:opacity-60 col-span-1"
          >
            <Package className="w-4 h-4" />
            {pickup.isPending ? 'Confirmation...' : 'Récupéré !'}
          </button>
        )}

        {isOutDelivery && (
          <button
            onClick={() => deliver.mutate()}
            disabled={deliver.isPending}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-green-500 text-white text-sm font-semibold active:scale-95 disabled:opacity-60 col-span-1"
          >
            <CheckCircle className="w-4 h-4" />
            {deliver.isPending ? 'Confirmation...' : 'Livré !'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function DriverDashboardPage() {
  const user = useAuthStore((s: any) => s.user);
  const { data: orders = [], isLoading, error } = useDriverOrders();
  const updateLocation = useUpdateDriverLocation();

  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Disponibilité pour recevoir des requêtes de livraison ─────────────────
  const [isAvailable, setIsAvailable] = useState(false);
  const setAvailability = useSetDriverAvailability();
  const availabilityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Requête de livraison entrante (Yango) ──────────────────────────────────
  const [incomingRequest, setIncomingRequest] = useState<DeliveryRequest | null>(null);
  const acceptDelivery = useAcceptDelivery();
  const socketRef = useRef<Socket | null>(null);

  // Ordre actif = commande OUT_FOR_DELIVERY
  const activeDelivery = orders.find(o => o.status === 'OUT_FOR_DELIVERY');

  // ── Toggle disponibilité : envoie la position toutes les 20s tant qu'actif ─
  useEffect(() => {
    if (!isAvailable) {
      if (availabilityIntervalRef.current) {
        clearInterval(availabilityIntervalRef.current);
        availabilityIntervalRef.current = null;
      }
      return;
    }

    const sendAvailability = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
        setDriverPos([pos.coords.latitude, pos.coords.longitude]);
        setAvailability.mutate({ isAvailable: true, lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, undefined, { enableHighAccuracy: true, timeout: 8000 });
    };

    sendAvailability();
    availabilityIntervalRef.current = setInterval(sendAvailability, 20_000);
    return () => {
      if (availabilityIntervalRef.current) clearInterval(availabilityIntervalRef.current);
    };
  }, [isAvailable]);

  function toggleAvailability() {
    const next = !isAvailable;
    setIsAvailable(next);
    if (!next) setAvailability.mutate({ isAvailable: false });
  }

  // ── Connexion WebSocket — requêtes de livraison entrantes ──────────────────
  useEffect(() => {
    const socket = io(`${SOCKET_ORIGIN}/orders`, { withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('delivery:request', (payload: DeliveryRequest) => {
      setIncomingRequest(payload);
      playBeep();
    });

    socket.on('delivery:taken', ({ orderId }: { orderId: string }) => {
      setIncomingRequest(prev => (prev?.orderId === orderId ? null : prev));
    });

    return () => { socket.disconnect(); };
  }, []);

  // ── GPS : envoyer position toutes les 10s si livraison active ────────────
  useEffect(() => {
    if (!activeDelivery) {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      return;
    }

    const sendPos = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDriverPos([lat, lng]);
        updateLocation.mutate({ orderId: activeDelivery.id, lat, lng });
      }, undefined, { enableHighAccuracy: true, timeout: 8000 });
    };

    sendPos(); // Immédiat
    locationIntervalRef.current = setInterval(sendPos, 10_000);
    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, [activeDelivery?.id]);

  // ── Récupérer position initiale pour affichage ────────────────────────────
  useEffect(() => {
    if (!driverPos && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setDriverPos([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-xl shrink-0">
              🛵
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-text truncate">Espace Livreur</h1>
              <p className="text-xs text-text-3 truncate">
                {user?.firstName} {user?.lastName}
                {driverPos && (
                  <span className="ml-2 text-green-500">● GPS actif</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={toggleAvailability}
            className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              isAvailable ? 'bg-green-500 text-white' : 'bg-surface-2 text-text-2'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-white animate-pulse' : 'bg-text-3'}`} />
            {isAvailable ? 'Disponible' : 'Hors ligne'}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Bannière GPS si pas de position */}
        {!driverPos && activeDelivery && (
          <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">GPS requis</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Autorisez la géolocalisation pour que le client puisse suivre votre position.
              </p>
            </div>
          </div>
        )}

        {/* Chargement */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-surface-2 animate-pulse" />
            ))}
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="text-center py-12 space-y-2">
            <p className="text-2xl">⚠️</p>
            <p className="text-text-2 text-sm">Impossible de charger les commandes</p>
          </div>
        )}

        {/* Aucune commande */}
        {!isLoading && !error && orders.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="text-6xl">🛵</div>
            <div>
              <p className="font-semibold text-text text-lg">Aucune livraison en cours</p>
              <p className="text-text-3 text-sm mt-1">
                Les commandes assignées apparaîtront ici
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-text-3">
              <Clock className="w-3.5 h-3.5" />
              <span>Actualisation automatique toutes les 15s</span>
            </div>
          </div>
        )}

        {/* Commandes */}
        {orders.map(order => (
          <OrderCard key={order.id} order={order} driverPos={driverPos} />
        ))}
      </div>

      {incomingRequest && (
        <IncomingRequestModal
          request={incomingRequest}
          accepting={acceptDelivery.isPending}
          onDismiss={() => setIncomingRequest(null)}
          onAccept={() => {
            acceptDelivery.mutate(incomingRequest.orderId, {
              onSuccess: () => setIncomingRequest(null),
              onError: () => setIncomingRequest(null),
            });
          }}
        />
      )}
    </div>
  );
}
