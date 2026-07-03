import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { QRCodeSVG } from 'qrcode.react';
import { io, type Socket } from 'socket.io-client';
import {
  MapPin, Phone, Navigation, Clock, ChevronRight, User,
  AlertCircle, Package, Truck, CheckCircle2, Link2, ArrowRight,
  TrendingUp, Calendar, BarChart3,
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

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[11px] font-black uppercase tracking-widest text-text-3">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black text-white"
          style={{ background: 'rgb(var(--color-accent))' }}>{count}</span>
      )}
      <div className="flex-1 h-px" style={{ background: 'rgb(var(--color-border) / 0.12)' }} />
    </div>
  );
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

// ── Popup livraison prioritaire ────────────────────────────────────────────────
function IncomingModal({ req, onAccept, onDismiss, accepting }: {
  req: IncomingDelivery; onAccept: ()=>void; onDismiss: ()=>void; accepting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-end" style={{ background: 'rgba(0,0,0,0.80)' }}>
      <div className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden shadow-2xl"
        style={{ background: 'rgb(var(--color-surface))' }}>
        <div className="h-1" style={{ background: 'linear-gradient(90deg,#06b6d4,#3b82f6,#8b5cf6)' }} />
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(251,191,36,0.12)' }}>🛵</div>
            <div>
              <p className="font-black text-text text-base">Nouvelle livraison !</p>
              <p className="text-xs text-warning">Priorité — vous êtes proche</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-black text-success">{fmt(req.driverEarningsCents??0)}</p>
              <p className="text-[10px] text-text-3">votre gain</p>
            </div>
          </div>

          <div className="rounded-2xl divide-y overflow-hidden"
            style={{ background: 'rgb(var(--color-surface-2))'}}>
            <div className="flex items-center gap-3 px-4 py-3">
              <Package className="w-4 h-4 shrink-0 text-blue-400" />
              <span className="text-sm font-semibold text-text">{req.restaurantName}</span>
            </div>
            <div className="flex items-start gap-3 px-4 py-3">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
              <span className="text-sm text-text-2">{req.deliveryAddress}</span>
            </div>
          </div>

          <div className="flex gap-3 pb-2">
            <button onClick={onDismiss}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-text-3"
              style={{ background: 'rgb(var(--color-surface-2))' }}>
              Ignorer
            </button>
            <button onClick={onAccept} disabled={accepting}
              className="flex-[2] py-3.5 rounded-2xl text-sm font-black text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 8px 20px rgba(34,197,94,0.35)' }}>
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
      style={{ background: 'rgb(var(--color-surface))', boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {req.restaurant.imageUrl
          ? <img src={req.restaurant.imageUrl} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
          : <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg bg-surface-2">🏪</div>
        }
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate text-text">{req.restaurant.name}</p>
          <p className="text-xs truncate text-text-3">{req.restaurant.address}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-black text-success">{fmt(req.driverEarningsCents)}</p>
          <p className="text-[10px] text-text-3">votre gain</p>
        </div>
      </div>

      <div className="mx-4 mb-3 rounded-xl p-3 space-y-2 bg-surface-2"
        style={{ }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-xs flex-1 truncate text-text-2">{req.restaurant.address}</span>
          {dist && <span className="text-[10px] font-bold shrink-0 text-blue-400">{dist.toFixed(1)} km</span>}
        </div>
        <div className="ml-1 w-px h-3" style={{ background: 'rgb(var(--color-border) / 0.3)', marginLeft: '3.5px' }} />
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-danger" />
          <span className="text-xs flex-1 text-text">{req.deliveryAddress}</span>
        </div>
      </div>

      <div className="px-4 pb-4">
        {req.isClaimedByMe ? (
          <div className="rounded-xl p-3 text-center text-xs font-bold text-blue-400"
            style={{ background: 'rgba(59,130,246,0.08)' }}>
            ✅ Réservée — allez au restaurant
          </div>
        ) : claimed ? (
          <div className="rounded-xl p-3 text-center text-xs font-semibold text-text-3">
            ⏳ Prise — disponible bientôt
          </div>
        ) : (
          <button onClick={onClaim} disabled={claiming}
            className="w-full py-3.5 rounded-xl text-white text-sm font-black disabled:opacity-50"
            style={{ background: 'var(--btn-primary)', boxShadow: 'var(--shadow-btn)' }}>
            <span className="flex items-center justify-center gap-2">
              <Truck className="w-4 h-4" />Prendre cette course
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Carte livraison en cours ───────────────────────────────────────────────────
function ActiveCard({ order, driverPos }: { order: DriverOrder; driverPos: [number,number]|null }) {
  const [expanded, setExpanded]     = useState(false);
  const [scanCode, setScanCode]     = useState('');
  const [showScan, setShowScan]     = useState(false);
  const [scanResult, setScanResult] = useState<{ deliveryCode: string }|null>(null);
  const scanPickup = useDriverScanPickup(order.id);

  const isPacking    = order.status === 'PACKAGING';
  const isDelivering = order.status === 'OUT_FOR_DELIVERY';
  const isWaiting    = order.status === 'DELIVERED' && !order.escrowReleased;
  const code         = scanResult?.deliveryCode ?? order.deliveryCode;
  const step         = isPacking ? 0 : isDelivering ? 1 : 2;

  const openMaps = (lat:number, lng:number) =>
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');

  const statusBg = isPacking
    ? 'rgba(249,115,22,0.12)'
    : isDelivering
    ? 'rgba(59,130,246,0.12)'
    : 'rgba(34,197,94,0.12)';
  const statusColor = isPacking ? '#f97316' : isDelivering ? '#60a5fa' : '#4ade80';
  const statusLabel = isPacking ? 'À récupérer' : isDelivering ? 'En livraison' : 'En attente client';

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgb(var(--color-surface))', boxShadow: 'var(--shadow-card)' }}>
      {/* Barre statut */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: statusBg }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusColor }} />
          <span className="text-xs font-black" style={{ color: statusColor }}>{statusLabel}</span>
        </div>
        <span className="text-sm font-black text-success">{fmt(order.driverEarningsCents??0)}</span>
      </div>

      {/* Étapes */}
      <div className="px-4 py-3 flex items-center">
        {['Récupération','En route','Livré'].map((s,i) => (
          <div key={i} className="flex items-center" style={{ flex: i<2 ? '1' : 'none' }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-white"
              style={{ background: i<=step ? (i<step ? '#22c55e' : statusColor) : 'rgb(var(--color-surface-3))' }}>
              {i<step ? '✓' : i+1}
            </div>
            <span className="text-[9px] font-bold ml-1 mr-2 hidden sm:inline"
              style={{ color: i<=step ? 'rgb(var(--color-text-2))' : 'rgb(var(--color-text-3))' }}>{s}</span>
            {i<2 && <div className="flex-1 h-px mx-1"
              style={{ background: i<step ? '#22c55e' : 'rgb(var(--color-border) / 0.2)' }} />}
          </div>
        ))}
      </div>

      {/* Restaurant */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-3">
          {order.restaurant.imageUrl
            ? <img src={order.restaurant.imageUrl} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
            : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 bg-surface-2">🏪</div>
          }
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate text-text">{order.restaurant.name}</p>
            <p className="text-xs truncate text-text-3">{order.restaurant.address}</p>
          </div>
          <button onClick={() => setExpanded(e=>!e)} className="shrink-0 p-1.5 rounded-lg bg-surface-2">
            <ChevronRight className={`w-4 h-4 transition-transform text-text-3 ${expanded?'rotate-90':''}`} />
          </button>
        </div>
        {expanded && (
          <div className="mt-3 pl-1 space-y-1">
            {order.items.map(it => (
              <div key={it.id} className="flex gap-2 text-xs text-text-2">
                <span className="text-blue-400 font-bold">{it.quantity}×</span>
                <span>{it.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Client */}
      <div className="mx-4 mb-3 rounded-xl overflow-hidden divide-y bg-surface-2"
        style={{ borderColor: 'rgb(var(--color-border) / 0.08)' }}>
        <div className="flex items-center gap-2 px-3 py-2.5">
          <User className="w-3.5 h-3.5 shrink-0 text-text-3" />
          <span className="text-sm font-semibold text-text">{order.user.firstName} {order.user.lastName}</span>
        </div>
        {order.user.phone && (
          <a href={`tel:${order.user.phone}`} className="flex items-center gap-2 px-3 py-2.5 text-blue-400">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span className="text-sm font-semibold">{order.user.phone}</span>
          </a>
        )}
        {order.deliveryAddress && (
          <div className="flex items-start gap-2 px-3 py-2.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-danger" />
            <span className="text-xs text-text-2">{order.deliveryAddress}</span>
          </div>
        )}
      </div>

      {/* Carte GPS */}
      {isDelivering && driverPos && (
        <div className="mx-4 mb-3 rounded-2xl overflow-hidden"
          style={{ height: 180 }}>
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
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-surface-2 text-text">
            <Navigation className="w-4 h-4 text-blue-400" />Naviguer vers le restaurant
          </button>
        )}
        {isDelivering && order.deliveryLat && order.deliveryLng && (
          <button onClick={() => openMaps(order.deliveryLat!,order.deliveryLng!)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-blue-300"
            style={{ background: 'rgba(59,130,246,0.1)' }}>
            <Navigation className="w-4 h-4" />Naviguer vers le client
          </button>
        )}

        {isPacking && !showScan && (
          <button onClick={() => setShowScan(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-sm font-black"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 4px 14px rgba(249,115,22,0.3)' }}>
            <Package className="w-4 h-4" />J'ai récupéré la commande
          </button>
        )}
        {isPacking && showScan && (
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}>
            <p className="text-xs font-black text-center text-orange-400">Code affiché par le restaurant</p>
            <input type="text" value={scanCode}
              onChange={e => setScanCode(e.target.value.replace(/\D/g,'').slice(0,6))}
              placeholder="000000" maxLength={6}
              className="w-full px-3 py-3 text-center text-2xl font-black tracking-[0.4em] rounded-xl outline-none bg-surface text-text"
              style={{ border: '2px solid #f97316' }} />
            {scanPickup.error && <p className="text-xs text-center text-danger">Code invalide</p>}
            <button
              onClick={() => scanPickup.mutate(scanCode, {
                onSuccess: (res:any) => { setScanResult(res); setShowScan(false); setScanCode(''); }
              })}
              disabled={scanCode.length < 6 || scanPickup.isPending}
              className="w-full py-3 rounded-xl text-white text-sm font-black disabled:opacity-50"
              style={{ background: '#f97316' }}>
              {scanPickup.isPending ? 'Vérification…' : 'Confirmer'}
            </button>
          </div>
        )}

        {(isDelivering || isWaiting) && code && (
          <div className="rounded-2xl p-4 text-center space-y-3"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <p className="text-xs font-black uppercase tracking-widest text-success">Montrez au client</p>
            <div className="flex justify-center">
              <div className="p-3 rounded-2xl bg-white">
                <QRCodeSVG value={code} size={140} level="M" />
              </div>
            </div>
            <p className="text-3xl font-black tracking-[0.3em] text-text">{code}</p>
            <p className="text-[10px] text-text-3">Le client scanne ou entre ce code pour confirmer</p>
          </div>
        )}

        {isWaiting && !code && (
          <div className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <p className="text-xs font-bold text-warning">⏳ En attente de confirmation du client</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stats inline ───────────────────────────────────────────────────────────────
function StatsInline() {
  const { data: stats } = useDriverStats();
  const [period, setPeriod] = useState<'today'|'week'|'month'>('today');

  const periods = [
    { key: 'today' as const, label: "Auj.", icon: <Clock className="w-3 h-3" /> },
    { key: 'week'  as const, label: 'Semaine', icon: <Calendar className="w-3 h-3" /> },
    { key: 'month' as const, label: 'Mois', icon: <BarChart3 className="w-3 h-3" /> },
  ];
  const data = stats
    ? period === 'today' ? stats.today : period === 'week' ? (stats as any).week : stats.month
    : null;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgb(var(--color-surface))', boxShadow: 'var(--shadow-card)' }}>
      {/* Period selector — 3 boutons simples */}
      <div className="flex border-b" style={{ borderColor: 'rgb(var(--color-border) / 0.12)' }}>
        {periods.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors"
            style={{
              color: period === p.key ? 'rgb(var(--color-accent))' : 'rgb(var(--color-text-3))',
              borderBottom: period === p.key ? '2px solid rgb(var(--color-accent))' : '2px solid transparent',
            }}>
            {p.icon}{p.label}
          </button>
        ))}
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 text-center bg-surface-2">
          <p className="text-2xl font-black text-text">{data?.count ?? '—'}</p>
          <p className="text-[10px] text-text-3 mt-0.5">Livraisons</p>
        </div>
        <div className="rounded-xl p-3 text-center"
          style={{ background: 'rgba(34,197,94,0.1)' }}>
          <p className="text-2xl font-black text-success">{data ? fmtWhole(data.earningsCents) : '—'}</p>
          <p className="text-[10px] text-text-3 mt-0.5">Gains</p>
        </div>
      </div>

      {data && data.count > 0 && (
        <div className="px-4 pb-4">
          <div className="rounded-xl px-4 py-3 flex items-center gap-3 bg-surface-2">
            <TrendingUp className="w-4 h-4 text-warning shrink-0" />
            <div>
              <p className="text-[10px] text-text-3">Moyenne / livraison</p>
              <p className="text-sm font-black text-text">{fmt(Math.round(data.earningsCents / data.count))}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Affiliations inline ────────────────────────────────────────────────────────
function AffiliationsInline() {
  const { data: affiliations = [] } = useDriverAffiliations();
  const joinAffiliation             = useJoinAffiliation();
  const leaveAffiliation            = useLeaveAffiliation();
  const [code, setCode]             = useState('');
  const [msg, setMsg]               = useState('');

  return (
    <div className="space-y-3">
      {/* Rejoindre */}
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: 'rgb(var(--color-surface))', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(59,130,246,0.1)' }}>
            <Link2 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-black text-text">S'affilier à un restaurant</p>
            <p className="text-xs text-text-3">Apparaissez dans leur liste de livreurs</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0,12))}
            placeholder="CODE RESTAURANT"
            className="flex-1 px-3 py-2.5 text-sm font-mono tracking-widest rounded-xl outline-none bg-surface-2 text-text"
            style={{ border: 'none' }} />
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
            style={{ background: 'var(--btn-primary)' }}>
            {joinAffiliation.isPending ? '…' : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
        {msg && <p className="text-xs text-center text-text-2">{msg}</p>}
      </div>

      {affiliations.length > 0 && affiliations.map(a => (
        <div key={a.id} className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'rgb(var(--color-surface))' }}>
          {a.restaurant.imageUrl
            ? <img src={a.restaurant.imageUrl} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
            : <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base bg-surface-2">🏪</div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-text">{a.restaurant.name}</p>
            <p className="text-xs truncate text-text-3">{a.restaurant.address}</p>
          </div>
          <button onClick={() => leaveAffiliation.mutate(a.restaurantId)}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-danger"
            style={{ background: 'rgba(248,113,113,0.1)' }}>
            Quitter
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function DriverDashboardPage() {
  const user = useAuthStore((s:any) => s.user);
  const { data: orders = [], isLoading: loadingOrders } = useDriverOrders();
  const { data: requests = [], isLoading: loadingReqs } = useDeliveryRequests();
  const { data: stats }                                 = useDriverStats();
  const claimDelivery   = useClaimDelivery();
  const updateLocation  = useUpdateDriverLocation();
  const setAvailability = useSetDriverAvailability();
  const acceptDelivery  = useAcceptDelivery();

  const [driverPos, setDriverPos]     = useState<[number,number]|null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [incoming, setIncoming]       = useState<IncomingDelivery|null>(null);

  const socketRef               = useRef<Socket|null>(null);
  const locationIntervalRef     = useRef<ReturnType<typeof setInterval>|null>(null);
  const availabilityIntervalRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const activeOrders = orders.filter(o => ['OUT_FOR_DELIVERY','PACKAGING'].includes(o.status));
  const pendingAck   = orders.find(o => o.status==='DELIVERED' && !o.escrowReleased);
  const liveOrders   = [...activeOrders, ...(pendingAck ? [pendingAck] : [])];

  const todayCount    = stats?.today.count    ?? 0;
  const todayEarnings = stats?.today.earningsCents ?? 0;
  const availableCount = requests.filter(r=>!r.isClaimed&&!r.isClaimedByMe).length;

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
    socket.on('delivery:taken', ({ orderId }:{ orderId:string }) => {
      setIncoming(prev => prev?.orderId===orderId ? null : prev);
    });
    return () => { socket.disconnect(); };
  }, []);

  // GPS tracking livraison active
  useEffect(() => {
    const active = activeOrders[0];
    if (!active) {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      return;
    }
    const send = () => navigator.geolocation?.getCurrentPosition(p => {
      setDriverPos([p.coords.latitude, p.coords.longitude]);
      updateLocation.mutate({ orderId:active.id, lat:p.coords.latitude, lng:p.coords.longitude });
    }, undefined, { enableHighAccuracy:true, timeout:8000 });
    send();
    locationIntervalRef.current = setInterval(send, 10_000);
    return () => { if (locationIntervalRef.current) clearInterval(locationIntervalRef.current); };
  }, [activeOrders[0]?.id]);

  useEffect(() => {
    if (!driverPos && navigator.geolocation)
      navigator.geolocation.getCurrentPosition(p => setDriverPos([p.coords.latitude, p.coords.longitude]));
  }, []);

  return (
    <div className="min-h-screen pb-36 bg-bg">

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden px-4 pt-10 pb-6"
        style={{ background: 'linear-gradient(145deg, rgb(var(--color-surface)) 0%, rgb(var(--color-surface-2)) 100%)' }}>
        {/* Orbes décoratifs */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(232,93,38,0.08) 0%, transparent 70%)', transform: 'translate(20%,-20%)' }} />
        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)', transform: 'translate(-20%,30%)' }} />

        {/* Profil + toggle */}
        <div className="relative flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgb(var(--color-surface-3))' }}>
              🛵
            </div>
            <div>
              <p className="font-black text-text text-base leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${driverPos ? 'bg-success animate-pulse' : 'bg-text-3'}`} />
                <span className="text-xs text-text-3">{driverPos ? 'GPS actif' : 'GPS inactif'}</span>
              </div>
            </div>
          </div>

          {/* Toggle En ligne */}
          <button onClick={toggleAvailability}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black transition-all"
            style={{
              background: isAvailable ? 'rgba(74,222,128,0.12)' : 'rgb(var(--color-surface-3))',
              border: isAvailable ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgb(var(--color-border) / 0.15)',
              color: isAvailable ? 'rgb(var(--color-success))' : 'rgb(var(--color-text-3))',
            }}>
            <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-success animate-pulse' : 'bg-text-3'}`} />
            {isAvailable ? 'En ligne' : 'Hors ligne'}
          </button>
        </div>

        {/* Stats du jour */}
        <div className="relative grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background: 'rgb(var(--color-surface-3))' }}>
            <p className="text-3xl font-black text-text">{todayCount}</p>
            <p className="text-xs mt-1 text-text-3">Courses aujourd'hui</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.15)' }}>
            <p className="text-3xl font-black text-success">{fmtWhole(todayEarnings)}</p>
            <p className="text-xs mt-1 text-text-3">Gains aujourd'hui</p>
          </div>
        </div>
      </div>

      {/* GPS warning */}
      {!driverPos && liveOrders.length > 0 && (
        <div className="mx-4 mt-4 rounded-xl p-3 flex items-start gap-2"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-warning" />
          <p className="text-xs text-warning/80">Autorisez la géolocalisation pour que le client puisse vous suivre.</p>
        </div>
      )}

      {/* ── CONTENU VERTICAL ── */}
      <div className="px-4 mt-5 space-y-6">

        {/* ① Livraisons en cours (si existantes) */}
        {liveOrders.length > 0 && (
          <div>
            <SectionHeader label="En cours" count={liveOrders.length} />
            <div className="space-y-3">
              {liveOrders.map(o => <ActiveCard key={o.id} order={o} driverPos={driverPos} />)}
            </div>
          </div>
        )}

        {/* ② Courses disponibles */}
        <div>
          <SectionHeader label="Courses disponibles" count={availableCount} />
          {!isAvailable ? (
            <div className="rounded-2xl p-8 text-center space-y-4"
              style={{ background: 'rgb(var(--color-surface))' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto bg-surface-2">🔴</div>
              <div>
                <p className="font-black text-base text-text">Vous êtes hors ligne</p>
                <p className="text-sm mt-1 text-text-3">Activez votre disponibilité pour recevoir des courses</p>
              </div>
              <button onClick={toggleAvailability}
                className="px-8 py-3.5 rounded-xl text-white text-sm font-black"
                style={{ background: 'var(--btn-primary)', boxShadow: 'var(--shadow-btn)' }}>
                Me mettre en ligne
              </button>
            </div>
          ) : loadingReqs ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-52 rounded-2xl skeleton" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl p-10 text-center space-y-3"
              style={{ background: 'rgb(var(--color-surface))' }}>
              <div className="text-4xl">🏍️</div>
              <p className="font-black text-text">En attente de courses</p>
              <p className="text-sm text-text-3">Actualisation automatique toutes les 10 s</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <CourseCard key={req.id} req={req}
                  claiming={claimDelivery.isPending}
                  onClaim={() => claimDelivery.mutate(req.id)} />
              ))}
            </div>
          )}
        </div>

        {/* ③ Stats */}
        <div>
          <SectionHeader label="Mes statistiques" />
          <StatsInline />
        </div>

        {/* ④ Affiliations */}
        <div>
          <SectionHeader label="Restaurants affiliés" />
          <AffiliationsInline />
        </div>

        {/* ⑤ Historique du jour */}
        {stats && stats.today.deliveries.length > 0 && (
          <div>
            <SectionHeader label="Courses du jour" count={stats.today.deliveries.length} />
            <div className="space-y-2">
              {stats.today.deliveries.map(d => (
                <div key={d.id} className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: 'rgb(var(--color-surface))' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-text">{d.restaurant.name}</p>
                    <p className="text-xs text-text-3">
                      {d.escrowReleasedAt
                        ? new Date(d.escrowReleasedAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})
                        : '—'}
                    </p>
                  </div>
                  <p className="text-base font-black text-success shrink-0">{fmt(d.driverEarningsCents)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Popup prioritaire */}
      {incoming && (
        <IncomingModal
          req={incoming}
          accepting={acceptDelivery.isPending}
          onDismiss={() => setIncoming(null)}
          onAccept={() => acceptDelivery.mutate(incoming.orderId, {
            onSuccess: () => setIncoming(null),
            onError:   () => setIncoming(null),
          })}
        />
      )}
    </div>
  );
}
