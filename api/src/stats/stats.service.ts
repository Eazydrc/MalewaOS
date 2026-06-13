import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CROISSANCE_TIERS = ['CROISSANCE', 'DOMINATION'];
const DOMINATION_TIERS = ['DOMINATION'];

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getMyStats(ownerId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ownerId, isActive: true },
    });
    if (!restaurant) throw new NotFoundException('Aucun restaurant trouvé');
    if (!CROISSANCE_TIERS.includes(restaurant.subscription))
      throw new ForbiddenException('Analytics disponibles à partir du pack Croissance');

    const now   = new Date();
    const day7  = new Date(now); day7.setDate(now.getDate() - 7);
    const day30 = new Date(now); day30.setDate(now.getDate() - 30);

    const [
      reservationsTotal,
      reservationsWeek,
      reservationsMonth,
      ordersTotal,
      ordersWeek,
      ordersMonth,
      revenueWeek,
      revenueMonth,
      revenueTotal,
      topItems,
      ordersByStatus,
      reservationsByStatus,
      dailyOrders,
    ] = await Promise.all([
      // Réservations
      this.prisma.reservation.count({ where: { restaurantId: restaurant.id } }),
      this.prisma.reservation.count({ where: { restaurantId: restaurant.id, createdAt: { gte: day7 } } }),
      this.prisma.reservation.count({ where: { restaurantId: restaurant.id, createdAt: { gte: day30 } } }),
      // Commandes
      this.prisma.order.count({ where: { restaurantId: restaurant.id } }),
      this.prisma.order.count({ where: { restaurantId: restaurant.id, createdAt: { gte: day7 } } }),
      this.prisma.order.count({ where: { restaurantId: restaurant.id, createdAt: { gte: day30 } } }),
      // Revenus (commandes DELIVERED uniquement)
      this.prisma.order.aggregate({
        where: { restaurantId: restaurant.id, status: 'DELIVERED', createdAt: { gte: day7 } },
        _sum: { totalCents: true },
      }),
      this.prisma.order.aggregate({
        where: { restaurantId: restaurant.id, status: 'DELIVERED', createdAt: { gte: day30 } },
        _sum: { totalCents: true },
      }),
      this.prisma.order.aggregate({
        where: { restaurantId: restaurant.id, status: 'DELIVERED' },
        _sum: { totalCents: true },
      }),
      // Top plats (30 derniers jours)
      this.prisma.orderItem.groupBy({
        by: ['name'],
        where: { order: { restaurantId: restaurant.id, createdAt: { gte: day30 } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      // Commandes par statut
      this.prisma.order.groupBy({
        by: ['status'],
        where: { restaurantId: restaurant.id },
        _count: { status: true },
      }),
      // Réservations par statut
      this.prisma.reservation.groupBy({
        by: ['status'],
        where: { restaurantId: restaurant.id },
        _count: { status: true },
      }),
      // Commandes 7 derniers jours (jour par jour)
      this.prisma.$queryRaw<{ day: string; count: bigint; revenue: bigint }[]>`
        SELECT
          DATE("createdAt") as day,
          COUNT(*)::bigint as count,
          COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN "totalCents" ELSE 0 END), 0)::bigint as revenue
        FROM "Order"
        WHERE "restaurantId" = ${restaurant.id}
          AND "createdAt" >= ${day7}
        GROUP BY DATE("createdAt")
        ORDER BY day ASC
      `,
    ]);

    return {
      restaurant: { id: restaurant.id, name: restaurant.name, subscription: restaurant.subscription, rating: restaurant.rating, reviewCount: restaurant.reviewCount },
      reservations: {
        total: reservationsTotal,
        week:  reservationsWeek,
        month: reservationsMonth,
        byStatus: Object.fromEntries(reservationsByStatus.map(r => [r.status, r._count.status])),
      },
      orders: {
        total: ordersTotal,
        week:  ordersWeek,
        month: ordersMonth,
        byStatus: Object.fromEntries(ordersByStatus.map(o => [o.status, o._count.status])),
      },
      revenue: {
        week:  revenueWeek._sum.totalCents  ?? 0,
        month: revenueMonth._sum.totalCents ?? 0,
        total: revenueTotal._sum.totalCents ?? 0,
      },
      topItems: topItems.map(t => ({ name: t.name, quantity: Number(t._sum.quantity ?? 0) })),
      dailyOrders: dailyOrders.map(d => ({
        day:     d.day,
        count:   Number(d.count),
        revenue: Number(d.revenue),
      })),
    };
  }

  async getAdvancedStats(ownerId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ownerId, isActive: true },
    });
    if (!restaurant) throw new NotFoundException('Aucun restaurant trouvé');
    if (!DOMINATION_TIERS.includes(restaurant.subscription))
      throw new ForbiddenException('Analytics avancés disponibles uniquement avec le pack Domination');

    const now = new Date();

    // Week ranges
    const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - 7);
    const lastWeekStart = new Date(now); lastWeekStart.setDate(now.getDate() - 14);
    const lastWeekEnd   = new Date(thisWeekStart);

    // Month ranges
    const thisMonthStart = new Date(now); thisMonthStart.setDate(now.getDate() - 30);
    const lastMonthStart = new Date(now); lastMonthStart.setDate(now.getDate() - 60);
    const lastMonthEnd   = new Date(thisMonthStart);

    // 14-day window
    const day14 = new Date(now); day14.setDate(now.getDate() - 14);

    const [
      resThisWeek, resLastWeek, resThisMonth, resLastMonth,
      ordThisWeek, ordLastWeek, ordThisMonth, ordLastMonth,
      revThisWeek, revLastWeek, revThisMonth, revLastMonth,
      totalRes, completedRes,
      totalOrd, deliveredOrd,
      peakHoursRaw,
      daily14Raw,
    ] = await Promise.all([
      // Reservations count
      this.prisma.reservation.count({ where: { restaurantId: restaurant.id, createdAt: { gte: thisWeekStart } } }),
      this.prisma.reservation.count({ where: { restaurantId: restaurant.id, createdAt: { gte: lastWeekStart, lt: lastWeekEnd } } }),
      this.prisma.reservation.count({ where: { restaurantId: restaurant.id, createdAt: { gte: thisMonthStart } } }),
      this.prisma.reservation.count({ where: { restaurantId: restaurant.id, createdAt: { gte: lastMonthStart, lt: lastMonthEnd } } }),
      // Orders count
      this.prisma.order.count({ where: { restaurantId: restaurant.id, createdAt: { gte: thisWeekStart } } }),
      this.prisma.order.count({ where: { restaurantId: restaurant.id, createdAt: { gte: lastWeekStart, lt: lastWeekEnd } } }),
      this.prisma.order.count({ where: { restaurantId: restaurant.id, createdAt: { gte: thisMonthStart } } }),
      this.prisma.order.count({ where: { restaurantId: restaurant.id, createdAt: { gte: lastMonthStart, lt: lastMonthEnd } } }),
      // Revenue (DELIVERED)
      this.prisma.order.aggregate({ where: { restaurantId: restaurant.id, status: 'DELIVERED', createdAt: { gte: thisWeekStart } }, _sum: { totalCents: true } }),
      this.prisma.order.aggregate({ where: { restaurantId: restaurant.id, status: 'DELIVERED', createdAt: { gte: lastWeekStart, lt: lastWeekEnd } }, _sum: { totalCents: true } }),
      this.prisma.order.aggregate({ where: { restaurantId: restaurant.id, status: 'DELIVERED', createdAt: { gte: thisMonthStart } }, _sum: { totalCents: true } }),
      this.prisma.order.aggregate({ where: { restaurantId: restaurant.id, status: 'DELIVERED', createdAt: { gte: lastMonthStart, lt: lastMonthEnd } }, _sum: { totalCents: true } }),
      // Conversion: reservations
      this.prisma.reservation.count({ where: { restaurantId: restaurant.id } }),
      this.prisma.reservation.count({ where: { restaurantId: restaurant.id, status: 'COMPLETED' } }),
      // Conversion: orders
      this.prisma.order.count({ where: { restaurantId: restaurant.id } }),
      this.prisma.order.count({ where: { restaurantId: restaurant.id, status: 'DELIVERED' } }),
      // Peak hours (orders + reservations by hour, last 30 days)
      this.prisma.$queryRaw<{ hour: number; count: bigint }[]>`
        SELECT EXTRACT(HOUR FROM "createdAt")::int AS hour, COUNT(*)::bigint AS count
        FROM "Order"
        WHERE "restaurantId" = ${restaurant.id}
          AND "createdAt" >= ${thisMonthStart}
        GROUP BY hour
        UNION ALL
        SELECT EXTRACT(HOUR FROM "createdAt")::int AS hour, COUNT(*)::bigint AS count
        FROM "Reservation"
        WHERE "restaurantId" = ${restaurant.id}
          AND "createdAt" >= ${thisMonthStart}
        GROUP BY hour
      `,
      // Daily 14 days
      this.prisma.$queryRaw<{ date: string; revenue: bigint; orders: bigint; reservations: bigint }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('day', d.day), 'YYYY-MM-DD') AS date,
          COALESCE(o.revenue, 0)::bigint AS revenue,
          COALESCE(o.orders, 0)::bigint AS orders,
          COALESCE(r.reservations, 0)::bigint AS reservations
        FROM (
          SELECT generate_series(${day14}::date, ${now}::date, '1 day'::interval) AS day
        ) d
        LEFT JOIN (
          SELECT
            DATE_TRUNC('day', "createdAt") AS day,
            COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN "totalCents" ELSE 0 END), 0) AS revenue,
            COUNT(*) AS orders
          FROM "Order"
          WHERE "restaurantId" = ${restaurant.id}
            AND "createdAt" >= ${day14}
          GROUP BY DATE_TRUNC('day', "createdAt")
        ) o ON o.day = DATE_TRUNC('day', d.day)
        LEFT JOIN (
          SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*) AS reservations
          FROM "Reservation"
          WHERE "restaurantId" = ${restaurant.id}
            AND "createdAt" >= ${day14}
          GROUP BY DATE_TRUNC('day', "createdAt")
        ) r ON r.day = DATE_TRUNC('day', d.day)
        ORDER BY d.day ASC
      `,
    ]);

    const pct = (curr: number, prev: number) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

    // Aggregate peak hours (sum both sources by hour)
    const peakMap = new Map<number, number>();
    for (const row of peakHoursRaw) {
      const h = Number(row.hour);
      peakMap.set(h, (peakMap.get(h) ?? 0) + Number(row.count));
    }
    const peakHours = Array.from(peakMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);

    return {
      reservations: {
        thisWeek:    resThisWeek,
        lastWeek:    resLastWeek,
        weekChange:  pct(resThisWeek, resLastWeek),
        thisMonth:   resThisMonth,
        lastMonth:   resLastMonth,
        monthChange: pct(resThisMonth, resLastMonth),
      },
      orders: {
        thisWeek:    ordThisWeek,
        lastWeek:    ordLastWeek,
        weekChange:  pct(ordThisWeek, ordLastWeek),
        thisMonth:   ordThisMonth,
        lastMonth:   ordLastMonth,
        monthChange: pct(ordThisMonth, ordLastMonth),
      },
      revenue: {
        thisWeek:    revThisWeek._sum.totalCents  ?? 0,
        lastWeek:    revLastWeek._sum.totalCents  ?? 0,
        weekChange:  pct(revThisWeek._sum.totalCents ?? 0, revLastWeek._sum.totalCents ?? 0),
        thisMonth:   revThisMonth._sum.totalCents ?? 0,
        lastMonth:   revLastMonth._sum.totalCents ?? 0,
        monthChange: pct(revThisMonth._sum.totalCents ?? 0, revLastMonth._sum.totalCents ?? 0),
      },
      conversionRate: {
        reservations: totalRes === 0 ? 0 : Math.round((completedRes / totalRes) * 100),
        orders:       totalOrd === 0 ? 0 : Math.round((deliveredOrd / totalOrd) * 100),
      },
      peakHours,
      daily14: daily14Raw.map(d => ({
        date:         d.date,
        revenue:      Number(d.revenue),
        orders:       Number(d.orders),
        reservations: Number(d.reservations),
      })),
    };
  }
}
