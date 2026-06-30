import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { corsOriginCallback } from '../common/cors.util';

function extractAccessToken(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === 'access_token') return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@WebSocketGateway({
  namespace: '/orders',
  cors: { origin: corsOriginCallback, credentials: true },
})
export class OrdersGateway implements OnGatewayConnection {
  private readonly logger = new Logger(OrdersGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = extractAccessToken(client.handshake.headers.cookie);
      if (!token) throw new Error('Token absent');

      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.role = payload.role;

      // Le client rejoint sa propre room pour le suivi de ses commandes
      void client.join(`user:${payload.sub}`);

      // Si c'est un restaurateur, le faire rejoindre la room de son restaurant
      if (payload.role === 'RESTAURANT' || payload.role === 'ADMIN') {
        const restaurant = await this.prisma.restaurant.findFirst({
          where: { ownerId: payload.sub },
          select: { id: true },
        });
        if (restaurant) void client.join(`restaurant:${restaurant.id}`);
      }
    } catch (err) {
      this.logger.warn(`Connexion WS refusée : ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  emitNewOrder(restaurantId: string, order: unknown) {
    this.server.to(`restaurant:${restaurantId}`).emit('order:new', order);
  }

  emitOrderStatus(restaurantId: string, userId: string, order: unknown) {
    this.server.to(`restaurant:${restaurantId}`).emit('order:status', order);
    this.server.to(`user:${userId}`).emit('order:status', order);
  }

  // ── Matching livreur — broadcast à tous les livreurs proches ──────────────

  broadcastDeliveryRequest(driverIds: string[], payload: unknown) {
    for (const driverId of driverIds) {
      this.server.to(`user:${driverId}`).emit('delivery:request', payload);
    }
  }

  /** Informe les livreurs non retenus que la commande a été prise par un autre */
  notifyDeliveryTaken(driverIds: string[], orderId: string, takenByDriverId: string) {
    for (const driverId of driverIds) {
      if (driverId !== takenByDriverId) {
        this.server.to(`user:${driverId}`).emit('delivery:taken', { orderId });
      }
    }
  }
}
