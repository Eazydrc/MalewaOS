import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { QRCodeSVG } from 'qrcode.react';
import { io, type Socket } from 'socket.io-client';
import {
  MapPin, Phone, Navigation, Clock, ChevronRight, User,
  AlertCircle, Package, Truck, CheckCircle2, Link2, ArrowRight,
  Star, TrendingUp, Calendar, BarChart3,
} from 'lucide-react';
import {
  useDriverOrders, useDriverScanPickup, useUpdateDriverLocation,
  useSetDriverAvailability, useAcceptDelivery,
  useDeliveryRequests, useClaimDelivery, useDriverStats,
  useDriverAffiliations, useJoinAffiliation, useLeaveAffiliation,
  type DriverOrder, type DeliveryRequest,
} from '@/hooks/useDelivery';
import { useAuthStore } from '@/store/auth.store';
import { BASE_URL } from '@/lib/api';

const SOCKET_ORIGIN = BASE_URL.replace(/\/api\/v\d+\/?$/, '');

// ── Helpers ────────────────────────────────────────────────────────────────────
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.8);
  } catch { /* silencieux */ }
}

const fmt      = (c: number) => `$${(c / 100).toFixed(2)}`;
const fmtWhole = (c: number) => `$${(c / 100).toFixed(0)}`;

// ── Leaflet ────────────────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
const mkIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34],
});
const DRIVER_ICON = mkIcon('blue');
const CLIENT_ICON = mkIcon('red');
const RESTO_ICON  = mkIcon('green');

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], map.getZoom()); }, [lat, lng, map]);
  return null;
}

