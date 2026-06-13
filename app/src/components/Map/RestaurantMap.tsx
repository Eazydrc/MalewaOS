// npm install leaflet react-leaflet @types/leaflet
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MapRestaurant {
  id: string;
  name: string;
  lat: number;
  lng: number;
  cuisine: string;
  restaurantType: 'SUR_PLACE' | 'LIVRAISON' | 'LES_DEUX';
  isOpen: boolean;
  rating?: number;
  imageUrl?: string;
  subscription: string;
}

interface Props {
  restaurants: MapRestaurant[];
  userLocation?: { lat: number; lng: number };
}

// ── Icônes custom ─────────────────────────────────────────────────────────────

function makeIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      transform:rotate(-45deg);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

const ICONS = {
  user:      makeIcon('#3B82F6'),  // bleu
  SUR_PLACE: makeIcon('#F97316'),  // orange
  LIVRAISON: makeIcon('#8B5CF6'),  // violet
  LES_DEUX:  makeIcon('#22C55E'),  // vert
};

// ── Centrage auto ─────────────────────────────────────────────────────────────

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { animate: true, duration: 1 });
  }, [lat, lng, map]);
  return null;
}

// ── Composant principal ───────────────────────────────────────────────────────

const KINSHASA = { lat: -4.3217, lng: 15.3222 };

export default function RestaurantMap({ restaurants, userLocation }: Props) {
  return (
    <MapContainer
      center={[KINSHASA.lat, KINSHASA.lng]}
      zoom={13}
      style={{ width: '100%', height: '100%', minHeight: 300 }}
      className="rounded-xl z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* Marker position utilisateur */}
      {userLocation && (
        <>
          <FlyTo lat={userLocation.lat} lng={userLocation.lng} />
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={ICONS.user}
          >
            <Popup>
              <span className="text-sm font-bold">Ma position</span>
            </Popup>
          </Marker>
        </>
      )}

      {/* Markers restaurants */}
      {restaurants.map((r) => (
        <Marker
          key={r.id}
          position={[r.lat, r.lng]}
          icon={ICONS[r.restaurantType] ?? ICONS.SUR_PLACE}
        >
          <Popup>
            <div style={{ minWidth: 160 }}>
              {r.imageUrl && (
                <img
                  src={r.imageUrl}
                  alt={r.name}
                  style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }}
                />
              )}
              <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{r.name}</p>
              <p style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{r.cuisine}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{
                  padding: '2px 7px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                  background: r.isOpen ? '#dcfce7' : '#fee2e2',
                  color: r.isOpen ? '#16a34a' : '#dc2626',
                }}>
                  {r.isOpen ? 'Ouvert' : 'Fermé'}
                </span>
                {r.rating && (
                  <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                    ★ {r.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <a
                href={`/restaurant/${r.id}`}
                style={{
                  display: 'block', textAlign: 'center', padding: '5px 0',
                  background: '#E85D26', color: 'white', borderRadius: 6,
                  fontSize: 11, fontWeight: 700, textDecoration: 'none',
                }}
              >
                Voir le profil →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
