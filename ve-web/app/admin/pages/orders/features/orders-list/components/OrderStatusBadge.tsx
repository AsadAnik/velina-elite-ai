import { OrderStatus } from "@/lib/orders";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  preparing: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  shipping: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
  shipped: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  ready_for_receive: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.pending;
  const label = status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${style}`}
    >
      {label}
    </span>
  );
}
