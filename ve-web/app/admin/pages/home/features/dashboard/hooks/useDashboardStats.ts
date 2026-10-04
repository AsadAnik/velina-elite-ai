"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import {
  DashboardStat,
  RecentOrder,
  TopProduct,
  ActivityItem,
  ChartPoint,
  dashboardStats as fallbackStats,
  recentOrders as fallbackOrders,
  topProducts as fallbackTopProducts,
  activityFeed as fallbackActivity,
  revenueChartData as fallbackChartData,
} from "./dashboard.data";

export interface DashboardResponse {
  banner: {
    todaySales: string;
    rawTodaySales: number;
    pendingOrders: number;
  };
  stats: DashboardStat[];
  chart: {
    totalWeeklyRevenue: string;
    weeklyGrowth: string;
    trend: "up" | "down";
    data: ChartPoint[];
  };
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
  activityFeed: ActivityItem[];
}

export function useDashboardStats() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApi<DashboardResponse>("/admin/dashboard/stats");
      if (res && res.stats) {
        setData(res);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch dashboard stats from backend:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    loading,
    error,
    banner: data?.banner || {
      todaySales: "৳0",
      pendingOrders: 0,
    },
    stats: data?.stats || fallbackStats,
    orders: data?.recentOrders || fallbackOrders,
    topProducts: data?.topProducts || fallbackTopProducts,
    activity: data?.activityFeed || fallbackActivity,
    chartData: data?.chart?.data || fallbackChartData,
    chartSummary: {
      totalWeeklyRevenue: data?.chart?.totalWeeklyRevenue || "৳0",
      weeklyGrowth: data?.chart?.weeklyGrowth || "0% this week",
    },
    refetch: fetchStats,
  };
}
