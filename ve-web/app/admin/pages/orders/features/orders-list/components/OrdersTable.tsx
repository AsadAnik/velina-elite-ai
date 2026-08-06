"use client";

import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { Order, OrderStatus } from "@/lib/orders";
import OrderStatusBadge from "./OrderStatusBadge";
import OrderDetailModal from "./OrderDetailModal";

type OrdersTableProps = {
  orders: Order[];
  onUpdateStatus?: (orderId: number, status: OrderStatus) => void;
  onDeleteOrder?: (orderId: number) => void;
};

export default function OrdersTable({ orders, onUpdateStatus, onDeleteOrder }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white dark:bg-zinc-900/50 p-12 text-center shadow-sm">
        <p className="text-sm font-bold text-muted">No orders match this filter.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-white dark:bg-zinc-900/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                {["Order ID", "Customer", "Items", "Total", "Payment", "Status", "Date", ""].map(
                  (col) => (
                    <th
                      key={col || "actions"}
                      className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-subtle"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border-subtle last:border-0 hover:bg-surface/60 transition-colors"
                >
                  <td className="px-5 py-4 font-bold text-velina-rose">#{order.id}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-foreground">
                      {order.customer?.fname} {order.customer?.lname}
                    </p>
                    <p className="text-[10px] text-muted-subtle">{order.customer?.user?.email}</p>
                  </td>
                  <td className="px-5 py-4 text-muted">{order.order_items.length} items</td>
                  <td className="px-5 py-4 font-bold text-foreground">
                    ৳{Number(order.total_amount).toFixed(2)}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      COD
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {onUpdateStatus ? (
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                        className="text-[10px] font-black uppercase tracking-wider rounded-lg border border-border px-2 py-1 bg-surface focus:outline-none focus:ring-1 focus:ring-velina-rose"
                      >
                        {["pending", "confirmed", "preparing", "shipping", "shipped", "ready_for_receive", "completed", "cancelled"].map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    ) : (
                      <OrderStatusBadge status={order.status} />
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-muted">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      aria-label="View order details"
                      className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-velina-rose transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    {onDeleteOrder && (
                      <button
                        onClick={() => onDeleteOrder(order.id)}
                        aria-label="Delete order"
                        className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </>
  );
}
