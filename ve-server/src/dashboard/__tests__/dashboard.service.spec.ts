import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardService } from '../dashboard.service';

const prismaMock = {
  order: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  customer: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  product: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  orderItem: {
    groupBy: jest.fn(),
  },
  homeSection: {
    findMany: jest.fn(),
  },
};

describe('DashboardService (unit)', () => {
  let service: DashboardService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns zeroed metrics and 7-day chart when database is empty', async () => {
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.order.count.mockResolvedValue(0);
    prismaMock.customer.count.mockResolvedValue(0);
    prismaMock.customer.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.orderItem.groupBy.mockResolvedValue([]);
    prismaMock.homeSection.findMany.mockResolvedValue([]);

    const result = await service.getDashboardStats();

    expect(result.banner).toEqual({
      todaySales: '৳0',
      rawTodaySales: 0,
      pendingOrders: 0,
    });
    expect(result.stats).toHaveLength(4);
    expect(result.chart.data).toHaveLength(7);
    expect(result.chart.data.every((p) => p.value === 10 && p.rawAmount === 0)).toBe(true);
    expect(result.recentOrders).toEqual([]);
    expect(result.topProducts).toEqual([]);
    expect(result.activityFeed).toEqual([]);
  });

  it('aggregates revenue, orders, topProducts, recentOrders, and activityFeed', async () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // order.findMany calls:
    // 1) todayOrders, 2) allValidOrders, 3..9) 7 daily chart queries, 10) recentOrdersRaw
    prismaMock.order.findMany
      .mockResolvedValueOnce([{ total_amount: 1000 }]) // todayOrders
      .mockResolvedValueOnce([
        { total_amount: 1000, created_at: now },
        { total_amount: 500, created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
      ]) // allValidOrders (1000 last 7d, 500 prev 7d -> +100%)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total_amount: 1000 }]) // today in chart
      .mockResolvedValueOnce([
        {
          id: 7,
          total_amount: 1000,
          status: 'PENDING',
          created_at: twoHoursAgo,
          customer: { fname: 'Sara', lname: 'Khan' },
          order_items: [
            { product: { title: 'Glow Serum' } },
            { product: { title: 'Lip Balm' } },
          ],
        },
      ]);

    prismaMock.order.count
      .mockResolvedValueOnce(3) // pendingOrdersCount
      .mockResolvedValueOnce(4) // ordersTodayCount
      .mockResolvedValueOnce(2); // ordersYesterdayCount

    prismaMock.customer.count
      .mockResolvedValueOnce(20) // totalCustomersCount
      .mockResolvedValueOnce(5) // last30DaysCustomers
      .mockResolvedValueOnce(5); // prev30DaysCustomers

    prismaMock.product.count
      .mockResolvedValueOnce(12) // activeProductsCount
      .mockResolvedValueOnce(2); // newProductsThisWeek

    prismaMock.orderItem.groupBy.mockResolvedValueOnce([
      { product_id: 101, _sum: { quantity: 4 } },
    ]);

    // product.findMany calls: 1) productDetails for topProducts, 2) recentProducts for activityFeed
    prismaMock.product.findMany
      .mockResolvedValueOnce([
        { id: 101, title: 'Glow Serum', price: 500, category: { name: 'Skincare' } },
      ])
      .mockResolvedValueOnce([
        { id: 101, title: 'Glow Serum', stock_quantity: 15, updated_at: now },
      ]);

    prismaMock.customer.findMany.mockResolvedValueOnce([
      { id: 1, fname: 'Sara', lname: 'Khan', created_at: now },
    ]);
    prismaMock.homeSection.findMany.mockResolvedValueOnce([
      { id: 1, title: 'Summer Sale', updated_at: now },
    ]);

    const result = await service.getDashboardStats();

    expect(result.banner).toEqual({
      todaySales: '৳1,000',
      rawTodaySales: 1000,
      pendingOrders: 3,
    });
    expect(result.stats[0]).toMatchObject({
      id: 'revenue',
      value: '৳1,500',
      change: '+100.0%',
      trend: 'up',
    });
    expect(result.recentOrders[0]).toMatchObject({
      id: 'VE-00007',
      customer: 'Sara Khan',
      product: 'Glow Serum (+1 more)',
      status: 'pending',
    });
    expect(result.topProducts[0]).toEqual({
      id: 'p101',
      name: 'Glow Serum',
      category: 'Skincare',
      sold: 4,
      revenue: '৳2,000',
    });
    expect(result.activityFeed.length).toBeGreaterThanOrEqual(4);
    expect(result.activityFeed.length).toBeLessThanOrEqual(5);
  });
});
