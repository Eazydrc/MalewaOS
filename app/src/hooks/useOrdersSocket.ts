import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '@/lib/api';

// Le serveur WS est exposé à la racine (pas sous /api/v1, qui ne s'applique qu'au REST)
const SOCKET_ORIGIN = BASE_URL.replace(/\/api\/v\d+\/?$/, '');

// Bip d'alerte généré via Web Audio API — pas de fichier audio à charger
function playAlertBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const playTone = (delay: number) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    };
    playTone(0);
    playTone(0.3);
  } catch {
    // Web Audio indisponible (ex: autoplay bloqué avant interaction) — silencieux
  }
}

interface UseOrdersSocketOptions {
  /** @deprecated conservé pour compat — la room est déterminée côté serveur via le JWT */
  restaurantId?: string;
  enabled?: boolean;
  /** Clés react-query à invalider à chaque événement (par défaut : restaurant-orders + my-orders) */
  invalidateKeys?: (string | undefined)[][];
  onNewOrder?: () => void;
  /** Si false, ne joue pas le bip à la réception d'une nouvelle commande (ex : côté client) */
  playBeep?: boolean;
}

export function useOrdersSocket({ restaurantId, enabled = true, invalidateKeys, onNewOrder, playBeep = true }: UseOrdersSocketOptions) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const keys = invalidateKeys ?? (restaurantId ? [['restaurant-orders', restaurantId]] : [['my-orders']]);

  useEffect(() => {
    if (!enabled) return;

    const socket = io(`${SOCKET_ORIGIN}/orders`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    const invalidate = () => keys.forEach(key => qc.invalidateQueries({ queryKey: key }));

    socket.on('order:new', () => {
      invalidate();
      if (playBeep) playAlertBeep();
      onNewOrder?.();
    });

    socket.on('order:status', () => {
      invalidate();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, restaurantId, qc, onNewOrder, playBeep, JSON.stringify(keys)]);

  return { connected };
}
