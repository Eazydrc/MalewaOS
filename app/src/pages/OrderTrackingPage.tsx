import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Phone, MapPin, Clock, ArrowLeft, Package, CheckCircle, Truck } from 'lucide-react';
import { useOrderTracking } from '@/hooks/useDelivery';

// ── Fix icônes Leaflet ────────────────────────────────────────────────────────
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

// ── Auto-centrer sur le livreur ───────────────────────────────────────────────
function FlyToDriver({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 1 }); }, [lat, lng, map]);
  return null;
}

// ── Étapes de progression ─────────────────────────────────────────────────────
const STEPS = [
  { status: ['PENDING'],                 label: 'Commande reçue',  icon: <Clock className="w-4 h-4" /> },
  { status: ['ACCEPTED', 'PREPARING'],   label: 'Préparation',     icon: <Package className="w-4 h-4" /> },
  { status: ['PACKAGING'],               label: 'Prêt',            icon: <CheckCircle className="w-4 h-4" /> },
  { status: ['OUT_FOR_DELIVERY'],        label: 'En route',        icon: <Truck className="w-4 h-4" /> },
  { status: ['DELIVERED'],              label: 'Livré !',         icon: <CheckCircle className="w-4 h-4" /> },
];

function currentStepIndex(status: string) {
  return STEPS.findIndex(s => s.status.includes(status));
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: tracking, isLoading } = useOrderTracking(orderId ?? '', !!orderId);

  const hasDriver   = !!tracking?.driver;
  const hasDriverGPS = tracking?.driverLat && tracking?.driverLng;
  const hasClientGPS = tracking?.deliveryLat && tracking?.deliveryLng;
  const hasRestoGPS  = tracking?.restaurant.lat && tracking?.restaurant.lng;

  // Centre de la carte — priorité : livreur > client > resto > Kinshasa
  const mapCenter: [number, number] = hasDriverGPS
    ? [tracking.driverLat!, tracking.driverLng!]
    : hasClientGPS
      ? [tracking!.deliveryLat!, tracking!.deliveryLng!]
      : hasRestoGPS
        ? [tracking!.restaurant.lat!, tracking!.restaurant.lng!]
        : [-4.3217, 15.3222]; // Kinshasa center

  const isDelivered = tracking?.status === 'DELIVERED';
  const stepIdx     = tracking ? currentStepIndex(tracking.status) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl animate-bounce">🛵</div>
          <p className="text-text-2">Chargement du suivi...</p>
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-4xl">❓</p>
          <p className="text-text font-semibold">Commande introuvable</p>
          <button onClick={() => navigate('/commander')} className="text-accent text-sm underline">
            Voir mes commandes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-text-2 active:opacity-60">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-text truncate">{tracking.restaurant.name}</h1>
          <p className="text-xs text-text-3 truncate">Suivi de livraison</p>
        </div>
        {hasDriverGPS && (
          <span className="text-xs text-green-500 font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Carte — prend 50% de l'écran */}
      <div className="relative" style={{ height: '50vh' }}>
        <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />

          {/* Fly to driver en temps réel */}
          {hasDriverGPS && (
            <FlyToDriver lat={tracking.driverLat!} lng={tracking.driverLng!} />
          )}

          {/* Marqueur livreur */}
          {hasDriverGPS && (
            <Marker position={[tracking.driverLat!, tracking.driverLng!]} icon={DRIVER_ICON}>
              <Popup>
                🛵 {tracking.driver?.firstName} {tracking.driver?.lastName}
                {tracking.driverLastSeen && (
                  <><br /><small>Mis à jour {new Date(tracking.driverLastSeen).toLocaleTimeString('fr-CD')}</small></>
                )}
              </Popup>
            </Marker>
          )}

          {/* Marqueur restaurant */}
          {hasRestoGPS && (
            <Marker position={[tracking.restaurant.lat!, tracking.restaurant.lng!]} icon={RESTO_ICON}>
              <Popup>🏪 {tracking.restaurant.name}</Popup>
            </Marker>
          )}

          {/* Marqueur client */}
          {hasClientGPS && (
            <Marker position={[tracking.deliveryLat!, tracking.deliveryLng!]} icon={CLIENT_ICON}>
              <Popup>🏠 Votre adresse</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Badge "En route" flottant */}
        {tracking.status === 'OUT_FOR_DELIVERY' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Livreur en route
          </div>
        )}
        {isDelivered && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-green-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
            ✅ Commande livrée !
          </div>
        )}
      </div>

      {/* Panneau infos — défile sous la carte */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Barre de progression */}
        <div className="card rounded-2xl p-4 bg-surface border border-border">
          <div className="flex items-center justify-between relative">
            {/* Ligne de fond */}
            <div className="absolute left-4 right-4 top-4 h-0.5 bg-border z-0" />
            {/* Ligne de progression */}
            <div
              className="absolute left-4 top-4 h-0.5 bg-accent z-0 transition-all duration-500"
              style={{ width: stepIdx > 0 ? `${(stepIdx / (STEPS.length - 1)) * (100 - 8)}%` : '0%' }}
            />

            {STEPS.map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  i <= stepIdx
                    ? 'bg-accent text-white'
                    : 'bg-surface-2 text-text-3 border border-border'
                }`}>
                  {step.icon}
                </div>
                <span className={`text-[10px] text-center leading-tight ${i <= stepIdx ? 'text-accent font-semibold' : 'text-text-3'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Infos livreur */}
        {hasDriver ? (
          <div className="card rounded-2xl p-4 bg-surface border border-border space-y-3">
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">Votre livreur</p>
            <div className="flex items-center gap-3">
              {tracking.driver!.avatarUrl
                ? <img src={tracking.driver!.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt="" />
                : <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-2xl">👤</div>
              }
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text">
                  {tracking.driver!.firstName} {tracking.driver!.lastName}
                </p>
                {!hasDriverGPS && (
                  <p className="text-xs text-text-3">Position GPS en attente...</p>
                )}
                {hasDriverGPS && tracking.driverLastSeen && (
                  <p className="text-xs text-green-500">
                    Mis à jour {new Date(tracking.driverLastSeen).toLocaleTimeString('fr-CD')}
                  </p>
                )}
              </div>
              {tracking.driver!.phone && (
                <a
                  href={`tel:${tracking.driver!.phone}`}
                  className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="card rounded-2xl p-4 bg-surface-2 border border-border text-center space-y-1">
            <p className="text-text-2 text-sm">Aucun livreur assigné pour l'instant</p>
            <p className="text-text-3 text-xs">Le restaurant assigne un livreur dès que la commande est prête</p>
          </div>
        )}

        {/* Adresse de livraison */}
        {tracking.deliveryAddress && (
          <div className="card rounded-2xl p-4 bg-surface border border-border space-y-2">
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">Adresse de livraison</p>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-text">{tracking.deliveryAddress}</p>
            </div>
          </div>
        )}

        {/* Commande livrée */}
        {isDelivered && (
          <div className="rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 text-center space-y-2">
            <p className="text-3xl">🎉</p>
            <p className="font-bold text-green-700 dark:text-green-400">Commande livrée !</p>
            <p className="text-sm text-green-600 dark:text-green-500">Bon appétit !</p>
            <button
              onClick={() => navigate('/commander')}
              className="mt-2 text-sm text-accent underline"
            >
              Voir mes commandes
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
