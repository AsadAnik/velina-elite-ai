"use client";

import { useMemo, useState, useEffect } from "react";
import { getAllOrders, Order, OrderStatus } from "@/lib/orders";
import { toast } from "sonner";

const statusFilters = ["All", "pending", "confirmed", "preparing", "shipping", "shipped", "ready_for_receive", "completed", "cancelled"];

export function useOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      setOrders(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === "All") return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const stats = useMemo(
    () => ({
      pending: orders.filter((o) => o.status === OrderStatus.pending).length,
      confirmed: orders.filter((o) => o.status === OrderStatus.confirmed).length,
      preparing: orders.filter((o) => o.status === OrderStatus.preparing).length,
      shipping: orders.filter((o) => o.status === OrderStatus.shipping).length,
      shipped: orders.filter((o) => o.status === OrderStatus.shipped).length,
      ready_for_receive: orders.filter((o) => o.status === OrderStatus.ready_for_receive).length,
      completed: orders.filter((o) => o.status === OrderStatus.completed).length,
      cancelled: orders.filter((o) => o.status === OrderStatus.cancelled).length,
    }),
    [orders]
  );

  return {
    orders: filteredOrders,
    allOrders: orders,
    statusFilter,
    setStatusFilter,
    statusFilters,
    stats,
    totalCount: orders.length,
    loading,
    loadOrders,
  };
}
