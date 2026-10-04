import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type DashboardStat = {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  accent: 'rose' | 'gold' | 'magenta' | 'neutral';
};

export type RecentOrder = {
  id: string;
  customer: string;
  product: string;
  amount: string;
  status: string;
  date: string;
};

export type TopProduct = {
  id: string;
  name: string;
  category: string;
  sold: number;
  revenue: string;
};

export type ActivityItem = {
  id: string;
  message: string;
  time: string;
  type: 'order' | 'product' | 'customer' | 'promo';
};

export type ChartPoint = {
  day: string;
  value: number;
  amount: string;
  rawAmount: number;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();

    // Start of today (00:00:00)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Start of yesterday (00:00:00)
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(startOfToday.getTime() - 1);

    // 7 days ago & 14 days ago
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 30 days ago & 60 days ago
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Format BDT helper
    const formatBDT = (amount: number) =>
      `৳${Math.round(amount).toLocaleString('en-BD')}`;

    // 1. Fetch Orders Today & Today's Sales
    const todayOrders = await this.prisma.order.findMany({
      where: {
        created_at: { gte: startOfToday },
        status: { not: 'cancelled' },
      },
      select: { total_amount: true },
    });

    const todaySalesAmount = todayOrders.reduce(
      (sum, o) => sum + Number(o.total_amount),
      0,
    );

    const pendingOrdersCount = await this.prisma.order.count({
      where: { status: 'pending' },
    });

    // 2. Revenue calculation
    const allValidOrders = await this.prisma.order.findMany({
      where: { status: { not: 'cancelled' } },
      select: { total_amount: true, created_at: true },
    });

    const totalRevenueSum = allValidOrders.reduce(
      (sum, o) => sum + Number(o.total_amount),
      0,
    );

    const last7DaysRevenue = allValidOrders
      .filter((o) => o.created_at >= sevenDaysAgo)
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    const prev7DaysRevenue = allValidOrders
      .filter((o) => o.created_at >= fourteenDaysAgo && o.created_at < sevenDaysAgo)
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    let revenueChangePct = 0;
    if (prev7DaysRevenue > 0) {
      revenueChangePct = ((last7DaysRevenue - prev7DaysRevenue) / prev7DaysRevenue) * 100;
    } else if (last7DaysRevenue > 0) {
      revenueChangePct = 100;
    }

    // 3. Orders Today & comparison
    const ordersTodayCount = await this.prisma.order.count({
      where: { created_at: { gte: startOfToday } },
    });
    const ordersYesterdayCount = await this.prisma.order.count({
      where: {
        created_at: { gte: startOfYesterday, lte: endOfYesterday },
      },
    });

    let ordersChangePct = 0;
    if (ordersYesterdayCount > 0) {
      ordersChangePct = ((ordersTodayCount - ordersYesterdayCount) / ordersYesterdayCount) * 100;
    } else if (ordersTodayCount > 0) {
      ordersChangePct = 100;
    }

    // 4. Customers calculation
    const totalCustomersCount = await this.prisma.customer.count();
    const last30DaysCustomers = await this.prisma.customer.count({
      where: { created_at: { gte: thirtyDaysAgo } },
    });
    const prev30DaysCustomers = await this.prisma.customer.count({
      where: { created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    });

    let customersChangePct = 0;
    if (prev30DaysCustomers > 0) {
      customersChangePct = ((last30DaysCustomers - prev30DaysCustomers) / prev30DaysCustomers) * 100;
    } else if (last30DaysCustomers > 0) {
      customersChangePct = 100;
    }

    // 5. Products calculation
    const activeProductsCount = await this.prisma.product.count({
      where: { status: 'active' },
    });

    const newProductsThisWeek = await this.prisma.product.count({
      where: { created_at: { gte: sevenDaysAgo } },
    });

    const stats: DashboardStat[] = [
      {
        id: 'revenue',
        label: 'Total Revenue',
        value: formatBDT(totalRevenueSum),
        change: `${revenueChangePct >= 0 ? '+' : ''}${revenueChangePct.toFixed(1)}%`,
        trend: revenueChangePct > 0 ? 'up' : revenueChangePct < 0 ? 'down' : 'neutral',
        accent: 'rose',
      },
      {
        id: 'orders',
        label: 'Orders Today',
        value: ordersTodayCount.toLocaleString('en-BD'),
        change: `${ordersChangePct >= 0 ? '+' : ''}${ordersChangePct.toFixed(1)}%`,
        trend: ordersChangePct > 0 ? 'up' : ordersChangePct < 0 ? 'down' : 'neutral',
        accent: 'gold',
      },
      {
        id: 'customers',
        label: 'New Customers',
        value: totalCustomersCount.toLocaleString('en-BD'),
        change: `${customersChangePct >= 0 ? '+' : ''}${customersChangePct.toFixed(1)}%`,
        trend: customersChangePct > 0 ? 'up' : customersChangePct < 0 ? 'down' : 'neutral',
        accent: 'magenta',
      },
      {
        id: 'products',
        label: 'Active Products',
        value: activeProductsCount.toLocaleString('en-BD'),
        change: `+${newProductsThisWeek} new`,
        trend: 'neutral',
        accent: 'neutral',
      },
    ];

    // 6. Weekly Chart Data (Last 7 Days)
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartDays: Array<{ label: string; start: Date; end: Date }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      chartDays.push({
        label: dayLabels[d.getDay()],
        start: dayStart,
        end: dayEnd,
      });
    }

    const chartDailySales = await Promise.all(
      chartDays.map(async (dayObj) => {
        const orders = await this.prisma.order.findMany({
          where: {
            created_at: { gte: dayObj.start, lte: dayObj.end },
            status: { not: 'cancelled' },
          },
          select: { total_amount: true },
        });
        const sum = orders.reduce((acc, o) => acc + Number(o.total_amount), 0);
        return {
          day: dayObj.label,
          rawAmount: sum,
        };
      }),
    );

    const maxDailySum = Math.max(...chartDailySales.map((d) => d.rawAmount), 1);
    const chartData: ChartPoint[] = chartDailySales.map((d) => ({
      day: d.day,
      value: d.rawAmount > 0 ? Math.max(15, Math.round((d.rawAmount / maxDailySum) * 100)) : 10,
      amount: formatBDT(d.rawAmount),
      rawAmount: d.rawAmount,
    }));

    // 7. Recent Orders
    const recentOrdersRaw = await this.prisma.order.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        customer: true,
        order_items: {
          include: {
            product: true,
          },
        },
      },
    });

    const recentOrders: RecentOrder[] = recentOrdersRaw.map((o) => {
      const firstItem = o.order_items[0]?.product?.title || 'General Order';
      const extraItemsCount = o.order_items.length - 1;
      const productTitle = extraItemsCount > 0 ? `${firstItem} (+${extraItemsCount} more)` : firstItem;
      const customerName = o.customer
        ? `${o.customer.fname} ${o.customer.lname}`.trim()
        : 'Guest Customer';

      return {
        id: `VE-${o.id.toString().padStart(5, '0')}`,
        customer: customerName || 'Customer',
        product: productTitle,
        amount: formatBDT(Number(o.total_amount)),
        status: o.status.toLowerCase(),
        date: this.getRelativeTime(o.created_at),
      };
    });

    // 8. Top Products
    const orderItemsGrouped = await this.prisma.orderItem.groupBy({
      by: ['product_id'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 4,
    });

    let topProducts: TopProduct[] = [];
    if (orderItemsGrouped.length > 0) {
      const productIds = orderItemsGrouped.map((item) => item.product_id);
      const productDetails = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { category: true },
      });

      topProducts = orderItemsGrouped.map((g, idx) => {
        const prod = productDetails.find((p) => p.id === g.product_id);
        const soldQty = g._sum.quantity || 0;
        const totalRev = Number(prod?.price || 0) * soldQty;
        return {
          id: `p${prod?.id || idx}`,
          name: prod?.title || 'Unknown Product',
          category: prod?.category?.name || 'General',
          sold: soldQty,
          revenue: formatBDT(totalRev),
        };
      });
    }

    if (topProducts.length === 0) {
      const activeProds = await this.prisma.product.findMany({
        take: 4,
        where: { status: 'active' },
        include: { category: true },
        orderBy: { created_at: 'desc' },
      });

      topProducts = activeProds.map((prod) => ({
        id: `p${prod.id}`,
        name: prod.title,
        category: prod.category?.name || 'Beauty',
        sold: 0,
        revenue: formatBDT(Number(prod.price)),
      }));
    }

    // 9. Activity Feed
    const activityItems: Array<{
      id: string;
      message: string;
      time: string;
      type: 'order' | 'product' | 'customer' | 'promo';
      rawDate: Date;
    }> = [];

    for (const o of recentOrdersRaw.slice(0, 3)) {
      const cName = o.customer ? `${o.customer.fname} ${o.customer.lname}`.trim() : 'Customer';
      activityItems.push({
        id: `act-order-${o.id}`,
        message: `New order #VE-${o.id.toString().padStart(5, '0')} placed by ${cName}`,
        time: this.getRelativeTime(o.created_at),
        type: 'order',
        rawDate: o.created_at,
      });
    }

    const recentProducts = await this.prisma.product.findMany({
      take: 2,
      orderBy: { updated_at: 'desc' },
    });
    for (const p of recentProducts) {
      activityItems.push({
        id: `act-prod-${p.id}`,
        message: `Product '${p.title}' stock updated to ${p.stock_quantity} units`,
        time: this.getRelativeTime(p.updated_at),
        type: 'product',
        rawDate: p.updated_at,
      });
    }

    const recentCustomers = await this.prisma.customer.findMany({
      take: 2,
      orderBy: { created_at: 'desc' },
    });
    for (const c of recentCustomers) {
      activityItems.push({
        id: `act-cust-${c.id}`,
        message: `New customer registration: ${c.fname} ${c.lname}`.trim(),
        time: this.getRelativeTime(c.created_at),
        type: 'customer',
        rawDate: c.created_at,
      });
    }

    const recentHomeSections = await this.prisma.homeSection.findMany({
      take: 2,
      orderBy: { updated_at: 'desc' },
    });
    for (const s of recentHomeSections) {
      activityItems.push({
        id: `act-promo-${s.id}`,
        message: `Home section '${s.title}' updated`,
        time: this.getRelativeTime(s.updated_at),
        type: 'promo',
        rawDate: s.updated_at,
      });
    }

    activityItems.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
    const finalActivity: ActivityItem[] = activityItems
      .slice(0, 5)
      .map(({ rawDate, ...item }) => item);

    return {
      banner: {
        todaySales: formatBDT(todaySalesAmount),
        rawTodaySales: todaySalesAmount,
        pendingOrders: pendingOrdersCount,
      },
      stats,
      chart: {
        totalWeeklyRevenue: formatBDT(last7DaysRevenue),
        weeklyGrowth: `${revenueChangePct >= 0 ? '+' : ''}${revenueChangePct.toFixed(1)}% this week`,
        trend: revenueChangePct >= 0 ? 'up' : 'down',
        data: chartData,
      },
      recentOrders,
      topProducts,
      activityFeed: finalActivity,
    };
  }

  private getRelativeTime(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