function haversineKm(la1:number,lo1:number,la2:number,lo2:number) {
  const R=6371, dLa=(la2-la1)*Math.PI/180, dLo=(lo2-lo1)*Math.PI/180;
  const a=Math.sin(dLa/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLo/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

interface IncomingDelivery {
  orderId: string;
  restaurantName: string;
  restaurantLat?: number;
  restaurantLng?: number;
  deliveryAddress: string;
  deliveryFeeUsdCents?: number;
  driverEarningsCents?: number;
  clientName: string;
}

// ── Tab type ───────────────────────────────────────────────────────────────────
type Tab = 'courses' | 'active' | 'history' | 'affiliations' | 'stats';

// ── Popup livraison prioritaire ────────────────────────────────────────────────
function IncomingModal({ req, onAccept, onDismiss, accepting }: {
  req: IncomingDelivery; onAccept: ()=>void; onDismiss: ()=>void; accepting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-end" style={{background:'rgba(0,0,0,0.75)'}}>
      <div className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden shadow-2xl"
        style={{background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.08)'}}>
        {/* top accent */}
        <div className="h-1" style={{background:'linear-gradient(90deg,#06b6d4,#3b82f6,#8b5cf6)'}} />
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
              style={{background:'rgba(251,191,36,0.15)'}}>🛵</div>
            <div>
              <p className="font-black text-white text-base">Nouvelle livraison !</p>
              <p className="text-xs" style={{color:'#fbbf24'}}>Priorité — vous êtes proche</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-black" style={{color:'#22c55e'}}>{fmt(req.driverEarningsCents??0)}</p>
              <p className="text-[10px]" style={{color:'rgba(255,255,255,0.4)'}}>votre gain</p>
            </div>
          </div>

          <div className="rounded-2xl divide-y overflow-hidden" style={{background:'rgba(255,255,255,0.06)', borderColor:'rgba(255,255,255,0.08)'}}>
            <div className="flex items-center gap-3 px-4 py-3">
              <Package className="w-4 h-4 shrink-0" style={{color:'#60a5fa'}} />
              <span className="text-sm font-semibold text-white">{req.restaurantName}</span>
            </div>
            <div className="flex items-start gap-3 px-4 py-3">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{color:'#f87171'}} />
              <span className="text-sm" style={{color:'rgba(255,255,255,0.7)'}}>{req.deliveryAddress}</span>
            </div>
          </div>

          <div className="flex gap-3 pb-2">
            <button onClick={onDismiss}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold"
              style={{background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.5)'}}>
              Ignorer
            </button>
            <button onClick={onAccept} disabled={accepting}
              className="flex-[2] py-3.5 rounded-2xl text-sm font-black text-white disabled:opacity-50"
              style={{background:'linear-gradient(135deg,#22c55e,#16a34a)',boxShadow:'0 8px 20px rgba(34,197,94,0.35)'}}>
              {accepting ? '…' : '✅ Accepter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Carte course disponible ────────────────────────────────────────────────────
function CourseCard({ req, onClaim, claiming }: {
  req: DeliveryRequest; onClaim: ()=>void; claiming: boolean;
}) {
  const dist = req.restaurant.lat && req.restaurant.lng && req.deliveryLat && req.deliveryLng
    ? haversineKm(req.restaurant.lat, req.restaurant.lng, req.deliveryLat, req.deliveryLng) : null;

  const claimed = req.isClaimed && !req.isClaimedByMe;

  return (
    <div className={`rounded-2xl overflow-hidden transition-all ${claimed ? 'opacity-40' : ''}`}
      style={{background:'#fff', border:'1px solid #f0f0f0', boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {req.restaurant.imageUrl
          ? <img src={req.restaurant.imageUrl} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
          : <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg"
              style={{background:'#f5f5f5'}}>🏪</div>
        }
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{color:'#1a1a1a'}}>{req.restaurant.name}</p>
          <p className="text-xs truncate" style={{color:'#999'}}>{req.restaurant.address}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-black" style={{color:'#16a34a'}}>{fmt(req.driverEarningsCents)}</p>
          <p className="text-[10px]" style={{color:'#aaa'}}>votre gain</p>
        </div>
      </div>

      {/* Trajet */}
      <div className="mx-4 mb-3 rounded-xl p-3 space-y-2" style={{background:'#fafafa', border:'1px solid #f0f0f0'}}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{background:'#3b82f6'}} />
          <span className="text-xs flex-1 truncate" style={{color:'#555'}}>{req.restaurant.address}</span>
          {dist && <span className="text-[10px] font-bold shrink-0" style={{color:'#3b82f6'}}>{dist.toFixed(1)} km</span>}
        </div>
        <div className="ml-1 w-px h-3" style={{background:'#ddd', marginLeft:'3.5px'}} />
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{color:'#ef4444'}} />
          <span className="text-xs flex-1" style={{color:'#333'}}>{req.deliveryAddress}</span>
        </div>
      </div>

      {/* Action */}
      <div className="px-4 pb-4">
        {req.isClaimedByMe ? (
          <div className="rounded-xl p-3 text-center text-xs font-bold"
            style={{background:'rgba(59,130,246,0.08)', color:'#3b82f6'}}>
            ✅ Réservée — allez au restaurant
          </div>
        ) : claimed ? (
          <div className="rounded-xl p-3 text-center text-xs font-semibold" style={{color:'#aaa'}}>
            ⏳ Prise — disponible bientôt
          </div>
        ) : (
          <button onClick={onClaim} disabled={claiming}
            className="w-full py-3.5 rounded-xl text-white text-sm font-black disabled:opacity-50"
            style={{background:'linear-gradient(135deg,#1a1a2e,#16213e)', boxShadow:'0 4px 14px rgba(0,0,0,0.18)'}}>
            <span className="flex items-center justify-center gap-2">
              <Truck className="w-4 h-4" />Prendre cette course
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Carte en cours ─────────────────────────────────────────────────────────────
function ActiveCard({ order, driverPos }: { order: DriverOrder; driverPos: [number,number]|null }) {
  const [expanded, setExpanded]     = useState(false);
  const [scanCode, setScanCode]     = useState('');
  const [showScan, setShowScan]     = useState(false);
  const [scanResult, setScanResult] = useState<{deliveryCode:string}|null>(null);
  const scanPickup = useDriverScanPickup(order.id);

  const isPacking    = order.status === 'PACKAGING';
  const isDelivering = order.status === 'OUT_FOR_DELIVERY';
  const isWaiting    = order.status === 'DELIVERED' && !order.escrowReleased;
  const code         = scanResult?.deliveryCode ?? order.deliveryCode;

  const step = isPacking ? 0 : isDelivering ? 1 : 2;

  const openMaps = (lat:number, lng:number) =>
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');

  return (
    <div className="rounded-2xl overflow-hidden" style={{background:'#fff', boxShadow:'0 2px 16px rgba(0,0,0,0.08)', border:'1px solid #f0f0f0'}}>
      {/* Barre statut */}
      <div className="px-4 py-2.5 flex items-center justify-between"
        style={{background: isPacking ? '#fff7ed' : isDelivering ? '#eff6ff' : '#f0fdf4'}}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full animate-pulse ${isPacking?'bg-orange-500':isDelivering?'bg-blue-500':'bg-green-500'}`} />
          <span className="text-xs font-black" style={{color: isPacking?'#c2410c':isDelivering?'#1d4ed8':'#15803d'}}>
            {isPacking ? 'À récupérer' : isDelivering ? 'En livraison' : 'En attente client'}
          </span>
        </div>
        <span className="text-sm font-black" style={{color:'#16a34a'}}>{fmt(order.driverEarningsCents??0)}</span>
      </div>

      {/* Étapes */}
      <div className="px-4 py-3 flex items-center gap-0">
        {['Récupération','En route','Livré'].map((s,i) => (
          <div key={i} className="flex items-center" style={{flex: i<2 ? '1' : 'none'}}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black ${i<=step?'text-white':''}`}
              style={{background: i<=step ? (i<step?'#22c55e':'#3b82f6') : '#f0f0f0', color: i<=step?'#fff':'#ccc'}}>
              {i<step ? '✓' : i+1}
            </div>
            <span className="text-[9px] font-bold ml-1 mr-2 hidden sm:inline" style={{color: i<=step?'#333':'#bbb'}}>{s}</span>
            {i<2 && <div className="flex-1 h-px mx-1" style={{background: i<step?'#22c55e':'#eee'}} />}
          </div>
        ))}
      </div>

      {/* Restaurant */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-3">
          {order.restaurant.imageUrl
            ? <img src={order.restaurant.imageUrl} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
            : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0" style={{background:'#f5f5f5'}}>🏪</div>
          }
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{color:'#1a1a1a'}}>{order.restaurant.name}</p>
            <p className="text-xs truncate" style={{color:'#999'}}>{order.restaurant.address}</p>
          </div>
          <button onClick={() => setExpanded(e=>!e)} className="shrink-0 p-1.5 rounded-lg" style={{background:'#f5f5f5'}}>
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded?'rotate-90':''}`} style={{color:'#999'}} />
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pl-1 space-y-1">
            {order.items.map(it => (
              <div key={it.id} className="flex gap-2 text-xs" style={{color:'#555'}}>
                <span style={{color:'#3b82f6', fontWeight:700}}>{it.quantity}×</span>
                <span>{it.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Client */}
      <div className="mx-4 mb-3 rounded-xl overflow-hidden divide-y" style={{background:'#fafafa', borderColor:'#f0f0f0', border:'1px solid #f0f0f0'}}>
        <div className="flex items-center gap-2 px-3 py-2.5">
          <User className="w-3.5 h-3.5 shrink-0" style={{color:'#aaa'}} />
          <span className="text-sm font-semibold" style={{color:'#333'}}>{order.user.firstName} {order.user.lastName}</span>
        </div>
        {order.user.phone && (
          <a href={`tel:${order.user.phone}`} className="flex items-center gap-2 px-3 py-2.5" style={{color:'#3b82f6'}}>
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span className="text-sm font-semibold">{order.user.phone}</span>
          </a>
        )}
        {order.deliveryAddress && (
          <div className="flex items-start gap-2 px-3 py-2.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{color:'#ef4444'}} />
            <span className="text-xs" style={{color:'#555'}}>{order.deliveryAddress}</span>
          </div>
        )}
      </div>

      {/* Carte GPS */}
      {isDelivering && driverPos && (
        <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{height:180, border:'1px solid #f0f0f0'}}>
          <MapContainer center={driverPos} zoom={14} style={{height:'100%',width:'100%'}} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RecenterMap lat={driverPos[0]} lng={driverPos[1]} />
            <Marker position={driverPos} icon={DRIVER_ICON}><Popup>Vous</Popup></Marker>
            {order.restaurant.lat && order.restaurant.lng && (
              <Marker position={[order.restaurant.lat,order.restaurant.lng]} icon={RESTO_ICON}><Popup>{order.restaurant.name}</Popup></Marker>
            )}
            {order.deliveryLat && order.deliveryLng && (
              <Marker position={[order.deliveryLat,order.deliveryLng]} icon={CLIENT_ICON}><Popup>Client</Popup></Marker>
            )}
          </MapContainer>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 space-y-2.5">
        {isPacking && order.restaurant.lat && order.restaurant.lng && (
          <button onClick={() => openMaps(order.restaurant.lat!,order.restaurant.lng!)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
            style={{background:'#f5f5f5', color:'#333'}}>
            <Navigation className="w-4 h-4" style={{color:'#3b82f6'}} />Naviguer vers le restaurant
          </button>
        )}
        {isDelivering && order.deliveryLat && order.deliveryLng && (
          <button onClick={() => openMaps(order.deliveryLat!,order.deliveryLng!)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
            style={{background:'#eff6ff', color:'#1d4ed8'}}>
            <Navigation className="w-4 h-4" />Naviguer vers le client
          </button>
        )}

        {/* Scan restaurant */}
        {isPacking && !showScan && (
          <button onClick={() => setShowScan(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-sm font-black"
            style={{background:'linear-gradient(135deg,#f97316,#ea580c)', boxShadow:'0 4px 14px rgba(249,115,22,0.3)'}}>
            <Package className="w-4 h-4" />J'ai récupéré la commande
          </button>
        )}
        {isPacking && showScan && (
          <div className="rounded-2xl p-4 space-y-3" style={{background:'#fff7ed', border:'1px solid #fed7aa'}}>
            <p className="text-xs font-black text-center" style={{color:'#c2410c'}}>Code affiché par le restaurant</p>
            <input type="text" value={scanCode}
              onChange={e => setScanCode(e.target.value.replace(/\D/g,'').slice(0,6))}
              placeholder="000000" maxLength={6}
              className="w-full px-3 py-3 text-center text-2xl font-black tracking-[0.4em] rounded-xl outline-none"
              style={{border:'2px solid #f97316', background:'#fff', color:'#1a1a1a'}} />
            {scanPickup.error && <p className="text-xs text-center" style={{color:'#dc2626'}}>Code invalide</p>}
            <button
              onClick={() => scanPickup.mutate(scanCode, {
                onSuccess: (res:any) => { setScanResult(res); setShowScan(false); setScanCode(''); }
              })}
              disabled={scanCode.length < 6 || scanPickup.isPending}
              className="w-full py-3 rounded-xl text-white text-sm font-black disabled:opacity-50"
              style={{background:'#f97316'}}>
              {scanPickup.isPending ? 'Vérification…' : 'Confirmer'}
            </button>
          </div>
        )}

        {/* QR code client */}
        {(isDelivering || isWaiting) && code && (
          <div className="rounded-2xl p-4 text-center space-y-3" style={{background:'#f0fdf4', border:'1px solid #bbf7d0'}}>
            <p className="text-xs font-black uppercase tracking-widest" style={{color:'#15803d'}}>
              Montrez au client
            </p>
            <div className="flex justify-center">
              <div className="p-3 rounded-2xl" style={{background:'#fff', boxShadow:'0 4px 14px rgba(0,0,0,0.08)'}}>
                <QRCodeSVG value={code} size={140} level="M" />
              </div>
            </div>
            <p className="text-3xl font-black tracking-[0.3em]" style={{color:'#1a1a1a'}}>{code}</p>
            <p className="text-[10px]" style={{color:'#6b7280'}}>Le client scanne ou entre ce code pour confirmer</p>
          </div>
        )}

        {isWaiting && !code && (
          <div className="rounded-xl p-3 text-center" style={{background:'#fffbeb', border:'1px solid #fde68a'}}>
            <p className="text-xs font-bold" style={{color:'#b45309'}}>⏳ En attente de confirmation du client</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Historique ─────────────────────────────────────────────────────────────────
function HistoryTab() {
  const { data: stats } = useDriverStats();
  const list = stats?.today.deliveries ?? [];

  return (
    <div className="space-y-3">
      {list.length === 0 ? (
        <div className="pt-16 text-center space-y-3">
          <div className="text-5xl">📋</div>
          <p className="font-bold" style={{color:'#333'}}>Aucune livraison aujourd'hui</p>
          <p className="text-sm" style={{color:'#999'}}>Vos courses du jour apparaîtront ici</p>
        </div>
      ) : list.map(d => (
        <div key={d.id} className="rounded-2xl p-4 flex items-center gap-3"
          style={{background:'#fff', border:'1px solid #f0f0f0', boxShadow:'0 1px 8px rgba(0,0,0,0.05)'}}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{background:'#f0fdf4'}}>
            <CheckCircle2 className="w-5 h-5" style={{color:'#22c55e'}} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{color:'#1a1a1a'}}>{d.restaurant.name}</p>
            <p className="text-xs" style={{color:'#aaa'}}>
              {d.escrowReleasedAt
                ? new Date(d.escrowReleasedAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})
                : '—'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-black" style={{color:'#16a34a'}}>{fmt(d.driverEarningsCents)}</p>
            <p className="text-[10px]" style={{color:'#aaa'}}>gain</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Affiliations ───────────────────────────────────────────────────────────────
function AffiliationsTab() {
  const { data: affiliations = [] } = useDriverAffiliations();
  const joinAffiliation             = useJoinAffiliation();
  const leaveAffiliation            = useLeaveAffiliation();
  const [code, setCode]             = useState('');
  const [msg, setMsg]               = useState('');

  return (
    <div className="space-y-4">
      {/* Rejoindre */}
      <div className="rounded-2xl p-4 space-y-3"
        style={{background:'#fff', border:'1px solid #f0f0f0', boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:'#eff6ff'}}>
            <Link2 className="w-4 h-4" style={{color:'#3b82f6'}} />
          </div>
          <div>
            <p className="text-sm font-black" style={{color:'#1a1a1a'}}>S'affilier à un restaurant</p>
            <p className="text-xs" style={{color:'#aaa'}}>Apparaissez dans leur liste de livreurs</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0,12))}
            placeholder="CODE RESTAURANT"
            className="flex-1 px-3 py-2.5 text-sm font-mono tracking-widest rounded-xl outline-none"
            style={{background:'#f9f9f9', border:'1.5px solid #e5e7eb', color:'#1a1a1a'}} />
          <button
            onClick={async () => {
              try {
                const res = await joinAffiliation.mutateAsync(code.trim());
                setMsg(`✅ Affilié à ${(res as any).restaurantName}`);
                setCode('');
              } catch (e:any) {
                setMsg(`❌ ${e?.response?.data?.message ?? 'Code invalide'}`);
              }
            }}
            disabled={code.length < 4 || joinAffiliation.isPending}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-black disabled:opacity-40"
            style={{background:'#1a1a2e'}}>
            {joinAffiliation.isPending ? '…' : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
        {msg && <p className="text-xs text-center" style={{color:'#555'}}>{msg}</p>}
      </div>

      {/* Liste */}
      {affiliations.length === 0 ? (
        <div className="pt-8 text-center space-y-2">
          <div className="text-4xl">🤝</div>
          <p className="font-bold" style={{color:'#333'}}>Aucune affiliation</p>
          <p className="text-sm" style={{color:'#aaa'}}>Entrez un code restaurant ci-dessus</p>
        </div>
      ) : affiliations.map(a => (
        <div key={a.id} className="rounded-2xl p-4 flex items-center gap-3"
          style={{background:'#fff', border:'1px solid #f0f0f0', boxShadow:'0 1px 8px rgba(0,0,0,0.05)'}}>
          {a.restaurant.imageUrl
            ? <img src={a.restaurant.imageUrl} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
            : <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base" style={{background:'#f5f5f5'}}>🏪</div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{color:'#1a1a1a'}}>{a.restaurant.name}</p>
            <p className="text-xs truncate" style={{color:'#aaa'}}>{a.restaurant.address}</p>
          </div>
          <button onClick={() => leaveAffiliation.mutate(a.restaurantId)}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{background:'#fef2f2', color:'#dc2626'}}>
            Quitter
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────────
function StatsTab() {
  const { data: stats } = useDriverStats();
  const [period, setPeriod] = useState<'today'|'week'|'month'>('today');

  const periods = [
    { key: 'today' as const, label: "Aujourd'hui", icon: <Clock className="w-3.5 h-3.5" /> },
    { key: 'week'  as const, label: 'Cette semaine', icon: <Calendar className="w-3.5 h-3.5" /> },
    { key: 'month' as const, label: 'Ce mois',      icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  const data = stats ? (period === 'today' ? stats.today : period === 'week' ? (stats as any).week : stats.month) : null;

  return (
    <div className="space-y-4">
      {/* Sélecteur période */}
      <div className="flex gap-2">
        {periods.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-black transition-all"
            style={{
              background: period === p.key ? '#1a1a2e' : '#f5f5f5',
              color: period === p.key ? '#fff' : '#999',
              boxShadow: period === p.key ? '0 4px 12px rgba(26,26,46,0.25)' : 'none',
            }}>
            {p.icon}{p.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 text-center"
          style={{background:'#1a1a2e', boxShadow:'0 4px 20px rgba(26,26,46,0.2)'}}>
          <p className="text-3xl font-black text-white">{data?.count ?? '—'}</p>
          <p className="text-xs mt-1" style={{color:'rgba(255,255,255,0.5)'}}>Livraisons</p>
        </div>
        <div className="rounded-2xl p-4 text-center"
          style={{background:'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow:'0 4px 20px rgba(34,197,94,0.3)'}}>
          <p className="text-3xl font-black text-white">{data ? fmtWhole(data.earningsCents) : '—'}</p>
          <p className="text-xs mt-1" style={{color:'rgba(255,255,255,0.7)'}}>Gains</p>
        </div>
      </div>

      {/* Moyenne */}
      {data && data.count > 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{background:'#fff', border:'1px solid #f0f0f0', boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:'#fffbeb'}}>
            <TrendingUp className="w-5 h-5" style={{color:'#f59e0b'}} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{color:'#aaa'}}>Moyenne par livraison</p>
            <p className="text-lg font-black" style={{color:'#1a1a1a'}}>{fmt(Math.round(data.earningsCents / data.count))}</p>
          </div>
        </div>
      )}

      {/* Récentes (aujourd'hui seulement) */}
      {period === 'today' && stats && stats.today.deliveries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-wider px-1" style={{color:'#aaa'}}>Courses du jour</p>
          {stats.today.deliveries.map(d => (
            <div key={d.id} className="rounded-xl p-3 flex items-center gap-3"
              style={{background:'#fff', border:'1px solid #f0f0f0'}}>
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{color:'#22c55e'}} />
              <span className="flex-1 text-sm font-semibold truncate" style={{color:'#333'}}>{d.restaurant.name}</span>
              <span className="font-black shrink-0" style={{color:'#16a34a'}}>{fmt(d.driverEarningsCents)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function DriverDashboardPage() {
  const user = useAuthStore((s:any) => s.user);
  const { data: orders = [], isLoading: loadingOrders } = useDriverOrders();
  const { data: requests = [], isLoading: loadingReqs } = useDeliveryRequests();
  const { data: stats }                                 = useDriverStats();
  const claimDelivery  = useClaimDelivery();
  const updateLocation = useUpdateDriverLocation();
  const setAvailability = useSetDriverAvailability();
  const acceptDelivery  = useAcceptDelivery();

  const [tab, setTab]                 = useState<Tab>('courses');
  const [driverPos, setDriverPos]     = useState<[number,number]|null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [incoming, setIncoming]       = useState<IncomingDelivery|null>(null);

  const socketRef              = useRef<Socket|null>(null);
  const locationIntervalRef    = useRef<ReturnType<typeof setInterval>|null>(null);
  const availabilityIntervalRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const activeDelivery = orders.find(o => ['OUT_FOR_DELIVERY','PACKAGING'].includes(o.status));
  const pendingAck     = orders.find(o => o.status==='DELIVERED' && !o.escrowReleased);

  const todayCount    = stats?.today.count    ?? 0;
  const todayEarnings = stats?.today.earningsCents ?? 0;

  // Disponibilité GPS
  useEffect(() => {
    if (!isAvailable) {
      if (availabilityIntervalRef.current) clearInterval(availabilityIntervalRef.current);
      return;
    }
    const send = () => navigator.geolocation?.getCurrentPosition(p => {
      setDriverPos([p.coords.latitude, p.coords.longitude]);
      setAvailability.mutate({ isAvailable:true, lat:p.coords.latitude, lng:p.coords.longitude });
    }, undefined, { enableHighAccuracy:true, timeout:8000 });
    send();
    availabilityIntervalRef.current = setInterval(send, 20_000);
    return () => { if (availabilityIntervalRef.current) clearInterval(availabilityIntervalRef.current); };
  }, [isAvailable]);

  function toggleAvailability() {
    const next = !isAvailable;
    setIsAvailable(next);
    if (!next) setAvailability.mutate({ isAvailable:false });
  }

  // WebSocket
  useEffect(() => {
    const socket = io(`${SOCKET_ORIGIN}/orders`, { withCredentials:true, transports:['websocket','polling'] });
    socketRef.current = socket;
    socket.on('delivery:request', (p:IncomingDelivery) => { setIncoming(p); playBeep(); });
    socket.on('delivery:taken', ({ orderId }:{orderId:string}) => {
      setIncoming(prev => prev?.orderId===orderId ? null : prev);
    });
    return () => { socket.disconnect(); };
  }, []);

  // GPS tracking
  useEffect(() => {
    if (!activeDelivery) {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      return;
    }
    const send = () => navigator.geolocation?.getCurrentPosition(p => {
      setDriverPos([p.coords.latitude, p.coords.longitude]);
      updateLocation.mutate({ orderId:activeDelivery.id, lat:p.coords.latitude, lng:p.coords.longitude });
    }, undefined, { enableHighAccuracy:true, timeout:8000 });
    send();
    locationIntervalRef.current = setInterval(send, 10_000);
    return () => { if (locationIntervalRef.current) clearInterval(locationIntervalRef.current); };
  }, [activeDelivery?.id]);

  useEffect(() => {
    if (!driverPos && navigator.geolocation)
      navigator.geolocation.getCurrentPosition(p => setDriverPos([p.coords.latitude, p.coords.longitude]));
  }, []);

  useEffect(() => {
    if (activeDelivery || pendingAck) setTab('active');
  }, [activeDelivery?.id, pendingAck?.id]);

  const availableCount = requests.filter(r=>!r.isClaimed&&!r.isClaimedByMe).length;
  const activeBadge    = (activeDelivery?1:0)+(pendingAck?1:0);

  const TABS: { key:Tab; label:string; icon:string; badge?:number }[] = [
    { key:'courses',      label:'Courses',    icon:'🛵', badge:availableCount },
    { key:'active',       label:'En cours',   icon:'📦', badge:activeBadge },
    { key:'history',      label:'Historique', icon:'🕐' },
    { key:'affiliations', label:'Affiliés',   icon:'🤝' },
    { key:'stats',        label:'Stats',      icon:'📊' },
  ];

  return (
    <div className="min-h-screen pb-36" style={{background:'#f7f8fa'}}>

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden px-4 pt-8 pb-6"
        style={{background:'linear-gradient(145deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)'}}>

        {/* Cercles décoratifs */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
          style={{background:'radial-gradient(circle,#60a5fa,transparent)', transform:'translate(20%,-20%)'}} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
          style={{background:'radial-gradient(circle,#818cf8,transparent)', transform:'translate(-20%,30%)'}} />

        {/* Profil + toggle */}
        <div className="relative flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{background:'rgba(255,255,255,0.12)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.15)'}}>
              🛵
            </div>
            <div>
              <p className="font-black text-white text-base leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${driverPos?'bg-green-400 animate-pulse':'bg-gray-500'}`} />
                <span className="text-xs" style={{color:'rgba(255,255,255,0.45)'}}>
                  {driverPos ? 'GPS actif' : 'GPS inactif'}
                </span>
              </div>
            </div>
          </div>

          <button onClick={toggleAvailability}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black transition-all"
            style={{
              background: isAvailable ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)',
              border: isAvailable ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.1)',
              color: isAvailable ? '#4ade80' : 'rgba(255,255,255,0.4)',
            }}>
            <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
            {isAvailable ? 'En ligne' : 'Hors ligne'}
          </button>
        </div>

        {/* Stats du jour */}
        <div className="relative grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4"
            style={{background:'rgba(255,255,255,0.08)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)'}}>
            <p className="text-3xl font-black text-white">{todayCount}</p>
            <p className="text-xs mt-1" style={{color:'rgba(255,255,255,0.45)'}}>Courses aujourd'hui</p>
          </div>
          <div className="rounded-2xl p-4"
            style={{background:'rgba(34,197,94,0.15)', backdropFilter:'blur(10px)', border:'1px solid rgba(34,197,94,0.25)'}}>
            <p className="text-3xl font-black" style={{color:'#4ade80'}}>{fmtWhole(todayEarnings)}</p>
            <p className="text-xs mt-1" style={{color:'rgba(255,255,255,0.45)'}}>Gains aujourd'hui</p>
          </div>
        </div>
      </div>

      {/* GPS warning */}
      {!driverPos && activeDelivery && (
        <div className="mx-4 mt-4 rounded-xl p-3 flex items-start gap-2"
          style={{background:'#fffbeb', border:'1px solid #fde68a'}}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{color:'#f59e0b'}} />
          <p className="text-xs" style={{color:'#92400e'}}>Autorisez la géolocalisation pour que le client puisse vous suivre.</p>
        </div>
      )}

      {/* ── ONGLETS ── */}
      <div className="px-4 mt-4">
        <div className="flex gap-1.5 p-1.5 rounded-2xl" style={{background:'#fff', boxShadow:'0 2px 12px rgba(0,0,0,0.07)'}}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="relative flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-[9px] font-black transition-all"
              style={{
                background: tab===t.key ? '#1a1a2e' : 'transparent',
                color: tab===t.key ? '#fff' : '#bbb',
                boxShadow: tab===t.key ? '0 4px 12px rgba(26,26,46,0.3)' : 'none',
              }}>
              <span className="text-base">{t.icon}</span>
              {t.label}
              {(t.badge??0) > 0 && (
                <span className="absolute -top-1 -right-0.5 w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center"
                  style={{
                    background: tab===t.key ? '#22c55e' : '#1a1a2e',
                    color: '#fff',
                  }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div className="px-4 mt-4 space-y-3">

        {/* Courses */}
        {tab === 'courses' && (
          !isAvailable ? (
            <div className="rounded-2xl p-8 text-center space-y-4"
              style={{background:'#fff', border:'1px solid #f0f0f0', boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto" style={{background:'#f5f5f5'}}>🔴</div>
              <div>
                <p className="font-black text-base" style={{color:'#1a1a1a'}}>Vous êtes hors ligne</p>
                <p className="text-sm mt-1" style={{color:'#aaa'}}>Activez votre disponibilité pour recevoir des courses</p>
              </div>
              <button onClick={toggleAvailability}
                className="px-8 py-3.5 rounded-xl text-white text-sm font-black"
                style={{background:'linear-gradient(135deg,#1a1a2e,#16213e)', boxShadow:'0 4px 14px rgba(26,26,46,0.3)'}}>
                Me mettre en ligne
              </button>
            </div>
          ) : loadingReqs ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-52 rounded-2xl animate-pulse" style={{background:'#e5e7eb'}} />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl p-10 text-center space-y-3"
              style={{background:'#fff', border:'1px solid #f0f0f0'}}>
              <div className="text-4xl">🏍️</div>
              <p className="font-black" style={{color:'#1a1a1a'}}>En attente de courses</p>
              <p className="text-sm" style={{color:'#aaa'}}>Actualisation automatique toutes les 10 s</p>
            </div>
          ) : requests.map(req => (
            <CourseCard key={req.id} req={req}
              claiming={claimDelivery.isPending}
              onClaim={() => claimDelivery.mutate(req.id)} />
          ))
        )}

        {/* En cours */}
        {tab === 'active' && (
          loadingOrders ? (
            <div className="h-52 rounded-2xl animate-pulse" style={{background:'#e5e7eb'}} />
          ) : orders.filter(o=>['PACKAGING','OUT_FOR_DELIVERY','DELIVERED'].includes(o.status)).length === 0 ? (
            <div className="rounded-2xl p-10 text-center space-y-3"
              style={{background:'#fff', border:'1px solid #f0f0f0'}}>
              <div className="text-4xl">✅</div>
              <p className="font-black" style={{color:'#1a1a1a'}}>Aucune livraison en cours</p>
              <p className="text-sm" style={{color:'#aaa'}}>Allez dans "Courses" pour choisir une demande</p>
            </div>
          ) : orders.filter(o=>['PACKAGING','OUT_FOR_DELIVERY','DELIVERED'].includes(o.status))
              .map(o => <ActiveCard key={o.id} order={o} driverPos={driverPos} />)
        )}

        {/* Historique */}
        {tab === 'history' && <HistoryTab />}

        {/* Affiliations */}
        {tab === 'affiliations' && <AffiliationsTab />}

        {/* Stats */}
        {tab === 'stats' && <StatsTab />}
      </div>

      {/* Popup prioritaire */}
      {incoming && (
        <IncomingModal
          req={incoming}
          accepting={acceptDelivery.isPending}
          onDismiss={() => setIncoming(null)}
          onAccept={() => acceptDelivery.mutate(incoming.orderId, {
            onSuccess: () => { setIncoming(null); setTab('active'); },
            onError:   () => setIncoming(null),
          })}
        />
      )}
    </div>
  );
}
