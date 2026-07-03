import { useQuery } from '@tanstack/react-query';

// Routing réel (rues, trafic moyen estimé par OSRM) — remplace la ligne droite
// Serveur démo public OSRM, gratuit, sans clé API

export interface RouteResult {
  coords: [number, number][]; // [lat, lng] — pour react-leaflet
  durationSec: number;
  distanceM: number;
}

// Arrondi à ~11m de précision : évite de refetch à chaque micro-mouvement GPS
function round(n: number) {
  return Math.round(n * 10000) / 10000;
}

export function useOsrmRoute(
  from?: { lat: number; lng: number } | null,
  to?: { lat: number; lng: number } | null,
  enabled = true,
) {
  const fromLat = from ? round(from.lat) : null;
  const fromLng = from ? round(from.lng) : null;
  const toLat   = to   ? round(to.lat)   : null;
  const toLng   = to   ? round(to.lng)   : null;

  return useQuery<RouteResult | null>({
    queryKey: ['osrm-route', fromLat, fromLng, toLat, toLng],
    queryFn: async () => {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const route = data?.routes?.[0];
      if (!route) return null;
      return {
        coords: (route.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng] as [number, number]),
        durationSec: route.duration,
        distanceM: route.distance,
      };
    },
    enabled: enabled && fromLat != null && fromLng != null && toLat != null && toLng != null,
    staleTime: 15000,
    retry: 1,
  });
}

export function formatEta(durationSec: number) {
  const min = Math.max(1, Math.round(durationSec / 60));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
}

export function formatDistance(distanceM: number) {
  return distanceM < 1000 ? `${Math.round(distanceM)} m` : `${(distanceM / 1000).toFixed(1)} km`;
}
