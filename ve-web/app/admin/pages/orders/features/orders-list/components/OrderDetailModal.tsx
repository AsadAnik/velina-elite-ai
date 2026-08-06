"use client";

import { X, Package, MapPin, Clock, User, CreditCard, Check } from "lucide-react";
import { Order, OrderStatus } from "@/lib/orders";
import OrderStatusBadge from "./OrderStatusBadge";
import Image from "next/image";

type OrderDetailModalProps = {
  order: Order | null;
  onClose: () => void;
};

const statusTimeline: OrderStatus[] = [
  OrderStatus.pending,
  OrderStatus.confirmed,
  OrderStatus.preparing,
  OrderStatus.shipping,
  OrderStatus.shipped,
  OrderStatus.completed,
];

const stepLabels: Record<string, string> = {
  [OrderStatus.pending]: "Placed",
  [OrderStatus.confirmed]: "Confirmed",
  [OrderStatus.preparing]: "Preparing",
  [OrderStatus.shipping]: "Shipping",
  [OrderStatus.shipped]: "Shipped",
  [OrderStatus.completed]: "Delivered",
};

function TimelineStep({
  status,
  index,
  currentStatus,
  isLast,
  isFilled,
}: {
  status: OrderStatus;
  index: number;
  currentStatus: OrderStatus;
  isLast: boolean;
  isFilled: boolean;
}) {
  const currentIdx = statusTimeline.indexOf(currentStatus);
  const stepIdx = statusTimeline.indexOf(status);
  const isDone = stepIdx <= currentIdx && currentStatus !== OrderStatus.cancelled;
  const isActive = stepIdx === currentIdx && currentStatus !== OrderStatus.cancelled;
  const isCancelled = currentStatus === OrderStatus.cancelled;

  return (
    <div className="flex items-center flex-1 min-w-0">
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
            isCancelled
              ? "border-red-300 bg-red-50 text-red-400"
              : isActive
              ? "border-velina-rose bg-velina-rose text-white shadow-md shadow-velina-rose/30 scale-110"
              : isDone
              ? "border-velina-rose bg-velina-rose text-white"
              : "border-border bg-surface text-muted"
          }`}
        >
          {isDone && !isActive ? <Check size={11} /> : index + 1}
        </div>
        <span
          className={`hidden sm:block text-[9px] font-bold uppercase tracking-wide text-center leading-tight max-w-[52px] ${
            isCancelled
              ? "text-red-400"
              : isDone
              ? "text-velina-rose"
              : "text-muted"
          }`}
        >
          {stepLabels[status] ?? status.replace(/_/g, " ")}
        </span>
      </div>
      {!isLast && (
        <div
          className={`h-0.5 flex-1 mx-1 rounded-full transition-all ${
            isFilled ? "bg-velina-rose" : "bg-border"
          }`}
        />
      )}
    </div>
  );
}

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  if (!order) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const currentIdx = statusTimeline.indexOf(order.status as OrderStatus);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Sheet on mobile, centered card on sm+ */}
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-border bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 py-4 border-b border-border bg-surface/50 flex-shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Order Details</p>
            <h2 className="text-base sm:text-lg font-black text-foreground mt-0.5">
              Order <span className="text-velina-rose">#{order.id}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <OrderStatusBadge status={order.status} />
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-6">

          {/* Order timeline */}
          {order.status !== OrderStatus.cancelled && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-1.5">
                <Clock size={11} /> Progress
              </p>

              {/* Horizontal step bar */}
              <div className="flex items-center">
                {statusTimeline.map((s, i) => (
                  <TimelineStep
                    key={s}
                    status={s}
                    index={i}
                    currentStatus={order.status}
                    isLast={i === statusTimeline.length - 1}
                    isFilled={i < currentIdx}
                  />
                ))}
              </div>

              {/* Active step label – shown on mobile below the bar */}
              <p className="sm:hidden mt-2 text-center text-[10px] font-black uppercase tracking-widest text-velina-rose">
                {stepLabels[order.status] ?? order.status.replace(/_/g, " ")}
              </p>
            </div>
          )}

          {/* Customer & Shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-xl border border-border bg-surface/40 p-3 sm:p-4 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-1.5">
                <User size={10} /> Customer
              </p>
              <p className="font-bold text-foreground text-sm">
                {order.customer?.fname} {order.customer?.lname}
              </p>
              <p className="text-xs text-muted break-all">{order.customer?.user?.email}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 p-3 sm:p-4 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-1.5">
                <MapPin size={10} /> Shipping Address
              </p>
              <p className="font-medium text-foreground text-xs leading-relaxed">
                {order.shipping_address?.line1}
                {order.shipping_address?.line2 && `, ${order.shipping_address.line2}`}
              </p>
              <p className="text-xs text-muted">
                {order.shipping_address?.city}, {order.shipping_address?.counrty}{" "}
                {order.shipping_address?.postal_code}
              </p>
            </div>
          </div>

          {/* Payment, Date & Total */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="rounded-xl border border-border bg-surface/40 p-3 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-1 mb-1">
                <CreditCard size={10} /> <span className="hidden sm:inline">Payment</span>
              </p>
              <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold bg-green-100 text-green-800">
                COD
              </span>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 p-3 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Ordered</p>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                {new Date(order.created_at).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 p-3 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Total</p>
              <p className="text-xs sm:text-sm font-black text-velina-rose">
                ৳{Number(order.total_amount).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Note */}
          {order.note && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">
                Note from customer
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">{order.note}</p>
            </div>
          )}

          {/* Ordered Products */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-1.5 mb-3">
              <Package size={11} /> Ordered Products ({order.order_items.length})
            </p>
            <div className="space-y-2 sm:space-y-3">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 sm:gap-4 rounded-xl border border-border bg-surface/30 p-2.5 sm:p-3 hover:bg-surface/60 transition-colors"
                >
                  {/* Product Image */}
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-surface-2 flex-shrink-0 border border-border">
                    {item.product?.images_url?.[0] ? (
                      <Image
                        src={item.product.images_url[0]}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
                        <Package size={18} />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-xs sm:text-sm truncate">
                      {item.product?.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {item.product?.category?.name && (
                        <span className="text-[9px] sm:text-[10px] font-bold text-muted bg-surface-2 px-1.5 py-0.5 rounded-full">
                          {item.product.category.name}
                        </span>
                      )}
                      {item.product?.sub_category?.name && (
                        <span className="text-[9px] sm:text-[10px] font-bold text-muted bg-surface-2 px-1.5 py-0.5 rounded-full">
                          {item.product.sub_category.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] sm:text-xs text-muted font-medium">
                      Qty: <span className="font-black text-foreground">{item.quantity}</span>
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted mt-0.5">
                      ৳{Number(item.unit_price).toFixed(2)} ea
                    </p>
                    <p className="text-xs sm:text-sm font-black text-velina-rose mt-0.5">
                      ৳{(Number(item.unit_price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order total summary */}
            <div className="mt-3 flex justify-end">
              <div className="rounded-xl border border-border bg-surface/40 px-4 sm:px-5 py-3 text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Order Total</p>
                <p className="text-lg sm:text-xl font-black text-velina-rose mt-0.5">
                  ৳{Number(order.total_amount).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
