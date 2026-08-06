"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { getAddresses, Address } from "@/lib/addresses";
import { createOrder, CreateOrderDto } from "@/lib/orders";
import { fetchApi } from "@/lib/api";
import { isDhakaCity, BANGLADESH_CITIES, COUNTRIES } from "@/lib/locationData";
import {
  MapPin,
  Plus,
  Check,
  ArrowRight,
  ShoppingBag,
  Truck,
  Shield,
  CreditCard,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Image from "next/image";

// ─── Dropdown component ───────────────────────────────────────────────────────
function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
        {label} {required && <span className="text-velina-rose">*</span>}
      </label>
      <div className="relative">
        <select
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-4 py-2.5 pr-10 border border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-velina-rose/50 focus:border-velina-rose transition-colors"
        >
          <option value="">{placeholder ?? `Select ${label}`}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />
      </div>
    </div>
  );
}

// ─── Text input component ─────────────────────────────────────────────────────
function TextField({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
        {label} {required && <span className="text-velina-rose">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-velina-rose/50 focus:border-velina-rose transition-colors"
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, user, clearCart, validateStock, buyNowItem, clearBuyNow } = useStore();

  // If buyNowItem is set, use that as the items list instead of cart
  const checkoutItems = useMemo(
    () => (buyNowItem ? [buyNowItem] : cart),
    [buyNowItem, cart]
  );
  const checkoutTotal = useMemo(
    () => checkoutItems.reduce((sum, i) => sum + i.product.salePrice * i.quantity, 0),
    [checkoutItems]
  );

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [stockErrors, setStockErrors] = useState<string[]>([]);
  const [shippingConfig, setShippingConfig] = useState<any>(null);
  const [note, setNote] = useState("");
  const [formData, setFormData] = useState({
    line1: "",
    line2: "",
    city: "",
    counrty: "Bangladesh",
    postal_code: "",
    is_default: false,
  });

  // Calculate shipping — only after address is selected
  const shipping = useMemo(() => {
    if (!selectedAddress) return null; // null = not yet determined
    const dhaka = isDhakaCity(selectedAddress.city);
    if (shippingConfig) {
      return dhaka
        ? Number(shippingConfig.inside_dhaka_cost)
        : Number(shippingConfig.outside_dhaka_cost);
    }
    return dhaka ? 70 : 120;
  }, [selectedAddress, shippingConfig]);

  const grandTotal = checkoutTotal + (shipping ?? 0);

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }
    if (checkoutItems.length === 0) {
      router.push("/cart");
      return;
    }

    // Only validate stock for cart items (not buy-now)
    if (!buyNowItem) {
      const validation = validateStock();
      setStockErrors(validation.isValid ? [] : validation.errors);
    }

    const loadShippingConfig = async () => {
      try {
        const data = await fetchApi("/shipping-costs");
        setShippingConfig(data);
      } catch {
        console.error("Failed to load shipping costs");
      }
    };

    loadAddresses();
    loadShippingConfig();
  }, [user, router]);

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
      const def = data.find((a) => a.is_default) ?? data[0] ?? null;
      setSelectedAddress(def);
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("velina_customer_token")}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to add address");
      const address = await response.json();
      toast.success("Address added successfully");
      setShowAddressForm(false);
      setFormData({ line1: "", line2: "", city: "", counrty: "Bangladesh", postal_code: "", is_default: false });
      await loadAddresses();
      setSelectedAddress(address);
    } catch (error: any) {
      toast.error(error.message || "Failed to add address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }
    if (checkoutItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    try {
      setPlacingOrder(true);
      const orderData: CreateOrderDto = {
        shipping_address_id: selectedAddress.id,
        items: checkoutItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        note: note || undefined,
      };
      const order = await createOrder(orderData);
      clearBuyNow();
      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/order-success?order=${order.id}`);
    } catch (error: any) {
      if (error.message?.includes("Insufficient stock")) {
        toast.error(error.message, { duration: 5000 });
        setTimeout(() => router.push("/cart"), 2000);
      } else {
        toast.error(error.message || "Failed to place order");
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-velina-rose" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Place Your Order
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              Checkout
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* ── Left column ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Shipping Address */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-5 sm:p-6">
                <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <MapPin size={16} className="text-velina-rose" /> Shipping Address
                </h2>

                {showAddressForm ? (
                  <form onSubmit={handleAddAddress} className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                      Add New Address
                    </h3>

                    <TextField
                      label="Address Line 1"
                      required
                      value={formData.line1}
                      onChange={(v) => setFormData({ ...formData, line1: v })}
                      placeholder="House / Flat / Road number"
                    />
                    <TextField
                      label="Address Line 2"
                      value={formData.line2}
                      onChange={(v) => setFormData({ ...formData, line2: v })}
                      placeholder="Area / Block / Sector (optional)"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SelectField
                        label="City / District"
                        required
                        value={formData.city}
                        onChange={(v) => setFormData({ ...formData, city: v })}
                        options={BANGLADESH_CITIES}
                        placeholder="Select city"
                      />
                      <SelectField
                        label="Country"
                        required
                        value={formData.counrty}
                        onChange={(v) => setFormData({ ...formData, counrty: v })}
                        options={COUNTRIES}
                        placeholder="Select country"
                      />
                    </div>

                    <TextField
                      label="Postal Code"
                      required
                      value={formData.postal_code}
                      onChange={(v) => setFormData({ ...formData, postal_code: v })}
                      placeholder="e.g. 1205"
                    />

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_default_checkout"
                        checked={formData.is_default}
                        onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                        className="h-4 w-4 accent-velina-rose"
                      />
                      <label htmlFor="is_default_checkout" className="text-sm text-zinc-600 dark:text-zinc-400">
                        Set as default address
                      </label>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-velina-rose text-white font-bold rounded-xl hover:bg-velina-magenta transition-colors text-sm"
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="flex-1 py-2.5 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {addresses.length === 0 ? (
                      <div className="text-center py-8">
                        <MapPin className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                        <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          No addresses yet
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                          Add a shipping address to continue.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {addresses.map((address) => {
                          const isSelected = selectedAddress?.id === address.id;
                          const dhaka = isDhakaCity(address.city);
                          return (
                            <div
                              key={address.id}
                              onClick={() => setSelectedAddress(address)}
                              className={`border rounded-xl p-4 cursor-pointer transition-all ${
                                isSelected
                                  ? "border-velina-rose bg-velina-rose/5 dark:bg-velina-rose/10"
                                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                    {address.line1}
                                  </p>
                                  {address.line2 && (
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{address.line2}</p>
                                  )}
                                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {address.city}, {address.counrty}
                                  </p>
                                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{address.postal_code}</p>
                                  <span
                                    className={`mt-1.5 inline-flex text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                      dhaka
                                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                        : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                    }`}
                                  >
                                    {dhaka ? "Inside Dhaka" : "Outside Dhaka"}
                                  </span>
                                </div>
                                {isSelected && (
                                  <div className="shrink-0 w-5 h-5 rounded-full bg-velina-rose flex items-center justify-center mt-0.5">
                                    <Check size={12} className="text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:border-velina-rose hover:text-velina-rose dark:hover:border-velina-rose dark:hover:text-velina-rose transition-colors"
                    >
                      <Plus size={15} /> Add New Address
                    </button>
                  </>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-5 sm:p-6">
                <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <ShoppingBag size={16} className="text-velina-rose" />
                  {buyNowItem ? "Buying Now" : "Order Items"} ({checkoutItems.length})
                </h2>
                <div className="space-y-4">
                  {checkoutItems.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-4">
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Qty: {quantity}</p>
                      </div>
                      <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        ৳{(product.salePrice * quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Note */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-5 sm:p-6">
                <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 mb-3">
                  Order Note{" "}
                  <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">(Optional)</span>
                </h2>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any special instructions for your order…"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-velina-rose/50 focus:border-velina-rose transition-colors resize-none text-sm"
                />
              </div>
            </div>

            {/* ── Right column — Order Summary ── */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-5 sm:p-6 lg:sticky lg:top-4">
                <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 mb-4">
                  Order Summary
                </h2>

                {/* Stock errors */}
                {stockErrors.length > 0 && (
                  <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                      <AlertCircle size={14} /> Stock Issues
                    </h3>
                    <ul className="space-y-1">
                      {stockErrors.map((err, i) => (
                        <li key={i} className="text-xs text-red-700 dark:text-red-300">{err}</li>
                      ))}
                    </ul>
                    <button
                      onClick={() => router.push("/cart")}
                      className="mt-3 w-full text-xs font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 px-3 py-2 rounded-lg transition-colors"
                    >
                      Return to Cart to Fix
                    </button>
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Subtotal ({checkoutItems.length} item{checkoutItems.length !== 1 ? "s" : ""})</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">৳{checkoutTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Truck size={13} /> Shipping
                    </span>
                    {shipping === null ? (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">Select address</span>
                    ) : shipping === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE</span>
                    ) : (
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">৳{shipping.toFixed(2)}</span>
                    )}
                  </div>

                  {selectedAddress && shipping !== null && (
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
                      {isDhakaCity(selectedAddress.city) ? "Inside Dhaka rate applied" : "Outside Dhaka rate applied"}
                    </p>
                  )}

                  <hr className="border-zinc-100 dark:border-zinc-800" />

                  <div className="flex justify-between font-black text-base text-zinc-900 dark:text-zinc-100">
                    <span>Total</span>
                    <span className="text-velina-rose">৳{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment method */}
                <div className="mt-5 p-3.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
                    <CreditCard size={13} /> Payment Method
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-velina-rose flex items-center justify-center shrink-0">
                      <Check size={10} className="text-white" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Cash on Delivery (COD)
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    Pay with cash upon delivery
                  </p>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={stockErrors.length > 0 || placingOrder || !selectedAddress}
                  className="mt-5 w-full bg-velina-rose text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-velina-magenta transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-velina-rose/30 text-sm"
                >
                  {placingOrder ? (
                    "Placing Order…"
                  ) : stockErrors.length > 0 ? (
                    "Fix Stock Issues to Continue"
                  ) : (
                    <>
                      Place Order <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1">
                  <Shield size={12} /> Secure & Encrypted Checkout
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
